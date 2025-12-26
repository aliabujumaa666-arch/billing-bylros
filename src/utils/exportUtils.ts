import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getDefaultPDFSettings, hexToRgb, getFontFamily } from './pdfHelpers';
import { addQRCodeToPDF } from './qrCodeHelper';

const convertImageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

const addLogoToPDF = async (doc: jsPDF, pdfSettings: any, brand: any) => {
  if (!pdfSettings.logo.showLogo || !brand?.logos?.primary) return;

  try {
    const logoUrl = brand.logos.primary;
    const logoWidth = pdfSettings.logo.logoWidth;
    const logoHeight = pdfSettings.logo.logoHeight;
    const pageWidth = doc.internal.pageSize.getWidth();

    let xPos = 14;
    if (pdfSettings.logo.logoPosition === 'center') {
      xPos = (pageWidth - logoWidth) / 2;
    } else if (pdfSettings.logo.logoPosition === 'right') {
      xPos = pageWidth - logoWidth - 14;
    }

    const base64Logo = await convertImageToBase64(logoUrl);
    doc.addImage(base64Logo, 'PNG', xPos, 8, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Failed to add logo to PDF:', error);
  }
};

const addLetterheadHeader = async (
  doc: jsPDF,
  brand: any,
  documentDate: string,
  documentNumber: string,
  pdfSettings: any
): Promise<number> => {
  const companyFullName = brand?.company?.fullName || 'BYLROS MIDDLE EAST ALUMINUM & GLASS SYSTEM LLC';
  const companyPhone = brand?.contact?.phone || '+971 52 5458 968';
  const companyWebsite = brand?.contact?.website || 'www.bylros.ae';
  const companyEmail = brand?.contact?.email || 'info@bylros.com';
  const companyAddress = brand?.contact?.address?.fullAddress || '599-0380 Jebel Ali Industrial Area 1, Dubai, UAE';
  const companyPOBox = brand?.contact?.poBox || '43048';

  const accentRgb = hexToRgb(pdfSettings.colors.accentColor);

  if (pdfSettings.logo.showLogo && brand?.logos?.primary) {
    try {
      const logoUrl = brand.logos.primary;
      const base64Logo = await convertImageToBase64(logoUrl);
      doc.addImage(base64Logo, 'PNG', 14, 10, 20, 20);
    } catch (error) {
      console.warn('Failed to add logo to letterhead:', error);
    }
  }

  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(companyFullName, 40, 15);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 51, 51);

  doc.text(`Mobile: ${companyPhone}`, 40, 22);
  doc.text(`Website: ${companyWebsite}`, 40, 26);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'italic');
  doc.setFontSize(7);
  doc.setTextColor(85, 85, 85);
  doc.text(`Address: ${companyAddress}`, 40, 30);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 51, 51);
  doc.text(`Date: ${documentDate}`, 150, 12);
  doc.text(`Email: ${companyEmail}`, 150, 17);
  doc.text(`P.O. Box: ${companyPOBox}`, 150, 22);

  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
  doc.setLineWidth(0.5);
  doc.line(10, 35, 200, 35);

  return 42;
};

