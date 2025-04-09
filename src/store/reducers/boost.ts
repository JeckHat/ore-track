import { createSlice } from '@reduxjs/toolkit'

import { BoostState } from '@store/types'

const initialState: { boosts: Record<string, BoostState>} = {
    boosts: {}
}

const boostSlice = createSlice({
    name: 'boost',
    initialState: initialState,
    reducers: {
        updateBoostRedux(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    boost: action.payload.boost,
                    boostAddress: action.payload.boostAddress
                }
            }
        },
        updateStakeRedux(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    stake: action.payload.stake,
                    stakeAddress: action.payload.stakeAddress
                }
            }
        },
        updateConfigRedux(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    boostConfig: action.payload.boostConfig,
                    boostConfigAddress: action.payload.boostConfigAddress
                }
            }
        },
        updateProofRedux(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    boostProof: action.payload.boostProof,
                    boostProofAddress: action.payload.boostProofAddress
                }
            }
        },
        updateDecimals(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    decimals: action.payload.decimals
                }
            }
        },
        updateRewards(state, action) {
            state.boosts = {
                ...state.boosts,
                [action.payload.boostAddress]: {
                    ...state.boosts[action.payload.boostAddress],
                    rewards: action.payload.rewards
                }
            }
        },
        // addStake(state, action) {
        //     state.stakes = {
        //         ...state.stakes,
        //         [action.payload.boost]: {
        //             ...state.stakes[action.payload.boost],
        //             ...action.payload.stake
        //         }
        //     }
        // },
        // setClaimStake(state, action) {
        //     state.stakes = {
        //         ...state.stakes,
        //         [action.payload]: {
        //             ...state.stakes[action.payload],
        //             claimAt: new Date().toISOString()
        //         }
        //     }
        // },
        resetBoosts(state) {
            Object.assign(state, initialState);
        }
    }
})

export const boostActions = boostSlice.actions;

export const boostReducer = boostSlice.reducer;
