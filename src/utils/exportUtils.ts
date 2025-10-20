import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportQuoteToPDF = (quote: any, customer: any) => {
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
  doc.text('QUOTATION', 14, 60);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quote #: ${quote.quote_number}`, 14, 70);
  doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, 14, 76);
  if (quote.valid_until) {
    doc.text(`Valid Until: ${new Date(quote.valid_until).toLocaleDateString()}`, 14, 82);
  }

  doc.text(`Customer: ${customer.name}`, 140, 70);
  doc.text(`Phone: ${customer.phone}`, 140, 76);
  if (customer.email) doc.text(`Email: ${customer.email}`, 140, 82);
  if (customer.location) doc.text(`Location: ${customer.location}`, 140, 88);

  const tableData = quote.items.map((item: any) => [
    item.location || '',
    item.type || '',
    item.height || '',
    item.width || '',
    item.qty || 0,
    item.area?.toFixed(2) || '0.00',
    item.chargeable_area?.toFixed(2) || item.area?.toFixed(2) || '0.00',
    `AED ${item.unit_price?.toFixed(2) || '0.00'}`,
    `AED ${item.total?.toFixed(2) || '0.00'}`,
  ]);

  autoTable(doc, {
    startY: 100,
    head: [['Location', 'Type', 'H', 'W', 'Qty', 'Area', 'Charge', 'Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [187, 39, 56], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  let currentY = finalY;
  doc.setFontSize(10);
  doc.text(`Subtotal: AED ${quote.subtotal.toFixed(2)}`, 140, currentY);
  currentY += 6;

  if (quote.discount > 0) {
    const discountLabel = quote.discount_type === 'percentage'
      ? `Discount (${quote.discount_value}%)`
      : 'Discount';
    doc.setTextColor(34, 197, 94);
    doc.text(`${discountLabel}: -AED ${quote.discount.toFixed(2)}`, 140, currentY);
    doc.setTextColor(0, 0, 0);
    currentY += 6;
  }

  doc.text(`VAT (5%): AED ${quote.vat_amount.toFixed(2)}`, 140, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total: AED ${quote.total.toFixed(2)}`, 140, currentY);

  if (quote.remarks) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Remarks:', 14, currentY + 14);
    const splitRemarks = doc.splitTextToSize(quote.remarks, 180);
    doc.text(splitRemarks, 14, currentY + 20);
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('BYLROS Middle East Aluminium & Glass LLC', 105, 285, { align: 'center' });

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
