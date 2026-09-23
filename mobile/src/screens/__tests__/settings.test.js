import React from "react";
import renderer, { act } from "react-test-renderer";
import { Text, TextInput, TouchableOpacity, Switch, Alert } from "react-native";
import SettingsScreen from "../SettingsScreen";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
jest.mock("../../context/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../../api/apiClient", () => ({ put: jest.fn(), delete: jest.fn() }));
jest.mock("../../services/authService", () => ({ logout: jest.fn() }));
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
let tree, auth;
const roles = ["resident", "community_leader", "waste_authority"];
const mount = async () => { await act(async () => { tree = renderer.create(<SettingsScreen navigation={{ canGoBack: () => true, goBack: jest.fn() }} />); }); };
const press = async label => {
  const button = tree.root.findAllByType(TouchableOpacity).find(n => n.findAllByType(Text).some(t => t.props.children === label));
  await act(async () => button.props.onPress());
};
const enter = async (placeholder, value) => { await act(async () => tree.root.findByProps({ placeholder }).props.onChangeText(value)); };
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  auth = { user: { _id: "account-1", role: "resident", name: "Original", email: "test@example.com" }, updateUser: jest.fn(), logout: jest.fn() };
  useAuth.mockImplementation(() => auth);
  api.put.mockResolvedValue({ data: { data: { name: "Updated" } } });
});
afterEach(() => { if (tree) act(() => tree.unmount()); jest.restoreAllMocks(); });
test.each(roles)("%s can edit profile and retains identity and role", async role => {
  auth.user.role = role;
  await mount(); await press("Edit"); await enter("Enter your name", "Updated"); await press("Save Changes");
  expect(api.put).toHaveBeenCalledWith("/users/me", expect.objectContaining({ name: "Updated" }));
  expect(auth.updateUser).toHaveBeenCalledWith(expect.objectContaining({ _id: "account-1", role, name: "Updated" }));
});
test.each(roles)("%s can submit a password change", async role => {
  auth.user.role = role;
  await mount(); await press("Change Password");
  await enter("Enter current password", "Current123"); await enter("Minimum 6 characters", "NewPass123"); await enter("Re-enter new password", "NewPass123"); await press("Update Password");
  expect(api.put).toHaveBeenCalledWith("/users/change-password", { currentPassword: "Current123", newPassword: "NewPass123" });
});
test("rapid preference changes persist together and survive reopening", async () => {
  await mount();
  const switches = tree.root.findAllByType(Switch);
  await act(async () => { switches[0].props.onValueChange(false); switches[1].props.onValueChange(false); });
  expect(JSON.parse(await AsyncStorage.getItem("@bingo_user_settings:account-1"))).toMatchObject({ pickupReminders: false, recycleTips: false });
  act(() => tree.unmount()); await mount();
  expect(tree.root.findAllByType(Switch)[0].props.value).toBe(false);
  act(() => tree.unmount()); auth.user = { ...auth.user, _id: "account-2" }; await mount();
  expect(tree.root.findAllByType(Switch)[0].props.value).toBe(true);
});
test("failed profile update shows an error without replacing the account", async () => {
  api.put.mockRejectedValueOnce(new Error("Server unavailable"));
  await mount(); await press("Edit"); await press("Save Changes");
  expect(auth.updateUser).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith("Update Failed", "Server unavailable");
});
test("storage failure is reported", async () => {
  await mount(); AsyncStorage.setItem.mockRejectedValueOnce(new Error("Storage full"));
  await act(async () => tree.root.findAllByType(Switch)[0].props.onValueChange(false));
  expect(Alert.alert).toHaveBeenCalledWith("Settings not saved", expect.any(String));
});
