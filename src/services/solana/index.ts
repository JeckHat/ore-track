import { LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js"

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

export async function getPriorityFee(transaction: Transaction | VersionedTransaction) {
    try {
        const connection = getConnection()

        let publicKeys: string[] = []
        if ('version' in transaction) {
            publicKeys = transaction.message.getAccountKeys().staticAccountKeys.map(key => key.toBase58())
        } else {
            publicKeys = transaction.compileMessage().accountKeys.map(key => key.toBase58())
        }

        const response = await fetch(connection.rpcEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-priority-fee',
                method: 'getPriorityFeeEstimate',
                params: [
                    {
                        accountKeys: publicKeys,
                        options: {
                            recommended: true,
                        },
                    }
                ],
            }),
        });
    
        const data = await response.json();
        return data.result?.priorityFeeEstimate;
        // if (rpcProvider === 'quicknode') {
        //     console.log("quicknode msuk")
        //     const response = await fetch(connection.rpcEndpoint, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({
        //             jsonrpc: '2.0',
        //             id: 'quicknode-priority-fee',
        //             method: 'qn_estimatePriorityFees',
        //             params: { "last_n_blocks": 100, "api_version": 2, "account": PROGRAM_ID }
        //         }),
        //     });

        //     const data = await response.json()
        //     console.log("data", data)
        //     return 100
        // }
    } catch(error) {
        console.log("error", error)
        return 10000
    }
}
