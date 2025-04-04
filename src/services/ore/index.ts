import { PublicKey } from "@solana/web3.js"

import { Boost, CustomError, Numeric, Proof, Stake } from "@models"
import { store } from "@store/index"
import { getBoost, getBoostDecimals, getBoostProof, getStake } from "./boost"

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