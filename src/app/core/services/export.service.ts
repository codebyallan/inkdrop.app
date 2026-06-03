import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface IExportData {
  summary: any;
  printedPages: any;
  tonerConsumption: any;
  predictions: any[];
}

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  
  /**
   * Export data to JSON file
   */
  exportToJSON(data: IExportData, filename: string = 'inkdrop-report'): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${filename}.json`);
  }

  /**
   * Export data to CSV file. 
   * Since the data is complex, we export the printer breakdown as the main CSV content.
   */
  exportToCSV(data: IExportData, filename: string = 'inkdrop-report'): void {
    const rows: any[][] = [];
    
    // Header
    rows.push(['Printer', 'Total Pages', 'Mono Pages', 'Color Pages', 'Share %']);
    
    // Data from printedPages.byPrinter
    if (data.printedPages?.byPrinter) {
      data.printedPages.byPrinter.forEach((p: any) => {
        rows.push([
          p.printerName,
          p.totalPages,
          p.monoPages ?? 0,
          p.colorPages ?? 0,
          p.share // Assuming share is pre-calculated or passed
        ]);
      });
    }

    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  /**
   * Export data to Excel file with multiple sheets
   */
  exportToExcel(data: IExportData, filename: string = 'inkdrop-report'): void {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Pages', data.summary?.totalPages ?? data.printedPages?.totalPages ?? 0],
      ['Fleet Health', data.summary?.avgFleetHealth ? `${data.summary.avgFleetHealth}%` : 'N/A'],
      ['Top Consumer', data.summary?.topConsumerPrinter ?? 'N/A'],
      ['Critical Toners', data.summary?.criticalTonerCount ?? 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Printer Breakdown Sheet
    if (data.printedPages?.byPrinter) {
      const printerData = data.printedPages.byPrinter.map((p: any) => ({
        Printer: p.printerName,
        'Total Pages': p.totalPages,
        'Mono Pages': p.monoPages ?? 0,
        'Color Pages': p.colorPages ?? 0,
        'Share': p.share
      }));
      const wsPrinters = XLSX.utils.json_to_sheet(printerData);
      XLSX.utils.book_append_sheet(wb, wsPrinters, 'Printers');
    }

    // 3. Consumption Sheet
    if (data.tonerConsumption?.datasets) {
      const consumptionData = data.tonerConsumption.datasets.map((ds: any) => ({
        Toner: ds.label,
        ...Object.fromEntries(data.tonerConsumption.labels.map((label: string, i: number) => [label, ds.data[i]]))
      }));
      const wsConsumption = XLSX.utils.json_to_sheet(consumptionData);
      XLSX.utils.book_append_sheet(wb, wsConsumption, 'Consumption');
    }

    // 4. Predictions Sheet
    if (data.predictions) {
      const predData = data.predictions.map((p: any) => ({
        Printer: p.printerName,
        Color: p.color,
        'Days Remaining': p.estimatedDaysRemaining,
        'Estimated Date': p.estimatedDate
      }));
      const wsPreds = XLSX.utils.json_to_sheet(predData);
      XLSX.utils.book_append_sheet(wb, wsPreds, 'Predictions');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