export const exportQuoteToPDF = async (quote: any, customer: any, brand?: any, returnDoc: boolean = false): Promise<jsPDF | void> => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.quotes || brand?.pdf || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(quote.created_at).toLocaleDateString(),
      quote.quote_number,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  const titleBgRgb = hexToRgb(pdfSettings.documentTitle.backgroundColor);
  const titleTextRgb = hexToRgb(pdfSettings.documentTitle.textColor);

  doc.setFillColor(titleBgRgb.r, titleBgRgb.g, titleBgRgb.b, pdfSettings.documentTitle.backgroundOpacity);
  doc.roundedRect(10, contentStartY, 190, pdfSettings.documentTitle.padding, pdfSettings.documentTitle.borderRadius, pdfSettings.documentTitle.borderRadius, 'F');

  doc.setTextColor(titleTextRgb.r, titleTextRgb.g, titleTextRgb.b);
  doc.setFontSize(pdfSettings.documentTitle.fontSize);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), pdfSettings.documentTitle.fontWeight);
  doc.text(pdfSettings.documentTitle.titleText, 14, contentStartY + (pdfSettings.documentTitle.padding / 2) + 2);

  if (pdfSettings.documentTitle.showReferenceNumber) {
    doc.setFontSize(pdfSettings.documentTitle.referenceFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(100, 100, 100);
    if (pdfSettings.documentTitle.referencePosition === 'right') {
      doc.text(`Quote Reference: ${quote.quote_number}`, 196, contentStartY + (pdfSettings.documentTitle.padding / 2) + 2, { align: 'right' });
    } else {
      doc.text(`Quote Reference: ${quote.quote_number}`, 14, contentStartY + pdfSettings.documentTitle.padding + 4);
    }
  }

  const detailsY = contentStartY + pdfSettings.documentTitle.padding + (pdfSettings.documentTitle.referencePosition === 'below' && pdfSettings.documentTitle.showReferenceNumber ? 8 : 4);

  const boxBgRgb = hexToRgb(pdfSettings.infoBoxes.backgroundColor);
  const boxBorderRgb = hexToRgb(pdfSettings.infoBoxes.borderColor);
  const labelColorRgb = hexToRgb(pdfSettings.infoBoxes.labelColor);
  const valueColorRgb = hexToRgb(pdfSettings.infoBoxes.valueColor);

  const boxWidth = pdfSettings.infoBoxes.layout === 'side-by-side' ? 90 : 190;
  const box1X = 10;
  const box2X = pdfSettings.infoBoxes.layout === 'side-by-side' ? 110 : 10;
  const box2Y = pdfSettings.infoBoxes.layout === 'side-by-side' ? detailsY : detailsY + 28 + pdfSettings.infoBoxes.boxSpacing;

  doc.setFillColor(boxBgRgb.r, boxBgRgb.g, boxBgRgb.b);
  doc.roundedRect(box1X, detailsY, boxWidth, 28, pdfSettings.infoBoxes.borderRadius, pdfSettings.infoBoxes.borderRadius, 'F');
  doc.setDrawColor(boxBorderRgb.r, boxBorderRgb.g, boxBorderRgb.b);
  doc.setLineWidth(pdfSettings.infoBoxes.borderWidth);
  doc.roundedRect(box1X, detailsY, boxWidth, 28, pdfSettings.infoBoxes.borderRadius, pdfSettings.infoBoxes.borderRadius, 'S');

  doc.setFontSize(pdfSettings.infoBoxes.labelFontSize);
  doc.setTextColor(labelColorRgb.r, labelColorRgb.g, labelColorRgb.b);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.labelFontWeight);
  doc.text('QUOTE DETAILS', box1X + pdfSettings.infoBoxes.padding, detailsY + 6);

  doc.setFontSize(pdfSettings.infoBoxes.valueFontSize);
  doc.setTextColor(valueColorRgb.r, valueColorRgb.g, valueColorRgb.b);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(`Issue Date:`, box1X + pdfSettings.infoBoxes.padding, detailsY + 13);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.valueFontWeight);
  doc.text(`${new Date(quote.created_at).toLocaleDateString()}`, box1X + pdfSettings.infoBoxes.padding + 28, detailsY + 13);

  if (quote.valid_until) {
    doc.setFontSize(pdfSettings.infoBoxes.valueFontSize);
    doc.setTextColor(valueColorRgb.r, valueColorRgb.g, valueColorRgb.b);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Valid Until:`, box1X + pdfSettings.infoBoxes.padding, detailsY + 19);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.valueFontWeight);
    doc.text(`${new Date(quote.valid_until).toLocaleDateString()}`, box1X + pdfSettings.infoBoxes.padding + 28, detailsY + 19);
  }

  doc.setFontSize(pdfSettings.infoBoxes.valueFontSize);
  doc.setTextColor(valueColorRgb.r, valueColorRgb.g, valueColorRgb.b);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(`Status:`, box1X + pdfSettings.infoBoxes.padding, detailsY + 25);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.valueFontWeight);
  doc.setTextColor(59, 130, 246);
  doc.text(quote.status || 'Draft', box1X + pdfSettings.infoBoxes.padding + 28, detailsY + 25);

  doc.setFillColor(boxBgRgb.r, boxBgRgb.g, boxBgRgb.b);
  doc.roundedRect(box2X, box2Y, boxWidth, 28, pdfSettings.infoBoxes.borderRadius, pdfSettings.infoBoxes.borderRadius, 'F');
  doc.setDrawColor(boxBorderRgb.r, boxBorderRgb.g, boxBorderRgb.b);
  doc.setLineWidth(pdfSettings.infoBoxes.borderWidth);
  doc.roundedRect(box2X, box2Y, boxWidth, 28, pdfSettings.infoBoxes.borderRadius, pdfSettings.infoBoxes.borderRadius, 'S');

  doc.setFontSize(pdfSettings.infoBoxes.labelFontSize);
  doc.setTextColor(labelColorRgb.r, labelColorRgb.g, labelColorRgb.b);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.labelFontWeight);
  doc.text('CUSTOMER INFORMATION', box2X + pdfSettings.infoBoxes.padding, box2Y + 6);

  doc.setFontSize(pdfSettings.infoBoxes.valueFontSize + 1);
  doc.setTextColor(valueColorRgb.r, valueColorRgb.g, valueColorRgb.b);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), pdfSettings.infoBoxes.valueFontWeight);
  doc.text(customer.name, box2X + pdfSettings.infoBoxes.padding, box2Y + 13);

  doc.setFontSize(pdfSettings.infoBoxes.valueFontSize);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(customer.phone, box2X + pdfSettings.infoBoxes.padding, box2Y + 19);
  if (customer.email) doc.text(customer.email, box2X + pdfSettings.infoBoxes.padding, box2Y + 25);

  const tableStartY = pdfSettings.infoBoxes.layout === 'side-by-side' ? detailsY + 37 : box2Y + 37;

  if (pdfSettings.sections.showItemsTable) {
    const textPrimaryRgb = hexToRgb(pdfSettings.colors.textPrimary);
    doc.setFontSize(10);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
    doc.text('ITEMS & SPECIFICATIONS', 14, tableStartY);

    const tableHeaders: string[] = [];

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

    const pageHeight = doc.internal.pageSize.getHeight();
    const footerHeightWithMargin = pdfSettings.layout.footerHeight + 15;

    autoTable(doc, {
      startY: tableStartY + 5,
      head: [tableHeaders],
      body: tableData,
      theme: pdfSettings.table.tableStyle as any,
      headStyles: {
        fillColor: [tableHeaderBgRgb.r, tableHeaderBgRgb.g, tableHeaderBgRgb.b],
        textColor: [tableHeaderTextRgb.r, tableHeaderTextRgb.g, tableHeaderTextRgb.b],
        fontSize: pdfSettings.fonts.tableFontSize,
        fontStyle: 'bold',
        halign: pdfSettings.table.headerAlignment as any,
        cellPadding: 2,
      },
      styles: {
        fontSize: pdfSettings.fonts.tableFontSize,
        cellPadding: 2,
        lineColor: [tableBorderRgb.r, tableBorderRgb.g, tableBorderRgb.b],
        lineWidth: 0.1,
        halign: pdfSettings.table.textAlignment as any,
      },
      alternateRowStyles: {
        fillColor: [tableAltRowRgb.r, tableAltRowRgb.g, tableAltRowRgb.b],
      },
      margin: { bottom: footerHeightWithMargin },
      pageBreak: 'auto',
      showHead: 'everyPage',
    });
  }

  let finalY = (doc as any).lastAutoTable.finalY + 8;
  const footerHeightWithMargin = pdfSettings.layout.footerHeight + 15;

  if (finalY > pageHeight - footerHeightWithMargin - 60) {
    doc.addPage();
    finalY = 20;
  }

  const totalChargeableArea = quote.items.reduce((sum: number, item: any) => sum + (item.chargeable_area || 0), 0);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(10, finalY, 70, 10, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(10, finalY, 70, 10, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Total Chargeable Area:', 14, finalY + 6);
  doc.text(`${totalChargeableArea.toFixed(2)} m²`, 75, finalY + 6, { align: 'right' });

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(130, finalY, 70, 48, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(130, finalY, 70, 48, 2, 2, 'S');

  let currentY = finalY + 7;
  doc.setFontSize(8);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', 135, currentY);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${quote.subtotal.toFixed(2)}`, 195, currentY, { align: 'right' });
  currentY += 5;

  if (quote.discount > 0) {
    const discountLabel = quote.discount_type === 'percentage'
      ? `Discount (${quote.discount_value}%)`
      : 'Discount';
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(34, 197, 94);
    doc.text(`${discountLabel}:`, 135, currentY);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`- AED ${quote.discount.toFixed(2)}`, 195, currentY, { align: 'right' });
    currentY += 5;
  }

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('VAT (5%):', 135, currentY);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${quote.vat_amount.toFixed(2)}`, 195, currentY, { align: 'right' });
  currentY += 5;

  if (quote.shipping_amount && quote.shipping_amount > 0) {
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Shipping:', 135, currentY);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`AED ${quote.shipping_amount.toFixed(2)}`, 195, currentY, { align: 'right' });
    currentY += 5;
  } else {
    currentY += 2;
  }

  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.line(135, currentY - 2, 195, currentY - 2);

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(133, currentY - 1, 65, 8, 1, 1, 'F');

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('TOTAL AMOUNT:', 135, currentY + 4);
  doc.setFontSize(11);
  doc.text(`AED ${quote.total.toFixed(2)}`, 195, currentY + 4, { align: 'right' });

  let remarksY = currentY + 12;

  if (quote.remarks) {
    if (remarksY > pageHeight - footerHeightWithMargin - 30) {
      doc.addPage();
      remarksY = 20;
    }

    doc.setFillColor(254, 252, 232);
    doc.roundedRect(10, remarksY, 120, 22, 2, 2, 'F');
    doc.setDrawColor(250, 204, 21);
    doc.roundedRect(10, remarksY, 120, 22, 2, 2, 'S');

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    doc.text('REMARKS & NOTES', 14, remarksY + 5);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 63, 18);
    const splitRemarks = doc.splitTextToSize(quote.remarks, 110);
    doc.text(splitRemarks, 14, remarksY + 10);
    remarksY += 27;
  }

  const termsY = remarksY > currentY + 12 ? remarksY : currentY + 12;

  let adjustedTermsY = termsY;
  if (pdfSettings.terms.showTerms && pdfSettings.sections.showTerms) {
    if (termsY > pageHeight - footerHeightWithMargin - 35) {
      doc.addPage();
      adjustedTermsY = 20;
    }

    if (pdfSettings.terms.termsStyle === 'bordered' || pdfSettings.terms.termsStyle === 'box') {
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(10, adjustedTermsY, 190, 28, 2, 2, 'F');
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(10, adjustedTermsY, 190, 28, 2, 2, 'S');
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 64, 175);
    doc.text(pdfSettings.terms.termsTitle, 14, adjustedTermsY + 6);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(pdfSettings.terms.termsContent, 14, adjustedTermsY + 11);
  }

  if (pdfSettings.footer.showFooter) {
    const totalPages = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - pdfSettings.layout.footerHeight;

      if (pdfSettings.footer.footerStyle === 'gradient') {
        doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

        doc.setDrawColor(255, 255, 255, 0.3);
        doc.setLineWidth(0.3);
        doc.line(10, footerY + 12, 200, footerY + 12);
      } else if (pdfSettings.footer.footerStyle === 'bordered') {
        doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.setLineWidth(1);
        doc.line(10, footerY, 200, footerY);
      }

      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.9);
      doc.text(companyFullName, 105, footerY + 13, { align: 'center' });
      doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 17, { align: 'center' });

      if (pdfSettings.footer.showGenerationDate) {
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255, 0.7);
        doc.text(`Quote generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 22, { align: 'center' });
      }

      if (pdfSettings.footer.showPageNumbers) {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, 200, footerY - 4, { align: 'right' });
      }
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'quote',
    quote.quote_number,
    quote.id,
    quote.total,
    new Date(quote.created_at).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  if (returnDoc) {
    return doc;
  } else {
    doc.save(`Quote_${quote.quote_number}.pdf`);
  }
};

