import { NavigationContainer } from '@react-navigation/native'
import { StatusBar, View } from 'react-native'
import { useSelector } from 'react-redux'
import { twMerge } from 'tailwind-merge'

import { RootState } from '@store/types'
import { LoadingModal } from '@components/index'
import { BottomModalProvider } from '@providers'
import MainNavigation from './MainNavigation'

export function RootNavigation() {
  const ui = useSelector((state: RootState) => state.ui)
  
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
