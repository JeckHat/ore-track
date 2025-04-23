import { useCallback, useEffect, useState } from "react";
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

import { CustomText, HeaderButton, SkeletonLoader } from "@components"
import Images from "@assets/images"
import { RootState } from "@store/types"
import { calculatePoolRewards, calculatePoolRewardsFromState, shortenAddress } from "@helpers"
import { ChevronRightIcon, DataIcon, HardHatIcon, WalletIcon } from "@assets/icons"
import { Colors } from "@styles"
import { TabMonitoringScreenProps, TabScreenOptionsFn } from "@navigations/types"
import { COAL_MINT, JUP_API_PRICE, ORE_MINT, POOL_LIST } from "@constants"
import { minerPoolActions, poolActions } from "@store/actions"
import { store } from "@store/index";

export default function TabMonitoringScreen({ navigation }: TabMonitoringScreenProps) {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const miners = useSelector((state: RootState) => state.miners.byId)
    const pools = useSelector((state: RootState) => state.pools.byId)
    const minerPools = useSelector((state: RootState) => state.minerPools.byId)
    const order = useSelector((state: RootState) => state.pools.order)
    const [isBalanceReady, setIsBalanceReady] = useState(false);
    const [total, setTotal] = useState({
        avgOre: 0,
        avgCoal: 0,
        rewardsOre: 0,
        rewardsCoal: 0,
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

    useEffect(() => {
        if (!isBalanceReady) return;
    
        let newTotal = {
            avgOre: 0,
            avgCoal: 0,
            rewardsOre: 0,
            rewardsCoal: 0
        };
      
        Object.keys(POOL_LIST)
        .filter(filterId => POOL_LIST[filterId].api.getBalance && pools[filterId].show !== false)
        .forEach(poolId => {
            const pool = pools[poolId];
            if (!pool) return;
            newTotal.avgOre += pool.avgOre ?? 0;
            newTotal.avgCoal += pool.avgCoal ?? 0;
            newTotal.rewardsOre += pool.rewardsOre ?? 0;
            newTotal.rewardsCoal += pool.rewardsCoal ?? 0;
        });
      
        setTotal({ ...newTotal, loading: false });
    }, [isBalanceReady]);

    async function loadData() {
        try {
            setIsBalanceReady(false)
            await loadPrice()
            await loadPoolsBalance()
        } catch(error) {
            console.log("error", error)
        }
    }

    async function loadPoolsBalance() {
        const poolList = Object.keys(POOL_LIST)
            .filter(filterId => POOL_LIST[filterId].api.getBalance && pools[filterId].show !== false)
            .map(poolId => {
                
                return {
                    poolId: poolId,
                    minerPoolIds: pools[poolId].minerPoolIds
                }
            })
        const minerPoolList = poolList.flatMap(pool =>
            pool.minerPoolIds.map(minerPoolId => {
                let address = miners[minerPools[minerPoolId].minerId].address
                return {
                    poolId: pool.poolId,
                    minerPoolId: minerPoolId,
                    fetch: POOL_LIST[pool.poolId].api.getBalance?.(address)
                }
            })
        )
        const results = await Promise.allSettled(minerPoolList.map(pool => {
            return pool.fetch
        }))
        const updatePromises = results.map(async (result, idx) => {
            if (result.status === 'fulfilled') {
                const { storageData, prevData } = calculatePoolRewards(
                    minerPoolList[idx].minerPoolId,
                    result.value,
                    minerPools
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

        await Promise.all(poolList.map(pool => {
            const stats = calculatePoolRewardsFromState(pool.poolId, finalState);
            dispatch(poolActions.updateBalance({
                poolId: pool.poolId,
                totalRunning: stats.runningCount,
                avgOre: stats.avgOre,
                avgCoal: stats.avgCoal,
                rewardsOre: stats.rewardsOre,
                rewardsCoal: stats.rewardsCoal,
            }))
        }));
        setIsBalanceReady(true)
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
                data={
                    (() => {
                        const ordered = order.filter(key => POOL_LIST[key] && pools[key]?.show !== false)
                        if (ordered.length % 2 !== 0) ordered.push('BLANK_SLOT')
                        return ordered
                    })()
                }
                contentContainerClassName="grow py-2 pb-[56px] mx-2"
                ListHeaderComponent={(
                    <View className="flex gap-2 mx-2">
                        <View className="bg-gray-800 p-4 rounded-lg">
                            <CustomText className="text-primary mb-1 font-PlusJakartaSansSemiBold text-sm">
                                Main Wallet
                            </CustomText>
                            <View className="flex-row items-center mb-2">
                                <WalletIcon height={20} width={20} color={Colors.primary} />
                                <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-sm">
                                    {shortenAddress(walletAddress)}
                                </CustomText>
                            </View>
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
                                        {!total.loading && <CustomText
                                            className="text-primary font-PlusJakartaSans text-sm"
                                        >
                                            {total.avgOre?.toFixed(4)} ORE
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
                                            {total.avgCoal?.toFixed(4)} COAL
                                        </CustomText>}
                                        {total.loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                                    </View>
                                </View>
                                <View>
                                    <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] self-end">
                                        $ {(total.avgOre * price.ore + total.avgCoal * price.coal).toFixed(2)}
                                    </CustomText>
                                </View>
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
                                    {total.rewardsOre?.toFixed(11)} ORE
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
                                    {total.rewardsCoal?.toFixed(11)} COAL
                                </CustomText>}
                                {total.loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-32 h-[14px]" />}
                            </View>
                            <CustomText className="text-green-400 font-PlusJakartaSans text-[11px] mb-[1px] self-end">
                                $ {(total.rewardsOre * price.ore + total.rewardsCoal * price.coal).toFixed(2)}
                            </CustomText>
                        </View>
                        <View className="flex-row w-full justify-between items-center mt-4 px-1">
                            <CustomText className="text-primary font-PlusJakartaSansSemiBold text-xl">Pools</CustomText>
                            <ChevronRightIcon
                                width={24}
                                height={24}
                                color={Colors.primary}
                                onPress={() => navigation.navigate('ManagePool')}
                            />
                        </View>
                    </View>
                )}
                keyExtractor={(data) => data}
                numColumns={2}
                columnWrapperClassName="gap-2 mx-2"
                renderItem={({ item, index }) => {
                    if(item === "BLANK_SLOT") {
                        return (
                            <View className="flex-1 rounded-xl overflow-hidden my-2" />
                        )
                    }
                    return (
                    <TouchableHighlight
                        key={`data-pool-${index}`}
                        className="flex-1 rounded-xl overflow-hidden my-2"
                        onPress={() => navigation.navigate('PoolDetail', { poolId: item })}
                    >
                        <View className="flex-1 bg-gray-800 px-3 p-2">
                            <View className="flex-row items-center">
                                {!pools[item].isCoal && 
                                    <Image
                                        className="h-8 w-8 mr-1"
                                        source={Images.OreLogo}
                                    />
                                }
                                {pools[item].isCoal && <View className="w-11 flex-row items-center mr-1">
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
                                    {pools[item].name}
                                </CustomText>
                            </View>
                            <View className="mt-2">
                                {pools[item]?.minerPoolIds.length === 1 && <View className="flex-row items-center mb-1">
                                    <WalletIcon height={12} width={12} color={Colors.primary} />
                                    <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-[12px]">
                                        {shortenAddress(miners[minerPools[pools[item].minerPoolIds[0]].minerId].address)}
                                    </CustomText>
                                </View>}
                                {pools[item]?.minerPoolIds.length > 1 && <View className="flex-row items-center mb-1">
                                    <HardHatIcon height={12} width={12} color={Colors.primary} />
                                    <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-[12px]">
                                        {pools[item]?.minerPoolIds.length} Miners
                                    </CustomText>
                                </View>}
                                {/* <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
                                >
                                    Workers: 3
                                </CustomText> */}
                                {pools[item]?.totalRunning > 0 && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[11px] mb-1"
                                >
                                    Status: <CustomText className="text-green-400 font-PlusJakartaSansSemiBold">Running</CustomText>
                                </CustomText>}
                                {pools[item]?.totalRunning <= 0 && <CustomText
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
                                                {(pools[item]?.avgOre ?? 0).toFixed(3)}
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
                                                {(pools[item]?.avgCoal ?? 0).toFixed(3)}
                                            </CustomText>
                                        </View>}
                                    </View>
                                    <CustomText
                                        className="text-green-400 font-PlusJakartaSans text-[11px]"
                                    >
                                        $ {(price.ore * (pools[POOL_LIST[item].id]?.avgOre ?? 0) + price.coal 
                                            * (pools[item]?.avgCoal ?? 0)).toFixed(2)}
                                    </CustomText>
                                </View>
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
                                        {(pools[item]?.rewardsOre ?? 0).toFixed(11)} ORE
                                    </CustomText>
                                </View>
                                {pools[item].isCoal && <View className={`flex-row items-center ${!pools[item].isCoal && "opacity-0"}`}>
                                    <Image
                                        className="h-4 w-4 mr-1 rounded-full"
                                        source={Images.CoalToken}
                                    />
                                    <CustomText
                                        className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                    >
                                        {(pools[item]?.rewardsCoal ?? 0).toFixed(4)} COAL
                                    </CustomText>
                                </View>}
                                <CustomText
                                    className="text-green-400 font-PlusJakartaSans text-[11px] mb-[1px] self-end"
                                >
                                    $ {(price.ore * (pools[item]?.rewardsOre ?? 0) + price.coal 
                                        * (pools[item]?.rewardsCoal ?? 0)).toFixed(2)}
                                </CustomText>
                            </View>
                        </View>
                    </TouchableHighlight>
                )}}
            />
        </SafeAreaView>
    )
}

export const screenOptions: TabScreenOptionsFn = ({ navigation }) => {
    return {
        headerTitle: 'Monitoring',
        tabBarIcon({ color, size }) {
            return <DataIcon width={size} height={size} color={color} />
        },
        headerRight: () => (
            <HeaderButton
                className="mx-3"
                icon={<HardHatIcon width={24} height={24} color={Colors.primary}/>}
                onPress={() => navigation.navigate('ManageMiner') }
            />
        )
    }
}
