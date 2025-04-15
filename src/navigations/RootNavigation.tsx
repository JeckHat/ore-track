import { useMemo } from 'react'
import { StatusBar, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { twMerge } from 'tailwind-merge'

import { RootState } from '@store/types'
import { LoadingModal } from '@components'
import { BottomModalProvider } from '@providers'
import MainNavigation from './MainNavigation'
import { useSolanaSocket } from '@hooks'
import { getBoostConfigResult, getBoostResult, getProofResult, getStakeResult } from '@models'
import { boostActions } from '@store/actions'

export function RootNavigation() {
  const ui = useSelector((state: RootState) => state.ui)
  const url = useSelector((state: RootState) => state.config.rpcUrl)
  const socketAccounts = useSelector((state: RootState) => state.boost.socketAccounts) ?? {}

  const dispatch = useDispatch()

  const accounts = useMemo(() => {
    return Object.keys(socketAccounts).map((key) => ({
      ...socketAccounts[key],
    }));
  }, [socketAccounts])

  useSolanaSocket(`wss://${url}`, accounts, (event) => {
    updateData(event)
  })

  async function updateData(event: { id: string, data: any }) {
    try {
      const sockets = event.id.split("-")
      const json = await JSON.parse(event.data.value.data)
      const buffer = Buffer.from(json[0], 'base64')
      switch(sockets[0]) {
        case "boost": {
          const boost = await getBoostResult(buffer)
          dispatch(boostActions.updateBoostRedux({
            boost: boost.toJSON(),
            boostAddress: sockets[1]
          }))
          dispatch(boostActions.updateAllRewards())
          break;
        }
        case "stake": {
          const stake = await getStakeResult(buffer)
          dispatch(boostActions.updateStakeRedux({
            stake: stake.toJSON(),
            stakeAddress: sockets[1],
            boostAddress: stake.boost ?? ""
          }))
          dispatch(boostActions.updateAllRewards())
          break;
        }
        case "boostProof": {
          const boostProof = await getProofResult(buffer)
          dispatch(boostActions.updateProofRedux({
            boostProof: boostProof.toJSON(),
            boostProofAddress: sockets[1]
          }))
          dispatch(boostActions.updateAllRewards())
          break;
        }
        case "boostConfig": {
          const boostConfig = await getBoostConfigResult(buffer)
          dispatch(boostActions.updateConfigRedux({
            boostConfig: boostConfig.toJSON(),
            boostConfigAddress: sockets[1]
          }))
          dispatch(boostActions.updateAllRewards())
          break;
        }
      }
    } catch(error) {
      console.log("error", error)
    }
  }
  
  return (
    <BottomModalProvider>
      <NavigationContainer>
        <View className={twMerge(`flex-1 bg-baseBg`, ui.classNameGlobal)}>
          <StatusBar
            className={'bg-baseBg'}
            translucent={true}
            barStyle={'light-content'}
            animated={true}
          />
          <MainNavigation />
          <LoadingModal show={ui.loading} />
        </View>
      </NavigationContainer>
    </BottomModalProvider>
  )
}
