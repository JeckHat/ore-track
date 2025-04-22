import { combineReducers } from '@reduxjs/toolkit';

import { uiReducer } from './ui';
import { walletReducer } from './wallet';
import { configReducer } from './config';
import { poolReducer } from './pool';
import { boostReducer } from './boost';
import { minerReducer } from './miner';

const rootReducer = combineReducers({
    ui: uiReducer,
    wallet: walletReducer,
    config: configReducer,
    pool: poolReducer,
    boost: boostReducer,
    miner: minerReducer
})

export default rootReducer;
