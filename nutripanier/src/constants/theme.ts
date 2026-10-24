import '@/global.css';

// Palette vérifiée pour un contraste texte/fond d'au moins 4,5:1 (WCAG AA).
export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#4B5563',
    background: '#FFFFFF',
    card: '#F3F6F4',
    border: '#D1D9D4',
    primary: '#1B6B3A',
    onPrimary: '#FFFFFF',
    danger: '#B42318',
    warning: '#8A4B00',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#B0B7BF',
    background: '#0E1110',
    card: '#1A1F1C',
    border: '#2F3A33',
    primary: '#6FCF97',
    onPrimary: '#0E1110',
    danger: '#FF8A80',
    warning: '#FFC266',
  },
} as const;

export type Palette = { [K in keyof (typeof Colors)['light']]: string };

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const MaxContentWidth = 640;
// Cible tactile minimale recommandée (44 pt iOS / 48 dp Android).
export const MinTouch = 48;
