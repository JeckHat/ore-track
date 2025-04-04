import './global.css'
import 'react-native-get-random-values'
import 'react-native-quick-crypto'
import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Buffer } from 'buffer'
import QuickCrypto from 'react-native-quick-crypto'

import { RootNavigation } from '@navigations/RootNavigation'
import { persistor, store } from '@store/index'

global.Buffer = Buffer

// @ts-expect-error subtle isn't fully implemented and Cryptokey is missing
global.crypto = QuickCrypto

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootNavigation />
      </PersistGate>
    </Provider>
  )
}
