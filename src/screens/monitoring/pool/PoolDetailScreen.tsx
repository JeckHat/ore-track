import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    TouchableHighlight,
    View
} from "react-native"
import { useDispatch, useSelector } from "react-redux"
import dayjs from 'dayjs'

import { Button, CustomText, HeaderButton, ModalSelectMiner, OptionMenu, SkeletonLoader } from "@components"
import Images from "@assets/images"
import { MinerType, RootState } from "@store/types"
import { calculatePoolRewardsFromState, shortenAddress } from "@helpers"
import { ChevronLeftIcon, ChevronRightIcon, HardHatIcon, MachineIcon } from "@assets/icons"
import { Colors, Fonts } from "@styles"
import { createStackOptions, PoolDetailNavigationProps } from "@navigations/types"
import { COAL_MINT, JUP_API_PRICE, ORE_MINT, POOL_LIST } from "@constants"
import { minerPoolActions, poolActions, uiActions } from "@store/actions"
import { store } from "@store/index"
import { joinMinerToPool, removeMinerFromPool } from "@store/thunks"
import { useBottomModal } from "@hooks"

const useAppDispatch = () => useDispatch<typeof store.dispatch>()

export default function PoolDetailScreen({ navigation, route }: PoolDetailNavigationProps) {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const pool = useSelector((state: RootState) => state.pools.byId[route.params?.poolId ?? ""])
    const miners = useSelector((state: RootState) => state.miners.byId)
    const minerPools = useSelector((state: RootState) => state.minerPools.byId)
    const [loading, setLoading] = useState(true)
    const [price, setPrice] = useState({
        ore: 0.0,
        coal: 0.0
    })
    const isFirstRun = useRef(true)
    const dispatch = useAppDispatch()

    const { showModal, hideModal } = useBottomModal()

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        dispatch(uiActions.showLoading(true))
        loadData().then(() => {
            dispatch(uiActions.showLoading(false))
        })
    }, [pool.minerPoolIds.length])

    async function loadData() {
        try {
            await loadPrice()
            await loadPoolsBalance()
        } catch(error) {
            console.log("error", error)
        }
    }

    async function loadPoolsBalance() {
        const minerPoolList = pool.minerPoolIds.map(minerPoolId => {
            let address = miners[minerPools[minerPoolId].minerId].address
            return {
                poolId: pool.id,
                minerPoolId: minerPoolId,
                fetch: POOL_LIST[pool.id].api.getBalance?.(address)
            }
        })
        const results = await Promise.allSettled(minerPoolList.map(pool => {
            return pool.fetch
        }))
        const updatePromises = results.map(async (result, idx) => {
            if (result.status === 'fulfilled') {
                const { storageData, prevData } = calculatePoolRewards(
                    minerPoolList[idx].minerPoolId,
                    result.value
                )
                
                dispatch(minerPoolActions.updateBalanceMiner({
                    minerPoolId: minerPoolList[idx].minerPoolId,
                    minerPool: {
                        ...prevData,
                        ...storageData
                    }
                }))
            }
        })
        await Promise.all(updatePromises)
        const finalState = store.getState();

        const stats = calculatePoolRewardsFromState(pool.id, finalState);
        dispatch(poolActions.updateBalance({
            poolId: pool.id,
            totalRunning: stats.runningCount,
            avgOre: stats.avgOre,
            avgCoal: stats.avgCoal,
            rewardsOre: stats.rewardsOre,
            rewardsCoal: stats.rewardsCoal,
        }))
        setLoading(false)
    }

    function calculatePoolRewards(minerPoolId: string, result: {
        rewardsOre: number;
        rewardsCoal: number;
        lastClaimAt?: string | null;
        earnedOre?: number | null;
    } | undefined) {
        let balanceNow = result
        let dateNow = dayjs()
        let prevData = minerPools[minerPoolId] ?? {}
        let storageData = { ...prevData }
        let lastClaimAt = balanceNow?.lastClaimAt ?? storageData.lastClaimAt
        let earnedOre = balanceNow?.earnedOre ?? 0

        if ((balanceNow?.rewardsOre ?? 0) > storageData.rewardsOre) {
            storageData = {
                ...storageData,
                ...balanceNow,
                running: true,
                lastUpdateAt: dateNow.toISOString(),
                startMiningAt: dateNow.toISOString(),
                avgRewards: {
                    ...storageData.avgRewards,
                    initOre: balanceNow?.rewardsOre ?? 0,
                    initCoal: balanceNow?.rewardsCoal ?? 0
                },
                earnedOre: earnedOre,
                lastClaimAt: lastClaimAt
            }
        } else {
            if (lastClaimAt >= storageData.lastUpdateAt || earnedOre > (storageData.earnedOre ?? 0)) {
                storageData = {
                    ...storageData,
                    ...balanceNow,
                    lastUpdateAt: dateNow.toISOString(),
                    startMiningAt: dateNow.toISOString(),
                    avgRewards: {
                        ...storageData.avgRewards,
                        ore: 0,
                        coal: 0,
                        initOre: balanceNow?.rewardsOre ?? 0,
                        initCoal: balanceNow?.rewardsCoal ?? 0
                    },
                    earnedOre: earnedOre,
                    lastClaimAt: lastClaimAt
                }
            } else {
                if (dateNow.diff(dayjs(storageData.lastUpdateAt), "minute") >= 2) {
                    storageData = {
                        ...storageData,
                        ...balanceNow,
                        running: false,
                        lastUpdateAt: dateNow.toISOString(),
                        avgRewards: {
                            ...storageData.avgRewards,
                            ore: 0,
                            coal: 0,
                            initOre: balanceNow?.rewardsOre ?? 0,
                            initCoal: balanceNow?.rewardsCoal ?? 0
                        },
                        earnedOre: earnedOre,
                        lastClaimAt: lastClaimAt
                    }
                }
            }
        }
        return { storageData, prevData }
    }

    async function loadPrice() {
        try {
            const [priceOre, priceCoal] = await Promise.all([
                fetch(`${JUP_API_PRICE}${ORE_MINT}`, {
                    method: 'GET'
                }).then(res => res.json()),
                fetch(`${JUP_API_PRICE}${COAL_MINT}`, {
                    method: 'GET'
                }).then(res => res.json())
            ])
            setPrice({
                ...price,
                ore: parseFloat(priceOre.data[ORE_MINT].price),
                coal: parseFloat(priceCoal.data[COAL_MINT].price),
            })
        } catch(error) {
            console.log("error", error)
        }
    }
   
    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <FlatList
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadData}/>}
                data={pool.minerPoolIds}
                ListHeaderComponent={(
                    <View className="flex gap-2 mx-2">
                        <View className="bg-gray-800 p-4 rounded-lg">
                            <View className="flex-row items-center">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm mb-1">
                                    Daily Average:
                                </CustomText>
                            </View>
                            <View className="flex-row items-center justify-between pb-1 mb-1 border-b border-solid border-gray-500">
                                <View>
                                    <View className="flex-row items-center">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.OreToken}
                                        />
                                        {!loading && <CustomText
                                            className="text-primary font-PlusJakartaSans text-sm"
                                        >
                                            {pool.avgOre?.toFixed(9)} ORE
                                        </CustomText>}
                                        {loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                                    </View>
                                    {pool.isCoal && <View className="flex-row items-center">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.CoalToken}
                                        />
                                        {!loading && <CustomText
                                            className="text-primary font-PlusJakartaSans text-sm"
                                        >
                                            {pool.avgCoal?.toFixed(9)} COAL
                                        </CustomText>}
                                        {loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                                    </View>}
                                </View>
                                <View>
                                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] self-end">
                                        $ {(pool.avgOre * price.ore + pool.avgCoal * price.coal).toFixed(2)}
                                    </CustomText>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm mb-1">
                                    Total Rewards:
                                </CustomText>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <View className="flex-row items-center">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.OreToken}
                                        />
                                        {!loading && <CustomText
                                            className="text-primary font-PlusJakartaSans text-sm"
                                        >
                                            {pool.rewardsOre.toFixed(11)} ORE
                                        </CustomText>}
                                        {loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                                    </View>
                                    {pool.isCoal && <View className="flex-row items-center">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.CoalToken}
                                        />
                                        {!loading && <CustomText
                                            className="text-primary font-PlusJakartaSans text-sm"
                                        >
                                            {pool.rewardsCoal.toFixed(11)} COAL
                                        </CustomText>}
                                        {loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                                    </View>}
                                </View>
                                <View>
                                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] self-end">
                                        $ {(pool.rewardsOre * price.ore + pool.rewardsCoal * price.coal).toFixed(2)}
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                        <TouchableHighlight
                            className="self-end pl-2"
                            // onPress={() => navigation.navigate("PoolStatistic")}
                        >
                            <View className="flex-row items-center">
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-md mb-1"
                                    // onPress={() => navigation.navigate('Statistic')}
                                >
                                    View Pool Statistics
                                </CustomText>
                                <ChevronRightIcon
                                    width={23}
                                    height={23}
                                    color={Colors.primary}
                                />
                            </View>
                        </TouchableHighlight>
                        <View className="flex-row w-full justify-between items-center mt-4 px-1 mb-2">
                            <CustomText className="text-primary font-PlusJakartaSansSemiBold text-lg">
                                {`Active ( ${pool.totalRunning} / ${pool.minerPoolIds.length} )`}
                            </CustomText>
                            <Button
                                containerClassName="rounded-none mr-2 self-end"
                                className="py-2 px-6 rounded-full"
                                textClassName="text-sm mb-[1px]"
                                title="Join miner to pool"
                                onPress={() => {
                                    showModal(
                                        <ModalSelectMiner
                                            poolId={pool.id}
                                            miners={
                                                Object.keys(miners)
                                                .filter(key => !pool.minerPoolIds.includes(`${pool.id}-${miners[key].id}`))
                                                .map(key => miners[key])
                                            }
                                            onSelect={async (minerId) => {
                                                dispatch(uiActions.showLoading(true))
                                                await dispatch(joinMinerToPool({ poolId: pool.id, minerId: minerId }))
                                                hideModal()
                                                dispatch(uiActions.showLoading(false))
                                            }}
                                        />
                                    )
                                }}
                            />
                        </View>
                    </View>
                )}
                renderItem={({ item }) => {
                    return (
                        <MinerPoolItem
                            minerPoolId={item}
                            isCoal={pool.isCoal}
                            shouldUpdate={!loading}
                            poolId={pool.id}
                            miner={miners[minerPools[item].minerId]}
                            running={minerPools[item].running}
                            avg={{ ore: minerPools[item].avgRewards?.ore, coal: minerPools[item].avgRewards?.coal }}
                            rewards={{ ore: minerPools[item].rewardsOre, coal: minerPools[item].rewardsCoal }}
                            price={price}
                        />
                    )
                }}
            />
        </SafeAreaView>
    )
}

