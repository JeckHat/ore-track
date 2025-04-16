import { ReactElement } from 'react'
import dayjs from 'dayjs'
import { Boost, BoostConfig, Proof, Stake } from '@models'

export interface RootState {
    ui: UiState
    wallet: WalletState
    config: ConfigState
    pool: { pools: Record<string, PoolState> }
    boost: BoostState
}

interface bottomModalState {
    visible: boolean
    children?: ReactElement | null
    cancelable?: boolean
}

export interface UiState {
    classNameGlobal: string
    loading: boolean
    bottomModal: bottomModalState
}

export interface WalletState {
    publicKey?: string | null
}

export interface ConfigState {
    rpcUrl?: string | null
}

export interface StakeInfo {
    stakeAddress?: string
    proofAddress?: string
    lastClaimAt: dayjs.Dayjs
    lastDepositAt: dayjs.Dayjs
    lastWithdrawAt: dayjs.Dayjs
    decimals?: number
    rewards: number
}

export interface BoostType {
    boost?: Boost
    boostAddress?: string
    stake?: Stake
    stakeAddress?: string
    decimals?: number
    rewards: number
    avgRewards: number
}

export interface BoostState {
    boosts: Record<string, BoostType>
    boostConfig?: BoostConfig
    boostConfigAddress?: string
    boostProof?: Proof
    boostProofAddress?: string
    socketAccounts: Record<string, { id: string, account: string }>
    rewards: number
    avgRewards: number
}

export interface MinerInfo {
    publicKey: string
    privateKey?: string | null
    mnemonic?: string | null
}

export interface PoolMinerInfo extends MinerInfo {
    rewards?: number | null
    hashRate?: string | null
    claimAt?: string | null
}

export interface MinerState {
    miners: Record<string, MinerInfo>
    pools: Record<string, PoolMinerInfo>
}

export interface PoolState {
    walletAddress?: string | null
    balanceOre: number
    balanceCoal: number
    runningOre: boolean
    runningCoal: boolean
    avgRewards: {
        ore: number
        coal: number,
        startOre: number,
        startCoal: number
    },
    startMiningAt?: string | null
    lastUpdateAt: string
    lastClaimAt: string
}

