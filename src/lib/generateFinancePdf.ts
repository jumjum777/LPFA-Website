import jsPDF from 'jspdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FinancePdfOptions {
  periodLabel: string;
  summary: {
    summary: string;
    highlights: string[];
    trend: string;
    generatedAt: string;
  } | null;
  totals: {
    grossRevenue: number;
    processingFees: number;
    serviceFees: number;
    netPayout: number;
    totalOrders: number;
    paidOrders: number;
    freeOrders: number;
    totalTickets: number;
    avgOrderValue: number;
  };
  monthly: Array<{
    label: string;
    orders: number;
    paidOrders: number;
    tickets: number;
    revenue: number;
    fees: number;
    svcFees: number;
    net: number;
  }>;
  events: Array<{
    name: string;
    date: string;
    orders: number;
    paidOrders: number;
    tickets: number;
    revenue: number;
    fees: number;
    net: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  hasTxnData: boolean;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const NAVY = [11, 31, 58] as const;
const GOLD = [217, 119, 6] as const;
const GREEN = [16, 185, 129] as const;
const BLUE = [27, 139, 235] as const;
const RED = [239, 68, 68] as const;
const WHITE = [255, 255, 255] as const;
const TEXT_DARK = [30, 41, 59] as const;
const TEXT_MED = [100, 116, 139] as const;
const PURPLE = [124, 58, 237] as const;
const BORDER = [226, 232, 240] as const;
const ROTR_RED = [220, 38, 38] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return fmtCurrency(n);
}

/** Sanitize text for jsPDF helvetica — strip/replace unicode chars that break rendering */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ' -- ')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x00-\x7E]/g, '');
}

/** Load image, scale down, return as compressed JPEG data URL. */
async function loadImageCompressed(
  url: string,
  maxWidth = 200,
  maxHeight = 200,
  bgColor?: readonly [number, number, number]
): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const img = await createImageBitmap(blob);

    let w = img.width;
    let h = img.height;
    if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
    if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }

    const canvas = new OffscreenCanvas(Math.round(w), Math.round(h));
    const ctx = canvas.getContext('2d')!;

    if (bgColor) {
      ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
      ctx.fillRect(0, 0, Math.round(w), Math.round(h));
    }

    ctx.drawImage(img, 0, 0, Math.round(w), Math.round(h));

    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(outBlob);
    });
  } catch {
    return null;
  }
}

// ─── PDF Generator ───────────────────────────────────────────────────────────

