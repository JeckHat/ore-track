import { useState } from "react"
import { ScrollView, View } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { Connection } from "@solana/web3.js"


import { ChevronLeftIcon } from "@assets/icons"
import { Button, CustomText, Input, KeyboardDismissPressable } from "@components"
import { RPCNavigationProps } from "@navigations/types"
import { Colors } from "@styles"
import { RootState } from "@store/types"
import { configActions, uiActions } from "@store/actions"

export default function RPCScreen({ navigation }: RPCNavigationProps) {
    const rpcUrl = useSelector((state: RootState) => state.config.rpcUrl)
    const dispatch = useDispatch()

    const [rpc, setRpc] = useState(rpcUrl ?? "")

    async function onSave() {
        dispatch(uiActions.showLoading(true))
        try {
            const connection = new Connection(`https://${rpc}`)
            await connection.getRecentPrioritizationFees()
            dispatch(configActions.setRpcUrl(rpc))
        } catch(error) {
            console.log("error", error)
        } finally {
            dispatch(uiActions.showLoading(false))
        }
    }

    return (
        <KeyboardDismissPressable className="flex-1 bg-baseBg px-2">
            <View className={`mt-8 flex-row items-center`}>
                <ChevronLeftIcon
                    width={32} height={32} color={Colors.primary}
                    onPress={() => navigation.goBack()}
                />
                <CustomText
                    className="text-primary font-PlusJakartaSansSemiBold text-lg"
                    onPress={() => navigation.goBack()}
                >
                    Back
                </CustomText>
            </View>
            <View className="px-2 mb-8">
                <CustomText className="text-primary font-PlusJakartaSansBold text-3xl text-center">
                    RPC URL
                </CustomText>
                <View className="mt-12">
                    <Input
                        containerClassName="mb-10"
                        inputContainerClassName="border-gold"
                        style={{ color: Colors.primary }}
                        value={rpc}
                        onChangeText={setRpc}
                    />
                    <View className="bg-baseComponent h-12 rounded-xl w-full border-gold border border-solid flex-row overflow-hidden mb-4">
                        <View className="h-fit px-2 bg-gold items-center justify-center">
                            <CustomText className="text-base font-PlusJakartaSansBold">
                                https://
                            </CustomText>
                        </View>
                        <View className="flex-1 overflow-hidden justify-center">
                            <ScrollView horizontal contentContainerClassName="px-1 h-full items-center">
                                <CustomText className="text-primary font-PlusJakartaSans">
                                    {rpc}
                                </CustomText>
                            </ScrollView>
                        </View>
                    </View>
                    <View className="bg-baseComponent h-12 rounded-xl w-full border-gold border border-solid flex-row overflow-hidden mb-16">
                        <View className="h-fit px-2 bg-gold items-center justify-center">
                            <CustomText className="text-base font-PlusJakartaSansBold">
                                wss://
                            </CustomText>
                        </View>
                        <View className="flex-1 overflow-hidden justify-center">
                            <ScrollView horizontal scrollEnabled={false} contentContainerClassName="px-1 h-full items-center">
                                <CustomText className="text-primary font-PlusJakartaSans">
                                    {rpc}
                                </CustomText>
                            </ScrollView>
                        </View>
                    </View>
                    <Button
                        title="Save URL"
                        onPress={onSave}
                    />
                </View>
            </View>
        </KeyboardDismissPressable>
    )
}