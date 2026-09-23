/**
 * BinGo Admin – Verification Review Screen
 *
 * Lists all residents with verificationStatus = "pending".
 * Admin can:
 *   - View submitted location, residence photo, face photo
 *   - Approve → sets profileVerified=true, status=verified
 *   - Reject  → sets status=rejected with optional reason
 *
 * All actions use overlay modals (no native Alert).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Modal,
  Animated, TextInput, ScrollView, Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const { width: W, height: H } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Overlay alert modal
// ─────────────────────────────────────────────────────────────────────────────
const OverlayModal = ({ visible, icon, iconColor, title, message, buttons, onClose }) => {
  const scale   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets  = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.85);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1,    friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={ov.backdrop}>
        <Animated.View style={[ov.card, { opacity, transform: [{ scale }], paddingBottom: insets.bottom + 16 }]}>
          <View style={[ov.iconBox, { backgroundColor: (iconColor || COLORS.PRIMARY) + "18" }]}>
            <Icon name={icon || "information-outline"} size={36} color={iconColor || COLORS.PRIMARY} />
          </View>
          <Text style={ov.title}>{title}</Text>
          {message ? <Text style={ov.message}>{message}</Text> : null}
          <View style={ov.btnRow}>
            {(buttons || [{ text: "OK" }]).map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[ov.btn, btn.primary && ov.btnPrimary, btn.danger && ov.btnDanger,
                        buttons.length === 1 && ov.btnFull]}
                onPress={() => { onClose?.(); btn.onPress?.(); }}
              >
                <Text style={[ov.btnTxt, btn.primary && ov.btnTxtWhite, btn.danger && ov.btnTxtRed]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ov = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: COLORS.SURFACE, borderRadius: 20, padding: 24, width: "100%", alignItems: "center", gap: 10, elevation: 20 },
  iconBox: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  title:   { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  message: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 20 },
  btnRow:  { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  btn:     { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center" },
  btnFull: { flex: 1 },
  btnPrimary: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  btnDanger:  { backgroundColor: COLORS.ERROR, borderColor: COLORS.ERROR },
  btnTxt:      { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  btnTxtWhite: { color: "#fff" },
  btnTxtRed:   { color: "#fff" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Detail bottom sheet — shows full verification data
// ─────────────────────────────────────────────────────────────────────────────
const DetailSheet = ({ visible, resident, onApprove, onReject, onClose }) => {
  const slideY  = useRef(new Animated.Value(H)).current;
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : H,
      damping: 18, stiffness: 120, mass: 0.9,
      useNativeDriver: true,
    }).start();
    if (!visible) { setShowRejectInput(false); setRejectReason(""); }
  }, [visible]);

  if (!resident) return null;

  const coord = resident.verificationLocation?.coordinates;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={ds.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View style={[ds.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideY }] }]}>
          {/* Handle */}
          <View style={ds.handle} />

          {/* Header */}
          <View style={ds.sheetHeader}>
            <View>
              <Text style={ds.sheetTitle}>{resident.name}</Text>
              <Text style={ds.sheetEmail}>{resident.email}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ds.closeBtn} hitSlop={10}>
              <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {/* Info rows */}
            <View style={ds.infoCard}>
              {[
                { icon: "whatsapp",           label: "WhatsApp",  value: resident.whatsappNumber },
                { icon: "map-marker-outline", label: "Address",   value: resident.address },
                { icon: "crosshairs-gps",     label: "Location",  value: coord ? `${coord[1].toFixed(5)}, ${coord[0].toFixed(5)}` : "—" },
                { icon: "calendar-outline",   label: "Submitted", value: new Date(resident.createdAt).toLocaleDateString() },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={ds.infoRow}>
                    <Icon name={row.icon} size={16} color={COLORS.PRIMARY} />
                    <View style={{ flex: 1 }}>
                      <Text style={ds.infoLabel}>{row.label}</Text>
                      <Text style={ds.infoValue} numberOfLines={2}>{row.value || "—"}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={ds.divider} />}
                </React.Fragment>
              ))}
            </View>

            {/* Photos */}
            <Text style={ds.sectionTitle}>Submitted Photos</Text>
            <View style={ds.photosRow}>
              <View style={ds.photoBox}>
                <Text style={ds.photoLabel}>Residence</Text>
                {resident.residenceImage ? (
                  <Image source={{ uri: resident.residenceImage }} style={ds.photo} />
                ) : (
                  <View style={[ds.photo, ds.photoEmpty]}>
                    <Icon name="image-off" size={28} color={COLORS.TEXT_DISABLED} />
                  </View>
                )}
              </View>
              <View style={ds.photoBox}>
                <Text style={ds.photoLabel}>Face</Text>
                {resident.faceImage ? (
                  <Image source={{ uri: resident.faceImage }} style={[ds.photo, ds.facePhoto]} />
                ) : (
                  <View style={[ds.photo, ds.facePhoto, ds.photoEmpty]}>
                    <Icon name="face-man-outline" size={28} color={COLORS.TEXT_DISABLED} />
                  </View>
                )}
              </View>
            </View>

            {/* Reject reason input */}
            {showRejectInput && (
              <View style={ds.rejectBox}>
                <Text style={ds.rejectLabel}>Reason for rejection (optional)</Text>
                <TextInput
                  style={ds.rejectInput}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="e.g. Photo is blurry, wrong location..."
                  placeholderTextColor={COLORS.TEXT_DISABLED}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            {/* Action buttons */}
            <View style={ds.actionRow}>
              {!showRejectInput ? (
                <>
                  <TouchableOpacity
                    style={[ds.actionBtn, ds.rejectBtn]}
                    onPress={() => setShowRejectInput(true)}
                    accessibilityRole="button"
                  >
                    <Icon name="close-circle-outline" size={18} color={COLORS.ERROR} />
                    <Text style={[ds.actionBtnTxt, { color: COLORS.ERROR }]}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ds.actionBtn, ds.approveBtn]}
                    onPress={() => onApprove(resident)}
                    accessibilityRole="button"
                  >
                    <Icon name="check-circle-outline" size={18} color="#fff" />
                    <Text style={[ds.actionBtnTxt, { color: "#fff" }]}>Approve</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[ds.actionBtn, { borderWidth: 1, borderColor: COLORS.BORDER, flex: 1 }]}
                    onPress={() => setShowRejectInput(false)}
                  >
                    <Text style={ds.actionBtnTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ds.actionBtn, ds.rejectBtnFill]}
                    onPress={() => onReject(resident, rejectReason)}
                    accessibilityRole="button"
                  >
                    <Icon name="close-circle" size={18} color="#fff" />
                    <Text style={[ds.actionBtnTxt, { color: "#fff" }]}>Confirm Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ds = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:       { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, maxHeight: H * 0.88, elevation: 24 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.BORDER, alignSelf: "center", marginBottom: 14 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sheetTitle:  { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  sheetEmail:  { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  closeBtn:    { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.BACKGROUND, justifyContent: "center", alignItems: "center" },

  infoCard:  { backgroundColor: COLORS.BACKGROUND, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: COLORS.BORDER },
  infoRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  infoLabel: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginBottom: 1 },
  infoValue: { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  divider:   { height: 1, backgroundColor: COLORS.DIVIDER, marginLeft: 36 },

  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_DISABLED, textTransform: "uppercase", letterSpacing: 0.8 },
  photosRow:  { flexDirection: "row", gap: 12 },
  photoBox:   { flex: 1, gap: 6 },
  photoLabel: { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  photo:      { width: "100%", height: 160, borderRadius: 12, backgroundColor: COLORS.BACKGROUND },
  facePhoto:  { height: 160, borderRadius: 80 },
  photoEmpty: { justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.BORDER },

  rejectBox:  { gap: 6 },
  rejectLabel:{ fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  rejectInput:{ backgroundColor: COLORS.BACKGROUND, borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 10, padding: 12, fontSize: 13, color: COLORS.TEXT_PRIMARY, minHeight: 72 },

  actionRow:     { flexDirection: "row", gap: 10 },
  actionBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12 },
  rejectBtn:     { borderWidth: 1.5, borderColor: COLORS.ERROR },
  rejectBtnFill: { backgroundColor: COLORS.ERROR },
  approveBtn:    { backgroundColor: COLORS.SUCCESS },
  actionBtnTxt:  { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminVerificationScreen = () => {
  const [residents,  setResidents]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [processing, setProcessing] = useState(false);
  const [overlay,    setOverlay]    = useState({ visible: false });

  const showOverlay = (icon, iconColor, title, message, buttons) =>
    setOverlay({ visible: true, icon, iconColor, title, message, buttons: buttons || [] });
  const closeOverlay = () => setOverlay(o => ({ ...o, visible: false }));

  const load = useCallback(async () => {
    try {
      const res = await api.get("/users/pending-verifications");
      setResidents(res.data.data || []);
    } catch (e) {
      showOverlay("alert-circle", COLORS.ERROR, "Error",
        e.message || "Could not load pending verifications.", []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (resident) => {
    setSelected(null);
    setProcessing(true);
    try {
      await api.put(`/users/${resident._id}/verification`, { action: "approve" });
      setResidents(prev => prev.filter(r => r._id !== resident._id));
      showOverlay("check-decagram", COLORS.SUCCESS,
        "Approved ✅",
        `${resident.name}'s profile has been verified successfully.`,
        [{ text: "Done", primary: true }]);
    } catch (e) {
      showOverlay("alert-circle", COLORS.ERROR, "Failed",
        e.message || "Could not approve verification.", []);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (resident, reason) => {
    setSelected(null);
    setProcessing(true);
    try {
      await api.put(`/users/${resident._id}/verification`, { action: "reject", reason });
      setResidents(prev => prev.filter(r => r._id !== resident._id));
      showOverlay("close-circle", COLORS.ERROR,
        "Rejected",
        `${resident.name}'s verification has been rejected.`,
        [{ text: "Done", primary: true }]);
    } catch (e) {
      showOverlay("alert-circle", COLORS.ERROR, "Failed",
        e.message || "Could not reject verification.", []);
    } finally {
      setProcessing(false);
    }
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={vs.card}
      onPress={() => setSelected(item)}
      accessibilityRole="button"
      accessibilityLabel={`Review ${item.name}`}
    >
      {/* Avatar + info */}
      <View style={vs.cardLeft}>
        {item.faceImage ? (
          <Image source={{ uri: item.faceImage }} style={vs.avatar} />
        ) : (
          <View style={vs.avatarFallback}>
            <Text style={vs.avatarTxt}>{item.name?.[0]?.toUpperCase() || "?"}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={vs.name}>{item.name}</Text>
          <Text style={vs.email} numberOfLines={1}>{item.email}</Text>
          <Text style={vs.date}>
            Submitted {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Preview thumbnails */}
      <View style={vs.thumbs}>
        {item.residenceImage ? (
          <Image source={{ uri: item.residenceImage }} style={vs.thumb} />
        ) : (
          <View style={[vs.thumb, vs.thumbEmpty]}>
            <Icon name="home-outline" size={14} color={COLORS.TEXT_DISABLED} />
          </View>
        )}
        {item.faceImage ? (
          <Image source={{ uri: item.faceImage }} style={[vs.thumb, vs.thumbRound]} />
        ) : (
          <View style={[vs.thumb, vs.thumbRound, vs.thumbEmpty]}>
            <Icon name="face-man-outline" size={14} color={COLORS.TEXT_DISABLED} />
          </View>
        )}
      </View>

      <Icon name="chevron-right" size={18} color={COLORS.TEXT_DISABLED} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={vs.container}>
      {/* Header */}
      <View style={vs.header}>
        <View>
          <Text style={vs.headerTitle}>Pending Verifications</Text>
          <Text style={vs.headerSub}>{residents.length} awaiting review</Text>
        </View>
        {processing && <ActivityIndicator size="small" color={COLORS.PRIMARY} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={residents}
          keyExtractor={item => item._id}
          renderItem={renderCard}
          contentContainerStyle={vs.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={vs.empty}>
              <View style={vs.emptyIcon}>
                <Icon name="shield-check" size={48} color={COLORS.SUCCESS} />
              </View>
              <Text style={vs.emptyTitle}>All Clear</Text>
              <Text style={vs.emptySub}>No pending verifications at this time.</Text>
            </View>
          }
        />
      )}

      {/* Detail sheet */}
      <DetailSheet
        visible={!!selected}
        resident={selected}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setSelected(null)}
      />

      {/* Overlay modal */}
      <OverlayModal {...overlay} onClose={closeOverlay} />
    </SafeAreaView>
  );
};

const vs = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1,
  },
  cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:   { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center", alignItems: "center",
  },
  avatarTxt: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  name:  { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  email: { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  date:  { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },

  thumbs:    { flexDirection: "row", gap: 4 },
  thumb:     { width: 40, height: 40, borderRadius: 6, backgroundColor: COLORS.BACKGROUND },
  thumbRound:{ borderRadius: 20 },
  thumbEmpty:{ justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.BORDER },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  emptyTitle:{ fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  emptySub:  { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default AdminVerificationScreen;
