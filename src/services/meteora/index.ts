import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import { getAssociatedTokenAddressSync, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import * as borsh from 'borsh'

import {
    AddBalanceLiquidityInstructionArgs,
    AddBalanceLiquidityInstructionData,
    CustomError,
    getMeteoraPoolResult,
    getMeteoraVaultResult
} from "@models"
import { getConnection, getWalletAddress } from "@providers"
import { METEORA_AMM_ID, METEORA_VAULT_ID } from "@constants"

export async function getMeteoraPool(poolAddress: string) {
    const connection = getConnection()
    const poolAccountInfo = await connection.getAccountInfo(new PublicKey(poolAddress))
    const meteoraPool = await getMeteoraPoolResult(poolAccountInfo?.data)
    return meteoraPool
}

export async function getMeteoraVault(vaultAddress: string) {
    const connection = getConnection()
    const poolAccountInfo = await connection.getAccountInfo(new PublicKey(vaultAddress))
    const meteoraPool = await getMeteoraVaultResult(poolAccountInfo?.data)
    return meteoraPool
}


export async function depositMeteoraInstruction(poolAddress: string, oreAmount: number, pairAmount: number, slippageRate: number) {
    const connection = getConnection()
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const meteoraPool = await getMeteoraPool(poolAddress)
    if (!meteoraPool) {
        throw new CustomError("Meteora Pool is not found", 500)
    }

    const meteoraVaultA = await getMeteoraVault(meteoraPool.AVault ?? "")
    if (!meteoraVaultA) {
        throw new CustomError("Meteora Vault is not found", 500)
    }
    const meteoraVaultB = await getMeteoraVault(meteoraPool.BVault ?? "")
    if (!meteoraVaultB) {
        throw new CustomError("Meteora Vault is not found", 500)
    }

    const balanceVaultLPA = await connection.getTokenAccountBalance(new PublicKey(meteoraPool?.AVaultLP ?? ""))
    const balanceVaultLPB = await connection.getTokenAccountBalance(new PublicKey(meteoraPool?.BVaultLP ?? ""))

    //pool_lp_mint
    let poolLpMint = await getMint(connection, new PublicKey(meteoraPool.lpMint ?? ""))

    let vaultALPMint = await getMint(connection, new PublicKey(meteoraVaultA.lpMint ?? ""))
    let vaultBLPMint = await getMint(connection, new PublicKey(meteoraVaultB.lpMint ?? ""))

    const slot = await connection.getSlot();
    const timestamp = await connection.getBlockTime(slot);

    let poolTokenAAmount = meteoraVaultA.getAmountByShare(
        (timestamp ?? 0),
        parseFloat(balanceVaultLPA.value.amount),
        vaultALPMint.supply
    )

    let poolTokenBAmount = meteoraVaultB.getAmountByShare(
        (timestamp ?? 0),
        parseFloat(balanceVaultLPB.value.amount),
        vaultBLPMint.supply
    )

    let poolTokenByA = (BigInt(oreAmount) * poolLpMint.supply) / BigInt(poolTokenAAmount ?? 1)
    let poolTokenByB = (BigInt(pairAmount) * poolLpMint.supply) / BigInt(poolTokenBAmount ?? 1)
    let poolTokenAmount = calculatePoolTokenAmount(poolTokenByA, poolTokenByB, BigInt(slippageRate))
    let userPoolLp = getAssociatedTokenAddressSync(new PublicKey(meteoraPool.lpMint ?? ""), new PublicKey(walletAddress));

    const userAToken = getAssociatedTokenAddressSync(
        new PublicKey(meteoraPool.tokenAMint ?? ""),
        new PublicKey(walletAddress)
    )

    const userBToken = getAssociatedTokenAddressSync(
        new PublicKey(meteoraPool.tokenBMint ?? ""),
        new PublicKey(walletAddress)
    )

    const tokenData = getAssociatedTokenAddressSync(
        new PublicKey(meteoraPool.tokenBMint ?? ""),
        new PublicKey(walletAddress)
    )

    const data = new AddBalanceLiquidityInstructionData()
    const schemaData = new Map([
        [AddBalanceLiquidityInstructionData, { 
            kind: "struct", 
            fields: [["discriminator", [8]]] 
        }]
    ])

    const serializedData = Buffer.from(borsh.serialize(schemaData, data))

    const args = new AddBalanceLiquidityInstructionArgs(poolTokenAmount, BigInt(oreAmount), BigInt(pairAmount))

    const schemaArgs = new Map([
        [AddBalanceLiquidityInstructionArgs, { 
            kind: "struct", 
            fields: [
                ["pool_token_amount", "u64"],
                ["maximum_token_a_amount", "u64"],
                ["maximum_token_b_amount", "u64"]
            ] 
        }]
    ]);
    const serializedArgs = Buffer.from(borsh.serialize(schemaArgs, args))

    let finalData = Buffer.concat([serializedData, serializedArgs])

    let accounts = [
        { pubkey: new PublicKey(poolAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraPool.lpMint ?? ""), isSigner: false, isWritable: true },
        { pubkey: userPoolLp, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraPool.AVaultLP ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraPool.BVaultLP ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraPool.AVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraPool.BVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraVaultA.lpMint ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraVaultB.lpMint ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraVaultA.tokenVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(meteoraVaultB.tokenVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(userAToken), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(userBToken), isSigner: false, isWritable: true },

        { pubkey: new PublicKey(walletAddress), isSigner: true, isWritable: false },

        { pubkey: new PublicKey(METEORA_VAULT_ID), isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // ...remainingAccounts.map(acc => ({
        //     pubkey: new PublicKey(acc.pubkey),
        //     isSigner: acc.isSigner,
        //     isWritable: acc.isWritable,
        // })),
    ]
    
    return new TransactionInstruction({
        programId: new PublicKey(METEORA_AMM_ID),
        keys: accounts,
        data: finalData,
    })        

}

function calculatePoolTokenAmount(poolTokenByA: bigint, poolTokenByB: bigint, slippageRate: bigint) {
    let minValue = poolTokenByA < poolTokenByB ? poolTokenByA : poolTokenByB
    let adjustedValue = (minValue * (100n - slippageRate)) / 100n
    return adjustedValue
}