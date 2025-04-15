import { PublicKey } from "@solana/web3.js"


export class KaminoConfig {

    emergencyMode?: number // 8
    blockDeposit?: number // 8
    blockInvest?: number //8
    blockWithdraw?: number // 8

    tokenInfos?: string
    constructor(tokenInfos?: string) {
        this.tokenInfos = tokenInfos;
    }
}

function kaminoConfigTryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        // pub discriminator: [u8; 8],
        offset += 8;
        // pub emergency_mode: u64,
        offset += 8;
        // pub block_deposit: u64,
        offset += 8;
        // pub block_invest: u64,
        offset += 8;
        // pub block_withdraw: u64,
        offset += 8;
        // pub block_collect_fees: u64,
        offset += 8;
        // pub block_collect_rewards: u64,
        offset += 8;
        // pub block_swap_rewards: u64,
        offset += 8;
        // pub block_swap_uneven_vaults: u32,
        offset += 4;
        // pub block_emergency_swap: u32,
        offset += 4;
        // pub min_withdrawal_fee_bps: u64,
        offset += 8;
        // pub scope_program_id: Pubkey,
        offset += 32;
        // pub scope_price_id: Pubkey,
        offset += 32;
        // pub swap_rewards_discount_bps: [u64; 256],
        for (let i = 0; i < 256; i++) {
            offset += 8;
        }
        // pub actions_authority: Pubkey,
        offset += 32;
        // pub admin_authority: Pubkey,
        offset += 32;
        // pub treasury_fee_vaults: [Pubkey; 256],
        for (let i = 0; i < 256; i++) {
            offset += 32;
        }
        const tokenInfos = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub block_local_admin: u64,
        offset += 8;
        // pub min_performance_fee_bps: u64,
        offset += 8;
        // pub min_swap_uneven_slippage_tolerance_bps: u64,
        offset += 8;
        // pub min_reference_price_slippage_tolerance_bps: u64,
        offset += 8;
        // pub actions_after_rebalance_delay_seconds: u64,
        offset += 8;
        // pub treasury_fee_vault_receiver: Pubkey,
        offset += 32;   
        
        return new KaminoConfig(tokenInfos)

    } catch (error) {
        return null;
    }
}

export async function getKaminoConfigResult(data?: Buffer) {
    if (!data) {
        throw new Error("Failed to get miner account");
    }

    const config = kaminoConfigTryFromBytes(data);
    if (!config) {
        throw new Error("Failed to parse miner account");
    }

    return config;
}

export class KaminoStrategy {
    adminAuthority?: string
    globalConfig?: string
    baseVaultAuthority?: string
    pool?: string
    tickArrayLower?: string
    tickArrayUpper?: string
    position?: string
    tokenAVault?: string
    tokenBVault?: string
    tokenAMint?: string
    tokenBMint?: string
    tokenADecimals?: number
    tokenBDecimals?: number
    scopePrices?: string
    sharesMint?: string
    sharesMintAuthority?: string
    tokenATokenProgram?: string
    tokenBTokenProgram?: string

    constructor(adminAuthority?: string, globalConfig?: string, baseVaultAuthority?: string, pool?: string, tickArrayLower?: string,
        tickArrayUpper?: string, position?: string, tokenAVault?: string, tokenBVault?: string, tokenAMint?: string, tokenBMint?: string,
        tokenADecimals?: number, tokenBDecimals?: number, scopePrices?: string, sharesMint?: string, sharesMintAuthority?: string,
        tokenATokenProgram?: string, tokenBTokenProgram?: string) {

        this.adminAuthority = adminAuthority
        this.globalConfig = globalConfig
        this.baseVaultAuthority = baseVaultAuthority
        this.pool = pool
        this.tickArrayLower = tickArrayLower
        this.tickArrayUpper = tickArrayUpper
        this.position = position
        this.tokenAVault = tokenAVault
        this.tokenBVault = tokenBVault
        this.tokenAMint = tokenAMint
        this.tokenBMint = tokenBMint
        this.tokenADecimals = tokenADecimals
        this.tokenBDecimals = tokenBDecimals
        this.scopePrices = scopePrices
        this.sharesMint = sharesMint
        this.sharesMintAuthority = sharesMintAuthority
        this.tokenATokenProgram = tokenATokenProgram
        this.tokenBTokenProgram = tokenBTokenProgram
    }
}

