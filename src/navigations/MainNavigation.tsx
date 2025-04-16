import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"

import { Colors, Fonts } from "@styles"
import { RootState } from "@store/types"

import StartScreen from "@screens/StartScreen"
import PrivateKeyScreen from "@screens/PrivateKeyScreen"
import TabNavigation from "./BottomTabNavigation"
import RPCScreen from "@screens/RPCScreen"
import DepositStakeScreen from "@screens/DepositStakeScreen"
import WithdrawStakeScreen from "@screens/WithdrawStakeScreen"

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
                name="PrivateKey"
                component={PrivateKeyScreen}
                options={{ headerShown: false }}
            />
            <NativeStack.Screen
                name="BottomTab"
                component={TabNavigation}
                options={{ headerShown: false}}
            />
            <NativeStack.Screen
                name="DepositStake"
                component={DepositStakeScreen}
                options={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontFamily: Fonts.PlusJakartaSansSemiBold,
                        color: Colors.primary,
                        
                    },
                    headerStyle: { backgroundColor: Colors.baseBg }
                }}
            />
            <NativeStack.Screen
                name="WithdrawStake"
                component={WithdrawStakeScreen}
                options={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontFamily: Fonts.PlusJakartaSansSemiBold,
                        color: Colors.primary,
                        
                    },
                    headerStyle: { backgroundColor: Colors.baseBg }
                }}
            />
            {/* <NativeStack.Screen
                name="Stake"
                component={StakeScreen}
                options={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontFamily: Fonts.PlusJakartaSansSemiBold,
                        color: Colors.primary,
                        
                    },
                    headerStyle: { backgroundColor: Colors.baseBg }
                }}
            /> */}
            <NativeStack.Screen
                name="RPC"
                component={RPCScreen}
                options={{ headerShown: false }}
            />
        </NativeStack.Navigator>
    )
}