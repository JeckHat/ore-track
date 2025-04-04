import React, { forwardRef, ReactElement, Ref } from "react";
import { View, Pressable, Animated, TextInput, TextInputProps } from "react-native";

import { CustomText } from "./Texts";
import { twMerge } from "tailwind-merge";

interface InputProps extends TextInputProps {
  containerClassName?: string
  inputContainerClassName?: string
  isError?: boolean
  messageError?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(props: InputProps, ref: Ref<TextInput>) {
  const {
    containerClassName,
    inputContainerClassName,
    isError,
    messageError,
    ...otherProps
} = props;

  return (
    // <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
      </View> 
      {isError && <CustomText
        className="text-red-600 font-PlusJakartaSansSemiBold"
      >
        {messageError}
      </CustomText>}
    </View>
    // </TouchableWithoutFeedback>
  )
})
