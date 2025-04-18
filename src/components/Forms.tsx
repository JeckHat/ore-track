import React, { forwardRef, ReactElement, ReactNode, Ref } from "react";
import { View, Pressable, Animated, TextInput, TextInputProps } from "react-native";
import { twMerge } from "tailwind-merge";

import { CustomText } from "./Texts";

interface InputProps extends TextInputProps {
  containerClassName?: string
  inputContainerClassName?: string
  isError?: boolean
  messageError?: string
  suffix?: ReactNode
}

export const Input = forwardRef<TextInput, InputProps>(function Input(props: InputProps, ref: Ref<TextInput>) {
  const {
    containerClassName,
    inputContainerClassName,
    isError,
    messageError,
    suffix,
    ...otherProps
} = props;

  return (
    <View className={`${containerClassName}`}>
      <View
        className={twMerge(`bg-baseComponent px-2 rounded-xl border border-solid border-gray-800 mb-1 ${isError && "border-red-600"}`, inputContainerClassName)}
      >
        <TextInput
          allowFontScaling={false}
          {...otherProps}
          className={twMerge('w-full', otherProps.className)}
          ref={ref}
        />
        {suffix}
      </View> 
      {isError && <CustomText
        className="text-red-600 font-PlusJakartaSansSemiBold"
      >
        {messageError}
      </CustomText>}
    </View>
  )
})

interface CheckBoxProps {
  containerClassName?: string
  label?: string | ReactElement
  value?: boolean
  onChange?: (value: boolean) => void
}

export const CheckBox = forwardRef<View, CheckBoxProps>(function CheckBox(props: CheckBoxProps, ref: Ref<View>) {
  const scale = new Animated.Value(1);

  function handlePress() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (props.onChange) props.onChange(!props.value);
  };

  return (
    <View
      ref={ref}
      className={twMerge(`flex-row justify-center items-center`, props.containerClassName)}
    >
      <Pressable onPress={handlePress}>
        <Animated.View
          className={`w-8 h-8 border-2 border-solid ${props.value? "bg-primary border-primary" : "bg-transparent border-lowEmphasis"} mr-3 justify-center items-center rounded-full`}
          style={{ transform: [{ scale }] }}
        >
          {props.value && <CustomText className="text-baseBg text-sm font-PlusJakartaSansBold">✔</CustomText>}
        </Animated.View>
      </Pressable>
      {props.label && <CustomText className='text-primary font-PlusJakartaSans mr-3'>{props.label}</CustomText>}
    </View>
  )
})
