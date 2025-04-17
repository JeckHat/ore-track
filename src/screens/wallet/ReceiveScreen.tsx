import React, { useState } from 'react'
import { Dimensions, SafeAreaView, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Clipboard from '@react-native-clipboard/clipboard'
import { useSelector } from 'react-redux'

import Images from '@assets/images'
import { Button, CustomText } from '@components'
import { shortenAddress } from '@helpers'
import { RootState } from '@store/types'
import { Colors } from '@styles'


export default function ReceiveScreen() {
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey)
    const [textCopy, setTextCopy] = useState("Copy")

    function onCopyWord() {
        Clipboard.setString(walletAddress ?? "")
        setTextCopy("Copied")
        setTimeout(() => {
            setTextCopy("Copy")
        }, 1000)
    }

    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <View className="flex-1 justify-center items-center">
                <View className='border-4 border-gold border-solid rounded-lg p-4 bg-white'>
                    <QRCode
                        backgroundColor={Colors.primary}
                        value={walletAddress ?? ""}
                        size={Dimensions.get('window').width * 0.5}
                        logo={Images.SolanaToken}
                        logoSize={50}
                        logoBorderRadius={50}
                        logoBackgroundColor='transparent'
                    />
                </View>
                <View className='mt-8 border-[0.5px] border-primary border-solid rounded-md w-[80%] px-4 py-2 flex-row items-center'>
                    <CustomText className='text-primary font-PlusJakartaSans text-sm flex-1 mr-4'>
                        {shortenAddress(walletAddress ?? "", 8)}
                    </CustomText>
                    <Button
                        containerClassName='rounded-none overflow-auto'
                        className="bg-gold py-1 px-3 rounded-full"
                        textClassName='text-sm'
                        title={textCopy}
                        onPress={onCopyWord}
                    />
                </View>
                <CustomText className='text-primary font-PlusJakartaSans text-md mx-2 mt-4 text-center mb-10'>
                    This address can only be used to receive compatible tokens in the ore ecosystem.
                </CustomText>
            </View>
        </SafeAreaView>
    )
}