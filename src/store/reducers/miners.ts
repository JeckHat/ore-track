import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import * as Keychain from 'react-native-keychain'
import { Keypair } from '@solana/web3.js'

import { MinerState } from '@store/types'
import { CustomError } from '@models'

const initialState: MinerState = {
    byId: {},
    order: []
}

const MinerSlice = createSlice({
    name: 'miners',
    initialState: initialState,
    reducers: {
        addMiner(state, action: PayloadAction<{ minerId: string, name: string, address: string, isMain: boolean }>) {
            const { minerId, name, address, isMain } = action.payload
            let order = state.order
            order.push(minerId)
            state.byId = {
                ...state.byId,
                [minerId]: {
                    ...state.byId[minerId],
                    id: minerId,
                    name: name,
                    address: address,
                    isMain: isMain,
                    minerPoolIds: []
                }
            }
            state.order = order
        },
        editMiner(state, action: PayloadAction<{ minerId: string, name: string, address: string }>) {
            const { minerId, name, address } = action.payload
            state.byId = {
                ...state.byId,
                [minerId]: {
                    ...state.byId[minerId],
                    name: name,
                    address: address,
                }
            }
        },
        joinMinerToPool(state, action: PayloadAction<{ minerId: string, minerPoolId: string}>) {
            const { minerId, minerPoolId } = action.payload
            let minerPoolIds = state.byId[minerId].minerPoolIds
            minerPoolIds.push(minerPoolId)
            state.byId[minerId] = {
                ...state.byId[minerId],
                minerPoolIds: minerPoolIds
            }
        },
        removeMinerPool(state, action: PayloadAction<{ minerPoolId: string, minerId: string }>) {
            const { minerPoolId, minerId } = action.payload
            state.byId[minerId].minerPoolIds = state.byId[minerId].minerPoolIds.filter(id => id != minerPoolId)
        },
        resetMiner(state) {
            Object.assign(state, initialState);
        },
    }
})

export const minerActions = MinerSlice.actions;

export const minerReducer = MinerSlice.reducer;

export async function saveCredentialsMiner(minerId: string, keypair: Keypair, mnemonic?: string) {
    const secretKeyArray = Array.from(keypair.secretKey)
    await Keychain.setGenericPassword(minerId, JSON.stringify(secretKeyArray), {
        service: `wallet-keypair-${minerId}`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })

    if (mnemonic) {
        await Keychain.setGenericPassword(minerId, mnemonic, {
            service: `wallet-mnemonic-${minerId}`,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
    }
}

export async function getKeypairMiner(minerId: string) {
    const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: { title: `Authenticate to access key for ${minerId}` },
        service: `wallet-keypair-${minerId}`,
    });
    if (credentials) {
        const secretKey = JSON.parse(credentials.password)
        return Keypair.fromSecretKey(new Uint8Array(secretKey))
    }
    throw new CustomError("No Credentials", 401)
}

export async function getMnemonicMiner(minerId: string) {
    const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: { title: `Authenticate to access mnemonic for ${minerId}` },
        service: `wallet-mnemonic-${minerId}`
    });
    if (credentials) return credentials.password
    throw new CustomError("No Credentials", 401)
}

export async function deleteCredentialsMiner(minerId: string) {
    await Keychain.resetGenericPassword({ service: `wallet-mnemonic-${minerId}` })
    await Keychain.resetGenericPassword({ service: `wallet-keypair-${minerId}` })
}