function strategyTryFromBytes(buffer: Buffer) {
    try {
        let offset = 0;
        // pub discriminator: [u8; 8],
        offset += 8;
        const adminAuthority = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const globalConfig = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const baseVaultAuthority = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub base_vault_authority_bump: u64,
        offset += 8;
        const pool = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub pool_token_vault_a: Pubkey,
        offset += 32;
        // pub pool_token_vault_b: Pubkey,
        offset += 32;
        const tickArrayLower = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const tickArrayUpper = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const position = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub position_mint: Pubkey,
        offset += 32;
        // pub position_metadata: Pubkey,
        offset += 32;
        // pub position_token_account: Pubkey,
        offset += 32;
        const tokenAVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const tokenBVault = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub deprecated0: [Pubkey; 2],
        offset += 32; offset += 32;
        // pub deprecated1: [u64; 2],
        offset += 8; offset += 8;
        const tokenAMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const tokenBMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const tokenADecimals = Number(buffer.readBigUInt64LE(offset))
        offset += 8;
        const tokenBDecimals = Number(buffer.readBigUInt64LE(offset))
        // pub token_b_mint_decimals: u64,
        offset += 8;
        // pub token_a_amounts: u64,
        offset += 8;
        // pub token_b_amounts: u64,
        offset += 8;
        // pub token_a_collateral_id: u64,
        offset += 8;
        // pub token_b_collateral_id: u64,
        offset += 8;
        const scopePrices = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub deprecated2: Pubkey,
        offset += 32;
        const sharesMint = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub shares_mint_decimals: u64,
        offset += 8;
        const sharesMintAuthority = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub shares_mint_authority_bump: u64,
        offset += 8;
        // pub shares_issued: u64,
        offset += 8;
        // pub status: u64,
        offset += 8;
        // pub reward0_amount: u64,
        offset += 8;
        // pub reward0_vault: Pubkey,
        offset += 32;
        // pub reward0_collateral_id: u64,
        offset += 8;
        // pub reward0_decimals: u64,
        offset += 8;
        // pub reward1_amount: u64,
        offset += 8;
        // pub reward1_vault: Pubkey,
        offset += 32;
        // pub reward1_collateral_id: u64,
        offset += 8;
        // pub reward1_decimals: u64,
        offset += 8;
        // pub reward2_amount: u64,
        offset += 8;
        // pub reward2_vault: Pubkey,
        offset += 32;
        // pub reward2_collateral_id: u64,
        offset += 8;
        // pub reward2_decimals: u64,
        offset += 8;
        // pub deposit_cap_usd: u64,
        offset += 8;
        // pub fees_a_cumulative: u64,
        offset += 8;
        // pub fees_b_cumulative: u64,
        offset += 8;
        // pub reward0_amount_cumulative: u64,
        offset += 8;
        // pub reward1_amount_cumulative: u64,
        offset += 8;
        // pub reward2_amount_cumulative: u64,
        offset += 8;
        // pub deposit_cap_usd_per_ixn: u64,
        offset += 8;
        // pub withdrawal_cap_a: WithdrawalCaps,
        offset += 32;
        // pub withdrawal_cap_b: WithdrawalCaps,
        offset += 32;
        // pub max_price_deviation_bps: u64,
        offset += 8;
        // pub swap_vault_max_slippage_bps: u32,
        offset += 4;
        // pub swap_vault_max_slippage_from_reference_bps: u32,
        offset += 4;
        // pub strategy_type: u64,
        offset += 8;
        // pub padding0: u64,
        offset += 8;
        // pub withdraw_fee: u64,
        offset += 8;
        // pub fees_fee: u64,
        offset += 8;
        // pub reward0_fee: u64,
        offset += 8;
        // pub reward1_fee: u64,
        offset += 8;
        // pub reward2_fee: u64,
        offset += 8;
        // pub position_timestamp: u64,
        offset += 8;
        // pub kamino_rewards: [KaminoRewardInfo; 3],
        offset += 3 * 120
        // pub strategy_dex: u64,
        offset += 8
        // pub raydium_protocol_position_or_base_vault_authority: Pubkey,
        offset += 32
        // pub allow_deposit_without_invest: u64,
        offset += 8
        // pub raydium_pool_config_or_base_vault_authority: Pubkey,
        offset += 32
        // pub deposit_blocked: u8,
        offset += 1
        // pub creation_status: u8,
        offset += 1
        // pub invest_blocked: u8,
        offset += 1
        // pub share_calculation_method: u8,
        offset += 1
        // pub withdraw_blocked: u8,
        offset += 1
        // pub reserved_flag2: u8,
        offset += 1
        // pub local_admin_blocked: u8,
        offset += 1
        // pub flash_vault_swap_allowed: u8,
        offset += 1
        // pub reference_swap_price_a: Price,
        offset += 16
        // pub reference_swap_price_b: Price,
        offset += 16
        // pub is_community: u8,
        offset += 1
        // pub rebalance_type: u8,
        offset += 1
        // pub padding1: [u8; 6],
        offset += 6
        // pub rebalance_raw: RebalanceRaw,
        offset += 385
        // pub padding2: [u8; 7],
        offset += 7
        // pub token_a_fees_from_rewards_cumulative: u64,
        offset += 8
        // pub token_b_fees_from_rewards_cumulative: u64,
        offset += 8
        // pub strategy_lookup_table: Pubkey,
        offset += 32
        // pub last_swap_uneven_step_timestamp: u64,
        offset += 8
        // pub farm: Pubkey,
        offset += 32
        // pub rebalances_cap: WithdrawalCaps,
        offset += 32;
        // pub swap_uneven_authority: Pubkey,
        offset += 32;
        const tokenATokenProgram = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        const tokenBTokenProgram = new PublicKey(buffer.subarray(offset, offset + 32)).toString();
        offset += 32;
        // pub pending_admin: Pubkey,
        offset += 32;
        // pub padding3: u64,
        // pub padding4: [u128; 13],
        // pub padding5: [u128; 32],
        // pub padding6: [u128; 32],
        // pub padding7: [u128; 32], 
        return new KaminoStrategy(
            adminAuthority,
            globalConfig,
            baseVaultAuthority,
            pool,
            tickArrayLower,
            tickArrayUpper,
            position,
            tokenAVault,
            tokenBVault,
            tokenAMint,
            tokenBMint,
            tokenADecimals,
            tokenBDecimals,
            scopePrices,
            sharesMint,
            sharesMintAuthority,
            tokenATokenProgram,
            tokenBTokenProgram
        )
    } catch (error) {
        return null;
    }
}

export async function getKaminoStrategyResult(data?: Buffer) {
    if (!data) {
        throw new Error("Failed to get miner account");
    }

    const strategy = strategyTryFromBytes(data);
    if (!strategy) {
        throw new Error("Failed to parse miner account");
    }

    return strategy;
}

export class DepositInstructionArgs {
    token_max_a: bigint;
    token_max_b: bigint;

    constructor(token_max_a: bigint, token_max_b: bigint) {
        this.token_max_a = token_max_a;
        this.token_max_b = token_max_b;
    }
}