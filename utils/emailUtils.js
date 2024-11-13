/* eslint-disable no-undef */
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  

  sendMail: true,
  host: process.env.SMTP_HOST,
  secure: false,
  port: process.env.SMTP_PORT,
  auth: {
    user: `${process.env.SMTP_MAIL}`,
    pass: `${process.env.SMTP_PASSWORD}`,
  },
});
const sendMail = async (mailObject) => {
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: mailObject.to,
    subject: mailObject.subject,
    text: mailObject.text,
    html: mailObject.html,
  };

  try {
    await transporter.sendMail(mailOptions, (err, res) => res);
  } catch (err) {
    console.log("Error ::", err?.message);
    return err;
  }
};
export const wrapedAsyncSendMail = (mailOptions) =>
  new Promise((resolve) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`error is ${error}`);
        resolve(false);
      } else {
        console.log(`Email sent: ${info.response}`);
        resolve(true);
      }
    });
  });
export const emailOTP = async (otp , email) => {
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Your Verification OTP to ShoppersStop",
    text: "Thanks for Registering on ShoppersStop",
    html: `
        <h1>Your OTP is ${otp}</h1>`,
  };
  const resp = await wrapedAsyncSendMail(mailOptions);
  return resp;
};
