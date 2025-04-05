import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"

import { RootState } from "@store/types"
import StartScreen from "@screens/StartScreen"
import RecoveryPhraseScreen from "@screens/RecoveryPhraseScreen"
import TabNavigation from "./BottomTabNavigation"
import RPCScreen from "@screens/RPCScreen"

const NativeStack = createNativeStackNavigator()

export default function MainNavigation() {
    const publicKey = useSelector((state: RootState) => state.wallet.publicKey)

    return (
        <NativeStack.Navigator initialRouteName={publicKey? "BottomTab" : "Start"}>
            <NativeStack.Screen
                name="Start"
                component={StartScreen}
                options={{ headerShown: false }}
            />
            <NativeStack.Screen
                name="RecoveryPhrase"
                component={RecoveryPhraseScreen}
                options={{ headerShown: false }}
            />
            <NativeStack.Screen
                name="BottomTab"
                component={TabNavigation}
                options={{ headerShown: false}}
            />
            <NativeStack.Screen
                name="RPC"
                component={RPCScreen}
                options={{ headerShown: false }}
            />
        </NativeStack.Navigator>
    )
}