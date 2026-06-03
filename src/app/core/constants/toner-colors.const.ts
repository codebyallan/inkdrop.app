/**
 * Toner color mapping for consistency across the application.
 * Note: Hex values are used here as fallbacks and should mirror the 
 * --app-primary, --app-secondary, and --app-error variables defined in styles.scss.
 */
export const TONER_COLOR_MAP: Record<string, string> = {
  'black': '#212121',
  'preto': '#212121',
  'k': '#212121',
  'cyan': '#00838f',
  'ciano': '#00838f',
  'c': '#00838f',
  'magenta': '#ad1457',
  'm': '#ad1457',
  'yellow': '#f9a825',
  'amarelo': '#f9a825',
  'y': '#f9a825',
  '_fallback': '#6750A4',
};

/**
 * Fallback color palette for Chart.js when specific colors are not provided by the API.
 */
export const CHART_FALLBACK_COLORS: readonly string[] = [
  '#6750A4', '#03DAC6', '#FF5252', '#FFD740', '#4CAF50',
  '#2196F3', '#FF9800', '#9C27B0', '#795548', '#607D8B',
];
