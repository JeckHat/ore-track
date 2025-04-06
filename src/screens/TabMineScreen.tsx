import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import dayjs from 'dayjs'

import { Button, CustomText } from "@components"
import CpuUsage from "@modules/CpuUsage"
import { TabMineScreenProps } from "@navigations/types"

export default function TabMineScreen({ navigation }: TabMineScreenProps) {
    const [coreUsage, setCoreUsage] = useState<number[]>([])

    useEffect(() => {
        const interval = setInterval(() => {
            CpuUsage.getCpuUsagePerCoreViaTop()
                .then((result: number[]) => setCoreUsage(result))
                .catch(() => setCoreUsage([]));
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-baseBg px-2">
            <View className="mb-2 bg-baseBg z-10">
                {coreUsage.reduce<{core: number, percent: number}[][]>((result, item, index) => {
                    let newItem = {
                        core: index + 1,
                        percent: item
                    }
                    if (index % 2 === 0) {
                        result.push([newItem])
                    } else {
                        result[result.length - 1].push(newItem)
                    }
                    return result;
                }, []).map((row, rowIndex) => (
                    <View key={`cores-row-${rowIndex}`} className="flex-row items-center gap-x-2">
                        {row.map((item, idx) => (
                            <View key={idx} className="flex-1">
                                <CustomText className="text-primary font-PlusJakartaSansSemiBold mb-1">Core {item.core}</CustomText>
                                <View className="flex-row items-center">
                                    <View className="flex-1 h-3 bg-gray-300 rounded-lg">
                                        <View
                                            className="h-3 rounded-lg"
                                            style={[
                                                {
                                                    width: `${item.percent}%`,
                                                    backgroundColor:
                                                        item.percent > 80 ? 'red' : item.percent > 50 ? 'orange' : 'green',
                                                },
                                            ]}
                                        />
                                    </View>
                                    <View className="w-8 items-end ml-1 mr-2">
                                        <CustomText className="text-primary font-PlusJakartaSans text-sm">
                                            {item.percent}%
                                        </CustomText>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
                <Button
                    containerClassName="my-6 w-1/2 self-center"
                    className="py-1"
                    title="Start"
                />
            </View>
            <CustomText className="text-primary font-PlusJakartaSansBold text-lg mb-1">Activities</CustomText>
            <View className="flex-row justify-between">
                <View className="flex-1">
                    <CustomText className="text-primary flex-1">Timestamp</CustomText>
                </View>
                <View className="mx-1">
                    <CustomText className="text-primary text-center">Score</CustomText>
                </View>
                <View className="flex-1 items-end">
                    <CustomText className="text-primary flex-1">Rewards</CustomText>
                </View>
            </View>
            <FlatList
                contentContainerClassName="pb-[52px]"
                data={new Array(1).fill("testing")}
                keyExtractor={(_, idx) => `activity-mine-${idx}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View className="flex-row justify-between mb-1">
                        <View className="flex-1">
                            <CustomText className="text-primary flex-1 font-PlusJakartaSansSemiBold">{dayjs().format("DD/MM/YY HH:mm")}</CustomText>
                        </View>
                        <View className="mx-1">
                            <CustomText className="text-primary text-center font-PlusJakartaSans">19</CustomText>
                        </View>
                        <View className="flex-1 items-end">
                            <CustomText className="text-primary flex-1 font-LatoBold">0.00000001451 ORE    </CustomText>
                            <CustomText className="text-primary flex-1 font-LatoBold">0.00000001451 COAL</CustomText>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    coreContainer: {  },
    label: { marginBottom: 4 },
    barBackground: {
        height: 12,
        backgroundColor: '#ddd',
        borderRadius: 6,
        overflow: 'hidden',
    },
    barForeground: {
        height: 12,
        borderRadius: 6,
    },
    percent: {
        // marginTop: 4,
        fontSize: 12,
        color: '#444',
    },
});
