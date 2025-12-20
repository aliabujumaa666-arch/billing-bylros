export const generateQRCode = async (data: string, size: number = 200): Promise<string> => {
  try {
    const QRCode = await import('qrcode');

    const qrDataUrl = await QRCode.default.toDataURL(data, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
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

    const qrCodeDataUrl = await generateQRCode(verificationData, size * 4);

    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', xPos, yPos, size, size);

      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan to verify', xPos + size / 2, yPos + size + 3, { align: 'center' });
    }
  } catch (error) {
    console.warn('Failed to add QR code to PDF:', error);
  }
};
