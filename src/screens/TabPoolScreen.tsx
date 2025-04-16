import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    TouchableHighlight,
    View
} from "react-native"
import { useDispatch, useSelector } from "react-redux"
import dayjs from 'dayjs'

import { CustomText, SkeletonLoader } from "@components"
import Images from "@assets/images"
import { RootState } from "@store/types"
import { shortenAddress } from "@helpers"
import { WalletIcon } from "@assets/icons"
import { Colors } from "@styles"
import { TabPoolScreenProps } from "@navigations/types"
import { COAL_MINT, JUP_API_PRICE, ORE_MINT, POOL_LIST } from "@constants"
import { poolActions } from "@store/actions"

export default function TabPoolScreen(props: TabPoolScreenProps) {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const pools = useSelector((state: RootState) => state.pool.pools)
    const [total, setTotal] = useState({
        balanceOre: 0,
        balanceCoal: 0,
        loading: true
    })
    const [price, setPrice] = useState({
        ore: 0.0,
        coal: 0.0
    })
    const dispatch = useDispatch()

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    async function loadData() {
        try {
            await loadPrice()
            await loadPoolsBalance()

            let newTotal = {
                ...total,
                balanceOre: 0,
                balanceCoal: 0
            }
            Object.keys(POOL_LIST).map(poolId => {
                newTotal = {
                    ...newTotal,
                    balanceOre: newTotal.balanceOre + (pools[poolId]?.balanceOre ?? 0),
                    balanceCoal: newTotal.balanceCoal + (pools[poolId]?.balanceCoal ?? 0)
                }
            })
            setTotal({
                ...newTotal,
                loading: false
            })
        } catch(error) {
            console.log("error", error)
        }
    }

    async function loadPoolsBalance() {
        const poolList = Object.keys(POOL_LIST)
            .filter(filterId => POOL_LIST[filterId].api.getBalance)
            .map(poolId => {
                let address = pools[poolId]?.walletAddress ?? walletAddress
                return {
                    id: poolId,
                    fetch: POOL_LIST[poolId].api.getBalance?.(address)
                }
            })
        const results = await Promise.allSettled(poolList.map(pool => {
            return pool.fetch
        }))
        results.forEach(async (result, idx) => {
            if (result.status === 'fulfilled') {
                let balanceNow = result.value
                let dateNow = dayjs()
                let storageData = JSON.parse(JSON.stringify(pools[poolList[idx].id]))

                if ((balanceNow?.balanceOre ?? 0) > storageData.balanceOre) {
                    storageData = {
                        ...storageData,
                        ...balanceNow,
                        runningOre: true,
                        runningCoal: true,
                        lastUpdateAt: dateNow.toISOString(),
                        startMiningAt: dateNow.toISOString(),
                        avgRewards: {
                            ...storageData.avgRewards,
                            startOre: balanceNow?.balanceOre ?? 0,
                            startCoal: balanceNow?.balanceCoal ?? 0
                        },
                    }
                } else {
                    if (storageData.lastClaimAt >= storageData.lastUpdateAt) {
                        storageData = {
                            ...storageData,
                            ...balanceNow,
                            lastUpdateAt: dateNow.toISOString(),
                            startMiningAt: dateNow.toISOString(),
                            avgRewards: {
                                ...storageData.avgRewards,
                                ore: 0,
                                coal: 0,
                                startOre: balanceNow?.balanceOre ?? 0,
                                startCoal: balanceNow?.balanceCoal ?? 0
                            },
                        }
                    } else {
                        if (dateNow.diff(dayjs(storageData.lastUpdateAt), "minute") >= 2) {
                            storageData = {
                                ...storageData,
                                ...balanceNow,
                                runningCoal: false,
                                runningOre: false,
                                lastUpdateAt: dateNow.toISOString(),
                                avgRewards: {
                                    ...storageData.avgRewards,
                                    ore: 0,
                                    coal: 0,
                                    startOre: balanceNow?.balanceOre ?? 0,
                                    startCoal: balanceNow?.balanceCoal ?? 0
                                },
                            }
                        }
                    }
                }

                dispatch(poolActions.updatePool({
                    id: poolList[idx].id,
                    pool: storageData
                }))
            }
        })
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
                data={Object.keys(POOL_LIST)}
                contentContainerClassName="grow py-2 pb-[56px] mx-2"
                ListHeaderComponent={(
                    <View className="flex gap-2 mx-2">
                        <View className="bg-gray-800 p-4 rounded-lg">
                            <View className="flex-row items-center mb-2">
                                <WalletIcon height={20} width={20} color={Colors.primary} />
                                <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-sm">
                                    {shortenAddress(walletAddress)}
                                </CustomText>
                            </View>
                            <View className="flex-row items-center">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm mb-1">
                                    Total Rewards:
                                </CustomText>
                            </View>
                            <View className="flex-row items-center">
                                <Image
                                    className="h-6 w-6 mr-1 rounded-full"
                                    source={Images.OreToken}
                                />
                                {!total.loading && <CustomText
                                    className="text-primary font-PlusJakartaSans text-sm"
                                >
                                    {total.balanceOre?.toFixed(11)} ORE
                                </CustomText>}
                                {total.loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                            </View>
                            <View className="flex-row items-center">
                                <Image
                                    className="h-6 w-6 mr-1 rounded-full"
                                    source={Images.CoalToken}
                                />
                                {!total.loading && <CustomText
                                    className="text-primary font-PlusJakartaSans text-sm"
                                >
                                    {total.balanceCoal?.toFixed(11)} COAL
                                </CustomText>}
                                {total.loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                            </View>
                            <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] mb-[1px] self-end">
                                $ {(total.balanceOre * price.ore + total.balanceCoal * price.coal).toFixed(2)}
                            </CustomText>
                        </View>
                        <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-xl mt-4">
                            Pools
                        </CustomText>
                    </View>
                )}
                keyExtractor={(data) => data}
                numColumns={2}
                columnWrapperClassName="gap-2 mx-2"
                renderItem={({ item, index }) => (
                    <TouchableHighlight
                        key={`data-pool-${index}`}
                        className="flex-1 rounded-xl overflow-hidden my-2"
                        onPress={() => Alert.alert(POOL_LIST[item].name)}
                    >
                        <View className="flex-1 bg-gray-800 px-3 p-2">
                            <View className="flex-row items-center">
                                {!POOL_LIST[item].isCoal && 
                                    <Image
                                        className="h-8 w-8 mr-1"
                                        source={Images.OreLogo}
                                    />
                                }
                                {POOL_LIST[item].isCoal && <View className="w-11 flex-row items-center mr-1">
                                    <View className="bg-black absolute right-0 h-8 w-8 rounded-full justify-center items-center">
                                        <Image
                                            className="h-6 w-6"
                                            source={Images.CoalLogo}
                                        />
                                    </View>
                                    <Image
                                        className="h-8 w-8"
                                        source={Images.OreLogo}
                                    />
                                </View>}
                                <CustomText
                                    className="text-primary text-[13px] font-PlusJakartaSansSemiBold text-md"
                                >
                                    {POOL_LIST[item].name}
                                </CustomText>
                            </View>
                            <View className="mt-2">
                                <View className="flex-row items-center mb-1">
                                    <WalletIcon height={12} width={12} color={Colors.primary} />
                                    <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-[12px]">
                                        {shortenAddress(walletAddress)}
                                    </CustomText>
                                </View>
                                {/* <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
                                >
                                    Workers: 3
                                </CustomText> */}
                                {pools[POOL_LIST[item].id]?.runningOre && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[11px] mb-1"
                                >
                                    Status: <CustomText className="text-green-400 font-PlusJakartaSansSemiBold">Running</CustomText>
                                </CustomText>}
                                {!pools[POOL_LIST[item].id]?.runningOre && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[11px] mb-1"
                                >
                                    Status: <CustomText className="text-red-400 font-PlusJakartaSansSemiBold">Stopped</CustomText>
                                </CustomText>}
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px]"
                                >
                                    Daily Average:
                                </CustomText>
                                <View className="flex-row items-center justify-between pb-1 border-b border-solid border-gray-500">
                                    <View>
                                        <View className="flex-row items-center">
                                            <Image
                                                className="h-4 w-4 mr-1"
                                                source={Images.OreToken}
                                            />
                                            <CustomText
                                                className="text-primary font-PlusJakartaSans text-[10px]"
                                            >
                                                {(pools[POOL_LIST[item].id]?.avgRewards?.ore ?? 0).toFixed(3)}
                                            </CustomText>
                                        </View>
                                        {POOL_LIST[item].isCoal && <View className={`flex-row items-center`}>
                                            <Image
                                                className="h-4 w-4 mr-1 rounded-full"
                                                source={Images.CoalToken}
                                            />
                                            <CustomText
                                                className="text-primary font-PlusJakartaSans text-[11px]"
                                            >
                                                {(pools[POOL_LIST[item].id]?.avgRewards?.coal ?? 0).toFixed(3)}
                                            </CustomText>
                                        </View>}
                                    </View>
                                    <CustomText
                                        className="text-green-400 font-PlusJakartaSans text-[11px]"
                                    >
                                        $ {(price.ore * (pools[POOL_LIST[item].id]?.avgRewards?.ore ?? 0) + price.coal 
                                            * (pools[POOL_LIST[item]?.id]?.avgRewards?.coal ?? 0)).toFixed(2)}
                                    </CustomText>
                                </View>
                                {/* <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px]"
                                >
                                    Average Daily:
                                </CustomText>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <Image
                                            className="h-4 w-4 mr-1"
                                            source={Images.OreToken}
                                        />
                                        <CustomText
                                            className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                        >
                                            {(pools[POOL_LIST[item].id]?.avgRewards?.ore ?? 0).toFixed(3)}
                                        </CustomText>
                                    </View>
                                    <View className={`flex-row items-center justify-end flex-1 ${!POOL_LIST[item].isCoal && "opacity-0"}`}>
                                        <Image
                                            className="h-4 w-4 mr-1 rounded-full"
                                            source={Images.CoalToken}
                                        />
                                        <CustomText
                                            className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                        >
                                            {(pools[POOL_LIST[item].id]?.avgRewards?.coal ?? 0).toFixed(3)}
                                        </CustomText>
                                    </View>
                                </View> */}
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-[1px]"
                                >
                                    Your Rewards:
                                </CustomText>
                                <View className="flex-row items-center">
                                    <Image
                                        className="h-4 w-4 mr-1"
                                        source={Images.OreToken}
                                    />
                                    <CustomText
                                        className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                    >
                                        {(pools[POOL_LIST[item].id]?.balanceOre ?? 0).toFixed(4)} ORE
                                    </CustomText>
                                </View>
                                {POOL_LIST[item].isCoal && <View className={`flex-row items-center ${!POOL_LIST[item].isCoal && "opacity-0"}`}>
                                    <Image
                                        className="h-4 w-4 mr-1 rounded-full"
                                        source={Images.CoalToken}
                                    />
                                    <CustomText
                                        className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                    >
                                        {(pools[POOL_LIST[item].id]?.balanceCoal ?? 0).toFixed(4)} COAL
                                    </CustomText>
                                </View>}
                                <CustomText
                                    className="text-green-400 font-PlusJakartaSans text-[11px] mb-[1px] self-end"
                                >
                                    $ {(price.ore * (pools[POOL_LIST[item].id]?.balanceOre ?? 0) + price.coal 
                                        * (pools[POOL_LIST[item]?.id]?.balanceCoal ?? 0)).toFixed(2)}
                                </CustomText>
                            </View>
                        </View>
                    </TouchableHighlight>
                )}
            />
        </SafeAreaView>
    )
}