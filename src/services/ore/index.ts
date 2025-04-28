import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountIdempotentInstruction,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import { Boost, BoostConfig, CustomError, Numeric, Proof, Stake } from "@models"
import { getBoost, getBoostConfig, getBoostDecimals, getBoostProof, getStake } from "./boost"
import {
    BOOST_ID,
    BoostInfo,
    BOOSTLIST,
    CONFIG,
    KAMINO_API,
    METEORA_API,
    ORE_MINT,
    PROGRAM_ID,
    PROOF,
    SOL_MINT,
    STAKE,
    TOKENLIST,
    TREASURY
} from "@constants";
import { ensureAtaExists, getBalance } from "@services/solana";
import { getConnection, getWalletAddress } from "@providers";
import { bigIntToNumber } from "@helpers";
import { store } from "@store/index";
import { boostActions } from "@store/actions";
import { depositMeteoraInstruction, withdrawMeteoraInstruction } from "@services/meteora";
import { depositKaminoInstruction, withdrawKaminoInstruction } from "@services/kamino";

export function calculateClaimableYield(boost: Boost, boostProof: Proof, stake: Stake, boostConfig: BoostConfig) {
    let rewards = BigInt(stake.rewards ?? 0);
    let configRewardsFactor = boostConfig.rewardsFactor
    let boostRewardsFactor = boost.rewardsFactor

    if (!configRewardsFactor) {
        configRewardsFactor = new Numeric(BigInt(0))
    }

    if (!boostRewardsFactor) {
        boostRewardsFactor = new Numeric(BigInt(0))
    }

    if (!boost.totalDeposits) {
        return rewards
    }

    if (!boost.lastRewardsFactor) {
        return rewards
    }

    if (!stake.lastRewardsFactor) {
        return rewards
    }

    if (boostProof.balance && boostProof.balance > 0 && boostConfig.totalWeight) {
        const extraFactor = Numeric.fromFraction(boostProof.balance, boostConfig.totalWeight)
        configRewardsFactor = configRewardsFactor.add(extraFactor)
    }

    if(configRewardsFactor.gt(boost.lastRewardsFactor)) {
        const accumulatedRewards = configRewardsFactor.sub(boost.lastRewardsFactor)
        const boostRewards = accumulatedRewards.mul(Numeric.fromU64(boost.weight ?? 0))
        const delta = boostRewards.div(Numeric.fromU64(boost.totalDeposits ?? 1))
        boostRewardsFactor = boostRewardsFactor.add(delta)
    }

    if(boostRewardsFactor.gt(stake.lastRewardsFactor)) {
        let accumulatedRewards = boostRewardsFactor.sub(stake.lastRewardsFactor)
        let personalRewards = accumulatedRewards.mul(Numeric.fromU64(stake?.balance ?? 0))
        rewards = rewards + personalRewards.toU64()
    }

    return rewards;
}

export async function getStakeORE(mintAddress: string, boostAddress?: string) {
    const walletAddress = getWalletAddress()

    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const stakerPublicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(mintAddress)

    const { boost, boostPublicKey } = await getBoost(mintPublicKey, boostAddress)
    const { stake, stakePublicKey } = await getStake(stakerPublicKey, boostPublicKey)
    const decimals = await getBoostDecimals(mintPublicKey, boostPublicKey)
    const { boostConfig, boostConfigPublicKey } = await getBoostConfig()
    const { boostProof, boostProofPublicKey } = await getBoostProof(boostConfigPublicKey)

    store.dispatch(boostActions.updateBoost({
        boost: boost.toJSON(),
        boostAddress: boostPublicKey.toBase58(),
        stake: stake.toJSON(),
        stakeAddress: stakePublicKey.toBase58(),
        boostConfig: boostConfig.toJSON(),
        boostConfigAddress: boostConfigPublicKey.toBase58(),
        boostProof: boostProof.toJSON(),
        boostProofAddress: boostProofPublicKey.toBase58(),
        decimals: decimals
    }))

    const rewards = calculateClaimableYield(boost, boostProof, stake, boostConfig)

    return {
        mintPublicKey: mintPublicKey,
        decimals: decimals,
        boost: boost,
        boostPublicKey: boostPublicKey,
        stake: stake,
        stakePublicKey: stakePublicKey,
        boostProof: boostProof,
        boostProofPublicKey: boostProofPublicKey,
        boostConfig: boostConfig,
        boostConfigPublicKey: boostConfigPublicKey,
        rewards: bigIntToNumber(rewards),
    }
}

