import { Boost, BoostConfig, Proof, Stake } from '@models'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { BoostState } from '@store/types'

const initialState: BoostState = {
    boosts: {},
    socketAccounts: {}
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
                    ...state.boosts[boostAddress],
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
        updateConfigRedux(state, action: PayloadAction<{ boostConfigAddress: string, boostConfig: BoostConfig }>) {
            const { boostConfigAddress, boostConfig } = action.payload
            Object.assign(state, {
                ...state,
                boostConfig: boostConfig.toJSON(),
                boostConfigAddress: boostConfigAddress,
            })
        },
        updateProofRedux(state, action: PayloadAction<{ boostProofAddress: string, boostProof: Proof }>) {
            const { boostProofAddress, boostProof } = action.payload
            Object.assign(state, {
                ...state,
                boostProof: boostProof.toJSON(),
                boostProofAddress: boostProofAddress,
            })
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

            if (!state.boosts[boostAddress]) return

            state.boosts[boostAddress] = {
                ...state.boosts[boostAddress],
                rewards,
                avgRewards: average
            }
        },
        addSocket(state, action: PayloadAction<{ type: string, address: string }>) {
            const { type, address } = action.payload
            state.socketAccounts = {
                ...state.socketAccounts,
                [`${type}-${address}`]: {
                    ...state.socketAccounts[`${type}-${address}`],
                    id: `${type}-${address}`,
                    account: address 
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
