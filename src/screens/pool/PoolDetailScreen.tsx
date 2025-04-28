import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    View
} from "react-native"
import { useDispatch, useSelector } from "react-redux"
import dayjs from 'dayjs'

import { Button, CustomText, HeaderButton, ModalSelectMiner, OptionMenu, SkeletonLoader } from "@components"
import Images from "@assets/images"
import { RootState } from "@store/types"
import { calculatePoolRewardsFromState, shortenAddress } from "@helpers"
import { ChevronLeftIcon, ChevronRightIcon, HardHatIcon } from "@assets/icons"
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
                        <View className="flex-row items-center self-end">
                            <CustomText
                                className="text-primary font-PlusJakartaSans text-md mb-1"
                                // onPress={() => navigation.navigate('Statistic')}
                            >
                                View Statistics
                            </CustomText>
                            <ChevronRightIcon
                                width={23}
                                height={23}
                                color={Colors.primary}
                            />
                        </View>
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
                        <View className="mx-2 mb-2 p-4 rounded-lg bg-gray-800">
                            <View className="flex-row">
                                <HardHatIcon
                                    width={32} height={32} color={Colors.primary}
                                />
                                <View className="flex-1 mx-2">
                                    <CustomText className="text-primary font-PlusJakartaSansSemiBold leading-none mb-1">
                                        {miners[minerPools[item].minerId].name}
                                    </CustomText>
                                    <CustomText className="text-primary font-PlusJakartaSans mb-2">
                                        {shortenAddress(miners[minerPools[item].minerId].address)}
                                    </CustomText>
                                </View>
                                <CustomText
                                    className={`font-PlusJakartaSansBold text-sm mx-2 ${minerPools[item].running? "text-green-400" : "text-red-400"}`}
                                >
                                    {minerPools[item].running? "Running" : "Stopped"}
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
                                                poolId: pool.id,
                                                minerId: minerPools[item].minerId
                                            }))
                                        }
                                    }]}
                                />
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
                                            {minerPools[item].avgRewards?.ore.toFixed(11)} ORE
                                        </CustomText>
                                    </View>
                                    {pool.isCoal && <View className="flex-row items-center  mt-[1px]">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.CoalToken}
                                        />
                                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                                            {minerPools[item].avgRewards?.coal.toFixed(11)} COAL
                                        </CustomText>
                                    </View>}
                                </View>
                                <View className="items-end flex-1">
                                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] text-end">
                                        $ {(minerPools[item].avgRewards?.ore * price.ore + minerPools[item].avgRewards?.coal * price.coal).toFixed(2)}
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
                                            {minerPools[item].rewardsOre.toFixed(11)} ORE
                                        </CustomText>
                                    </View>
                                    {pool.isCoal && <View className="flex-row items-center  mt-[1px]">
                                        <Image
                                            className="h-6 w-6 mr-1 rounded-full"
                                            source={Images.CoalToken}
                                        />
                                        <CustomText className="text-primary font-PlusJakartaSans text-[11px]">
                                            {minerPools[item].rewardsCoal.toFixed(11)} COAL
                                        </CustomText>
                                    </View>}
                                </View>
                                <View className="items-end flex-1">
                                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] text-end">
                                        $ {(minerPools[item].rewardsOre * price.ore + minerPools[item].rewardsCoal * price.coal).toFixed(2)}
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    )
                }}
            />
        </SafeAreaView>
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
