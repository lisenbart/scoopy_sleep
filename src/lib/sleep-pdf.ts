import { jsPDF } from "jspdf";
import type { SleepFullPlan } from "@/types/sleep";

// Scoopy Log PDF design tokens (aligned with app export)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: [90, 141, 190] as [number, number, number], // #5A8DBE
  secondary: [91, 107, 125] as [number, number, number], // #5B6B7D
  tertiary: [139, 153, 171] as [number, number, number], // #8B99AB
  border: [237, 237, 237] as [number, number, number], // #EDEDED
  cardBg: [248, 250, 251] as [number, number, number], // #F8FAFB
};

const FONT = {
  title: 20,
  section: 16,
  body: 11,
  small: 9,
  lineHeight: 5.5,
  lineHeightTight: 4.5,
};

function setColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number = FONT.lineHeight): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSection(
  doc: jsPDF,
  y: number,
  title: string,
  body: string
): number {
  let currentY = y;
  doc.setFontSize(FONT.section);
  setColor(doc, COLORS.primary);
  doc.text(title, MARGIN, currentY);
  currentY += FONT.lineHeight + 2;
  doc.setFontSize(FONT.body);
  setColor(doc, COLORS.secondary);
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  for (const p of paragraphs) {
    const bulletLines = p.split("\n").filter(Boolean);
    for (const line of bulletLines) {
      const trimmed = line.replace(/^[\s•\-*]+\s*/, "");
      currentY = wrapText(doc, trimmed, MARGIN, currentY, TEXT_WIDTH) + 2;
      if (currentY > PAGE_HEIGHT - MARGIN - 25) {
        doc.addPage();
        currentY = MARGIN;
      }
    }
    currentY += 3;
  }
  return currentY + 8;
}

function drawFooter(doc: jsPDF, pageNum?: number, totalPages?: number) {
  const footerY = PAGE_HEIGHT - 14;
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.line(MARGIN, footerY - 4, PAGE_WIDTH - MARGIN, footerY - 4);
  doc.setFontSize(FONT.small);
  setColor(doc, COLORS.primary);
  doc.text("Scoopy Log", MARGIN, footerY + 2);
  setColor(doc, COLORS.tertiary);
  doc.setFontSize(8);
  doc.text("SmartBabies™", MARGIN + 22, footerY + 2);
  if (totalPages != null && totalPages > 0 && pageNum != null) {
    setColor(doc, COLORS.primary);
    doc.setFontSize(FONT.small);
    doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN, footerY + 2, { align: "right" });
  }
}

/** Builds the PDF document (shared by client save and server buffer). */
function buildSleepPlanPdfDocument(doc: jsPDF, plan: SleepFullPlan): void {
  let y = MARGIN;

  // Header / title
  doc.setFontSize(FONT.title);
  setColor(doc, COLORS.primary);
  doc.text("Your 7-Day Sleep Plan", MARGIN, y);
  y += FONT.lineHeight * 2 + 6;

  if (plan.summary) {
    doc.setFontSize(FONT.section);
    doc.text("Summary", MARGIN, y);
    y += FONT.lineHeight + 2;
    doc.setFontSize(FONT.body);
    setColor(doc, COLORS.secondary);
    y = wrapText(doc, plan.summary, MARGIN, y, TEXT_WIDTH) + 8;
  }

  doc.setFontSize(FONT.section);
  setColor(doc, COLORS.primary);
  doc.text("Detailed Day Schedule", MARGIN, y);
  y += FONT.lineHeight + 4;
  doc.setFontSize(FONT.body);
  setColor(doc, COLORS.secondary);

  for (const d of plan.days) {
    if (y > PAGE_HEIGHT - MARGIN - 45) {
      doc.addPage();
      y = MARGIN;
    }
    // Day card (light background strip)
    doc.setFillColor(COLORS.cardBg[0], COLORS.cardBg[1], COLORS.cardBg[2]);
    doc.roundedRect(MARGIN, y - 3, TEXT_WIDTH, 22, 3, 3, "F");
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.roundedRect(MARGIN, y - 3, TEXT_WIDTH, 22, 3, 3, "S");
    doc.setFontSize(FONT.body + 1);
    setColor(doc, COLORS.primary);
    doc.text(`Day ${d.day}`, MARGIN + 4, y + 4);
    doc.setFontSize(FONT.body);
    setColor(doc, COLORS.secondary);
    doc.text(`Wake: ${d.wakeTime}   ·   Bedtime: ${d.bedtime}`, MARGIN + 4, y + 10);
    if (d.naps.length > 0) {
      const napStr = d.naps.map((n) => `${n.start}–${n.end}`).join(", ");
      doc.text(`Naps: ${napStr}`, MARGIN + 4, y + 16);
    }
    if (d.notes) {
      doc.setFontSize(FONT.small);
      setColor(doc, COLORS.tertiary);
      doc.text(d.notes, MARGIN + 4, y + 21);
    }
    y += 26;
  }

  y += 6;
  if (plan.adjustmentPlan) {
    if (y > PAGE_HEIGHT - MARGIN - 35) {
      doc.addPage();
      y = MARGIN;
    }
    y = addSection(doc, y, "7-Day Adjustment Plan", plan.adjustmentPlan);
  }

  if (plan.troubleshooting) {
    if (y > PAGE_HEIGHT - MARGIN - 35) {
      doc.addPage();
      y = MARGIN;
    }
    y = addSection(doc, y, "Troubleshooting", plan.troubleshooting);
  }

  if (plan.optimizationTips) {
    if (y > PAGE_HEIGHT - MARGIN - 35) {
      doc.addPage();
      y = MARGIN;
    }
    y = addSection(doc, y, "Optimization Tips", plan.optimizationTips);
  }

  if (y > PAGE_HEIGHT - MARGIN - 30) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFontSize(FONT.section);
  setColor(doc, COLORS.primary);
  doc.text("Disclaimer", MARGIN, y);
  y += FONT.lineHeight + 2;
  doc.setFontSize(FONT.small);
  setColor(doc, COLORS.tertiary);
  const disclaimer =
    "This plan is for informational purposes only and is not medical advice. " +
    "Consult your pediatrician or healthcare provider for advice specific to your baby. " +
    "Sleep needs vary; use this as a general guide and adjust to what works for your family.";
  wrapText(doc, disclaimer, MARGIN, y, TEXT_WIDTH, FONT.lineHeightTight);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }
}

/** Client: generate and download PDF. */
export function generateSleepPlanPdf(plan: SleepFullPlan): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  buildSleepPlanPdfDocument(doc, plan);
  doc.save("scoopy-log-sleep-plan.pdf");
}

/** Server: generate PDF and return as Buffer (for email attachment). */
export function generateSleepPlanPdfBuffer(plan: SleepFullPlan): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  buildSleepPlanPdfDocument(doc, plan);
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
