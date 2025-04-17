import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { TabNavigationProps } from "./types"
import { Colors, Fonts } from "@styles"
import { DataIcon, SettingIcon, StakeIcon, WalletIcon } from "@assets/icons"

import TabWalletScreen from "@screens/wallet/TabWalletScreen"
import TabPoolScreen from "@screens/pool/TabPoolScreen"
import TabStakeScreen from "@screens/stake/TabStakeScreen"
import TabSettingScreen from "@screens/settings/TabSettingScreen"

const Tab = createBottomTabNavigator()

export default function TabNavigation(props: TabNavigationProps) {
    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.baseBg
                },
                headerTitleStyle: {
                    color: Colors.primary,
                    fontFamily: Fonts.PlusJakartaSansBold,
                    fontSize: 18
                },
                headerTitleAllowFontScaling: false,
                tabBarStyle: {
                    backgroundColor: Colors.baseComponent,
                    position: 'absolute',
                    borderTopWidth: 0,
            
                },
                tabBarLabelStyle: {
                    display: 'none',
                    
                },
                tabBarItemStyle: {
                    overflow: 'hidden',
                    paddingTop: 6,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#4b5563',
                lazy: true
            }}
        >
            <Tab.Screen
                name="TabWallet"
                component={TabWalletScreen}
                options={{
                    headerTitle: 'Wallet',
                    tabBarIcon({ color, size }) {
                        return <WalletIcon width={size} height={size} color={color} />
                    },
                    lazy: true
                }}
            />
            <Tab.Screen
                name="TabPool"
                component={TabPoolScreen}
                options={{
                    headerTitle: 'Pools',
                    tabBarIcon({ color, size }) {
                        return <DataIcon width={size} height={size} color={color} />
                    },
                    lazy: true
                }}
            />
            <Tab.Screen
                name="TabStake"
                component={TabStakeScreen}
                options={{
                    headerTitle: 'Stake',
                    tabBarIcon({ color, size }) {
                        return <StakeIcon width={size} height={size} fill={color} />
                    },
                    lazy: true
                }}
            />
            <Tab.Screen
                name="TabSetting"
                component={TabSettingScreen}
                options={{
                    headerTitle: 'Settings',
                    tabBarIcon({ color, size }) {
                        return <SettingIcon width={size} height={size} color={color} />
                    },
                    lazy: true
                }}
            />
        </Tab.Navigator>
    )   
}