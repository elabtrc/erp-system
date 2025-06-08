import { jsPDF } from 'jspdf';

const generatePayslipPDF = (employeeData) => {
  const { employee_name, employee_id, gross_pay, deductions, net_pay, cutoff_end } = employeeData;

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text('Employee Payslip', 20, 20);

  // Add employee information
  doc.setFontSize(12);
  doc.text(`Employee Name: ${employee_name}`, 20, 30);
  const formattedDate = new Date(cutoff_end).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Pay Period: ${formattedDate}`, 20, 40);

  // Add payroll details
  doc.text(`Gross Income: ₱${gross_pay}`, 20, 50);
  doc.text(`Deductions: ₱${deductions}`, 20, 60);
  doc.text(`Net Income: ₱${net_pay}`, 20, 70);

  // Add received payment by (with underline space)
  doc.text('Received Payment by: _______________________', 20, 80);

  // Save the PDF
  doc.save(`Payslip_${employee_name}.pdf`);
};

export default generatePayslipPDF;