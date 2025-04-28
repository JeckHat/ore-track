import React, { useState } from 'react'
import { Image, SafeAreaView, View } from 'react-native'
import { Keypair } from '@solana/web3.js'
import { useDispatch } from 'react-redux'

import { StartNavigationProps } from '@navigations/types'
import { CustomText, CheckBox, Button, ModalButtonList, ModalImportAddress } from '@components'
import Images from '@assets/images'
import { useBottomModal } from '@hooks'
import { minerActions, minerPoolActions, poolActions, saveCredentials, walletActions } from '@store/actions'
import { nanoid } from 'nanoid'
import { GENERATE_ID_NUMBER, POOL_LIST } from '@constants'

export default function StartScreen({ navigation }: StartNavigationProps) {
  const [checkedTerm, setCheckedTerm] = useState(false)

  const { showModal, hideModal } = useBottomModal()

  const dispatch = useDispatch()

  function onCreateWallet() {
    navigation.navigate('PrivateKey', { importWallet: false, title: "Recovery Phrase" })
  }

  function updateMinerRedux(address: string, useKeypair: boolean, useMnemonic: boolean) {
    let minerId = nanoid(GENERATE_ID_NUMBER)
    dispatch(minerActions.addMiner({
      minerId: minerId,
      name: 'Main Wallet',
      address: address,
      isMain: true,
      useKeypair: useKeypair,
      useMnemonic: useMnemonic,
      allowTrx: useKeypair ?? false
    }))
    Object.keys(POOL_LIST).forEach(poolId => {
      let minerPoolId = `${poolId}-${minerId}`
      dispatch(poolActions.joinMinerToPool({
        poolId: poolId,
        minerPoolId: minerPoolId
      }))
      dispatch(minerPoolActions.joinMinerToPool({
        minerPoolId: minerPoolId,
        minerId: minerId,
        poolId: poolId
      }))
      dispatch(minerActions.joinMinerToPool({
        minerId: minerId,
        minerPoolId: minerPoolId
      }))
    })
  }

  function onImportWallet() {
    showModal(
      <ModalButtonList
        buttons={[
          {
            text: 'Wallet Address',
            onPress: () => {
              showModal(
                <ModalImportAddress
                  onImport={(address) => {
                    dispatch(walletActions.setWallet({
                      address: address,
                      useMnemonic: false,
                      usePrivateKey: false,
                      allowTrx: false
                    }))
                    updateMinerRedux(address, false, false)
                    hideModal()
                    navigation.replace('BottomTab')
                  }}
                />
              )
            }
          },
          {
            text: 'Recovery Phrase',
            onPress: () => {
              navigation.navigate('PrivateKey', {
                importWallet: true, title: "Recovery Phrase", isSeedPhrase: true,
                onSubmit: async (keypair: Keypair, words?: string) => {
                  await saveCredentials(keypair, words)
                  dispatch(walletActions.setWallet({
                    address: keypair.publicKey?.toBase58(),
                    useMnemonic: true,
                    usePrivateKey: true,
                    allowTrx: true
                  }))
                  updateMinerRedux(keypair.publicKey?.toBase58(), true, true)
                },
                onNext: (navigation) => {
                  navigation.replace('BottomTab')
                }
              })
              hideModal()
            }
          },
          {
            text: 'Private Key',
            onPress: () => {
              navigation.navigate('PrivateKey', {
                importWallet: true, title: "Private Key", isSeedPhrase: false,
                onSubmit: async (keypair: Keypair) => {
                  await saveCredentials(keypair)
                  dispatch(walletActions.setWallet({
                    address: keypair.publicKey?.toBase58(),
                    useMnemonic: false,
                    usePrivateKey: true,
                    allowTrx: true
                  }))
                  updateMinerRedux(keypair.publicKey?.toBase58(), true, false)
                },
                onNext: (navigation) => {
                  navigation.replace('BottomTab')
                }
              })
              hideModal()
            }
          }
        ]}
      />
    )
  }
  
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-baseBg">
      <View className="flex-1 justify-center items-center">
        <View className="border-2 border-gold rounded-full w-min px-3 py-1 text-xs font-semibold mb-4 mt-8">
          <CustomText className="text-gold mx-auto text-nowrap font-PlusJakartaSansSemiBold">
            Fair Launch
          </CustomText>
        </View>
        <CustomText className="font-PlusJakartaSansBold text-primary text-4xl">
          Proof of Work.
        </CustomText>
        <CustomText className="text-lowEmphasis font-PlusJakartaSansBold text-4xl mb-8">
          On Solana.
        </CustomText>
        {/* <View className="flex-row gap-5 mb-4">
          <Image
            className="w-24 h-24"
            source={Images.OreLogo}
          />
          <View className="w-24 h-24 items-center justify-center bg-black rounded-full">
            <Image
              className="w-16 h-16"
              source={Images.CoalLogo}
            />
          </View>
        </View> */}
        <Image
          className="w-48 h-48"
          source={Images.OreTrackText}
        />
        <CustomText className='text-lowEmphasis font-PlusJakartaSansItalic mx-8 mt-4 text-center'>
          {`Tracking your mining performance. \nAnalyze the flow, optimize the rewards.`}
        </CustomText>
        {/* <CustomText className="text-primary font-PlusJakartaSansBold text-3xl mt-8">
          PoW Monitoring
        </CustomText> */}
        {/* <Image
          className="w-48 h-48"
          source={Images.OreTrackText}
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
          onPress={onCreateWallet}
        />
        <View className='px-4 items-center'>
          <CustomText
            className={`font-PlusJakartaSansBold text-primary text-lg text-center ${!checkedTerm && "opacity-35"}`}
            disabled={!checkedTerm}
            onPress={onImportWallet}
          >
            I already have a wallet
          </CustomText>
        </View>
      </View>
    </SafeAreaView>
  )
}