export async function getLiquidityPair(lpId: string, defi: string, boostAddress: string, updatedRedux = false) {
    const connection = getConnection()
    const walletAddress = getWalletAddress()

    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const mintAddress = BOOSTLIST[boostAddress].lpMint
    const pairDecimals = TOKENLIST?.[BOOSTLIST[boostAddress]?.pairMint ?? ""]?.decimals ?? 11
    
    if (defi === 'kamino') {
        const response = await fetch(`${KAMINO_API}${lpId}/metrics/?env=mainnet-beta&status=LIVE`, {
            method: 'GET'
        })
        const resData = await response.json()

        const tokenA = resData.tokenAMint
        const tokenB = resData.tokenBMint
        const balanceA = resData?.vaultBalances.tokenA.total
        const balanceB = resData?.vaultBalances.tokenB.total
        const totalValueUsd = resData.totalValueLocked

        const lpMintSupply = await connection.getTokenSupply(new PublicKey(mintAddress))
        const shares = parseFloat(lpMintSupply.value.amount)

        const { stake } = await getStake(new PublicKey(walletAddress), new PublicKey(boostAddress))
        const decimals = await getBoostDecimals(new PublicKey(mintAddress), new PublicKey(boostAddress))
        const stakeShare = (stake.balance ?? 0) / shares 

        const stakeAmountA = parseFloat(balanceA) * stakeShare
        const stakeAmountB = parseFloat(balanceB) * stakeShare

        if (updatedRedux) {
            store.dispatch(boostActions.updateLiquidityPair({
                boostAddress: boostAddress,
                liquidityPair: {
                    depositsOre: (tokenA === ORE_MINT? stakeAmountA : stakeAmountB) * Math.pow(10, 11),
                    depositsPair: (tokenB === ORE_MINT? stakeAmountA : stakeAmountB) * Math.pow(10, pairDecimals),
                    totalValueUsd: totalValueUsd,
                    shares: shares
                }
            }))
        }
        return {
            stakeBalance: (stake.balance ?? 0) / Math.pow(10, decimals),
            stakeAmountORE: tokenA === ORE_MINT? stakeAmountA : stakeAmountB,
            stakeAmountPair: tokenB === ORE_MINT? stakeAmountA : stakeAmountB,
            LPBalanceORE: tokenA === ORE_MINT? parseFloat(balanceA) : parseFloat(balanceB),
            LPBalancePair: tokenB === ORE_MINT? parseFloat(balanceA) : parseFloat(balanceB),
            totalValueUsd: totalValueUsd,
            shares: shares,
        }

    } else if (defi === 'meteora'){
        const response = await fetch(`${METEORA_API}${lpId}`, {
            method: 'GET'
        })
        const resData = await response.json()
        const tokenA = resData?.[0]?.pool_token_mints[0]
        const tokenB = resData?.[0]?.pool_token_mints[1]
        const balanceA = resData?.[0]?.pool_token_amounts[0]
        const balanceB = resData?.[0]?.pool_token_amounts[1]
        const totalValueUsd = resData?.[0]?.pool_tvl

        const lpMintSupply = await connection.getTokenSupply(new PublicKey(mintAddress))
        const shares = parseFloat(lpMintSupply.value.amount)

        const { stake } = await getStake(new PublicKey(walletAddress), new PublicKey(boostAddress))
        const decimals = await getBoostDecimals(new PublicKey(mintAddress), new PublicKey(boostAddress))
        const stakeShare = (stake.balance ?? 0) / shares 

        const stakeAmountA = parseFloat(balanceA) * stakeShare
        const stakeAmountB = parseFloat(balanceB) * stakeShare
        if (updatedRedux) {
            store.dispatch(boostActions.updateLiquidityPair({
                boostAddress: boostAddress,
                liquidityPair: {
                    depositsOre: (tokenA === ORE_MINT? stakeAmountA : stakeAmountB) * Math.pow(10, 11),
                    depositsPair: (tokenB === ORE_MINT? stakeAmountA : stakeAmountB) * Math.pow(10, pairDecimals),
                    totalValueUsd: totalValueUsd,
                    shares: shares
                }
            }))
        }
        return {
            stakeBalance: (stake.balance ?? 0) / Math.pow(10, decimals),
            stakeAmountORE: tokenA === ORE_MINT? stakeAmountA : stakeAmountB,
            stakeAmountPair: tokenB === ORE_MINT? stakeAmountA : stakeAmountB,
            LPBalanceORE: tokenA === ORE_MINT? parseFloat(balanceA) : parseFloat(balanceB),
            LPBalancePair: tokenB === ORE_MINT? parseFloat(balanceA) : parseFloat(balanceB),
            totalValueUsd: totalValueUsd,
            shares: shares,
        }
    } else {
        const { boost } = await getBoost(new PublicKey(mintAddress), new PublicKey(boostAddress))
        const { stake } = await getStake(new PublicKey(walletAddress), new PublicKey(boostAddress))
        if (updatedRedux) {
            store.dispatch(boostActions.updateLiquidityPair({
                boostAddress: boostAddress,
                liquidityPair: {
                    depositsOre: (stake.balance ?? 0),
                    depositsPair: 0,
                    totalValueUsd: 0,
                    shares: 0
                }
            }))
        }
        return {
            stakeBalance: (stake.balance ?? 0) / Math.pow(10, 11),
            stakeAmountORE: (stake.balance ?? 0) / Math.pow(10, 11),
            stakeAmountPair: 0,
            LPBalanceORE: boost?.totalDeposits ?? 0,
            LPBalancePair: 0,
            totalValueUsd: 0,
            shares: 0,
        }
    }
}

