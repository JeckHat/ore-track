import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import * as Keychain from 'react-native-keychain'

import { MinerState } from '@store/types'
import { CustomError } from '@models'
import { Keypair } from '@solana/web3.js'

const initialState: MinerState = {
    miners: {}
}

const MinerSlice = createSlice({
    name: 'miner',
    initialState: initialState,
    reducers: {
        addMiner(state, action: PayloadAction<{ name: string, address: string }>) {
            const { name, address } = action.payload
            state.miners = {
                ...state.miners,
                [address]: {
                    ...state.miners[address],
                    name: name,
                    address: address,
                    pools: []
                }
            }
        },
        editMiner(state, action: PayloadAction<{ name: string, address: string }>) {
            const { name, address } = action.payload
            state.miners = {
                ...state.miners,
                [address]: {
                    ...state.miners[address],
                    name: name,
                    address: address,
                }
            }
        },
        resetMiner(state) {
            Object.assign(state, initialState);
        },
    }
})

export const minerActions = MinerSlice.actions;

export const minerReducer = MinerSlice.reducer;

export async function saveCredentialsMiner(address: string, keypair: Keypair, mnemonic?: string) {
    const secretKeyArray = Array.from(keypair.secretKey)
    await Keychain.setGenericPassword(address, JSON.stringify(secretKeyArray), {
        service: `wallet-keypair-${address}`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })

    if (mnemonic) {
        await Keychain.setGenericPassword(address, mnemonic, {
            service: `wallet-mnemonic-${address}`,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        })
    }
}

export async function getKeypairMiner(address: string) {
    const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: { title: `Authenticate to access key for ${address}` },
        service: `wallet-keypair-${address}`,
    });
    if (credentials) {
        const secretKey = JSON.parse(credentials.password)
        return Keypair.fromSecretKey(new Uint8Array(secretKey))
    }
    throw new CustomError("No Credentials", 401)
}

export async function getMnemonicMiner(address: string) {
    const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: { title: `Authenticate to access mnemonic for ${address}` },
        service: `wallet-mnemonic-${address}`
    });
    if (credentials) return credentials.password
    throw new CustomError("No Credentials", 401)
}

export async function deleteCredentialsMiner(address: string) {
    await Keychain.resetGenericPassword({ service: `wallet-mnemonic-${address}` })
    await Keychain.resetGenericPassword({ service: `wallet-keypair-${address}` })
}
