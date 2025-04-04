import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { TabNavigationProps } from "./types"
import { Colors } from "@styles"
import { SettingIcon, StakeIcon, WalletIcon } from "@assets/icons"

import WalletScreen from "@screens/WalletScreen"
import SettingScreen from "@screens/SettingScreen"
import StakeDataScreen from "@screens/StakeDataScreen"

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
                    fontFamily: 'PlusJakartaSans-Bold',
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
                component={WalletScreen}
                options={{
                    headerTitle: 'Wallet',
                    tabBarIcon({ color, size }) {
                        return <WalletIcon width={size} height={size} color={color} />
                    },
                    lazy: true
                }}
            />
            <Tab.Screen
                name="TabStake"
                component={StakeDataScreen}
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
                component={SettingScreen}
                options={{
                    headerTitle: 'Wallet',
                    tabBarIcon({ color, size }) {
                        return <SettingIcon width={size} height={size} color={color} />
                    },
                    lazy: true
                }}
            />
        </Tab.Navigator>
    )   
}