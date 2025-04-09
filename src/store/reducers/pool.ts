import { createSlice } from '@reduxjs/toolkit'
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
        lastUpdateAt: dayjs().toISOString(),
        lastClaimAt: dayjs().toISOString(),
    }]))
}

const poolSlice = createSlice({
    name: 'pool',
    initialState: initialState,
    reducers: {
        updatePool(state, action) {
            state.pools = {
                ...state.pools,
                [action.payload.id]: {
                    ...state.pools[action.payload.id],
                    ...action.payload.pool
                }
            }
        },
        initialPool(state) {
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
