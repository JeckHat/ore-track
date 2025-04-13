import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"

import { CustomError } from "@models"
import { SOL_MINT } from "@constants"
import { getConnection } from "@providers"

export async function getBalance(walletAddress: string, mintAddress: string): Promise<number> {

    const connection = getConnection()

    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }

    const walletPubkey = new PublicKey(walletAddress)

    if (mintAddress === SOL_MINT) {
        const balance = await connection.getBalance(walletPubkey)
        return balance / LAMPORTS_PER_SOL
    }

    const account = await connection.getTokenAccountsByOwner(walletPubkey, { mint: new PublicKey(mintAddress) })
    let tokenAmount
    if (account?.value?.[0]) {
        tokenAmount = await connection.getTokenAccountBalance(account.value[0].pubkey)
    }
    
    return tokenAmount?.value?.uiAmount ?? 0
}

export async function getTokenBalance(tokenAddress: string): Promise<number> {
    const connection = getConnection()
    const tokenAmount = await connection.getTokenAccountBalance(new PublicKey(tokenAddress))
    return tokenAmount?.value?.uiAmount ?? 0
}