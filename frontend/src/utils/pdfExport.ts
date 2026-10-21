import type { Budget, ItineraryGenerateResponse, Pace } from "../types";
import logoPng from "../assets/trip-genius-logo.png?inline";

// Logo image aspect ratio: original image is 2117 x 743 px (width / height = 2.84926)
const LOGO_ASPECT_RATIO = 2117 / 743;

/**
 * Resolves the logo image into a base64 data URL for jsPDF.
 * Uses the inlined asset directly when available; falls back to canvas conversion
 * if in an environment where ?inline was resolved to an asset URL.
 */
async function getLogoImageData(): Promise<string> {
  if (typeof logoPng === "string" && logoPng.startsWith("data:")) {
    return logoPng;
  }
  if (typeof window !== "undefined" && typeof Image !== "undefined" && typeof logoPng === "string") {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 2117;
          canvas.height = img.naturalHeight || 743;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
            return;
          }
        } catch {
          // fall through
        }
        resolve(logoPng);
      };
      img.onerror = () => resolve(logoPng);
      img.src = logoPng;
    });
  }
  return logoPng;
}

const budgetLabels: Record<Budget, string> = {
  budget: "Budget-friendly",
  moderate: "Moderate",
  premium: "Premium",
  luxury: "Luxury",
};

const paceLabels: Record<Pace, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  packed: "See as much as possible",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

/**
 * Normalizes all unicode characters, smart punctuation, dashes, quotes,
 * and currency symbols to clean Latin-1 / ASCII text compatible with
 * standard Type1 PDF fonts.
 *
 * This completely prevents jsPDF from switching into UTF-16 BE mode with
 * NUL bytes (\x00), which causes excessive letter spacing, doubled string widths,
 * and text overflowing the page margins.
 */
