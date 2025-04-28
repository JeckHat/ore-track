import { ReactElement } from 'react'

import { Boost, BoostConfig, Proof, Stake } from '@models'

export interface RootState {
    ui: UiState
    wallet: WalletState
    config: ConfigState
    boost: BoostState
    pools: PoolState
    miners: MinerState
    minerPools: MinerPoolState
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

export interface BoostType {
    boost?: Boost
    boostAddress?: string
    stake?: Stake
    stakeAddress?: string
    decimals?: number
    rewards: number
    avgRewards: number
    liquidityPair?: liqudityPairType
}

export interface liqudityPairType {
    depositsOre: number
    depositsPair: number
    totalValueUsd: number
    shares: number
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
    netDeposits: number
}

export interface MinerType {
    id: string
    name: string
    address: string
    isMain: boolean
    minerPoolIds: string[]
}

export interface MinerState {
    byId: Record<string, MinerType>
    order: string[]
}

export interface PoolType {
    id: string
    name: string
    isCoal: boolean
    rewardsOre: number
    rewardsCoal: number
    avgOre: number
    avgCoal: number
    totalRunning: number
    show: boolean
    minerPoolIds: string[]
}

export interface PoolState {
    byId: Record<string, PoolType>
    order: string[]
}

export interface MinerPoolType {
    id: string
    minerId: string
    poolId: string
    rewardsOre: number
    rewardsCoal: number
    avgRewards: {
        ore: number
        coal: number
        initOre: number
        initCoal: number
    }
    earnedOre: number
    running: boolean
    startMiningAt?: string | null
    lastUpdateAt: string
    lastClaimAt: string
}

export interface MinerPoolState {
    byId: Record<string, MinerPoolType>
    order: string[]
}