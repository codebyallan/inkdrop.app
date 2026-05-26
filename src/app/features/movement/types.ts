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

export interface IMovementDisplay extends IMovement {
  tonerModel: string;
  printerName: string;
}

