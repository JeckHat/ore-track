import { useEffect, useState } from 'react'
import { Image, SafeAreaView, View } from 'react-native'
import { useSelector } from 'react-redux'

import { ButtonIcon, CustomText, SkeletonLoader } from '@components'
import { Colors } from '@styles'
import { ReceiveIcon, SendIcon, StakeIcon, SwapIcon } from '@assets/icons'
import Images from '@assets/images'
import { delimiterFormat } from '@helpers'
import { TokenNavigationProps } from '@navigations/types'
import { JUP_API_PRICE, TOKENLIST } from '@constants'
import { RootState } from '@store/types'
import { getBalance } from '@services/solana'

export default function TokenScreen({ navigation, route }: TokenNavigationProps) {

    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""

    const token = TOKENLIST[route.params?.mintAddress ?? ""]
    const [data, setData] = useState({
        loading: true,
        price: 0,
        balance: 0
    })

    useEffect(() => {
        fetchToken(route.params?.mintAddress ?? "")
    }, [])
    
    async function fetchToken(mintAddress: string) {
        setData({ ...data, loading: true })
        try {
            const [balance, price] = await Promise.all([
                getBalance(walletAddress, mintAddress).then((res) => res),
                fetch(`${JUP_API_PRICE}${mintAddress}`).then((res) => res.json().then((json) => {
                    return parseFloat(json.data[mintAddress].price)
                }).catch(() => 0))
            ])
            setData({
                price: price,
                balance: balance,
                loading: false
            })
            return { balance: balance || 0, price: price || 0, loading: false }
        } catch(error) {
            return null
        }
    }

    const isLP = false
    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <View className="flex-1">
                <View className='flex-row m-2 items-center mb-2'>
                    <Image
                        className='w-10 h-10 mr-2 rounded-full'
                        source={Images[token.image as keyof typeof Images]}
                    />
                    <CustomText className='text-primary text-xl font-PlusJakartaSansBold'>
                        Solana
                    </CustomText>
                </View>
                {data.loading && <SkeletonLoader className='w-36 h-14 self-center'/>}
                {!data.loading && <CustomText className='text-primary text-4xl font-PlusJakartaSansBold text-center mb-4'>
                    ${delimiterFormat(data.price.toFixed(3))}
                </CustomText>}
                <View className="flex-row mt-6 justify-center gap-x-6 mb-8">
                    <ButtonIcon
                        title="Receive"
                        icon={<ReceiveIcon width={24} height={24} color={Colors.primary}/>}
                        onPress={() => navigation.navigate('Receive')}
                    />
                    <ButtonIcon
                        title="Send"
                        icon={<SendIcon width={24} height={24} color={Colors.primary}/>}
                        onPress={() => {}}
                    />
                    <ButtonIcon
                        title="Swap"
                        icon={<SwapIcon width={24} height={24} color={Colors.primary}/>}
                        onPress={() => {}}
                    />
                    {token.boostAddress && <ButtonIcon
                        title="Stake"
                        icon={<StakeIcon width={24} height={24} color={Colors.primary}/>}
                        onPress={() => navigation.navigate('DepositStake', {
                            boost: token.boostAddress
                        })}
                    />}
                </View>
                <CustomText className='text-primary font-PlusJakartaSans mx-2'>
                    Your Balance
                </CustomText>
                <View className="flex-row items-center justify-between p-4 m-2 rounded-2xl bg-gray-800">
                    <View className="flex-row items-center">
                        {!token.isLP && <View className="h-12 w-12 mr-3">
                            <Image
                                className="h-12 w-12 rounded-full"
                                source={Images[token.image as keyof typeof Images]}
                            />
                        </View>}
                        {token.isLP && <View className="h-12 w-12 mr-3 items-center justify-center">
                            <Image
                                className="h-10 w-10 rounded-full absolute left-3"
                                source={Images[token.pairImage as keyof typeof Images]}
                            />
                            <Image
                                className="h-10 w-10 mr-3 rounded-full"
                                source={Images[token.image as keyof typeof Images]}
                            />
                        </View>}
                        <View className="mb-1">
                            <CustomText className="text-primary font-PlusJakartaSansBold text-md">{token.name}</CustomText>
                            {data.loading && <SkeletonLoader className="mt-1 bg-gray-700 rounded-lg w-16 h-[16px]" />}
                            {!data.loading && <CustomText className="text-gray-200 font-PlusJakartaSans text-sm">${delimiterFormat(data.price.toFixed(3))}</CustomText>}
                        </View>
                    </View>
                    <View className="items-end mb-1">
                        {data.loading && <SkeletonLoader className="mb-1 bg-gray-700 rounded-lg w-20 h-[18px]" width={80} height={18} />}
                        {!data.loading && <CustomText className="text-primary font-PlusJakartaSansBold text-md">{data.balance}</CustomText>}
                        {data.loading && <SkeletonLoader className="w-20 h-4" />}
                        {!data.loading && <CustomText className="text-gray-200 font-PlusJakartaSans text-sm">${delimiterFormat((data.balance * data.price).toFixed(2))}</CustomText>}
                    </View>
                </View>
                
            </View>
        </SafeAreaView>
    )
}