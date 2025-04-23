import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { MinerPoolState, MinerPoolType } from '@store/types'

const initialState: MinerPoolState = {
    byId: {},
    order: [],
}

function calculateAvgRewards(miner: MinerPoolType, updateMiner: MinerPoolType) {
    if (!miner.startMiningAt) {
        return {
            ore: 0,
            coal: 0,
            initOre: updateMiner.rewardsOre,
            initCoal: updateMiner.rewardsCoal
        }
    }
    let miningAt = miner.startMiningAt
    let divided = dayjs(new Date()).diff(dayjs(miningAt), 'minute')
    divided = divided === 0 ? 1 : divided
    let rewardsOre = updateMiner.rewardsOre - miner.avgRewards.initOre
    let rewardsCoal = updateMiner.rewardsCoal - miner.avgRewards.initCoal
    rewardsOre = (rewardsOre / divided) * 60 * 24
    rewardsCoal = (rewardsCoal / divided) * 60 * 24
    return {
        ...miner.avgRewards,
        ore: rewardsOre,
        coal: rewardsCoal,
        initOre: miner.avgRewards.initOre,
        initCoal: miner.avgRewards.initCoal
    }
}

const minerPoolSlice = createSlice({
    name: 'minerPools',
    initialState: initialState,
    reducers: {
        joinMinerToPool(state, action: PayloadAction<{ minerPoolId: string, minerId: string, poolId: string }>) {
            const { minerPoolId, minerId, poolId } = action.payload
            let order = state.order
            order.push(minerPoolId)
            state.byId[minerPoolId] = {
                ...state.byId[minerPoolId],
                minerId: minerId,
                poolId: poolId,
                rewardsOre: 0,
                rewardsCoal: 0,
                running: false,
                avgRewards: { ore: 0, coal: 0, initOre: 0, initCoal: 0 },
                earnedOre: 0,
                startMiningAt: null,
                lastUpdateAt: dayjs().toISOString(),
                lastClaimAt: dayjs('1900-01-01').toISOString(),
            }
            state.order = order
        },
        removeMinerPool(state, action: PayloadAction<{ minerPoolId: string }>) {
            const { minerPoolId } = action.payload
            delete state.byId[minerPoolId]
            state.order = state.order.filter(id => id != minerPoolId)
        },
        updateBalanceMiner(state, action: PayloadAction<{ minerPoolId: string, minerPool: MinerPoolType }>) {
            const { minerPoolId, minerPool } = action.payload
            let startMiningAt = state.byId[minerPoolId].startMiningAt
            let avgRewards = {
                ore: 0,
                coal: 0,
                initOre: minerPool.rewardsOre ?? 0,
                initCoal: minerPool.rewardsCoal ?? 0
            }

            if (!state.byId[minerPoolId].running && minerPool.running) {
                startMiningAt = minerPool.startMiningAt
                avgRewards = {
                    ore: 0,
                    coal: 0,
                    initOre: minerPool.rewardsOre,
                    initCoal: minerPool.rewardsCoal,
                }
            } else if (state.byId[minerPoolId].running && minerPool.running) {
                startMiningAt = startMiningAt ?? minerPool.startMiningAt
                avgRewards = calculateAvgRewards(state.byId[minerPoolId], minerPool)
            } else {
                startMiningAt = startMiningAt ?? minerPool.startMiningAt
                avgRewards = {
                    ore: 0,
                    coal: 0,
                    initOre: minerPool.rewardsOre,
                    initCoal: minerPool.rewardsCoal,
                }
            }

            state.byId[minerPoolId] = {
                ...state.byId[minerPoolId],
                ...minerPool,
                startMiningAt: startMiningAt,
                avgRewards: avgRewards
            }
        },
        resetMinerPool(state) {
            Object.assign(state, initialState)
        }
    }
})

export const minerPoolActions = minerPoolSlice.actions
export const minerPoolReducer = minerPoolSlice.reducer
