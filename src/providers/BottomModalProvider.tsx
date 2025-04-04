import { createContext, ReactNode, useRef, useState } from "react"
import { Animated, Dimensions, PanResponder } from "react-native"

import { BottomModal } from "@components"

interface ModalContextType {
    showModal: (content?: ReactNode, cancelable?: boolean) => void;
    hideModal: () => void;
}

export const BottomModalContext = createContext<ModalContextType | undefined>(undefined)

type BottomModalProvider = {
    cancelable?: boolean
    children: ReactNode
}

export function BottomModalProvider(props: BottomModalProvider) {
    const { cancelable = true, children } = props

    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState<ReactNode>(null)

    const { height } = Dimensions.get("window")
    const translateY = useRef(new Animated.Value(height)).current
    const backdropOpacity = useRef(new Animated.Value(0)).current
  
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            // onMoveShouldSetPanResponder: (evt, gestureState) => {
            //     const { dx, dy } = gestureState
            //     return dx > 10 || dx < -10 || dy > 10 || dy < -10
            // },
            // onMoveShouldSetPanResponderCapture: (_, gestureState) => {
            //     const { dx, dy } = gestureState
            //     return dx > 10 || dx < -10 || dy > 10 || dy < -10
            // },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    hideModal();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current

    function showModal(content: ReactNode) {
        setModalContent(content);
        setModalVisible(true);
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                damping: 18,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }

    function hideModal() {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
            setModalContent(null);
        })
    }
    
    return (
        <BottomModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            <BottomModal
                visible={modalVisible}
                hideModal={hideModal}
                containerStyle={{
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    transform: [{ translateY }],
                }}
                backdropOpacity={backdropOpacity}
                cancelable={cancelable}
            >
                {modalContent}
            </BottomModal>
        </BottomModalContext.Provider>
    )
}