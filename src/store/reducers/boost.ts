import { Boost, BoostConfig, Proof, Stake } from '@models'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { BoostState } from '@store/types'

const initialState: { boosts: Record<string, BoostState>} = {
    boosts: {}
}

const boostSlice = createSlice({
    name: 'boost',
    initialState: initialState,
    reducers: {
        updateBoostRedux(state, action: PayloadAction<{ boostAddress: string, boost: Boost }>) {
            const { boostAddress, boost } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    boost: boost.toJSON(),
                    boostAddress: boostAddress
                }
            }
        },
        updateStakeRedux(state, action: PayloadAction<{ boostAddress: string, stakeAddress: string, stake: Stake }>) {
            const { boostAddress, stakeAddress, stake } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    stake: stake.toJSON(),
                    stakeAddress: stakeAddress
                }
            }
        },
        updateConfigRedux(state, action: PayloadAction<{ boostAddress: string, boostConfigAddress: string, boostConfig: BoostConfig }>) {
            const { boostAddress, boostConfigAddress, boostConfig } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    boostConfig: boostConfig.toJSON(),
                    boostConfigAddress: boostConfigAddress
                }
            }
        },
        updateProofRedux(state, action: PayloadAction<{ boostAddress: string, boostProofAddress: string, boostProof: Proof }>) {
            const { boostAddress, boostProofAddress, boostProof } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    boostProof: boostProof.toJSON(),
                    boostProofAddress: boostProofAddress
                }
            }
        },
        updateDecimals(state, action: PayloadAction<{ boostAddress: string, decimals: number }>) {
            const { boostAddress, decimals } = action.payload
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    decimals: decimals
                }
            }
        },
        updateRewards(state, action: PayloadAction<{ boostAddress: string, rewards: number }>) {
            const { boostAddress, rewards } = action.payload
            let claimAt = state.boosts[boostAddress].stake?.lastClaimAt ?? dayjs().toISOString()
            let divided = dayjs(new Date()).diff(dayjs(claimAt), 'minute')
            divided = divided === 0 ? 1 : divided
            let average = rewards / divided * 60 * 24
            state.boosts = {
                ...state.boosts,
                [boostAddress]: {
                    ...state.boosts[boostAddress],
                    rewards: rewards,
                    avgRewards: average
                }
            }
        },
        resetBoosts(state) {
            Object.assign(state, initialState);
        }
    }
})

export const boostActions = boostSlice.actions;

export const boostReducer = boostSlice.reducer;
