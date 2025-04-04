import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Animated,
    Easing, DimensionValue,
    Dimensions,
    ViewStyle,
    Modal,
    TouchableWithoutFeedback,
    FlatList,
    TouchableHighlight,
    ViewProps,
    SafeAreaView,
    Keyboard,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { twMerge } from "tailwind-merge";

import { CustomText } from "./Texts";
import { Colors } from "@styles/index";
import { VerticalDotsIcon } from "@assets/icons";

export function KeyboardDismissPressable(props: ViewProps) {
    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
            <SafeAreaView {...props} />
        </TouchableWithoutFeedback>
    )
}

interface SkeletonProps {
    className?: string
    colors?: (string | number)[]
    width?: DimensionValue
    height?: DimensionValue
}

export function SkeletonLoader ({ 
    className, 
    colors = ['#374151', '#4b5563', '#374151']
  } : SkeletonProps){
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [])

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-Dimensions.get('screen').width, Dimensions.get('screen').width],
    })

    return (
        <View
            className={twMerge(`overflow-hidden bg-gray-700 rounded-lg`, className)}
        >
            <Animated.View
                className={"h-full w-7/12"}
                style={{ transform: [{ translateX }] }}
            >
                <LinearGradient
                    className="w-full h-full overflow-hidden"
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View className=" h-full w-12"/>
                </LinearGradient>
            </Animated.View>
        </View>
    )
}

interface OptionMenu {
    text?: string
    onPress?: () => void
}

interface OptionMenuProps {
    containerClassName?: string
    menu?: OptionMenu[],
    dropdownWidth?: 150,
    title?: string | null
    iconSize?: number | null
}

export function OptionMenu(props: OptionMenuProps){
    const { menu, dropdownWidth, title, iconSize = 20 } = props
    const buttonRef = useRef<InstanceType<typeof View> | null>(null)
    const dropdownRef = useRef<InstanceType<typeof View> | null>(null)
    const [showDropdown, setShowDropdown] = useState(false);
    const [buttonFrame, setButtonFrame] = useState({ x: 0, y: 0, w: 0, h: 0 })
    const [dropdownFrame, setDropdownFrame] = useState({ x: 0, y: 0, w: 0, h: 0 })

    const updatePosition = (callback?: () => void) => {
        if (dropdownRef.current?.measure) {
            dropdownRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setDropdownFrame({x: px, y: py, w: width, h: height})
            });
        }
        if (buttonRef.current?.measure) {
            buttonRef.current.measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
                setButtonFrame({x: px, y: py, w: width, h: height})
                callback && callback();
            });
        }
    }

    const show = () => {
        updatePosition(() => setShowDropdown(() => {
            return true
        }));
    }

    const hide = () => {
        setShowDropdown(false);
    }

    const calculationPosition = () => {
        const dimensions = Dimensions.get('window');
        const windowWidth = dimensions.width;
        const windowHeight = dimensions.height;
        const rightSpace = windowWidth - buttonFrame.x;
        const bottomSpace = windowHeight - (buttonFrame.y + buttonFrame.h);
        const showToRight = rightSpace >= buttonFrame.x
        const showToBottom = bottomSpace >= dropdownFrame.h + 10
    
        let positionStyle: ViewStyle = {};

        if (showToRight) {
            positionStyle.left = buttonFrame.x + buttonFrame.w
        } else {
            positionStyle.right = buttonFrame.w
        }

        if (showToBottom) {
            positionStyle.top = buttonFrame.y
        } else {
            positionStyle.bottom = 0 + (windowHeight - buttonFrame.y)
        }

        positionStyle = {
            ...positionStyle,
            maxWidth: windowWidth * 0.6,
            width: dropdownWidth ?? 150
        }

        return positionStyle;
    }
    
    const renderModal = () => {
        if (showDropdown && buttonFrame) {
            return (
                <Modal
                    className="w-full h-full p-0 m-0"
                    transparent
                    animationType='fade'
                    visible={true}
                    statusBarTranslucent={true}
                >
                    <TouchableWithoutFeedback disabled={!showDropdown} onPress={hide}>
                        <View className="flex-1 bg-[rgba(0,0,0,0.8)]">
                            <TouchableWithoutFeedback disabled={!showDropdown}>
                                <View
                                    onLayout={(event) => {
                                        const { height, width } = event.nativeEvent.layout
                                        setDropdownFrame((prev) => ({...prev, h: height, w: width }))
                                    }}
                                    className="absolute border border-solid border-md bg-baseBg justify-center"
                                    style={calculationPosition()}
                                >
                                    {title && <View className="border-solid border-b-[0.5px] border-gray-600 p-2">
                                        <CustomText
                                            className="font-plusJakartaSansBold text-gray-700"
                                        >
                                            {title}
                                        </CustomText>
                                    </View>}
                                    <FlatList 
                                        data={menu}
                                        className="border-gray-400"
                                        keyExtractor={(_, idx) => `option-menu-${idx.toString()}`}
                                        renderItem={(itemData) => (
                                            <TouchableHighlight
                                                className="border-solid border-b-[0.5px] border-gray-600"
                                                onPress={() => {
                                                    if(typeof itemData.item?.onPress === 'function') {
                                                        itemData.item.onPress()
                                                    }
                                                    hide();
                                                }}
                                            >
                                                <CustomText className="text-primary font-plusJakartaSansSemiBold p-3">
                                                    {itemData.item.text}
                                                </CustomText>
                                            </TouchableHighlight>
                                        )}
                                    />
                                </View>                        
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )
        }
    }
    
    return (
        <View>
            {renderModal()}
            <TouchableHighlight
                className={props.containerClassName}
                underlayColor={'transparent'}
                ref={buttonRef}
                onPress={show}
            >
                <VerticalDotsIcon
                    width={iconSize ?? 20}
                    height={iconSize ?? 20}
                    color={Colors.primary}
                />
            </TouchableHighlight>
        </View>
    );
}
