import { createSlice } from '@reduxjs/toolkit'

import { ConfigState } from '@store/types'

const initialState: ConfigState = {
    rpcUrl: "amaleta-5y8tse-fast-mainnet.helius-rpc.com/",
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
