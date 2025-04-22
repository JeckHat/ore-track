import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useSelector } from "react-redux"

import { Colors, Fonts } from "@styles"
import { RootState } from "@store/types"

import StartScreen from "@screens/startup/StartScreen"
import TabNavigation from "./BottomTabNavigation"
// wallet
import ReceiveScreen from "@screens/wallet/ReceiveScreen"
// stake
import DepositStakeScreen from "@screens/stake/DepositStakeScreen"
import WithdrawStakeScreen from "@screens/stake/WithdrawStakeScreen"
// settings
import RPCScreen from "@screens/settings/RPCScreen"
import PrivateKeyScreen from "@screens/settings/PrivateKeyScreen"
import TokenScreen from "@screens/wallet/TokenScreen"
import ManagePoolScreen, { screenOptions as managePoolOptions } from "@screens/pool/ManagePoolScreen"

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
                name="ManagePool"
                component={ManagePoolScreen}
                options={managePoolOptions}
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
            <NativeStack.Screen
                name="Receive"
                component={ReceiveScreen}
                options={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontFamily: Fonts.PlusJakartaSansSemiBold,
                        color: Colors.primary,
                    },
                    // headerTitleAlign: 'center',
                    // headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: Colors.baseBg }
                }}
            />
            <NativeStack.Screen
                name="Token"
                component={TokenScreen}
                options={{
                    headerTintColor: Colors.primary,
                    headerTitleStyle: {
                        fontFamily: Fonts.PlusJakartaSansSemiBold,
                        color: Colors.primary,
                    },
                    // headerTitleAlign: 'center',
                    // headerTitleAlign: 'center',
                    headerStyle: { backgroundColor: Colors.baseBg }
                }}
            />
            <NativeStack.Screen
                name="RPC"
                component={RPCScreen}
                options={{ headerShown: false }}
            />
        </NativeStack.Navigator>
    )
}