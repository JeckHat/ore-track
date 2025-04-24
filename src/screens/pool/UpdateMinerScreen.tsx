import { useState } from "react"
import { Alert, Pressable, SafeAreaView, View } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { Keypair } from "@solana/web3.js"
import { nanoid } from "nanoid"

import { ChevronLeftIcon } from "@assets/icons"
import { Button, CustomText, HeaderButton, Input, ModalButtonList, ModalImportAddress } from "@components"
import { StackOptionsFn, UpdateMinerNavigationProps } from "@navigations/types"
import { Colors, Fonts } from "@styles"
import { minerActions, saveCredentialsMiner } from "@store/actions"
import { useBottomModal } from "@hooks"
import { RootState } from "@store/types"
import { GENERATE_ID_NUMBER } from "@constants"

export default function UpdateMinerScreen({ navigation } : UpdateMinerNavigationProps) {
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [keypair, setKeypair] = useState<Keypair | null>()
    const [mnemonic, setMnenomic] = useState<string | undefined>()
    const dispatch = useDispatch()
    const minersById = useSelector((state: RootState) => state.miners.byId)

    const { showModal, hideModal } = useBottomModal()

    return (
        <SafeAreaView className='flex-1 bg-baseBg'>
            <View className="flex-1">
                <View className="my-2 mx-4">
                    <CustomText className="text-primary">Name</CustomText>
                    <Input
                        className="text-primary"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                <View className="my-2 mx-4">
                    <CustomText className="text-primary">Wallet Address</CustomText>
                    <Pressable
                        onPress={() => {
                            showModal(
                                <ModalButtonList
                                    buttons={[
                                        {
                                            text: 'Wallet Address',
                                            onPress: () => {
                                                showModal(
                                                    <ModalImportAddress
                                                        onImport={(text) => {
                                                            setAddress(text)
                                                            setMnenomic(undefined)
                                                            setKeypair(null)
                                                            hideModal()
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
                                                        setKeypair(keypair)
                                                        setMnenomic(words)
                                                        setAddress(keypair.publicKey.toBase58()) 
                                                    },
                                                    onNext: (navData) => {
                                                        navData.goBack()
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
                                                        setKeypair(keypair)
                                                        setMnenomic(undefined)
                                                        setAddress(keypair.publicKey.toBase58()) 
                                                    },
                                                    onNext: (navData) => {
                                                        navData.goBack()
                                                    }
                                                })
                                                hideModal()
                                            }
                                        }
                                    ]}
                                />
                            )
                        }}
                    >
                        <View className="bg-baseComponent px-2 py-2 rounded-xl border border-solid border-gray-800">
                            <CustomText ellipsizeMode="tail" className="text-primary mb-2 mb-1 font-PlusJakartaSans" numberOfLines={1}>{address}</CustomText>
                        </View>
                    </Pressable>
                </View>
            </View>
            <Button
                containerClassName="mb-2"
                title={"Add Miner"}
                disabled={!address || !name}
                onPress={async () => {
                    const miners = Object.keys(minersById).map(key => minersById[key].address)
                    if (miners.includes(address)) {
                        Alert.alert("This address is already in the data miner")
                        return;
                    }
                    if(keypair) {
                        await saveCredentialsMiner(address, keypair, mnemonic)
                    }
                    let minerId = nanoid(GENERATE_ID_NUMBER)
                    dispatch(minerActions.addMiner({
                        minerId: minerId,
                        name: name,
                        address: address,
                        isMain: false
                    }))
                    navigation.goBack()
                }}
            />
        </SafeAreaView>
    )
}

export const screenOptions: StackOptionsFn = ({ navigation }) => {
    return {
        headerTitle: 'Update Miner',
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
}