export async function claimStakeOREInstruction(mintAddress: string, boostAddress: string) {
    const connection = getConnection()
    const walletAddress = getWalletAddress()

    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }

    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const staker = new PublicKey(walletAddress)

    const transaction = new Transaction();
    const accountORE = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        staker
    );
    const account = await connection.getAccountInfo(accountORE)

    if (!account) {
        const createTokenAccountIx = createAssociatedTokenAccountInstruction(
            staker,
            accountORE,
            staker,
            new PublicKey(ORE_MINT),
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        transaction.add(createTokenAccountIx)
    }

    const {
        boost,
        stake,
        boostProof,
        boostPublicKey,
        stakePublicKey,
        boostProofPublicKey,
        boostConfig,
        boostConfigPublicKey
    } = await getStakeORE(mintAddress, boostAddress)

    const rewards = calculateClaimableYield(boost, boostProof, stake, boostConfig)
    const amountBuffer = Buffer.alloc(8)
    amountBuffer.writeBigUInt64LE(rewards)
    
    const beneficiaryPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        staker
    );

    const boostRewardsPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        boostConfigPublicKey,
        true
    );

    const treasuryAddress = PublicKey.findProgramAddressSync(
        [...[TREASURY]],
        new PublicKey(PROGRAM_ID)
    )?.[0]

    const treasuryTokenAddress = PublicKey.findProgramAddressSync(
        [
            ...[treasuryAddress.toBytes()],
            ...[new PublicKey(TOKEN_PROGRAM_ID).toBytes()],
            ...[new PublicKey(ORE_MINT).toBytes()]
        ],
        new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID)
    )?.[0]

    const instruction = new TransactionInstruction({
        programId: new PublicKey(BOOST_ID),
        keys: [
            { pubkey: staker, isSigner: true, isWritable: true },
            { pubkey: beneficiaryPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostConfigPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostProofPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostRewardsPublicKey, isSigner: false, isWritable: true },
            { pubkey: stakePublicKey, isSigner: false, isWritable: true },
            { pubkey: treasuryAddress, isSigner: false, isWritable: false },
            { pubkey: treasuryTokenAddress, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(PROGRAM_ID), isSigner: false, isWritable: false },
            { pubkey: new PublicKey(TOKEN_PROGRAM_ID), isSigner: false, isWritable: false }
        ],
        data: Buffer.concat([Buffer.from([0]), amountBuffer])
    })

    transaction.add(instruction)

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = staker
    const feeCalculator = await connection.getFeeForMessage(transaction.compileMessage())
    if (!feeCalculator.value) {
        throw new CustomError("Fee is empty", 500)
    }
    const estimatedFee = feeCalculator.value / LAMPORTS_PER_SOL

    const balanceSol = await getBalance(walletAddress, SOL_MINT)

    if (balanceSol < estimatedFee) {
        throw new CustomError(
            `Insufficient balance! Minimum of ${estimatedFee.toFixed(6)} SOL is required, while the current balance is only ${balanceSol} SOL.`,
            500
        );
    } 

    return { transaction, rewards: bigIntToNumber(rewards), estimatedFee, connection };
}

