import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore, Reducer } from "@reduxjs/toolkit";
import { createTransform, persistReducer, persistStore } from "redux-persist";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from "redux-persist/lib/constants";

import rootReducer from "./reducers";
import { Boost, BoostConfig, Numeric, Stake } from "@models";
import { RootState } from "./types";

const classRegistry: Record<string, any> = {
    Numeric,
    Boost,
    BoostConfig,
    Stake,
};

function serialize(obj: any): any {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) return obj.map(serialize);
    if (obj && typeof obj === 'object') {
        const ctorName = obj.constructor?.name;
        if (classRegistry[ctorName] && typeof obj.toJSON === 'function') {
            return obj.toJSON();
        }
        const result: any = {};
        for (const key in obj) {
            result[key] = serialize(obj[key]);
        }
        return result;
    }
    return obj;
}
  
function deserialize(obj: any): any {
    if (Array.isArray(obj)) return obj.map(deserialize);
    if (obj && typeof obj === 'object') {
        if (obj.__type && classRegistry[obj.__type]) {
            const { __type, ...rest } = obj;
            return classRegistry[__type].fromJSON(rest);
        }
        const result: any = {};
        for (const key in obj) {
            result[key] = deserialize(obj[key]);
        }
        return result;
    }
    return obj;
}

const ClassTransform = createTransform(
    (inboundState) => serialize(inboundState),
    (outboundState) => deserialize(outboundState),
    { whitelist: ['boost'] }
);

const persistConfig = {
    key: "PoWMiningSolana_app_v1",
    storage: AsyncStorage,
    whitelist: [
        "config",
        "wallet",
        "pool",
        "boost"
    ],
    transforms: [ClassTransform],
};

const persistedReducer = persistReducer<Partial<RootState>>(
    persistConfig,
    rootReducer as Reducer<Partial<RootState>>
);

const store = configureStore({
    reducer: persistedReducer,
    // devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            ignoredPaths: ['boost.boosts', 'boost.boostConfig', 'boost.boostProof'],
            ignoredActionPaths: ['payload.boost', 'payload.stake', 'payload.boostConfig', 'payload.boostProof'],
        },
        
    }),
});

let persistor = persistStore(store);

export { store, persistor };
