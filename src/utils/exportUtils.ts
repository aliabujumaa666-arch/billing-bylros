import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getDefaultPDFSettings, hexToRgb } from './pdfHelpers';

export const exportQuoteToPDF = (quote: any, customer: any, brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdf || getDefaultPDFSettings();
  const primaryColor = brand?.visual?.primaryColor || '#bb2738';
  const accentColor = brand?.visual?.accentColor || '#a01f2f';
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const accentRgb = hexToRgb(accentColor);

  for (let i = 0; i < 210; i += 20) {
    doc.setFillColor(245, 245, 247, 0.3);
    doc.circle(i, -10, 30, 'F');
  }
  for (let i = 0; i < 210; i += 25) {
    doc.setFillColor(241, 245, 249, 0.5);
    doc.circle(i + 10, 290, 40, 'F');
  }

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(pdfSettings.fonts.headerFont, 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');
  }

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'gradient') {
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.triangle(180, 0, 210, 0, 210, 30, 'F');
    doc.triangle(0, 45, 30, pdfSettings.layout.headerHeight, 0, pdfSettings.layout.headerHeight, 'F');

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
  }

  if (pdfSettings.header.showHeader && pdfSettings.header.showCompanyInfo) {
    const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
    doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
    doc.setFontSize(32);
    doc.setFont(pdfSettings.fonts.headerFont, 'bold');
    doc.text(companyName, 14, 22);

    if (pdfSettings.header.showTagline) {
      doc.setFontSize(9);
      doc.setFont(pdfSettings.fonts.bodyFont, 'normal');
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
      doc.text(tagline, 14, 29);
    }

    doc.setFontSize(8);
    doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
    doc.text(companyFullName, 14, 37);
    doc.text(companyAddress, 14, 42);
    doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
  }

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(10, 62, 190, 12, 2, 2, 'F');

  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', 14, 70);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Quote Reference: ${quote.quote_number}`, 140, 70, { align: 'right' });

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(10, 78, 90, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 78, 90, 28, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('QUOTE DETAILS', 14, 84);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issue Date:`, 14, 91);
  doc.setFont('helvetica', 'bold');
  doc.text(`${new Date(quote.created_at).toLocaleDateString()}`, 42, 91);

  if (quote.valid_until) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Valid Until:`, 14, 97);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(`${new Date(quote.valid_until).toLocaleDateString()}`, 42, 97);
  }

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status:`, 14, 103);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(quote.status || 'Draft', 42, 103);

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(110, 78, 90, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, 78, 90, 28, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER INFORMATION', 114, 84);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.name, 114, 91);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`📞 ${customer.phone}`, 114, 97);
  if (customer.email) doc.text(`✉ ${customer.email}`, 114, 103);

  if (pdfSettings.sections.showItemsTable) {
    const textPrimaryRgb = hexToRgb(pdfSettings.colors.textPrimary);
    doc.setFontSize(10);
    doc.setFont(pdfSettings.fonts.bodyFont, 'bold');
    doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
    doc.text('ITEMS & SPECIFICATIONS', 14, 115);

    const tableHeaders: string[] = [];
    const tableRow: any[] = [];

    if (pdfSettings.table.showItemNumbers) tableHeaders.push('#');
    if (pdfSettings.table.showLocation) tableHeaders.push('Location');
    if (pdfSettings.table.showType) tableHeaders.push('Type');
    if (pdfSettings.table.showDimensions) {
      tableHeaders.push('Height', 'Width');
    }
    if (pdfSettings.table.showQuantity) tableHeaders.push('Qty');
    if (pdfSettings.table.showArea) tableHeaders.push('Area m²');
    if (pdfSettings.table.showChargeableArea) tableHeaders.push('Charge m²');
    if (pdfSettings.table.showUnitPrice) tableHeaders.push('Rate');
    if (pdfSettings.table.showTotal) tableHeaders.push('Total AED');

    const tableData = quote.items.map((item: any, index: number) => {
      const row: any[] = [];
      if (pdfSettings.table.showItemNumbers) row.push(`${index + 1}`);
      if (pdfSettings.table.showLocation) row.push(item.location || '-');
      if (pdfSettings.table.showType) row.push(item.type || '-');
      if (pdfSettings.table.showDimensions) {
        row.push(`${item.height || 0}cm`, `${item.width || 0}cm`);
      }
      if (pdfSettings.table.showQuantity) row.push(item.qty || 0);
      if (pdfSettings.table.showArea) row.push(item.area?.toFixed(2) || '0.00');
      if (pdfSettings.table.showChargeableArea) row.push(item.chargeable_area?.toFixed(2) || item.area?.toFixed(2) || '0.00');
      if (pdfSettings.table.showUnitPrice) row.push(item.unit_price?.toFixed(2) || '0.00');
      if (pdfSettings.table.showTotal) row.push((item.total || 0).toFixed(2));
      return row;
    });

    const tableHeaderBgRgb = hexToRgb(pdfSettings.colors.tableHeaderBg);
    const tableHeaderTextRgb = hexToRgb(pdfSettings.colors.tableHeaderText);
    const tableBorderRgb = hexToRgb(pdfSettings.colors.tableBorder);
    const tableAltRowRgb = hexToRgb(pdfSettings.colors.tableRowAlternate);

    autoTable(doc, {
      startY: 120,
      head: [tableHeaders],
      body: tableData,
      theme: pdfSettings.table.tableStyle as any,
      headStyles: {
        fillColor: [tableHeaderBgRgb.r, tableHeaderBgRgb.g, tableHeaderBgRgb.b],
        textColor: [tableHeaderTextRgb.r, tableHeaderTextRgb.g, tableHeaderTextRgb.b],
        fontSize: pdfSettings.fonts.tableFontSize,
        fontStyle: 'bold',
        halign: pdfSettings.table.headerAlignment as any,
        cellPadding: 3,
      },
      styles: {
        fontSize: pdfSettings.fonts.tableFontSize,
        cellPadding: 2.5,
        lineColor: [tableBorderRgb.r, tableBorderRgb.g, tableBorderRgb.b],
        lineWidth: 0.1,
        halign: pdfSettings.table.textAlignment as any,
      },
      alternateRowStyles: {
        fillColor: [tableAltRowRgb.r, tableAltRowRgb.g, tableAltRowRgb.b],
      },
    });
  }

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(130, finalY, 70, 42, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(130, finalY, 70, 42, 2, 2, 'S');

  let currentY = finalY + 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 135, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${quote.subtotal.toFixed(2)}`, 195, currentY, { align: 'right' });
  currentY += 6;

  if (quote.discount > 0) {
    const discountLabel = quote.discount_type === 'percentage'
      ? `Discount (${quote.discount_value}%)`
      : 'Discount';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 197, 94);
    doc.text(`${discountLabel}:`, 135, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(`- AED ${quote.discount.toFixed(2)}`, 195, currentY, { align: 'right' });
    currentY += 6;
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('VAT (5%):', 135, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${quote.vat_amount.toFixed(2)}`, 195, currentY, { align: 'right' });
  currentY += 8;

  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.line(135, currentY - 2, 195, currentY - 2);

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(133, currentY - 1, 65, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('TOTAL AMOUNT:', 135, currentY + 4);
  doc.setFontSize(13);
  doc.text(`AED ${quote.total.toFixed(2)}`, 195, currentY + 4, { align: 'right' });

  let remarksY = currentY + 12;

  if (quote.remarks) {
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(10, remarksY, 120, 25, 2, 2, 'F');
    doc.setDrawColor(250, 204, 21);
    doc.roundedRect(10, remarksY, 120, 25, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    doc.text('REMARKS & NOTES', 14, remarksY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 63, 18);
    const splitRemarks = doc.splitTextToSize(quote.remarks, 110);
    doc.text(splitRemarks, 14, remarksY + 11);
    remarksY += 30;
  }

  const termsY = remarksY > currentY + 12 ? remarksY : currentY + 12;

  if (pdfSettings.terms.showTerms && pdfSettings.sections.showTerms) {
    if (pdfSettings.terms.termsStyle === 'bordered' || pdfSettings.terms.termsStyle === 'box') {
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(10, termsY, 190, 32, 2, 2, 'F');
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(10, termsY, 190, 32, 2, 2, 'S');
    }

    doc.setFont(pdfSettings.fonts.bodyFont, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text(pdfSettings.terms.termsTitle, 14, termsY + 6);

    doc.setFont(pdfSettings.fonts.bodyFont, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(pdfSettings.terms.termsContent, 14, termsY + 11);
  }

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setFillColor(255, 255, 255, 0.1);
      doc.circle(15, footerY + 13, 15, 'F');
      doc.circle(195, footerY + 13, 20, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(pdfSettings.fonts.bodyFont, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(pdfSettings.fonts.bodyFont, 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Quote generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }

    if (pdfSettings.footer.showPageNumbers) {
      doc.setFontSize(pdfSettings.fonts.footerFontSize);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page 1 of 1`, 200, footerY - 4, { align: 'right' });
    }
  }

  doc.save(`Quote_${quote.quote_number}.pdf`);
};

