import { useEffect, useReducer, useState } from "react";
import { Image, RefreshControl, SafeAreaView, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { twMerge } from "tailwind-merge";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { Button, CustomText, Input, OptionMenu } from "@components";
import { StakeNavigationProps } from "@navigations/types";
import { BOOSTLIST, ORE_MINT, TOKENLIST } from "@constants";
import Images from "@assets/images";
import { RootState } from "@store/types";
import { getLiquidityPair, getStakeORE } from "@services/ore";
import { getBalance } from "@services/solana";

interface FormState {
    tokenOre: {
        limit: number
        value: string
        touched: boolean
        valid: boolean
    },
    tokenPair: {
        limit: number
        value: string
        touched: boolean
        valid: boolean
    },
    stakeData: {
        unstake: number
        staked: number
        stakedOre: number
        stakedPair: number
        ratio: number
        shares: number
        lpBalanceOre: number
        lpBalancePair: number
    },
    currentEdit: 'tokenOre' | 'tokenPair'
    isValid: boolean
}

type FormAction =
    | {
        type: 'SET_FIELD'
        field: keyof Omit<FormState, 'currentEdit' | 'isValid' | 'stakeData'>
        pairDecimals: number
        value: string
    }
    | {
        type: 'SET_STAKE_DATA'
        ratio: number
        limitOre: number
        limitPair: number
        unstake: number
        staked: number
        stakedOre: number
        stakedPair: number
        pairDecimals: number
        lpBalanceOre?: number
        lpBalancePair?: number
        shares?: number
    }

const initialState: FormState = {
    tokenOre: {
        limit: 0.0,        
        touched: false,
        valid: false,
        value: "",
    },
    tokenPair: {
        limit: 0.0,
        touched: false,
        valid: false,
        value: "",
    },
    stakeData: {
        unstake: 0.0,
        staked: 0.0,
        stakedOre: 0.0,
        stakedPair: 0.0,
        ratio: 1.0,
        shares: 0.0,
        lpBalanceOre: 0.0,
        lpBalancePair: 0.0
    },
    currentEdit: 'tokenOre',
    isValid: false
};


function formReducer(state: FormState, action: FormAction): FormState {
    switch(action.type) {
        case 'SET_FIELD': {
            let oreValue = ""
            let pairValue = ""
            if (action.field === 'tokenOre') {
                oreValue = action.value
                pairValue = action.value? (Math.floor((parseFloat(action.value) / state.stakeData.ratio) 
                    * Math.pow(10, action.pairDecimals)) / Math.pow(10, action.pairDecimals))
                    .toString() : ""
            } else {
                pairValue = action.value
                oreValue = action.value? (Math.floor((parseFloat(action.value) * state.stakeData.ratio) 
                    * Math.pow(10, 11)) / Math.pow(10, 11)).toString() : ""
            }
            let isValid = true
            isValid = isValid && !!action.value
            isValid = isValid && state.tokenOre.limit >= (oreValue? parseFloat(oreValue) : 0)
            isValid = isValid && state.tokenPair.limit >= (pairValue? parseFloat(pairValue) : 0)
            return {
                ...state,
                tokenOre: {
                    ...state.tokenOre,
                    touched: true,
                    value: oreValue,
                    valid: state.tokenOre.limit >= (oreValue? parseFloat(oreValue) : 0) 
                },
                tokenPair: {
                    ...state.tokenPair,
                    touched: true,
                    value: pairValue,
                    valid: state.tokenPair.limit >= (pairValue? parseFloat(pairValue) : 0) 
                },
                currentEdit: action.field,
                isValid: isValid
            }
        }
        case 'SET_STAKE_DATA': {
            let oreValue = ""
            let pairValue = ""
            if (state.currentEdit === 'tokenOre') {
                oreValue = state.tokenOre.value
                pairValue = oreValue? (Math.floor((parseFloat(oreValue) / action.ratio) 
                    * Math.pow(10, action.pairDecimals)) / Math.pow(10, action.pairDecimals))
                    .toString() : ""
            } else {
                pairValue = state.tokenPair.value
                oreValue = pairValue? (Math.floor((parseFloat(pairValue) * action.ratio) 
                    * Math.pow(10, 11)) / Math.pow(10, 11)).toString() : ""
            }
            let isValid = true
            isValid = isValid && !!oreValue
            isValid = isValid && !!pairValue
            isValid = isValid && action.limitOre >= (oreValue? parseFloat(oreValue) : 0)
            isValid = isValid && action.limitPair >= (pairValue? parseFloat(pairValue) : 0)
            return {
                ...state,
                tokenOre: {
                    ...state.tokenOre,
                    limit: action.limitOre,
                    valid: action.limitOre >= (oreValue? parseFloat(oreValue) : 0),
                    value: oreValue
                },
                tokenPair: {
                    ...state.tokenPair,
                    limit: action.limitPair,
                    valid: action.limitPair >= (pairValue? parseFloat(pairValue) : 0),
                    value: pairValue
                },
                stakeData: {
                    ...state.stakeData,
                    ratio: action.ratio,
                    unstake: action.unstake,
                    staked: action.staked,
                    stakedOre: action.stakedOre,
                    stakedPair: action.stakedPair,
                    lpBalanceOre: action.lpBalanceOre ?? 0,
                    lpBalancePair: action.lpBalancePair ?? 0,
                    shares: action.shares ?? 0,
                },
                isValid: isValid
            }
        }
        default:
            return state
    }
} 

export default function StakeScreen({ navigation, route }: StakeNavigationProps) {
    const boostAddress = route?.params?.boost ?? ""
    const boostData = BOOSTLIST[boostAddress]
    const pairDecimals = TOKENLIST[boostData.pairMint?? ""]?.decimals ?? 0
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""

    const [forms, onChangeForms] = useReducer(formReducer, initialState)
    const [priorityFee, setPriorityFee] = useState(5000 / LAMPORTS_PER_SOL)

    useEffect(() => {
        const interval = setInterval(() => {
            loadData()
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    function loadData() {
        if(boostData?.pairMint) {
            loadDataPair()
        } else {
            loadDataOre()
        }
    }

    async function loadDataOre() {
        try {
            const [balanceOre, stakeOre] = await Promise.all([
                getBalance(walletAddress, ORE_MINT).then((res) => res),
                getStakeORE(ORE_MINT, boostAddress)
            ])
            onChangeForms({
                type: 'SET_STAKE_DATA',
                limitOre: route.params?.isDeposit? balanceOre : (stakeOre.stake.balance ?? 0) / Math.pow(10, stakeOre.decimals),
                limitPair: 0,
                unstake: balanceOre,
                staked: (stakeOre.stake.balance ?? 0) / Math.pow(10, stakeOre.decimals),
                ratio: 1.0,
                stakedOre: 0.0,
                stakedPair: 0.0,
                pairDecimals: pairDecimals
            })
        } catch(error) {

        }
    }

    async function loadDataPair() {
        try {
            const [balanceOre, balancePair, unstakeBalance, liquidityPair] = await Promise.all([
                getBalance(walletAddress, ORE_MINT).then((res) => res),
                getBalance(walletAddress, boostData?.pairMint ?? "").then((res) => res),
                getBalance(walletAddress, boostData?.lpMint ?? "").then((res) => res),
                getLiquidityPair(boostData.lpId, boostData.defi, route?.params?.boost ?? "")
            ])
            onChangeForms({
                type: 'SET_STAKE_DATA',
                limitOre: route.params?.isDeposit? balanceOre : liquidityPair.stakeAmountORE,
                limitPair: route.params?.isDeposit? balancePair : liquidityPair.stakeAmountPair,
                unstake: unstakeBalance,
                staked: liquidityPair.stakeBalance,
                ratio: (liquidityPair?.LPBalanceORE ?? 0) / (liquidityPair?.LPBalancePair ?? 1),
                stakedOre: liquidityPair.stakeAmountORE,
                stakedPair: liquidityPair.stakeAmountPair,
                lpBalanceOre: liquidityPair.LPBalanceORE,
                lpBalancePair: liquidityPair.LPBalancePair,
                shares: liquidityPair.shares,
                pairDecimals: pairDecimals
            })
        } catch(error) {

        }
    }
    
    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <ScrollView
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadData}/>}
                contentContainerClassName="grow-1 pb-[52px]"
            >
                <CustomText className="text-primary font-PlusJakartaSansBold mx-3 mt-4 text-2xl">Stake {boostData.name}</CustomText>
                <CustomText className="text-[#707070] font-PlusJakartaSansSemiBold mx-3 text-md">Manage your {boostData.name} position.</CustomText>
                <View className="flex-row items-center mt-4 mx-3">
                    <CustomText className="text-primary font-PlusJakartaSansBold text-lg mr-2">
                        {route.params?.isDeposit? "Deposit" : "Withdraw"}
                    </CustomText>
                    <OptionMenu
                        iconSize={16}
                        menu={[
                            {
                                text: 'Deposit',
                                onPress: () => navigation.replace('Stake', {
                                    ...route.params,
                                    isDeposit: true
                                })
                            },
                            {
                                text: 'Withdraw',
                                onPress: () => navigation.replace('Stake', {
                                    ...route.params,
                                    isDeposit: false
                                })
                            }
                        ]}
                    />
                </View>
                <View className="m-2 border border-gray-800 border-solid rounded-2xl">
                    <View className="flex-row justify-between items-center gap-x-2 mx-2 mt-4 mb-2">
                        <View>
                            <CustomText className="font-PlusJakartaSansSemiBold text-sm text-[#707070]">DEPOSIT</CustomText>
                        </View>
                        <View className="flex-row items-center gap-x-2">
                            <CustomText
                                className="font-PlusJakartaSansSemiBold text-sm text-[#707070]"
                            >
                                {Math.floor(forms.tokenOre.limit * Math.pow(10, 11)) / Math.pow(10, 11)}
                            </CustomText>
                            <Button
                                containerClassName="rounded-lg"
                                className="py-1 px-3 bg-[#1D1C22]"
                                textClassName="font-PlusJakartaSansBold text-sm text-[#707070]"
                                title="HALF"
                                onPress={() => onChangeForms({
                                    type: 'SET_FIELD',
                                    field: 'tokenOre',
                                    value: (forms.tokenOre.limit / 2).toFixed(11),
                                    pairDecimals: pairDecimals
                                })}
                            />
                            <Button
                                containerClassName="rounded-lg"
                                className="py-1 px-3 bg-[#1D1C22]"
                                textClassName="font-PlusJakartaSansBold text-sm text-[#707070]"
                                title="MAX"
                                onPress={() => onChangeForms({
                                    type: 'SET_FIELD',
                                    field: 'tokenOre',
                                    value: forms.tokenOre.limit.toString(),
                                    pairDecimals: pairDecimals
                                })}
                            />
                        </View>
                    </View>
                    <View className="flex-row pl-2 pb-4 items-center mt-2 border-b-[0.5px] border-gray-800 border-solid">
                        <Image
                            className="h-8 w-8 mr-1"
                            source={Images.OreToken}
                        />
                        <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">ORE</CustomText>
                        <Input
                            containerClassName="flex-1 ml-4 border-none"
                            inputContainerClassName="border-none border-0 bg-transparent items-end"
                            className={twMerge("font-LatoBold text-lg py-0 text-primary text-right", forms.tokenOre.touched && !forms.tokenOre.valid && "text-red-600")}
                            keyboardType='number-pad'
                            value={forms.tokenOre.value}
                            onChangeText={(text) => onChangeForms({
                                type: 'SET_FIELD',
                                field: 'tokenOre',
                                value: text,
                                pairDecimals: pairDecimals
                            })}
                        />
                    </View>

                    {boostData?.pairMint && <View className="w-full self-end flex-row justify-between items-center gap-x-2 px-2 mb-2 pt-2 border-t-[0.5px] border-gray-800 border-solid">
                        <View>
                            <CustomText className="font-PlusJakartaSansSemiBold text-sm text-[#707070]">AND</CustomText>
                        </View>
                        <View className="flex-row items-center gap-x-2">
                            <CustomText
                                className="font-PlusJakartaSansSemiBold text-sm text-[#707070]"
                            >
                                {Math.floor(forms.tokenPair.limit * Math.pow(10, pairDecimals)) / Math.pow(10, pairDecimals)}
                            </CustomText>
                            <Button
                                containerClassName="rounded-lg"
                                className="py-1 px-3 bg-[#1D1C22]"
                                textClassName="font-PlusJakartaSansBold text-sm text-[#707070]"
                                title="HALF"
                                onPress={() => onChangeForms({
                                    type: 'SET_FIELD',
                                    field: 'tokenPair',
                                    value: (forms.tokenPair.limit / 2).toFixed(pairDecimals),
                                    pairDecimals: pairDecimals
                                })}
                            />
                            <Button
                                containerClassName="rounded-lg"
                                className="py-1 px-3 bg-[#1D1C22]"
                                textClassName="font-PlusJakartaSansBold text-sm text-[#707070]"
                                title="MAX"
                                onPress={() => onChangeForms({
                                    type: 'SET_FIELD',
                                    field: 'tokenPair',
                                    value: forms.tokenPair.limit.toString(),
                                    pairDecimals: pairDecimals
                                })}
                            />
                        </View>
                    </View>}
                    {boostData?.pairMint && <View className="flex-row pl-2 mb-4 items-center">
                        <Image
                            className="h-8 w-8 mr-1"
                            source={Images[boostData.pairImage as keyof typeof Images]}
                        />
                        <CustomText className="font-PlusJakartaSansSemiBold text-lg text-primary">{TOKENLIST[boostData.pairMint?? ""].ticker}</CustomText>
                        <Input
                            containerClassName="flex-1 ml-4 border-none"
                            inputContainerClassName="border-none border-0 bg-transparent items-end"
                            className={twMerge("font-LatoBold text-lg py-0 text-primary text-right", forms.tokenPair.touched && !forms.tokenPair.valid && "text-red-600")}
                            keyboardType='number-pad'
                            value={forms.tokenPair.value}
                            onChangeText={(text) => onChangeForms({
                                type: 'SET_FIELD',
                                field: 'tokenPair',
                                value: text,
                                pairDecimals: pairDecimals
                            })}
                        />
                    </View>}
                </View>
                <View className="flex-row justify-between mx-4 mt-2 mb-4">
                    <CustomText className="text-primary font-PlusJakartaSansBold">Transaction fee</CustomText>
                    <CustomText className="text-primary font-PlusJakartaSansBold">{priorityFee} SOL</CustomText>
                </View>
                <Button
                    disabled={!forms.isValid}
                    title={route.params?.isDeposit? "Deposit" : "Withdraw"}
                    onPress={() => {}}
                />
                <View className="mt-8 mx-3 mb-2">
                    <CustomText className="text-primary font-PlusJakartaSansSemiBold text-xl">Account Info</CustomText>
                    <View className="my-2 flex-row justify-between">
                        <CustomText className="text-primary font-PlusJakartaSansSemiBold text-lg mt-1">Deposits</CustomText>
                        <View className="items-end flex-1">
                            <View className="flex-row items-center">
                                {!boostData?.pairMint && <View className="w-14 h-10 items-center justify-center">
                                    <Image
                                        className="w-8 h-8"
                                        source={Images.OreToken}
                                    />
                                </View>}
                                {boostData?.pairMint && <View className="w-14 h-10 items-center justify-center">
                                    <Image
                                        className="w-6 h-6 absolute right-2"
                                        source={Images[boostData.pairImage as keyof typeof Images]}
                                    />
                                    <Image
                                        className="w-6 h-6"
                                        source={Images.OreToken}
                                    />
                                </View>}
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {forms.stakeData.staked} {TOKENLIST[boostData.lpMint].ticker}
                                </CustomText>
                            </View>
                            {boostData?.pairMint && <View className="flex-row items-center">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">(</CustomText>
                                <Image
                                    className="w-6 h-6 ml-2 mr-1"
                                    source={Images.OreToken}
                                />
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {forms.stakeData.stakedOre.toFixed(4)} ORE
                                </CustomText>
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">/</CustomText>
                                <Image
                                          className="w-6 h-6 ml-2 mr-1"
                                    source={Images[boostData.pairImage as keyof typeof Images]}
                                />
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {forms.stakeData.stakedPair.toFixed(4)} {TOKENLIST[boostData.pairMint ?? ""].ticker}
                                </CustomText>
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">)</CustomText>
                            </View>}
                        </View>
                    </View>
                    {boostData?.pairMint && forms.stakeData.unstake > 0 && <View className="mt-2 flex-row justify-between">
                        <CustomText className="text-primary font-PlusJakartaSansSemiBold text-lg mt-1">Unstaked</CustomText>
                        <View className="items-end">
                            <View className="flex-row items-center">
                                <View className="w-14 h-10 items-center justify-center">
                                    <Image
                                        className="w-6 h-6 absolute right-2"
                                        source={Images[boostData.pairImage as keyof typeof Images]}
                                    />
                                    <Image
                                        className="w-6 h-6"
                                        source={Images.OreToken}
                                    />
                                </View>
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {forms.stakeData.unstake} {TOKENLIST[boostData.lpMint].ticker}
                                </CustomText>
                            </View>
                            <View className="flex-row items-center">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">(</CustomText>
                                <Image
                                    className="w-6 h-6 ml-2 mr-1"
                                    source={Images.OreToken}
                                />
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {(forms.stakeData.lpBalanceOre * (forms.stakeData.unstake * Math.pow(10, boostData.decimals)) / forms.stakeData.shares).toFixed(4)} ORE
                                </CustomText>
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">/</CustomText>
                                <Image
                                    className="w-6 h-6 ml-2 mr-1"
                                    source={Images[boostData.pairImage as keyof typeof Images]}
                                />
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm">
                                    {(forms.stakeData.lpBalancePair * (forms.stakeData.unstake * Math.pow(10, boostData.decimals)) / forms.stakeData.shares)
                                        .toFixed(4)} {TOKENLIST[boostData.pairMint ?? ""].ticker}
                                </CustomText>
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold text-sm ml-2">)</CustomText>
                            </View>
                        </View>
                    </View>}
                </View>
                {boostData?.pairMint && forms.stakeData.unstake > 0 && (
                    <View className="flex-row self-end">
                        <Button
                            containerClassName="rounded-none mr-2"
                            className="py-2 px-6 rounded-full"
                            textClassName="text-sm mb-[1px]"
                            disabled={forms.stakeData.unstake <= 0}
                            title={route.params?.isDeposit? "Stake Token" : "Withdraw Token"}
                            onPress={() => {}}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}