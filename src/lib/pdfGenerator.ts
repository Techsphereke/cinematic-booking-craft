import jsPDF from "jspdf";

interface Booking {
  id: string;
  booking_ref: string;
  full_name: string;
  email: string;
  phone: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  estimated_total: number;
  deposit_amount: number;
  remaining_balance: number;
  special_notes?: string | null;
  services?: { name: string } | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const BRAND = {
  gold: [212, 175, 55] as [number, number, number],
  goldLight: [232, 210, 120] as [number, number, number],
  dark: [12, 12, 12] as [number, number, number],
  darkMid: [28, 28, 28] as [number, number, number],
  charcoal: [45, 45, 45] as [number, number, number],
  lightGray: [220, 220, 220] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  textMuted: [150, 150, 150] as [number, number, number],
};

function hex(doc: jsPDF, r: number, g: number, b: number) {
  doc.setTextColor(r, g, b);
}
function fill(doc: jsPDF, r: number, g: number, b: number) {
  doc.setFillColor(r, g, b);
}
function stroke(doc: jsPDF, r: number, g: number, b: number) {
  doc.setDrawColor(r, g, b);
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

function formatTime(t: string) {
  try {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  } catch {
    return t;
  }
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    pending_deposit: "Pending Deposit",
    deposit_paid: "Deposit Paid",
    fully_paid: "Fully Paid",
    cancelled: "Cancelled",
    completed: "Completed",
  };
  return map[s] || s;
}

// Draw a decorative gold rule line
function goldRule(doc: jsPDF, y: number, marginX = 20, width = 170) {
  stroke(doc, ...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, marginX + width, y);
}

// Draw a thin separator
function thinRule(doc: jsPDF, y: number, marginX = 20, width = 170) {
  stroke(doc, 60, 60, 60);
  doc.setLineWidth(0.2);
  doc.line(marginX, y, marginX + width, y);
}

// ─────────────────────────────────────────────
// BOOKING CONFIRMATION PDF
// ─────────────────────────────────────────────
export function generateBookingPDF(booking: Booking): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── Background
  fill(doc, ...BRAND.dark);
  doc.rect(0, 0, W, H, "F");

  // ── Hero stripe
  fill(doc, ...BRAND.darkMid);
  doc.rect(0, 0, W, 58, "F");

  // ── Gold accent bar (left edge)
  fill(doc, ...BRAND.gold);
  doc.rect(0, 0, 5, 58, "F");

  // ── Gold accent bar bottom of hero
  fill(doc, ...BRAND.gold);
  doc.rect(0, 56, W, 2, "F");

  // ── Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  hex(doc, ...BRAND.gold);
  doc.text("JT STUDIOS", 14, 22);

  // ── Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text("EVENTS · PHOTOGRAPHY · VIDEOGRAPHY · HOSTING", 14, 29);

  // ── Doc type
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  hex(doc, ...BRAND.white);
  doc.text("BOOKING CONFIRMATION", 14, 44);

