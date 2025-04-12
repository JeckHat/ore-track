import { useCallback, useRef, useState } from "react"
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
import dayjs from 'dayjs'

import { Button, CustomText, SkeletonLoader, OptionMenu, ModalTransaction } from "@components"
import Images from "@assets/images"
import { BOOSTLIST, COMPUTE_UNIT_LIMIT, JUP_API_PRICE, ORE_MINT } from "@constants"
import { getKeypair, uiActions } from "@store/actions"
import { CustomError } from "@models"
import { RootState } from "@store/types"
import { TabStakeScreenProps } from "@navigations/types"
import { useBottomModal } from "@hooks"
import { claimStakeOREInstruction, getStakeORE } from "@services/ore"
import { shortenAddress } from "@helpers"

interface DataStakeInfo {
    weight: number
    deposits: number
    myDeposits: number
    stakers: number
    myShare: number
    rewards: number
    decimals: number
    loading: boolean
    average?: number
    lastClaimAt?: string | null
    claimAt?: string | null
}

export default function TabStakeScreen(props: TabStakeScreenProps) {
    const [orePrice, setOrePrice] = useState(0.0)
    const [yieldData, setYieldData] = useState({
        total: 0,
        avg: 0,
        loading: true
    })
    const [stakeData, setStakeData] = useState<Record<string, DataStakeInfo>>(
        Object.entries(BOOSTLIST).reduce((acc, [key, value]) => {
            acc[key] = {
                ...value,
                weight: 0,
                deposits: 0,
                myDeposits: 0,
                stakers: 0,
                myShare: 0.00,
                rewards: 0,
                decimals: 0,
                lastClaimAt: null,
                loading: true
            }
            return acc;
        }, {} as Record<string, DataStakeInfo>)
    )
    const cacheRef = useRef<Record<string, DataStakeInfo | null>>({})
    const dispatch = useDispatch()
    const { showModal, hideModal } = useBottomModal()

    const rpcUrl = useSelector((state: RootState) => state.config.rpcUrl)
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey)

    useFocusEffect(
        useCallback(() => {
            loadData(true)
        }, [])
    )

    async function loadData(forceRefresh = false) {
        try {
            await Promise.all([
                loadStakes(forceRefresh),
                loadPrice(),
                getLPAmount()
            ])
        } catch(error) {
            console.log("error", error)
        }
    }

    async function onRefresh() {
        loadData(true)
    }

    async function loadStakes(forceRefresh = false) {
        try {
            const results = await Promise.all(
                Object.keys(BOOSTLIST).map(async (boost) => {
                    if(cacheRef.current[boost] && !forceRefresh) {
                        return cacheRef.current[boost]
                    }

                    const data = await getStakeORE(BOOSTLIST[boost].lpMint, boost)
                    cacheRef.current[boost] = {
                        weight: (data.boost.weight ?? 0),
                        deposits: data.boost.totalDeposits ?? 0,
                        myDeposits: data.stake.balance ?? 0,
                        stakers: data.boost.totalStakers ?? 0,
                        myShare: ((data.stake.balance ?? 0) / (data.boost.totalDeposits ?? 1)) * 100 ?? 0.000,
                        rewards: data.rewards ?? 0,
                        decimals: data.decimals ?? 0,
                        lastClaimAt: data.stake.lastClaimAt ?? null,
                        loading: false
                    }
                    return cacheRef.current[boost]
                })
            )
            let avgReward = 0.0
            const newData: Record<string, DataStakeInfo> = Object.entries(BOOSTLIST).reduce(
                (acc, [key, value], index) => {
                    let estimate = 0.0
                    if(results[index].lastClaimAt) {
                        let divided = dayjs(new Date()).diff(dayjs(results[index]?.lastClaimAt), 'minute')
                        divided = divided === 0 ? 1 : divided
                        estimate = ((results[index]?.rewards ?? 0) / divided) * 60 * 24
                        avgReward += estimate
                    }

                    acc[key] = {
                        ...value,
                        weight: results[index]?.weight ?? 0,
                        deposits: results[index]?.deposits ?? 0,
                        myDeposits: results[index]?.myDeposits ?? 0,
                        stakers: results[index]?.stakers ?? 0,
                        myShare: results[index]?.myShare ?? 0.000,
                        rewards: results[index]?.rewards ?? 0,
                        decimals: results[index]?.decimals ?? 0,
                        lastClaimAt: results[index]?.lastClaimAt ?? null,
                        average: estimate,
                        loading: false,
                    }
                    return acc
                }, 
            {} as Record<string, DataStakeInfo>)

            const total = Object.values(newData)
                .filter((token) => token)
                .reduce((sum, token) => sum + (token?.rewards ?? 0), 0)
            setYieldData({
                total: total,
                avg: avgReward,
                loading: false
            })

            setStakeData(newData)

        } catch(error) {
            console.log("error getStakes", error)
        }
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
            const estimatedFee = feeCalculator.value / LAMPORTS_PER_SOL
            
            let tokenTransfers = [{
                id: 'ore',
                ticker: 'ORE',
                isLp: false,
                balance: (rewards / Math.pow(10, 11)).toFixed(11),
                tokenImage: 'OreToken'
            }]

            let transferInfo = [
                {
                    label: 'Account',
                    value: shortenAddress(walletAddress)
                },
                {
                    label: 'Estimate Fee',
                    value: `${estimatedFee} SOL`
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
                                onRefresh()
                                dispatch(uiActions.showLoading(false))
                            }, 5000)
                        } catch(error) {
                            console.log("error", error)
                            setTimeout(() => {
                                onRefresh()
                                dispatch(uiActions.showLoading(false))
                            }, 5000)
                        }
                    }}
                />
            )
        } catch(error) {
            console.log("error", error)
            setTimeout(() => {
                onRefresh()
                dispatch(uiActions.showLoading(false))
            }, 5000)
            throw error
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-baseBg">
            <ScrollView
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh}/>}
                contentContainerClassName="grow-1 pb-[52px]" stickyHeaderIndices={[0]}
            >
                <View className="pt-2 mb-1 items-center px-10 bg-baseBg">
                    <CustomText className="font-PlusJakartaSans text-primary text-sm self-start mb-1">
                        My Total Yield
                    </CustomText>
                    {yieldData.loading && <SkeletonLoader
                        className="rounded-xl bg-gray-900 mb-6 mt-1 w-full h-10"
                        colors={["#111827", "#1f2937", "#111827"]}
                    />}
                    {!yieldData.loading && <View className="flex-row items-center justify-end self-end mb-6">
                        <Image
                            className="w-12 h-12 mr-2"
                            source={Images.OreToken}
                        />
                        <CustomText className="font-LatoBold text-primary text-2xl">
                            {(yieldData.total / Math.pow(10, 11)).toFixed(11)} ORE
                        </CustomText>
                        <View className="self-end absolute top-9">
                            <CustomText className="font-PlusJakartaSans text-green-400 text-sm">
                                (${(yieldData.total / Math.pow(10, 11) * orePrice).toFixed(2)})
                            </CustomText>
                        </View>
                    </View>}
                    {yieldData.loading && <SkeletonLoader
                        className="rounded-full bg-gray-900 w-full h-14 overflow-hidden mb-6"
                        colors={["#111827", "#1f2937", "#111827"]}
                    />}
                    {!yieldData.loading && <Button
                        containerClassName="rounded-full w-full mb-6 border-2 border-solid border-gold"
                        className="py-2 bg-baseBg rounded-full items-center"
                        textClassName="text-gold"
                        title="Claim All"
                        onPress={onClaimAll}
                    />}
                    <CustomText className="font-PlusJakartaSans text-primary text-sm self-start mb-1">
                        My Daily Avg
                    </CustomText>
                    {yieldData.loading && <SkeletonLoader
                        className="rounded-xl bg-gray-900 mb-6 mt-1 w-full h-10"
                        colors={["#111827", "#1f2937", "#111827"]}
                        width={"100%"} height={32}
                    />}
                    {!yieldData.loading && <View className="flex-row items-center justify-end self-end mb-6">
                        <Image
                            className="w-12 h-12 mr-2"
                            source={Images.OreToken}
                        />
                        <CustomText className="font-LatoBold text-primary text-2xl">
                            {(yieldData.avg / Math.pow(10, 11)).toFixed(11)} ORE
                        </CustomText>
                        <View className="self-end absolute top-9">
                            <CustomText className="font-PlusJakartaSans text-green-400 text-sm">
                                (${(yieldData.avg / Math.pow(10, 11) * orePrice).toFixed(2)})
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
                                stakeData={stakeData}
                                orePrice={orePrice}
                                loadStakes={loadStakes}
                                navigationProps={props}
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
    stakeData: Record<string, DataStakeInfo>
    orePrice: number
    loadStakes: (forceRefresh: boolean) => void,
    navigationProps: TabStakeScreenProps
}

