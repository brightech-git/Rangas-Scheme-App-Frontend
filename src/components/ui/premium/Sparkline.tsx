// src/components/ui/premium/Sparkline.tsx
//
// Minimal trend line with an optional gradient fill beneath it.
// Pure presentation — hand it an array of numbers.

import React, { memo, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import { useTheme } from '../../../theme';

type Props = {
  data: number[];
  width: number;
  height: number;
  color?: string;
  /** Draw a soft area fill under the line */
  fill?: boolean;
  /** Mark the last point with a dot */
  showEndDot?: boolean;
  strokeWidth?: number;
  style?: ViewStyle;
};

function Sparkline({
  data,
  width,
  height,
  color,
  fill = true,
  showEndDot = true,
  strokeWidth = 2,
  style,
}: Props) {
  const { COLORS } = useTheme();
  const stroke = color ?? COLORS.metalGold;
  const gradId = useMemo(
    () => `spark-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const { linePath, areaPath, endPoint } = useMemo(() => {
    const pts = (data ?? []).filter((n) => Number.isFinite(n));
    if (pts.length < 2 || width <= 0 || height <= 0) {
      return { linePath: '', areaPath: '', endPoint: null as null | [number, number] };
    }

    const pad = strokeWidth + 1;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const stepX = width / (pts.length - 1);
    const usableH = height - pad * 2;

    const coords: [number, number][] = pts.map((v, i) => [
      i * stepX,
      pad + usableH - ((v - min) / span) * usableH,
    ]);

    // Catmull-Rom-ish smoothing via quadratic midpoints
    let d = `M ${coords[0][0]} ${coords[0][1]}`;
    for (let i = 1; i < coords.length; i++) {
      const [px, py] = coords[i - 1];
      const [cx, cy] = coords[i];
      const mx = (px + cx) / 2;
      d += ` Q ${px} ${py} ${mx} ${(py + cy) / 2}`;
      d += ` Q ${cx} ${cy} ${cx} ${cy}`;
    }

    const area = `${d} L ${width} ${height} L 0 ${height} Z`;

    return {
      linePath: d,
      areaPath: area,
      endPoint: coords[coords.length - 1],
    };
  }, [data, width, height, strokeWidth]);

  if (!linePath) return <View style={[{ width, height }, style]} />;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        {fill && (
          <Defs>
            <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity="0.26" />
              <Stop offset="1" stopColor={stroke} stopOpacity="0" />
            </SvgLinearGradient>
          </Defs>
        )}

        {fill && <Path d={areaPath} fill={`url(#${gradId})`} />}

        <Path
          d={linePath}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {showEndDot && endPoint && (
          <Circle
            cx={endPoint[0]}
            cy={endPoint[1]}
            r={strokeWidth + 1.5}
            fill={stroke}
          />
        )}
      </Svg>
    </View>
  );
}

export default memo(Sparkline);
