import { ReactElement } from 'react'
import dayjs from 'dayjs'

export interface RootState {
    ui: UiState
    wallet: WalletState
    config: ConfigState
    pool: { pools: Record<string, PoolState> }
    stake: StakeState
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
    decimalsLp: number
    rewards: number
}

export interface StakeState {
    stakes: Record<string, StakeInfo>
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
    lastUpdateAt: string
    lastClaimAt: string
}

