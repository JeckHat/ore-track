import { createMigrate, PersistState } from 'redux-persist';
import { RootState } from './types';
import { BOOSTLIST, POOL_LIST } from '@constants';

type PersistedRootState = RootState & {
    _persist: PersistState;
};

const migrations : Record<number, (state: any) => any> = {
    0: (_state: PersistedRootState) : Promise<undefined> => {
        return Promise.resolve(undefined);
    },
    1: (_state: PersistedRootState) : Promise<undefined> => {
        return Promise.resolve(undefined)
    },
    2: (state: PersistedRootState) : Promise<PersistedRootState> => {
        return Promise.resolve({
            ...state,
            pools: {
                ...state.pools,
                byId: Object.fromEntries(Object.keys(POOL_LIST).map(item => {
                    if(state.pools.byId?.[item]) {
                        return [item, { ...state.pools.byId?.[item] }]
                    }
                    return [item, { 
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
                    }]
                })),
                order: [
                    ...state.pools.order,
                    ...Object.keys(POOL_LIST).filter(item => !state.pools.order.includes(item))
                ]
            },
        })
    },
    3: (state: PersistedRootState) : Promise<PersistedRootState> => {
        return Promise.resolve({
            ...state,
            boost: {
                ...state.boost,
                boosts: Object.fromEntries(Object.keys(BOOSTLIST).map(item => {
                    return [item, {
                        ...state.boost.boosts[item],
                        liquidityPair: {
                            depositsOre: 0,
                            depositsPair: 0,
                            totalValueUsd: 0,
                            shares: 0,
                        }
                    }]
                })),
                netDeposits: 0
            },
            miners: {
                ...state.miners,
                byId: Object.fromEntries(Object.keys(state.miners.byId).map(minerId => {
                    return [minerId, {
                        ...state.miners.byId[minerId],
                        useKeypair: false,
                        useMnemonic: false
                    }]
                }))
            }
        })
    },
};

export default createMigrate(migrations, { debug: true });