export async function depositStakeInstruction(mintAddress: string, boostAddress: string, amountStake?: number) {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const amount = amountStake? BigInt(amountStake * Math.pow(10, 11)) : BigInt("0xFFFFFFFFFFFFFFFF")
    const depositData = Buffer.alloc(8)
    depositData.writeBigUInt64LE(amount, 0)

    const walletPublicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(mintAddress)
    const boostPublicKey = new PublicKey(boostAddress)
    const boostConfigPublicKey = PublicKey.findProgramAddressSync(
        [...[CONFIG]],
        new PublicKey(BOOST_ID)
    )?.[0]
    
    const boostProofPublicKey = PublicKey.findProgramAddressSync(
        [...[PROOF], ...[boostConfigPublicKey.toBytes()]],
        new PublicKey(PROGRAM_ID)
    )?.[0]
    
    const boostDepositPublicKey = getAssociatedTokenAddressSync(
        mintPublicKey, boostPublicKey, true
    )

    const boostRewardsPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        boostConfigPublicKey,
        true
    );
    
    const senderPublicKey = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey, true)
    
    const stakePublicKey = PublicKey.findProgramAddressSync(
        [...[STAKE], ...[walletPublicKey.toBytes()], ...[boostPublicKey.toBytes()]],
        new PublicKey(BOOST_ID)
    )?.[0]

    const treasuryAddress = PublicKey.findProgramAddressSync(
        [...[TREASURY]],
        new PublicKey(PROGRAM_ID)
    )?.[0]

    const treasuryTokenAddress = PublicKey.findProgramAddressSync(
        [
            ...[treasuryAddress.toBytes()],
            ...[new PublicKey(TOKEN_PROGRAM_ID).toBytes()],
            ...[new PublicKey(ORE_MINT).toBytes()]
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )?.[0]

    const bufferMax = Buffer.alloc(8);
    bufferMax.writeBigUInt64LE(18446744073709551615n);

    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amount);

    const depositInstruction = new TransactionInstruction({
        programId: new PublicKey(BOOST_ID),
        keys: [
            { pubkey: walletPublicKey, isSigner: true, isWritable: true },
            { pubkey: boostPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostConfigPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostDepositPublicKey, isSigner: false, isWritable: true },
            { pubkey: mintPublicKey, isSigner: false, isWritable: false },
            { pubkey: boostProofPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostRewardsPublicKey, isSigner: false, isWritable: true },
            { pubkey: senderPublicKey, isSigner: false, isWritable: true },
            { pubkey: stakePublicKey, isSigner: false, isWritable: true },
            { pubkey: treasuryAddress, isSigner: false, isWritable: false },
            { pubkey: treasuryTokenAddress, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(PROGRAM_ID), isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([Buffer.from([2]), amountBuffer])
    })

    return depositInstruction
}

export async function withdrawStakeInstruction(mintAddress: string, boostAddress: string, amountStake: number) {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const amount = BigInt(Math.floor(amountStake * Math.pow(10, BOOSTLIST[boostAddress].decimals)))
    const withdrawData = Buffer.alloc(8)
    withdrawData.writeBigUInt64LE(amount, 0)

    const walletPublicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(mintAddress)

    const beneficiaryPublicKey = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey)


    const boostPublicKey = new PublicKey(boostAddress)
    const boostConfigPublicKey = PublicKey.findProgramAddressSync(
        [...[CONFIG]],
        new PublicKey(BOOST_ID)
    )?.[0]
    
    const boostProofPublicKey = PublicKey.findProgramAddressSync(
        [...[PROOF], ...[boostConfigPublicKey.toBytes()]],
        new PublicKey(PROGRAM_ID)
    )?.[0]
    
    const boostDepositPublicKey = getAssociatedTokenAddressSync(
        mintPublicKey, boostPublicKey, true
    )

    const boostRewardsPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        boostConfigPublicKey,
        true
    );
  
    const stakePublicKey = PublicKey.findProgramAddressSync(
        [...[STAKE], ...[walletPublicKey.toBytes()], ...[boostPublicKey.toBytes()]],
        new PublicKey(BOOST_ID)
    )?.[0]

    const treasuryAddress = PublicKey.findProgramAddressSync(
        [...[TREASURY]],
        new PublicKey(PROGRAM_ID)
    )?.[0]

    const treasuryTokenAddress = PublicKey.findProgramAddressSync(
        [
            ...[treasuryAddress.toBytes()],
            ...[new PublicKey(TOKEN_PROGRAM_ID).toBytes()],
            ...[new PublicKey(ORE_MINT).toBytes()]
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )?.[0]

    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(amount);

    const wuthdrawInstruction = new TransactionInstruction({
        programId: new PublicKey(BOOST_ID),
        keys: [
            { pubkey: walletPublicKey, isSigner: true, isWritable: true },
            { pubkey: beneficiaryPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostConfigPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostDepositPublicKey, isSigner: false, isWritable: true },
            { pubkey: mintPublicKey, isSigner: false, isWritable: false },
            { pubkey: boostProofPublicKey, isSigner: false, isWritable: true },
            { pubkey: boostRewardsPublicKey, isSigner: false, isWritable: true },
            { pubkey: stakePublicKey, isSigner: false, isWritable: true },
            { pubkey: treasuryAddress, isSigner: false, isWritable: false },
            { pubkey: treasuryTokenAddress, isSigner: false, isWritable: true },
            { pubkey: new PublicKey(PROGRAM_ID), isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([Buffer.from([5]), amountBuffer])
    })

    return wuthdrawInstruction
}

export async function tokenToLPInstruction(boostInfo: BoostInfo, oreBalance: string, pairBalance: string) {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const connection = getConnection()
    const walletPublicKey = new PublicKey(walletAddress)

    const mintPublicKey = new PublicKey(boostInfo.lpMint)
    let feeAta = 0

    let instructions = []
    const mintAta = getAssociatedTokenAddressSync(mintPublicKey, walletPublicKey);
    const accountInfo = await connection.getAccountInfo(mintAta);
    if (!accountInfo) {
        instructions.push(
            createAssociatedTokenAccountInstruction(
                walletPublicKey,
                walletPublicKey,
                mintPublicKey,
                TOKEN_PROGRAM_ID
            )
        )
        const lamports = await connection.getMinimumBalanceForRentExemption(boostInfo.ataSize);
        feeAta += lamports
    }
    
    const solPubKey = new PublicKey(SOL_MINT)
    let wsolAmount = 0
    if (boostInfo.pairMint === SOL_MINT) {
        wsolAmount = parseFloat(pairBalance)
    }

    const wsolAta = getAssociatedTokenAddressSync(solPubKey, walletPublicKey)
    if (wsolAmount > 0) {
        instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
                walletPublicKey,
                wsolAta,
                walletPublicKey,
                solPubKey
            )
        )
        instructions.push(
            SystemProgram.transfer({
                fromPubkey: walletPublicKey,
                toPubkey: wsolAta,
                lamports: wsolAmount * LAMPORTS_PER_SOL
            })
        )
        instructions.push(
            createSyncNativeInstruction(
                wsolAta,
                TOKEN_PROGRAM_ID
            )
        )
    }
    
    if(boostInfo?.defi === 'kamino') {
        const depositInstructions = await depositKaminoInstruction(
            boostInfo?.lpId,
            parseFloat(oreBalance),
            parseFloat(pairBalance)
        )
        instructions.push(depositInstructions)
    }
    
    if(boostInfo?.defi === 'meteora') {
        const oreAmount = Math.floor(parseFloat(oreBalance) * Math.pow(10, 11))
        const pairAmount = Math.floor(parseFloat(pairBalance) * Math.pow(10, TOKENLIST[boostInfo?.pairMint ?? ""].decimals))

        const depositInstructions = await depositMeteoraInstruction(
            boostInfo?.lpId,
            oreAmount,
            pairAmount,
            1
        )
        instructions.push(depositInstructions)
    }
    
    if (wsolAmount > 0) {
        const closeAccountInstructions = createCloseAccountInstruction(
            wsolAta,
            walletPublicKey,
            walletPublicKey
        )
        instructions.push(closeAccountInstructions)
    }

    return {
        instructions: instructions,
        feeAta: feeAta
    }
}

