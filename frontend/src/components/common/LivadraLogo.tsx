import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  size?: number;
};

export default function LivadraLogo({ size = 64 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#F5C842',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.52,
          fontWeight: '800',
          color: '#1A1A1A',
          lineHeight: size * 0.62,
          letterSpacing: -1,
          includeFontPadding: false,
        }}
      >
        L
      </Text>
    </View>
  );
}
