import { useEffect, useState } from "react";
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

import { CustomText } from "@components"
import Images from "@assets/images"
import { RootState } from "@store/types"
import { shortenAddress } from "@helpers"
import { WalletIcon } from "@assets/icons"
import { Colors } from "@styles"
import { TabPoolScreenProps } from "@navigations/types"
import { POOL_LIST } from "@constants"
import { poolActions } from "@store/actions"

export default function TabPoolScreen(props: TabPoolScreenProps) {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const pools = useSelector((state: RootState) => state.pool.pools)
    const [total, setTotal] = useState({
        balanceOre: 0,
        balanceCoal: 0,
        loading: true
    })
    const dispatch = useDispatch()

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        let newTotal = {
            ...total,
            balanceOre: 0,
            balanceCoal: 0
        }
        Object.keys(POOL_LIST).map(poolId => {
            newTotal = {
                ...newTotal,
                balanceOre: newTotal.balanceOre + pools[poolId].balanceOre,
                balanceCoal: newTotal.balanceCoal + pools[poolId].balanceCoal
            }
        })
        setTotal(newTotal)
    }, [pools])

    async function loadData() {
        const poolList = Object.keys(POOL_LIST)
            .filter(filterId => POOL_LIST[filterId].api.base && POOL_LIST[filterId].api.balance)
            .map(poolId => {
                let address = pools[poolId]?.walletAddress ?? walletAddress
                return {
                    id: poolId,
                    fetch: fetch(`${POOL_LIST[poolId].api.base}${POOL_LIST[poolId].api.balance}${address}`)
                }
            })
        const results = await Promise.allSettled(poolList.map(pool => {
            return pool.fetch
        }))
        results.forEach(async (result, idx) => {
            if (result.status === 'fulfilled') {
                const json = await result.value.json()
                let balanceNow = POOL_LIST[poolList[idx].id].api?.responseBalance?.(json)
                let dateNow = dayjs()
                let storageData = pools[poolList[idx].id]

                if ((balanceNow?.balanceOre ?? 0) > storageData.balanceOre) {
                    storageData = {
                        ...storageData,
                        ...balanceNow,
                        runningOre: true,
                        runningCoal: true,
                        lastUpdateAt: dateNow.toISOString(),
                    }
                } else {
                    if (storageData.lastClaimAt >= storageData.lastUpdateAt) {
                        storageData = {
                            ...storageData,
                            ...balanceNow,
                            lastUpdateAt: dateNow.toISOString(),
                        }
                    } else {
                        if (dateNow.diff(dayjs(storageData.lastUpdateAt), "minutes") >= 2) {
                            storageData = {
                                ...storageData,
                                ...balanceNow,
                                runningCoal: false,
                                runningOre: false,
                                lastUpdateAt: dateNow.toISOString(),
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
        setTotal({
            ...total,
            loading: false
        })
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
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-sm"
                                >
                                    {total.balanceOre?.toFixed(11)} ORE
                                </CustomText>
                            </View>
                            <View className="flex-row items-center">
                                <Image
                                    className="h-6 w-6 mr-1 rounded-full"
                                    source={Images.CoalToken}
                                />
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-sm"
                                >
                                    {total.balanceCoal?.toFixed(11)} COAL
                                </CustomText>
                            </View>
                        </View>
                        <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-xl mt-4">
                            Pool
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
                        <View className="flex-1 bg-gray-800 p-3">
                            <View className="flex-row items-center">
                                <Image
                                    className="h-8 w-8 mr-1"
                                    source={Images.OreLogo}
                                />
                                <CustomText
                                    className="text-primary font-PlusJakartaSansSemiBold text-md"
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
                                {pools[POOL_LIST[item].id].runningOre && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
                                >
                                    Status: <CustomText className="text-green-400 font-PlusJakartaSansSemiBold">Running</CustomText>
                                </CustomText>}
                                {!pools[POOL_LIST[item].id].runningOre && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
                                >
                                    Status: <CustomText className="text-red-400 font-PlusJakartaSansSemiBold">Stopped</CustomText>
                                </CustomText>}
                                <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
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
                                        {(pools[POOL_LIST[item].id].balanceOre ?? 0).toFixed(4)} ORE
                                    </CustomText>
                                </View>
                                <View className={`flex-row items-center ${!POOL_LIST[item].isCoal && "opacity-0"}`}>
                                    <Image
                                        className="h-4 w-4 mr-1 rounded-full"
                                        source={Images.CoalToken}
                                    />
                                    <CustomText
                                        className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                    >
                                        {(pools[POOL_LIST[item].id].balanceCoal ?? 0).toFixed(4)} COAL
                                    </CustomText>
                                </View>
                            </View>
                        </View>
                    </TouchableHighlight>
                )}
            />
        </SafeAreaView>
    )
}