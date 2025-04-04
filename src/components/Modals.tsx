import {
    ActivityIndicator,
    Modal,
    View,
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
