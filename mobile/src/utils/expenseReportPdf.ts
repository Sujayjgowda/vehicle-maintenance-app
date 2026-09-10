import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { format } from 'date-fns';

export interface ExpenseReportItem {
  id: string;
  date: string | Date;
  category: string;
  amount: number;
  notes?: string;
  vehicleName?: string;
}

export interface VehicleReportMeta {
  make: string;
  model: string;
  year?: number | string;
  licensePlate: string;
  fuelType?: string;
  currentOdometer?: number | string;
}

export interface ExpenseReportOptions {
  periodType: 'ANNUAL' | 'MONTHLY' | 'ALL_TIME';
  periodLabel: string;
  vehicle?: VehicleReportMeta | null;
  items: ExpenseReportItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  FUEL: '#F97316',
  SERVICE: '#0EA5E9',
  REPAIR: '#EF4444',
  PARTS: '#8B5CF6',
  TOLL: '#EAB308',
  PARKING: '#10B981',
  INSURANCE: '#6366F1',
  OTHER: '#64748B',
};

const CATEGORY_LABELS: Record<string, string> = {
  FUEL: 'Fuel & Gas',
  SERVICE: 'Periodic Service',
  REPAIR: 'Repairs & Breakdown',
  PARTS: 'Parts Replacement',
  TOLL: 'Fastag & Highway Tolls',
  PARKING: 'Parking Fees',
  INSURANCE: 'Insurance & Taxes',
  OTHER: 'General & Others',
};

export function generateExpenseReportHtml(options: ExpenseReportOptions): string {
  const { periodLabel, vehicle, items } = options;

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCount = items.length;

  // Category aggregates
  const catStats: Record<string, { count: number; amount: number }> = {};
  items.forEach((it) => {
    const cat = it.category?.toUpperCase() || 'OTHER';
    if (!catStats[cat]) catStats[cat] = { count: 0, amount: 0 };
    catStats[cat].count += 1;
    catStats[cat].amount += Number(it.amount) || 0;
  });

  const fuelCost = catStats['FUEL']?.amount || 0;
  const maintenanceCost =
    (catStats['SERVICE']?.amount || 0) +
    (catStats['REPAIR']?.amount || 0) +
    (catStats['PARTS']?.amount || 0);
  const otherCost = Math.max(0, totalAmount - fuelCost - maintenanceCost);

  const fuelPct = totalAmount > 0 ? ((fuelCost / totalAmount) * 100).toFixed(1) : '0';
  const maintPct = totalAmount > 0 ? ((maintenanceCost / totalAmount) * 100).toFixed(1) : '0';
  const otherPct = totalAmount > 0 ? ((otherCost / totalAmount) * 100).toFixed(1) : '0';

  // Sort categories by amount descending
  const sortedCategories = Object.keys(catStats).sort(
    (a, b) => catStats[b].amount - catStats[a].amount
  );

  // Monthly aggregates (for annual/all time)
  const monthMap: Record<string, { fuel: number; maintenance: number; other: number; total: number }> = {};
  items.forEach((it) => {
    try {
      const d = new Date(it.date);
      if (!isNaN(d.getTime())) {
        const monthKey = format(d, 'MMM yyyy');
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { fuel: 0, maintenance: 0, other: 0, total: 0 };
        }
        const amt = Number(it.amount) || 0;
        const cat = it.category?.toUpperCase() || 'OTHER';
        if (cat === 'FUEL') monthMap[monthKey].fuel += amt;
        else if (cat === 'SERVICE' || cat === 'REPAIR' || cat === 'PARTS') {
          monthMap[monthKey].maintenance += amt;
        } else {
          monthMap[monthKey].other += amt;
        }
        monthMap[monthKey].total += amt;
      }
    } catch {
      // Ignore invalid date in monthly chart
    }
  });

  const hasMonthlyBreakdown = Object.keys(monthMap).length > 1;

  // Sort items descending by date
  const sortedItems = [...items].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const genDateStr = format(new Date(), 'dd-MMM-yyyy, hh:mm a');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Garage Grid - Vehicle Expense Audit Report</title>
  <style>
    @page {
      margin: 18mm 14mm;
      size: A4 portrait;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #FFFFFF;
      color: #0F172A;
      font-size: 11px;
      line-height: 1.45;
      padding: 0;
    }

    /* Print Styles & Toolbar */
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      background: #0F172A;
      color: #FFFFFF;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      margin: -10px -10px 20px -10px;
      z-index: 9999;
    }
    .toolbar-brand {
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
      color: #38BDF8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #0284C7;
      color: #FFFFFF;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-close {
      background: #334155;
      color: #E2E8F0;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }

    /* Header */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #0284C7;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 2px;
    }
    .report-badge {
      text-align: right;
    }
    .scope-title {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
    }
    .gen-date {
      font-size: 10px;
      color: #64748B;
      margin-top: 3px;
    }

    /* Vehicle Info Box */
    .vehicle-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
      display: table;
      width: 100%;
    }
    .veh-cell {
      display: table-cell;
      vertical-align: middle;
    }
    .veh-name {
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
    }
    .veh-sub {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }
    .veh-meta-right {
      text-align: right;
    }
    .plate-badge {
      display: inline-block;
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.8px;
    }

    /* Summary KPI Cards */
    .kpi-row {
      display: table;
      width: 100%;
      margin-bottom: 18px;
      border-spacing: 8px 0;
    }
    .kpi-card {
      display: table-cell;
      width: 25%;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
    }
    .kpi-card.highlight {
      background: #F0F9FF;
      border-color: #BAE6FD;
    }
    .kpi-label {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 17px;
      font-weight: 900;
      color: #0F172A;
      margin-top: 3px;
    }
    .kpi-sub {
      font-size: 9px;
      color: #64748B;
      margin-top: 2px;
      font-weight: 600;
    }

    /* Section Headings */
    .section-header {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 16px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #E2E8F0;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 10px;
    }
    table.data-table th {
      background-color: #F1F5F9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 8px 10px;
      border-bottom: 1.5px solid #CBD5E1;
      text-align: left !important;
      vertical-align: middle;
    }
    table.data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #E2E8F0;
      color: #1E293B;
      text-align: left !important;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #FAFAFA;
    }
    .fw-bold {
      font-weight: 700;
    }

    /* Category Progress bar */
    .progress-track {
      background: #E2E8F0;
      border-radius: 4px;
      height: 6px;
      width: 100%;
      overflow: hidden;
      margin-top: 3px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
    }

    .cat-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      color: #FFFFFF;
      text-transform: uppercase;
    }

    /* Footer */
    .footer-table {
      width: 100%;
      border-top: 1px solid #CBD5E1;
      padding-top: 10px;
      margin-top: 24px;
      font-size: 9px;
      color: #94A3B8;
    }
  </style>
