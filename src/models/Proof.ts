import { PublicKey } from "@solana/web3.js"

export class Proof {
    authority?: string
    balance?: number
    challenge?: Uint8Array
    lastHash?: Uint8Array
    lastHashAt?: number
    lastClaimAt?: number
    miner?: string
    totalHashes?: number
    totalRewards?: number

    constructor(authority?: string, balance?: number, challenge?: Uint8Array, lastHash?: Uint8Array, lastHashAt?: number,
        lastClaimAt?: number, miner?: string, totalHashes?: number, totalRewards?: number) {
        this.authority = authority;
        this.balance = balance;
        this.challenge = challenge;
        this.lastHash = lastHash;
        this.lastHashAt = lastHashAt;
        this.lastClaimAt = lastClaimAt;
        this.miner = miner;
        this.totalHashes = totalHashes;
        this.totalRewards = totalRewards;
    }
}

function tryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        offset += 8;

        const authority = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const balance = Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        const challenge = new Uint8Array(buffer.subarray(offset, offset + 32));
        offset += 32;

        const lastHash = new Uint8Array(buffer.subarray(offset, offset + 32));
        offset += 32;

        const lastHashAt = Number(buffer.readBigInt64LE(offset))
        offset += 8;

        const lastClaimAt = Number(buffer.readBigInt64LE(offset))
        offset += 8;

        const miner = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const totalHashes = Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        const totalRewards = Number(buffer.readBigUInt64LE(offset))
        offset += 8;

        return new Proof(authority, balance, challenge, lastHash, lastHashAt, lastClaimAt, miner, totalHashes, totalRewards);
    } catch (error) {
        return null;
    }
}

export async function getProofResult(data?: Buffer) {
    if (!data) {
        console.log("Failed to get proof account")
        return new Proof()
    }

    const proof = tryFromBytes(data);
    if (!proof) {
        console.log("Failed to get proof account")
        return new Proof()
    }

    return proof;
}
