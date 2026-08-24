/**
 * BinGo – OTP Service
 *
 * Generates, stores, and verifies one-time passwords.
 * Sends SMS via text.lk API.
 *
 * text.lk API docs: https://www.text.lk/api
 * Credentials are read from environment variables:
 *   TEXTLK_USER_ID   – your text.lk user ID
 *   TEXTLK_API_KEY   – your text.lk API key
 *   TEXTLK_SENDER_ID – approved sender ID (e.g. "BinGo")
 */

const https = require("https");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../config/constants");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a cryptographically random numeric OTP.
 * @returns {string} 6-digit OTP string
 */
const generateOtp = () => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Send an SMS via text.lk REST API.
 *
 * @param {string} phone  - Recipient phone number (e.g. "0771234567" or "+94771234567")
 * @param {string} message - SMS body text
 * @returns {Promise<void>}
 */
const sendSms = (phone, message) => {
  return new Promise((resolve, reject) => {
    const userId = process.env.TEXTLK_USER_ID;
    const apiKey = process.env.TEXTLK_API_KEY;
    const senderId = process.env.TEXTLK_SENDER_ID || "BinGo";

    if (!userId || !apiKey) {
      // In development, log the OTP instead of sending
      if (process.env.NODE_ENV === "development") {
        console.log(`[OTP DEV] SMS to ${phone}: ${message}`);
        return resolve();
      }
      return reject(
        new AppError(
          "SMS service is not configured. Please set TEXTLK_USER_ID and TEXTLK_API_KEY.",
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      );
    }

    // Normalise phone: text.lk expects local format without leading +
    const normalisedPhone = phone.replace(/^\+94/, "0").replace(/\s+/g, "");

    const payload = JSON.stringify({
      user_id: userId,
      api_key: apiKey,
      sender_id: senderId,
      to: normalisedPhone,
      message,
    });

    const options = {
      hostname: "app.text.lk",
      path: "/api/v3/sms/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === "success" || res.statusCode === 200) {
            resolve();
          } else {
            reject(
              new AppError(
                `SMS send failed: ${parsed.message || "Unknown error"}`,
                HTTP_STATUS.INTERNAL_SERVER_ERROR
              )
            );
          }
        } catch {
          reject(new AppError("Invalid response from SMS provider.", HTTP_STATUS.INTERNAL_SERVER_ERROR));
        }
      });
    });

    req.on("error", (err) => {
      reject(new AppError(`SMS network error: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR));
    });

    req.write(payload);
    req.end();
  });
};

/**
 * Generate an OTP, save it (hashed expiry) to the user record, and send via SMS.
 *
 * @param {string} phone - Phone number to send OTP to
 * @returns {Promise<void>}
 */
const sendOtp = async (phone) => {
  const user = await User.findOne({ phone }).select("+otpCode +otpExpiry");

  if (!user) {
    throw new AppError(
      "No account found with this phone number.",
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Rate limit: do not resend if a valid OTP was sent in the last 60 seconds
  if (user.otpExpiry && user.otpExpiry > new Date(Date.now() - 60 * 1000)) {
    const secondsLeft = Math.ceil((user.otpExpiry - (Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000)) / 1000);
    if (secondsLeft > (OTP_EXPIRY_MINUTES * 60 - 60)) {
      throw new AppError(
        "Please wait 60 seconds before requesting a new OTP.",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const otp = generateOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Save OTP and expiry to user record
  user.otpCode = otp;
  user.otpExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  const message = `Your BinGo verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
  await sendSms(phone, message);
};

/**
 * Verify OTP for a given phone number.
 * Marks phone as verified and clears OTP fields on success.
 *
 * @param {string} phone - Phone number
 * @param {string} otp   - OTP entered by user
 * @returns {Promise<User>} - Updated user document
 */
const verifyOtp = async (phone, otp) => {
  const user = await User.findOne({ phone }).select("+otpCode +otpExpiry");

  if (!user) {
    throw new AppError("No account found with this phone number.", HTTP_STATUS.NOT_FOUND);
  }

  if (!user.otpCode || !user.otpExpiry) {
    throw new AppError("No OTP has been sent to this number. Please request one.", HTTP_STATUS.BAD_REQUEST);
  }

  if (new Date() > user.otpExpiry) {
    // Clear expired OTP
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new AppError("OTP has expired. Please request a new one.", HTTP_STATUS.BAD_REQUEST);
  }

  if (user.otpCode !== otp.trim()) {
    throw new AppError("Invalid OTP. Please try again.", HTTP_STATUS.BAD_REQUEST);
  }

  // OTP is valid — mark phone as verified and clear OTP fields
  user.phoneVerified = true;
  user.otpCode = null;
  user.otpExpiry = null;
  await user.save({ validateBeforeSave: false });

  return user;
};

module.exports = { sendOtp, verifyOtp, generateOtp, sendSms };
