import { PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";

import { BOOST_DENOMINATOR } from "@constants/index";
import { Numeric } from "./Numeric";

export class Boost {
    expiredAt?: dayjs.Dayjs
    mint?: string
    multiplier?: number
    rewardsFactor?: Numeric
    totalDeposits?: number
    totalStakers?: number
    withdrawFee?: number

    constructor(expiredAt?: dayjs.Dayjs, mint?: string, multiplier?: number, rewardsFactor?: Numeric,
        totalDeposits?: number, totalStakers?: number, withdrawFee?: number) {
        this.expiredAt = expiredAt;
        this.mint = mint;
        this.multiplier = multiplier;
        this.rewardsFactor = rewardsFactor;
        this.totalDeposits = totalDeposits;
        this.totalStakers = totalStakers;
        this.withdrawFee = withdrawFee;
    }
}

function tryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const expiredAt = dayjs.unix(Number(buffer.readBigInt64LE(offset)));
        offset += 8;

        const mint = new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
        offset += 32;

        const multiplier = Number(buffer.readBigUInt64LE(offset)) / BOOST_DENOMINATOR;
        offset += 8;

        const rewardsFactor = new Numeric(Array.from(buffer.slice(offset, offset + 16)));
        offset += 16;

        const totalDeposits = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const totalStakers = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const withdrawFee = Number(buffer.readBigUInt64LE(offset));
        offset += 8;


        return new Boost(expiredAt, mint, multiplier, rewardsFactor, totalDeposits, totalStakers, withdrawFee);
    } catch (error) {
        return null;
    }
}

export async function getBoostResult(data?: Buffer) {

    if (!data) {
        throw new Error("Failed to get miner account");
    }

    const proof = tryFromBytes(data);
    if (!proof) {
        throw new Error("Failed to parse miner account");
    }

    return proof;
}