export async function LPToTokenInstruction(boostInfo: BoostInfo, boostAddress: string, amountBalance: string) {
    const connection = getConnection()
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }
    const walletPublicKey = new PublicKey(walletAddress)
    let feeAta = 0

    let instructions = [] 
    const solPubKey = new PublicKey(SOL_MINT)
    const wsolAta = getAssociatedTokenAddressSync(solPubKey, walletPublicKey)
    if (boostInfo.pairMint === SOL_MINT) {
        instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
                walletPublicKey,
                wsolAta,
                walletPublicKey,
                solPubKey
            )
        )

        instructions.push(createSyncNativeInstruction(
            wsolAta,
            TOKEN_PROGRAM_ID
        ))
    }

    let instructionAta = await ensureAtaExists(walletPublicKey, new PublicKey(ORE_MINT))
    if (instructionAta) {
        instructions.push(instructionAta)
        const lamports = await connection.getMinimumBalanceForRentExemption(boostInfo.ataSize);
        feeAta += lamports
    }

    instructionAta = await ensureAtaExists(walletPublicKey, new PublicKey(boostInfo.pairMint ?? ""))
    if (instructionAta) {
        instructions.push(instructionAta)
        const lamports = await connection.getMinimumBalanceForRentExemption(boostInfo.ataSize);
        feeAta += lamports
    }

    instructionAta = await ensureAtaExists(walletPublicKey, new PublicKey(boostInfo.pairMint ?? ""))
    if (instructionAta) {
        instructions.push(instructionAta)
        const lamports = await connection.getMinimumBalanceForRentExemption(boostInfo.ataSize);
        feeAta += lamports
    }

    instructionAta = await ensureAtaExists(walletPublicKey, new PublicKey(boostInfo.lpMint ?? ""))
    if (instructionAta) {
        instructions.push(instructionAta)
        const lamports = await connection.getMinimumBalanceForRentExemption(boostInfo.ataSize);
        feeAta += lamports
    }

    let amount = Math.floor(parseFloat(amountBalance) * Math.pow(10, BOOSTLIST[boostAddress].decimals))

    if (boostInfo.defi === 'kamino') {
        const withdrawInstruction = await withdrawKaminoInstruction(boostInfo?.lpId, amount)
        instructions.push(withdrawInstruction)
    }

    if (boostInfo.defi === 'meteora') {
        const liqudityPair = await getLiquidityPair(boostInfo.lpId, 'meteora', boostAddress)
        const pairAmount = Math.floor(liqudityPair.LPBalancePair * (parseFloat(amountBalance) * Math.pow(10, boostInfo.decimals)) / liqudityPair.shares)
        const withdrawInstruction = await withdrawMeteoraInstruction(
            boostInfo.lpId,
            amount,
            pairAmount,
            1
        )
        instructions.push(withdrawInstruction)
    }

    if (boostInfo.pairMint === SOL_MINT) {
        const closeAccountInstructions = createCloseAccountInstruction(
            wsolAta,
            walletPublicKey,
            walletPublicKey
        )
        instructions.push(closeAccountInstructions)
    }
    
    return {
        instructions: instructions,
        feeAta: feeAta
    }
}