export const exportQuoteToExcel = (quote: any, customer: any) => {
  const totalChargeableArea = quote.items.reduce((sum: number, item: any) => sum + (item.chargeable_area || 0), 0);

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
    ['', '', '', '', '', '', 'Total Chargeable Area:', totalChargeableArea.toFixed(2) + ' m²', ''],
    [],
    ['', '', '', '', '', '', '', 'Subtotal:', quote.subtotal.toFixed(2)],
    ...(quote.discount > 0 ? [['', '', '', '', '', '', '', `Discount${quote.discount_type === 'percentage' ? ` (${quote.discount_value}%)` : ''}:`, `-${quote.discount.toFixed(2)}`]] : []),
    ['', '', '', '', '', '', '', 'VAT (5%):', quote.vat_amount.toFixed(2)],
    ...(quote.shipping_amount && quote.shipping_amount > 0 ? [['', '', '', '', '', '', '', 'Shipping:', quote.shipping_amount.toFixed(2)]] : []),
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

export const exportInvoiceToPDF = async (invoice: any, customer: any, payments: any[], brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.invoices || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(invoice.created_at).toLocaleDateString(),
      invoice.invoice_number,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(10, contentStartY, 190, 12, 2, 2, 'F');

  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(22);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.text('INVOICE', 14, contentStartY + 8);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice Reference: ${invoice.invoice_number}`, 140, contentStartY + 8, { align: 'right' });

  const detailsY = contentStartY + 16;

  if (pdfSettings.sections.showQuoteDetails) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(10, detailsY, 90, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, detailsY, 90, 28, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('INVOICE DETAILS', 14, detailsY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Issue Date:`, 14, detailsY + 13);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${new Date(invoice.created_at).toLocaleDateString()}`, 42, detailsY + 13);

    if (invoice.due_date) {
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.text(`Due Date:`, 14, detailsY + 19);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text(`${new Date(invoice.due_date).toLocaleDateString()}`, 42, detailsY + 19);
    }
  }

  if (pdfSettings.sections.showCustomerInfo) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(110, detailsY, 90, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(110, detailsY, 90, 28, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER INFORMATION', 114, detailsY + 6);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(customer.name, 114, detailsY + 13);

    doc.setFontSize(9);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(customer.phone, 114, detailsY + 19);
    if (customer.email) doc.text(customer.email, 114, detailsY + 25);
  }

  let yPos = detailsY + 37;

  if (pdfSettings.sections.showTotals) {
    const textPrimaryRgb = hexToRgb(pdfSettings.colors.textPrimary);
    doc.setFontSize(10);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(textPrimaryRgb.r, textPrimaryRgb.g, textPrimaryRgb.b);
    doc.text('PAYMENT SUMMARY', 14, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Amount:`, 14, yPos);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`AED ${invoice.total_amount.toFixed(2)}`, 70, yPos);
    yPos += 6;

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Deposit Paid:`, 14, yPos);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text(`AED ${invoice.deposit_paid.toFixed(2)}`, 70, yPos);
    yPos += 6;

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Payment Before Delivery:`, 14, yPos);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`AED ${invoice.payment_before_delivery.toFixed(2)}`, 70, yPos);
    yPos += 8;

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(`Balance Due:`, 14, yPos);
    doc.text(`AED ${invoice.balance.toFixed(2)}`, 70, yPos);
    yPos += 15;
  }

  if (payments && payments.length > 0) {
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Payment History', 14, yPos);

    const paymentData = payments.map((p: any) => [
      new Date(p.payment_date).toLocaleDateString(),
      `AED ${p.amount.toFixed(2)}`,
      p.payment_method,
      p.reference || '-',
    ]);

    const tableHeaderBgRgb = hexToRgb(pdfSettings.colors.tableHeaderBg);
    const tableHeaderTextRgb = hexToRgb(pdfSettings.colors.tableHeaderText);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Date', 'Amount', 'Method', 'Reference']],
      body: paymentData,
      theme: pdfSettings.table.tableStyle as any,
      headStyles: {
        fillColor: [tableHeaderBgRgb.r, tableHeaderBgRgb.g, tableHeaderBgRgb.b],
        textColor: [tableHeaderTextRgb.r, tableHeaderTextRgb.g, tableHeaderTextRgb.b],
        fontSize: pdfSettings.fonts.tableFontSize,
        fontStyle: 'bold',
      },
      styles: { fontSize: pdfSettings.fonts.tableFontSize },
    });
  }

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Invoice generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'invoice',
    invoice.invoice_number,
    invoice.id,
    invoice.total_amount,
    new Date(invoice.created_at).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  doc.save(`Invoice_${invoice.invoice_number}.pdf`);
};

