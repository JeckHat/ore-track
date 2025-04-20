import { SafeAreaView, View } from "react-native"
import { useSelector } from "react-redux"

import OreTrackInfo from "@modules/OreTrackInfo"
import { ChevronRightIcon } from "@assets/icons"
import { Button, CustomText } from "@components"
import { TabSettingScreenProps } from "@navigations/types"
import { boostActions, getMnemonic, poolActions, walletActions } from "@store/actions"
import { Colors } from "@styles"
import { store } from "@store/index"
import { RootState } from "@store/types"

export default function TabSettingScreen({ navigation }: TabSettingScreenProps) {
    const wallet = useSelector((state: RootState) => state.wallet)
    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <View className="flex-1">
                <Button
                    containerClassName="rounded-2xl mx-4 mb-2 mt-4"
                    className=" bg-baseComponent rouned-sm py-5 items-start"
                    textClassName="text-primary font-PlusJakartaSansSemiBold text-md"
                    title={
                        <View className="flex-row w-full justify-between items-center">
                            <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">
                                Account Address
                            </CustomText>
                            <ChevronRightIcon
                                width={25} height={25}
                                color={Colors.primary}
                            />
                        </View>
                    }
                    onPress={() => navigation.navigate('Receive')}
                />
                {wallet.useMnemonic && <Button
                    containerClassName="rounded-2xl mx-4 mb-2"
                    className=" bg-baseComponent rouned-sm py-5 items-start"
                    textClassName="text-primary font-PlusJakartaSansSemiBold text-md"
                    title={
                        <View className="flex-row w-full justify-between items-center">
                            <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">
                                Show Recovery Phrase
                            </CustomText>
                            <ChevronRightIcon
                                width={25} height={25}
                                color={Colors.primary}
                            />
                        </View>
                    }
                    onPress={async () => {
                        const mnemonic = await getMnemonic()
                        navigation.navigate('PrivateKey', {
                            importWallet: false, words: mnemonic, title: "Recovery Phrase"
                        })
                    }}
                />}
                {wallet.usePrivateKey && <Button
                    containerClassName="rounded-2xl mx-4 mb-6"
                    className=" bg-baseComponent rouned-sm py-5 items-start"
                    textClassName="text-primary font-PlusJakartaSansSemiBold text-md"
                    title={
                        <View className="flex-row w-full justify-between items-center">
                            <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">
                                Show Private Key
                            </CustomText>
                            <ChevronRightIcon
                                width={25} height={25}
                                color={Colors.primary}
                            />
                        </View>
                    }
                    onPress={() => navigation.navigate('Receive')}
                />}
                <Button
                    containerClassName="rounded-2xl mx-4 mb-6"
                    className=" bg-baseComponent rouned-sm py-5 items-start"
                    textClassName="text-primary"
                    title={
                        <View className="flex-row w-full justify-between items-center">
                            <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">
                                Rpc Url
                            </CustomText>
                            <ChevronRightIcon
                                width={25} height={25}
                                color={Colors.primary}
                            />
                        </View>
                    }
                    onPress={() => navigation.navigate("RPC")}
                />
                <Button
                    containerClassName="rounded-2xl mx-4"
                    className=" bg-baseComponent rouned-sm py-3 items-center"
                    textClassName="text-red-700"
                    title="Disconnect"
                    onPress={() => {
                        store.dispatch(walletActions.clearWallet())
                        store.dispatch(boostActions.resetBoosts())
                        store.dispatch(poolActions.resetPool())
                        navigation.navigate("Start")
                    }}
                />
                <View className="absolute bottom-[80px] text-center self-center">
                    <CustomText className="text-primary font-PlusJakartaSansSemiBold">
                        OreTrack {OreTrackInfo.getVersionName()}
                    </CustomText>
                </View>
            </View>
        </SafeAreaView>
    )
}