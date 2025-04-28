import { FlatList, SafeAreaView, View } from "react-native"
import { useDispatch, useSelector } from "react-redux"

import { ChevronLeftIcon, HardHatIcon } from "@assets/icons"
import { Button, CustomText, HeaderButton, OptionMenu } from "@components"
import { createStackOptions, ManageMinerNavigationProps } from "@navigations/types"
import { Colors, Fonts } from "@styles"
import { shortenAddress } from "@helpers"
import { RootState } from "@store/types"
import { removeMiner } from "@store/thunks"
import { store } from "@store/index"
import { getKeypairMiner, getMnemonicMiner } from "@store/actions"

const useAppDispatch = () => useDispatch<typeof store.dispatch>()

export default function ManageMinerScreen({ navigation } : ManageMinerNavigationProps) {
    const miners = useSelector((state: RootState) => state.miners.byId)
    const dispatch = useAppDispatch()

    return (
        <SafeAreaView className='flex-1 bg-baseBg'>
            <View>
                <Button
                    containerClassName="rounded-none mr-2 self-end mb-2"
                    className="py-2 px-6 rounded-full"
                    textClassName="text-sm mb-[1px]"
                    title="Add Miner"
                    onPress={() => navigation.navigate('UpdateMiner')}
                />
            </View>
            <FlatList
                data={Object.keys(miners)}
                keyExtractor={(_, idx) => `miner-${idx}`}
                renderItem={({ item }) => {
                    let menu = [
                        {
                            text: 'Address',
                            onPress: () => {
                                navigation.navigate('Receive', {
                                    walletAddress: miners[item].address
                                })
                            }
                        },
                    ]
                    if (miners[item].useMnemonic) {
                        getMnemonicMiner(item).then(mnemonic => {
                            if (miners[item].useKeypair) {
                                menu.push({
                                    text: 'Recovery Phrase',
                                    onPress: () => {
                                        navigation.navigate('PrivateKey', {
                                            isSeedPhrase: true,
                                            importWallet: false,
                                            words: mnemonic
                                        })
                                    }
                                })
                            }
                        })
                    }
                    if (miners[item].useKeypair) {
                        getKeypairMiner(item).then(keypair => {
                            if (miners[item].useKeypair) {
                                menu.push({
                                    text: 'Private Key',
                                    onPress: () => {
                                        navigation.navigate('PrivateKey', {
                                            isSeedPhrase: false,
                                            importWallet: false,
                                            words: keypair.secretKey.toString()
                                        })
                                    }
                                })
                            }
                        })
                    }
                    
                    menu.push(...[{
                        text: 'Edit',
                        onPress: () => {
                            navigation.navigate('UpdateMiner', {
                                minerId: miners[item].id
                            })
                        }
                    },
                    {
                        text: 'Delete',
                        onPress: () => {
                            dispatch(removeMiner({ minerId: miners[item].id }))
                        }
                    }])
                    return (
                        <View className="flex-row items-center mx-2 mb-2 p-4 rounded-lg bg-gray-800">
                            <HardHatIcon
                                width={32} height={32} color={Colors.primary}
                            />
                            <View className="flex-1 mx-2">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold leading-none mb-1">
                                    {miners[item].name}
                                </CustomText>
                                <CustomText className="text-primary font-PlusJakartaSans">
                                    {shortenAddress(miners[item].address)}
                                </CustomText>
                            </View>
                            <View className="flex-1 mx-2">
                                <CustomText className="text-primary font-PlusJakartaSans text-sm">
                                    Pools Joined: {miners[item].minerPoolIds.length}
                                </CustomText>
                            </View>
                            <OptionMenu
                                iconSize={20}
                                menu={menu}
                            />
                        </View>
                    )
                }}
            />
        </SafeAreaView>
    )
}

export const screenOptions = createStackOptions<'ManageMiner'>(({ navigation }) => {
    return {
        headerTitle: 'Manage Miner',
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