export const exportReceiptToPDF = async (receipt: any, customer: any, invoice: any, brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.invoices || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(receipt.payment_date).toLocaleDateString(),
      receipt.receipt_number,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  doc.setFillColor(34, 197, 94, 0.1);
  doc.roundedRect(10, contentStartY, 190, 12, 2, 2, 'F');

  doc.setTextColor(34, 197, 94);
  doc.setFontSize(22);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.text('PAYMENT RECEIPT', 14, contentStartY + 8);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Receipt #: ${receipt.receipt_number}`, 140, contentStartY + 8, { align: 'right' });

  const detailsY = contentStartY + 16;

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(10, detailsY, 90, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, detailsY, 90, 32, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPT DETAILS', 14, detailsY + 6);

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(`Payment Date:`, 14, detailsY + 13);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.text(`${new Date(receipt.payment_date).toLocaleDateString()}`, 50, detailsY + 13);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(`Payment Time:`, 14, detailsY + 19);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.text(`${new Date(receipt.created_at).toLocaleTimeString()}`, 50, detailsY + 19);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.text(`Payment Method:`, 14, detailsY + 25);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(receipt.payment_method || 'N/A', 50, detailsY + 25);

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(110, detailsY, 90, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, detailsY, 90, 32, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER INFORMATION', 114, detailsY + 6);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.text(customer.name, 114, detailsY + 13);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(customer.phone, 114, detailsY + 19);
  if (customer.email) doc.text(customer.email, 114, detailsY + 25);

  let yPos = detailsY + 40;

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(10, yPos, 190, 12, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(10, yPos, 190, 12, 2, 2, 'S');

  doc.setFontSize(11);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('PAYMENT SUMMARY', 14, yPos + 8);

  yPos += 20;

  doc.setFillColor(250, 250, 251);
  doc.roundedRect(10, yPos, 90, 50, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, yPos, 90, 50, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice Number:`, 14, yPos + 7);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(invoice.invoice_number || 'N/A', 55, yPos + 7);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice Total:`, 14, yPos + 14);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`AED ${receipt.invoice_total.toFixed(2)}`, 55, yPos + 14);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Previous Balance:`, 14, yPos + 21);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.text(`AED ${receipt.previous_balance.toFixed(2)}`, 55, yPos + 21);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 25, 96, yPos + 25);

  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setFontSize(11);
  doc.setTextColor(34, 197, 94);
  doc.text(`Amount Paid:`, 14, yPos + 32);
  doc.setFontSize(13);
  doc.text(`AED ${receipt.amount_paid.toFixed(2)}`, 55, yPos + 32);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 36, 96, yPos + 36);

  doc.setFontSize(11);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(receipt.remaining_balance > 0 ? 220 : 34, receipt.remaining_balance > 0 ? 38 : 197, receipt.remaining_balance > 0 ? 38 : 94);
  doc.text(`Remaining Balance:`, 14, yPos + 43);
  doc.setFontSize(13);
  doc.text(`AED ${receipt.remaining_balance.toFixed(2)}`, 55, yPos + 43);

  doc.setFillColor(34, 197, 94, 0.1);
  doc.roundedRect(110, yPos, 90, 50, 2, 2, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(110, yPos, 90, 50, 2, 2, 'S');

  const statusText = receipt.remaining_balance <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT';
  const statusColor = receipt.remaining_balance <= 0 ? [34, 197, 94] : [245, 158, 11];

  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(114, yPos + 4, 82, 10, 2, 2, 'F');

  doc.setFontSize(12);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, 155, yPos + 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Thank you for your payment!', 155, yPos + 22, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This receipt confirms your payment', 155, yPos + 29, { align: 'center' });
  doc.text('and serves as proof of transaction.', 155, yPos + 34, { align: 'center' });

  if (receipt.payment_reference) {
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Ref: ${receipt.payment_reference}`, 155, yPos + 42, { align: 'center' });
  }

  yPos += 60;

  if (receipt.notes) {
    doc.setFillColor(254, 252, 232);
    doc.roundedRect(10, yPos, 190, 20, 2, 2, 'F');
    doc.setDrawColor(250, 204, 21);
    doc.roundedRect(10, yPos, 190, 20, 2, 2, 'S');

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    doc.text('NOTES', 14, yPos + 5);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 63, 18);
    const splitNotes = doc.splitTextToSize(receipt.notes, 180);
    doc.text(splitNotes, 14, yPos + 11);
    yPos += 25;
  }

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Receipt generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'receipt',
    receipt.receipt_number,
    receipt.id,
    receipt.amount_paid,
    new Date(receipt.payment_date).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  doc.save(`Receipt_${receipt.receipt_number}.pdf`);
};

