import React, { forwardRef } from 'react';
import { useReactToPrint } from 'react-to-print';

const ReceiptPrinter = forwardRef(({ receiptData }, ref) => {
  if (!receiptData) return null;

  return (
    <div ref={ref} className="receipt-container">
      <div className="receipt-header">
        <h2>{receiptData.branch.branch_name}</h2>
        <p>{receiptData.branch.location}</p>
      </div>
      
      <div className="receipt-details">
        <p>Receipt: {receiptData.receipt_number}</p>
        <p>Date: {new Date(receiptData.transaction_date).toLocaleString()}</p>
        <p>Cashier: {receiptData.cashier.first_name} {receiptData.cashier.last_name}</p>
        {receiptData.customer && (
          <p>Customer: {receiptData.customer.first_name} {receiptData.customer.last_name}</p>
        )}
      </div>
      
      <div className="receipt-items">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {receiptData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>${item.unit_price.toFixed(2)}</td>
                <td>${item.total_price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>${receiptData.total_amount.toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Tax:</span>
          <span>${(receiptData.total_amount * 0.08).toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Payment Method:</span>
          <span>{receiptData.payment_method}</span>
        </div>
        <div className="total-row grand-total">
          <span>Total:</span>
          <span>${(receiptData.total_amount * 1.08).toFixed(2)}</span>
        </div>
      </div>
      
      <div className="receipt-footer">
        <p>Thank you for your business!</p>
      </div>
    </div>
  );
});

export const usePrintReceipt = (receiptRef) => {
  return useReactToPrint({
    content: () => receiptRef.current,
    pageStyle: `
      @media print {
        body { 
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 10px;
        }
        .receipt-container {
          width: 80mm;
          margin: 0 auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 4px;
          text-align: left;
        }
      }
    `,
    removeAfterPrint: true
  });
};

export default ReceiptPrinter;