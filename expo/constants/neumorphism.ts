import { Platform } from 'react-native';

export const neumorphismColors = {
  background: '#0F0F23',
  surface: '#1A1A2E',
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  tertiary: '#A8E6CF',
  quaternary: '#FF8B94',
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    muted: '#A0A0A0',
  },
  shadow: {
    dark: '#000000',
    light: '#2A2A3E',
  },
};

export const neumorphismShadows = {
  pressed: Platform.select({
    ios: {
      shadowColor: neumorphismColors.shadow.dark,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: 'inset 4px 4px 8px #000000, inset -4px -4px 8px #2A2A3E',
    },
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: neumorphismColors.shadow.dark,
      shadowOffset: { width: 8, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
    web: {
      boxShadow: '8px 8px 16px #000000, -8px -8px 16px #2A2A3E',
    },
  }),
  soft: Platform.select({
    ios: {
      shadowColor: neumorphismColors.shadow.dark,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    web: {
      boxShadow: '4px 4px 8px #000000, -4px -4px 8px #2A2A3E',
    },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: neumorphismColors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: `0 0 20px ${neumorphismColors.primary}40, 4px 4px 8px #000000, -4px -4px 8px #2A2A3E`,
    },
  }),
};

export const createNeumorphicStyle = (pressed: boolean = false) => ({
  backgroundColor: neumorphismColors.surface,
  borderRadius: 16,
  ...(pressed ? neumorphismShadows.pressed : neumorphismShadows.elevated),
});

export const createSoftNeumorphicStyle = () => ({
  backgroundColor: neumorphismColors.surface,
  borderRadius: 12,
  ...neumorphismShadows.soft,
});

export const createGlowNeumorphicStyle = (pressed: boolean = false) => ({
  backgroundColor: neumorphismColors.surface,
  borderRadius: 16,
  ...(pressed ? neumorphismShadows.pressed : neumorphismShadows.glow),
});

export const createGradientStyle = (colors: string[]) => ({
  background: `linear-gradient(135deg, ${colors.join(', ')})`,
});
