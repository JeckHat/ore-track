import { Connection } from "@solana/web3.js"
import { store } from "@store/index"


let connection: Connection | null = null
let rpcUrl = null
let walletAddress: string | null = null

function createConnection(rpcUrl: string) {
    connection = new Connection(`https://${rpcUrl}`)
}

store.subscribe(() => {
    const state = store.getState()
    const newRpcUrl = state.config.rpcUrl ?? ""
    const newWalletAddress = state.wallet.publicKey ?? ""
    
    if (newRpcUrl !== rpcUrl) {
        createConnection(newRpcUrl)
    }

    if (newWalletAddress !== walletAddress) {
        walletAddress = newWalletAddress
    }
})

export function getConnection() {
    return connection
}

export function getWalletAddress() {
    return walletAddress
}