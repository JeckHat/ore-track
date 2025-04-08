import { PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";

import { BOOST_DENOMINATOR } from "@constants";
import { Numeric } from "./Numeric";

export class Boost {
    expiredAt?: dayjs.Dayjs
    lastRewardsFactor?: Numeric
    mint?: string
    rewardsFactor?: Numeric
    totalDeposits?: number
    totalStakers?: number
    weight?: number
    withdrawFee?: number

    constructor(expiredAt?: dayjs.Dayjs, lastRewardsFactor?: Numeric, mint?: string, rewardsFactor?: Numeric,
        totalDeposits?: number, totalStakers?: number, weight?: number, withdrawFee?: number) {
        this.expiredAt = expiredAt;
        this.lastRewardsFactor = lastRewardsFactor;
        this.mint = mint;
        this.rewardsFactor = rewardsFactor;
        this.totalDeposits = totalDeposits;
        this.totalStakers = totalStakers;
        this.weight = weight;
        this.withdrawFee = withdrawFee;
    }
}

function tryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const expiredAt = dayjs.unix(Number(buffer.readBigInt64LE(offset)));
        offset += 8;

        const lastRewardsFactor = new Numeric(Array.from(buffer.slice(offset, offset + 16)));
        offset += 16;

        const mint = new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
        offset += 32;

        const rewardsFactor = new Numeric(Array.from(buffer.slice(offset, offset + 16)));
        offset += 16;

        const totalDeposits = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const totalStakers = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const weight = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const withdrawFee = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        return new Boost(expiredAt, lastRewardsFactor, mint, rewardsFactor, totalDeposits, totalStakers, weight, withdrawFee);
    } catch (error) {
        return null;
    }
}

export async function getBoostResult(data?: Buffer) {

    if (!data) {
        console.log("Failed to get boost account")
        return new Boost()
    }

    const boost = tryFromBytes(data);
    if (!boost) {
        console.log("Failed to get boost account")
        return new Boost()
    }

    return boost;
}

export class BoostConfig {
    admin?: string
    boosts?: string[]
    len?: number
    rewardsFactor?: Numeric
    takeRate?: number
    totalWeight?: number

    constructor(admin?: string, boosts?: string[], len?: number, rewardsFactor?: Numeric,
        takeRate?: number, totalWeight?: number) {
        this.admin = admin;
        this.boosts = boosts;
        this.len = len;
        this.rewardsFactor = rewardsFactor;
        this.takeRate = takeRate;
        this.totalWeight = totalWeight;
    }
}

function configTryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const admin = new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
        offset += 32;

        const boosts: string[] = [];
        for (let i = 0; i < 256; i++) {
            const start = offset + i * 32;
            const end = start + 32;
            boosts.push(new PublicKey(buffer.subarray(start, end)).toBase58())
        }
        offset += 256 * 32

        const len = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const rewardsFactor = new Numeric(Array.from(buffer.slice(offset, offset + 16)));
        offset += 16;

        const takeRate = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const totalWeight = Number(buffer.readBigUInt64LE(offset));
        offset += 8;
        
        return new BoostConfig(admin, boosts, len, rewardsFactor, takeRate, totalWeight);
    } catch (error) {
        return null;
    }
}

export async function getBoostConfigResult(data?: Buffer) {

    if (!data) {
        console.log("Failed to get boost config")
        return new BoostConfig()
    }

    const boost = configTryFromBytes(data);
    if (!boost) {
        console.log("Failed to get boost config")
        return new BoostConfig()
    }

    return boost;
}
