import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { TabNavigationProps } from "./types"
import { Colors } from "@styles/index"
import { WalletIcon } from "@assets/icons"

import WalletScreen from "@screens/WalletScreen"

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
        </Tab.Navigator>
    )   
}