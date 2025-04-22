import { ReactElement } from "react"
import { Pressable, TouchableHighlight, View, ViewStyle } from "react-native"
import { twMerge } from "tailwind-merge"

import { CustomText } from "./Texts"

interface ButtonProps {
    style?: ViewStyle
    containerClassName?: string
    className?: string
    textClassName?: string
    title?: string | ReactElement
    disabled?: boolean
    underlayColor?: string
    onPress?: () => void
}

export function Button(props: ButtonProps) {
    const {
        containerClassName,
        className,
        textClassName,
        title,
        disabled,
        underlayColor,
        onPress
    } = props
    return (
        <TouchableHighlight
            underlayColor={underlayColor}
            className={twMerge(`overflow-hidden rounded-full`, containerClassName)}
            disabled={disabled}
            onPress={onPress}
        >
            <View
                className={twMerge(`px-6 bg-primary py-3 items-center ${disabled && "opacity-35"}`, className)}
            >
                <CustomText className={twMerge(`font-PlusJakartaSansBold text-black text-lg`, textClassName)}>{title}</CustomText>
            </View>
        </TouchableHighlight>
    )
}

interface ButtonIconProps {
    title: string
    icon: ReactElement
    onPress?: () => void
}

export function ButtonIcon(props: ButtonIconProps) {
    const { title, icon, onPress } = props
    return (
        <View className="items-center w-20 h-20">
            <TouchableHighlight
                className="rounded-full mb-1 overflow-hidden"
                onPress={onPress}
            >
                <View
                    className="bg-gray-800 w-12 h-12 items-center justify-center"
                >
                    {icon}
                </View>
            </TouchableHighlight>
            <CustomText className="font-PlusJakartaSansSemiBold text-primary text-sm">{title}</CustomText>
        </View>
    )
}

interface HeaderButtonProps { className?: string, icon: ReactElement, onPress?: () => void }

export function HeaderButton({ className, icon, onPress }: HeaderButtonProps) {
    return (
        <Pressable
            className={twMerge("mt-2 py-2", className)}
            onPress={onPress}
        >
            {icon}
        </Pressable>
    )
}
