import { Text, TextProps } from 'react-native';

export function CustomText(props: TextProps){
  return (
    <Text allowFontScaling={false} {...props}>
      {props.children}
    </Text>
  )
}
