// src/components/ui/premium/ScreenCanvas.tsx
//
// Scaffold for the V2 "warm hero / ivory body" pattern.
//
// Renders a fixed header slot (usually <PageHeader> or
// <DashboardHeader>), then a paper body that is pulled UP over the
// header by `overlap` px so the first card straddles the seam. The body
// gets rounded top corners to complete the effect.

import React, { memo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  StatusBar,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';

type Props = {
  children: React.ReactNode;
  /** Rendered above the body, typically a hero header */
  header?: React.ReactNode;
  /** Pinned below the body, typically a BottomActionBar */
  footer?: React.ReactNode;
  /** Pixels the body is pulled up over the header */
  overlap?: number;
  /** Round the top corners of the paper body */
  roundBody?: boolean;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Horizontal padding applied to the body content */
  gutter?: number;
  paddingBottom?: number;
  /** Override the body background */
  background?: string;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
  scrollProps?: Partial<ScrollViewProps>;
};

function ScreenCanvas({
  children,
  header,
  footer,
  overlap = 0,
  roundBody = true,
  scroll = true,
  onRefresh,
  refreshing = false,
  gutter,
  paddingBottom,
  background,
  contentStyle,
  style,
  scrollProps,
}: Props) {
  const { COLORS, SIZES, isDark } = useTheme();

  const bg = background ?? COLORS.canvas;
  const G = gutter ?? SIZES.layout.gutter;
  // Default clears the floating tab capsule, which overlays content.
  const padBottom = paddingBottom ?? SIZES.layout.section * 3.4;

  const bodyStyle: ViewStyle = {
    flex: scroll ? undefined : 1,
    backgroundColor: bg,
    marginTop: -overlap,
    paddingTop: overlap > 0 ? 0 : SIZES.padding.lg,
    borderTopLeftRadius: roundBody && overlap > 0 ? SIZES.radius.sheet : 0,
    borderTopRightRadius: roundBody && overlap > 0 ? SIZES.radius.sheet : 0,
  };

  const body = (
    <View style={[bodyStyle, contentStyle]}>
      <View style={{ paddingHorizontal: G, paddingBottom: padBottom }}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: COLORS.heroCanvas }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.heroCanvas} />

      {scroll ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: bg }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
                progressBackgroundColor={COLORS.canvasElevated}
              />
            ) : undefined
          }
          {...scrollProps}
        >
          {header}
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, backgroundColor: bg }}>
          {header}
          {body}
        </View>
      )}

      {footer}

      {/* Fill the home-indicator area with the body colour when there
          is no pinned footer to do it. */}
      {!footer && (
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: bg }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
});

export default memo(ScreenCanvas);
