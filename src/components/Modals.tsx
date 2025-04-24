import { ReactNode, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Dimensions,
    FlatList,
    Image,
    Modal,
    NativeEventSubscription,
    TouchableHighlight,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";
import { twMerge } from "tailwind-merge";

import Images from "@assets/images";
import { ChevronRightIcon, HardHatIcon, ScanQRIcon } from "@assets/icons";
import { Colors } from "@styles";
import { CustomText } from "./Texts"
import { Button } from "./Buttons";
import { Input } from "./Forms";
import { PublicKey } from "@solana/web3.js";
import Clipboard from "@react-native-clipboard/clipboard";
import { MinerType } from "@store/types";
import { shortenAddress } from "@helpers";

export function LoadingModal(props: { show?: boolean }) {
    if (props.show) {
        return (
            <Modal
                animationType="fade"
                transparent
                visible
                statusBarTranslucent={true}
            >
                <View className="flex-1 justify-center items-center bg-[#0008]">
                    <View className="bg-primary rounded-lg flex-row items-center justify-center px-6 py-2">
                        <ActivityIndicator size="small" className="text-gold" />
                        <CustomText className="my-4 text-center font-PlusJakartaSansSemiBold text-xl ml-4 text-black">Loading...</CustomText>
                    </View>
                </View>
            </Modal>
        )
    }

    return null
}

interface BottomModalProps {
    cancelable?: boolean
    children: ReactNode | null
    visible: boolean
    hideModal: () => void
    backdropOpacity: Animated.Value | number
    containerStyle: ViewStyle
}

export function BottomModal(props: BottomModalProps) {
    const { cancelable = true, children, hideModal, visible, backdropOpacity, containerStyle } = props

    const didFocus = useRef<NativeEventSubscription | null>(null)

    useEffect(() => {
        if (visible) {
            // openModal()
            didFocus.current = BackHandler.addEventListener("hardwareBackPress", () => {
                if (cancelable) {
                    hideModal()
                }
                return true
            })
        } else {
            didFocus.current?.remove()
        }
    }, [visible])

    if (visible) {
        return (
            <View className="absolute top-0 left-0 right-0 bottom-0 z-[1000] justify-end">
                <TouchableWithoutFeedback onPress={hideModal}>
                    <Animated.View
                        className={`absolute top-0 left-0 right-0 bottom-0 bg-black/50`}
                        style={{ opacity: backdropOpacity }}
                    />
                </TouchableWithoutFeedback>

                <Animated.View
                    className="w-full max-h-full bg-baseComponent rounded-t-3xl shadow-black elevation-md"
                    style={containerStyle}
                >
                    {/* <View className="absolute z-50 top-2 w-14 h-2 bg-gray-800 rounded-md mb-3 self-center" /> */}
                    {children}
                </Animated.View>
            </View>
        )
    }

    return null
}

interface ModalTransactionProps {
    tokenTransfers: {
        id: string,
        isLp: boolean,
        ticker: string,
        balance: string,
        tokenImage: string,
        pairImage?: string | null,
        isMinus?: boolean
    }[],
    transferInfo: { label: string, value: string }[],
    advanced?: [],
    onClose: () => void,
    onConfirm: () => void
}

export function ModalTransaction(props: ModalTransactionProps) {
    const { tokenTransfers, transferInfo, advanced = [], onClose, onConfirm } = props
    return (
        <View className="w-full my-6 px-4">
            <View className="items-center mb-2">
                <CustomText className="text-primary font-PlusJakartaSansBold text-xl text-center mb-2">Confirm Transaction</CustomText>
                <CustomText className="text-primary font-PlusJakartaSans text-sm w-full mb-4 text-center">Balance changes are estimated. Amounts and assets involved are not guaranteed.</CustomText>
            </View>
            <View className="bg-baseDarkComponent rounded-2xl overflow-hidden mb-2">
                {tokenTransfers.map(tokenTransfer => (
                    <View
                        key={`token-transfer-${tokenTransfer.id}`}
                        className="flex-row h-[58px] items-center justify-between px-3 border-solid border-y-[0.5px] border-baseComponent"
                    >
                        <View className="flex-row items-center py-3">
                            {tokenTransfer.isLp && <View className="w-10 h-8">
                                <Image
                                    className="w-8 h-8 absolute left-3"
                                    source={Images[tokenTransfer.pairImage as keyof typeof Images]}
                                />
                                <Image
                                    className="w-8 h-8 mr-3"
                                    source={Images[tokenTransfer.tokenImage as keyof typeof Images]}
                                />
                            </View>}
                            {!tokenTransfer.isLp && 
                                <Image
                                    className="w-8 h-8"
                                    source={Images[tokenTransfer.tokenImage as keyof typeof Images]}
                                />
                            }
                            <CustomText className="text-primary font-PlusJakartaSansSemiBold mx-2">{tokenTransfer.ticker}</CustomText>
                        </View>
                        <View className="flex-1 justify-center items-end">
                            {!tokenTransfer.isMinus && <CustomText className="text-end font-PlusJakartaSansSemiBold ml-2 text-green-600">
                                + {tokenTransfer.balance} {tokenTransfer.ticker}
                            </CustomText>}
                            {tokenTransfer.isMinus && <CustomText className="text-end font-PlusJakartaSansSemiBold ml-2 text-red-600">
                                - {tokenTransfer.balance} {tokenTransfer.ticker}
                            </CustomText>}
                        </View>
                    </View>
                ))}
            </View>
            <View className="bg-baseDarkComponent rounded-2xl overflow-hidden mb-2">
                {transferInfo.map((info, idx) => (
                    <View
                        key={`transfer-info-${idx}`}
                        className="flex-row h-[58px] items-center justify-between px-3 border-solid border-y-[0.7px] border-baseComponent"
                    >
                        <View className="flex-row items-center py-3">
                            <CustomText className="text-primary font-PlusJakartaSansSemiBold mx-2">{info.label}</CustomText>
                        </View>
                        <View className="flex-1 justify-center items-end">
                            <CustomText className="text-end font-PlusJakartaSansSemiBold ml-2 text-primary">
                                {info.value}
                            </CustomText>
                        </View>
                    </View>
                ))}
            </View>
            {advanced.length > 0 && <View className="bg-baseDarkComponent rounded-2xl overflow-hidden mb-2">
                <View className="flex-row h-[58px] items-center justify-between px-3 border-solid border-y-[0.7px] border-baseComponent">
                    <View className="flex-row items-center">
                        <CustomText className="text-primary font-PlusJakartaSansSemiBold mx-2 mb-1">Advanced</CustomText>
                    </View>
                    <View className="flex-1 justify-center items-end">
                        <ChevronRightIcon
                            width={24} height={24} color={Colors.primary}
                        />
                    </View>
                </View>
            </View>}
            
            <View className="flex-row justify-center gap-2 mt-4">
                <View className="flex-1">
                    <Button
                        containerClassName="w-full rounded-2xl"
                        className="bg-baseDarkComponent items-center py-2"
                        textClassName="text-primary"
                        title="Close"
                        onPress={onClose}
                    />
                </View>
                <View className="flex-1">
                    <Button
                        containerClassName="w-full rounded-2xl"
                        className="bg-gold items-center py-2"
                        title="Confirm"
                        onPress={onConfirm}
                    />
                </View>
            </View>
        </View>
    )
}

interface modalButtonListProps {
    buttons: {
        text: string
        onPress: () => void
    }[]
}

export function ModalButtonList(props: modalButtonListProps ) {
    return (
        <View className="w-full my-6 px-4">
            <View className="items-center mb-2">
                <CustomText className="text-primary font-PlusJakartaSansBold text-xl text-center mb-2">Import Options</CustomText>
                <CustomText className="text-primary font-PlusJakartaSans text-md w-full mb-4 text-center">Balance changes are estimated. Amounts and assets involved are not guaranteed.</CustomText>
            </View>
            <View className="my-2 mx-2">
                {props.buttons.map((button, idx) => (
                    <Button
                        key={`modal-button-list-${idx}`}
                        containerClassName="mb-3"
                        title={button.text}
                        onPress={button.onPress}
                    />
                ))}
            </View>
        </View>
    )
}

export function ModalImportAddress(props: { onImport: (text: string) => void} ) {
    const [address, setAddress] = useState({
        value: '',
        valid: false,
        touched: false,
    })

    function onValidationCheck(text: string) {
        if (typeof text !== 'string' || text.length < 32 || text.length > 44) {
            setAddress({
                value: text,
                valid: false,
                touched: true
            })
        } else {
            let validation = PublicKey.isOnCurve(new PublicKey(text))
            setAddress({
                value: text,
                valid: validation,
                touched: true
            })
        }
    }

    async function onPaste() {
        const text = await Clipboard.getString()
        onValidationCheck(text)
    }

    return (
        <View className="w-full my-6 px-4">
            <View className="items-center mb-2">
                <CustomText className="text-primary font-PlusJakartaSansBold text-xl text-center mb-2">Import Wallet Address</CustomText>
                <CustomText className="text-primary font-PlusJakartaSans text-md w-full mb-3 text-center">Importing with address only gives view access. You can’t send, claim, stake, withdraw, or mine.</CustomText>
            </View>
            <View className="my-2 mx-2">
                <Input
                    inputContainerClassName="flex-row"
                    className="flex-1 text-primary font-PlusJakartaSans"
                    autoCapitalize="none"
                    value={address.value}
                    isError={!address.valid && address.touched}
                    onChangeText={onValidationCheck}
                    messageError="Invalid Address"
                    suffix={(
                        <View className="flex-row items-center">
                            <Button
                                containerClassName='rounded-none overflow-auto mx-2'
                                className="bg-gold py-1 px-3 rounded-full"
                                textClassName='text-sm'
                                title={"Paste"}
                                onPress={onPaste}
                            />
                            <ScanQRIcon width={24} height={24} color={Colors.primary} />
                        </View>
                    )}
                />
                <Button
                    disabled={!address.valid}
                    containerClassName="mb-3 mt-4"
                    title="Import"
                    onPress={() => props.onImport(address.value)}
                />
            </View>
        </View>
    )
}

interface ModalSelectMinerProps {
    poolId: string
    miners: MinerType[]
    onSelect: (minerPoolId: string) => void
}

export function ModalSelectMiner(props: ModalSelectMinerProps) {
    const { poolId, miners, onSelect } = props
    const [selectMiner, setSelectMiner] = useState("")

    return (
        <View
            className={`w-full bottom-0 bg-baseComponent rounded-t-full`}
            style={{ height: Dimensions.get('window').height * 0.8 }}
        >
            <View className="py-4">
                <CustomText className="text-primary text-lg font-PlusJakartaSansSemiBold text-center">
                    Choose a miner to add this pool
                </CustomText>
            </View>
            <FlatList
                data={miners}
                renderItem={({ item }) => (
                    <TouchableHighlight
                        className="flex-1 mx-3 my-1"
                        onPress={() => {
                            if(selectMiner === item.id)
                                setSelectMiner(``)
                            else
                                setSelectMiner(item.id)
                        }}
                    >
                        <View
                            className={twMerge(
                                "flex-row justify-between items-center bg-gray-800 p-2 rounded-lg border border-gray-800",
                                selectMiner === item.id && "border border-gold"
                            )}>
                            <View
                                className={`flex-row items-center`}
                            >
                                <HardHatIcon
                                    width={23}
                                    height={23}
                                    color={Colors.primary}
                                />
                                <View className="px-2">
                                    <CustomText className="text-primary font-PlusJakartaSans text-lg">
                                        {item.name}
                                    </CustomText>
                                    <CustomText className="text-primary font-PlusJakartaSans">
                                        {shortenAddress(item.address)}
                                    </CustomText>
                                </View>
                            </View>
                            <View className="bg-gold px-3 pb-2 pt-1 rounded-xl">
                                <CustomText className="text-black font-PlusJakartaSansSemiBold">Select</CustomText>
                            </View>
                        </View>
                    </TouchableHighlight>
                )}
            />
            <Button
                disabled={!selectMiner}
                containerClassName="my-4 rounded-none self-center"
                className="py-2 px-20 rounded-full"
                title="Add"
                onPress={() => onSelect(selectMiner)}
            />
        </View>
    )
}