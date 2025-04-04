import { PublicKey } from "@solana/web3.js"
import { MintLayout } from "@solana/spl-token"

import { store } from "@store/index"
import { BOOST, BOOST_ID, BOOSTLIST, PROGRAM_ID, PROOF, STAKE } from "@constants"
import { CustomError, getBoostResult, getStakeResult } from "@models"
import { stakeActions } from "@store/actions"
import { getConnection, getStakesRedux } from "@providers"

export async function getBoost(mintPublicKey: PublicKey, boostAddress?: string | PublicKey | null) {
    const connection = getConnection()

    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }

    let boostPublicKey: PublicKey
    if (!boostAddress) {
        boostPublicKey = PublicKey.findProgramAddressSync(
            [...[BOOST], ...[mintPublicKey.toBytes()]],
            new PublicKey(BOOST_ID)
        )?.[0]
    } else if (typeof boostAddress === 'string') {
        boostPublicKey = new PublicKey(boostAddress)
    } else {
        boostPublicKey = PublicKey.findProgramAddressSync(
            [...[BOOST], ...[mintPublicKey.toBytes()]],
            new PublicKey(BOOST_ID)
        )?.[0]
    }
    const boostAccountInfo = await connection.getAccountInfo(boostPublicKey)
    const boost = await getBoostResult(boostAccountInfo?.data)
    
    return { boost, boostPublicKey }
}


export async function getStake(walletPublicKey: PublicKey, boostPublicKey: PublicKey) {
    const connection = getConnection()
    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }
    const stakeRedux = getStakesRedux()[boostPublicKey.toBase58()]

    let stakePublicKey: PublicKey
    if (typeof stakeRedux?.stakeAddress === 'string') {
        stakePublicKey = new PublicKey(stakeRedux?.stakeAddress)
    } else {
        stakePublicKey = PublicKey.findProgramAddressSync(
            [...[STAKE], ...[walletPublicKey.toBytes()], ...[boostPublicKey.toBytes()]],
            new PublicKey(BOOST_ID)
        )?.[0]
        store.dispatch(stakeActions.addStake({
            boost: boostPublicKey.toBase58(),
            stake: {
                stakeAddress: stakePublicKey.toBase58(),
            }
        }))
    }
    const stakeAccountInfo = await connection.getAccountInfo(stakePublicKey)
    const stake = await getStakeResult(stakeAccountInfo?.data)
    
    return { stake, stakePublicKey }
}

export async function getBoostDecimals(mintPublicKey: PublicKey, boostPublicKey: PublicKey) {
    const connection = getConnection()
    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }

    let decimals = BOOSTLIST[boostPublicKey.toBase58()].decimals
    if (typeof BOOSTLIST[boostPublicKey.toBase58()].decimals !== 'number') {
        const mint = await connection.getAccountInfo(mintPublicKey)
        if (!mint) {
            throw new CustomError("Mint Address is not found", 500)
        }
        const mintData = MintLayout.decode(mint.data)
        decimals = mintData.decimals
    }
    
    return decimals
}

export async function getBoostProof(boostPublicKey: PublicKey) {
    const connection = getConnection()
    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }
    const stakeRedux = getStakesRedux()[boostPublicKey.toBase58()]

    let boostProofPublicKey: PublicKey
    if (stakeRedux?.proofAddress) {
        boostProofPublicKey = new PublicKey(stakeRedux?.proofAddress)
    } else {
        boostProofPublicKey = PublicKey.findProgramAddressSync(
            [...[PROOF], ...[boostPublicKey.toBytes()]],
            new PublicKey(PROGRAM_ID)
        )?.[0]
        store.dispatch(stakeActions.addStake({
            boost: boostPublicKey.toBase58(),
            stake: {
                proofAddress: boostProofPublicKey.toBase58(),
            }
        }))
    }

    const proofAccountInfo = await connection.getAccountInfo(boostProofPublicKey)
    const boostProof = await getStakeResult(proofAccountInfo?.data)
    
    return { boostProof, boostProofPublicKey }
}