const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendWhatsApp, generateOtp } = require("./otpService");
const AppError = require("../utils/AppError");

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const otpHash = (email, otp) => crypto.createHmac("sha256", process.env.JWT_SECRET)
  .update(`password-reset:${email}:${otp}`).digest("hex");
const invalidCode = () => new AppError("Invalid or expired code. Request a new code if needed.", 400);

const requestReset = async (email) => {
  const now = new Date();
  const otp = generateOtp();
  const digest = otpHash(email, otp);
  // Atomically reserve the resend window. Unknown accounts receive the same response.
  const user = await User.findOneAndUpdate({
    email, isActive: true, whatsappNumber: { $nin: [null, ""] },
    $or: [
      { "passwordReset.sentAt": { $exists: false } },
      { "passwordReset.sentAt": { $lte: new Date(now.getTime() - 60000) } },
    ],
  }, { $set: { passwordReset: {
    otpHash: digest, expiresAt: new Date(now.getTime() + 600000), sentAt: now, attempts: 0,
  } } }, { new: true });
  if (!user) return;
  try {
    await sendWhatsApp(user.whatsappNumber,
      `BinGo password reset\n\nYour verification code is: ${otp}\n\nValid for 10 minutes. Do not share this code. If you did not request a password reset, ignore this message.`,
      { requireDelivery: true });
  } catch {
    await User.updateOne({ _id: user._id, "passwordReset.otpHash": digest }, { $unset: { passwordReset: 1 } });
    throw new AppError("We could not send the WhatsApp code. Please try again later.", 503);
  }
};

const verifyReset = async (email, otp) => {
  // Count every attempt before comparing, including concurrent requests.
  const user = await User.findOneAndUpdate({
    email, isActive: true,
    "passwordReset.otpHash": { $exists: true },
    "passwordReset.expiresAt": { $gt: new Date() },
    "passwordReset.attempts": { $lt: 5 },
  }, { $inc: { "passwordReset.attempts": 1 } }, { new: true });
  if (!user) throw invalidCode();
  const resetToken = crypto.randomBytes(32).toString("hex");
  const verified = await User.findOneAndUpdate({
    _id: user._id, isActive: true,
    "passwordReset.otpHash": otpHash(email, otp),
    "passwordReset.expiresAt": { $gt: new Date() },
    "passwordReset.attempts": { $lte: 5 },
  }, {
    $set: { "passwordReset.tokenHash": hash(resetToken), "passwordReset.tokenExpiresAt": new Date(Date.now() + 600000) },
    $unset: { "passwordReset.otpHash": 1, "passwordReset.expiresAt": 1 },
  }, { new: true });
  if (!verified) throw invalidCode();
  return { resetToken };
};

const resetPassword = async (resetToken, password) => {
  // Explicit hashing is necessary: findOneAndUpdate does not run the save hook.
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({
    isActive: true,
    "passwordReset.tokenHash": hash(resetToken),
    "passwordReset.tokenExpiresAt": { $gt: new Date() },
  }, {
    $set: { passwordHash },
    $inc: { sessionVersion: 1 },
    $unset: { passwordReset: 1 },
  }, { new: true });
  if (!user) throw new AppError("Your reset session has expired or was already used. Please start again.", 400);
};

module.exports = { requestReset, verifyReset, resetPassword };