export const exportQuoteToExcel = (quote: any, customer: any) => {
  const worksheetData = [
    ['BYLROS - QUOTATION'],
    [],
    ['Quote Number:', quote.quote_number],
    ['Date:', new Date(quote.created_at).toLocaleDateString()],
    ['Customer:', customer.name],
    ['Phone:', customer.phone],
    ['Email:', customer.email || ''],
    ['Location:', customer.location || ''],
    [],
    ['Location', 'Type', 'Height', 'Width', 'Qty', 'Area (m²)', 'Chargeable (m²)', 'Unit Price (AED)', 'Total (AED)'],
    ...quote.items.map((item: any) => [
      item.location || '',
      item.type || '',
      item.height || '',
      item.width || '',
      item.qty || 0,
      item.area?.toFixed(2) || '0.00',
      item.chargeable_area?.toFixed(2) || item.area?.toFixed(2) || '0.00',
      item.unit_price?.toFixed(2) || '0.00',
      item.total?.toFixed(2) || '0.00',
    ]),
    [],
    ['', '', '', '', '', '', '', 'Subtotal:', quote.subtotal.toFixed(2)],
    ...(quote.discount > 0 ? [['', '', '', '', '', '', '', `Discount${quote.discount_type === 'percentage' ? ` (${quote.discount_value}%)` : ''}:`, `-${quote.discount.toFixed(2)}`]] : []),
    ['', '', '', '', '', '', '', 'VAT (5%):', quote.vat_amount.toFixed(2)],
    ['', '', '', '', '', '', '', 'Total:', quote.total.toFixed(2)],
  ];

  if (quote.remarks) {
    worksheetData.push([], ['Remarks:', quote.remarks]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote');

  XLSX.writeFile(workbook, `Quote_${quote.quote_number}.xlsx`);
};

export const exportInvoiceToPDF = (invoice: any, customer: any, payments: any[]) => {
  const doc = new jsPDF();

  doc.setFillColor(187, 39, 56);
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BYLROS', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Middle East Aluminium & Glass LLC', 14, 28);
  doc.text('Costra Business Park (Block B), Production City, Dubai, UAE', 14, 34);
  doc.text('Phone: +971-52-5458-968 | Email: info@bylros.ae', 14, 40);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 14, 60);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 70);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 14, 76);
  if (invoice.due_date) {
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, 82);
  }

  doc.text(`Customer: ${customer.name}`, 140, 70);
  doc.text(`Phone: ${customer.phone}`, 140, 76);

  let yPos = 100;

  doc.text(`Total Amount: AED ${invoice.total_amount.toFixed(2)}`, 14, yPos);
  doc.text(`Deposit Paid: AED ${invoice.deposit_paid.toFixed(2)}`, 14, yPos + 6);
  doc.text(`Payment Before Delivery: AED ${invoice.payment_before_delivery.toFixed(2)}`, 14, yPos + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Balance Due: AED ${invoice.balance.toFixed(2)}`, 14, yPos + 18);

  if (payments && payments.length > 0) {
    yPos += 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Payment History', 14, yPos);

    const paymentData = payments.map((p: any) => [
      new Date(p.payment_date).toLocaleDateString(),
      `AED ${p.amount.toFixed(2)}`,
      p.payment_method,
      p.reference || '-',
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Amount', 'Method', 'Reference']],
      body: paymentData,
      theme: 'grid',
      headStyles: { fillColor: [187, 39, 56], textColor: 255 },
      styles: { fontSize: 9 },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('BYLROS Middle East Aluminium & Glass LLC', 105, 285, { align: 'center' });

  doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPDF = (data: any[], columns: string[], headers: string[], filename: string) => {
  const doc = new jsPDF();

  doc.setFillColor(187, 39, 56);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BYLROS Export', 14, 18);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(filename.toUpperCase(), 14, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 52);

  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && value.name) return value.name;
      return String(value);
    })
  );

  autoTable(doc, {
    startY: 60,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [187, 39, 56], textColor: 255 },
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
