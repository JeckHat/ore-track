import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Dimensions, PanResponder, findNodeHandle, UIManager, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

import { CustomText } from './Texts';
import { twMerge } from 'tailwind-merge';

const { width: screenWidth } = Dimensions.get('window');

export const LineChart = (props: { data: number[] }) => {
    const { data } = props
    const [cursorPoint, setCursorPoint] = useState<{
        x: number,
        y: number,
        value: string,
    } | null>(null);
    const chartRef = useRef(null);
    const [chartOffsetX, setChartOffsetX] = useState(0);

    const chartHeight = 180;
    const chartWidth = screenWidth - 40;

    const points = useMemo(() => {
        const curData = data.map(item => item)
        const max = Math.max(...curData);
        const min = Math.min(...curData);
        const stepX = chartWidth / (data.length - 1);

        return data.map((val, idx) => {
            const x = idx * stepX;
            const y = chartHeight - ((val - min) / (max - min)) * chartHeight;
            return { x, y, value: val.toFixed(3) };
        });
    }, [data]);

    const path = useMemo(() => {
        if (points.length < 2) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const controlX = (p0.x + p2.x) / 2;
            d += ` Q ${p1.x} ${p1.y} ${controlX} ${p2.y}`;
        }
        return d;
    }, [points]);

    const isChartDown = data[data.length - 1] < data[0];
    const pathColor = isChartDown ? '#ff4d4d' : '#00ff99';

    useEffect(() => {
        if (chartRef.current) {
            const handle = findNodeHandle(chartRef.current);
            if (handle) {
                UIManager.measure(handle, (x, y, width, height, pageX) => {
                    setChartOffsetX(pageX);
                });
            }
        }
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const localX = gestureState.moveX - chartOffsetX;
                if (localX < 0 || localX > chartWidth) return;

                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    if (localX >= p1.x && localX <= p2.x) {
                        const ratio = (localX - p1.x) / (p2.x - p1.x);
                        const interpolatedY = p1.y + (p2.y - p1.y) * ratio;
                        const interpolatedValue = parseFloat(p1.value) + (parseFloat(p2.value) - parseFloat(p1.value)) * ratio;
                        setCursorPoint({
                            x: localX,
                            y: interpolatedY,
                            value: interpolatedValue.toFixed(3)
                        });
                        break;
                    }
                }
            },
            onPanResponderRelease: () => setCursorPoint(null),
        })
    ).current;

    const firstValue = parseFloat(points[0]?.value);
    const isDown = cursorPoint && parseFloat(cursorPoint.value) < firstValue;
    const pointColor = isDown ? '#ff4d4d' : '#00ff99';

    return (
        <View
            ref={chartRef}
            {...panResponder.panHandlers}
            className="items-center justify-center"
            style={{ width: chartWidth, height: chartHeight }}
        >
            <Svg width={chartWidth} height={chartHeight + 20} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                <Path d={path} stroke={pathColor} strokeWidth="3" fill="none" />
                <Path d={path} stroke={pathColor} strokeOpacity="0.1" strokeWidth="3" fill="none" />
                {cursorPoint && (
                    <>
                        <Line
                            x1={cursorPoint.x}
                            y1={0}
                            x2={cursorPoint.x}
                            y2={chartHeight}
                            stroke={isDown ? '#ff4d4d' : '#00ff99'}
                            strokeDasharray="4"
                        />
                        <Circle
                            cx={cursorPoint.x}
                            cy={cursorPoint.y}
                            r="4"
                            fill={pointColor}
                            stroke="white"
                            strokeWidth="1"
                        />
                    </>
                )}
            </Svg>

            {cursorPoint && (
                <View
                    className="absolute"
                    style={{
                        left: cursorPoint.x + 100 > chartWidth ? cursorPoint.x - 60 : cursorPoint.x + 10,
                        top: cursorPoint.y - 30,
                    }}
                >
                    <View
                        className={twMerge('p-2 rounded-md items-center', isDown? 'bg-[#600]' : 'bg-[#033]')}
                    >
                        <CustomText
                            className='text-primary font-PlusJakartaSansSemiBold'
                        >
                            ${cursorPoint.value}
                        </CustomText>
                    </View>
                </View>
            )}
        </View>
    );
};

