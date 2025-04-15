import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import * as borsh from 'borsh'

import {
    CustomError,
    getKaminoConfigResult,
    getKaminoStrategyResult,
    DepositInstructionArgs,
} from "@models"
import { getConnection, getWalletAddress } from "@providers"
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { DEPOSIT_INSTRUCTION_KAMINO_DISCRIMINATOR, ORE_MINT } from "@constants"

async function getGlobalConfig() {
    const connection = getConnection()
    const globalConfigInfo = await connection.getAccountInfo(new PublicKey("GKnHiWh3RRrE1zsNzWxRkomymHc374TvJPSTv2wPeYdB"))
    const globalConfig = await getKaminoConfigResult(globalConfigInfo?.data)
    return globalConfig
}

export async function getKaminoStrategy(poolAddress: string) {
    const connection = getConnection()
    const strategyInfo = await connection.getAccountInfo(new PublicKey(poolAddress))
    const strategy = await getKaminoStrategyResult(strategyInfo?.data)
    return strategy
}

export async function depositKaminoInstruction(poolAddress: string, oreAmount: number, pairAmount: number, slippageRate: number) {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }

    const walletPubkey = new PublicKey(walletAddress)

    const config = await getGlobalConfig()
    const strategy = await getKaminoStrategy(poolAddress)

    const userSharesAta = getAssociatedTokenAddressSync(new PublicKey(strategy.sharesMint ?? ""), walletPubkey)

    let tokenAAta = getAssociatedTokenAddressSync(new PublicKey(strategy.tokenAMint ?? ""), walletPubkey)
    let tokenBAta = getAssociatedTokenAddressSync(new PublicKey(strategy.tokenBMint ?? ""), walletPubkey)

    let unitsOre = BigInt(Math.floor(oreAmount * Math.pow(10, strategy.tokenBDecimals ?? 0)))
    let unitsPair = BigInt(Math.floor(pairAmount * Math.pow(10, strategy.tokenADecimals ?? 0)))

    let args = new DepositInstructionArgs(unitsPair, unitsOre);

    if (strategy.tokenAMint === ORE_MINT) {

        unitsOre = BigInt(Math.floor(oreAmount * Math.pow(10, strategy.tokenADecimals ?? 0)))
        unitsPair = BigInt(Math.floor(pairAmount * Math.pow(10, strategy.tokenBDecimals ?? 0)))

        args = new DepositInstructionArgs(unitsOre, unitsPair);
    }

    console.log("MASUL")

    const schemaArgs = new Map([
        [DepositInstructionArgs, {
            kind: "struct",
            fields: [
                ["token_max_a", "u64"],
                ["token_max_b", "u64"]
            ]
        }]
    ])

    const serializedArgs = Buffer.from(borsh.serialize(schemaArgs, args))

    console.log("MASUL serializedArgs")

    let finalData = Buffer.concat([
        DEPOSIT_INSTRUCTION_KAMINO_DISCRIMINATOR,
        serializedArgs
    ])

    console.log("MASUL finalData")

    const accounts = [
        { pubkey: walletPubkey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(poolAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.globalConfig ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.pool ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.position ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tickArrayLower ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tickArrayUpper ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenAVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tokenBVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.baseVaultAuthority ?? ""), isSigner: false, isWritable: false },
        { pubkey: tokenAAta, isSigner: false, isWritable: true },
        { pubkey: tokenBAta, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tokenAMint ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenBMint ?? ""), isSigner: false, isWritable: false },
        { pubkey: userSharesAta, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.sharesMint ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.sharesMintAuthority ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.scopePrices ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(config.tokenInfos ?? ""), isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenATokenProgram ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenBTokenProgram ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey("Sysvar1nstructions1111111111111111111111111"), isSigner: false, isWritable: false },
        // ...remainingAccounts,
    ]

    return new TransactionInstruction({
        programId: new PublicKey("6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc"),
        keys: accounts,
        data: finalData,
    })  


    // let units_a = (amount_a * 10f64.powf(strategy.token_a_mint_decimals as f64)) as u64;
    // let units_b = (amount_a * 10f64.powf(strategy.token_a_mint_decimals as f64)) as u64;
}