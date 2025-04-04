import { createSlice } from '@reduxjs/toolkit'

import { MinerState } from '@store/types'

const initialState: MinerState = {
    miners: {},
    pools: {}
}

const MinerSlice = createSlice({
    name: 'stake',
    initialState: initialState,
    reducers: {
        addMiner(state, action) {
            state.miners = {
                ...state.miners,
                [action.payload.publicKey]: {
                    ...state.miners[action.payload.publicKey],
                    ...action.payload.stake
                }
            }
        },
        editMiner(state, action) {
            state.miners = {
                ...state.miners,
                [action.payload.publicKey]: {
                    ...state.miners[action.payload.publicKey],
                    ...action.payload.stake
                }
            }
        },
        deleteMiner(state, action) {
            let miners = { ...state.miners }
            delete miners[action.payload.publicKey]
            state.miners = { ...miners }
        },
        updatePoolMiner(state, action) {
            state.miners = {
                ...state.miners,
                [action.payload.publicKey]: {
                    ...state.miners[action.payload.publicKey],
                    ...action.payload.miner
                }
            }
        },
        deletePoolMiner(state, action) {
            let pools = { ...state.pools }
            delete pools[action.payload.publicKey]
            state.pools = { ...pools }
        },
        resetMiner(state) {
            Object.assign(state, initialState);
        },
    }
})

export const minerActions = MinerSlice.actions;

export const minerReducer = MinerSlice.reducer;
