import React from "react";
import renderer, { act } from "react-test-renderer";
import { Text, TextInput, TouchableOpacity, AccessibilityInfo } from "react-native";
import ForgotPasswordScreen from "../ForgotPasswordScreen";
import OnboardingScreen from "../OnboardingScreen";
import { requestPasswordReset, verifyPasswordReset, completePasswordReset } from "../../services/authService";

jest.mock("../../services/authService", () => ({ requestPasswordReset: jest.fn(), verifyPasswordReset: jest.fn(), completePasswordReset: jest.fn() }));
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));

jest.setTimeout(15000);

let tree;
let navigation;
const textOf = node => node.findAllByType(Text).map(t => t.props.children).flat(Infinity).filter(x => typeof x === "string").join(" ");
const button = label => tree.root.findAllByType(TouchableOpacity).find(node => textOf(node).includes(label));
const enter = async (label, text) => { await act(async () => tree.root.findByProps({ accessibilityLabel: label }).props.onChangeText(text)); };
const press = async label => { await act(async () => button(label).props.onPress()); };
const mount = async Component => { await act(async () => { tree = renderer.create(<Component navigation={navigation} />); }); };

beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
  navigation = { navigate: jest.fn(), reset: jest.fn() };
  requestPasswordReset.mockResolvedValue({});
  verifyPasswordReset.mockResolvedValue({ resetToken: "reset-token" });
  completePasswordReset.mockResolvedValue();
});
afterEach(() => { if (tree) act(() => tree.unmount()); jest.clearAllTimers(); jest.useRealTimers(); });

async function reachNewPassword() {
  await mount(ForgotPasswordScreen);
  await enter("Email address", "resident@example.com"); await press("Send WhatsApp code");
  await enter("Verification code", "246810"); await press("Verify code");
}

test.each([false, true])("recovers by email and redirects after success (reduced motion: %s)", async reducedMotion => {
  AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(reducedMotion);
  await reachNewPassword();
  expect(requestPasswordReset).toHaveBeenCalledWith("resident@example.com");
  expect(verifyPasswordReset).toHaveBeenCalledWith("resident@example.com", "246810");
  await enter("New password", "FreshPassword2"); await enter("Confirm password", "FreshPassword2"); await press("Reset password");
  expect(completePasswordReset).toHaveBeenCalledWith("reset-token", "FreshPassword2");
  expect(tree.root.findAllByType(Text).some(n => n.props.children === "Password reset.")).toBe(true);
  expect(navigation.reset).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(4500));
  expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: "Login" }] });
});

test("rejects invalid email without calling the server", async () => {
  await mount(ForgotPasswordScreen); await enter("Email address", "bad"); await press("Send WhatsApp code");
  expect(requestPasswordReset).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("valid email");
});

test("preserves the email step when delivery fails", async () => {
  requestPasswordReset.mockRejectedValue({ message: "Could not send WhatsApp code." });
  await mount(ForgotPasswordScreen); await enter("Email address", "resident@example.com"); await press("Send WhatsApp code");
  expect(tree.root.findAllByType(TextInput).some(n => n.props.accessibilityLabel === "Email address")).toBe(true);
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("Could not send");
});

test("keeps wrong codes on verification and enforces resend countdown", async () => {
  await mount(ForgotPasswordScreen); await enter("Email address", "resident@example.com"); await press("Send WhatsApp code");
  expect(button("Resend code in").props.disabled).toBe(true);
  verifyPasswordReset.mockRejectedValue({ message: "Invalid or expired code." });
  await enter("Verification code", "111111"); await press("Verify code");
  expect(completePasswordReset).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("expired");
  await act(async () => jest.advanceTimersByTime(60000));
  expect(button("Didn’t get a code?").props.disabled).toBe(false);
  await press("Didn’t get a code?");
  expect(requestPasswordReset).toHaveBeenCalledTimes(2);
});

test("rejects weak and mismatched passwords before sending", async () => {
  await reachNewPassword();
  await enter("New password", "weak"); await enter("Confirm password", "weak"); await press("Reset password");
  expect(completePasswordReset).not.toHaveBeenCalled();
  await enter("New password", "FreshPassword2"); await enter("Confirm password", "DifferentPassword3"); await press("Reset password");
  expect(completePasswordReset).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("don’t match");
});

test("does not show success or redirect when resetting fails", async () => {
  await reachNewPassword(); completePasswordReset.mockRejectedValue({ message: "Session expired. Start again." });
  await enter("New password", "FreshPassword2"); await enter("Confirm password", "FreshPassword2"); await press("Reset password");
  await act(async () => jest.advanceTimersByTime(5000));
  expect(navigation.reset).not.toHaveBeenCalled();
  expect(tree.root.findByProps({ accessibilityRole: "alert" }).props.children).toContain("expired");
  await press("Start again with a new code");
  expect(tree.root.findAllByType(TextInput).some(n => n.props.accessibilityLabel === "Email address")).toBe(true);
});

test("onboarding advances through three pages and opens registration", async () => {
  await mount(OnboardingScreen);
  await press("Continue"); await press("Continue"); await press("Create your account");
  expect(navigation.navigate).toHaveBeenCalledWith("Register");
});

test("onboarding offers skip and sign-in navigation", async () => {
  await mount(OnboardingScreen); await press("Skip intro"); await press("Already part of BinGo?");
  expect(navigation.navigate).toHaveBeenCalledTimes(2);
  expect(navigation.navigate).toHaveBeenCalledWith("Login");
});