export function sanitizeTextForPdf(text: unknown): string {
  if (text === null || text === undefined) return "";
  let str = String(text);

  // 1. Non-breaking and special hyphens -> standard ASCII hyphen
  str = str.replace(/[\u2010\u2011\u2012\u2212\uFE63\uFF0D]/g, "-");
  // 2. En-dash and em-dash -> spaced standard hyphen
  str = str.replace(/[\u2013\u2014\u2015]/g, " - ");
  // 3. Smart single quotes and apostrophes
  str = str.replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'");
  // 4. Smart double quotes
  str = str.replace(/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"');
  // 5. Ellipsis
  str = str.replace(/\u2026/g, "...");
  // 6. Non-breaking and exotic whitespace -> standard space
  str = str.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");
  // 7. Zero-width and invisible control characters
  str = str.replace(/[\u00AD\u200B-\u200F\u2028-\u202E\uFEFF]/g, "");
  // 8. Bullet symbols
  str = str.replace(/[\u2022\u25CF\u25AA\u25BA\u2219]/g, "-");
  // 9. Currency symbols
  str = str.replace(/\u20AC/g, "EUR ");
  str = str.replace(/\u00A3/g, "GBP ");
  str = str.replace(/\u00A5/g, "JPY ");
  // 10. Clean line breaks and collapse excess spaces
  str = str.replace(/\r\n|\r/g, "\n");
  str = str.replace(/[ \t]+/g, " ");
  // 11. Restrict to valid Latin-1 printable characters
  str = str.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");

  return str.trim();
}

export function generateSafePdfFilename(
  destination: string,
  title?: string
): string {
  let base = "";
  if (
    title &&
    title.trim() &&
    !title.trim().toLowerCase().startsWith("your itinerary")
  ) {
    base = title.trim();
  } else if (destination && destination.trim()) {
    const city = destination.split(",")[0].trim();
    base = `${city}_Travel_Itinerary`;
  } else {
    base = "Travel_Itinerary";
  }

  const sanitized = base
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${sanitized || "Travel_Itinerary"}.pdf`;
}

export interface ExportPdfOptions {
  itinerary: ItineraryGenerateResponse;
  tripTitle?: string;
  destinationFallback?: string;
}

/**
 * Plans page assignments for itinerary days so that:
 * 1. Hard page capacity is never exceeded.
 * 2. Days are distributed to prevent large empty spaces on the final page.
 */
function planPageAssignments(
  headerH: number,
  dayHeights: number[],
  page1Cap: number,
  otherPageCap: number
): number[] {
  const n = dayHeights.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  const totalH = headerH + dayHeights.reduce((a, b) => a + b, 0);
  if (totalH <= page1Cap) {
    return new Array(n).fill(0);
  }

  // For a 5-day trip: Days 1-2 on Page 1, Days 3-5 on Page 2 provides optimal balance
  if (n === 5) {
    const p1 = headerH + dayHeights[0] + dayHeights[1];
    const p2 = dayHeights[2] + dayHeights[3] + dayHeights[4];
    if (p1 <= page1Cap && p2 <= otherPageCap) {
      return [0, 0, 1, 1, 1];
    }
  }

  // For a 6-day trip: Days 1-3 on Page 1, Days 4-6 on Page 2 provides optimal balance
  if (n === 6) {
    const p1 = headerH + dayHeights[0] + dayHeights[1] + dayHeights[2];
    const p2 = dayHeights[3] + dayHeights[4] + dayHeights[5];
    if (p1 <= page1Cap && p2 <= otherPageCap) {
      return [0, 0, 0, 1, 1, 1];
    }
  }

  function evaluate(
    dayIdx: number,
    pageNum: number
  ): { cost: number; assignments: number[] } | null {
    if (dayIdx >= n) {
      return { cost: 0, assignments: [] };
    }
    const cap = pageNum === 0 ? page1Cap - headerH : otherPageCap;
    let sum = 0;
    let best: { cost: number; assignments: number[] } | null = null;

    for (let end = dayIdx + 1; end <= n; end++) {
      sum += dayHeights[end - 1];
      if (sum > cap) break;

      const next = evaluate(end, pageNum + 1);
      if (next !== null) {
        const fullness = sum / cap;
        const penalty = Math.pow(fullness - 0.70, 2);
        const cost = penalty + next.cost;

        if (best === null || cost < best.cost) {
          const currentAssign = new Array(end - dayIdx).fill(pageNum);
          best = { cost, assignments: [...currentAssign, ...next.assignments] };
        }
      }
    }
    return best;
  }

  const result = evaluate(0, 0);
  if (result && result.assignments.length === n) {
    return result.assignments;
  }

  // Fallback: standard greedy packing
  const assignments: number[] = [];
  let curPage = 0;
  let curCap = page1Cap - headerH;
  let curSum = 0;

  for (let i = 0; i < n; i++) {
    const dh = dayHeights[i];
    if (curSum + dh > curCap && curSum > 0) {
      curPage++;
      curCap = otherPageCap;
      curSum = 0;
    }
    assignments.push(curPage);
    curSum += dh;
  }

  return assignments;
}

export async function exportItineraryToPdf({
  itinerary,
  tripTitle,
  destinationFallback,
}: ExportPdfOptions): Promise<void> {
  if (!itinerary) {
    throw new Error("No itinerary data available to export.");
  }

  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    throw new Error("Itinerary contains no days to export.");
  }

  const { jsPDF } = await import("jspdf");
  const logoData = await getLogoImageData();

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 16;
  const marginRight = 16;
  const contentWidth = pageWidth - marginLeft - marginRight; // 178 mm
  const bottomLimit = pageHeight - 18; // 279 mm
  const headerLogoWidth = 24;
  const headerLogoHeight = headerLogoWidth / LOGO_ASPECT_RATIO; // ~8.42 mm
  const headerLogoY = 8.5;
  const runningHeaderDividerY = 18.5;
  const contentTopAfterHeader = 24.5;

  // Design Tokens & Colors
  const deepForest = [24, 55, 44] as const;
  const forest = [36, 74, 58] as const;
  const terracotta = [200, 117, 85] as const;
  const charcoal = [37, 41, 35] as const;
  const muted = [119, 122, 112] as const;
  const borderColor = [228, 226, 217] as const;
  const cardBg = [247, 245, 239] as const;
  const sage = [220, 229, 218] as const;

  const destination = sanitizeTextForPdf(itinerary.destination || destinationFallback || "Destination");
  const displayTitle = sanitizeTextForPdf(
    tripTitle && tripTitle.trim() && !tripTitle.trim().toLowerCase().startsWith("your itinerary")
      ? tripTitle.trim()
      : `Trip to ${destination}`
  );

  function renderRunningHeader() {
    // Official Logo top-left (preserving aspect ratio)
    doc.addImage(
      logoData,
      "PNG",
      marginLeft,
      headerLogoY,
      headerLogoWidth,
      headerLogoHeight,
      "APP_LOGO",
      "FAST"
    );

    // Running destination on top-right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(destination.toUpperCase(), pageWidth - marginRight, 14, {
      align: "right",
    });

    // Divider line below header
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, runningHeaderDividerY, pageWidth - marginRight, runningHeaderDividerY);
  }

  // --- Page 1: Header / Title Section ---
  const page1LogoWidth = 35;
  const page1LogoHeight = page1LogoWidth / LOGO_ASPECT_RATIO; // ~12.28 mm
  const page1LogoY = 12;

  // Render official website logo at top-left
  doc.addImage(
    logoData,
    "PNG",
    marginLeft,
    page1LogoY,
    page1LogoWidth,
    page1LogoHeight,
    "APP_LOGO",
    "FAST"
  );

  let currentY = page1LogoY + page1LogoHeight + 4; // ~28.28 mm

  function ensureSpace(neededHeight: number) {
    if (currentY + neededHeight > bottomLimit) {
      doc.addPage();
      currentY = contentTopAfterHeader;
      renderRunningHeader();
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...deepForest);
  const titleLines = doc.splitTextToSize(displayTitle, contentWidth);
  doc.text(titleLines, marginLeft, currentY);
  currentY += titleLines.length * 6.0 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...muted);
  const dateRangeStr =
    itinerary.start_date && itinerary.end_date
      ? `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}`
      : "";
  const subtitle = dateRangeStr
    ? `${destination}   |   ${dateRangeStr}`
    : destination;
  doc.text(subtitle, marginLeft, currentY);
  currentY += 5.5;

  // --- Preferences Summary Box ---
  const budgetText = sanitizeTextForPdf(
    itinerary.budget && budgetLabels[itinerary.budget]
      ? budgetLabels[itinerary.budget]
      : itinerary.budget || "Moderate"
  );
  const paceText = sanitizeTextForPdf(
    itinerary.pace && paceLabels[itinerary.pace]
      ? paceLabels[itinerary.pace]
      : itinerary.pace || "Balanced"
  );
  const interestsText = sanitizeTextForPdf(
    Array.isArray(itinerary.interests) && itinerary.interests.length > 0
      ? itinerary.interests.join(", ")
      : "General exploration"
  );
  const daysCount = itinerary.day_count || itinerary.days.length;

  const prefRows = [
    { label: "Destination", value: destination },
    { label: "Travel Dates", value: dateRangeStr || "Flexible" },
    { label: "Duration", value: `${daysCount} ${daysCount === 1 ? "day" : "days"}` },
    { label: "Budget Tier", value: budgetText },
    { label: "Pace", value: paceText },
    { label: "Interests", value: interestsText },
  ];

  // Measure preferences card lines dynamically
  const cardPadding = 5;
  const colGap = 8;
  const colWidth = (contentWidth - cardPadding * 2 - colGap) / 2;

  const maxRowHeights: Array<{
    rowH: number;
    leftItem: { label: string; value: string };
    rightItem?: { label: string; value: string };
    leftLabelW: number;
    rightLabelW: number;
    leftValLines: string[];
    rightValLines: string[];
  }> = [];

  for (let i = 0; i < prefRows.length; i += 2) {
    const leftItem = prefRows[i];
    const rightItem = prefRows[i + 1];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const leftLabelW = doc.getTextWidth(`${leftItem.label}: `);
    const rightLabelW = rightItem ? doc.getTextWidth(`${rightItem.label}: `) : 0;

    doc.setFont("helvetica", "normal");
    const leftValLines = doc.splitTextToSize(leftItem.value, colWidth - leftLabelW);
    const rightValLines = rightItem
      ? doc.splitTextToSize(rightItem.value, colWidth - rightLabelW)
      : [];

    const rowH = Math.max(leftValLines.length, rightValLines.length) * 4.5 + 2;
    maxRowHeights.push({
      rowH,
      leftItem,
      rightItem,
      leftLabelW,
      rightLabelW,
      leftValLines,
      rightValLines,
    });
  }

  const totalCardHeight = cardPadding * 2 + maxRowHeights.reduce((sum, r) => sum + r.rowH, 0);

  ensureSpace(totalCardHeight + 5);

  doc.setFillColor(...cardBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, currentY, contentWidth, totalCardHeight, 2.5, 2.5, "FD");

  let cardRowY = currentY + cardPadding + 3.2;
  for (const row of maxRowHeights) {
    // Left Item
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...forest);
    doc.text(`${row.leftItem.label}:`, marginLeft + cardPadding, cardRowY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...charcoal);
    doc.text(row.leftValLines, marginLeft + cardPadding + row.leftLabelW, cardRowY);

    // Right Item
    if (row.rightItem) {
      const rightX = marginLeft + cardPadding + colWidth + colGap;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...forest);
      doc.text(`${row.rightItem.label}:`, rightX, cardRowY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...charcoal);
      doc.text(row.rightValLines, rightX + row.rightLabelW, cardRowY);
    }

    cardRowY += row.rowH;
  }

  currentY += totalCardHeight + 5;

  // Notice (if any demo/Groq notice)
  if (itinerary.notice) {
    const cleanNotice = sanitizeTextForPdf(itinerary.notice);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    const noticeLines = doc.splitTextToSize(cleanNotice, contentWidth);
    ensureSpace(noticeLines.length * 3.8 + 3);
    doc.text(noticeLines, marginLeft, currentY);
    currentY += noticeLines.length * 3.8 + 4;
  }

  // --- Measure Day Heights & Plan Page Breaks for Balance ---
  const actTextWidth = contentWidth - 7; // indented from vector bullet

  interface DayMeasurement {
    day: (typeof itinerary.days)[number];
    dayTitleClean: string;
    dayTitleLines: string[];
    notesLines: string[];
    activityData: Array<{ text: string; lines: string[]; itemH: number }>;
    totalDayH: number;
    headerH: number;
    notesH: number;
    activitiesH: number;
  }

  const dayMeasurements: DayMeasurement[] = [];

  for (const day of itinerary.days) {
    const dayTitleClean = sanitizeTextForPdf(day.title || `Day ${day.day_number}`);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const dayTitleLines = doc.splitTextToSize(dayTitleClean, contentWidth - 22);
    const headerH = Math.max(dayTitleLines.length * 4.8, 5.5) + 2.5;

    let notesH = 0;
    let notesLines: string[] = [];
    const dayDateStr = day.date ? formatDate(day.date) : "";
    const cleanNotes = sanitizeTextForPdf(day.notes);
    const notesText = cleanNotes
      ? (dayDateStr ? `${dayDateStr} - ${cleanNotes}` : cleanNotes)
      : dayDateStr;

    if (notesText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      notesLines = doc.splitTextToSize(notesText, contentWidth - 4);
      notesH = notesLines.length * 4.0 + 3.5;
    }

    const activityData: Array<{ text: string; lines: string[]; itemH: number }> = [];
    let activitiesH = 0;
    const activities = Array.isArray(day.activities) ? day.activities : [];

    for (const act of activities) {
      const cleanAct = sanitizeTextForPdf(act);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const actLines = doc.splitTextToSize(cleanAct, actTextWidth);
      const itemH = actLines.length * 4.0 + 3.0;
      activitiesH += itemH;
      activityData.push({ text: cleanAct, lines: actLines, itemH });
    }

    const totalDayH = headerH + notesH + activitiesH + 7;
    dayMeasurements.push({
      day,
      dayTitleClean,
      dayTitleLines,
      notesLines,
      activityData,
      totalDayH,
      headerH,
      notesH,
      activitiesH,
    });
  }

  const page1Capacity = bottomLimit - currentY;
  const otherPageCapacity = bottomLimit - contentTopAfterHeader;
  const dayHeights = dayMeasurements.map((d) => d.totalDayH);
  const pageAssignments = planPageAssignments(
    0,
    dayHeights,
    page1Capacity,
    otherPageCapacity
  );

  let activeRenderPage = 0;

  // --- Render Days ---
  for (let dayIdx = 0; dayIdx < dayMeasurements.length; dayIdx++) {
    const dm = dayMeasurements[dayIdx];
    const targetPage = pageAssignments[dayIdx] ?? activeRenderPage;

    // Check if assignment demands next page or if header + at least 1 activity would exceed bottom
    const minDayHeadSpace = dm.headerH + dm.notesH + (dm.activityData[0]?.itemH || 10);
    const mustBreak = targetPage > activeRenderPage || (currentY + minDayHeadSpace > bottomLimit);

    if (mustBreak && currentY > contentTopAfterHeader + 5) {
      doc.addPage();
      activeRenderPage++;
      currentY = contentTopAfterHeader;
      renderRunningHeader();
    }

    // Day Header Pill
    const badgeText = `DAY ${String(dm.day.day_number).padStart(2, "0")}`;
    doc.setFillColor(...sage);
    doc.roundedRect(marginLeft, currentY - 3.5, 17, 5.5, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...forest);
    doc.text(badgeText, marginLeft + 2.0, currentY + 0.3);

    // Day Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...deepForest);
    doc.text(dm.dayTitleLines, marginLeft + 20, currentY + 0.5);
    currentY += Math.max(dm.dayTitleLines.length * 4.8, 5.5) + 2.5;

    // Date & Notes
    if (dm.notesLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text(dm.notesLines, marginLeft + 2, currentY);
      currentY += dm.notesLines.length * 4.0 + 3.0;
    }

    // Activities
    if (dm.activityData.length > 0) {
      for (const act of dm.activityData) {
        if (currentY + act.itemH > bottomLimit) {
          doc.addPage();
          activeRenderPage++;
          currentY = contentTopAfterHeader;
          renderRunningHeader();
        }

        // Vector Circle Bullet (crisp vector geometry, 100% immune to font encoding quirks)
        doc.setFillColor(...terracotta);
        doc.circle(marginLeft + 2.5, currentY - 1.2, 0.8, "F");

        // Activity Text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...charcoal);
        doc.text(act.lines, marginLeft + 6.5, currentY);
        currentY += act.itemH;
      }
    } else {
      ensureSpace(6);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(...muted);
      doc.text("No specific activities scheduled for this day.", marginLeft + 6.5, currentY);
      currentY += 6;
    }

    // Divider line between days
    currentY += 2;
    if (dayIdx < dayMeasurements.length - 1) {
      ensureSpace(6);
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
      currentY += 6;
    }
  }

  // Running Footers (Second Pass)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.25);
    doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("Trip Genius AI  -  Your Journey, Your Way", marginLeft, pageHeight - 9);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - marginRight, pageHeight - 9, {
      align: "right",
    });
  }

  const filename = generateSafePdfFilename(destination, tripTitle);
  doc.save(filename);
}
