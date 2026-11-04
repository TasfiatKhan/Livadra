import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

type Props = {
  size?: number;
};

export default function LivadraLogo({ size = 64 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4338CA" />
          <Stop offset="52%" stopColor="#6D28D9" />
          <Stop offset="100%" stopColor="#A855F7" />
        </LinearGradient>
      </Defs>
      <Rect width={512} height={512} rx={114.176} ry={114.176} fill="url(#lg)" />
      <Path
        d="M 174 148 V 308 C 174 344 196 364 232 364 L 294 364"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={60}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M 294 364 C 318 364 334 352 336 332 C 338 314 326 300 308 300"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={60}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