export const exportOrderToPDF = async (order: any, customer: any, brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.invoices || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(order.created_at).toLocaleDateString(),
      order.order_number,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(10, contentStartY, 190, 12, 2, 2, 'F');

  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(22);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.text('ORDER CONFIRMATION', 14, contentStartY + 8);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Order Number: ${order.order_number}`, 140, contentStartY + 8, { align: 'right' });

  const detailsY = contentStartY + 16;

  if (pdfSettings.sections.showQuoteDetails) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(10, detailsY, 90, 34, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, detailsY, 90, 34, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ORDER DETAILS', 14, detailsY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Order Date:`, 14, detailsY + 13);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${new Date(order.order_date).toLocaleDateString()}`, 42, detailsY + 13);

    if (order.delivery_date) {
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.text(`Delivery:`, 14, detailsY + 19);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.text(`${new Date(order.delivery_date).toLocaleDateString()}`, 42, detailsY + 19);
    }

    if (order.installation_date) {
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.text(`Installation:`, 14, detailsY + 25);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.text(`${new Date(order.installation_date).toLocaleDateString()}`, 42, detailsY + 25);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Status:`, 14, detailsY + 31);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(order.status, 42, detailsY + 31);
  }

  if (pdfSettings.sections.showCustomerInfo) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(110, detailsY, 90, 34, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(110, detailsY, 90, 34, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER INFORMATION', 114, detailsY + 6);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(customer.name, 114, detailsY + 13);

    doc.setFontSize(9);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(customer.phone, 114, detailsY + 19);
    if (customer.email) doc.text(customer.email, 114, detailsY + 25);
    if (customer.location) doc.text(customer.location, 114, detailsY + 31);
  }

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Order confirmation generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'order',
    order.order_number,
    order.id,
    0,
    new Date(order.order_date).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  doc.save(`Order_${order.order_number}.pdf`);
};