interface minerPoolItemProps {
    minerPoolId: string
    isCoal: boolean
    shouldUpdate: boolean
    poolId: string
    running: boolean
    miner: MinerType
    avg: {
        ore: number
        coal: number
    }
    rewards: {
        ore: number
        coal: number
    }
    price: {
        ore: number
        coal: number
    }
}

function MinerPoolItem(props: minerPoolItemProps) {
    const { minerPoolId, isCoal, shouldUpdate, poolId, running, miner, avg, rewards, price } = props
    const [loading, setLoading] = useState(true)
    const machine = useSelector((state: RootState) => state.minerPools.byId[minerPoolId].machine)
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (shouldUpdate && running) {
            getTotalMachines() 
        } else {
            setLoading(false)
        }
    }, [shouldUpdate, running, rewards.ore])

    async function getTotalMachines() {
        setLoading(true)
        if (POOL_LIST[poolId].api?.getMachines) {
            const worker = await POOL_LIST[poolId]?.api?.getMachines?.(miner.address)
            dispatch(minerPoolActions.updateMachine({
                machine: worker.activeCount,
                minerPoolId: minerPoolId
            }))
        } else {
            dispatch(minerPoolActions.updateMachine({
                machine: 1,
                minerPoolId: minerPoolId
            }))
        }
        setLoading(false)
    }

    return (
        <View className="mx-2 mb-2 p-4 rounded-lg bg-gray-800">
            <View className="flex-row">
                <HardHatIcon
                    width={32} height={32} color={Colors.primary}
                />
                <View className="flex-1 mx-2">
                    <CustomText className="text-primary font-PlusJakartaSansSemiBold leading-none mb-1">
                        {miner.name}
                    </CustomText>
                    <CustomText className="text-primary font-PlusJakartaSans mb-2">
                        {shortenAddress(miner.address)}
                    </CustomText>
                </View>
                <CustomText
                    className={`font-PlusJakartaSansBold text-sm mx-2 ${running? "text-green-400" : "text-red-400"}`}
                >
                    {running? "Running" : "Stopped"}
                </CustomText>
                <OptionMenu
                    iconSize={20}
                    menu={[{
                        text: 'Statistic',
                        onPress: () => {
                            // navigation.navigate('Receive', {
                            //     walletAddress: miners[item].address
                            // })
                        }
                    },
                    {
                        text: 'Claim',
                        onPress: () => {
                            // navigation.navigate('Receive', {
                            //     walletAddress: miners[item].address
                            // })
                        }
                    },
                    {
                        text: 'Remove',
                        onPress: () => {
                            dispatch(removeMinerFromPool({
                                poolId: poolId,
                                minerId: miner.id
                            }))
                        }
                    }]}
                />
            </View>
            <View className="flex-row items-center my-2">
                <MachineIcon height={22} width={22} color={Colors.gold} />
                {loading && <SkeletonLoader
                    className=" bg-gray-700 rounded-lg w-16 h-4 ml-2"
                />}
                {!loading && <CustomText
                    className="text-gold mx-1 font-LatoBold text-md flex-1"
                    numberOfLines={1}
                >
                    {`${machine} Machines`}
                </CustomText>}
            </View>
            <CustomText className="text-primary font-PlusJakartaSans text-sm mb-[1px]">Daily Average: </CustomText>
            <View className="flex-row justify-between items-center">
                <View>
                    <View className="flex-row items-center">
                        <Image
                            className="h-6 w-6 mr-1 rounded-full"
                            source={Images.OreToken}
                        />
                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                            {avg.ore.toFixed(11)} ORE
                        </CustomText>
                    </View>
                    {isCoal && <View className="flex-row items-center  mt-[1px]">
                        <Image
                            className="h-6 w-6 mr-1 rounded-full"
                            source={Images.CoalToken}
                        />
                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                            {avg.coal.toFixed(11)} COAL
                        </CustomText>
                    </View>}
                </View>
                <View className="items-end flex-1">
                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] text-end">
                        $ {(avg.ore * price.ore + avg.coal * price.coal).toFixed(2)}
                    </CustomText>
                </View>
            </View>
            <CustomText className="text-primary font-PlusJakartaSans text-sm my-[1px]">Rewards: </CustomText>
            <View className="flex-row justify-between items-center">
                <View>
                    <View className="flex-row items-center">
                        <Image
                            className="h-6 w-6 mr-1 rounded-full"
                            source={Images.OreToken}
                        />
                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                            {rewards.ore.toFixed(11)} ORE
                        </CustomText>
                    </View>
                    {isCoal && <View className="flex-row items-center  mt-[1px]">
                        <Image
                            className="h-6 w-6 mr-1 rounded-full"
                            source={Images.CoalToken}
                        />
                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                            {rewards.coal.toFixed(11)} COAL
                        </CustomText>
                    </View>}
                </View>
                <View className="items-end flex-1">
                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] text-end">
                        $ {(rewards.ore * price.ore + rewards.coal * price.coal).toFixed(2)}
                    </CustomText>
                </View>
            </View>
        </View>
    )
}


export const screenOptions = createStackOptions<'PoolDetail'>(({ navigation, route }) => {
    const pool = store.getState().pools?.byId[route?.params?.poolId ?? ""]
    return {
        headerTitle: `Pool ${pool?.name}`,
        headerTintColor: Colors.primary,
        headerTitleStyle: {
            fontFamily: Fonts.PlusJakartaSansSemiBold,
            fontSize: 18,
        },
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: Colors.baseBg },
        headerLeft: () => (
            <HeaderButton
                className='mr-6 mb-1'
                icon={<ChevronLeftIcon width={24} height={24} color={Colors.primary}/>}
                onPress={() => navigation.goBack() }
            />
        )
    }
})
