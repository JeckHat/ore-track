import { useCallback, useRef, useState } from "react";
import { Image, ImageSourcePropType, RefreshControl, SafeAreaView, ScrollView, TouchableWithoutFeedback, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import { ButtonIcon, CustomText, SkeletonLoader } from "@components";
import Images from "@assets/images";
import { ChevronRightIcon, ReceiveIcon, SendIcon, StakeIcon, SwapIcon } from "@assets/icons";
import { Colors } from "@styles";
import { delimiterFormat } from "@helpers";
import { JUP_API_PRICE, TokenInfo, TOKENLIST } from "@constants";
import { RootState } from "@store/types";
import { getBalance } from "@services/solana";
import { TabWalletScreenProps } from "@navigations/types";
import { isUseKeypair } from "@providers";

interface TokenBalance extends TokenInfo {
    mint: string,
    balance: number,
    price: number,
    loading: boolean,
}

export default function TabWalletScreen({ navigation }: TabWalletScreenProps) {
    const [total, setTotal] = useState({
        balance: 0,
        loading: true
    })
    const [tokenData, setTokenData] = useState<Record<string, TokenBalance | null>>(
        Object.entries(TOKENLIST).reduce((acc, [key, value]) => {
            acc[key] = {
                ...value,
                balance: 0,
                price: 0.0,
                mint: key,
                loading: true
            }
            return acc;
        }, {} as Record<string, TokenBalance>)
    )
    const cacheRef = useRef<Record<string, { balance: number, price: number, loading: boolean } | null>>({})

    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""

    useFocusEffect(
        useCallback(() => {
            loadData(true);
        }, [])
    )

    async function onRefresh() {
        setTotal(prev => {
            return { ...prev, loading: true }
        })
        loadData(true)
    }

    async function loadData(forceRefresh = false) {
        try {
            const results = await Promise.all(
                Object.keys(TOKENLIST).map(async (token) => {
                    if(cacheRef.current[token] && !forceRefresh) {
                        return cacheRef.current[token]
                    }
                    const data = await fetchToken(token)
                    cacheRef.current[token] = data
                    return {
                        ...TOKENLIST[token],
                        ...data
                    }
                })
            )
            const newData: Record<string, TokenBalance | null> = Object.entries(TOKENLIST).reduce(
                (acc, [key, value], index) => {
                    acc[key] = {
                        ...value,
                        balance: results[index].balance ?? 0,
                        price: results[index].price ?? 0.0,
                        loading: results[index]?.loading ?? false,
                        mint: key,
                    }
                    return acc
                }, 
            {} as Record<string, TokenBalance>)

            const total = Object.values(newData)
                .filter((token) => token)
                .reduce((sum, token) => sum + ((token?.balance ?? 0) * (token?.price ?? 0)), 0)

            setTokenData(newData)
            setTotal({ balance: total, loading: false })

        } catch(error) {
            return null
        }
    }

    async function fetchToken(mintAddress: string) {
        try {
            const [balance, price] = await Promise.all([
                getBalance(walletAddress, mintAddress).then((res) => res),
                fetch(`${JUP_API_PRICE}${mintAddress}`).then((res) => res.json().then((json) => {
                    return parseFloat(json.data[mintAddress].price)
                }).catch(() => 0))
            ])
            return { balance: balance || 0, price: price || 0, loading: false }
        } catch(error) {
            return null
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-baseBg px-2">
            <ScrollView
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh}/>}
                contentContainerClassName="grow-1 pb-[52px]" stickyHeaderIndices={[0]}
            >
                <View className="items-center pt-4 mb-2 bg-baseBg">
                    {total.loading && <SkeletonLoader
                        className="rounded-xl bg-gray-900 w-40 h-12"
                        colors={["#111827", "#1f2937", "#111827"]}
                    />}
                    {!total.loading && <CustomText className="font-PlusJakartaSansBold text-5xl text-primary mb-2 text-center">
                        {`$${delimiterFormat(total.balance.toFixed(2))}`}
                    </CustomText>}
                    <View className="flex-row mt-6 w-[95%] justify-between">
                        <ButtonIcon
                            title="Receive"
                            icon={<ReceiveIcon width={24} height={24} color={Colors.primary}/>}
                            onPress={() => navigation.navigate('Receive')}
                        />
                        <ButtonIcon
                            title="Send"
                            icon={<SendIcon width={24} height={24} color={Colors.primary}/>}
                            onPress={() => {
                                if(isUseKeypair()) {
                                    // call function
                                }
                            }}
                        />
                        <ButtonIcon
                            title="Swap"
                            icon={<SwapIcon width={24} height={24} color={Colors.primary}/>}
                            onPress={() => {
                                if(isUseKeypair()) {
                                    // call function
                                }
                            }}
                        />
                        <ButtonIcon
                            title="Stake"
                            icon={<StakeIcon width={24} height={24} color={Colors.primary}/>}
                            onPress={() => navigation.navigate('TabStake')}
                        />
                    </View>
                    <View className="flex-row w-full justify-between items-center mb-2 mt-4 px-4">
                        <CustomText className="text-primary font-PlusJakartaSansSemiBold text-lg">Tokens</CustomText>
                        <ChevronRightIcon
                            width={24}
                            height={24}
                            color={Colors.primary}
                        />
                    </View>
                </View>
                <View className="flex-1">
                    {Object.keys(TOKENLIST).map((token, idx) => {
                        if(tokenData[token]?.balance !== 0 || (tokenData[token].loading && TOKENLIST[token].isAlways)) {
                            return (
                                <TokenItem
                                    key={`walletscreen-${tokenData[token]?.mint}`}
                                    tokenLogo={Images[tokenData[token]?.image as keyof typeof Images]}
                                    secondTokenLogo={Images[tokenData[token]?.pairImage as keyof typeof Images]}
                                    tokenName={tokenData[token]?.name}
                                    tokenPrice={tokenData[token]?.price ?? 0.0}
                                    tokenBalance={tokenData[token]?.balance ?? 0}
                                    isLP={tokenData[token]?.isLP}
                                    mintAddress={token}
                                    loading={tokenData[token]?.loading}
                                    priceLoading={tokenData[token]?.loading}
                                    navigate={navigation.navigate}
                                />
                            )
                        }
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

interface TokenItemProps {
    tokenLogo?: ImageSourcePropType
    secondTokenLogo?: ImageSourcePropType
    tokenName?: string
    tokenPrice: number
    tokenBalance: number
    isLP?: boolean
    mintAddress: string
    priceLoading?: boolean
    loading?: boolean
    navigate: any
} 

function TokenItem(props: TokenItemProps){
    const {
        tokenLogo, secondTokenLogo, tokenName, tokenBalance, tokenPrice, mintAddress, isLP, loading, priceLoading, navigate
    } = props
    return (
        <TouchableWithoutFeedback onPress={() => navigate('Token', { mintAddress: mintAddress })}>
            <View className="flex-row items-center justify-between p-4 m-2 rounded-2xl bg-gray-800">
                <View className="flex-row items-center">
                    {!isLP && <View className="h-12 w-12 mr-3">
                        <Image
                            className="h-12 w-12 rounded-full"
                            source={tokenLogo}
                        />
                    </View>}
                    {isLP && <View className="h-12 w-12 mr-3 items-center justify-center">
                        <Image
                            className="h-10 w-10 rounded-full absolute left-3"
                            source={secondTokenLogo}
                        />
                        <Image
                            className="h-10 w-10 mr-3 rounded-full"
                            source={tokenLogo}
                        />
                    </View>}
                    <View className="mb-1">
                        <CustomText className="text-primary font-PlusJakartaSansBold text-md">{tokenName}</CustomText>
                        {priceLoading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-16 h-[16px]" />}
                        {!priceLoading && <CustomText className="text-gray-200 font-PlusJakartaSans text-sm">${delimiterFormat(tokenPrice.toFixed(2))}</CustomText>}
                    </View>
                </View>
                <View className="items-end mb-1">
                    {loading && <SkeletonLoader className="mb-1 bg-gray-700 rounded-lg w-20 h-[18px]" width={80} height={18} />}
                    {!loading && <CustomText className="text-primary font-PlusJakartaSansBold text-md">{tokenBalance}</CustomText>}
                    {priceLoading && <SkeletonLoader className="w-20 h-4" />}
                    {!priceLoading && <CustomText className="text-gray-200 font-PlusJakartaSans text-sm">${delimiterFormat((tokenBalance * tokenPrice).toFixed(2))}</CustomText>}
                </View>
            </View>
        </TouchableWithoutFeedback>
    )
}

export const screenOptions = () => {
    return {
        headerTitle: 'Wallet',
        
    }
}