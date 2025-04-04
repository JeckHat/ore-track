import { createSlice } from '@reduxjs/toolkit'

import { UiState } from '@store/types'

const initialState: UiState = {
    classNameGlobal: 'bg-baseBg',
    loading: false,
    bottomModal: {
        visible: false,
        cancelable: true,
        children: null
    }
}

const uiSlice = createSlice({
    name: 'ui',
    initialState: initialState,
    reducers: {
        showLoading(state, action) {
            state.loading = action.payload;
        },
        changeClassNameGlobal(state, action) {
            state.classNameGlobal = action.payload
        },
        onChangeBottomModal(state, action) {
            state.bottomModal = {
                ...state.bottomModal,
                ...action.payload
            }
        }
    }
})

export const uiActions = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
