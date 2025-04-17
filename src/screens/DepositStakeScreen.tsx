import { useEffect, useReducer } from "react";
import { Image, RefreshControl, SafeAreaView, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { twMerge } from "tailwind-merge";
import {
    AddressLookupTableAccount,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL,
    PublicKey,
    SendTransactionError,
    Transaction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { Button, CustomText, Input, ModalTransaction, OptionMenu } from "@components";
import { DepositStakeNavigationProps } from "@navigations/types";
import { BOOSTLIST, COMPUTE_UNIT_LIMIT, ORE_MINT, SOL_MINT, TOKENLIST } from "@constants";
import Images from "@assets/images";
import { RootState } from "@store/types";
import { depositStakeInstruction, getLiquidityPair, getStakeORE, tokenToLPInstruction } from "@services/ore";
import { getBalance, getPriorityFee } from "@services/solana";
import { getConnection } from "@providers";
import { getKeypair, uiActions } from "@store/actions";
import { useBottomModal } from "@hooks";
import { shortenAddress } from "@helpers";

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
        lpMint?: string
    },
    fee: number,
    currentEdit: 'tokenOre' | 'tokenPair'
    isValid: boolean
}

type FormAction =
    | {
        type: 'SET_FIELD'
        field: keyof Omit<FormState, 'currentEdit' | 'isValid' | 'stakeData' | 'fee'>
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
        shares?: number,
        lpMint?: string
    }
    | {
        type: 'SET_FEE'
        fee: number
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
    fee: 5000,
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
            if (state.stakeData.lpMint !== ORE_MINT) {
                isValid = isValid && state.tokenPair.limit >= (pairValue? parseFloat(pairValue) : 0)
            }
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
            if (action.lpMint !== ORE_MINT) {
                isValid = isValid && action.limitPair >= (pairValue? parseFloat(pairValue) : 0)
            }
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
                    lpMint: action.lpMint
                },
                isValid: isValid
            }
        }
        case 'SET_FEE': {
            return {
                ...state,
                fee: action.fee
            }
        }
        default:
            return state
    }
} 

