export interface IMovement {
  id: string;
  tonerId: string;
  printerId?: string | null;
  quantity: number;
  description?: string | null;
  type: 'in' | 'out';
  createdAt: string;
  tonerModel?: string;
  printerName?: string;
}

