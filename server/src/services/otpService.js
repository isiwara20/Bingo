/**
 * BinGo – OTP Service
 *
 * Generates, stores, and verifies one-time passwords.
 * Sends OTP via WhatsApp using WAClient Web API.
 *
 * WAClient API: https://api.waclient.com/send
 * Credentials are read from environment variables:
 *   WACLIENT_INSTANCE_ID  – your WAClient instance ID
 *   WACLIENT_ACCESS_TOKEN – your WAClient access token
 *
 * In development, if credentials are not set, OTP is printed to console.
 */

const https = require("https");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { HTTP_STATUS } = require("../config/constants");

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

// ── OTP Generator ─────────────────────────────────────────────────────────────
const generateOtp = () => {
  // Use crypto for secure random generation
  const { randomInt } = require("crypto");
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += randomInt(0, 10).toString();
  }
  return otp;
};

// ── Normalise WhatsApp number ─────────────────────────────────────────────────
// WAClient expects international format digits only, e.g. 94771234567
const normaliseWhatsAppNumber = (number) => {
  let n = number.replace(/[\s\-\(\)]/g, ""); // strip spaces, dashes, brackets
  if (n.startsWith("+")) n = n.slice(1);      // remove leading +
  // Sri Lanka: 07x → 947x
  if (n.startsWith("0") && n.length === 10) {
    n = "94" + n.slice(1);
  }
  return n;
};

// ── Send WhatsApp message via WAClient ────────────────────────────────────────
const sendWhatsApp = (whatsappNumber, message, { requireDelivery = false } = {}) => {
  return new Promise((resolve, reject) => {
    const instanceId   = process.env.WACLIENT_INSTANCE_ID;
    const accessToken  = process.env.WACLIENT_ACCESS_TOKEN;

    if (!instanceId || !accessToken) {
      if (process.env.NODE_ENV === "development" && !requireDelivery) {
        console.log(`\n[OTP DEV] WhatsApp to ${whatsappNumber}:\n${message}\n`);
        return resolve();
      }
      return reject(
        new AppError(
          "WhatsApp service is not configured. Please set WACLIENT_INSTANCE_ID and WACLIENT_ACCESS_TOKEN.",
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      );
    }

    const normalisedNumber = normaliseWhatsAppNumber(whatsappNumber);

    const payload = JSON.stringify({
      number:       normalisedNumber,
      type:         "text",
      message,
      instance_id:  instanceId,
      access_token: accessToken,
    });

    const options = {
      hostname: "api.waclient.com",
      path:     "/send",
      method:   "POST",
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.status === "success") {
            resolve();
          } else {
            reject(
              new AppError(
                `WhatsApp send failed: ${parsed.message || "Unknown error"}`,
                HTTP_STATUS.INTERNAL_SERVER_ERROR
              )
            );
          }
        } catch {
          reject(new AppError("Invalid response from WAClient.", HTTP_STATUS.INTERNAL_SERVER_ERROR));
        }
      });
    });

    req.on("error", (err) => {
      reject(new AppError(`WhatsApp network error: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR));
    });

    req.setTimeout(15000, () => req.destroy(new Error("WhatsApp request timed out.")));
    req.write(payload);
    req.end();
  });
};

// ── Send OTP ──────────────────────────────────────────────────────────────────
/**
 * Generate an OTP, save it to the user record, and send via WhatsApp.
 *
 * @param {string} whatsappNumber - WhatsApp number (any format)
 * @returns {Promise<void>}
 */
const sendOtp = async (whatsappNumber) => {
  // Find user by whatsappNumber field
  const user = await User.findOne({ whatsappNumber }).select("+otpCode +otpExpiry");

  if (!user) {
    throw new AppError(
      "No account found with this WhatsApp number.",
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Rate limit: block resend within 60 seconds
  if (user.otpExpiry) {
    const sentAt = user.otpExpiry.getTime() - OTP_EXPIRY_MINUTES * 60 * 1000;
    const secondsSinceSent = (Date.now() - sentAt) / 1000;
    if (secondsSinceSent < 60) {
      throw new AppError(
        `Please wait ${Math.ceil(60 - secondsSinceSent)} seconds before requesting a new OTP.`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  const otp    = generateOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otpCode   = otp;
  user.otpExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  const message =
    `🔐 *BinGo Verification Code*\n\n` +
    `Your OTP is: *${otp}*\n\n` +
    `Valid for ${OTP_EXPIRY_MINUTES} minutes.\n` +
    `Do not share this code with anyone.`;

  await sendWhatsApp(whatsappNumber, message);
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
/**
 * Verify OTP for a given WhatsApp number.
 * Marks whatsappVerified as true and clears OTP fields on success.
 *
 * @param {string} whatsappNumber
 * @param {string} otp
 * @returns {Promise<User>}
 */
const verifyOtp = async (whatsappNumber, otp) => {
  const user = await User.findOne({ whatsappNumber }).select("+otpCode +otpExpiry");

  if (!user) {
    throw new AppError("No account found with this WhatsApp number.", HTTP_STATUS.NOT_FOUND);
  }

  if (!user.otpCode || !user.otpExpiry) {
    throw new AppError("No OTP has been sent. Please request one first.", HTTP_STATUS.BAD_REQUEST);
  }

  if (new Date() > user.otpExpiry) {
    user.otpCode   = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new AppError("OTP has expired. Please request a new one.", HTTP_STATUS.BAD_REQUEST);
  }

  if (user.otpCode !== otp.trim()) {
    throw new AppError("Invalid OTP. Please check and try again.", HTTP_STATUS.BAD_REQUEST);
  }

  // Success — mark verified and clear OTP
  user.whatsappVerified = true;
  user.otpCode          = null;
  user.otpExpiry        = null;
  await user.save({ validateBeforeSave: false });

  return user;
};

module.exports = { sendOtp, verifyOtp, generateOtp, sendWhatsApp, normaliseWhatsAppNumber };
