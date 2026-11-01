import { supabase } from './supabase';

interface EmailTemplateData {
  customerName: string;
  customerEmail: string;
  orderRef: string;
  orderType: string;
  products: Array<{
    product_name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;
  totalAmount: number;
  orderDate: string;
}

export const sendOrderEmail = async (
  to: string,
  subject: string,
  templateData: EmailTemplateData
): Promise<boolean> => {
  try {
    const htmlTemplate = generateEmailTemplate(templateData);

    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html: htmlTemplate },
    });

    if (error) {
      console.error('Email: edge function error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email: send failed:', error);
    return false;
  }
};

const generateEmailTemplate = (data: EmailTemplateData): string => {
  const { customerName, orderRef, orderType, products, totalAmount, orderDate } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 10px; color: #666; font-size: 0.9em; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .total { font-weight: bold; text-align: right; }
    .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MNS-Traders Order Confirmation</h1>
    </div>
    <div class="content">
      <p>Dear ${customerName},</p>
      <p>Thank you for your ${orderType === 'order' ? 'order' : 'quotation request'}! We have received it and will process it shortly.</p>

      <h2>Order Details</h2>
      <p><strong>Order Reference:</strong> ${orderRef}</p>
      <p><strong>Order Type:</strong> ${orderType === 'order' ? 'Order' : 'Quotation'}</p>
      <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>

      <h3>Products</h3>
      <table>
        <thead>
          <tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${products
            .map(
              (product) => `
            <tr>
              <td>${product.product_name}</td>
              <td>${product.size || '-'}</td>
              <td>${product.quantity}</td>
              <td>₹${product.price.toFixed(2)}</td>
              <td>₹${(product.price * product.quantity).toFixed(2)}</td>
            </tr>`
            )
            .join('')}
          <tr class="total"><td colspan="4">Total:</td><td>₹${totalAmount.toFixed(2)}</td></tr>
        </tbody>
      </table>

      <p>We will notify you once your ${orderType === 'order' ? 'order' : 'quotation'} has been processed.</p>
      <p>Thank you for shopping with MNS-Traders!</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MNS-Traders. All rights reserved.</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
};
