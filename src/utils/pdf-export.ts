import jsPDF from 'jspdf';
import type { OrganizedEscrowData } from '@/mappers/escrow-mapper';
import type { NetworkType } from '@/lib/network-config';
import { ROLE_MAPPING } from '@/lib/escrow-constants';

interface PdfExportOptions {
  organized: OrganizedEscrowData;
  network: NetworkType;
  contractId: string;
}

async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to load logo image:', error);
    return '';
  }
}

export async function generateEscrowPdf({ organized, network, contractId }: PdfExportOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize * 0.5);
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 3;
  };

  const addSectionHeader = (title: string) => {
    checkPageBreak(15);
    yPosition += 5;
    addText(title, 14, true, [0, 51, 102]);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
    yPosition += 3;
  };

  const addKeyValue = (key: string, value: string, indent = 0) => {
    checkPageBreak(8);
    const xPos = margin + indent;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(`${key}:`, xPos, yPosition);
    
    const valueX = xPos + 50;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const valueLines = doc.splitTextToSize(value, contentWidth - 50 - indent);
    valueLines.forEach((line: string) => {
      doc.text(line, valueX, yPosition);
      yPosition += 5;
    });
    yPosition += 2;
  };

  const headerHeight = 40;
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  
  try {
    const logoBase64 = await imageToBase64('/logo.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 11, 18, 18);
    }
  } catch {
    // Logo failed to load, continue without it
  }
  
  const logoWidth = 18;
  const logoSpacing = 5;
  const textStartX = 15 + logoWidth + logoSpacing;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Trustless Work', textStartX, 18);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Escrow Report', textStartX, 26);
  
  const rightMargin = 15;
  const labelWidth = 25;
  const valueWidth = 45;
  const rightLabelX = pageWidth - rightMargin - labelWidth - valueWidth;
  const rightValueX = pageWidth - rightMargin - valueWidth;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Network:', rightLabelX, 16);
  doc.setFont('helvetica', 'normal');
  const networkText = network === 'mainnet' ? 'Mainnet' : 'Testnet';
  doc.text(networkText, rightValueX, 16);
  
  const exportDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFont('helvetica', 'bold');
  doc.text('Exported:', rightLabelX, 24);
  doc.setFont('helvetica', 'normal');
  const dateLines = doc.splitTextToSize(exportDate, valueWidth);
  let dateY = 24;
  dateLines.forEach((line: string) => {
    doc.text(line, rightValueX, dateY);
    dateY += 4;
  });
  
  yPosition = 50;

  addSectionHeader('Escrow Summary');
  
  addKeyValue('Escrow ID', contractId);
  addKeyValue('Title', organized.title || 'N/A');
  addKeyValue('Description', organized.description || 'N/A');
  addKeyValue('Escrow Type', organized.escrowType === 'multi-release' ? 'Multi-Release' : 'Single-Release');
  
  if (organized.properties.trustline) {
    addKeyValue('Asset / Trustline', organized.properties.trustline);
  }
  
  if (organized.properties.amount) {
    addKeyValue('Total Amount', `${organized.properties.amount} ${organized.properties.trustline ? organized.properties.trustline.split(':')[0] : ''}`);
  }
  
  if (organized.properties.balance) {
    addKeyValue('Current Balance', `${organized.properties.balance} ${organized.properties.trustline ? organized.properties.trustline.split(':')[0] : ''}`);
  }
  
  if (organized.properties.platform_fee) {
    addKeyValue('Platform Fee', organized.properties.platform_fee);
  }
  
  if (organized.properties.amount) {
    const amount = parseFloat(organized.properties.amount);
    if (!isNaN(amount)) {
      const trustlessWorkFee = (amount * 0.003).toFixed(2);
      addKeyValue('Trustless Work Fee (0.3%)', trustlessWorkFee);
    }
  }
  
  if (organized.properties.engagement_id) {
    addKeyValue('Engagement ID', organized.properties.engagement_id);
  }

  addSectionHeader('Escrow Status');
  
  const getStatusText = () => {
    if (organized.flags.resolved_flag === 'true') return 'Resolved';
    if (organized.flags.dispute_flag === 'true') return 'Disputed';
    if (organized.flags.release_flag === 'true') return 'Released';
    return 'Active';
  };
  
  addKeyValue('Current Status', getStatusText());
  addKeyValue('Dispute Flag', organized.flags.dispute_flag === 'true' ? 'Yes' : 'No');
  addKeyValue('Release Flag', organized.flags.release_flag === 'true' ? 'Yes' : 'No');
  addKeyValue('Resolved Flag', organized.flags.resolved_flag === 'true' ? 'Yes' : 'No');
  addKeyValue('Progress', `${organized.progress.toFixed(1)}%`);

  addSectionHeader('Assigned Roles');
  
  if (Object.keys(organized.roles).length === 0) {
    addText('No roles assigned', 10, false, [100, 100, 100]);
  } else {
    Object.entries(organized.roles).forEach(([roleKey, address]) => {
      const roleName = ROLE_MAPPING[roleKey] || roleKey;
      addKeyValue(roleName, address, 5);
    });
  }

  addSectionHeader('Milestones');
  
  if (organized.milestones.length === 0) {
    addText('No milestones defined', 10, false, [100, 100, 100]);
  } else {
    organized.milestones.forEach((milestone, index) => {
      checkPageBreak(30);
      yPosition += 3;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text(`Milestone ${milestone.id + 1}: ${milestone.title}`, margin + 5, yPosition);
      yPosition += 6;
      
      addKeyValue('Description', milestone.description || 'N/A', 10);
      
      if (milestone.amount) {
        addKeyValue('Amount', milestone.amount, 10);
      }
      
      const statusText = milestone.approved 
        ? 'Approved' 
        : milestone.release_flag 
          ? 'Released' 
          : milestone.dispute_flag 
            ? 'Disputed' 
            : milestone.resolved_flag 
              ? 'Resolved' 
              : 'Pending';
      addKeyValue('Status', statusText, 10);
      
      if (milestone.signer) {
        addKeyValue('Signer', milestone.signer, 10);
      }
      
      if (milestone.approver) {
        addKeyValue('Approver', milestone.approver, 10);
      }
      
      yPosition += 3;
      
      if (index < organized.milestones.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 3;
      }
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by Trustless Work Escrow Viewer', margin, pageHeight - 10);
    doc.text('https://trustless.work', pageWidth - margin - 40, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5, { align: 'right' });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `escrow-report-${contractId.substring(0, 8)}-${dateStr}.pdf`;
  doc.save(filename);
}
