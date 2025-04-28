import { deleteCredentialsMiner, minerActions, minerPoolActions, poolActions } from "@store/actions"
import { store } from "../index"

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export function joinMinerToPool({ minerId, poolId }: { minerId: string, poolId: string }) {
    return async (dispatch: AppDispatch) => {
        let minerPoolId = `${poolId}-${minerId}`
        dispatch(minerPoolActions.joinMinerToPool({
            minerId: minerId, poolId: poolId,  minerPoolId: minerPoolId
        }))

        dispatch(minerActions.joinMinerToPool({
            minerId: minerId,
            minerPoolId: minerPoolId
        }))

        dispatch(poolActions.joinMinerToPool({
            poolId: poolId,
            minerPoolId: minerPoolId
        }))
    }
}

export function removeMinerFromPool({ minerId, poolId }: { minerId: string, poolId: string }) {
    return async (dispatch: AppDispatch) => {
        let minerPoolId = `${poolId}-${minerId}`
        dispatch(poolActions.removeMinerFromPool({
            poolId: poolId,
            minerPoolId: minerPoolId
        }))
        dispatch(minerPoolActions.removeMinerPool({
            minerPoolId: minerPoolId
        }))

        dispatch(minerActions.removeMinerPool({
            minerPoolId: minerPoolId,
            minerId: minerId
        }))
    }
}

export function removeMiner({ minerId }: { minerId: string }) {
    return async (dispatch: AppDispatch, getState: () => RootState) => {
        const miner = getState().miners?.byId[minerId]
        const minerPools = getState().minerPools?.byId
        await deleteCredentialsMiner(miner?.id ?? "")
        miner?.minerPoolIds.forEach(minerPoolId => {
            dispatch(removeMinerFromPool({
                minerId: minerPools?.[minerPoolId].minerId ?? "",
                poolId: minerPools?.[minerPoolId].poolId ?? "",
            }))
        })
        dispatch(minerActions.deleteMiner({ minerId: minerId }))
    }
}
