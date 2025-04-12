import { NavigationContainer } from '@react-navigation/native'
import { StatusBar, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { twMerge } from 'tailwind-merge'

import { RootState } from '@store/types'
import { LoadingModal } from '@components'
import { BottomModalProvider } from '@providers'
import MainNavigation from './MainNavigation'
import { useSolanaSocket } from '@hooks'
import { useMemo } from 'react'
import { Boost, BoostConfig, getBoostConfigResult, getBoostResult, getProofResult, getStakeResult, Proof, Stake } from '@models'
import { boostActions } from '@store/actions'
import { calculateClaimableYield } from '@services/ore'

type paramsCalculate = {
  boost?: Boost,
  stake?: Stake,
  boostProof?: Proof,
  boostConfig?: BoostConfig
}

export function RootNavigation() {
  const ui = useSelector((state: RootState) => state.ui)
  const url = useSelector((state: RootState) => state.config.rpcUrl)
  const socketAccounts = useSelector((state: RootState) => state.boost.socketAccounts) ?? {}
  const boostRedux = useSelector((state: RootState) => state.boost) ?? {}

  console.log(boostRedux)

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
          calculateRewards({ boost })
          dispatch(boostActions.updateBoostRedux({
            boost: boost,
            boostAddress: sockets[1]
          }))
          break;
        }
        case "stake": {
          const stake = await getStakeResult(buffer)
          calculateRewards({ stake })
          dispatch(boostActions.updateStakeRedux({
            stake: stake,
            stakeAddress: sockets[1],
            boostAddress: stake.boost!
          }))
          break;
        }
        case "boostProof": {
          const boostProof = await getProofResult(buffer)
          calculateRewards({ boostProof })
          dispatch(boostActions.updateProofRedux({
            boostProof: boostProof,
            boostProofAddress: sockets[1]
          }))
          break;
        }
        case "boostConfig": {
          const boostConfig = await getBoostConfigResult(buffer)
          calculateRewards({ boostConfig })
          dispatch(boostActions.updateConfigRedux({
            boostConfig: boostConfig,
            boostConfigAddress: sockets[1]
          }))
          break;
        }
      }
      if (sockets[0] === "boostProof") {
        const boostProof = await getProofResult(buffer)
        calculateRewards({ boostProof })
        dispatch(boostActions.updateProofRedux({
          boostProof: boostProof,
          boostProofAddress: sockets[1]
        }))
      }
    } catch(error) {
      console.log("error", error)
    }
  }

  function calculateRewards(params: paramsCalculate) {
    Object.keys(boostRedux.boosts).map((bst) => {
      const boost = params.boost ?? Boost.fromJSON(boostRedux.boosts[bst].boost)
      const stake = params.stake ?? Stake.fromJSON(boostRedux.boosts[bst].stake)
      const boostConfig = params.boostConfig ?? BoostConfig.fromJSON(boostRedux.boostConfig)
      const boostProof = params.boostProof ?? Proof.fromJSON(boostRedux.boostProof)
      const rewards = calculateClaimableYield(boost, boostProof, stake, boostConfig)
      dispatch(boostActions.updateRewards({
        rewards: Number(rewards),
        boostAddress: bst
      }))
    })
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
