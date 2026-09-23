/**
 * BinGo – Recycling Category Screen (Member 3 – Feature 3)
 * Detailed view for a specific waste category
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";
import { updateProgress } from "../services/recyclingService";

const CAT_CONFIG = {
  Plastic:   { emoji: "🧴", color: "#3B82F6", bg: "#EFF6FF" },
  Glass:     { emoji: "🍶", color: "#8B5CF6", bg: "#F5F3FF" },
  Paper:     { emoji: "📄", color: "#F59E0B", bg: "#FFFBEB" },
  Metal:     { emoji: "🥫", color: "#6B7280", bg: "#F9FAFB" },
  Organic:   { emoji: "🌿", color: "#16A34A", bg: "#F0FDF4" },
  "E-Waste": { emoji: "📱", color: "#DC2626", bg: "#FEF2F2" },
  Hazardous: { emoji: "⚠️", color: "#D97706", bg: "#FFFBEB" },
};
const getCat = (c) => CAT_CONFIG[c] || { emoji: "♻️", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_TINT };

export default function RecyclingCategoryScreen({ navigation, route }) {
  const { category, guides = [] } = route.params || {};
  const cfg = getCat(category);
  const [expanded, setExpanded] = useState(guides[0]?._id || null);
  const [saved, setSaved]       = useState([]);

  const toggleSave = async (id) => {
    const isSaved = saved.includes(id);
    if (isSaved) setSaved(s => s.filter(x => x !== id));
    else         setSaved(s => [...s, id]);
    try { await updateProgress(isSaved ? "unsave_guide" : "save_guide", id); } catch {}
  };

  return (
    <SafeAreaView style={[S.root, { backgroundColor: cfg.bg }]}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: cfg.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerEmoji}>{cfg.emoji}</Text>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Let's Learn About</Text>
          <Text style={S.headerCat}>{category.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Intro banner */}
        <View style={[S.introBanner, { backgroundColor: cfg.color }]}>
          <Text style={S.introTitle}>We use it daily,{"\n"}let's dispose it responsibly.</Text>
        </View>

        {/* Navigation tabs: Overview | Can Recycle | Can't Recycle | How to Prepare */}
        <View style={S.tabsRow}>
          {["Overview","Can Recycle","Can't Recycle","Prepare"].map((t, i) => (
            <TouchableOpacity key={t} style={[S.miniTab, expanded === `tab_${i}` && { backgroundColor: cfg.color }]}
              onPress={() => setExpanded(v => v === `tab_${i}` ? null : `tab_${i}`)}
              accessibilityRole="button">
              <Text style={[S.miniTabTxt, expanded === `tab_${i}` && { color: "#fff", fontWeight: "700" }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Guides */}
        <View style={S.guidesWrap}>
          {guides.map((guide) => {
            const isOpen   = expanded === guide._id;
            const isSaved  = saved.includes(guide._id);
            return (
              <View key={guide._id} style={S.guideCard}>
                <TouchableOpacity style={S.guideHeader}
                  onPress={() => setExpanded(isOpen ? null : guide._id)}
                  accessibilityRole="button">
                  <View style={[S.guideIconBox, { backgroundColor: cfg.color + "20" }]}>
                    <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                  </View>
                  <Text style={S.guideTitle}>{guide.title}</Text>
                  <Text style={[S.chevron, { color: cfg.color }]}>{isOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={S.guideBody}>
                    <Text style={S.guideContent}>{guide.content}</Text>
                    {guide.tips?.length > 0 && (
                      <>
                        <Text style={[S.tipsLabel, { color: cfg.color }]}>Quick Facts</Text>
                        {guide.tips.map((tip, i) => (
                          <View key={i} style={S.tipRow}>
                            <View style={[S.tipDot, { backgroundColor: cfg.color }]} />
                            <Text style={S.tipTxt}>{tip}</Text>
                          </View>
                        ))}
                      </>
                    )}
                    <TouchableOpacity style={[S.saveBtn, { borderColor: cfg.color }, isSaved && { backgroundColor: cfg.color + "15" }]}
                      onPress={() => toggleSave(guide._id)} accessibilityRole="button">
                      <Text style={[S.saveBtnTxt, { color: cfg.color }]}>
                        {isSaved ? "🔖 Saved to Library" : "🔖 Save to Library"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Common examples */}
        <View style={[S.examplesCard, { backgroundColor: cfg.bg, borderColor: cfg.color + "30" }]}>
          <Text style={[S.examplesTitle, { color: cfg.color }]}>Common Examples</Text>
          <View style={S.examplesGrid}>
            {getExamples(category).map((ex, i) => (
              <View key={i} style={[S.exampleChip, { backgroundColor: cfg.color + "15" }]}>
                <Text style={{ fontSize: 18 }}>{ex.emoji}</Text>
                <Text style={[S.exampleTxt, { color: cfg.color }]}>{ex.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getExamples = (cat) => {
  const MAP = {
    Plastic:   [{ emoji:"🍼", name:"Water bottle" },{ emoji:"🧴", name:"Shampoo bottle" },{ emoji:"🥛", name:"Milk jug" },{ emoji:"🛍️", name:"Plastic bag*" }],
    Glass:     [{ emoji:"🍾", name:"Wine bottle" },{ emoji:"🫙", name:"Jam jar" },{ emoji:"🍺", name:"Beer bottle" },{ emoji:"🏺", name:"Glass container" }],
    Paper:     [{ emoji:"📦", name:"Cardboard box" },{ emoji:"📰", name:"Newspaper" },{ emoji:"📬", name:"Envelope" },{ emoji:"🛍️", name:"Paper bag" }],
    Metal:     [{ emoji:"🥤", name:"Drinks can" },{ emoji:"🥫", name:"Food tin" },{ emoji:"🍳", name:"Foil tray" },{ emoji:"🔋", name:"Aerosol can" }],
    Organic:   [{ emoji:"🍌", name:"Banana peel" },{ emoji:"☕", name:"Coffee grounds" },{ emoji:"🥦", name:"Veg scraps" },{ emoji:"🌿", name:"Garden waste" }],
    "E-Waste": [{ emoji:"📱", name:"Old phone" },{ emoji:"💻", name:"Laptop" },{ emoji:"🔋", name:"Batteries" },{ emoji:"🖨️", name:"Printer" }],
    Hazardous: [{ emoji:"🎨", name:"Paint" },{ emoji:"🧪", name:"Chemicals" },{ emoji:"🛢️", name:"Motor oil" },{ emoji:"💡", name:"Fluorescent bulb" }],
  };
  return MAP[cat] || [];
};

const S = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  backBtn:       { padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
  backIcon:      { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerEmoji:   { fontSize: 28 },
  headerMid:     { flex: 1 },
  headerTitle:   { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  headerCat:     { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  introBanner:   { paddingHorizontal: 20, paddingVertical: 18 },
  introTitle:    { fontSize: 17, fontWeight: "700", color: "#fff", lineHeight: 24 },
  tabsRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  miniTab:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.08)" },
  miniTabTxt:    { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  guidesWrap:    { paddingHorizontal: 16, gap: 10 },
  guideCard:     { backgroundColor: COLORS.SURFACE, borderRadius: 14, overflow: "hidden", elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  guideHeader:   { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  guideIconBox:  { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  guideTitle:    { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  chevron:       { fontSize: 12, fontWeight: "700" },
  guideBody:     { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, paddingTop: 12 },
  guideContent:  { fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 20, marginBottom: 12 },
  tipsLabel:     { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  tipRow:        { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 5 },
  tipDot:        { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipTxt:        { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },
  saveBtn:       { borderRadius: 10, paddingVertical: 9, alignItems: "center", marginTop: 10, borderWidth: 1.5 },
  saveBtnTxt:    { fontSize: 13, fontWeight: "700" },
  examplesCard:  { margin: 16, borderRadius: 14, padding: 14, borderWidth: 1 },
  examplesTitle: { fontSize: 13, fontWeight: "800", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  examplesGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  exampleChip:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  exampleTxt:    { fontSize: 12, fontWeight: "600" },
});
