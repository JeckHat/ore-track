import { useCallback, useState } from "react"
import { Image, RefreshControl, SafeAreaView, ScrollView, View } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import {
    ComputeBudgetProgram,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction
} from "@solana/web3.js"
import { useDispatch, useSelector } from "react-redux"

import { Button, CustomText, SkeletonLoader, OptionMenu, ModalTransaction } from "@components"
import Images from "@assets/images"
import { BOOSTLIST, COMPUTE_UNIT_LIMIT, JUP_API_PRICE, ORE_MINT } from "@constants"
import { boostActions, getKeypair, uiActions } from "@store/actions"
import { CustomError } from "@models"
import { RootState } from "@store/types"
import { TabStakeScreenProps } from "@navigations/types"
import { useBottomModal } from "@hooks"
import { claimStakeOREInstruction, getStakeORE } from "@services/ore"
import { shortenAddress } from "@helpers"
import { getPriorityFee } from "@services/solana"

export default function TabStakeScreen(props: TabStakeScreenProps) {
    const [orePrice, setOrePrice] = useState(0.0)
    const [loading, setLoading] = useState(true)
    const dispatch = useDispatch()
    const { showModal, hideModal } = useBottomModal()

    const boostData = useSelector((state: RootState) => state.boost)
    const rpcUrl = useSelector((state: RootState) => state.config.rpcUrl)
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey)

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [])
    )

    async function loadData() {
        try {
            await Promise.all([
                loadStakes(),
                loadPrice(),
                getLPAmount()
            ])
        } catch(error) {
            console.log("error", error)
        }
    }

    async function loadStakes() {
        const promises = Object.keys(BOOSTLIST).map((boost) => {
            return getStakeORE(BOOSTLIST[boost].lpMint, boost)
        })

        await Promise.all(promises)
        await dispatch(boostActions.updateAllRewards())
        setLoading(false)
    }

    async function loadPrice() {
        try {
            const response = await fetch(`${JUP_API_PRICE}${ORE_MINT}`, {
                method: 'GET'
            })

            const resData = await response.json()
            setOrePrice(parseFloat(resData.data[ORE_MINT].price))
        } catch(error) {
            console.log("error", error)
        }
    }

    async function getLPAmount() {
        try {

        } catch(error) {

        }
    }

    async function onClaimAll() {
        try {
            dispatch(uiActions.showLoading(true))
            if (!rpcUrl) {
                throw new CustomError("Rpc is undefined", 500)
            }
        
            if (!walletAddress) {
                throw new CustomError("Public Key is undefined", 500)
            }

            const connection = new Connection(`https://${rpcUrl}`)
            const publicKey = new PublicKey(walletAddress)
            const boosts: string[] = []
            let rewards = 0
            const transaction = new Transaction()
            transaction.add(
                ComputeBudgetProgram.setComputeUnitLimit({
                    units: COMPUTE_UNIT_LIMIT
                })
            )

            for (const boost of Object.keys(BOOSTLIST)) {
                const instruction = await claimStakeOREInstruction(BOOSTLIST[boost].lpMint, boost)
                if (instruction.rewards > 0) {
                    transaction.add(instruction.transaction)
                    boosts.push(boost)
                    rewards += instruction.rewards
                }
            }

            const { blockhash } = await connection.getLatestBlockhash()
            transaction.recentBlockhash = blockhash
            transaction.feePayer = publicKey

            const feeCalculator = await connection.getFeeForMessage(transaction.compileMessage())
            if (!feeCalculator.value) {
                throw new CustomError("Fee is empty", 500)
            }
            let fee = 0
            fee += (feeCalculator.value ?? 0)
            const priorityFee = await getPriorityFee(transaction)
            fee += (((priorityFee) * COMPUTE_UNIT_LIMIT) / 1_000_000)
            
            let tokenTransfers = [{
                id: 'ore',
                ticker: 'ORE',
                isLp: false,
                balance: (Math.round(rewards / Math.pow(10, 6)) / Math.pow(10, 5)).toString(),
                tokenImage: 'OreToken'
            }]

            let transferInfo = [
                {
                    label: 'Account',
                    value: shortenAddress(walletAddress)
                },
                {
                    label: 'Network Fee',
                    value: `${(Math.round((fee / LAMPORTS_PER_SOL) * Math.pow(10, 6)) / Math.pow(10, 6))} SOL`
                }
            ]

            dispatch(uiActions.showLoading(false))

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
                            transaction.sign(keypair)
    
                            dispatch(uiActions.showLoading(true))
                            
                            const signature = await connection.sendRawTransaction(
                                transaction.serialize(), {
                                skipPreflight: false,
                                preflightCommitment: "confirmed",
                            })
    
                            await connection.confirmTransaction(signature, "confirmed")
                            setTimeout(() => {
                                dispatch(uiActions.showLoading(false))
                            }, 2000)
                        } catch(error) {
                            console.log("error", error)
                            setTimeout(() => {
                                loadData()
                                dispatch(uiActions.showLoading(false))
                            }, 2000)
                        }
                    }}
                />
            )
        } catch(error) {
            console.log("error", error)
            setTimeout(() => {
                loadData()
                dispatch(uiActions.showLoading(false))
            }, 5000)
            throw error
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <ScrollView
                refreshControl={<RefreshControl refreshing={false} onRefresh={loadData}/>}
                contentContainerClassName="grow-1 pb-[52px]" stickyHeaderIndices={[0]}
            >
                <View className="pt-2 mb-1 items-center px-10 bg-baseBg">
                    <CustomText className="font-PlusJakartaSans text-primary text-sm self-start mb-1">
                        My Total Yield
                    </CustomText>
                    {loading && <SkeletonLoader
                        className="rounded-xl bg-gray-900 mb-6 mt-1 w-full h-10"
                        colors={["#111827", "#1f2937", "#111827"]}
                    />}
                    {!loading && <View className="flex-row items-center justify-end self-end mb-6">
                        <Image
                            className="w-12 h-12 mr-2"
                            source={Images.OreToken}
                        />
                        <CustomText className="font-LatoBold text-primary text-2xl">
                            {(boostData.rewards / Math.pow(10, 11)).toFixed(11)} ORE
                        </CustomText>
                        <View className="self-end absolute top-9">
                            <CustomText className="font-PlusJakartaSansSemiBold text-green-400 text-sm">
                                (${(boostData.rewards / Math.pow(10, 11) * orePrice).toFixed(2)})
                            </CustomText>
                        </View>
                    </View>}
                    {loading && <SkeletonLoader
                        className="rounded-full bg-gray-900 w-full h-14 overflow-hidden mb-6"
                        colors={["#111827", "#1f2937", "#111827"]}
                    />}
                    {!loading && <Button
                        containerClassName="rounded-full w-full mb-6 border-2 border-solid border-gold"
                        className="py-2 bg-baseBg rounded-full items-center"
                        textClassName="text-gold"
                        title="Claim All"
                        onPress={onClaimAll}
                    />}
                    <CustomText className="font-PlusJakartaSans text-primary text-sm self-start mb-1">
                        My Daily Avg
                    </CustomText>
                    {loading && <SkeletonLoader
                        className="rounded-xl bg-gray-900 mb-6 mt-1 w-full h-10"
                        colors={["#111827", "#1f2937", "#111827"]}
                        width={"100%"} height={32}
                    />}
                    {!loading && <View className="flex-row items-center justify-end self-end mb-6">
                        <Image
                            className="w-12 h-12 mr-2"
                            source={Images.OreToken}
                        />
                        <CustomText className="font-LatoBold text-primary text-2xl">
                            {(boostData.avgRewards / Math.pow(10, 11)).toFixed(11)} ORE
                        </CustomText>
                        <View className="self-end absolute top-9">
                            <CustomText className="font-PlusJakartaSansSemiBold text-green-400 text-sm">
                                (${(boostData.avgRewards / Math.pow(10, 11) * orePrice).toFixed(2)})
                            </CustomText>
                        </View>
                    </View>}
                </View>
                <ScrollView contentContainerClassName="grow" horizontal>
                    <View className="flex-1">
                        <View className="flex-row mx-4 items-center border-l-[0.5px] border-y-[0.5px] border-y-solid border-gray-600">
                            <View className="w-12 px-1 h-full border-r-[0.5px] border-gray-600" />
                            <View className="w-60 px-1 py-2 pl-2 border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">Stake</CustomText>
                            </View>
                            <View className="w-24 px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">Stakers</CustomText>
                            </View>
                            <View className="w-[90px] px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">Weight</CustomText>
                            </View>
                            <View className="w-56 px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">Deposits</CustomText>
                            </View>
                            <View className="w-56 px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">My Deposits</CustomText>
                            </View>
                            <View className="w-24 px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">My Share</CustomText>
                            </View>
                            <View className="w-56 px-1 py-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">My Yield</CustomText>
                            </View>
                            <View className="w-56 px-1 py-2 pr-2 items-center border-r-[0.5px] border-gray-600">
                                <CustomText className="text-primary text-md font-PlusJakartaSansBold">Daily Avg</CustomText>
                            </View>
                        </View>
                        {Object.keys(BOOSTLIST).map(boost => (
                            <StakeRow
                                key={`stakescreen-${BOOSTLIST[boost].id}`}
                                boost={boost}
                                orePrice={orePrice}
                                loadStakes={loadStakes}
                                navigationProps={props}
                                loading={loading}
                            />
                        ))}
                    </View>
                </ScrollView>
            </ScrollView>
        </SafeAreaView>
    )
}

