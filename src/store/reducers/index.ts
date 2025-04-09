import { combineReducers } from '@reduxjs/toolkit';

import { uiReducer } from './ui';
import { walletReducer } from './wallet';
import { configReducer } from './config';
import { poolReducer } from './pool';
import { stakeReducer } from './stake';
import { minerReducer } from './miner';

const rootReducer = combineReducers({
    ui: uiReducer,
    wallet: walletReducer,
    config: configReducer,
    stake: stakeReducer,
    miner: minerReducer,
    pool: poolReducer
})

export default rootReducer;
