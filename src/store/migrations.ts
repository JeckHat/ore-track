import { createMigrate, PersistState } from 'redux-persist';
import { RootState } from './types';
import { POOL_LIST } from '@constants';

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
};

export default createMigrate(migrations, { debug: true });
