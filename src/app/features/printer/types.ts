export interface ITonerTelemetry {
  color: string;
  level: number;
}

export interface IPrinterTelemetry {
  totalPages: number;
  toners: ITonerTelemetry[];
  status: 'Online' | 'Offline';
  lastUpdate: string;
}

export interface IPrinter {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  ipAddress: string;
  locationId: string;
  createdAt: string;
  locationName?: string;
  telemetry?: IPrinterTelemetry;
}

