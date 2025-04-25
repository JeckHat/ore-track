import { PublicKey } from "@solana/web3.js";

export class Member {
    id?: number
    pool?: string
    authority?: string
    balance?: number
    totalBalance?: number

    constructor(id?: number, pool?: string, authority?: string, balance?: number, totalBalance?: number) {
        this.id = id;
        this.pool = pool;
        this.authority = authority;
        this.balance = balance;
        this.totalBalance = totalBalance;
    }
}

function tryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const id = Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        const pool =  new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
        offset += 32;

        const authority =  new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
        offset += 32;

        const balance =  Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        const totalBalance =  Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        return new Member(id, pool, authority, balance, totalBalance);
    } catch (error) {
        return null;
    }
}

export async function getMemberResult(data?: Buffer) {

    if (!data) {
        console.log("Failed to get member account")
        return new Member()
    }

    const member = tryFromBytes(data);
    if (!member) {
        console.log("Failed to get member account")
        return new Member()
    }

    return member;
}
