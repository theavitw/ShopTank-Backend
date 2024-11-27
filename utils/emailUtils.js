/* eslint-disable no-console */
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config(); // Load environment variables from .env

// Function to create transporter with SMTP authentication
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com' for Gmail
      port: process.env.SMTP_PORT, // e.g., 465 for SSL or 587 for TLS
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('Failed to create SMTP transporter:', error);
    throw error;
  }
};


// Wrapper to send email using a promise
export const wrapedAsyncSendMail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`Error occurred while sending email: ${error.message}`);
    return false;
  }
};

// Function to send OTP email
export const emailOTP = async (otp, email) => {
  const mailOptions = {
    from: `"ShoppersStop" <${process.env.SMTP_MAIL}>`,
    to: email,
    subject: 'Your Verification OTP for ShoppersStop',
    text: `Thanks for registering on ShoppersStop. Your OTP is ${otp}.`,
    html: `<h1>Your OTP is ${otp}</h1><p>Use this OTP to verify your email and complete the registration process.</p>`,
  };

  const response = await wrapedAsyncSendMail(mailOptions);
  return response;
};
