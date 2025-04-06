import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    TouchableHighlight,
    View
} from "react-native";
import { useSelector } from "react-redux";

import { CustomText } from "@components";
import Images from "@assets/images";
import { RootState } from "@store/types";
import { shortenAddress } from "@helpers";
import { WalletIcon } from "@assets/icons";
import { Colors } from "@styles";
import { TabPoolScreenProps } from "@navigations/types";

export default function TabPoolScreen(props: TabPoolScreenProps) {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const [statePools, setStatePools] = useState({
        'pool-official': {
            oreRewards: 0,
            coalRewards: 0
        },
        'pool-gpool': {
            oreRewards: 0,
            coalRewards: 0
        },
        'pool-excalivator': {
            oreRewards: 0,
            coalRewards: 0
        },
        'pool-oreminepool': {
            oreRewards: 0,
            coalRewards: 0
        }
    })
    const [total, setTotal] = useState({
        oreRewards: 0,
        coalRewards: 0,
        loading: true
    })
    
    const pools = [
        {
            id: 'pool-official',
            name: "Official",
            isSolo: false,
            isCoal: false,
            url: 'https://official.ec1ipse.me'
        },
        {
            id: 'pool-gpool',
            name: "Gpool",
            isSolo: false,
            isCoal: false,
            url: 'https://mine.coal-pool.xyz'
        },
        {
            id: 'pool-excalivator',
            name: "Excalivator",
            isSolo: false,
            isCoal: true,
            url: 'https://mine.coal-pool.xyz',
            api: `https://pool.coal-pool.xyz/miner/rewards?pubkey=`
        },
        {
            id: 'pool-oreminepool',
            name: "OreMinePool",
            isSolo: false,
            isCoal: false,
            url: 'https://ec1ipse.me'
        },
    ]

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        const [official, exca, gpool] = await Promise.all([
            fetch(`https://official.ec1ipse.me/member/${walletAddress}`).then(res => res.json()),
            fetch(`https://pool.coal-pool.xyz/miner/rewards?pubkey=${walletAddress}`).then(res => res.json()),
            fetch(`https://api.gpool.cloud/balance?pubkey=${walletAddress}`).then(res => res.json())
        ])

        setStatePools({
            ...statePools,
            ['pool-official']: {
                oreRewards: official.total_balance / Math.pow(10, 11),
                coalRewards: 0
            },
            ['pool-excalivator']: {
                oreRewards: exca.ore,
                coalRewards: exca.coal
            },
            ['pool-gpool']: {
                oreRewards: (gpool.earned - gpool.claimed) / Math.pow(10, 11),
                coalRewards: 0
            }
        })

        setTotal({
            oreRewards: (official.total_balance / Math.pow(10, 11)) + exca.ore + (gpool.earned - gpool.claimed) / Math.pow(10, 11),
            coalRewards: exca.coal,
            loading: false
        })
        
    }
   
    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <FlatList
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadData}/>}
                data={pools}
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
                                    {total.oreRewards} ORE
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
                                    {total.coalRewards} COAL
                                </CustomText>
                            </View>
                        </View>
                        <CustomText className="text-primary ml-2 font-PlusJakartaSansSemiBold text-xl mt-4">
                            Pool
                        </CustomText>
                    </View>
                )}
                keyExtractor={(data) => data.id}
                numColumns={2}
                columnWrapperClassName="gap-2 mx-2"
                renderItem={({ item, index }) => (
                    <TouchableHighlight
                        key={`data-pool-${index}`}
                        className="flex-1 rounded-xl overflow-hidden my-2"
                        onPress={() => Alert.alert(item.name)}
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
                                    {item.name}
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
                                {(item.id === 'pool-excalivator' || item.id === 'pool-gpool') && <CustomText
                                    className="text-primary font-PlusJakartaSans text-[12px] mb-1"
                                >
                                    Status: <CustomText className="text-green-400 font-PlusJakartaSansSemiBold">Running</CustomText>
                                </CustomText>}
                                {item.id !== 'pool-excalivator' && item.id !== 'pool-gpool' && <CustomText
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
                                        {(statePools[item.id as keyof typeof statePools].oreRewards).toFixed(4)} ORE
                                    </CustomText>
                                </View>
                                <View className={`flex-row items-center ${!item.isCoal && "opacity-0"}`}>
                                    <Image
                                        className="h-4 w-4 mr-1 rounded-full"
                                        source={Images.CoalToken}
                                    />
                                    <CustomText
                                        className="text-primary font-PlusJakartaSans text-[11px] mb-[1px]"
                                    >
                                        {(statePools[item.id as keyof typeof statePools].coalRewards).toFixed(4)} COAL
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