<body>

  <!-- Floating Print & Save Toolbar (Hidden on actual print/PDF) -->
  <div class="no-print print-toolbar">
    <div class="toolbar-brand">
      <span>📄</span> GARAGE GRID &bull; EXPENSE AUDIT REPORT
    </div>
    <div class="toolbar-actions">
      <button onclick="window.print()" class="btn-print">🖨️ Save as PDF / Print</button>
      <button onclick="window.close()" class="btn-close">Close</button>
    </div>
  </div>

  <!-- 1. Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <div class="brand-title">GARAGE GRID</div>
        <div class="brand-subtitle">Vehicle Expense Audit Report</div>
      </td>
      <td class="report-badge" style="vertical-align: top;">
        <div class="scope-title">${periodLabel}</div>
        <div class="gen-date">Generated: ${genDateStr}</div>
      </td>
    </tr>
  </table>

  <!-- 2. Target Vehicle Details -->
  <div class="vehicle-card">
    <div class="veh-cell" style="width: 65%;">
      ${
        vehicle
          ? `<div class="veh-name">${vehicle.make} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}</div>
             <div class="veh-sub">Fuel: <strong>${vehicle.fuelType || 'Standard'}</strong> &bull; Current Odometer: <strong>${vehicle.currentOdometer ? Number(vehicle.currentOdometer).toLocaleString() + ' KM' : '—'}</strong></div>`
          : `<div class="veh-name">Consolidated Fleet / Garage Report</div>
             <div class="veh-sub">Consolidated expenses across all registered garage vehicles</div>`
      }
    </div>
    <div class="veh-cell veh-meta-right" style="width: 35%;">
      ${
        vehicle?.licensePlate
          ? `<div class="plate-badge">${vehicle.licensePlate}</div>`
          : `<div class="plate-badge">ALL VEHICLES</div>`
      }
    </div>
  </div>

  <!-- 3. Key Financial Metrics -->
  <div class="kpi-row">
    <div class="kpi-card highlight">
      <div class="kpi-label">Total Expenditure</div>
      <div class="kpi-value">₹${Math.round(totalAmount).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">${totalCount} total entries</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Fuel Costs</div>
      <div class="kpi-value">₹${Math.round(fuelCost).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">${fuelPct}% of budget</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Maintenance & Repairs</div>
      <div class="kpi-value">₹${Math.round(maintenanceCost).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">${maintPct}% of budget</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Tolls, Parking & Other</div>
      <div class="kpi-value">₹${Math.round(otherCost).toLocaleString('en-IN')}</div>
      <div class="kpi-sub">${otherPct}% of budget</div>
    </div>
  </div>

  <!-- 4. Category Breakdown -->
  <div class="section-header">Category Expense Breakdown</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 26%;">Expense Category</th>
        <th style="width: 14%;">Transactions</th>
        <th style="width: 20%;">Total Amount</th>
        <th style="width: 40%;">Budget Distribution</th>
      </tr>
    </thead>
    <tbody>
      ${sortedCategories
        .map((catKey) => {
          const cat = catStats[catKey];
          const pct = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;
          const label = CATEGORY_LABELS[catKey] || catKey;
          const color = CATEGORY_COLORS[catKey] || '#64748B';
          return `
          <tr>
            <td>
              <span class="cat-badge" style="background: ${color};">${catKey}</span>
              <strong style="margin-left: 6px;">${label}</strong>
            </td>
            <td>${cat.count}</td>
            <td class="fw-bold">₹${Math.round(cat.amount).toLocaleString('en-IN')}</td>
            <td>
              <div style="font-size: 9px; font-weight: 700; color: #475569;">${pct.toFixed(1)}%</div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${Math.min(100, Math.max(2, pct))}%; background: ${color};"></div>
              </div>
            </td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>

  <!-- 5. Monthly Trajectory (Optional if multi-month) -->
  ${
    hasMonthlyBreakdown
      ? `
  <div class="section-header">Monthly Trajectory</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 20%;">Month</th>
        <th style="width: 20%;">Fuel (₹)</th>
        <th style="width: 20%;">Maintenance (₹)</th>
        <th style="width: 20%;">Other (₹)</th>
        <th style="width: 20%;">Total Spent</th>
      </tr>
    </thead>
    <tbody>
      ${Object.keys(monthMap)
        .map((mKey) => {
          const m = monthMap[mKey];
          return `
          <tr>
            <td class="fw-bold">${mKey}</td>
            <td>₹${Math.round(m.fuel).toLocaleString('en-IN')}</td>
            <td>₹${Math.round(m.maintenance).toLocaleString('en-IN')}</td>
            <td>₹${Math.round(m.other).toLocaleString('en-IN')}</td>
            <td class="fw-bold" style="color: #0284C7;">₹${Math.round(m.total).toLocaleString('en-IN')}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  <!-- 6. Chronological Transaction Ledger -->
  <div class="section-header">Detailed Transaction Ledger (${sortedItems.length} records)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 15%;">Date</th>
        <th style="width: 14%;">Category</th>
        ${!vehicle ? '<th style="width: 18%;">Vehicle</th>' : ''}
        <th>Description / Notes</th>
        <th style="width: 18%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${
        sortedItems.length > 0
          ? sortedItems
              .map((it) => {
                let dateFormatted = String(it.date);
                try {
                  const d = new Date(it.date);
                  if (!isNaN(d.getTime())) dateFormatted = format(d, 'dd-MMM-yyyy');
                } catch {}

                const catKey = it.category?.toUpperCase() || 'OTHER';
                const color = CATEGORY_COLORS[catKey] || '#64748B';

                return `
              <tr>
                <td style="white-space: nowrap; font-weight: 600;">${dateFormatted}</td>
                <td><span class="cat-badge" style="background: ${color};">${catKey}</span></td>
                ${!vehicle ? `<td><strong>${it.vehicleName || '—'}</strong></td>` : ''}
                <td>${it.notes || '—'}</td>
                <td class="fw-bold">₹${Number(it.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>`;
              })
              .join('')
          : `<tr><td colspan="${!vehicle ? 5 : 4}" style="padding: 16px; color: #94A3B8;">No expense records found for this period.</td></tr>`
      }
    </tbody>
  </table>

  <!-- 7. Footer -->
  <table class="footer-table">
    <tr>
      <td>Garage Grid &bull; Official Expense Audit Record</td>
      <td class="text-right">Report Scope: ${periodLabel}</td>
    </tr>
  </table>

</body>
</html>
`;
}

export async function exportExpensePdf(html: string, fileName = 'GarageGrid_Expense_Report.pdf') {
  if (Platform.OS === 'web') {
    // Open full document in a dedicated preview tab where user can see the report and print/save to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.log('Print trigger error:', e);
        }
      }, 500);
    } else {
      // If popup blocker intervened, provide direct download
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.pdf', '') + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } else {
    // Native iOS / Android PDF generation & share sheet
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Expense Audit Report',
      });
    } else {
      await Print.printAsync({ uri });
    }
  }
}
