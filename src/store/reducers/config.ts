import { createSlice } from '@reduxjs/toolkit'

import { ConfigState } from '@store/types'

const initialState: ConfigState = {
    rpcUrl: "api.devnet.solana.com",
}

const configSlice = createSlice({
    name: 'config',
    initialState: initialState,
    reducers: {
        setRpcUrl(state, action) {
            state.rpcUrl = action.payload;
        },
    }
})

export const configActions = configSlice.actions;

export const configReducer = configSlice.reducer;
