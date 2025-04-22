import { ReactElement } from 'react'
import dayjs from 'dayjs'
import { Boost, BoostConfig, Proof, Stake } from '@models'

export interface RootState {
    ui: UiState
    wallet: WalletState
    config: ConfigState
    pool: PoolState
    boost: BoostState
    miner: MinerState
}

export interface UiState {
    classNameGlobal: string
    loading: boolean
    bottomModal: {
        visible: boolean
        children?: ReactElement | null
        cancelable?: boolean
    }
}

export interface WalletState {
    publicKey?: string | null
    useMnemonic: boolean
    usePrivateKey: boolean
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

export interface MinerType {
    name: string
    address: string
    pools: string[]
}

// export interface PoolMinerInfo extends MinerInfo {
//     rewards?: number | null
//     hashRate?: string | null
//     claimAt?: string | null
// }

export interface MinerState {
    miners: Record<string, MinerType>
}

export interface PoolType {
    walletAddress?: string | null
    balanceOre: number
    balanceCoal: number
    running: boolean
    avgRewards: {
        ore: number
        coal: number
        startOre: number
        startCoal: number
    },
    earnedOre?: number
    show: boolean
    startMiningAt?: string | null
    lastUpdateAt: string
    lastClaimAt: string
}

export interface PoolState {
    pools: Record<string, PoolType>,
    order: string[]
}