export default function DepositStakeScreen({ navigation, route }: DepositStakeNavigationProps) {
    const boostAddress = route?.params?.boost ?? ""
    const boostData = BOOSTLIST[boostAddress]
    const pairDecimals = TOKENLIST[boostData.pairMint?? ""]?.decimals ?? 0
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey) ?? ""
    const dispatch = useDispatch()
    const [forms, onChangeForms] = useReducer(formReducer, initialState)
    const { showModal, hideModal } = useBottomModal()

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
            const [fee, balanceOre, stakeOre] = await Promise.all([
                getEstimateFee(),
                getBalance(walletAddress, ORE_MINT).then((res) => res),
                getStakeORE(ORE_MINT, boostAddress)
            ])
            onChangeForms({
                type: 'SET_STAKE_DATA',
                limitOre: balanceOre,
                limitPair: 0,
                unstake: balanceOre,
                staked: (stakeOre.stake.balance ?? 0) / Math.pow(10, stakeOre.decimals),
                ratio: 1.0,
                stakedOre: 0.0,
                stakedPair: 0.0,
                pairDecimals: pairDecimals,
                lpMint: boostData.lpMint
            })
        } catch(error) {
            console.log("error", error)
        }
    }

    async function loadDataPair() {
        try {
            const [fee, balanceOre, balancePair, unstakeBalance, liquidityPair] = await Promise.all([
                getEstimateFee(),
                getBalance(walletAddress, ORE_MINT).then((res) => res),
                getBalance(walletAddress, boostData?.pairMint ?? "").then((res) => res),
                getBalance(walletAddress, boostData?.lpMint ?? "").then((res) => res),
                getLiquidityPair(boostData.lpId, boostData.defi, route?.params?.boost ?? "")
            ])
            onChangeForms({
                type: 'SET_STAKE_DATA',
                limitOre: balanceOre,
                limitPair: balancePair,
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
            console.log("error", error)
        }
    }

    async function getEstimateFee(){
        const connection = getConnection()
        const walletPublicKey = new PublicKey(walletAddress)
        const mintPublicKey = new PublicKey(boostData?.lpMint)
        const mintAta = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey)
        const accountInfo = await connection.getAccountInfo(mintAta)

        let fee = 5000
        if (!accountInfo) {
            fee += 5000
        }
        onChangeForms({
            type: 'SET_FEE',
            fee: fee
        })
    }

    async function onDeposit() {
        try {
            const connection = getConnection()
            const walletPublicKey = new PublicKey(walletAddress)
            dispatch(uiActions.showLoading(true))

            // let Ok(token_a_balance) = token_a_balance.cloned() else {
            //     if amount_a_f64 > 0f64 {
            //         err.set(Some(TokenInputError::InsufficientBalance(
            //             liquidity_pair.token_a.clone(),
            //         ))); //
            //     }
            //     return Err(GatewayError::Unknown);
            // };
            // let Ok(token_b_balance) = token_b_balance.cloned() else {
            //     if amount_b_f64 > 0f64 {
            //         err.set(Some(TokenInputError::InsufficientBalance(
            //             liquidity_pair.token_b.clone(),
            //         )));
            //     }
            //     return Err(GatewayError::Unknown);
            // };

            const transaction = new Transaction()
    
            let instructions = []
            instructions.push(ComputeBudgetProgram.setComputeUnitLimit({
                units: COMPUTE_UNIT_LIMIT
            }))

            const tokenLpInstruction = await tokenToLPInstruction(boostData, forms.tokenOre.value, forms.tokenPair.value)
            instructions = [...instructions, ...tokenLpInstruction.instructions]

            const stakeInstruction = await depositStakeInstruction(boostData?.lpMint, boostAddress)
            instructions.push(stakeInstruction)

            let luts: AddressLookupTableAccount[] = []
            if (boostData.lut) {
                const res = await connection.getAddressLookupTable(new PublicKey(boostData.lut));
                const addressLookupTable = res.value;
            
                if (addressLookupTable) {
                    luts.push(addressLookupTable);
                }
            }
    
            let latestBlock = await connection.getLatestBlockhash();
            let messageV0 = new TransactionMessage({
                payerKey: walletPublicKey,
                recentBlockhash: latestBlock.blockhash,
                instructions: instructions,
            }).compileToV0Message(luts);
    
            let trx = new VersionedTransaction(messageV0);
            
            let fee = 0
            const trxFee = await connection.getFeeForMessage(trx.message, "confirmed")
            fee += (trxFee.value ?? 0)

            const priorityFee = await getPriorityFee(trx)
            instructions.splice(1, 0, ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }))
            fee += ((priorityFee * COMPUTE_UNIT_LIMIT) / 1_000_000)
        
            latestBlock = await connection.getLatestBlockhash('finalized')

            messageV0 = new TransactionMessage({
                payerKey: walletPublicKey,
                recentBlockhash: latestBlock.blockhash,
                instructions: instructions,
            }).compileToV0Message(luts);
            trx = new VersionedTransaction(messageV0);    
            transaction.add(...instructions)

            let tokenTransfers = [{
                id: 'ore',
                ticker: 'ORE',
                isLp: false,
                balance: (Math.round(Number(forms.tokenOre.value) * Math.pow(10, 5)) / Math.pow(10, 5)).toString(),
                tokenImage: 'OreToken',
                isMinus: true
            }]

            if(boostData?.pairMint) {
                if (boostData?.pairMint === SOL_MINT) {
                    let balance = Number(forms.tokenPair.value) + (tokenLpInstruction.feeAta / LAMPORTS_PER_SOL)
                    tokenTransfers.push({
                        id: 'sol',
                        ticker: 'SOL',
                        isLp: false,
                        balance: (Math.round(balance * Math.pow(10, 5)) / Math.pow(10, 5)).toString(),
                        tokenImage: boostData?.pairImage ?? "SolanaToken",
                        isMinus: true
                    })
                } else {
                    tokenTransfers.push({
                        id: boostData?.pairTicker?.toLocaleLowerCase() ?? 'id',
                        ticker: boostData?.pairTicker ?? 'SOL',
                        isLp: false,
                        balance: (Math.round(Number(forms.tokenPair.value) * Math.pow(10, 5)) / Math.pow(10, 5)).toString(),
                        tokenImage: boostData?.pairImage ?? "SolanaToken",
                        isMinus: true
                    })
                    if (tokenLpInstruction.feeAta > 0) {
                        tokenTransfers.push({
                            id: 'sol',
                            ticker: 'SOL',
                            isLp: false,
                            balance: (Math.round((tokenLpInstruction.feeAta / LAMPORTS_PER_SOL) * Math.pow(10, 5)) / Math.pow(10, 5)).toString(),
                            tokenImage: 'SolanaToken',
                            isMinus: true
                        })
                    }
                }
            }

            const transferInfo = [
                {
                    label: 'Account',
                    value: shortenAddress(walletAddress ?? "")
                },
                {
                    label: 'Network Fee',
                    value: `${(Math.round((fee / LAMPORTS_PER_SOL) * Math.pow(10, 6)) / Math.pow(10, 6))} SOL`
                }
            ]

            dispatch(uiActions.showLoading(false))
            onShowModal(tokenTransfers, transferInfo, trx)
        } catch(error: any | SendTransactionError) {
            console.log("error", error)
            console.log("logs", error.getLogs())
        }
    }

    async function onStake(amount?: number) {
        try{
            dispatch(uiActions.showLoading(true))
            const walletPublicKey = new PublicKey(walletAddress)
            let instructions = []
            
            instructions.push(ComputeBudgetProgram.setComputeUnitLimit({
                units: COMPUTE_UNIT_LIMIT
            }))

            const depositInstruction = await depositStakeInstruction(boostData?.lpMint, boostAddress, amount)
            instructions.push(depositInstruction)

            const connection = getConnection()
            let latestBlock = await connection.getLatestBlockhash();
            let messageV0 = new TransactionMessage({
                payerKey: walletPublicKey,
                recentBlockhash: latestBlock.blockhash,
                instructions: instructions,
            }).compileToLegacyMessage();
            let trx = new VersionedTransaction(messageV0)

            let fee = 0
            let trxFee = await connection.getFeeForMessage(trx.message, "confirmed")
            fee += (trxFee.value ?? 0)
            const priorityFee = await getPriorityFee(trx)
            fee += ((priorityFee * COMPUTE_UNIT_LIMIT) / 1_000_000)

            instructions.splice(1, 0, ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }))
            latestBlock = await connection.getLatestBlockhash();
            messageV0 = new TransactionMessage({
                payerKey: new PublicKey(walletAddress),
                recentBlockhash: latestBlock.blockhash,
                instructions: instructions,
            }).compileToLegacyMessage();
            trx = new VersionedTransaction(messageV0)

            const lpBalance = await getBalance(walletAddress, boostData?.lpMint)
            const tokenTransfers = [{
                id: boostData.name,
                ticker: boostData.name,
                isLp: boostData.pairImage? true : false,
                balance: amount
                    ? Math.round(amount * Math.pow(10, 5)) / Math.pow(10, 5)
                    : Math.round(lpBalance * Math.pow(10, 5)) / Math.pow(10, 5),
                tokenImage: 'OreToken',
                pairImage: boostData.pairImage,
                isMinus: true
            }]
            const transferInfo = [
                {
                    label: 'Account',
                    value: shortenAddress(walletAddress ?? "")
                },
                {
                    label: 'Network Fee',
                    value: `${(Math.round((fee / LAMPORTS_PER_SOL) * Math.pow(10, 6)) / Math.pow(10, 6))} SOL`
                }
            ]

            dispatch(uiActions.showLoading(false))
            onShowModal(tokenTransfers, transferInfo, trx)
        } catch(error: any | SendTransactionError) {
            dispatch(uiActions.showLoading(false))
            console.log("error", error)
            console.log("logs", error.getLogs())
        }
    }

    function onShowModal(tokenTransfers: any[], transferInfo: any[], transaction: VersionedTransaction) {
        const connection = getConnection()
        showModal(
            <ModalTransaction
                tokenTransfers={tokenTransfers}
                transferInfo={transferInfo}
                onClose={hideModal}
                onConfirm={async () => {
                    try {
                        hideModal()
                        dispatch(uiActions.showLoading(true))
                        const keypair = await getKeypair()
                        transaction.sign([keypair])    
                        
                        const signature = await connection.sendTransaction(transaction, {
                            skipPreflight: false,
                        });
                        await connection.confirmTransaction(signature, "confirmed")

                        setTimeout(() => {
                            loadData()
                            dispatch(uiActions.showLoading(false))
                        }, 5000)

                    } catch(error) {
                        console.log("error", error)
                        setTimeout(() => {
                            loadData()
                            dispatch(uiActions.showLoading(false))
                        }, 5000)
                    }
                }}
            />
        )
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
                        Deposit
                    </CustomText>
                    <OptionMenu
                        iconSize={16}
                        menu={[
                            {
                                text: 'Withdraw',
                                onPress: () => navigation.replace('WithdrawStake', {
                                    ...route.params,
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
                    <CustomText className="text-primary font-PlusJakartaSansBold">
                        {forms.fee / LAMPORTS_PER_SOL} SOL
                    </CustomText>
                </View>
                <Button
                    disabled={!forms.isValid}
                    title={"Deposit"}
                    onPress={boostData.lpMint === ORE_MINT? () => onStake(Number(forms.tokenOre.value)) : onDeposit}
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
                            title={"Stake Token"}
                            onPress={() => onStake()}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}