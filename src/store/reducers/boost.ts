import { Boost, BoostConfig, Proof, Stake } from '@models'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { BoostState } from '@store/types'
import { calculateClaimableYield } from '@services/ore'

const initialState: BoostState = {
    boosts: {},
    boostConfig: undefined,
    boostConfigAddress: undefined,
    boostProof: undefined,
    boostProofAddress: undefined,
    socketAccounts: {},
    rewards: 0,
    avgRewards: 0
}

type boostAction = PayloadAction<{
    boost: Boost
    boostAddress: string
    stake: Stake
    stakeAddress: string
    boostProof: Proof
    boostProofAddress: string
    boostConfig: BoostConfig
    boostConfigAddress: string,
    decimals: number
}>

function generateSockets(socketAccounts: typeof initialState.socketAccounts, type: string, address: string){
    return {
        ...socketAccounts,
        [`${type}-${address}`]: {
            ...socketAccounts[`${type}-${address}`],
            id: `${type}-${address}`,
            account: address 
        }
    }
}

const boostSlice = createSlice({
    name: 'boost',
    initialState: initialState,
    reducers: {
        updateBoost(state, action: boostAction){
            const {
                boost,
                boostAddress,
                stake,
                stakeAddress,
                boostProof,
                boostProofAddress,
                boostConfig,
                boostConfigAddress,
                decimals
            } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    boost: boost,
                    boostAddress: boostAddress,
                    stake: stake,
                    stakeAddress: stakeAddress,
                    decimals: decimals
                }
            }
            state.boostConfig = boostConfig
            state.boostConfigAddress = boostConfigAddress
            state.boostProof = boostProof
            state.boostProofAddress = boostProofAddress
            state.socketAccounts = generateSockets(state.socketAccounts, 'boost', boostAddress)
            state.socketAccounts = generateSockets(state.socketAccounts, 'stake', stakeAddress)
            state.socketAccounts = generateSockets(state.socketAccounts, 'boostProof', boostProofAddress)
            state.socketAccounts = generateSockets(state.socketAccounts, 'boostConfig', boostConfigAddress)
        },
        updateBoostRedux(state, action: PayloadAction<{ boostAddress: string, boost: Boost }>) {
            const { boostAddress, boost } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    boost: boost,
                    boostAddress: boostAddress
                }
            }
            state.socketAccounts = generateSockets(state.socketAccounts, 'boost', boostAddress)
        },
        updateStakeRedux(state, action: PayloadAction<{ boostAddress: string, stakeAddress: string, stake: Stake }>) {
            const { boostAddress, stakeAddress, stake } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    stake: stake,
                    stakeAddress: stakeAddress
                }
            }
            state.socketAccounts = generateSockets(state.socketAccounts, 'stake', stakeAddress)
        },
        updateConfigRedux(state, action: PayloadAction<{ boostConfigAddress: string, boostConfig: BoostConfig }>) {
            const { boostConfigAddress, boostConfig } = action.payload
            Object.assign(state, {
                ...state,
                boostConfig: boostConfig,
                boostConfigAddress: boostConfigAddress,
            })
            state.socketAccounts = generateSockets(state.socketAccounts, 'boostConfig', boostConfigAddress)
        },
        updateProofRedux(state, action: PayloadAction<{ boostProofAddress: string, boostProof: Proof }>) {
            const { boostProofAddress, boostProof } = action.payload
            Object.assign(state, {
                ...state,
                boostProof: boostProof,
                boostProofAddress: boostProofAddress,
            })
            state.socketAccounts = generateSockets(state.socketAccounts, 'boostProof', boostProofAddress)
        },
        updateAllRewards(state){
            let globalRewards = 0
            let globalAvg = 0
            Object.keys(state.boosts).map((key) => {
                if(state.boosts[key].boost && state.boosts[key].stake && state.boostProof
                    && state.boostConfig && state.boosts[key].stakeAddress) {
                    const boost = Boost.fromJSON(state.boosts[key].boost)
                    const stake = Stake.fromJSON(state.boosts[key].stake)
                    const boostProof = Proof.fromJSON(state.boostProof)
                    const boostConfig = BoostConfig.fromJSON(state.boostConfig)

                    let rewards = Number(calculateClaimableYield(boost, boostProof, stake, boostConfig))
                    let claimAt = state.boosts[key].stake?.lastClaimAt ?? dayjs().toISOString()
                    let divided = dayjs(new Date()).diff(dayjs(claimAt), 'minute')

                    divided = divided === 0 ? 1 : divided
                    globalRewards += rewards
                    globalAvg += (rewards / divided * 60 * 24)

                    state.boosts[key] = {
                        ...state.boosts[key],
                        rewards: rewards,
                        avgRewards: (rewards / divided * 60 * 24)
                    }
                }
            })
            state.rewards = globalRewards
            state.avgRewards = globalAvg
        },
        resetBoosts(state) {
            Object.assign(state, initialState);
        }
    }
})

export const boostActions = boostSlice.actions;

export const boostReducer = boostSlice.reducer;
