import { combineReducers } from '@reduxjs/toolkit';

import { uiReducer } from './ui';
import { walletReducer } from './wallet';
import { configReducer } from './config';
import { poolReducer } from './pools';
import { boostReducer } from './boost';
import { minerReducer } from './miners';
import { minerPoolReducer } from './minerPools';

const rootReducer = combineReducers({
    ui: uiReducer,
    wallet: walletReducer,
    config: configReducer,
    boost: boostReducer,
    pools: poolReducer,
    miners: minerReducer,
    minerPools: minerPoolReducer
})

export default rootReducer;
