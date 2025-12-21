export const generateQRCode = async (data: string, size: number = 200): Promise<string> => {
  try {
    const QRCode = await import('qrcode');

    const qrDataUrl = await QRCode.default.toDataURL(data, {
      width: size,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const generateDocumentVerificationData = (
  documentType: string,
  documentNumber: string,
  documentId: string,
  total: number,
  date: string
): string => {
  const verificationUrl = `${window.location.origin}/verify/${documentType}/${documentId}`;

  const verificationData = {
    type: documentType,
    number: documentNumber,
    id: documentId,
    total: total.toFixed(2),
    date,
    url: verificationUrl,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(verificationData);
};

export const addQRCodeToPDF = async (
  doc: any,
  documentType: string,
  documentNumber: string,
  documentId: string,
  total: number,
  date: string,
  xPos: number = 170,
  yPos: number = 10,
  size: number = 30
): Promise<void> => {
  try {
    const verificationData = generateDocumentVerificationData(
      documentType,
      documentNumber,
      documentId,
      total,
      date
    );

    const qrCodeDataUrl = await generateQRCode(verificationData, size * 6);

    if (qrCodeDataUrl) {
      const padding = 3;
      const boxWidth = size + (padding * 2);
      const boxHeight = size + (padding * 2) + 8;

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(xPos - padding, yPos - padding, boxWidth, boxHeight, 1.5, 1.5, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPos - padding, yPos - padding, boxWidth, boxHeight, 1.5, 1.5, 'S');

      doc.addImage(qrCodeDataUrl, 'PNG', xPos, yPos, size, size);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('SCAN TO VERIFY', xPos + size / 2, yPos + size + 5, { align: 'center' });
    }
  } catch (error) {
    console.warn('Failed to add QR code to PDF:', error);
  }
};
