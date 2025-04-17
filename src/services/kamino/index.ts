import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import * as borsh from 'borsh'
import { getConnection, getWalletAddress } from "@providers"
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { MEMO_PROGRAM_ID } from "@solana/spl-memo"

import { 
    DEPOSIT_INSTRUCTION_KAMINO_DISCRIMINATOR,
    KAMINO_TREASURY_FEE_VAULT,
    ORE_MINT,
    WHIRLPOOL_PROGRAM_ID,
    WITHDRAW_INSTRUCTION_KAMINO_DISCRIMINATOR,
    YVAULTS_ID
} from "@constants"
import {
    CustomError,
    getKaminoConfigResult,
    getKaminoStrategyResult,
    KaminoDepositInstructionArgs,
    KaminoWithdrawInstructionArgs
} from "@models"

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

export async function depositKaminoInstruction(poolAddress: string, oreAmount: number, pairAmount: number) {
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

    let args = new KaminoDepositInstructionArgs(unitsPair, unitsOre);

    if (strategy.tokenAMint === ORE_MINT) {

        unitsOre = BigInt(Math.floor(oreAmount * Math.pow(10, strategy.tokenADecimals ?? 0)))
        unitsPair = BigInt(Math.floor(pairAmount * Math.pow(10, strategy.tokenBDecimals ?? 0)))

        args = new KaminoDepositInstructionArgs(unitsOre, unitsPair);
    }

    const schemaArgs = new Map([
        [KaminoDepositInstructionArgs, {
            kind: "struct",
            fields: [
                ["token_max_a", "u64"],
                ["token_max_b", "u64"]
            ]
        }]
    ])

    const serializedArgs = Buffer.from(borsh.serialize(schemaArgs, args))

    let finalData = Buffer.concat([
        DEPOSIT_INSTRUCTION_KAMINO_DISCRIMINATOR,
        serializedArgs
    ])

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
        programId: new PublicKey(YVAULTS_ID),
        keys: accounts,
        data: finalData,
    })  


    // let units_a = (amount_a * 10f64.powf(strategy.token_a_mint_decimals as f64)) as u64;
    // let units_b = (amount_a * 10f64.powf(strategy.token_a_mint_decimals as f64)) as u64;
}

export async function withdrawKaminoInstruction(poolAddress: string, sharesAmount: number) {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
        throw new CustomError("Wallet Address is undefined", 500)
    }
    const walletPubkey = new PublicKey(walletAddress)
    
    // if shares_amount == 0 {
    //     return Err(GatewayError::Unknown);
    // }
    
    // const config = await getGlobalConfig()
    const strategy = await getKaminoStrategy(poolAddress)

    const eventAuthority = new PublicKey(YVAULTS_ID)

    const treasuryTokenAVault = PublicKey.findProgramAddressSync(
        [...[KAMINO_TREASURY_FEE_VAULT], ...[new PublicKey(strategy.tokenAMint ?? "").toBytes()]],
        new PublicKey(YVAULTS_ID)
    )?.[0]

    const treasuryTokenBVault = PublicKey.findProgramAddressSync(
        [...[KAMINO_TREASURY_FEE_VAULT], ...[new PublicKey(strategy.tokenBMint ?? "").toBytes()]],
        eventAuthority
    )?.[0]

    const whirlpoolProgram = new PublicKey(WHIRLPOOL_PROGRAM_ID)

    const userSharesAta = getAssociatedTokenAddressSync(new PublicKey(strategy.sharesMint ?? ""), walletPubkey)
    let tokenAAta = getAssociatedTokenAddressSync(new PublicKey(strategy.tokenAMint ?? ""), walletPubkey)
    let tokenBAta = getAssociatedTokenAddressSync(new PublicKey(strategy.tokenBMint ?? ""), walletPubkey)

    let args = new KaminoWithdrawInstructionArgs(BigInt(sharesAmount));

    const schemaArgs = new Map([
        [KaminoWithdrawInstructionArgs, {
            kind: "struct",
            fields: [
                ["shares_amount", "u64"]
            ]
        }]
    ])

    const serializedArgs = Buffer.from(borsh.serialize(schemaArgs, args))

    let finalData = Buffer.concat([
        WITHDRAW_INSTRUCTION_KAMINO_DISCRIMINATOR,
        serializedArgs
    ])

    const accounts = [
        { pubkey: walletPubkey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(poolAddress), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.globalConfig ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.pool ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.position ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tickArrayLower ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tickArrayUpper ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tokenAVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tokenBVault ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.baseVaultAuthority ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.poolTokenVaultA ?? ""), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.poolTokenVaultB ?? ""), isSigner: false, isWritable: true },
        { pubkey: tokenAAta, isSigner: false, isWritable: true },
        { pubkey: tokenBAta, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.tokenAMint ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenBMint ?? ""), isSigner: false, isWritable: false },
        { pubkey: userSharesAta, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(strategy.sharesMint ?? ""), isSigner: false, isWritable: true },
        { pubkey: treasuryTokenAVault, isSigner: false, isWritable: true },
        { pubkey: treasuryTokenBVault, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenATokenProgram ?? ""), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.tokenBTokenProgram ?? ""), isSigner: false, isWritable: false },
        { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: new PublicKey(strategy.positionTokenAccount ?? ""), isSigner: false, isWritable: true },
        { pubkey: whirlpoolProgram, isSigner: false, isWritable: false },
        { pubkey: new PublicKey("Sysvar1nstructions1111111111111111111111111"), isSigner: false, isWritable: false },
        // ...remainingAccounts,
    ]

    accounts.push({
        pubkey: eventAuthority ?? new PublicKey(YVAULTS_ID),
        isSigner: false,
        isWritable: false,
    })

    return new TransactionInstruction({
        programId: new PublicKey(YVAULTS_ID),
        keys: accounts,
        data: finalData,
    })
}
