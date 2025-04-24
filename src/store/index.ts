import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore, Reducer } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from "redux-persist/lib/constants";

import rootReducer from "./reducers";
import { RootState } from "./types";

const STATE_VERSION = 1

const persistedReducer = persistReducer<Partial<RootState>>(
    {
        key: "PoWMiningSolana_app_v1",
        storage: AsyncStorage,
        version: 1,
        whitelist: [
            "config",
            "wallet",
            "boost",
            "pools",
            "miners",
            "minerPools"
        ],
        migrate: (prevState) => {
            const prevVersion = prevState?._persist?.version ?? 0;
            if (prevVersion < STATE_VERSION) {
                return Promise.resolve(undefined)
            }
            return Promise.resolve(prevState);
        }
    },
    rootReducer as Reducer<Partial<RootState>>,
);

const store = configureStore({
    reducer: persistedReducer,
    // devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
        
    }),
});

let persistor = persistStore(store);

export { store, persistor };
