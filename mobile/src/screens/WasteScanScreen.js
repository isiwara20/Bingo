/**
 * BinGo – AI Waste Sorting Assistant (Member 3 – Feature 4)
 * Resident: take/upload photo OR type item name → Gemini analyses → result screen
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, ScrollView, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { PermissionsAndroid, Platform } from "react-native";
import COLORS from "../constants/colors";
import { analyseWasteImage, analyseWasteText } from "../services/recyclingAIService";
import { updateProgress } from "../services/recyclingService";

const CAT_CONFIG = {
  Plastic:        { emoji: "🧴", color: "#3B82F6", binColor: "#1D6FA4" },
  Glass:          { emoji: "🍶", color: "#8B5CF6", binColor: "#8B5CF6" },
  Paper:          { emoji: "📄", color: "#F59E0B", binColor: "#F59E0B" },
  Metal:          { emoji: "🥫", color: "#6B7280", binColor: "#6B7280" },
  Organic:        { emoji: "🌿", color: "#16A34A", binColor: "#16A34A" },
  "E-Waste":      { emoji: "📱", color: "#DC2626", binColor: "#DC2626" },
  Hazardous:      { emoji: "⚠️", color: "#D97706", binColor: "#D97706" },
  "General Waste":{ emoji: "🗑️", color: "#6B7280", binColor: "#374151" },
};
const getCat = (c) => CAT_CONFIG[c] || { emoji: "♻️", color: COLORS.PRIMARY, binColor: COLORS.PRIMARY };

const CONFIDENCE_COLORS = { High: "#16A34A", Medium: "#F59E0B", Low: "#DC2626" };

export default function WasteScanScreen({ navigation }) {
  const [mode, setMode]           = useState("home"); // home | scanning | result | error
  const [imageUri, setImageUri]   = useState(null);
  const [textInput, setTextInput] = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);

  const pickImage = async (fromCamera) => {
    // Request camera permission on Android
    if (fromCamera && Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "BinGo needs access to your camera to scan waste items.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Camera permission is required to take photos.");
        return;
      }
    }
    const options = { mediaType: "photo", quality: 0.7, includeBase64: true };
    const fn = fromCamera ? launchCamera : launchImageLibrary;
    fn(options, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.base64) return;
      setImageUri(asset.uri);
      await runAnalysis(asset.base64, asset.type || "image/jpeg");
    });
  };

  const runAnalysis = async (base64OrText, mimeType) => {
    setLoading(true);
    setMode("scanning");
    try {
      let res;
      if (typeof base64OrText === "string" && !mimeType) {
        res = await analyseWasteText(base64OrText);
      } else {
        res = await analyseWasteImage(base64OrText, mimeType);
      }
      setResult(res);
      setMode("result");
      // Track in passport
      try { await updateProgress("explore_category", res.category); } catch {}
    } catch (e) {
      setMode("error");
      Alert.alert("Analysis Failed", e.message || "Could not analyse item. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTextScan = () => {
    if (!textInput.trim()) { Alert.alert("Enter an item", "Type an item name to analyse."); return; }
    setImageUri(null);
    runAnalysis(textInput.trim(), null);
  };

  const reset = () => { setMode("home"); setResult(null); setImageUri(null); setTextInput(""); };

  // ── SCANNING STATE ──────────────────────────────────────────────────────
  if (mode === "scanning" || loading) {
    return (
      <SafeAreaView style={S.root}>
        <View style={S.scanningScreen}>
          <View style={S.scanningOrb}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
          <Text style={S.scanningTitle}>Analysing with AI...</Text>
          <Text style={S.scanningSub}>Google Gemini is identifying your item</Text>
          <View style={S.scanningSteps}>
            {["Detecting item", "Classifying waste type", "Finding disposal guidance"].map((s, i) => (
              <View key={i} style={S.scanningStep}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={S.scanningStepTxt}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULT STATE ─────────────────────────────────────────────────────────
  if (mode === "result" && result) {
    const cfg = getCat(result.category);
    return (
      <SafeAreaView style={S.root}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Result header */}
          <View style={[S.resultHeader, { backgroundColor: cfg.color }]}>
            <TouchableOpacity onPress={reset} style={S.backBtn}>
              <Text style={S.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={S.resultHeaderContent}>
              <Text style={S.resultHeaderEmoji}>{cfg.emoji}</Text>
              <View>
                <Text style={S.resultItemName}>{result.itemName}</Text>
                <Text style={S.resultCategory}>{result.category}</Text>
              </View>
            </View>
            <View style={[S.aiLabel]}>
              <Text style={S.aiLabelTxt}>AI IDENTIFIED</Text>
            </View>
          </View>

          {/* Image if taken */}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={S.resultImage} resizeMode="cover" />
          )}

          <View style={S.resultBody}>
            {/* Confidence */}
            <View style={S.confidenceRow}>
              <Text style={S.confidenceLabel}>Confidence Score</Text>
              <View style={[S.confidencePill, { backgroundColor: CONFIDENCE_COLORS[result.confidence] + "20" }]}>
                <Text style={[S.confidenceTxt, { color: CONFIDENCE_COLORS[result.confidence] }]}>
                  {result.confidence === "High" ? "97%" : result.confidence === "Medium" ? "78%" : "55%"} · {result.confidence}
                </Text>
              </View>
            </View>

            {/* Bin info */}
            <View style={[S.binCard, { backgroundColor: cfg.color + "15", borderColor: cfg.color }]}>
              <View style={[S.binIcon, { backgroundColor: cfg.binColor }]}>
                <Text style={{ fontSize: 28 }}>🗑️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.binLabel, { color: cfg.color }]}>Dispose in:</Text>
                <Text style={S.binName}>{result.binLabel}</Text>
                <View style={[S.recyclablePill, { backgroundColor: result.isRecyclable ? "#DCFCE7" : "#FEE2E2" }]}>
                  <Text style={[S.recyclableTxt, { color: result.isRecyclable ? "#166534" : "#991B1B" }]}>
                    {result.isRecyclable ? "♻️ Recyclable" : "🗑️ Not Recyclable"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Disposal steps */}
            <View style={S.stepsCard}>
              <Text style={S.stepsTitle}>How to Prepare & Dispose</Text>
              {result.disposalSteps?.map((step, i) => (
                <View key={i} style={S.stepRow}>
                  <View style={[S.stepNum, { backgroundColor: cfg.color }]}>
                    <Text style={S.stepNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={S.stepTxt}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Tip */}
            {result.tips && (
              <View style={[S.tipCard, { backgroundColor: cfg.color + "10", borderColor: cfg.color + "40" }]}>
                <Text style={{ fontSize: 20 }}>💡</Text>
                <Text style={[S.tipTxt, { color: cfg.color }]}>{result.tips}</Text>
              </View>
            )}

            {/* Warning */}
            {result.warning && result.warning.length > 0 && (
              <View style={S.warningCard}>
                <Text style={{ fontSize: 20 }}>⚠️</Text>
                <Text style={S.warningTxt}>{result.warning}</Text>
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity style={S.scanAgainBtn} onPress={reset}>
              <Text style={S.scanAgainBtnTxt}>🔍 Scan Another Item</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HOME STATE ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Text style={S.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={S.headerMid}>
            <Text style={S.headerTitle}>AI Waste Assistant</Text>
            <Text style={S.headerSub}>Powered by Google Gemini</Text>
          </View>
          <View style={S.aiBadge}>
            <Text style={S.aiBadgeTxt}>AI</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={S.hero}>
          <Text style={S.heroEmoji}>🤖</Text>
          <Text style={S.heroTitle}>Scan or Upload Waste</Text>
          <Text style={S.heroSub}>Let AI identify the item and guide you on proper disposal</Text>
        </View>

        {/* Camera / Gallery buttons */}
        <View style={S.scanButtons}>
          <TouchableOpacity style={S.scanBtn} onPress={() => pickImage(true)}
            accessibilityRole="button" accessibilityLabel="Take a photo">
            <Text style={S.scanBtnEmoji}>📷</Text>
            <Text style={S.scanBtnTitle}>Take a Photo</Text>
            <Text style={S.scanBtnSub}>Use your camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.scanBtn, S.scanBtnSecondary]} onPress={() => pickImage(false)}
            accessibilityRole="button" accessibilityLabel="Upload from gallery">
            <Text style={S.scanBtnEmoji}>🖼️</Text>
            <Text style={[S.scanBtnTitle, { color: COLORS.PRIMARY }]}>Upload Photo</Text>
            <Text style={[S.scanBtnSub, { color: COLORS.TEXT_SECONDARY }]}>From your gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={S.divider}>
          <View style={S.dividerLine} />
          <Text style={S.dividerTxt}>or type it</Text>
          <View style={S.dividerLine} />
        </View>

        {/* Text input */}
        <View style={S.textInputWrap}>
          <TextInput
            style={S.textInput}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="e.g. empty plastic bottle, pizza box, old phone..."
            placeholderTextColor={COLORS.TEXT_DISABLED}
            onSubmitEditing={handleTextScan}
            returnKeyType="search"
            accessibilityLabel="Type item name"
          />
          <TouchableOpacity style={S.textSearchBtn} onPress={handleTextScan}
            accessibilityRole="button">
            <Text style={S.textSearchBtnTxt}>Analyse →</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={S.tipsCard}>
          <Text style={S.tipsTitle}>Tips for better results</Text>
          {[
            "Take a clear, well-lit photo of the item",
            "Include the whole item in the frame",
            "Good lighting improves accuracy",
            "Single items work better than groups",
          ].map((t, i) => (
            <View key={i} style={S.tipRow}>
              <Text style={S.tipBullet}>•</Text>
              <Text style={S.tipRowTxt}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Recent scans placeholder */}
        <Text style={S.sectionLabel}>How It Works</Text>
        <View style={S.howItWorksCard}>
          {[
            { emoji: "📸", step: "1. Scan or type", desc: "Take a photo or type the item name" },
            { emoji: "🤖", step: "2. AI analyses", desc: "Google Gemini identifies the waste type" },
            { emoji: "🗑️", step: "3. Get guidance", desc: "See which bin and how to prepare it" },
          ].map((h, i) => (
            <View key={i} style={[S.howItWorksStep, i > 0 && S.howItWorksBorder]}>
              <Text style={{ fontSize: 28 }}>{h.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={S.howItWorksStepTitle}>{h.step}</Text>
                <Text style={S.howItWorksStepDesc}>{h.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:              { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:            { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:           { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:          { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:         { flex: 1 },
  headerTitle:       { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:         { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  aiBadge:           { backgroundColor: "#7C3AED", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  aiBadgeTxt:        { color: "#fff", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  hero:              { backgroundColor: COLORS.PRIMARY, padding: 24, alignItems: "center", gap: 8 },
  heroEmoji:         { fontSize: 52 },
  heroTitle:         { fontSize: 20, fontWeight: "900", color: "#fff" },
  heroSub:           { fontSize: 13, color: COLORS.PRIMARY_TINT, textAlign: "center" },
  scanButtons:       { flexDirection: "row", gap: 12, padding: 16 },
  scanBtn:           { flex: 1, backgroundColor: COLORS.PRIMARY, borderRadius: 16, padding: 18, alignItems: "center", gap: 6, elevation: 3 },
  scanBtnSecondary:  { backgroundColor: COLORS.SURFACE, borderWidth: 2, borderColor: COLORS.PRIMARY },
  scanBtnEmoji:      { fontSize: 32 },
  scanBtnTitle:      { fontSize: 14, fontWeight: "800", color: "#fff" },
  scanBtnSub:        { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  divider:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  dividerLine:       { flex: 1, height: 1, backgroundColor: COLORS.BORDER },
  dividerTxt:        { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  textInputWrap:     { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  textInput:         { borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.TEXT_PRIMARY, backgroundColor: COLORS.SURFACE },
  textSearchBtn:     { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  textSearchBtnTxt:  { color: "#fff", fontWeight: "800", fontSize: 14 },
  tipsCard:          { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER },
  tipsTitle:         { fontSize: 12, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  tipRow:            { flexDirection: "row", gap: 8, marginBottom: 5 },
  tipBullet:         { color: COLORS.PRIMARY, fontWeight: "700" },
  tipRowTxt:         { flex: 1, fontSize: 12, color: COLORS.TEXT_PRIMARY },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10 },
  howItWorksCard:    { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 16, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  howItWorksStep:    { flexDirection: "row", alignItems: "center", padding: 14 },
  howItWorksBorder:  { borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  howItWorksStepTitle:{ fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  howItWorksStepDesc: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  // Scanning
  scanningScreen:    { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 32 },
  scanningOrb:       { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.PRIMARY, justifyContent: "center", alignItems: "center", elevation: 8 },
  scanningTitle:     { fontSize: 22, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  scanningSub:       { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  scanningSteps:     { gap: 12, marginTop: 8 },
  scanningStep:      { flexDirection: "row", alignItems: "center", gap: 10 },
  scanningStepTxt:   { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  // Result
  resultHeader:      { padding: 20, paddingTop: 14 },
  resultHeaderContent:{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 10 },
  resultHeaderEmoji: { fontSize: 42 },
  resultItemName:    { fontSize: 20, fontWeight: "900", color: "#fff" },
  resultCategory:    { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  aiLabel:           { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: "flex-start" },
  aiLabelTxt:        { color: "#fff", fontWeight: "900", fontSize: 10, letterSpacing: 1 },
  resultImage:       { width: "100%", height: 200 },
  resultBody:        { padding: 16, gap: 12 },
  confidenceRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  confidenceLabel:   { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  confidencePill:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  confidenceTxt:     { fontSize: 13, fontWeight: "700" },
  binCard:           { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, gap: 12, borderWidth: 1.5 },
  binIcon:           { width: 56, height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  binLabel:          { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  binName:           { fontSize: 17, fontWeight: "900", color: COLORS.TEXT_PRIMARY, marginTop: 2 },
  recyclablePill:    { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 6 },
  recyclableTxt:     { fontSize: 11, fontWeight: "700" },
  stepsCard:         { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  stepsTitle:        { fontSize: 13, fontWeight: "800", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  stepRow:           { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  stepNum:           { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 1 },
  stepNumTxt:        { color: "#fff", fontSize: 11, fontWeight: "900" },
  stepTxt:           { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 19 },
  tipCard:           { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, padding: 12, borderWidth: 1 },
  tipTxt:            { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 18 },
  warningCard:       { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FEF3C7", borderRadius: 12, padding: 12 },
  warningTxt:        { flex: 1, fontSize: 13, color: "#92400E" },
  scanAgainBtn:      { backgroundColor: COLORS.PRIMARY, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  scanAgainBtnTxt:   { color: "#fff", fontSize: 15, fontWeight: "800" },
});
