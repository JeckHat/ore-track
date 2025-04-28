import React, { memo, useEffect } from 'react';
import { Pressable, SafeAreaView, Switch, View } from 'react-native'
import ReorderableList, {
    ReorderableListReorderEvent,
    reorderItems,
    useReorderableDrag,
} from 'react-native-reorderable-list'
import { useDispatch, useSelector } from 'react-redux'

import { CustomText, HeaderButton } from '@components'
import { POOL_LIST } from '@constants'
import { PoolType, RootState } from '@store/types'
import { Colors, Fonts } from '@styles'
import { poolActions } from '@store/actions';
import { createStackOptions } from '@navigations/types';
import { ChevronLeftIcon } from '@assets/icons';

interface CardProps {
    id: string,
    pool: PoolType
}

const Card: React.FC<CardProps & { onActive: (show: boolean) => void }> = memo(({ id, pool, onActive }) => {
    const drag = useReorderableDrag()

    const [enabled, setEnabled] = React.useState(pool.show ?? true);

    const handleToggle = (value: boolean) => {
        setEnabled(value)
        onActive(value)
    };

    useEffect(() => {
        setEnabled(pool.show ?? true);
    }, [pool.show]);

    return (
        <Pressable className='p-2 py-4 flex-row justify-between bg-gray-800 m-2 rounded-lg' onLongPress={drag}>
            <View>
                <CustomText className='text-primary text-lg font-PlusJakartaSansSemiBold'>
                    {POOL_LIST[id].name}
                </CustomText>
            </View>
            <Switch
                trackColor={{ false: '#767577', true: Colors.gold }}

                thumbColor={enabled ? '#A67C00' : '#f4f3f4'}
                ios_backgroundColor="#D3D3D3"
                onValueChange={handleToggle}
                value={enabled}
            />
        </Pressable>
    );
});

export default function ManagePoolScreen() {
    const { byId, order } = useSelector((state: RootState) => state.pools)
    const dispatch = useDispatch()

    const [data, setData] = React.useState(
        order.map((id: string) => ({ id: id, pool: byId[id] }))
    )

    const handleReorder = ({from, to}: ReorderableListReorderEvent) => {
        setData((value: any) => reorderItems(value, from, to));
        dispatch(poolActions.reorderPools(reorderItems(order, from, to)))
    }

    return (
        <SafeAreaView className='flex-1 bg-baseBg'>
            <ReorderableList
                data={data}
                onReorder={handleReorder}
                renderItem={({ item }) => (
                    <Card
                        {...item}
                        onActive={(show: boolean) => {
                            dispatch(poolActions.visiblePools({
                                id: item.id, show: show
                            }))
                        }}
                    />
                )}
                keyExtractor={item => item.id}
            />
        </SafeAreaView>
    )
}

export const screenOptions = createStackOptions<'ManagePool'>(({ navigation }) => {
    return {
        headerTitle: 'Manage Pool',
        headerTintColor: Colors.primary,
        headerTitleStyle: {
            fontFamily: Fonts.PlusJakartaSansSemiBold,
            fontSize: 18,
        },
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: Colors.baseBg },
        headerLeft: () => (
            <HeaderButton
                className='mr-6 mb-1'
                icon={<ChevronLeftIcon width={24} height={24} color={Colors.primary}/>}
                onPress={() => navigation.goBack() }
            />
        )
    }
})
