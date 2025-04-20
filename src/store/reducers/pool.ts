import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'
import * as Keychain from 'react-native-keychain'
import { Keypair } from '@solana/web3.js'

import { POOL_LIST } from '@constants'
import { PoolState } from '@store/types'
import { CustomError } from '@models'

const WALLET_STORAGE_KEY = "solana_private_key"
const WALLET_STORAGE_MNENOMIC = "solana_mnenomic"

const initialState: { pools: Record<string, PoolState> } = {
    pools: Object.fromEntries(Object.keys(POOL_LIST).map(item => [item, {
        balanceOre: 0,
        balanceCoal: 0,
        runningOre: false,
        runningCoal: false,
        avgRewards: {
            ore: 0,
            coal: 0,
            startOre: 0,
            startCoal: 0
        },
        startMiningAt: null,
        lastUpdateAt: dayjs().toISOString(),
        lastClaimAt: dayjs().toISOString(),
    }]))
}

function calculateAvgRewards(pool: PoolState, updatePool: PoolState) {
    if (!pool.startMiningAt) {
        return {
            ore: 0,
            coal: 0,
            startOre: updatePool.balanceOre,
            startCoal: updatePool.balanceCoal
        }
    }
    let miningAt = pool.startMiningAt
    let divided = dayjs(new Date()).diff(dayjs(miningAt), 'minute')
    divided = divided === 0 ? 1 : divided
    let rewardsOre = updatePool.balanceOre - pool.avgRewards.startOre
    let rewardsCoal = updatePool.balanceCoal - pool.avgRewards.startCoal
    rewardsOre = (rewardsOre / divided) * 60 * 24
    rewardsCoal = (rewardsCoal / divided) * 60 * 24
    return {
        ...pool.avgRewards,
        ore: rewardsOre,
        coal: rewardsCoal,
        startOre: pool.avgRewards.startOre,
        startCoal: pool.avgRewards.startCoal
    }
}

const poolSlice = createSlice({
    name: 'pool',
    initialState: initialState,
    reducers: {
        updatePool(state, action: PayloadAction<{ id: string, pool: PoolState }>) {
            const { id, pool } = action.payload
            let startMiningAt = state.pools[id].startMiningAt
            let avgRewards = {
                ore: 0,
                coal: 0,
                startOre: pool.balanceOre ?? 0,
                startCoal: pool.balanceCoal ?? 0
            }

            if (!state.pools[id].runningOre && pool.runningOre) {
                startMiningAt = pool.startMiningAt
                avgRewards = {
                    ore: 0,
                    coal: 0,
                    startOre: pool.balanceOre,
                    startCoal: pool.balanceCoal,
                }
            } else if (state.pools[id].runningOre && pool.runningOre) {
                startMiningAt = startMiningAt ?? pool.startMiningAt
                avgRewards = calculateAvgRewards(state.pools[id], pool)
            } else {
                startMiningAt = startMiningAt ?? pool.startMiningAt
                avgRewards = {
                    ore: 0,
                    coal: 0,
                    startOre: pool.balanceOre,
                    startCoal: pool.balanceCoal,
                }
            }

            state.pools[id] = {
                ...state.pools[id],
                ...pool,
                startMiningAt: startMiningAt,
                avgRewards: avgRewards
            }
        },
        resetPool(state) {
            Object.assign(state, initialState)
        }
    }
})

export const poolActions = poolSlice.actions
export const poolReducer = poolSlice.reducer

export async function setPoolCredentials(service: keyof typeof POOL_LIST, keypair: Keypair, mnemonic?: string) {
    if (mnemonic) {
        await Keychain.setGenericPassword(WALLET_STORAGE_MNENOMIC, mnemonic, {
            service: `${service}-mnemonic`,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
    }

    const secretKeyArray = Array.from(keypair.secretKey)
    await Keychain.setGenericPassword(WALLET_STORAGE_KEY, JSON.stringify(secretKeyArray), {
        service: `${service}-keypair`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
}

export async function getPoolMnemonic(service: keyof typeof POOL_LIST) {
    try {
        const credentials = await Keychain.getGenericPassword({
            authenticationPrompt: { title: 'Authenticate to access your Recovery Phrase' },
            service:  `${service}-mnemonic`,
        });
        if (credentials) {
            return credentials.password
        }
        throw new CustomError("Not Credetials", 401)
    } catch (error) {
        throw error
    }
}

export async function getPoolKeypair(service: keyof typeof POOL_LIST) {
    try {
        const credentials = await Keychain.getGenericPassword({
            authenticationPrompt: { title: 'Authenticate to access your Secret Key' },
            service: `${service}-keypair`,
        });
        if (credentials) {
            const secretKey = JSON.parse(credentials.password)
            return Keypair.fromSecretKey(new Uint8Array(secretKey))
        }
        throw new CustomError("Not Credetials", 401)
    } catch (error) {
        throw error
    }
}

export async function deletePoolCredentials(service: keyof typeof POOL_LIST) {
    await Keychain.resetGenericPassword({ service: `${service}-keypair` })
    await Keychain.resetGenericPassword({ service: `${service}-mnemonic` })
}
