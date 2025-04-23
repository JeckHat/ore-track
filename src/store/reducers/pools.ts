import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { POOL_LIST } from '@constants'
import { PoolState } from '@store/types'

const initialState: PoolState = {
    byId: Object.fromEntries(Object.keys(POOL_LIST).map(item => [item, {
        id: item,
        name: POOL_LIST[item].name,
        isCoal: POOL_LIST[item].isCoal,
        rewardsOre: 0,
        rewardsCoal: 0,
        avgOre: 0,
        avgCoal: 0,
        totalRunning: 0,
        show: true,
        minerPoolIds: [],
    }])),
    order: Object.keys(POOL_LIST),
}

const poolSlice = createSlice({
    name: 'pools',
    initialState: initialState,
    reducers: {
        joinMinerToPool(state, action: PayloadAction<{ poolId: string, minerPoolId: string }>) {
            const { poolId, minerPoolId } = action.payload
            let minerPoolIds = state.byId[poolId].minerPoolIds
            minerPoolIds.push(minerPoolId)
            state.byId[poolId] = {
                ...state.byId[poolId],
                minerPoolIds: minerPoolIds
            }
        },
        updateBalance(state, action: PayloadAction<{
            poolId: string, totalRunning: number, avgOre: number, avgCoal: number, rewardsOre: number, rewardsCoal: number
        }>) {
            const { poolId, totalRunning, avgOre, avgCoal, rewardsOre, rewardsCoal } = action.payload
            state.byId[poolId] = {
                ...state.byId[poolId],
                totalRunning: totalRunning,
                avgOre: avgOre,
                avgCoal: avgCoal,
                rewardsOre: rewardsOre,
                rewardsCoal: rewardsCoal
            }
        },
        // updatePool(state, action: PayloadAction<{ id: string, pool: PoolType }>) {
        //     const { id, pool } = action.payload
        //     let startMiningAt = state.pools[id].startMiningAt
        //     let avgRewards = {
        //         ore: 0,
        //         coal: 0,
        //         startOre: pool.balanceOre ?? 0,
        //         startCoal: pool.balanceCoal ?? 0
        //     }

        //     if (!state.pools[id].running && pool.running) {
        //         startMiningAt = pool.startMiningAt
        //         avgRewards = {
        //             ore: 0,
        //             coal: 0,
        //             startOre: pool.balanceOre,
        //             startCoal: pool.balanceCoal,
        //         }
        //     } else if (state.pools[id].running && pool.running) {
        //         startMiningAt = startMiningAt ?? pool.startMiningAt
        //         avgRewards = calculateAvgRewards(state.pools[id], pool)
        //     } else {
        //         startMiningAt = startMiningAt ?? pool.startMiningAt
        //         avgRewards = {
        //             ore: 0,
        //             coal: 0,
        //             startOre: pool.balanceOre,
        //             startCoal: pool.balanceCoal,
        //         }
        //     }

        //     state.pools[id] = {
        //         ...state.pools[id],
        //         ...pool,
        //         show: state.pools[id].show,
        //         startMiningAt: startMiningAt,
        //         avgRewards: avgRewards
        //     }
        // },
        reorderPools: (state, action: PayloadAction<string[]>) => {
            state.order = action.payload;
        },
        visiblePools: (state, action: PayloadAction<{ id: string, show: boolean }>) => {
            const { id, show } = action.payload
            state.byId[id] = {
                ...state.byId[id],
                show: show
            }
        },
        resetPool(state) {
            Object.assign(state, initialState)
        }
    }
})

export const poolActions = poolSlice.actions
export const poolReducer = poolSlice.reducer
