import PDFDocument from 'pdfkit';
import crypto from 'crypto';

export interface InvoiceDetails {
  invoiceNumber: string;
  issueDate: Date;
  contractTitle: string;
  contractId: string;
  milestoneTitle: string;
  milestoneIndex: number;
  clientName: string;
  clientEmail: string;
  freelancerName: string;
  freelancerEmail: string;
  amount: number;
  currency?: string;
  deliverables?: string[];
  status?: string;
}

export function generateInvoicePdfBuffer(details: InvoiceDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const currency = (details.currency || 'USD').toUpperCase();
      const symbol = currency === 'INR' ? 'Rs.' : currency === 'EUR' ? 'EUR' : currency === 'GBP' ? 'GBP' : currency === 'AED' ? 'AED' : '$';
      const formattedAmount = `${symbol} ${details.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${currency}`;
      const checksum = crypto
        .createHash('sha256')
        .update(`${details.invoiceNumber}-${details.contractId}-${details.amount}-${currency}-${details.issueDate.toISOString()}`)
        .digest('hex');

      // 1. Header Banner
      doc
        .rect(0, 0, doc.page.width, 100)
        .fill('#0b1329');

      doc
        .fillColor('#0084ff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('FLOXA', 45, 32, { continued: true })
        .fillColor('#ffffff')
        .fontSize(12)
        .text('  WORK', { baseline: 'bottom' });

      doc
        .fillColor('#94a3b8')
        .fontSize(9)
        .font('Helvetica')
        .text('Discovery-First Freelance Marketplace • Non-Custodial Milestone Ledger', 45, 60)
        .text('https://work.flumenx.in', 45, 73);

      doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('COMMERCIAL INVOICE', doc.page.width - 245, 35, { width: 200, align: 'right' });

      doc
        .fillColor('#38bdf8')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(details.invoiceNumber, doc.page.width - 245, 58, { width: 200, align: 'right' });

      // 2. Status Badge & Metadata
      let y = 125;

      doc
        .rect(45, y, 140, 24)
        .fill('#ecfdf5')
        .strokeColor('#a7f3d0')
        .stroke();

      doc
        .fillColor('#047857')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PAID & SETTLED', 55, y + 7);

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(`Date of Issue: ${details.issueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 45, y + 36)
        .text(`Contract ID: ${details.contractId}`, 45, y + 49);

      // 3. Parties Grid (Billed To vs Contractor)
      y = 200;

      // Client Box
      doc
        .rect(45, y, 240, 85)
        .fill('#f8fafc')
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fillColor('#0084ff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('BILLED TO (CLIENT)', 58, y + 12);

      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(details.clientName, 58, y + 28);

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(details.clientEmail, 58, y + 46)
        .text('Verified FLOXA Work Client', 58, y + 60);

      // Freelancer Box
      doc
        .rect(310, y, 240, 85)
        .fill('#f8fafc')
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fillColor('#0084ff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SERVICE PROVIDER (FREELANCER)', 323, y + 12);

      doc
        .fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(details.freelancerName, 323, y + 28);

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(details.freelancerEmail, 323, y + 46)
        .text('Direct Independent Contractor', 323, y + 60);

      // 4. Milestone Line Item Table
      y = 310;

      // Table Header
      doc
        .rect(45, y, 505, 26)
        .fill('#0f172a');

      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ITEM & DELIVERABLE SPECIFICATION', 58, y + 8)
        .text('MILESTONE', 380, y + 8, { width: 70, align: 'center' })
        .text('AMOUNT', 470, y + 8, { width: 65, align: 'right' });

      y += 26;

      // Table Row
      doc
        .rect(45, y, 505, 70)
        .fill('#ffffff')
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(details.contractTitle, 58, y + 12);

      doc
        .fillColor('#475569')
        .fontSize(9)
        .font('Helvetica')
        .text(`Milestone Deliverable: ${details.milestoneTitle}`, 58, y + 28);

      if (details.deliverables && details.deliverables.length > 0) {
        doc
          .fillColor('#64748b')
          .fontSize(8)
          .text(`Delivered: ${details.deliverables.slice(0, 3).join(', ')}`, 58, y + 44, { width: 310, ellipsis: true });
      }

      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`#${details.milestoneIndex + 1}`, 380, y + 20, { width: 70, align: 'center' });

      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(formattedAmount, 450, y + 20, { width: 85, align: 'right' });

      y += 85;

      // 5. Financial Summary Box
      const sumX = 330;
      doc
        .rect(sumX, y, 220, 80)
        .fill('#f8fafc')
        .strokeColor('#e2e8f0')
        .stroke();

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text('Milestone Subtotal:', sumX + 14, y + 12)
        .text(formattedAmount, sumX + 110, y + 12, { width: 95, align: 'right' });

      doc
        .text('Platform Commission:', sumX + 14, y + 28)
        .fillColor('#059669')
        .font('Helvetica-Bold')
        .text(`0.00 ${currency} (0% Direct)`, sumX + 110, y + 28, { width: 95, align: 'right' });

      doc
        .strokeColor('#cbd5e1')
        .moveTo(sumX + 14, y + 44)
        .lineTo(sumX + 206, y + 44)
        .stroke();

      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Total Settled:', sumX + 14, y + 54)
        .fillColor('#0084ff')
        .text(formattedAmount, sumX + 110, y + 54, { width: 95, align: 'right' });

      // 6. Non-Custodial Legal Notice & SHA-256 Seal
      const bottomY = doc.page.height - 110;

      doc
        .strokeColor('#e2e8f0')
        .moveTo(45, bottomY)
        .lineTo(550, bottomY)
        .stroke();

      doc
        .fillColor('#94a3b8')
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          'NON-CUSTODIAL COMPLIANCE NOTICE: FLOXA Work facilitates discovery, milestone acceptance verification, and proof ledgers. Funds are settled directly between Client and Contractor with zero custodial escrow fees. This document constitutes a valid commercial proof of deliverable acceptance.',
          45,
          bottomY + 10,
          { width: 505, align: 'justify', lineGap: 1.5 }
        );

      doc
        .fillColor('#64748b')
        .fontSize(7)
        .font('Courier')
        .text(`INTEGRITY CHECKSUM (SHA-256): ${checksum}`, 45, bottomY + 38);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

