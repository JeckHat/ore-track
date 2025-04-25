import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureStore, Reducer } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from "redux-persist/lib/constants";

import rootReducer from "./reducers";
import { RootState } from "./types";
import migrations from "./migrations";

const STATE_VERSION = 2

const persistedReducer = persistReducer<Partial<RootState>>(
    {
        key: "PoWMiningSolana_app_v1",
        storage: AsyncStorage,
        version: STATE_VERSION,
        whitelist: [
            "config",
            "wallet",
            "boost",
            "pools",
            "miners",
            "minerPools"
        ],
        migrate: migrations
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
