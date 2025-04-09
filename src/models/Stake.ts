import { PublicKey } from "@solana/web3.js"
import dayjs from "dayjs";
import { Numeric } from "./Numeric";

export class Stake {
    authority?: string
    balance?: number
    boost?: string
    lastClaimAt?: string
    lastDespositAt?: string
    lastWithdrawAt?: string
    lastRewardsFactor?: Numeric
    rewards?: number

    constructor(authority?: string, balance?: number, boost?: string, lastClaimAt?: string, lastDespositAt?: string,
        lastWithdrawAt?: string, lastRewardsFactor?: Numeric, rewards?: number) {
        this.authority = authority;
        this.balance = balance;
        this.boost = boost;
        this.lastClaimAt = lastClaimAt;
        this.lastDespositAt = lastDespositAt;
        this.lastWithdrawAt = lastWithdrawAt;
        this.lastRewardsFactor = lastRewardsFactor;
        this.rewards = rewards;
    }
}

function tryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const authority = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const balance = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const boost = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const lastClaimAt = dayjs.unix(Number(buffer.readBigInt64LE(offset))).toISOString();
        offset += 8;

        const lastDespositAt = dayjs.unix(Number(buffer.readBigInt64LE(offset))).toISOString();
        offset += 8;

        const lastWithdrawAt = dayjs.unix(Number(buffer.readBigInt64LE(offset))).toISOString();
        offset += 8;

        const lastRewardsFactor = new Numeric(Array.from(buffer.subarray(offset, offset + 16)));
        offset += 16;

        const rewards = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        return new Stake(authority, balance, boost, lastClaimAt, lastDespositAt, lastWithdrawAt, lastRewardsFactor, rewards);
    } catch (error) {
        return null;
    }
}

export async function getStakeResult(data?: Buffer) {
    if (!data) {
        console.log("Failed to get stake account")
        return new Stake()
    }

    const stake = tryFromBytes(data);
    if (!stake) {
        console.log("Failed to get stake account")
        return new Stake()
    }

    return stake;
}
