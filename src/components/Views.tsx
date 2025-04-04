import React from "react";
import {
    TouchableWithoutFeedback,
    ViewProps,
    SafeAreaView,
    Keyboard,
} from "react-native";

export function KeyboardDismissPressable(props: ViewProps) {
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
            <SafeAreaView {...props} />
        </TouchableWithoutFeedback>
    )
}