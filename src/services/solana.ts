import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"

import { CustomError } from "@models"
import { store } from "@store/index"
import { SOL_MINT } from "@constants/index"

export async function getBalance(walletAddress: string, mintAddress: string): Promise<number> {
    const rpcUrl = store.getState().config.rpcUrl

    if (!rpcUrl) {
        throw new CustomError("Rpc is undefined", 500)
    }

    const connection = new Connection(`https://${rpcUrl}`)
    const walletPubkey = new PublicKey(walletAddress)

    if (mintAddress === SOL_MINT) {
        const balance = await connection.getBalance(walletPubkey)
        return balance / LAMPORTS_PER_SOL
    }

    const account = await connection.getTokenAccountsByOwner(walletPubkey, { mint: new PublicKey(mintAddress) })
    let balanceMintAddress
    if (account?.value?.[0]) {
        balanceMintAddress = await connection.getTokenAccountBalance(account.value[0].pubkey)
    }
    
    return balanceMintAddress?.value?.uiAmount ?? 0
}