function StakeRow(props: StakeRowProps) {
    const { boost, stakeData, orePrice, loadStakes, navigationProps } = props
    const walletAddress = useSelector((state: RootState) => state.wallet.publicKey)
    const dispatch = useDispatch()
    
    const { showModal, hideModal } = useBottomModal()

    return (
        <View key={`boost-${BOOSTLIST[boost].id}`} className="flex-row mx-4 items-center border-l-[0.5px] border-b-[0.5px] border-solid border-gray-600">
            {stakeData[boost].loading && <View className="w-12 h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                <SkeletonLoader
                    className="rounded-lg bg-gray-900 w-[90%] h-8 overflow-hidden"
                    colors={["#111827", "#1f2937", "#111827"]}
                />
            </View>}
            {!stakeData[boost].loading && <View className="w-12 h-full flex-row items-center justify-center border-r-[0.5px] border-gray-600">
                <OptionMenu
                    containerClassName="w-12 h-12 items-center self-center justify-center"
                    menu={[{
                        text: 'View',
                        onPress: async () => {
                            navigationProps.navigation.navigate('Stake')
                        }
                    }, {
                        text: 'Claim',
                        onPress: async () => {
                            try {
                                dispatch(uiActions.showLoading(true))
                                const instruction = await claimStakeOREInstruction(BOOSTLIST[boost].lpMint, boost)
                                let tokenTransfers = [{
                                    id: 'ore',
                                    ticker: 'ORE',
                                    isLp: false,
                                    balance: (instruction.rewards / Math.pow(10, 11)).toString(),
                                    tokenImage: 'OreToken'
                                }]

                                let transferInfo = [
                                    {
                                        label: 'Account',
                                        value: walletAddress ?? ""
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
                                                    loadStakes(true)
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
                        text: 'Stake',
                        onPress: () => navigationProps.navigation.navigate('Stake', {
                            isDeposit: true,
                            boost: boost
                        })
                    }, {
                        text: 'Unstake',
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
                {stakeData[boost] && <CustomText className="w-18 justify-center text-primary text-md font-PlusJakartaSansBold">
                    {stakeData[boost].stakers}
                </CustomText>}
            </View>
            <View className="w-[90px] h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                {stakeData[boost] && <CustomText className="text-primary text-md font-PlusJakartaSansBold">
                    {`${stakeData[boost].weight}`}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                {stakeData[boost] && <CustomText className="text-primary text-md font-LatoBold">
                    {stakeData[boost].deposits / Math.pow(10, stakeData[boost].decimals)}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                {stakeData[boost] && <CustomText className="text-primary text-md font-LatoBold">
                    {stakeData[boost].myDeposits / Math.pow(10, stakeData[boost].decimals)}
                </CustomText>}
            </View>
            <View className="w-24 h-full flex-row justify-center items-center px-1 border-r-[0.5px] border-gray-600">
                {stakeData[boost] && <CustomText className="text-primary text-md font-PlusJakartaSansBold">
                    {`${stakeData[boost].myShare.toFixed(3)}%`}
                </CustomText>}
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 border-r-[0.5px] border-gray-600">
                <View className="items-end">
                    {stakeData[boost] && <CustomText className="text-primary text-md font-LatoBold">
                        {(stakeData[boost].rewards / Math.pow(10, 11)).toFixed(11)} ORE
                    </CustomText>}
                    {stakeData[boost] && <CustomText className="text-green-500 text-md font-PlusJakartaSansBold">
                        {`($${(stakeData[boost].rewards / Math.pow(10, 11) * orePrice).toFixed(2)})`}
                    </CustomText>}
                </View>
            </View>
            <View className="w-56 h-full flex-row justify-end items-center px-1 pr-2 border-r-[0.5px] border-gray-600">
                <View className="items-end">
                    {stakeData[boost] && <CustomText className="text-primary text-md font-LatoBold">
                        {((stakeData[boost].average ?? 0)  / Math.pow(10, 11)).toFixed(11)} ORE
                    </CustomText>}
                    {stakeData[boost] && <CustomText className="text-green-500 text-md font-PlusJakartaSansBold">
                        {`($${((stakeData[boost].average ?? 0) / Math.pow(10, 11) * orePrice).toFixed(2)})`}
                    </CustomText>}
                </View>
            </View>
        </View>
    )
}
