const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Generate Excel report
exports.generateExcel = async (transactions) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  // Add headers
  worksheet.columns = [
    { header: 'Transaction ID', key: 'transaction_id', width: 15 },
    { header: 'Receipt #', key: 'receipt_number', width: 15 },
    { header: 'Date', key: 'transaction_date', width: 20 },
    { header: 'Branch', key: 'branch_name', width: 20 },
    { header: 'Customer', key: 'customer_name', width: 25 },
    { header: 'Payment Method', key: 'payment_method', width: 15 },
    { header: 'Total Amount', key: 'total_amount', width: 15, style: { numFmt: '₱#,##0.00' } },
    { header: 'Amount Tendered', key: 'amount_tendered', width: 15, style: { numFmt: '₱#,##0.00' } },
    { header: 'Change', key: 'change_amount', width: 15, style: { numFmt: '₱#,##0.00' } },
    { header: 'Cashier', key: 'cashier_name', width: 20 },
    { header: 'GCash Reference', key: 'gcash_reference', width: 20 }
  ];

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Add data rows
  transactions.forEach(transaction => {
    worksheet.addRow({
      transaction_id: transaction.transaction_id,
      receipt_number: transaction.receipt_number,
      transaction_date: formatDate(transaction.transaction_date),
      branch_name: transaction.branch_name,
      customer_name: transaction.customer_name || 'Walk-in Customer',
      payment_method: transaction.payment_method,
      total_amount: transaction.total_amount,
      amount_tendered: transaction.amount_tendered,
      change_amount: transaction.change_amount,
      cashier_name: transaction.cashier_name,
      gcash_reference: transaction.gcash_reference || 'N/A'
    });
  });

  // Style header row
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Generate Excel file in memory
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// Generate PDF report
exports.generatePDF = async (transactions) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Add title
    doc.fontSize(16).text('Transaction Report', { align: 'center' });
    doc.moveDown();

    // Add report date
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();

    // Add table headers
    const headers = [
      'ID', 'Receipt', 'Date', 'Branch', 'Customer', 
      'Payment', 'Total', 'Tendered', 'Change', 'Cashier', 'GCash Ref'
    ];
    const columnWidths = [30, 50, 80, 80, 100, 60, 60, 60, 60, 80, 80];
    const rowHeight = 20;
    const startY = doc.y;

    // Draw table headers
    doc.font('Helvetica-Bold');
    let x = doc.x;
    headers.forEach((header, i) => {
      doc.text(header, x, startY, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    doc.moveDown();

    // Draw table rows
    doc.font('Helvetica');
    transactions.forEach(transaction => {
      const row = [
        transaction.transaction_id,
        transaction.receipt_number,
        new Date(transaction.transaction_date).toLocaleString(),
        transaction.branch_name,
        transaction.customer_name || 'Walk-in',
        transaction.payment_method,
        `₱${transaction.total_amount.toFixed(2)}`,
        `₱${transaction.amount_tendered.toFixed(2)}`,
        `₱${transaction.change_amount.toFixed(2)}`,
        transaction.cashier_name,
        transaction.gcash_reference || 'N/A'
      ];

      x = doc.x;
      row.forEach((cell, i) => {
        doc.text(cell, x, doc.y, { width: columnWidths[i], align: 'left' });
        x += columnWidths[i];
      });
      doc.moveDown();
    });

    doc.end();
  });
};