export const exportWarrantyToPDF = async (warranty: any, order: any, brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.invoices || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(warranty.start_date).toLocaleDateString(),
      warranty.warranty_number,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(10, contentStartY, 190, 12, 2, 2, 'F');

  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(22);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.text('WARRANTY CERTIFICATE', 14, contentStartY + 8);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Warranty Number: ${warranty.warranty_number}`, 140, contentStartY + 8, { align: 'right' });

  const detailsY = contentStartY + 16;

  if (pdfSettings.sections.showQuoteDetails) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(10, detailsY, 90, 40, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, detailsY, 90, 40, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('WARRANTY DETAILS', 14, detailsY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Product:`, 14, detailsY + 13);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${warranty.product_name}`, 35, detailsY + 13);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Start Date:`, 14, detailsY + 19);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${new Date(warranty.start_date).toLocaleDateString()}`, 35, detailsY + 19);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`End Date:`, 14, detailsY + 25);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${new Date(warranty.end_date).toLocaleDateString()}`, 35, detailsY + 25);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Coverage:`, 14, detailsY + 31);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(warranty.coverage_type || 'Standard', 35, detailsY + 31);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Status:`, 14, detailsY + 37);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(warranty.status, 35, detailsY + 37);
  }

  if (pdfSettings.sections.showCustomerInfo && order) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(110, detailsY, 90, 40, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(110, detailsY, 90, 40, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ORDER INFORMATION', 114, detailsY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Order Number:`, 114, detailsY + 13);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(order.order_number || 'N/A', 114, detailsY + 19);

    if (order.customer_name) {
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.text(`Customer:`, 114, detailsY + 25);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.text(order.customer_name, 114, detailsY + 31);
    }
  }

  const termsY = detailsY + 50;
  doc.setFontSize(10);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('WARRANTY TERMS & CONDITIONS', 14, termsY);

  doc.setFontSize(8);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  const terms = warranty.terms || 'This warranty covers manufacturing defects and material failures under normal use conditions. It does not cover damage from improper installation, misuse, or normal wear and tear.';
  const splitTerms = doc.splitTextToSize(terms, 182);
  doc.text(splitTerms, 14, termsY + 8);

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Warranty certificate generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'warranty',
    warranty.warranty_number,
    warranty.id,
    0,
    new Date(warranty.start_date).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  doc.save(`Warranty_${warranty.warranty_number}.pdf`);
};

