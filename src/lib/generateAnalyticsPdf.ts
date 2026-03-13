import jsPDF from 'jspdf';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PdfOptions {
  profile: 'lpfa' | 'rotr';
  periodLabel: string;
  summary: {
    summary: string;
    highlights: string[];
    trend: string;
    generatedAt: string;
  } | null;
  crossPlatform: {
    totalReach: number;
    totalAudience: number;
    totalEngagements: number;
    totalVideoViews: number;
  };
  web: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate?: number;
    topPages?: { path: string; title: string; pageviews: number }[];
  } | null;
  facebook: {
    followers: number;
    impressions: number;
    engagements: number;
    videoViews: number;
    reactions?: Record<string, number>;
  } | null;
  youtube: {
    subscribers: number;
    views: number;
    watchMinutes: number;
    videos: number;
    likes: number;
    comments: number;
  } | null;
  email: {
    sends: number;
    opens: number;
    clicks: number;
    contacts: number;
    campaigns: number;
  } | null;
  events: {
    totalEvents: number;
    totalTickets: number;
    totalRevenue: number;
  } | null;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const NAVY = [11, 31, 58] as const;
const BLUE = [27, 139, 235] as const;
const GOLD = [217, 119, 6] as const;
const GREEN = [16, 185, 129] as const;
const RED = [239, 68, 68] as const;
const WHITE = [255, 255, 255] as const;
const TEXT_DARK = [30, 41, 59] as const;
const TEXT_MED = [100, 116, 139] as const;
const BORDER = [226, 232, 240] as const;
const ROTR_RED = [220, 38, 38] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}

function fmtPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function fmtWatchTime(minutes: number): string {
  if (minutes >= 60) return `${(minutes / 60).toFixed(1)} hours`;
  return `${Math.round(minutes)} min`;
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

export async function generateAnalyticsPdf(options: PdfOptions): Promise<void> {
  const { profile, periodLabel, summary, crossPlatform, web, facebook, youtube, email, events } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const profileName = profile === 'rotr' ? "Rockin' on the River" : 'Lorain Port & Finance Authority';
  const logoUrl = profile === 'rotr' ? '/images/rotr-logo.png' : '/images/logo.png';
  const now = new Date();
  const ACCENT: readonly [number, number, number] = profile === 'rotr' ? ROTR_RED : GOLD;

  // ─── Page utilities ──────────────────────────────────────────────

  function addFooter() {
    const pageNum = doc.getNumberOfPages();
    const footerY = pageHeight - 14;

    // Thin accent line
    doc.setFillColor(...ACCENT);
    doc.rect(margin, footerY, contentWidth, 0.5, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MED);
    doc.text(`Confidential  |  ${profileName}`, margin, footerY + 4);
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

    // Thin colored left accent
    doc.setFillColor(...color);
    doc.rect(margin, y, 3, 7, 'F');

    // Title text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title.toUpperCase(), margin + 7, y + 5.2);

    // Light underline
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

      // Card border
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.2);
      doc.setFillColor(...WHITE);
      doc.roundedRect(x, y, cardW, cardH, cornerR, cornerR, 'FD');

      // Thin colored top accent
      doc.setFillColor(...itemColor);
      doc.roundedRect(x, y, cardW, accentH + cornerR, cornerR, cornerR, 'F');
      doc.setFillColor(...WHITE);
      doc.rect(x, y + accentH, cardW, cornerR, 'F');

      // Value
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(metrics[i].color || NAVY));
      doc.text(metrics[i].value, x + cardW / 2, y + accentH + 9, { align: 'center' });

      // Label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MED);
      doc.text(metrics[i].label.toUpperCase(), x + cardW / 2, y + accentH + 15, { align: 'center' });
    }

    y += cardH + 4;
  }

  // ═══════════════════════════════════════════════════════════════════
  // HEADER — Clean white with accent line
  // ═══════════════════════════════════════════════════════════════════

  // Logo on white background
  const logoBase64 = await loadImageCompressed(logoUrl, 200, 200, WHITE);
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', margin, 8, 28, 28);
    } catch { /* continue without logo */ }
  }

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('Analytics Report', pageWidth - margin, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MED);
  doc.text(profileName, pageWidth - margin, 26, { align: 'right' });

  // Accent line under header
  doc.setFillColor(...ACCENT);
  doc.rect(margin, 40, contentWidth, 1.5, 'F');

  y = 48;

  // Period and date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Report Period: ${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}`, margin, y);

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
    // AI badge + trend badge
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

    // Summary title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('Executive Summary', margin, y);
    y += 7;

    // Paragraphs
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

    // Highlights
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

        // Small accent bar
        doc.setFillColor(...ACCENT);
        doc.roundedRect(margin, y, 1.5, lineH + 0.5, 0.5, 0.5, 'F');
        doc.text(lines, margin + 5, y + 1);
        y += lineH + 4;
      }
      y += 2;
    }

    // Thin divider after summary
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DATA SECTIONS
  // ═══════════════════════════════════════════════════════════════════

  drawSectionHeader('Cross-Platform Summary', NAVY);
  drawMetricCards([
    { label: 'Total Reach', value: fmtCompact(crossPlatform.totalReach) },
    { label: 'Total Audience', value: fmtCompact(crossPlatform.totalAudience) },
    { label: 'Total Engagements', value: fmtCompact(crossPlatform.totalEngagements) },
    { label: 'Total Video Views', value: fmtCompact(crossPlatform.totalVideoViews) },
  ], NAVY);

  drawSectionDivider();

  if (web) {
    drawSectionHeader(
      profile === 'lpfa' ? 'Website - Google Analytics' : 'Website - Wix Analytics',
      BLUE
    );
    const webMetrics: { label: string; value: string }[] = [
      { label: 'Sessions', value: fmt(web.sessions) },
      { label: 'Users', value: fmt(web.users) },
      { label: 'Pageviews', value: fmt(web.pageviews) },
    ];
    if (web.bounceRate != null) {
      webMetrics.push({ label: 'Bounce Rate', value: fmtPercent(web.bounceRate) });
    }
    drawMetricCards(webMetrics, BLUE);

    // Top pages
    if (web.topPages && web.topPages.length > 0) {
      const pages = web.topPages.slice(0, 8);
      const rowH = 5.5;
      const headerH = 6;

      checkPageBreak(headerH + Math.min(pages.length, 3) * rowH + 8);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEXT_DARK);
      doc.text('Top Pages', margin, y);
      y += 4;

      function drawTopPagesHeader() {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, headerH, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...TEXT_MED);
        doc.text('PAGE', margin + 3, y + 4);
        doc.text('VIEWS', pageWidth - margin - 3, y + 4, { align: 'right' });
        y += headerH;
      }

      drawTopPagesHeader();

      pages.forEach((page, i) => {
        const pageBefore = doc.getNumberOfPages();
        checkPageBreak(rowH + 2);
        if (doc.getNumberOfPages() > pageBefore) drawTopPagesHeader();

        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, contentWidth, rowH, 'F');
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...TEXT_DARK);
        doc.text(sanitize((page.title || page.path).substring(0, 60)), margin + 3, y + 3.8);
        doc.text(fmt(page.pageviews), pageWidth - margin - 3, y + 3.8, { align: 'right' });
        y += rowH;
      });
      y += 4;
    }

    drawSectionDivider();
  }

  if (facebook) {
    const FB_BLUE = [24, 119, 242] as const;
    drawSectionHeader('Facebook', FB_BLUE);
    drawMetricCards([
      { label: 'Followers', value: fmtCompact(facebook.followers) },
      { label: 'Impressions', value: fmtCompact(facebook.impressions) },
      { label: 'Engagements', value: fmtCompact(facebook.engagements) },
      { label: 'Video Views', value: fmtCompact(facebook.videoViews) },
    ], FB_BLUE);

    if (facebook.reactions) {
      const rx = facebook.reactions;
      const reactionList = [
        { label: 'Like', value: rx.like || 0 },
        { label: 'Love', value: rx.love || 0 },
        { label: 'Wow', value: rx.wow || 0 },
        { label: 'Haha', value: rx.haha || 0 },
        { label: 'Sorry', value: rx.sorry || 0 },
        { label: 'Anger', value: rx.anger || 0 },
      ].filter(r => r.value > 0);

      if (reactionList.length > 0) {
        checkPageBreak(8);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...TEXT_MED);
        doc.text('Reactions: ' + reactionList.map(r => `${r.label}: ${fmtCompact(r.value)}`).join('  |  '), margin, y);
        y += 5;
      }
    }

    drawSectionDivider();
  }

  if (youtube && profile === 'lpfa') {
    const YT_RED = [255, 0, 0] as const;
    drawSectionHeader('YouTube', YT_RED);
    drawMetricCards([
      { label: 'Subscribers', value: fmtCompact(youtube.subscribers) },
      { label: 'Total Views', value: fmtCompact(youtube.views) },
      { label: 'Watch Time', value: fmtWatchTime(youtube.watchMinutes) },
      { label: 'Videos', value: fmt(youtube.videos) },
    ], YT_RED);

    checkPageBreak(8);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MED);
    doc.text(`Likes: ${fmtCompact(youtube.likes)}  |  Comments: ${fmtCompact(youtube.comments)}`, margin, y);
    y += 5;

    drawSectionDivider();
  }

  if (email) {
    drawSectionHeader('Email Marketing - Constant Contact', GOLD);
    drawMetricCards([
      { label: 'Campaigns', value: fmt(email.campaigns) },
      { label: 'Sends', value: fmtCompact(email.sends) },
      { label: 'Opens', value: fmtCompact(email.opens) },
      { label: 'Clicks', value: fmtCompact(email.clicks) },
    ], GOLD);

    checkPageBreak(8);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MED);
    doc.text(`Total Contacts: ${fmtCompact(email.contacts)}`, margin, y);
    y += 5;

    drawSectionDivider();
  }

  if (events && profile === 'rotr') {
    const PURPLE = [124, 58, 237] as const;
    drawSectionHeader('Events & Ticket Sales', PURPLE);
    drawMetricCards([
      { label: 'Total Events', value: fmt(events.totalEvents) },
      { label: 'Tickets Sold', value: fmtCompact(events.totalTickets) },
      { label: 'Revenue', value: `$${fmtCompact(events.totalRevenue)}` },
    ], PURPLE);
  }

  // ─── Data Sources ─────────────────────────────────────────────────

  checkPageBreak(22);
  y += 4;

  const sources = [
    profile === 'lpfa' ? 'Google Analytics' : 'Wix Analytics',
    'Facebook (via Ayrshare)',
    profile === 'lpfa' ? 'YouTube (via Ayrshare)' : null,
    'Constant Contact',
    profile === 'rotr' ? 'Wix Events' : null,
  ].filter(Boolean).join(', ');

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
  doc.text(sources, margin + 4, y + 9);
  doc.text('Social media ~24h delay. Web analytics ~48h delay.', margin + 4, y + 13);

  y += 20;
  addFooter();

  // ─── Save ──────────────────────────────────────────────────────────

  const dateStr = now.toISOString().slice(0, 10);
  const prefix = profile === 'rotr' ? 'ROTR' : 'LPFA';
  doc.save(`${prefix}-Analytics-Report-${dateStr}.pdf`);
}
