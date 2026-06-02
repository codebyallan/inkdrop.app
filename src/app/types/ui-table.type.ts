export interface ColumnDef<T = Record<string, unknown>> {
  id: string;
  header?: string;
  field?: keyof T | string;
  type: 'text' | 'date' | 'badge' | 'actions' | 'icon';
  dateFormat?: string;
  /** 
   * Transform function.
   * @param value The value of the cell.
   * @param row The entire row object for context.
   */
  transform?: (value: unknown, row: T) => string | number;
  /** 
   * Color transform for 'icon' type.
   * @param value The value of the cell.
   * @param row The entire row object for context.
   */
  colorTransform?: (value: unknown, row: T) => string;
  /** 
   * Tooltip transform for 'icon' type.
   * @param value The value of the cell.
   * @param row The entire row object for context.
   */
  tooltipTransform?: (value: unknown, row: T) => string;
}