export async function generateFinancePdf(options: FinancePdfOptions): Promise<void> {
  const { periodLabel, summary, totals, monthly, events, paymentMethods, hasTxnData } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  const now = new Date();
  const ACCENT = ROTR_RED;

  // ─── Page utilities ──────────────────────────────────────────────

  function addFooter() {
    const pageNum = doc.getNumberOfPages();
    const footerY = pageHeight - 14;

    doc.setFillColor(...ACCENT);
    doc.rect(margin, footerY, contentWidth, 0.5, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MED);
    doc.text("Confidential  |  Rockin' on the River / LPFA", margin, footerY + 4);
    doc.text(`Page ${pageNum}`, pageWidth - margin, footerY + 4, { align: 'right' });
  }

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 22) {
      addFooter();
      doc.addPage();
      y = 15;
    }
  }

  function drawSectionDivider() {
    y += 3;
    const cx = pageWidth / 2;
    doc.setFillColor(...BORDER);
    doc.circle(cx - 6, y, 0.4, 'F');
    doc.circle(cx, y, 0.4, 'F');
    doc.circle(cx + 6, y, 0.4, 'F');
    y += 5;
  }

  function drawSectionHeader(title: string, color: readonly [number, number, number]) {
    checkPageBreak(34);
    y += 6;

    doc.setFillColor(...color);
    doc.rect(margin, y, 3, 7, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title.toUpperCase(), margin + 7, y + 5.2);

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 9, pageWidth - margin, y + 9);

    y += 13;
  }

  function drawMetricCards(
    metrics: { label: string; value: string; color?: readonly [number, number, number] }[],
    accentColor: readonly [number, number, number]
  ) {
    const gap = 3;
    const count = metrics.length;
    const cardW = (contentWidth - gap * (count - 1)) / count;
    const cardH = 22;
    const accentH = 1.5;
    const cornerR = 2;

    checkPageBreak(cardH + 4);

    for (let i = 0; i < count; i++) {
      const x = margin + i * (cardW + gap);
      const itemColor = metrics[i].color || accentColor;

      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.setFillColor(...WHITE);
      doc.roundedRect(x, y, cardW, cardH, cornerR, cornerR, 'FD');

      doc.setFillColor(...itemColor);
      doc.roundedRect(x, y, cardW, accentH + cornerR, cornerR, cornerR, 'F');
      doc.setFillColor(...WHITE);
      doc.rect(x, y + accentH, cardW, cornerR, 'F');

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(metrics[i].color || NAVY));
      doc.text(metrics[i].value, x + cardW / 2, y + accentH + 9, { align: 'center' });

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MED);
      doc.text(metrics[i].label.toUpperCase(), x + cardW / 2, y + accentH + 15, { align: 'center' });
    }

    y += cardH + 4;
  }

  // Table with page-break-aware header redraw
  function drawTable(
    headers: { label: string; align?: 'left' | 'right'; width?: number }[],
    rows: string[][],
    totalsRow?: string[]
  ) {
    const rowH = 5.5;
    const headerH = 6;

    const totalFixedWidth = headers.reduce((sum, h) => sum + (h.width || 0), 0);
    const flexCols = headers.filter(h => !h.width).length;
    const flexWidth = flexCols > 0 ? (contentWidth - totalFixedWidth) / flexCols : 0;
    const colWidths = headers.map(h => h.width || flexWidth);

    checkPageBreak(headerH + rowH * Math.min(rows.length, 2) + 8);

    function drawTableHeader() {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, headerH, 'F');

      // Thin accent line under header
      doc.setFillColor(...ACCENT);
      doc.rect(margin, y + headerH, contentWidth, 0.4, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_MED);

      let x = margin;
      headers.forEach((h, i) => {
        const align = h.align || 'left';
        const tx = align === 'right' ? x + colWidths[i] - 2 : x + 2;
        doc.text(h.label.toUpperCase(), tx, y + 4.2, { align });
        x += colWidths[i];
      });
      y += headerH + 0.4;
    }

    drawTableHeader();

    for (let r = 0; r < rows.length; r++) {
      const pageBefore = doc.getNumberOfPages();
      checkPageBreak(rowH + 2);
      if (doc.getNumberOfPages() > pageBefore) drawTableHeader();

      if (r % 2 === 1) {
        doc.setFillColor(250, 251, 252);
        doc.rect(margin, y, contentWidth, rowH, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...TEXT_DARK);
      let x = margin;
      rows[r].forEach((cell, i) => {
        const align = headers[i]?.align || 'left';
        const tx = align === 'right' ? x + colWidths[i] - 2 : x + 2;
        const truncated = cell.length > 30 ? cell.substring(0, 28) + '...' : cell;
        doc.text(sanitize(truncated), tx, y + 3.8, { align });
        x += colWidths[i];
      });
      y += rowH;
    }

    if (totalsRow) {
      const pageBefore = doc.getNumberOfPages();
      checkPageBreak(rowH + 4);
      if (doc.getNumberOfPages() > pageBefore) drawTableHeader();

      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.line(margin, y, margin + contentWidth, y);
      y += 0.5;

      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentWidth, rowH + 0.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...NAVY);
      let x = margin;
      totalsRow.forEach((cell, i) => {
        const align = headers[i]?.align || 'left';
        const tx = align === 'right' ? x + colWidths[i] - 2 : x + 2;
        doc.text(cell, tx, y + 4, { align });
        x += colWidths[i];
      });
      y += rowH + 0.5;
    }
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════════
  // HEADER — Clean white with accent line
  // ═══════════════════════════════════════════════════════════════════

  const logoBase64 = await loadImageCompressed('/images/rotr-logo.png', 200, 200, WHITE);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', margin, 8, 28, 28);
    } catch { /* continue without logo */ }
  }

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Financial Report', pageWidth - margin, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MED);
  doc.text("Rockin' on the River", pageWidth - margin, 26, { align: 'right' });

  doc.setFillColor(...ACCENT);
  doc.rect(margin, 40, contentWidth, 1.5, 'F');

  y = 48;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Report Period: ${periodLabel}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MED);
  doc.setFontSize(8);
  doc.text(
    `Generated ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    pageWidth - margin, y, { align: 'right' }
  );
  y += 5;

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ─── AI Executive Summary ─────────────────────────────────────────

  if (summary) {
    doc.setFillColor(...NAVY);
    doc.roundedRect(margin, y, 16, 5, 1, 1, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('AI INSIGHT', margin + 8, y + 3.5, { align: 'center' });

    const trendColors: Record<string, readonly [number, number, number]> = {
      positive: GREEN,
      stable: BLUE,
      declining: RED,
    };
    const trendColor = trendColors[summary.trend] || BLUE;
    const trendLabel = sanitize(summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1));

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    const badgeW = doc.getTextWidth(trendLabel) + 7;
    doc.setFillColor(...trendColor);
    doc.roundedRect(margin + 19, y, badgeW, 5, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.text(trendLabel, margin + 19 + badgeW / 2, y + 3.5, { align: 'center' });
    y += 10;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Financial Summary', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);

    const paragraphs = sanitize(summary.summary).split(/\n\n|\n/).filter(p => p.trim());
    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para.trim(), contentWidth);
      checkPageBreak(lines.length * 4 + 3);
      doc.text(lines, margin, y);
      y += lines.length * 4 + 3;
    }
    y += 2;

    if (summary.highlights.length > 0) {
      checkPageBreak(10 + summary.highlights.length * 7);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text('Key Highlights', margin, y);
      y += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_DARK);

      for (const highlight of summary.highlights) {
        const clean = sanitize(highlight);
        const lines = doc.splitTextToSize(clean, contentWidth - 8);
        const lineH = lines.length * 4;
        checkPageBreak(lineH + 4);

        doc.setFillColor(...ACCENT);
        doc.roundedRect(margin, y, 1.5, lineH + 0.5, 0.5, 0.5, 'F');
        doc.text(lines, margin + 5, y + 1);
        y += lineH + 4;
      }
      y += 2;
    }

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════
  // FINANCIAL DATA
  // ═══════════════════════════════════════════════════════════════════

  drawSectionHeader('Financial Overview', NAVY);
  drawMetricCards([
    { label: 'Gross Revenue', value: fmtCompact(totals.grossRevenue), color: GREEN },
    { label: 'Processing Fees', value: `-${fmtCompact(totals.processingFees)}`, color: RED },
    { label: 'Service Fees', value: fmtCompact(totals.serviceFees), color: PURPLE },
    { label: 'Net Payout', value: fmtCompact(totals.netPayout), color: BLUE },
  ], NAVY);

  drawMetricCards([
    { label: 'Total Orders', value: fmt(totals.totalOrders) },
    { label: 'Paid Orders', value: fmt(totals.paidOrders) },
    { label: 'Tickets Sold', value: fmt(totals.totalTickets) },
    { label: 'Avg Order Value', value: fmtCurrency(totals.avgOrderValue) },
  ], NAVY);

  // Fee note
  checkPageBreak(10);
  doc.setFillColor(250, 251, 252);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');

  doc.setFillColor(...NAVY);
  doc.rect(margin, y, 2.5, 7, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...TEXT_MED);
  doc.text(
    `Processing fees: 2.9% + $0.30/txn. Service fees${hasTxnData ? ' (actual)' : ' (est. 2.5%)'}.`,
    margin + 5, y + 4.5
  );
  y += 10;

  drawSectionDivider();

  // ─── Monthly Breakdown ─────────────────────────────────────────

  if (monthly.length > 0) {
    drawSectionHeader('Monthly Breakdown', BLUE);
    drawTable(
      [
        { label: 'Month', width: 38 },
        { label: 'Orders', align: 'right' as const, width: 16 },
        { label: 'Tickets', align: 'right' as const, width: 16 },
        { label: 'Gross', align: 'right' as const, width: 28 },
        { label: 'Proc. Fees', align: 'right' as const, width: 26 },
        { label: `Svc Fees${hasTxnData ? '' : '*'}`, align: 'right' as const, width: 24 },
        { label: 'Net', align: 'right' as const, width: 32 },
      ],
      monthly.map(m => [
        m.label, String(m.orders), String(m.tickets),
        fmtCurrency(m.revenue), `-${fmtCurrency(m.fees)}`,
        fmtCurrency(m.svcFees), fmtCurrency(m.net),
      ]),
      [
        'Total', String(totals.totalOrders), String(totals.totalTickets),
        fmtCurrency(totals.grossRevenue), `-${fmtCurrency(totals.processingFees)}`,
        fmtCurrency(totals.serviceFees), fmtCurrency(totals.netPayout),
      ]
    );
    drawSectionDivider();
  }

  // ─── Revenue by Event ──────────────────────────────────────────

  if (events.length > 0) {
    drawSectionHeader('Revenue by Event', GOLD);
    drawTable(
      [
        { label: 'Event', width: 50 },
        { label: 'Date', width: 30 },
        { label: 'Orders', align: 'right' as const, width: 18 },
        { label: 'Gross', align: 'right' as const, width: 28 },
        { label: 'Fees', align: 'right' as const, width: 24 },
        { label: 'Net', align: 'right' as const, width: 30 },
      ],
      events.map(ev => [
        ev.name, ev.date, String(ev.orders),
        fmtCurrency(ev.revenue), `-${fmtCurrency(ev.fees)}`, fmtCurrency(ev.net),
      ]),
      [
        'Total', '', String(totals.totalOrders),
        fmtCurrency(totals.grossRevenue), `-${fmtCurrency(totals.processingFees)}`,
        fmtCurrency(totals.netPayout),
      ]
    );
    drawSectionDivider();
  }

  // ─── Payment Methods ───────────────────────────────────────────

  if (paymentMethods.length > 0) {
    drawSectionHeader('Payment Methods', PURPLE);
    drawTable(
      [
        { label: 'Method', width: 60 },
        { label: 'Orders', align: 'right' as const, width: 30 },
        { label: 'Revenue', align: 'right' as const, width: 50 },
        { label: '% of Revenue', align: 'right' as const, width: 40 },
      ],
      paymentMethods.map(pm => [
        pm.method, String(pm.count), fmtCurrency(pm.revenue),
        totals.grossRevenue > 0 ? `${((pm.revenue / totals.grossRevenue) * 100).toFixed(1)}%` : '0%',
      ])
    );
  }

  // ─── Data Sources ──────────────────────────────────────────────

  checkPageBreak(22);
  y += 4;

  doc.setFillColor(250, 251, 252);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_MED);
  doc.text('DATA SOURCES', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Wix Events, Wix eCommerce Transactions', margin + 4, y + 9);
  doc.text('Processing fee: 2.9% + $0.30/txn (verified against Wix payout statements).', margin + 4, y + 13);

  y += 20;
  addFooter();

  // ─── Save ──────────────────────────────────────────────────────

  const dateStr = now.toISOString().slice(0, 10);
  const periodSlug = periodLabel.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  doc.save(`ROTR-Financial-Report-${periodSlug}-${dateStr}.pdf`);
}
