import React, { useState } from 'react'
import { Image, SafeAreaView, View } from 'react-native'

import { StartNavigationProps } from '@navigations/types'
import { CustomText, CheckBox, Button } from '@components/index'
import { OreLogo } from '@assets/images'
import { MineIcon } from '@assets/icons'
import { Colors } from '@styles/index'

export default function StartScreen({ navigation }: StartNavigationProps) {
  const [checkedTerm, setCheckedTerm] = useState(false)
  
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-baseBg">
      <View className="flex-1 justify-center items-center">
        <View className="border-2 border-gold rounded-full w-min px-3 py-1 text-xs font-semibold mb-4">
          <CustomText className="text-gold mx-auto text-nowrap font-PlusJakartaSansSemiBold">
            Fair Launch
          </CustomText>
        </View>
        <CustomText className="font-PlusJakartaSansBold text-primary text-4xl">
          Proof of Work.
        </CustomText>
        <CustomText className="text-lowEmphasis font-PlusJakartaSansBold text-4xl mb-16">
          On Solana.
        </CustomText>
        <View className="flex-row gap-5 mb-8">
          <Image
            className="w-24 h-24"
            source={OreLogo}
          />
          {/* <View className="w-24 h-24 items-center justify-center bg-black rounded-full">
            <Image
              className="w-16 h-16"
              source={CoalLogo}
            />
          </View> */}
        </View>
        <CustomText className="text-primary font-PlusJakartaSansBold text-4xl mb-8">
          PoW Mobile Mining
        </CustomText>
        <MineIcon width={64} height={64} color={Colors.primary} />
        {/* <Image
          className="w-24 h-24"
          source={OreLogo}
        /> */}
      </View>
      <View className="my-8 w-full px-[8%]">
        <CheckBox
          value={checkedTerm}
          onChange={setCheckedTerm}
          containerClassName='mx-2 w-full items-center'
          label={
            <CustomText className='font-PlusJakartaSansSemiBold text-primary text-lg'>
              I agree to the <CustomText className='text-gold underline'>Term of Service</CustomText>
            </CustomText>
          }
        />
        <Button
          containerClassName='rounded-full my-5'
          disabled={!checkedTerm}
          title="Create a new Wallet"
          onPress={() => navigation.navigate('RecoveryPhrase', { importWallet: false, title: "Recovery Phrase" })}
        />
        <View className='px-4 items-center'>
          <CustomText
            className={`font-PlusJakartaSansBold text-primary text-lg text-center ${!checkedTerm && "opacity-35"}`}
            disabled={!checkedTerm}
            onPress={() => navigation.navigate('RecoveryPhrase', { importWallet: true, title: "Recovery Phrase" })}
          >
            I already have a wallet
          </CustomText>
        </View>
      </View>
    </SafeAreaView>
  )
}
