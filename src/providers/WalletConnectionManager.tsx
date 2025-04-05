import { Connection } from "@solana/web3.js"
import { store } from "@store/index"
import { StakeInfo } from "@store/types"


const initState = store.getState()
let connection: Connection = new Connection(`https://${initState.config.rpcUrl}`)
let rpcUrl: string | null = initState.config.rpcUrl ?? ""
let walletAddress: string | null = initState.wallet.publicKey ?? ""
let stakes: Record<string, StakeInfo> = initState.stake.stakes

function isStakeInfoEqual(a: StakeInfo, b: StakeInfo): boolean {
    return (
      a.stakeAddress === b.stakeAddress &&
      a.proofAddress === b.proofAddress &&
      a.decimalsLp === b.decimalsLp &&
      a.rewards === b.rewards
    );
}

function isRecordEqual(
    recordA: Record<string, StakeInfo>,
    recordB: Record<string, StakeInfo>
  ): boolean {
    const keysA = Object.keys(recordA);
    const keysB = Object.keys(recordB);
  
    if (keysA.length !== keysB.length) return false;
  
    for (const key of keysA) {
        if (!recordB.hasOwnProperty(key)) return false;
    
        const a = recordA[key];
        const b = recordB[key];
    
        if (!isStakeInfoEqual(a, b)) return false;
    }
  
    return true;
  }

function createConnection(rpcUrl: string) {
    connection = new Connection(`https://${rpcUrl}`)
}

store.subscribe(() => {
    const state = store.getState()
    const newRpcUrl = state.config.rpcUrl ?? ""
    const newWalletAddress = state.wallet.publicKey ?? ""

    console.log("newWalletAddress", newWalletAddress)
    const newStakes = state.stake.stakes
    
    if (newRpcUrl !== rpcUrl) {
        createConnection(newRpcUrl)
        rpcUrl = newRpcUrl
    }

    if (newWalletAddress !== walletAddress) {
        walletAddress = newWalletAddress
    }

    if(!isRecordEqual(newStakes, stakes)) {
        stakes = { ...newStakes }
    }

})

export function getConnection() {
    return connection
}

export function getWalletAddress() {
    console.log("walletAddress", walletAddress)
    return walletAddress
}

export function getStakesRedux() {
    return stakes
}