  // ── Booking ref top-right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  hex(doc, ...BRAND.gold);
  doc.text(`Ref: ${booking.booking_ref}`, W - 14, 20, { align: "right" });
  doc.setFontSize(8);
  hex(doc, ...BRAND.textMuted);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, W - 14, 27, { align: "right" });

  let y = 72;

  // ── Status pill
  const sColor = booking.status === "deposit_paid" || booking.status === "fully_paid" || booking.status === "completed"
    ? ([26, 90, 50] as [number, number, number])
    : booking.status === "cancelled"
    ? ([90, 20, 20] as [number, number, number])
    : ([80, 60, 10] as [number, number, number]);
  fill(doc, ...sColor);
  stroke(doc, ...BRAND.gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(W - 14 - 42, y - 8, 42, 10, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  hex(doc, ...BRAND.gold);
  doc.text(statusLabel(booking.status).toUpperCase(), W - 14 - 21, y - 1.5, { align: "center" });

  // ── CLIENT INFO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("CLIENT DETAILS", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  const clientFields = [
    ["Full Name", booking.full_name],
    ["Email Address", booking.email],
    ["Phone Number", booking.phone],
  ];
  clientFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    hex(doc, ...BRAND.textMuted);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    hex(doc, ...BRAND.lightGray);
    doc.text(value, 65, y);
    y += 8;
  });

  y += 4;

  // ── EVENT DETAILS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("EVENT DETAILS", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  const eventFields = [
    ["Event Type", booking.event_type],
    ["Service", booking.services?.name || "—"],
    ["Date", formatDate(booking.event_date)],
    ["Time", `${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`],
    ["Venue / Location", booking.location],
  ];

  // Two-column grid layout
  let col = 0;
  let rowStartY = y;
  eventFields.forEach(([label, value], i) => {
    const xOffset = col === 0 ? 20 : 110;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    hex(doc, ...BRAND.textMuted);
    doc.text(label.toUpperCase(), xOffset, rowStartY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    hex(doc, ...BRAND.white);
    const wrapped = doc.splitTextToSize(value, 78);
    doc.text(wrapped, xOffset, rowStartY + 5);

    col++;
    if (col === 2 || i === eventFields.length - 1) {
      col = 0;
      rowStartY += 16;
    }
  });

  y = rowStartY + 4;
  thinRule(doc, y);
  y += 10;

  // ── FINANCIALS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("PAYMENT SUMMARY", 20, y);
  goldRule(doc, y + 2);
  y += 12;

  // Finance table
  fill(doc, ...BRAND.charcoal);
  doc.rect(20, y - 6, 170, 38, "F");

  const finances = [
    { label: "Estimated Total", value: `£${booking.estimated_total.toFixed(2)}`, highlight: false },
    { label: "Deposit Required (60%)", value: `£${booking.deposit_amount.toFixed(2)}`, highlight: true },
    { label: "Remaining Balance", value: `£${booking.remaining_balance.toFixed(2)}`, highlight: false },
  ];

  finances.forEach(({ label, value, highlight }) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const textCol = highlight ? BRAND.gold : BRAND.textMuted;
    hex(doc, textCol[0], textCol[1], textCol[2]);
    doc.text(label, 28, y);
    doc.setFont("helvetica", "bold");
    const valCol = highlight ? BRAND.gold : BRAND.white;
    hex(doc, valCol[0], valCol[1], valCol[2]);
    doc.text(value, W - 28, y, { align: "right" });

    if (!highlight) {
      thinRule(doc, y + 3, 28, 154);
    }
    y += 12;
  });

  y += 2;

  // ── NOTES
  if (booking.special_notes) {
    thinRule(doc, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    hex(doc, ...BRAND.gold);
    doc.text("SPECIAL NOTES / REQUIREMENTS", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    hex(doc, ...BRAND.lightGray);
    const noteLines = doc.splitTextToSize(booking.special_notes, 165);
    doc.text(noteLines, 20, y);
    y += noteLines.length * 5 + 6;
  }

  // ── FOOTER
  const footerY = H - 22;
  fill(doc, ...BRAND.darkMid);
  doc.rect(0, footerY - 6, W, 28, "F");
  fill(doc, ...BRAND.gold);
  doc.rect(0, footerY - 6, W, 1.5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text("JT Studios · Professional Event Coverage", W / 2, footerY + 2, { align: "center" });
  doc.text("enquiries@jtstudios.co.uk  ·  www.jtstudios.co.uk", W / 2, footerY + 8, { align: "center" });
  doc.setFontSize(6.5);
  hex(doc, 80, 80, 80);
  doc.text(`Document generated on ${new Date().toLocaleString("en-GB")} · Ref: ${booking.booking_ref}`, W / 2, footerY + 14, { align: "center" });

  doc.save(`JTStudios_Booking_${booking.booking_ref}.pdf`);
}

// ─────────────────────────────────────────────
// SERVICE AGREEMENT PDF
// ─────────────────────────────────────────────
export function generateAgreementPDF(booking: Booking): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── PAGE 1 BACKGROUND
  fill(doc, ...BRAND.dark);
  doc.rect(0, 0, W, H, "F");

  // ── HEADER BAND
  fill(doc, ...BRAND.darkMid);
  doc.rect(0, 0, W, 62, "F");
  fill(doc, ...BRAND.gold);
  doc.rect(0, 0, 5, 62, "F");
  fill(doc, ...BRAND.gold);
  doc.rect(0, 60, W, 2, "F");

  // ── Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  hex(doc, ...BRAND.gold);
  doc.text("JT STUDIOS", 14, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text("EVENTS · PHOTOGRAPHY · VIDEOGRAPHY · HOSTING", 14, 29);

  // ── Agreement heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  hex(doc, ...BRAND.white);
  doc.text("SERVICE AGREEMENT", 14, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  hex(doc, ...BRAND.gold);
  doc.text(`Agreement No. ${booking.booking_ref}`, 14, 54);

  // Date top right
  doc.setFontSize(8);
  hex(doc, ...BRAND.textMuted);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, W - 14, 22, { align: "right" });

  let y = 76;

  // ── PARTIES
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("PARTIES TO THIS AGREEMENT", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  // Two party boxes
  const boxH = 32;
  fill(doc, ...BRAND.charcoal);
  doc.rect(20, y, 80, boxH, "F");
  fill(doc, ...BRAND.charcoal);
  doc.rect(108, y, 82, boxH, "F");

  // Left box label
  stroke(doc, ...BRAND.gold);
  doc.setLineWidth(0.6);
  doc.line(20, y, 100, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  hex(doc, ...BRAND.gold);
  doc.text("SERVICE PROVIDER", 28, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  hex(doc, ...BRAND.white);
  doc.text("JT Studios Ltd", 28, y + 13);
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text("enquiries@jtstudios.co.uk", 28, y + 20);
  doc.text("www.jtstudios.co.uk", 28, y + 26);

  // Right box label
  doc.setLineWidth(0.6);
  stroke(doc, ...BRAND.gold);
  doc.line(108, y, 190, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  hex(doc, ...BRAND.gold);
  doc.text("CLIENT", 116, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  hex(doc, ...BRAND.white);
  doc.text(booking.full_name, 116, y + 13);
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text(booking.email, 116, y + 20);
  doc.text(booking.phone, 116, y + 26);

  y += boxH + 10;

  // ── EVENT DETAILS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("EVENT DETAILS", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  fill(doc, ...BRAND.charcoal);
  doc.rect(20, y - 4, 170, 40, "F");

  const evRows = [
    ["Event Type", booking.event_type],
    ["Service Booked", booking.services?.name || "Photography & Videography"],
    ["Event Date", formatDate(booking.event_date)],
    ["Event Time", `${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`],
    ["Venue", booking.location],
  ];

  evRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    hex(doc, ...BRAND.textMuted);
    doc.text(label, 28, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    hex(doc, ...BRAND.white);
    doc.text(value, 95, y);
    y += 7.5;
  });

  y += 6;

  // ── PAYMENT TERMS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("PAYMENT TERMS", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  const payRows = [
    ["Total Contract Value", `£${booking.estimated_total.toFixed(2)}`],
    ["Deposit Paid (60%)", `£${booking.deposit_amount.toFixed(2)}`],
    ["Balance Due", `£${booking.remaining_balance.toFixed(2)}`],
    ["Balance Payment", "Due on or before the event date"],
  ];

  fill(doc, ...BRAND.charcoal);
  doc.rect(20, y - 4, 170, payRows.length * 8 + 6, "F");

  payRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    hex(doc, ...BRAND.textMuted);
    doc.text(label, 28, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    hex(doc, ...BRAND.white);
    doc.text(value, 95, y);
    y += 8;
  });

  y += 8;

  // ── TERMS & CONDITIONS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("TERMS & CONDITIONS", 20, y);
  goldRule(doc, y + 2);
  y += 10;

  const terms = [
    { title: "1. Services", body: "JT Studios agrees to provide the agreed-upon photography, videography, event hosting, or planning services on the event date specified in this agreement, to the best of their professional ability." },
    { title: "2. Deposit & Cancellation", body: "The 60% deposit is non-refundable upon cancellation. If JT Studios is unable to fulfil the booking, a full refund including the deposit will be issued within 14 working days." },
    { title: "3. Balance Payment", body: "The remaining balance is due on or before the event date. Failure to pay the balance may result in cancellation without refund of the deposit." },
    { title: "4. Deliverables", body: "Edited photographs and/or video content will be delivered within an agreed timeframe (typically 4–8 weeks post-event) via the secure client portal." },
    { title: "5. Rights & Usage", body: "JT Studios retains the right to use images/footage for promotional purposes unless the client requests otherwise in writing. The client receives a personal-use licence for all delivered content." },
    { title: "6. Force Majeure", body: "Neither party shall be liable for failure to perform under circumstances beyond their reasonable control, including but not limited to severe weather, illness, or government restrictions." },
  ];

  terms.forEach(({ title, body }) => {
    if (y > H - 50) {
      doc.addPage();
      fill(doc, ...BRAND.dark);
      doc.rect(0, 0, W, H, "F");
      y = 24;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    hex(doc, ...BRAND.gold);
    doc.text(title, 20, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    hex(doc, ...BRAND.lightGray);
    const lines = doc.splitTextToSize(body, 165);
    doc.text(lines, 20, y);
    y += lines.length * 4.5 + 5;
  });

  y += 4;

  // ── SIGNATURE SECTION
  if (y > H - 70) {
    doc.addPage();
    fill(doc, ...BRAND.dark);
    doc.rect(0, 0, W, H, "F");
    y = 24;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.gold);
  doc.text("SIGNATURES", 20, y);
  goldRule(doc, y + 2);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  hex(doc, ...BRAND.textMuted);
  doc.text(
    "By signing below, both parties confirm they have read, understood, and agreed to the terms of this Service Agreement.",
    20, y, { maxWidth: 165 }
  );
  y += 12;

  // Signature boxes
  const sigY = y;
  const sigBoxW = 78;
  const sigBoxH = 30;

  // Provider sig
  stroke(doc, ...BRAND.charcoal);
  doc.setLineWidth(0.3);
  doc.rect(20, sigY, sigBoxW, sigBoxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  hex(doc, ...BRAND.gold);
  doc.text("JT Studios Representative", 22, sigY + 5);
  stroke(doc, ...BRAND.textMuted);
  doc.setLineWidth(0.3);
  doc.line(22, sigY + 18, 20 + sigBoxW - 4, sigY + 18); // signature line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  hex(doc, ...BRAND.textMuted);
  doc.text("Signature", 22, sigY + 22);
  doc.text("Date: ____ / ____ / ________", 22, sigY + 28);

  // Client sig
  stroke(doc, ...BRAND.charcoal);
  doc.setLineWidth(0.3);
  doc.rect(112, sigY, sigBoxW, sigBoxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  hex(doc, ...BRAND.gold);
  doc.text(`Client: ${booking.full_name}`, 114, sigY + 5);
  stroke(doc, ...BRAND.textMuted);
  doc.setLineWidth(0.3);
  doc.line(114, sigY + 18, 112 + sigBoxW - 4, sigY + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  hex(doc, ...BRAND.textMuted);
  doc.text("Signature", 114, sigY + 22);
  doc.text("Date: ____ / ____ / ________", 114, sigY + 28);

  // ── FOOTER on last page
  const footerY = H - 18;
  fill(doc, ...BRAND.darkMid);
  doc.rect(0, footerY - 4, W, 22, "F");
  fill(doc, ...BRAND.gold);
  doc.rect(0, footerY - 4, W, 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  hex(doc, ...BRAND.textMuted);
  doc.text("JT Studios · enquiries@jtstudios.co.uk · www.jtstudios.co.uk", W / 2, footerY + 4, { align: "center" });
  doc.setFontSize(6.5);
  hex(doc, 80, 80, 80);
  doc.text(`Service Agreement ${booking.booking_ref} · Generated ${new Date().toLocaleString("en-GB")}`, W / 2, footerY + 10, { align: "center" });

  doc.save(`JTStudios_Agreement_${booking.booking_ref}.pdf`);
}
