const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance && config.razorpay.keyId && config.razorpay.keySecret) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return razorpayInstance;
}

async function createOrder(amount, currency = 'INR', receipt) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  return razorpay.orders.create({
    amount: amount * 100,
    currency,
    receipt,
  });
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = { getRazorpay, createOrder, verifyPaymentSignature };
