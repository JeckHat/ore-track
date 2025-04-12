import { Connection } from "@solana/web3.js"

import { store } from "@store/index"
import { BoostState } from "@store/types"

const initState = store.getState()
let connection: Connection = new Connection(`https://${initState.config!.rpcUrl}`)
let rpcUrl: string | null = initState.config?.rpcUrl ?? ""
let walletAddress: string | null = initState.wallet?.publicKey ?? ""
let boosts: Record<string, BoostState> = initState.boost?.boosts ?? {}

function isBoostEqual(a: BoostState, b: BoostState): boolean {
    return (
        a.boost?.rewardsFactor?.bits === b.boost?.rewardsFactor?.bits &&
        a.boost?.totalDeposits === b.boost?.totalDeposits &&
        a.boostAddress === b.boostAddress &&
        a.stake?.balance === a.stake?.balance &&
        a.stake?.lastClaimAt === a.stake?.lastClaimAt &&
        a.stake?.lastDespositAt === a.stake?.lastDespositAt &&
        a.stake?.lastWithdrawAt === a.stake?.lastWithdrawAt &&
        a.stake?.lastRewardsFactor?.bits === a.stake?.lastRewardsFactor?.bits &&
        a.stake?.rewards === a.stake?.rewards &&
        a.stakeAddress === b.stakeAddress &&
        a.boostConfig?.rewardsFactor?.bits === b.boostConfig?.rewardsFactor?.bits &&
        a.boostConfig?.takeRate === b.boostConfig?.takeRate &&
        a.boostConfig?.len === b.boostConfig?.len &&
        a.boostConfig?.totalWeight === b.boostConfig?.totalWeight &&
        a.boostConfigAddress === b.boostConfigAddress &&
        a.boostProof?.balance === b.boostProof?.balance && 
        a.boostProof?.lastClaimAt === b.boostProof?.lastClaimAt && 
        a.boostProof?.lastHashAt === b.boostProof?.lastHashAt && 
        a.boostProof?.totalRewards === b.boostProof?.totalRewards && 
        a.boostProof?.totalHashes === b.boostProof?.totalHashes && 
        a.boostProofAddress === b.boostProofAddress && 
        a.decimals === b.decimals &&
        a.rewards === b.rewards
    );
}

function isBoostRecordEqual(
    recordA: Record<string, BoostState>,
    recordB: Record<string, BoostState>
  ): boolean {
    const keysA = Object.keys(recordA);
    const keysB = Object.keys(recordB);
  
    if (keysA.length !== keysB.length) return false;
  
    for (const key of keysA) {
        if (!recordB.hasOwnProperty(key)) return false;
    
        const a = recordA[key];
        const b = recordB[key];
    
        if (!isBoostEqual(a, b)) return false;
    }
  
    return true;
  }

function createConnection(rpcUrl: string) {
    connection = new Connection(`https://${rpcUrl}`)
}

store.subscribe(() => {
    const state = store.getState()
    const newRpcUrl = state.config?.rpcUrl ?? ""
    const newWalletAddress = state.wallet?.publicKey ?? ""

    const newBoosts = state.boost?.boosts ?? {}
    
    if (newRpcUrl !== rpcUrl) {
        createConnection(newRpcUrl)
        rpcUrl = newRpcUrl
    }

    if (newWalletAddress !== walletAddress) {
        walletAddress = newWalletAddress
    }

    if (!isBoostRecordEqual(boosts, newBoosts)) {
        boosts = { ...newBoosts }
    }

})

export function getConnection() {
    return connection
}

export function getWalletAddress() {
    return walletAddress
}

export function getBoostsRedux() {
    return boosts
}