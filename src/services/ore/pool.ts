import { PublicKey } from "@solana/web3.js"

import { MEMBER, POOL_ID } from "@constants"
import { CustomError, getMemberResult } from "@models"
import { getConnection } from "@providers"

export async function getMember(miner: PublicKey, pool: PublicKey) {
    const connection = getConnection()
    if (!connection) {
        throw new CustomError("Rpc Connection is undefined", 500)
    }

    const memberPublicKey = PublicKey.findProgramAddressSync(
        [
            ...[...[MEMBER]],
            ...[miner.toBytes()],
            ...[pool.toBytes()]
        ],
        new PublicKey(POOL_ID)
    )?.[0]

    const memberInfo = await connection.getAccountInfo(memberPublicKey)
    const member = await getMemberResult(memberInfo?.data)
    
    return { member, memberPublicKey }
}
