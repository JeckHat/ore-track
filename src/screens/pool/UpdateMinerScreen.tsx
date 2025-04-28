import { useEffect, useRef, useState } from "react"
import { Alert, Pressable, TextInput, View } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { Keypair } from "@solana/web3.js"
import { nanoid } from "nanoid"
import dayjs from 'dayjs'

import { ChevronLeftIcon } from "@assets/icons"
import { Button, CustomText, HeaderButton, Input, KeyboardDismissPressable, ModalButtonList, ModalImportAddress } from "@components"
import { createStackOptions, UpdateMinerNavigationProps } from "@navigations/types"
import { Colors, Fonts } from "@styles"
import { getKeypairMiner, getMnemonicMiner, minerActions, minerPoolActions, saveCredentialsMiner } from "@store/actions"
import { useBottomModal } from "@hooks"
import { RootState } from "@store/types"
import { GENERATE_ID_NUMBER } from "@constants"

export default function UpdateMinerScreen({ navigation, route } : UpdateMinerNavigationProps) {
    const minerId = route?.params?.minerId
    const [name, setName] = useState("")
    const [address, setAddress] = useState("")
    const [keypair, setKeypair] = useState<Keypair | null>()
    const [mnemonic, setMnenomic] = useState<string | undefined>()
    const dispatch = useDispatch()
    const minersById = useSelector((state: RootState) => state.miners.byId)
    const minerPoolsById = useSelector((state: RootState) => state.minerPools.byId)

    console.log("data", useSelector(state => state))

    const inputRef = useRef<TextInput | null>(null);

    const { showModal, hideModal } = useBottomModal()

    useEffect(() => {
        if (minerId) {
            (async () => {
                setName(minersById[minerId].name)
                setAddress(minersById[minerId].address)
                const keypair = await getKeypairMiner(minerId)
                setKeypair(keypair)
                const mnemonic = await getMnemonicMiner(minerId)
                setMnenomic(mnemonic)
            })()
        }

    }, [minerId])

    function onSelectAddress() {
        inputRef.current?.blur()
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
    }

    return (
        <KeyboardDismissPressable className='flex-1 bg-baseBg'>
            <View className="flex-1">
                <View className="my-2 mx-4">
                    <CustomText className="text-primary font-PlusJakartaSansSemiBold">Name</CustomText>
                    <Input
                        ref={inputRef}
                        className="text-primary"
                        value={name}
                        onChangeText={setName}
                    />
                </View>
                <View className="my-2 mx-4">
                    <CustomText className="text-primary font-PlusJakartaSansSemiBold">Wallet Address</CustomText>
                    <Pressable
                        onPress={() => {
                            if(!minerId || (minerId && !minersById[minerId].isMain)) onSelectAddress()
                        }}
                    >
                        <View className="bg-baseComponent px-2 py-2 rounded-xl border border-solid border-gray-800">
                            <CustomText
                                ellipsizeMode="tail" className="text-primary mb-1 font-PlusJakartaSans"
                                numberOfLines={1}
                            >{address}</CustomText>
                        </View>
                    </Pressable>
                </View>
            </View>
            {minerId && <Button
                containerClassName="my-4 mx-6"
                title={"Edit Miner"}
                disabled={!address || !name}
                onPress={async () => {
                    const miners = Object.keys(minersById).map(key => minersById[key].address)
                    if (address !== minersById[minerId].address && miners.includes(address)) {
                        Alert.alert("This address is already in the data miner")
                        return;
                    }
                    if(keypair) {
                        await saveCredentialsMiner(minerId, keypair, mnemonic)
                    }
                    if (address !== minersById[minerId].address) {
                        minersById[minerId].minerPoolIds.forEach(minerPoolId => {
                            dispatch(minerPoolActions.updateBalanceMiner({
                                minerPoolId: minerPoolId,
                                minerPool: {
                                    ...minerPoolsById[minerPoolId],
                                    rewardsOre: 0,
                                    rewardsCoal: 0,
                                    running: false,
                                    avgRewards: { ore: 0, coal: 0, initOre: 0, initCoal: 0 },
                                    earnedOre: 0,
                                    startMiningAt: null,
                                    lastUpdateAt: dayjs().toISOString(),
                                    lastClaimAt: dayjs('1900-01-01').toISOString(),
                                }
                            }))
                        })
                    }
                    dispatch(minerActions.editMiner({
                        minerId: minerId,
                        name: name,
                        address: address,
                        useKeypair: keypair ? true : false,
                        useMnemonic: mnemonic ? true : false,
                        allowTrx: keypair || mnemonic? true : false
                    }))
                    navigation.goBack()
                }}
            />}
            {!minerId && <Button
                containerClassName="my-4 mx-6"
                title={"Add Miner"}
                disabled={!address || !name}
                onPress={async () => {
                    let minerId = nanoid(GENERATE_ID_NUMBER)
                    const miners = Object.keys(minersById).map(key => minersById[key].address)
                    if (miners.includes(address)) {
                        Alert.alert("This address is already in the data miner")
                        return;
                    }
                    if(keypair) {
                        await saveCredentialsMiner(minerId, keypair, mnemonic)
                    }
                    
                    dispatch(minerActions.addMiner({
                        minerId: minerId,
                        name: name,
                        address: address,
                        isMain: false,
                        useKeypair: keypair ? true : false,
                        useMnemonic: mnemonic ? true : false,
                        allowTrx: keypair || mnemonic? true : false
                    }))
                    navigation.goBack()
                }}
            />}
        </KeyboardDismissPressable>
    )
}

export const screenOptions = createStackOptions<'UpdateMiner'>(({ navigation, route }) => {
    const minerId = route?.params?.minerId
    return {
        headerTitle: minerId? 'Eit Miner' : 'Add Miner',
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
})