import { PublicKey } from "@solana/web3.js"

export class MeteoraPool {
    lpMint?: string
    tokenAMint?: string
    tokenBMint?: string
    AVault?: string
    BVault?: string
    AVaultLP?: string
    BVaultLP?: string

    constructor(lpMint?: string, tokenAMint?: string, tokenBMint?: string, AVault?: string, BVault?: string,
        AVaultLP?: string, BVaultLP?: string) {
        this.lpMint = lpMint;
        this.tokenAMint = tokenAMint;
        this.tokenBMint = tokenBMint;
        this.AVault = AVault;
        this.BVault = BVault;
        this.AVaultLP = AVaultLP;
        this.BVaultLP = BVaultLP;
    }
}

function meteoraPoolTryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        // offset += 8;

        offset += 8;

        const lpMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const tokenAMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        const tokenBMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        const AVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        const BVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        const AVaultLP = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        const BVaultLP = new PublicKey(buffer.subarray(offset, offset + 32)).toString(); 
        offset += 32;

        return new MeteoraPool(lpMint, tokenAMint, tokenBMint, AVault, BVault, AVaultLP, BVaultLP);
    } catch (error) {
        return null;
    }
}

export async function getMeteoraPoolResult(data?: Buffer) {
    if (!data) {
        throw new Error("Failed to get miner account");
    }

    const proof = meteoraPoolTryFromBytes(data);
    if (!proof) {
        throw new Error("Failed to parse miner account");
    }

    return proof;
}

export class MeteoraVault {
    discriminator?: string
    enabled?: boolean
    bumps?: any
    totalAmount?: number
    tokenVault?: string
    feeVault?: string
    tokenMint?: string
    lpMint?: string
    strategies?: string[]
    base?: string
    admin?: string
    operator?: string
    lockedProfitTracker?: LockedProfitTracker

    constructor(discriminator?: string, enabled?: boolean, bumps?: any, totalAmount?: number, tokenVault?: string, feeVault?: string,
        tokenMint?: string, lpMint?: string, strategies?: string[], base?: string, admin?: string, operator?: string,
        lockedProfitTracker?: LockedProfitTracker
    ) {
        this.discriminator = discriminator
        this.enabled = enabled
        this.bumps = bumps
        this.totalAmount = totalAmount
        this.tokenVault = tokenVault
        this.feeVault = feeVault
        this.tokenMint = tokenMint
        this.lpMint = lpMint
        this.strategies = strategies
        this.base = base
        this.admin = admin
        this.operator = operator
        this.lockedProfitTracker = lockedProfitTracker
    }

    getAmountByShare(currentTime: number, share: number, totalSupply: bigint) {
        let totalAmount = this.getUnlockedAmount(currentTime);
        let shareBigInt = BigInt(share);
        // let totalSupplyBigInt = BigInt(totalSupply);

        if (totalSupply === BigInt(0)) return null; // Hindari pembagian dengan nol

        // Perhitungan: (share * total_amount) / total_supply
        let result = (shareBigInt * BigInt(totalAmount ?? 0)) / totalSupply;
        
        return result >= BigInt(0) ? result : BigInt(0);
    }

    getUnlockedAmount(currentTime: number) {
        let lockedProfit = this.lockedProfitTracker?.calculateLockedProfit(BigInt(currentTime));
        let unlockedAmount = BigInt(this?.totalAmount ?? 0) - BigInt(lockedProfit ?? 0);
        return unlockedAmount >= 0 ? unlockedAmount : BigInt(0);
    }
}

function meteoraVaultTryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        const discriminator = "8"
        offset += 8;

        const enabled = buffer.readUInt8(offset) === 1
        offset += 1
        
        //bumps
        const bumps = 2
        offset += 2

        //totalAmount
        const totalAmount = Number(buffer.readBigUInt64LE(offset))
        offset += 8

        const tokenVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32

        //fee vault pubkey
        const feeVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32
        
        //token_mint pubkey
        const tokenMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32

        const lpMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        let strategies: string[] = [];
        for (let i = 0; i < 30; i++) {
            strategies.push(new PublicKey(buffer.subarray(offset, offset + 32)).toString());
            offset += 32;
        }

        const base = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const admin = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const operator = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;

        const lastUpdatedLockedProfit = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const lastReport = Number(buffer.readBigUInt64LE(offset));
        offset += 8;

        const lockedProfitDegradation = Number(buffer.readBigUInt64LE(offset));
        offset += 8;


        return new MeteoraVault(discriminator, enabled, bumps, totalAmount, tokenVault, feeVault, tokenMint, lpMint,
            strategies, base, admin, operator, new LockedProfitTracker(lastUpdatedLockedProfit, lastReport, lockedProfitDegradation));
    } catch (error) {
        return null;
    }
}

export async function getMeteoraVaultResult(data?: Buffer) {
    if (!data) {
        throw new Error("Failed to get miner account");
    }

    const proof = meteoraVaultTryFromBytes(data);
    if (!proof) {
        throw new Error("Failed to parse miner account");
    }

    return proof;
}

class LockedProfitTracker {
    lastUpdatedLockedProfit: bigint
    lastReport: bigint
    lockedProfitDegradation: bigint

    constructor(lastUpdatedLockedProfit: number, lastReport: number, lockedProfitDegradation: number) {
        this.lastUpdatedLockedProfit = BigInt(lastUpdatedLockedProfit);
        this.lastReport = BigInt(lastReport)
        this.lockedProfitDegradation = BigInt(lockedProfitDegradation);
    }

    calculateLockedProfit(currentTime: bigint) {
        // currentTime = currentTime
        if (currentTime <= this.lastReport) {
            return this.lastUpdatedLockedProfit;
        }

        let timeDiff = currentTime - this.lastReport;
        let degradation = (this.lastUpdatedLockedProfit * BigInt(timeDiff)) / this.lockedProfitDegradation;

        return this.lastUpdatedLockedProfit > degradation
            ? this.lastUpdatedLockedProfit - degradation
            : BigInt(0);
    }
}

export class AddBalanceLiquidityInstructionArgs {
    pool_token_amount: bigint
    maximum_token_a_amount: bigint
    maximum_token_b_amount: bigint

    constructor(pool_token_amount: bigint, maximum_token_a_amount: bigint, maximum_token_b_amount: bigint) {
        this.pool_token_amount = pool_token_amount || 0n;
        this.maximum_token_a_amount = maximum_token_a_amount || 0n;
        this.maximum_token_b_amount = maximum_token_b_amount || 0n;
    }
}

export class AddBalanceLiquidityInstructionData {
    discriminator: Uint8Array
    constructor() {
        this.discriminator = new Uint8Array([168, 227, 50, 62, 189, 171, 84, 176]);
    }
}

