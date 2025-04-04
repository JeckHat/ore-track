import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js"
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import { Boost, CustomError, Numeric, Proof, Stake } from "@models"
import { store } from "@store/index"
import { getBoost, getBoostDecimals, getBoostProof, getStake } from "./boost"
import { BOOST_ID, ORE_MINT, PROGRAM_ID, SOL_MINT, TREASURY } from "@constants/index";
import { getBalance } from "@services/solana";

export function calculateClaimableYield(boost: Boost, boostProof: Proof, stake: Stake) {
    let rewards = BigInt(stake.rewards ?? 0);
    if (!boost.rewardsFactor) {
        return Number(rewards)
    }
    let boostRewardsFactor = boost.rewardsFactor
    if (!boostRewardsFactor) {
        boostRewardsFactor = new Numeric(BigInt(0))
    }

    if (!boost.totalDeposits) {
        return Number(rewards)
    }

    if (boostProof.balance && boostProof.balance > 0) {
        let extraFactor = Numeric.fromFraction(boostProof.balance, boost.totalDeposits);
        boostRewardsFactor = boostRewardsFactor.add(extraFactor);
    }

    if (!stake.lastRewardsFactor) {
        return Number(rewards)
    }
    
    if (boostRewardsFactor.gt(stake.lastRewardsFactor)) {
        let accumulatedRewards = boostRewardsFactor.sub(stake.lastRewardsFactor);
        let personalRewards = accumulatedRewards.mul(Numeric.fromU64(stake?.balance ?? 0));
        rewards = rewards + personalRewards.toU64();
    }
    return Number(rewards);
}

export async function getStakeORE(mintAddress: string, boostAddress?: string) {
    const walletAddress = store.getState().wallet.publicKey

    if (!walletAddress) {
        throw new CustomError("Public Key is undefined", 500)
    }

    const stakerPublicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(mintAddress)

    const { boost, boostPublicKey } = await getBoost(mintPublicKey, boostAddress)

    const { stake, stakePublicKey } = await getStake(stakerPublicKey, boostPublicKey)

    const decimals = await getBoostDecimals(mintPublicKey, boostPublicKey)

    const { boostProof, boostProofPublicKey } = await getBoostProof(boostPublicKey)

    const rewards = calculateClaimableYield(boost, boostProof, stake)

    return {
        mintPublicKey: mintPublicKey,
        decimals: decimals,
        boost: boost,
        boostPublicKey: boostPublicKey,
        stake: stake,
        stakePublicKey: stakePublicKey,
        boostProof: boostProof,
        boostProofPublicKey: boostProofPublicKey,
        rewards: rewards,
    }
}

export async function claimStakeOREInstruction(mintAddress: string, boostAddress: string) {
    const rpcUrl = store.getState().config.rpcUrl
    const walletAddress = store.getState().wallet.publicKey

    if (!rpcUrl) {
        throw new CustomError("Rpc is undefined", 500)
    }

    if (!walletAddress) {
        throw new CustomError("Public Key is undefined", 500)
    }

    const connection = new Connection(`https://${rpcUrl}`)
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
        boostProofPublicKey
    } = await getStakeORE(mintAddress, boostAddress)

    const rewards = calculateClaimableYield(boost, boostProof, stake)
    const amountBuffer = Buffer.alloc(8)
    amountBuffer.writeBigUInt64LE(BigInt(rewards))
    
    const beneficiaryPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        staker
    );

    const boostRewardsPublicKey = getAssociatedTokenAddressSync(
        new PublicKey(ORE_MINT),
        boostPublicKey,
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

    return { transaction, rewards: rewards / Math.pow(10, 11), estimatedFee, connection };
}