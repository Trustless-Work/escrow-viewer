import { jsPDF } from "jspdf";
import type { OrganizedEscrowData } from "@/mappers/escrow-mapper";
import { ROLE_MAPPING } from "@/lib/escrow-constants";

const DEFAULT_FONT = "helvetica";

export type NetworkTag = "mainnet" | "testnet";

async function loadLogoDataUrl(path: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    const dataUrl: string = await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Failed to load logo"));
      img.src = path;
    });
    return dataUrl;
  } catch {
    return null;
  }
}

export async function exportEscrowReport(organized: OrganizedEscrowData, network: NetworkTag) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 64; // add more outer spacing
  let y = margin;
  const logoDataUrl = await loadLogoDataUrl("/logo.png");

  const line = (height = 16) => {
    y += height;
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
      renderHeader(logoDataUrl || undefined);
    }
  };

  const text = (
    content: string,
    opts?: { size?: number; bold?: boolean; lineHeight?: number }
  ) => {
    if (opts?.bold) doc.setFont(DEFAULT_FONT, "bold");
    else doc.setFont(DEFAULT_FONT, "normal");
    if (opts?.size) doc.setFontSize(opts.size);
    const maxWidth = pageWidth - margin * 2;
    const wrapped = doc.splitTextToSize(content, maxWidth);
    const lh = opts?.lineHeight ?? 16;
    wrapped.forEach((lineText: string, idx: number) => {
      doc.text(lineText, margin, y);
      if (idx < wrapped.length - 1) {
        line(lh);
      }
    });
  };

  const rightText = (content: string, opts?: { size?: number }) => {
    if (opts?.size) doc.setFontSize(opts.size);
    const textWidth = doc.getTextWidth(content);
    doc.text(content, pageWidth - margin - textWidth, y);
  };

  const renderHeader = (logoDataUrl?: string) => {
    doc.setFontSize(18);
    doc.setFont(DEFAULT_FONT, "bold");
    // Logo (if available)
    if (logoDataUrl) {
      const logoHeight = 24;
      const logoWidth = 24;
      doc.addImage(logoDataUrl, "PNG", margin, y - 16, logoWidth, logoHeight);
      doc.text("Trustless Work — Escrow Audit Report", margin + logoWidth + 8, y);
    } else {
      doc.text("Trustless Work — Escrow Audit Report", margin, y);
    }
    rightText(network === "mainnet" ? "Mainnet" : "Testnet", { size: 12 });
    line(20);
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    line(16);
  };

  const renderFooter = () => {
    const footerY = doc.internal.pageSize.getHeight() - margin / 2;
    doc.setFontSize(10);
    doc.setFont(DEFAULT_FONT, "normal");
    doc.setTextColor(120);
    doc.text(
      "https://viewer.trustlesswork.com  •  Source: https://github.com/trustlesswork/escrow-viewer",
      margin,
      footerY
    );
    doc.setTextColor(0);
  };

  renderHeader(logoDataUrl || undefined);

  // Report meta
  doc.setFontSize(12);
  doc.setFont(DEFAULT_FONT, "normal");
  text(`Generated: ${new Date().toISOString()}`);
  line(20);

  // Title & description
  doc.setFontSize(16);
  doc.setFont(DEFAULT_FONT, "bold");
  text(organized.title || "Escrow");
  line(16);
  doc.setFontSize(12);
  doc.setFont(DEFAULT_FONT, "normal");
  text(organized.description || "");
  line(12);

  // Properties
  doc.setFontSize(14);
  doc.setFont(DEFAULT_FONT, "bold");
  text("Escrow Details");
  line(14);
  doc.setFontSize(12);
  doc.setFont(DEFAULT_FONT, "normal");

  const props = organized.properties;
  const details: Array<[string, string]> = [
    ["Escrow ID", props.escrow_id],
    ["Engagement ID", String(props.engagement_id || "-")],
    ["Amount", String(props.amount || "-")],
    ["Balance", String(props.balance || "-")],
    ["Platform Fee", String(props.platform_fee || "-")],
    ["Asset (trustline)", String(props.trustline || "-")],
  ];

  details.forEach(([k, v]) => {
    text(`${k}: ${v}`);
    line(14);
  });

  line(6);

  // Roles
  doc.setFontSize(14);
  doc.setFont(DEFAULT_FONT, "bold");
  text("Assigned Roles");
  line(14);
  doc.setFontSize(12);
  doc.setFont(DEFAULT_FONT, "normal");
  Object.entries(organized.roles).forEach(([key, value]) => {
    const label = ROLE_MAPPING[key] || key.replace(/_/g, " ");
    text(`${label}: ${value}`);
    line(14);
  });

  line(6);

  // Milestones
  doc.setFontSize(14);
  doc.setFont(DEFAULT_FONT, "bold");
  text("Milestones");
  line(14);
  doc.setFontSize(12);
  doc.setFont(DEFAULT_FONT, "normal");

  if (organized.milestones.length === 0) {
    text("No milestones found");
    line(14);
  } else {
    organized.milestones.forEach((m, idx) => {
      text(`${idx + 1}. ${m.title}` , { bold: true });
      line(14);
      text(`Status: ${m.status}${m.approved ? " (approved)" : ""}`);
      line(14);
      if (m.amount) {
        text(`Amount: ${m.amount}`);
        line(14);
      }
      if (typeof m.signer === "string") {
        text(`Signer: ${m.signer}`);
        line(14);
      }
      if (typeof m.approver === "string") {
        text(`Approver: ${m.approver}`);
        line(14);
      }
      line(8);
    });
  }

  // Footer on last page
  renderFooter();

  // Save
  const filename = `trustlesswork-escrow-${props.escrow_id}-${network}.pdf`;
  doc.save(filename);
}