interface StakeRowProps {
    boost: string
    orePrice: number
    loading: boolean
    loadStakes: () => void,
    navigationProps: TabStakeScreenProps
}

function StakeRow(props: StakeRowProps) {
    const { boost, orePrice, loadStakes, loading, navigationProps } = props
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey)
    const boosts = useSelector((state: RootState) => state.boost.boosts)
    const dispatch = useDispatch()
    
    const { showModal, hideModal } = useBottomModal()

    return (
        <View key={`boost-${BOOSTLIST[boost].id}`} className="flex-row mx-4 items-center border-l-[0.5px] border-b-[0.5px] border-solid border-gray-600">
            {loading && <View className="w-12 h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                <SkeletonLoader
                    className="rounded-lg bg-gray-900 w-[90%] h-8 overflow-hidden"
                    colors={["#111827", "#1f2937", "#111827"]}
                />
            </View>}
            {!loading && <View className="w-12 h-full flex-row items-center justify-center border-r-[0.5px] border-gray-600">
                <OptionMenu
                    containerClassName="w-12 h-12 items-center self-center justify-center"
                    menu={[{
                        text: 'Claim',
                        onPress: async () => {
                            try {
                                dispatch(uiActions.showLoading(true))
                                const instruction = await claimStakeOREInstruction(BOOSTLIST[boost].lpMint, boost)
                                let tokenTransfers = [{
                                    id: 'ore',
                                    ticker: 'ORE',
                                    isLp: false,
                                    balance: (Math.round(instruction.rewards / Math.pow(10, 6)) / Math.pow(10, 5)).toString(),
                                    tokenImage: 'OreToken'
                                }]

                                let transferInfo = [
                                    {
                                        label: 'Account',
                                        value: shortenAddress(walletAddress ?? "")
                                    },
                                    {
                                        label: 'Network Fee',
                                        value: `${instruction.estimatedFee} SOL`
                                    }
                                ]

                                dispatch(uiActions.showLoading(false))

                                showModal(
                                    <ModalTransaction
                                        tokenTransfers={tokenTransfers}
                                        transferInfo={transferInfo}
                                        onClose={hideModal}
                                        onConfirm={async () => {
                                            dispatch(uiActions.showLoading(true))
                                            try {
                                                hideModal()
                                                const keypair = await getKeypair()
                                                instruction.transaction.sign(keypair)
                                                
                                                const signature = await instruction.connection.sendRawTransaction(
                                                    instruction.transaction.serialize(), {
                                                    skipPreflight: false,
                                                    preflightCommitment: "confirmed",
                                                })

                                                await instruction.connection.confirmTransaction(signature, "confirmed")
                                                
                                                setTimeout(() => {
                                                    loadStakes()
                                                    dispatch(uiActions.showLoading(false))
                                                }, 5000)
                                            } catch(error) {
                                                dispatch(uiActions.showLoading(false))
                                                console.log("error", error)
                                            }
                                        }}
                                    />
                                )
                            } catch(error) {
                                dispatch(uiActions.showLoading(false))
                                console.log("error", error)
                            }
                        }
                    }, {
                        text: 'Deposit',
                        onPress: () => navigationProps.navigation.navigate('Stake', {
                            isDeposit: true,
                            boost: boost
                        })
                    }, {
                        text: 'Withdraw',
                        onPress: () => navigationProps.navigation.navigate('Stake', {
                            isDeposit: false,
                            boost: boost
                        })
                    }]}
                />
            </View>}
            <View className="flex-row py-2 pl-2 w-60 items-center px-1 border-r-[0.5px] border-gray-600">
                <View className="w-12 self-center mr-3 items-center justify-center">
                    {typeof BOOSTLIST[boost].pairImage === 'string' && <Image
                        className="w-10 h-10 absolute left-3"
                        source={Images?.[BOOSTLIST[boost].pairImage as keyof typeof Images]}
                    />}
                    {typeof BOOSTLIST[boost].pairImage === 'string' && (
                        <Image
                            className="w-10 h-10 mr-4"
                            source={Images[BOOSTLIST[boost].tokenImage as keyof typeof Images]}
                        />
                    )}
                    {typeof BOOSTLIST[boost].pairImage !== 'string' && (
                        <Image
                            className="w-10 h-10"
                            source={Images[BOOSTLIST[boost].tokenImage as keyof typeof Images]}
                        />
                    )}
                </View>
                <View className="w-40 flex-row">
                    <CustomText className="text-primary text-md font-PlusJakartaSansBold mr-1">{BOOSTLIST[boost].name}</CustomText>
                    {typeof BOOSTLIST[boost].defiImage === 'string' && <Image
                        className="w-4 h-4 rounded-full"
                        source={Images[BOOSTLIST[boost].defiImage as keyof typeof Images]}
                    />}
                </View>
            </View>
            <View className="w-24 h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                {boosts[boost] && <CustomText className="w-18 justify-center text-primary text-md font-PlusJakartaSansBold">
                    {boosts[boost].boost?.totalStakers ?? 0}
                </CustomText>}
            </View>
            <View className="w-[90px] h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                {boosts[boost] && <CustomText className="text-primary text-md font-PlusJakartaSansBold">
                    {`${boosts[boost].boost?.weight}`}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                {boosts[boost] && <CustomText className="text-primary text-md font-LatoBold">
                    {(boosts[boost].boost?.totalDeposits ?? 0) / Math.pow(10, boosts[boost].decimals ?? 0)}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                {boosts[boost] && <CustomText className="text-primary text-md font-LatoBold">
                    {(boosts[boost].stake?.balance ?? 0) / Math.pow(10, boosts[boost].decimals ?? 0)}
                </CustomText>}
            </View>
            <View className="w-24 h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                {boosts[boost] && <CustomText className="text-primary text-md font-PlusJakartaSansBold">
                    {`${((boosts[boost].stake?.balance ?? 0) / (boosts[boost].boost?.totalDeposits ?? 1) * 100).toFixed(3)}%`}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                <View className="items-end">
                    {boosts[boost] && <CustomText className="text-primary text-md font-LatoBold">
                        {((boosts[boost].rewards ?? 0) / Math.pow(10, 11)).toFixed(11)} ORE
                    </CustomText>}
                    {boosts[boost] && <CustomText className="text-green-500 text-md font-PlusJakartaSansBold">
                        {`($${((boosts[boost].rewards ?? 0) / Math.pow(10, 11) * orePrice).toFixed(2)})`}
                    </CustomText>}
                </View>
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 pr-2 border-r-[0.5px] border-gray-600">
                <View className="items-end">
                    {boosts[boost] && <CustomText className="text-primary text-md font-LatoBold">
                        {((boosts[boost].avgRewards ?? 0) / Math.pow(10, 11)).toFixed(11)} ORE
                    </CustomText>}
                    {boosts[boost] && <CustomText className="text-green-500 text-md font-PlusJakartaSansBold">
                        {`($${((boosts[boost].avgRewards ?? 0) / Math.pow(10, 11) * orePrice).toFixed(2)})`}
                    </CustomText>}
                </View>
            </View>
        </View>
    )
}
