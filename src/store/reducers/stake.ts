import { createSlice } from '@reduxjs/toolkit'

import { StakeState } from '@store/types'

const initialState: StakeState = {
    stakes: {}
}

const stakeSlice = createSlice({
    name: 'stake',
    initialState: initialState,
    reducers: {
        addStake(state, action) {
            state.stakes = {
                ...state.stakes,
                [action.payload.boost]: {
                    ...state.stakes[action.payload.boost],
                    ...action.payload.stake
                }
            }
        },
        setClaimStake(state, action) {
            state.stakes = {
                ...state.stakes,
                [action.payload]: {
                    ...state.stakes[action.payload],
                    claimAt: new Date().toISOString()
                }
            }
        },
        resetStake(state) {
            Object.assign(state, initialState);
        }
    }
})

export const stakeActions = stakeSlice.actions;

export const stakeReducer = stakeSlice.reducer;
