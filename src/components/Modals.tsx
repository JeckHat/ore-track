import { ReactNode, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    BackHandler,
    Modal,
    NativeEventSubscription,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native";

import { CustomText } from "./Texts"

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