export const exportSiteVisitToPDF = async (visit: any, customer: any, brand?: any) => {
  const doc = new jsPDF();

  const pdfSettings = brand?.pdfSettings?.invoices || getDefaultPDFSettings();
  const companyName = brand?.company?.name || 'BYLROS';
  const companyFullName = brand?.company?.fullName || 'Middle East Aluminium & Glass LLC';
  const companyAddress = brand?.contact?.address?.fullAddress || 'Costra Business Park (Block B), Production City, Dubai, UAE';
  const companyPhone = brand?.contact?.phone || '+971-52-5458-968';
  const companyEmail = brand?.contact?.email || 'info@bylros.ae';
  const tagline = brand?.company?.tagline || 'Premium Glass & Aluminum Solutions';

  const primaryRgb = hexToRgb(pdfSettings.colors.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  if (pdfSettings.watermark.enableWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(pdfSettings.watermark.watermarkFontSize);
    doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
    doc.text(pdfSettings.watermark.watermarkText, pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: pdfSettings.watermark.watermarkAngle,
    });
    doc.setGState(new (doc as any).GState({ opacity: pdfSettings.watermark.watermarkOpacity }));
    doc.restoreGraphicsState();
  }

  let contentStartY = 62;

  if (pdfSettings.header.showHeader && pdfSettings.header.headerStyle === 'letterhead') {
    contentStartY = await addLetterheadHeader(
      doc,
      brand,
      new Date(visit.visit_date).toLocaleDateString(),
      `SV-${visit.id.substring(0, 8)}`,
      pdfSettings
    );
  } else if (pdfSettings.header.showHeader) {
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, 210, pdfSettings.layout.headerHeight, 'F');

    await addLogoToPDF(doc, pdfSettings, brand);

    if (pdfSettings.header.headerStyle === 'gradient') {
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(14, pdfSettings.layout.headerHeight - 3, 196, pdfSettings.layout.headerHeight - 3);
    }

    if (pdfSettings.header.showCompanyInfo) {
      const headerTextRgb = hexToRgb(pdfSettings.header.headerTextColor);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b);
      doc.setFontSize(32);
      doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
      doc.text(companyName, 14, 22);

      if (pdfSettings.header.showTagline) {
        doc.setFontSize(9);
        doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
        doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.9);
        doc.text(tagline, 14, 29);
      }

      doc.setFontSize(8);
      doc.setTextColor(headerTextRgb.r, headerTextRgb.g, headerTextRgb.b, 0.85);
      doc.text(companyFullName, 14, 37);
      doc.text(companyAddress, 14, 42);
      doc.text(`${companyPhone} | ${companyEmail}`, 14, 47);
    }
  }

  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  doc.roundedRect(10, contentStartY, 190, 12, 2, 2, 'F');

  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setFontSize(22);
  doc.setFont(getFontFamily(pdfSettings.fonts.headerFont), 'bold');
  doc.text('SITE VISIT REPORT', 14, contentStartY + 8);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Visit ID: SV-${visit.id.substring(0, 8)}`, 140, contentStartY + 8, { align: 'right' });

  const detailsY = contentStartY + 16;

  if (pdfSettings.sections.showQuoteDetails) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(10, detailsY, 90, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, detailsY, 90, 28, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('VISIT DETAILS', 14, detailsY + 6);

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Visit Date:`, 14, detailsY + 13);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(`${new Date(visit.visit_date).toLocaleDateString()}`, 42, detailsY + 13);

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.text(`Status:`, 14, detailsY + 19);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text(visit.status || 'Scheduled', 42, detailsY + 19);

    if (visit.payment_required) {
      doc.setTextColor(30, 41, 59);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
      doc.text(`Amount:`, 14, detailsY + 25);
      doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
      doc.text(`AED ${visit.payment_amount?.toFixed(2) || '0.00'}`, 42, detailsY + 25);
    }
  }

  if (pdfSettings.sections.showCustomerInfo) {
    doc.setFillColor(250, 250, 251);
    doc.roundedRect(110, detailsY, 90, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(110, detailsY, 90, 28, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER INFORMATION', 114, detailsY + 6);

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.text(customer.name, 114, detailsY + 13);

    doc.setFontSize(9);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(customer.phone, 114, detailsY + 19);
    if (customer.email) doc.text(customer.email, 114, detailsY + 25);
  }

  const locationY = detailsY + 36;
  doc.setFontSize(10);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('VISIT LOCATION', 14, locationY);

  doc.setFontSize(9);
  doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
  doc.setTextColor(71, 85, 105);
  const location = visit.location || customer.location || 'Not specified';
  const splitLocation = doc.splitTextToSize(location, 182);
  doc.text(splitLocation, 14, locationY + 8);

  if (visit.remarks) {
    const remarksY = locationY + 20;
    doc.setFontSize(10);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('REMARKS', 14, remarksY);

    doc.setFontSize(9);
    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setTextColor(71, 85, 105);
    const splitRemarks = doc.splitTextToSize(visit.remarks, 182);
    doc.text(splitRemarks, 14, remarksY + 8);
  }

  if (pdfSettings.footer.showFooter) {
    const footerY = 270;

    if (pdfSettings.footer.footerStyle === 'gradient') {
      doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.rect(0, footerY, 210, pdfSettings.layout.footerHeight, 'F');

      doc.setDrawColor(255, 255, 255, 0.3);
      doc.setLineWidth(0.3);
      doc.line(10, footerY + 12, 200, footerY + 12);
    } else if (pdfSettings.footer.footerStyle === 'bordered') {
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(1);
      doc.line(10, footerY, 200, footerY);
    }

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfSettings.footer.footerText, 105, footerY + 8, { align: 'center' });

    doc.setFont(getFontFamily(pdfSettings.fonts.bodyFont), 'normal');
    doc.setFontSize(pdfSettings.fonts.footerFontSize);
    doc.setTextColor(255, 255, 255, 0.9);
    doc.text(companyFullName, 105, footerY + 14, { align: 'center' });
    doc.text(`${companyPhone} | ${companyEmail}`, 105, footerY + 19, { align: 'center' });

    if (pdfSettings.footer.showGenerationDate) {
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.7);
      doc.text(`Site visit report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, footerY + 24, { align: 'center' });
    }
  }

  const lastPage = doc.internal.pages.length - 1;
  doc.setPage(lastPage);
  const qrFooterY = pageHeight - pdfSettings.layout.footerHeight;
  const qrSize = 28;
  const qrYPosition = qrFooterY - qrSize - 8;

  await addQRCodeToPDF(
    doc,
    'sitevisit',
    `SV-${visit.id.substring(0, 8)}`,
    visit.id,
    visit.payment_amount || 0,
    new Date(visit.visit_date).toLocaleDateString(),
    10,
    qrYPosition,
    qrSize
  );

  doc.save(`SiteVisit_${visit.id.substring(0, 8)}.pdf`);
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
