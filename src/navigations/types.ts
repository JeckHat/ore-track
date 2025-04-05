import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MainStackParamList = {
    Start: {} | undefined
    RecoveryPhrase: { importWallet?: boolean, words?: string, title?: string } | undefined
    BottomTab: {} | undefined
    Stake: { boost?: string, isDeposit?: boolean } | undefined
    RPC: {} | undefined
}

export type StartNavigationProps = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'Start'>
    route: RouteProp<MainStackParamList, 'Start'>
}

export type RecoveryPhraseNavigationProps = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'RecoveryPhrase'>
    route: RouteProp<MainStackParamList, 'RecoveryPhrase'>
}

export type TabNavigationProps = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'BottomTab'>
    route: RouteProp<MainStackParamList, 'BottomTab'>
}

type NavigationTabsParamList = {
    TabWallet: {} | undefined
    TabData: {} | undefined
    TabMine: {} | undefined
    TabStake: {} | undefined
    TabSetting: {} | undefined
}

export type TabStakeScreenProps = {
    navigation: CompositeNavigationProp<BottomTabNavigationProp<NavigationTabsParamList, 'TabStake'>, NativeStackNavigationProp<MainStackParamList, 'BottomTab'>>
    route: RouteProp<NavigationTabsParamList, 'TabStake'>
}

export type SettingScreenProps = {
    navigation: CompositeNavigationProp<BottomTabNavigationProp<NavigationTabsParamList, 'TabSetting'>, NativeStackNavigationProp<MainStackParamList, 'BottomTab'>>
    route: RouteProp<NavigationTabsParamList, 'TabSetting'>
}

export type StakeNavigationProps = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'Stake'>
    route: RouteProp<MainStackParamList, 'Stake'>
}

export type RPCNavigationProps = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'RPC'>
    route: RouteProp<MainStackParamList, 'RPC'>
}