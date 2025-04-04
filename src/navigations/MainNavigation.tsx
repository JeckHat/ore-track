import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"

import { RootState } from "@store/types"
import StartScreen from "@screens/StartScreen"

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
        </NativeStack.Navigator>
    )
}