const getPaymentInfo = () => ({
  bank_bca: process.env.BANK_BCA || '1234567890',
  bank_mandiri: process.env.BANK_MANDIRI || '0987654321',
  bank_bri: process.env.BANK_BRI || '1122334455',
  account_name: process.env.BANK_ACCOUNT_NAME || 'Matcha Store Indonesia',
});
const getWhatsAppLink = (orderNumber) =>
  `https://wa.me/${process.env.WHATSAPP_NUMBER}?text=Halo+admin%2C+saya+sudah+transfer+untuk+order+%23${orderNumber}`;
module.exports = { getPaymentInfo, getWhatsAppLink };
