/**
 * BinGo – Recycling Guide Screen (Member 3 – Feature 3)
 * Hub: Explore Categories | Learn | Detective Game | Stories | Passport
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getGuides, getMyProgress, updateProgress } from "../services/recyclingService";
import COLORS from "../constants/colors";

// ── Category config ───────────────────────────────────────────────────────
const CAT_CONFIG = {
  Plastic:   { emoji: "🧴", color: "#3B82F6", bg: "#EFF6FF", desc: "Bottles, containers, packaging" },
  Glass:     { emoji: "🍶", color: "#8B5CF6", bg: "#F5F3FF", desc: "Jars, bottles, containers"      },
  Paper:     { emoji: "📄", color: "#F59E0B", bg: "#FFFBEB", desc: "Paper, cardboard, boxes"        },
  Metal:     { emoji: "🥫", color: "#6B7280", bg: "#F9FAFB", desc: "Cans, foil, tins"              },
  Organic:   { emoji: "🌿", color: "#16A34A", bg: "#F0FDF4", desc: "Food scraps, garden waste"     },
  "E-Waste": { emoji: "📱", color: "#DC2626", bg: "#FEF2F2", desc: "Electronics, batteries"        },
  Hazardous: { emoji: "⚠️", color: "#D97706", bg: "#FFFBEB", desc: "Chemicals, paints, oils"       },
};
const getCat = (c) => CAT_CONFIG[c] || { emoji: "♻️", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_TINT, desc: "" };

// ── Waste Detective questions (30 cases, shuffled each game) ─────────────
const ALL_DETECTIVE_CASES = [
  { id:"d01", item:"Empty plastic water bottle",     emoji:"🍼", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Green Bin 🌿"],          answer:0, hint:"Rinse it first — then blue bin!" },
  { id:"d02", item:"Pizza box (greasy)",             emoji:"🍕", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:1, hint:"Grease contaminates recycling" },
  { id:"d03", item:"Banana peel",                    emoji:"🍌", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Red Bin ⚠️"],          answer:2, hint:"Organic = green bin" },
  { id:"d04", item:"Old mobile phone",               emoji:"📱", options:["Grey Bin 🗑️","E-Waste Drop-off","Blue Bin ♻️","Red Bin ⚠️"],      answer:1, hint:"Electronics need special recycling" },
  { id:"d05", item:"Glass wine bottle (empty)",      emoji:"🍾", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Glass Bank"],          answer:3, hint:"Glass banks are best for bottles" },
  { id:"d06", item:"Aluminium can (rinsed)",         emoji:"🥤", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Green Bin 🌿"],          answer:0, hint:"Aluminium is highly recyclable!" },
  { id:"d07", item:"Newspaper",                      emoji:"📰", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:0, hint:"Paper is great for recycling" },
  { id:"d08", item:"Cooking oil (used)",             emoji:"🫙", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Special collection"],  answer:3, hint:"Never pour oil down the drain" },
  { id:"d09", item:"Plastic bag",                    emoji:"🛍️", options:["Blue Bin ♻️","Grey Bin 🗑️","Store drop-off","Green Bin 🌿"],      answer:2, hint:"Plastic bags jam sorting machines" },
  { id:"d10", item:"Cardboard box (clean)",          emoji:"📦", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:0, hint:"Flatten it and put in blue bin" },
  { id:"d11", item:"Coffee grounds",                 emoji:"☕", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Red Bin ⚠️"],          answer:2, hint:"Coffee grounds are organic waste" },
  { id:"d12", item:"Broken mirror",                  emoji:"🪞", options:["Blue Bin ♻️","Grey Bin 🗑️","Glass Bank","Red Bin ⚠️"],            answer:1, hint:"Broken glass is too dangerous for kerbside" },
  { id:"d13", item:"Empty paint tin",                emoji:"🎨", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Hazardous collection"],  answer:3, hint:"Paint residue is hazardous" },
  { id:"d14", item:"Shampoo bottle (rinsed)",        emoji:"🧴", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Green Bin 🌿"],          answer:0, hint:"HDPE plastic — recyclable when rinsed" },
  { id:"d15", item:"Food-soiled napkins",            emoji:"🧻", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:1, hint:"Food contamination = not recyclable" },
  { id:"d16", item:"AA batteries",                   emoji:"🔋", options:["Grey Bin 🗑️","Blue Bin ♻️","Battery recycling point","Red Bin ⚠️"],answer:2, hint:"Batteries contain toxic materials" },
  { id:"d17", item:"Egg shells",                     emoji:"🥚", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Red Bin ⚠️"],          answer:2, hint:"Egg shells are compostable" },
  { id:"d18", item:"Steel food tin (rinsed)",        emoji:"🥫", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Green Bin 🌿"],          answer:0, hint:"Steel is 100% recyclable!" },
  { id:"d19", item:"Styrofoam takeaway box",         emoji:"🍱", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Styrofoam drop-off"],  answer:1, hint:"Styrofoam can't go in blue bin" },
  { id:"d20", item:"Laptop computer",                emoji:"💻", options:["Grey Bin 🗑️","E-Waste Drop-off","Blue Bin ♻️","Red Bin ⚠️"],      answer:1, hint:"Electronics need special e-waste recycling" },
  { id:"d21", item:"Grass clippings",                emoji:"🌱", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Red Bin ⚠️"],          answer:2, hint:"Garden waste = green bin" },
  { id:"d22", item:"Waxed paper cup",                emoji:"☕", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:1, hint:"Plastic lining makes it non-recyclable" },
  { id:"d23", item:"Motor oil (used)",               emoji:"🛢️", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Hazardous collection"],answer:3, hint:"Motor oil contaminates soil and water" },
  { id:"d24", item:"Aluminium foil (clean)",         emoji:"🫕", options:["Blue Bin ♻️","Grey Bin 🗑️","Red Bin ⚠️","Green Bin 🌿"],          answer:0, hint:"Scrunch test — if it stays scrunched, recycle!" },
  { id:"d25", item:"Tea bags",                       emoji:"🍵", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Red Bin ⚠️"],          answer:2, hint:"Most tea bags are compostable" },
  { id:"d26", item:"Broken ceramic mug",             emoji:"☕", options:["Blue Bin ♻️","Grey Bin 🗑️","Glass Bank","Red Bin ⚠️"],            answer:1, hint:"Ceramics can't be recycled kerbside" },
  { id:"d27", item:"Fluorescent light bulb",         emoji:"💡", options:["Grey Bin 🗑️","Blue Bin ♻️","Hazardous collection","Red Bin ⚠️"],  answer:2, hint:"Contains mercury — needs special disposal" },
  { id:"d28", item:"Cardboard egg carton",           emoji:"🥚", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Red Bin ⚠️"],          answer:0, hint:"Paper/cardboard is recyclable" },
  { id:"d29", item:"Crisp packet",                   emoji:"🍟", options:["Blue Bin ♻️","Grey Bin 🗑️","Green Bin 🌿","Store drop-off"],      answer:1, hint:"Multi-layer plastic — not kerbside recyclable" },
  { id:"d30", item:"Medicine (expired)",             emoji:"💊", options:["Grey Bin 🗑️","Blue Bin ♻️","Green Bin 🌿","Pharmacy return"],     answer:3, hint:"Return medicines to a pharmacy for safe disposal" },
];

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getGameSet = () => shuffleArray(ALL_DETECTIVE_CASES).slice(0, 10);

// ── Story content ─────────────────────────────────────────────────────────
const STORIES = [
  {
    id: "s1", title: "The Journey of a Plastic Bottle",
    emoji: "🧴", color: "#3B82F6",
    pages: [
      { text: "Hi! I'm a plastic water bottle. I was born in a factory from oil and chemicals.", emoji: "🏭" },
      { text: "You drank from me at the park and tossed me in the blue recycling bin. Thank you! 💙", emoji: "🌳" },
      { text: "A truck collected me and took me to a sorting facility. Robots and lasers helped sort me!", emoji: "🤖" },
      { text: "I was cleaned, shredded into tiny flakes, and melted down.", emoji: "♻️" },
      { text: "Those flakes became yarn! Now I'm a fleece jacket keeping someone warm. Amazing, right?", emoji: "🧥" },
      { text: "Without recycling, I'd spend 400 years rotting in landfill. You made a difference! 🌍", emoji: "🌍" },
    ],
  },
  {
    id: "s2", title: "The Paper Trail",
    emoji: "📄", color: "#F59E0B",
    pages: [
      { text: "I started as a tall eucalyptus tree in a managed forest.", emoji: "🌲" },
      { text: "I was cut down, turned into pulp, and pressed into sheets of paper.", emoji: "📝" },
      { text: "People wrote on me, printed newspapers, and made cardboard boxes.", emoji: "📦" },
      { text: "When they were done, they flattened me and put me in recycling.", emoji: "♻️" },
      { text: "I was mixed with water, cleaned of ink, and made into new paper!", emoji: "✨" },
      { text: "Recycling one tonne of paper saves 17 trees. Keep recycling!", emoji: "🌳" },
    ],
  },
  {
    id: "s3", title: "Benny the Banana Peel's Big Adventure",
    emoji: "🍌", color: "#16A34A",
    pages: [
      { text: "I'm Benny! A banana peel. Most people think I'm just rubbish, but I have a secret superpower.", emoji: "🍌" },
      { text: "My human put me in the green organic bin. Score! My adventure begins.", emoji: "♻️" },
      { text: "I arrived at a composting facility with coffee grounds, eggshells, and vegetable scraps.", emoji: "🌿" },
      { text: "Billions of tiny bacteria broke us all down over 8 weeks. It got hot — 60°C! That killed all the germs.", emoji: "🔥" },
      { text: "After resting and cooling, I became dark, rich compost — the most powerful soil food on Earth.", emoji: "🌱" },
      { text: "A farmer used me to grow new vegetables. In a way, I grew again! Nature's perfect recycling loop. 🌀", emoji: "🥦" },
    ],
  },
  {
    id: "s4", title: "The Glass Jar That Wouldn't Give Up",
    emoji: "🫙", color: "#8B5CF6",
    pages: [
      { text: "I'm a jam jar. I've held strawberry jam, pickles, and once — someone's seashell collection.", emoji: "🫙" },
      { text: "After 3 years of service, my lid rusted. My family washed me out and dropped me at the glass bank.", emoji: "🏦" },
      { text: "At the glass furnace, I was melted at 1500°C alongside hundreds of other bottles and jars.", emoji: "🔥" },
      { text: "Here's my favourite fact: glass never wears out. I can be recycled forever without losing quality!", emoji: "✨" },
      { text: "I was poured into a new mould and became a beautiful olive oil bottle at an Italian factory.", emoji: "🫒" },
      { text: "That olive oil was shipped to Sri Lanka. Someone is cooking with me right now. Full circle! 🌍", emoji: "🌍" },
    ],
  },
  {
    id: "s5", title: "Max the Mobile Phone's Last Mission",
    emoji: "📱", color: "#DC2626",
    pages: [
      { text: "I'm Max, a smartphone. My screen cracked, my battery swelled. My owner got a new phone. I felt forgotten.", emoji: "📱" },
      { text: "But instead of the bin, they took me to an e-waste drop-off centre. My last mission started!", emoji: "🏪" },
      { text: "Technicians carefully dismantled me. My screen, camera, speaker — each part inspected.", emoji: "🔧" },
      { text: "My battery was safely removed and sent to a specialist. Lithium is valuable and dangerous — needs care.", emoji: "🔋" },
      { text: "My circuit board was sent to a refinery. Workers extracted 0.03 grams of gold from me. Tiny but real!", emoji: "🥇" },
      { text: "My copper, aluminium, and rare metals were recovered. I helped build new electronics. Not wasted after all! 💪", emoji: "✨" },
    ],
  },
  {
    id: "s6", title: "Tiny Tim: The Aluminium Can Hero",
    emoji: "🥤", color: "#6B7280",
    pages: [
      { text: "Call me Tiny Tim. I was a fizzy drinks can at a school canteen. Emptied in 3 minutes flat.", emoji: "🥤" },
      { text: "A student rinsed me and dropped me in the blue recycling bin. Good human!", emoji: "💧" },
      { text: "I was collected, crushed into a bale with 10,000 other cans, and shipped to a recycling plant.", emoji: "🏭" },
      { text: "Here's something wild: recycling aluminium uses 95% less energy than making new aluminium from ore.", emoji: "⚡" },
      { text: "I was melted, rolled into sheets, and shipped to a drinks factory in less than 60 days.", emoji: "🏎️" },
      { text: "I'm back on the shelf as a new can. The fastest recycling loop on Earth. Always recycle cans! ♻️", emoji: "♻️" },
    ],
  },
  {
    id: "s7", title: "The Lonely Plastic Bag's Mistake",
    emoji: "🛍️", color: "#EF4444",
    pages: [
      { text: "I'm a plastic bag. My owner used me once — for 12 minutes — to carry groceries home.", emoji: "🛍️" },
      { text: "Then they threw me in the blue recycling bin. That was a mistake. I don't belong there.", emoji: "😢" },
      { text: "At the sorting facility, I got tangled in the machinery. I shut down the conveyor belt for 2 hours.", emoji: "⚙️" },
      { text: "Workers had to stop everything and cut me out by hand. My accidental contamination cost time and money.", emoji: "⏰" },
      { text: "The right move? Supermarket soft plastic drop-off bins or reusable bags. Please remember this!", emoji: "🏪" },
      { text: "I could have been recycled into a park bench or a new bag — if I'd gone to the right place. 🪑", emoji: "🌿" },
    ],
  },
  {
    id: "s8", title: "Captain Compost and the Kitchen Waste",
    emoji: "🌱", color: "#059669",
    pages: [
      { text: "I'm Captain Compost! I live in a home compost bin in a backyard. My job is transforming waste into gold.", emoji: "🌱" },
      { text: "Every day, the family drops in fruit peels, tea bags, coffee grounds, and garden clippings.", emoji: "🫖" },
      { text: "Worms, beetles, and fungi join my crew. Together we break everything down, layer by layer.", emoji: "🪱" },
      { text: "After 3 months, the bottom of my bin is filled with dark, crumbly, sweet-smelling compost.", emoji: "🍫" },
      { text: "The family spreads me on their vegetable garden. Their tomatoes grow huge and their roses bloom bright.", emoji: "🍅" },
      { text: "Home composting diverts 30% of household waste from landfill. Start a compost bin today! 🌍", emoji: "🌎" },
    ],
  },
  {
    id: "s9", title: "The Secret Life of a Steel Tin",
    emoji: "🥫", color: "#0EA5E9",
    pages: [
      { text: "I'm a steel food tin. I spent my early life holding baked beans in a dark supermarket shelf.", emoji: "🥫" },
      { text: "After the beans were eaten, my owner rinsed me out and put me in the recycling. Perfect!", emoji: "💧" },
      { text: "At the recycling facility, a giant magnet pulled me away from other materials. Steel is magnetic!", emoji: "🧲" },
      { text: "I was pressed into a cube with hundreds of other tins and loaded onto a truck.", emoji: "🚛" },
      { text: "At the steel mill, I was melted with other scrap steel at 1600°C. My old self disappeared forever.", emoji: "🔥" },
      { text: "I was reborn as a steel beam used in a new apartment building. Still standing strong! 🏢", emoji: "🏗️" },
    ],
  },
  {
    id: "s10", title: "Anika's Recycling Resolution",
    emoji: "👧", color: "#2D5016",
    pages: [
      { text: "Anika was 12. She noticed her family threw everything in the same bin — paper, food, glass, all mixed together.", emoji: "👧" },
      { text: "At school she learned about recycling contamination. Mixed waste often goes straight to landfill — even recyclables!", emoji: "📚" },
      { text: "She came home and set up three bins in the kitchen: blue for recycling, green for organic, grey for general.", emoji: "🗑️" },
      { text: "Her parents were confused at first. What about the pizza box? The greasy napkins? Anika knew the answers.", emoji: "🍕" },
      { text: "After one month, their general waste bin was half full. Their recycling was clean. No more contamination.", emoji: "📊" },
      { text: "One family. Three bins. Big impact. You can be like Anika. Start at home and inspire everyone around you. 💚", emoji: "💚" },
    ],
  },
];

// ── Tab labels ────────────────────────────────────────────────────────────
const TABS = ["Explore","Learn","Detective","Stories","My Progress"];

export default function RecyclingGuideScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Explore");
  const [guides, setGuides]       = useState([]);
  const [progress, setProgress]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, p] = await Promise.all([getGuides(), getMyProgress()]);
      setGuides(g);
      setProgress(p);
    } catch (e) {
      // guides still work without progress (unauthenticated fallback)
      try { const g = await getGuides(); setGuides(g); } catch {}
    } finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const trackProgress = async (action, value) => {
    try {
      const updated = await updateProgress(action, value);
      setProgress(updated);
    } catch {}
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Explore":   return <ExploreTab   guides={guides} navigation={navigation} onTrack={trackProgress} progress={progress} />;
      case "Learn":     return <LearnTab     guides={guides} onTrack={trackProgress} progress={progress} />;
      case "Detective": return <DetectiveTab onTrack={trackProgress} />;
      case "Stories":   return <StoriesTab   progress={progress} onTrack={trackProgress} />;
      case "My Progress": return <MyProgressTab progress={progress} user={user} guides={guides} navigation={navigation} setActiveTab={setActiveTab} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Recycling Guide</Text>
          <Text style={S.headerSub}>Learn · Play · Earn Points</Text>
        </View>
        <View style={S.headerBadge}>
          <Text style={S.headerBadgeTxt}>{progress?.totalScore || 0} pts</Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={S.tabBar} contentContainerStyle={S.tabBarContent}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[S.tab, activeTab === t && S.tabOn]}
            onPress={() => setActiveTab(t)} accessibilityRole="tab">
            <Text style={[S.tabTxt, activeTab === t && S.tabTxtOn]}>{t}</Text>
            {activeTab === t && <View style={S.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={S.loader}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={S.loaderTxt}>Loading guide...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} colors={[COLORS.PRIMARY]} />}
          contentContainerStyle={{ paddingBottom: 28 }}>
          {renderTab()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── EXPLORE TAB ───────────────────────────────────────────────────────────
const QUICK_FACTS = [
  { fact: "Recycling 1 aluminium can saves enough energy to run a TV for 3 hours", emoji: "⚡", color: "#F59E0B" },
  { fact: "Glass can be recycled endlessly without losing quality or purity", emoji: "✨", color: "#8B5CF6" },
  { fact: "Only 9% of all plastic ever produced has been recycled", emoji: "♻️", color: "#3B82F6" },
  { fact: "Composting food waste reduces harmful methane emissions from landfills", emoji: "🌱", color: "#16A34A" },
  { fact: "Recycling paper uses 60% less energy than making paper from raw wood", emoji: "📄", color: "#F59E0B" },
  { fact: "A glass bottle takes 1 million years to decompose in landfill", emoji: "⏳", color: "#8B5CF6" },
  { fact: "Recycling one tonne of steel saves 1.5 tonnes of CO₂ emissions", emoji: "🌍", color: "#059669" },
];

const BINNY_TIPS = [
  "Rinse containers before recycling — food residue causes contamination! 🍽️",
  "Flatten cardboard boxes to save space in your recycling bin 📦",
  "Remove lids from bottles — they're often a different plastic type 🔘",
  "Never bag your recycling — loose items sort better at the facility 🛍️",
  "When in doubt, check! It's better to ask than to contaminate a whole batch 🤔",
];

const ExploreTab = ({ guides, navigation, onTrack, progress }) => {
  const categories  = [...new Set(guides.map(g => g.category))];
  const [tipIdx, setTipIdx] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const fadeAnim   = React.useRef(new Animated.Value(1)).current;
  const scaleAnim  = React.useRef(new Animated.Value(1)).current;
  const slideAnim  = React.useRef(new Animated.Value(0)).current;

  // Animated entrance
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, []);

  // Rotate tip every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setTipIdx(i => (i + 1) % BINNY_TIPS.length);
        setFactIdx(i => (i + 1) % QUICK_FACTS.length);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const pulseCat = (cat) => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onTrack("explore_category", cat);
    navigation.navigate("RecyclingCategory", { category: cat, guides: guides.filter(g => g.category === cat) });
  };

  const explored = progress?.categoriesExplored || [];
  const currentFact = QUICK_FACTS[factIdx];

  return (
    <Animated.View style={[S.tabContent, { opacity: slideAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0,1], outputRange: [30,0] }) }] }]}>

      {/* Hero gradient card */}
      <View style={S.exploreHero}>
        <View style={S.exploreHeroBg} />
        <View style={S.exploreHeroContent}>
          <Text style={S.exploreHeroEmoji}>🌍</Text>
          <Text style={S.exploreHeroTitle}>Learn. Explore. Make a Difference.</Text>
          <Text style={S.exploreHeroSub}>Tap a category to begin your recycling journey</Text>
        </View>
      </View>

      {/* Did You Know card */}
      <View style={[S.factBanner, { backgroundColor: currentFact.color + "20", borderColor: currentFact.color }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 28 }}>{currentFact.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[S.factBannerLabel, { color: currentFact.color }]}>Did You Know?</Text>
            <Text style={[S.factBannerTxt, { color: currentFact.color }]}>{currentFact.fact}</Text>
          </View>
        </View>
        <View style={S.factBannerDots}>
          {QUICK_FACTS.map((_, i) => (
            <View key={i} style={[S.factDot, { backgroundColor: i === factIdx ? currentFact.color : currentFact.color + "40" }, i === factIdx && { width: 14 }]} />
          ))}
        </View>
      </View>

      {/* Binny mascot with animated tip */}
      <View style={S.binnyCardV2}>
        <View style={S.binnyAvatarWrap}>
          <Text style={S.binnyAvatarEmoji}>🗑️</Text>
          <View style={S.binnyOnlineDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.binnyNameV2}>Binny says...</Text>
          <Animated.Text style={[S.binnyTipTxt, { opacity: fadeAnim }]}>{BINNY_TIPS[tipIdx]}</Animated.Text>
        </View>
      </View>

      {/* AI Recycling Assistant banner */}
      <TouchableOpacity style={S.aiBanner} onPress={() => navigation.navigate("WasteScan")}
        accessibilityRole="button" accessibilityLabel="AI Recycling Assistant">
        <View style={S.aiBannerLeft}>
          <Text style={S.aiBannerEmoji}>🤖</Text>
          <View>
            <Text style={S.aiBannerTitle}>AI Recycling Assistant</Text>
            <Text style={S.aiBannerSub}>Scan or type any item — AI tells you how to dispose it</Text>
          </View>
        </View>
        <Text style={S.aiBannerArrow}>→</Text>
      </TouchableOpacity>

      {/* Category grid with explore indicators */}
      <View style={S.catSectionHeader}>
        <Text style={S.sectionLabel}>Explore Categories</Text>
        <Text style={S.catProgress}>{explored.length}/{categories.length} explored</Text>
      </View>

      <View style={S.catGridV2}>
        {categories.map((cat, idx) => {
          const cfg    = getCat(cat);
          const count  = guides.filter(g => g.category === cat).length;
          const isExplored = explored.includes(cat);
          return (
            <TouchableOpacity key={cat}
              style={[S.catCardV2, { backgroundColor: cfg.bg, borderColor: isExplored ? cfg.color : cfg.color + "30" },
                isExplored && { borderWidth: 2 }]}
              onPress={() => pulseCat(cat)}
              activeOpacity={0.75}
              accessibilityRole="button" accessibilityLabel={cat}>
              {/* Explored checkmark */}
              {isExplored && (
                <View style={[S.catExploredBadge, { backgroundColor: cfg.color }]}>
                  <Text style={S.catExploredTxt}>✓</Text>
                </View>
              )}
              <Text style={S.catEmojiV2}>{cfg.emoji}</Text>
              <Text style={[S.catNameV2, { color: cfg.color }]}>{cat}</Text>
              <Text style={S.catDescV2}>{cfg.desc}</Text>
              <View style={S.catFooter}>
                <View style={[S.catCountV2, { backgroundColor: cfg.color + "20" }]}>
                  <Text style={[S.catCountTxtV2, { color: cfg.color }]}>{count} guides</Text>
                </View>
                <Text style={[S.catArrow, { color: cfg.color }]}>→</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Impact counter */}
      <View style={S.impactCard}>
        <Text style={S.impactTitle}>🌱 Your Learning Impact</Text>
        <View style={S.impactRow}>
          {[
            { label: "Categories", value: explored.length, emoji: "📚" },
            { label: "Points earned", value: progress?.totalScore || 0, emoji: "⭐" },
            { label: "Stories read", value: progress?.completedStories?.length || 0, emoji: "📖" },
          ].map((s, i) => (
            <View key={i} style={S.impactStat}>
              <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
              <Text style={S.impactStatNum}>{s.value}</Text>
              <Text style={S.impactStatLbl}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

    </Animated.View>
  );
};

// ── LEARN TAB ─────────────────────────────────────────────────────────────
const LearnTab = ({ guides, onTrack, progress }) => {
  const [selectedCat, setSelectedCat] = useState("All");
  const categories = ["All", ...new Set(guides.map(g => g.category))];
  const filtered = selectedCat === "All" ? guides : guides.filter(g => g.category === selectedCat);
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={S.tabContent}>
      <Text style={S.sectionLabel}>Category Learning Hub</Text>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.catFilterRow}>
        {categories.map(c => {
          const cfg = getCat(c);
          return (
            <TouchableOpacity key={c}
              style={[S.catFilter, selectedCat === c && { backgroundColor: c === "All" ? COLORS.PRIMARY : cfg.color, borderColor: c === "All" ? COLORS.PRIMARY : cfg.color }]}
              onPress={() => setSelectedCat(c)} accessibilityRole="button">
              <Text style={[S.catFilterTxt, selectedCat === c && { color: "#fff", fontWeight: "700" }]}>
                {c === "All" ? "All" : `${cfg.emoji} ${c}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Guide cards */}
      {filtered.map((guide) => {
        const cfg  = getCat(guide.category);
        const isSaved = progress?.savedGuides?.includes(guide._id);
        const isOpen  = expanded === guide._id;
        return (
          <View key={guide._id} style={[S.guideCard, { borderLeftColor: cfg.color }]}>
            <TouchableOpacity style={S.guideCardHeader}
              onPress={() => setExpanded(isOpen ? null : guide._id)}
              accessibilityRole="button">
              <View style={[S.guideIconWrap, { backgroundColor: cfg.bg }]}>
                <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
              </View>
              <View style={S.guideTitleWrap}>
                <Text style={S.guideTitle}>{guide.title}</Text>
                <View style={[S.guideCatBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[S.guideCatBadgeTxt, { color: cfg.color }]}>{guide.category}</Text>
                </View>
              </View>
              <Text style={[S.guideChevron, { color: cfg.color }]}>{isOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {isOpen && (
              <View style={S.guideBody}>
                <Text style={S.guideContent}>{guide.content}</Text>
                {guide.tips?.length > 0 && (
                  <>
                    <Text style={[S.guideTipsTitle, { color: cfg.color }]}>Quick Tips</Text>
                    {guide.tips.map((tip, i) => (
                      <View key={i} style={S.guideTipRow}>
                        <View style={[S.guideTipDot, { backgroundColor: cfg.color }]} />
                        <Text style={S.guideTipTxt}>{tip}</Text>
                      </View>
                    ))}
                  </>
                )}
                <TouchableOpacity style={[S.saveBtn, isSaved && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => onTrack(isSaved ? "unsave_guide" : "save_guide", guide._id)}
                  accessibilityRole="button">
                  <Text style={[S.saveBtnTxt, isSaved && { color: cfg.color }]}>
                    {isSaved ? "🔖 Saved" : "🔖 Save Guide"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ── DETECTIVE TAB ─────────────────────────────────────────────────────────
const DetectiveTab = ({ onTrack }) => {
  const [cases, setCases]       = useState(() => getGameSet());
  const [caseIdx, setCaseIdx]   = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setResult] = useState(false);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  const current = cases[caseIdx];
  const isCorrect = selected === current.answer;

  const handleAnswer = (i) => {
    if (showResult) return;
    setSelected(i);
    setResult(true);
    const correct = i === current.answer;
    if (correct) setScore(s => s + 1);
    onTrack("detective_result", correct ? "correct" : "wrong");
  };

  const next = () => {
    if (caseIdx + 1 >= cases.length) { setDone(true); return; }
    setCaseIdx(i => i + 1);
    setSelected(null);
    setResult(false);
  };

  const restart = () => {
    setCases(getGameSet()); // new shuffled set each time
    setCaseIdx(0); setSelected(null); setResult(false); setScore(0); setDone(false);
  };

  if (done) return (
    <View style={S.tabContent}>
      <View style={S.detectiveResult}>
        <Text style={{ fontSize: 64 }}>{score >= 6 ? "🏆" : score >= 4 ? "⭐" : "💪"}</Text>
        <Text style={S.detectiveResultTitle}>Case Closed!</Text>
        <Text style={S.detectiveResultScore}>{score}/{cases.length} correct</Text>
        <Text style={S.detectiveResultMsg}>
          {score >= 6 ? "Excellent! You're a recycling expert!" : score >= 4 ? "Good work! Keep practising." : "Keep learning — you'll get there!"}
        </Text>
        <TouchableOpacity style={S.detectivePlayAgain} onPress={restart}
          accessibilityRole="button">
          <Text style={S.detectivePlayAgainTxt}>🔄 Play Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={S.tabContent}>
      {/* Header */}
      <View style={S.detectiveHeader}>
        <View style={S.detectiveBadge}>
          <Text style={S.detectiveBadgeTxt}>🔍 Case #{caseIdx + 1}</Text>
        </View>
        <Text style={S.detectiveProgress}>{caseIdx + 1} / {cases.length}</Text>
      </View>

      {/* Question */}
      <View style={S.detectiveQuestion}>
        <Text style={S.detectiveItemEmoji}>{current.emoji}</Text>
        <Text style={S.detectiveItemTitle}>What should be done with this item?</Text>
        <Text style={S.detectiveItemName}>{current.item}</Text>
      </View>

      {/* Options */}
      <View style={S.detectiveOptions}>
        {current.options.map((opt, i) => {
          let bg = COLORS.SURFACE, border = COLORS.BORDER, txtColor = COLORS.TEXT_PRIMARY;
          if (showResult) {
            if (i === current.answer) { bg = "#DCFCE7"; border = "#16A34A"; txtColor = "#166534"; }
            else if (i === selected) { bg = "#FEE2E2"; border = "#DC2626"; txtColor = "#991B1B"; }
          } else if (i === selected) { bg = COLORS.PRIMARY_TINT; border = COLORS.PRIMARY; txtColor = COLORS.PRIMARY; }
          return (
            <TouchableOpacity key={i} style={[S.detectiveOption, { backgroundColor: bg, borderColor: border }]}
              onPress={() => handleAnswer(i)} accessibilityRole="button">
              <Text style={[S.detectiveOptionTxt, { color: txtColor }]}>{opt}</Text>
              {showResult && i === current.answer && <Text style={{ color: "#16A34A", fontWeight: "800" }}>✓</Text>}
              {showResult && i === selected && i !== current.answer && <Text style={{ color: "#DC2626", fontWeight: "800" }}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint & Next */}
      {showResult && (
        <View style={S.detectiveHint}>
          <Text style={S.detectiveHintEmoji}>💡</Text>
          <Text style={S.detectiveHintTxt}>{current.hint}</Text>
        </View>
      )}
      {showResult && (
        <TouchableOpacity style={S.detectiveNextBtn} onPress={next}
          accessibilityRole="button">
          <Text style={S.detectiveNextBtnTxt}>
            {caseIdx + 1 >= cases.length ? "See Results 🏆" : "Next Case →"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Need a hint */}
      {!showResult && (
        <View style={S.detectiveCollect}>
          <Text style={S.detectiveCollectTxt}>🔍 Collect clues to find the right answer!</Text>
        </View>
      )}
    </View>
  );
};

// ── STORIES TAB ───────────────────────────────────────────────────────────
const StoriesTab = ({ progress, onTrack }) => {
  const [activeStory, setActiveStory] = useState(null);
  const [page, setPage]               = useState(0);

  if (activeStory) {
    const story = STORIES.find(s => s.id === activeStory);
    const current = story.pages[page];
    const isLast = page === story.pages.length - 1;
    return (
      <View style={S.tabContent}>
        <View style={[S.storyCard, { borderTopColor: story.color }]}>
          <View style={S.storyPageHeader}>
            <TouchableOpacity onPress={() => { setActiveStory(null); setPage(0); }}
              style={S.storyBackBtn} accessibilityRole="button">
              <Text style={S.storyBackTxt}>← Back</Text>
            </TouchableOpacity>
            <Text style={[S.storyPageNum, { color: story.color }]}>{page + 1} / {story.pages.length}</Text>
          </View>
          <Text style={S.storyTitle}>{story.title}</Text>

          {/* Page indicator dots */}
          <View style={S.storyDots}>
            {story.pages.map((_, i) => (
              <View key={i} style={[S.storyDot, i === page && { backgroundColor: story.color, width: 20 }]} />
            ))}
          </View>

          <View style={S.storyPageContent}>
            <Text style={S.storyPageEmoji}>{current.emoji}</Text>
            <Text style={S.storyPageTxt}>{current.text}</Text>
          </View>

          <View style={S.storyNav}>
            <TouchableOpacity style={[S.storyNavBtn, page === 0 && { opacity: 0.3 }]}
              onPress={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              accessibilityRole="button">
              <Text style={S.storyNavBtnTxt}>← Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.storyNavBtn, S.storyNavBtnPrimary, { backgroundColor: story.color }]}
              onPress={() => {
                if (isLast) {
                  onTrack("complete_story", story.id);
                  setActiveStory(null); setPage(0);
                  Alert.alert("🎉 Story Complete!", `You earned 25 points for completing "${story.title}"!`);
                } else setPage(p => p + 1);
              }} accessibilityRole="button">
              <Text style={[S.storyNavBtnTxt, { color: "#fff", fontWeight: "700" }]}>
                {isLast ? "Finish ✓" : "Next →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={S.tabContent}>
      <Text style={S.sectionLabel}>Interactive Stories</Text>
      <Text style={S.sectionSub}>Follow waste items on their recycling journey</Text>
      {STORIES.map(story => {
        const done = progress?.completedStories?.includes(story.id);
        return (
          <TouchableOpacity key={story.id}
            style={[S.storyListCard, { borderTopColor: story.color }]}
            onPress={() => { setActiveStory(story.id); setPage(0); }}
            accessibilityRole="button">
            <View style={[S.storyListEmoji, { backgroundColor: story.color + "18" }]}>
              <Text style={{ fontSize: 32 }}>{story.emoji}</Text>
            </View>
            <View style={S.storyListInfo}>
              <Text style={S.storyListTitle}>{story.title}</Text>
              <Text style={S.storyListMeta}>{story.pages.length} pages · +25 pts</Text>
            </View>
            {done
              ? <View style={S.storyDoneBadge}><Text style={S.storyDoneTxt}>✓ Done</Text></View>
              : <View style={[S.storyStartBtn, { backgroundColor: story.color }]}>
                  <Text style={S.storyStartTxt}>Read →</Text>
                </View>}
          </TouchableOpacity>
        );
      })}

      {/* Facility tour card */}
      <View style={S.facilityCard}>
        <Text style={S.facilityTitle}>🏭 Inside the Recycling Facility</Text>
        <Text style={S.facilitySub}>See what happens behind the scenes</Text>
        {[
          { step: "1. Collection",  emoji: "🚛", desc: "Trucks collect sorted recyclables from kerbside bins" },
          { step: "2. Sorting",     emoji: "🤖", desc: "Machines and lasers separate materials by type" },
          { step: "3. Cleaning",    emoji: "💧", desc: "Materials are washed to remove food residue and contaminants" },
          { step: "4. Processing",  emoji: "⚙️", desc: "Materials are shredded, melted, or pulped into raw materials" },
          { step: "5. New Products",emoji: "✨", desc: "Raw materials are sold to manufacturers to make new products" },
        ].map((s, i) => (
          <View key={i} style={S.facilityStep}>
            <View style={S.facilityStepNum}><Text style={S.facilityStepNumTxt}>{i+1}</Text></View>
            <Text style={{ fontSize: 20, marginHorizontal: 10 }}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.facilityStepTitle}>{s.step}</Text>
              <Text style={S.facilityStepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── MY PROGRESS TAB ────────────────────────────────────────────────────────
const LEVELS = [
  { min: 0,   max: 49,  label: "Eco Beginner",  emoji: "🌱", color: "#6B7280", next: 50  },
  { min: 50,  max: 149, label: "Eco Learner",   emoji: "📗", color: "#16A34A", next: 150 },
  { min: 150, max: 299, label: "Eco Explorer",  emoji: "🌍", color: "#2D5016", next: 300 },
  { min: 300, max: 499, label: "Eco Champion",  emoji: "🏆", color: "#D97706", next: 500 },
  { min: 500, max: Infinity, label: "Eco Master", emoji: "⭐", color: "#7C3AED", next: null },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

const ACHIEVEMENTS = [
  { id: "first_explore",   label: "First Steps",         emoji: "👣", desc: "Explored your first category",    check: (p) => p?.categoriesExplored?.length >= 1 },
  { id: "all_categories",  label: "Category Master",      emoji: "📚", desc: "Explored all 7 categories",       check: (p) => p?.categoriesExplored?.length >= 7 },
  { id: "first_story",     label: "Storyteller",          emoji: "📖", desc: "Completed your first story",      check: (p) => p?.completedStories?.length >= 1 },
  { id: "all_stories",     label: "Story Champion",       emoji: "📚", desc: "Completed 5 stories",             check: (p) => p?.completedStories?.length >= 5 },
  { id: "detective_5",     label: "Junior Detective",     emoji: "🔍", desc: "Played 5 detective cases",        check: (p) => p?.detectiveCasesPlayed >= 5 },
  { id: "detective_ace",   label: "Detective Ace",        emoji: "🕵️", desc: "Got 10 correct answers",         check: (p) => p?.detectiveCasesCorrect >= 10 },
  { id: "score_100",       label: "Century Scorer",       emoji: "💯", desc: "Earned 100 points",              check: (p) => p?.totalScore >= 100 },
  { id: "score_500",       label: "Point Legend",         emoji: "🌟", desc: "Earned 500 points",              check: (p) => p?.totalScore >= 500 },
  { id: "saver_1",         label: "Guide Saver",          emoji: "🔖", desc: "Saved your first guide",         check: (p) => p?.savedGuides?.length >= 1 },
  { id: "saver_5",         label: "Library Builder",      emoji: "📕", desc: "Saved 5 guides to library",      check: (p) => p?.savedGuides?.length >= 5 },
];

const MyProgressTab = ({ progress, user, guides, navigation, setActiveTab }) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const barAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pct = progress?.totalScore ? Math.min(1, (progress.totalScore % 150) / 150) : 0;
    Animated.timing(progressAnim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
    Animated.timing(barAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
  }, [progress]);

  const score  = progress?.totalScore || 0;
  const level  = getLevel(score);
  const nextPts = level.next ? level.next - score : 0;
  const pct    = level.next ? Math.min(100, ((score - level.min) / (level.next - level.min)) * 100) : 100;

  const unlocked = ACHIEVEMENTS.filter(a => a.check(progress));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(progress));

  // Activity data for bar chart
  const activityData = [
    { label: "Explore", value: progress?.categoriesExplored?.length || 0, max: 7, color: "#3B82F6" },
    { label: "Stories", value: progress?.completedStories?.length || 0, max: 10, color: "#F59E0B" },
    { label: "Detective", value: progress?.detectiveCasesPlayed || 0, max: 20, color: "#06B6D4" },
    { label: "Saved", value: progress?.savedGuides?.length || 0, max: 15, color: "#8B5CF6" },
  ];

  // Weekly progress data (AI scans - simulated based on total score)
  const weeklyData = [
    { day: "Mon", value: Math.floor(score * 0.15) },
    { day: "Tue", value: Math.floor(score * 0.20) },
    { day: "Wed", value: Math.floor(score * 0.25) },
    { day: "Thu", value: Math.floor(score * 0.18) },
    { day: "Fri", value: Math.floor(score * 0.12) },
    { day: "Sat", value: Math.floor(score * 0.08) },
    { day: "Sun", value: Math.floor(score * 0.02) },
  ];

  const maxWeeklyScans = Math.max(...weeklyData.map(d => d.value), 1);

  // Activity trend data (points earned over time)
  const trendData = [
    { label: "Week 1", value: Math.floor(score * 0.15) },
    { label: "Week 2", value: Math.floor(score * 0.20) },
    { label: "Week 3", value: Math.floor(score * 0.30) },
    { label: "Week 4", value: Math.floor(score * 0.35) },
  ];
  const maxTrendValue = Math.max(...trendData.map(d => d.value), 1);

  return (
    <View style={S.progressTabContent}>
      {/* Profile card */}
      <View style={[S.progressProfileCard, { backgroundColor: level.color }]}>
        <View style={S.progressProfileTop}>
          <View style={S.progressAvatar}><Text style={S.progressAvatarTxt}>👤</Text></View>
          <View style={S.progressProfileInfo}>
            <Text style={S.progressProfileName}>{user?.name || "Eco Learner"}</Text>
            <View style={S.progressLevelBadge}>
              <Text style={S.progressLevelEmoji}>{level.emoji}</Text>
              <Text style={S.progressLevelLabel}>{level.label}</Text>
            </View>
          </View>
          <View style={S.progressScoreBox}>
            <Text style={S.progressScoreNum}>{score}</Text>
            <Text style={S.progressScoreLbl}>pts</Text>
          </View>
        </View>
        {/* XP Bar */}
        <View style={S.progressXpSection}>
          <View style={S.progressXpBarBg}>
            <Animated.View style={[S.progressXpBarFill, {
              width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }),
            }]} />
          </View>
          <Text style={S.progressXpLabel}>
            {level.next ? `${nextPts} pts to ${LEVELS[LEVELS.indexOf(level) + 1]?.label}` : "Max level reached! 🎉"}
          </Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={S.progressSectionLabel}>My Impact</Text>
      <View style={S.progressStatsGrid}>
        {[
          { label: "Categories Explored",  value: progress?.categoriesExplored?.length || 0, emoji: "📚", color: "#3B82F6" },
          { label: "Guides Saved",          value: progress?.savedGuides?.length || 0,         emoji: "🔖", color: "#8B5CF6" },
          { label: "Stories Completed",     value: progress?.completedStories?.length || 0,    emoji: "📖", color: "#F59E0B" },
          { label: "Detective Cases",       value: progress?.detectiveCasesPlayed || 0,         emoji: "🔍", color: "#06B6D4" },
          { label: "Correct Answers",       value: progress?.detectiveCasesCorrect || 0,        emoji: "✓",  color: "#16A34A" },
          { label: "Total Points",          value: score,                                        emoji: "⭐", color: "#D97706" },
        ].map((s, i) => (
          <View key={i} style={[S.progressStatCard, { borderTopColor: s.color }]}>
            <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
            <Text style={[S.progressStatNum, { color: s.color }]}>{s.value}</Text>
            <Text style={S.progressStatLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Activity Bar Chart */}
      <Text style={S.progressSectionLabel}>Activity Overview</Text>
      <View style={[S.progressChartCard, { marginHorizontal: 24 }]}>
        <Text style={S.progressChartTitle}>Your Learning Activity</Text>
        <View style={S.progressChartBars}>
          {activityData.map((item, i) => {
            const percentage = Math.min(100, (item.value / item.max) * 100);
            return (
              <View key={i} style={S.progressChartBarRow}>
                <Text style={S.progressChartBarLabel}>{item.label}</Text>
                <View style={S.progressChartBarTrack}>
                  <Animated.View
                    style={[
                      S.progressChartBarFill,
                      {
                        width: barAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", `${percentage}%`],
                        }),
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={S.progressChartBarValue}>{item.value}/{item.max}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Weekly Progress Chart */}
      <Text style={S.progressSectionLabel}>Weekly Progress</Text>
      <View style={[S.progressChartCard, { marginHorizontal: 24 }]}>
        <Text style={S.progressChartTitle}>AI Scans This Week</Text>
        <View style={S.progressLineChart}>
          <View style={S.progressLineChartBars}>
            {weeklyData.map((item, i) => {
              const barHeight = barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(10, (item.value / maxWeeklyScans) * 80)],
              });
              return (
                <View key={i} style={S.progressLineChartBarCol}>
                  <Animated.View
                    style={[
                      S.progressLineChartBar,
                      {
                        height: barHeight,
                        backgroundColor: i === 2 ? COLORS.PRIMARY : COLORS.PRIMARY + "80",
                      },
                    ]}
                  />
                  <Text style={S.progressLineChartLabel}>{item.day}</Text>
                  <Text style={S.progressLineChartValue}>{item.value}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Activity Trend Line Chart */}
      <Text style={S.progressSectionLabel}>Activity Trend</Text>
      <View style={[S.progressChartCard, { marginHorizontal: 24 }]}>
        <Text style={S.progressChartTitle}>Points Earned Over Time</Text>
        <View style={S.progressTrendChart}>
          <View style={S.progressTrendLineContainer}>
            {trendData.map((item, i) => {
              const x = (i / (trendData.length - 1)) * 260 + 20;
              const y = 100 - ((item.value / maxTrendValue) * 70 + 15);
              const prevX = i > 0 ? ((i - 1) / (trendData.length - 1)) * 260 + 20 : x;
              const prevY = i > 0 ? 100 - ((trendData[i - 1].value / maxTrendValue) * 70 + 15) : y;
              const lineLength = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
              const angle = Math.atan2(y - prevY, x - prevX) * (180 / Math.PI);

              return (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <Animated.View
                      style={[
                        S.progressTrendLine,
                        {
                          left: prevX,
                          top: prevY,
                          width: lineLength,
                          transform: [{ rotate: `${angle}deg` }],
                        },
                      ]}
                    />
                  )}
                  <View style={[S.progressTrendPoint, { left: x - 6, top: y - 6 }]}>
                    <Text style={S.progressTrendPointValue}>{item.value}</Text>
                  </View>
                  <Text style={[S.progressTrendLabel, { left: x - 15, top: y + 15, position: "absolute" }]}>{item.label}</Text>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </View>

      {/* Category progress */}
      <Text style={S.progressSectionLabel}>Categories Explored</Text>
      <View style={S.progressCatCard}>
        {["Plastic","Glass","Paper","Metal","Organic","E-Waste","Hazardous"].map((cat, i) => {
          const explored = progress?.categoriesExplored?.includes(cat);
          const catColors = ["#3B82F6","#8B5CF6","#F59E0B","#6B7280","#16A34A","#DC2626","#D97706"];
          const catEmojis = ["🧴","🍶","📄","🥫","🌿","📱","⚠️"];
          return (
            <View key={i} style={S.progressCatRow}>
              <Text style={{ fontSize: 20, width: 28 }}>{catEmojis[i]}</Text>
              <Text style={[S.progressCatName, !explored && { color: COLORS.TEXT_DISABLED }]}>{cat}</Text>
              <View style={[S.progressCatPill, { backgroundColor: explored ? catColors[i] + "20" : COLORS.BORDER }]}>
                <Text style={[S.progressCatPillTxt, { color: explored ? catColors[i] : COLORS.TEXT_DISABLED }]}>
                  {explored ? "✓ Explored" : "Not yet"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Achievements */}
      <Text style={S.progressSectionLabel}>Achievements ({unlocked.length}/{ACHIEVEMENTS.length})</Text>

      {unlocked.length > 0 && (
        <>
          <Text style={S.achievementSubLabel}>Unlocked 🎉</Text>
          <View style={S.progressAchievementsGrid}>
            {unlocked.map((a) => (
              <View key={a.id} style={[S.progressAchievementCard, S.progressAchievementUnlocked]}>
                <Text style={S.progressAchievementEmoji}>{a.emoji}</Text>
                <Text style={S.progressAchievementLabel}>{a.label}</Text>
                <Text style={S.progressAchievementDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {locked.length > 0 && (
        <>
          <Text style={S.achievementSubLabel}>Locked 🔒</Text>
          <View style={S.progressAchievementsGrid}>
            {locked.map((a) => (
              <View key={a.id} style={[S.progressAchievementCard, S.progressAchievementLocked]}>
                <Text style={[S.progressAchievementEmoji, { opacity: 0.3 }]}>{a.emoji}</Text>
                <Text style={[S.progressAchievementLabel, { color: COLORS.TEXT_DISABLED }]}>{a.label}</Text>
                <Text style={S.progressAchievementDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* My Library */}
      <Text style={S.progressSectionLabel}>My Library</Text>
      {progress?.savedGuides?.length === 0 ? (
        <View style={[S.emptyLibrary, { marginHorizontal: 24 }]}>
          <Text style={{ fontSize: 32 }}>🔖</Text>
          <Text style={S.emptyLibraryTxt}>No saved guides yet. Tap "Save Guide" while learning!</Text>
        </View>
      ) : (
        <View style={[S.libraryCard, { marginHorizontal: 24 }]}>
          <Text style={S.libraryCardTitle}>Saved Guides · {progress?.savedGuides?.length || 0} items</Text>
          {guides?.filter(g => progress?.savedGuides?.includes(g._id)).map((g, i) => {
            const cfg = getCat(g.category);
            return (
              <TouchableOpacity
                key={i}
                style={[S.libraryItem, i > 0 && S.libraryItemBorder]}
                onPress={() => {
                  setActiveTab("Learn");
                }}
                accessibilityRole="button"
                accessibilityLabel={`Open ${g.title}`}
              >
                <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={S.libraryItemTitle}>{g.title}</Text>
                  <Text style={[S.libraryItemCat, { color: cfg.color }]}>{g.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Motivational footer */}
      <View style={[S.progressMotivCard, { backgroundColor: COLORS.PRIMARY }]}>
        <Text style={S.progressMotivEmoji}>🌱</Text>
        <Text style={S.progressMotivTxt}>
          {score === 0 ? "Start exploring to earn your first points!" :
           score < 50 ? "Great start! Keep exploring categories." :
           score < 150 ? "You're making a real difference!" :
           "You're an eco champion. Keep it up! 🏆"}
        </Text>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:           { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:          { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:         { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:        { flex: 1 },
  headerTitle:      { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:        { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  headerBadge:      { backgroundColor: COLORS.ACCENT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  headerBadgeTxt:   { color: "#fff", fontWeight: "800", fontSize: 12 },
  tabBar:           { backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, maxHeight: 48 },
  tabBarContent:    { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: "row" },
  tab:              { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, position: "relative" },
  tabOn:            { backgroundColor: COLORS.PRIMARY_TINT },
  tabTxt:           { fontSize: 13, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  tabTxtOn:         { color: COLORS.PRIMARY, fontWeight: "800" },
  tabIndicator:     {},
  loader:           { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 60 },
  loaderTxt:        { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  tabContent:       { paddingHorizontal: 16, paddingTop: 14 },
  sectionLabel:     { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 6 },
  sectionSub:       { fontSize: 12, color: COLORS.TEXT_DISABLED, marginBottom: 12, marginTop: -6 },
  // Hero
  hero:             { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 16, padding: 16, marginBottom: 12, gap: 12 },
  heroEmoji:        { fontSize: 40 },
  heroText:         { flex: 1 },
  heroTitle:        { fontSize: 16, fontWeight: "800", color: "#fff" },
  heroSub:          { fontSize: 12, color: COLORS.PRIMARY_TINT, marginTop: 4 },
  // Binny
  binnyCard:        { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", borderRadius: 14, padding: 14, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: "#C8E6C9" },
  binnyEmoji:       { fontSize: 32 },
  binnyTitle:       { fontSize: 14, fontWeight: "700", color: "#2E7D32", marginBottom: 3 },
  binnySub:         { fontSize: 12, color: "#388E3C", lineHeight: 17 },
  // Category grid
  catGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  catCard:          { width: "47%", borderRadius: 16, padding: 14, borderWidth: 1, elevation: 2, gap: 4 },
  catEmoji:         { fontSize: 32, marginBottom: 4 },
  catName:          { fontSize: 15, fontWeight: "800" },
  catDesc:          { fontSize: 11, color: COLORS.TEXT_SECONDARY, lineHeight: 15 },
  catCount:         { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 },
  catCountTxt:      { fontSize: 10, color: "#fff", fontWeight: "700" },
  // Facts
  factsRow:         { gap: 10, paddingBottom: 4 },
  factCard:         { width: 200, backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  factEmoji:        { fontSize: 24, marginBottom: 8 },
  factTxt:          { fontSize: 12, color: COLORS.TEXT_PRIMARY, lineHeight: 17 },
  // ── NEW EXPLORE STYLES ──────────────────────────────────────────────────
  // AI Banner
  aiBanner:         { flexDirection: "row", alignItems: "center", backgroundColor: "#1E1B4B", borderRadius: 16, padding: 14, marginBottom: 14, elevation: 3 },
  aiBannerLeft:     { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiBannerEmoji:    { fontSize: 28 },
  aiBannerTitle:    { fontSize: 14, fontWeight: "800", color: "#fff" },
  aiBannerSub:      { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  aiBannerArrow:    { fontSize: 20, color: "#fff", fontWeight: "700" },
  exploreHero:      { borderRadius: 20, overflow: "hidden", marginBottom: 14, elevation: 4 },
  exploreHeroBg:    { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.PRIMARY },
  exploreHeroContent:{ padding: 20, paddingBottom: 18 },
  exploreHeroEmoji: { fontSize: 44, marginBottom: 6 },
  exploreHeroTitle: { fontSize: 20, fontWeight: "900", color: "#fff", lineHeight: 26 },
  exploreHeroSub:   { fontSize: 13, color: COLORS.PRIMARY_TINT, marginTop: 4, marginBottom: 14 },
  exploreHeroStats: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 10 },
  exploreHeroStat:  { flex: 1, alignItems: "center" },
  exploreHeroStatNum:{ fontSize: 22, fontWeight: "900", color: "#fff" },
  exploreHeroStatLbl:{ fontSize: 10, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  exploreHeroStatDivider:{ width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  // Animated fact banner
  factBanner:       { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1.5, elevation: 0 },
  factBannerEmoji:  { fontSize: 28 },
  factBannerLabel:  { fontSize: 9, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  factBannerTxt:    { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  factBannerDots:   { flexDirection: "row", gap: 4, marginTop: 8 },
  factDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.BORDER },
  // Binny v2
  binnyCardV2:      { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", borderRadius: 16, padding: 14, marginBottom: 16, gap: 12, borderWidth: 1.5, borderColor: "#BBF7D0", elevation: 1 },
  binnyAvatarWrap:  { width: 52, height: 52, borderRadius: 26, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center", position: "relative" },
  binnyAvatarEmoji: { fontSize: 28 },
  binnyOnlineDot:   { position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: "#16A34A", borderWidth: 2, borderColor: "#fff" },
  binnyNameV2:      { fontSize: 11, fontWeight: "800", color: "#166534", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
  binnyTipTxt:      { fontSize: 13, color: "#15803D", lineHeight: 18 },
  // Category section header
  catSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  catProgress:      { fontSize: 11, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  // Category grid v2
  catGridV2:        { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  catCardV2:        { width: "47%", borderRadius: 18, padding: 14, borderWidth: 1.5, elevation: 3, gap: 4, position: "relative", overflow: "hidden" },
  catEmojiV2:       { fontSize: 36, marginBottom: 6 },
  catNameV2:        { fontSize: 15, fontWeight: "900" },
  catDescV2:        { fontSize: 11, color: COLORS.TEXT_SECONDARY, lineHeight: 15, marginBottom: 8 },
  catFooter:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catCountV2:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  catCountTxtV2:    { fontSize: 10, fontWeight: "700" },
  catArrow:         { fontSize: 16, fontWeight: "800" },
  catExploredBadge: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  catExploredTxt:   { color: "#fff", fontSize: 11, fontWeight: "900" },
  // Impact card
  impactCard:       { backgroundColor: COLORS.PRIMARY, borderRadius: 16, padding: 14, marginBottom: 16, elevation: 2 },
  impactTitle:      { fontSize: 13, fontWeight: "800", color: "#fff", marginBottom: 12 },
  impactRow:        { flexDirection: "row" },
  impactStat:       { flex: 1, alignItems: "center", gap: 2 },
  impactStatNum:    { fontSize: 20, fontWeight: "900", color: "#fff" },
  impactStatLbl:    { fontSize: 9, color: COLORS.PRIMARY_TINT, textAlign: "center" },
  // Quick action cards
  quickActionsRow:  { flexDirection: "row", gap: 10, marginBottom: 4 },
  quickActionCard:  { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 6, borderWidth: 1, elevation: 1 },
  quickActionLbl:   { fontSize: 11, fontWeight: "700", textAlign: "center" },
  // Learn tab
  catFilterRow:     { gap: 8, paddingBottom: 12 },
  catFilter:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE },
  catFilterTxt:     { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  // Guide cards
  guideCard:        { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  guideCardHeader:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  guideIconWrap:    { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  guideTitleWrap:   { flex: 1 },
  guideTitle:       { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  guideCatBadge:    { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  guideCatBadgeTxt: { fontSize: 10, fontWeight: "700" },
  guideChevron:     { fontSize: 12, fontWeight: "700" },
  guideBody:        { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, paddingTop: 12 },
  guideContent:     { fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 20, marginBottom: 12 },
  guideTipsTitle:   { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  guideTipRow:      { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  guideTipDot:      { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  guideTipTxt:      { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },
  saveBtn:          { backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 10, paddingVertical: 9, alignItems: "center", marginTop: 10, borderWidth: 1.5, borderColor: COLORS.BORDER },
  saveBtnTxt:       { fontSize: 13, fontWeight: "700", color: COLORS.PRIMARY },
  // Detective
  detectiveHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  detectiveBadge:   { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  detectiveBadgeTxt:{ color: "#fff", fontWeight: "700", fontSize: 12 },
  detectiveProgress:{ fontSize: 13, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  detectiveQuestion:{ backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  detectiveItemEmoji:{ fontSize: 56, marginBottom: 12 },
  detectiveItemTitle:{ fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 6 },
  detectiveItemName: { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  detectiveOptions: { gap: 10, marginBottom: 14 },
  detectiveOption:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: COLORS.BORDER, elevation: 1 },
  detectiveOptionTxt:{ fontSize: 14, fontWeight: "600" },
  detectiveHint:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3C7", borderRadius: 12, padding: 12, marginBottom: 12 },
  detectiveHintEmoji:{ fontSize: 16 },
  detectiveHintTxt: { flex: 1, fontSize: 13, color: "#92400E" },
  detectiveNextBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  detectiveNextBtnTxt:{ color: "#fff", fontSize: 14, fontWeight: "800" },
  detectiveCollect: { alignItems: "center", paddingVertical: 12 },
  detectiveCollectTxt:{ fontSize: 13, color: COLORS.TEXT_SECONDARY, fontStyle: "italic" },
  detectiveResult:  { alignItems: "center", paddingTop: 40, gap: 10 },
  detectiveResultTitle:{ fontSize: 24, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  detectiveResultScore:{ fontSize: 36, fontWeight: "900", color: COLORS.PRIMARY },
  detectiveResultMsg:  { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  detectivePlayAgain:  { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13, marginTop: 10 },
  detectivePlayAgainTxt:{ color: "#fff", fontSize: 14, fontWeight: "800" },
  // Stories list
  storyListCard:    { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderTopWidth: 4, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER, flexDirection: "row", alignItems: "center", gap: 12 },
  storyListEmoji:   { width: 56, height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  storyListInfo:    { flex: 1 },
  storyListTitle:   { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  storyListMeta:    { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 3 },
  storyDoneBadge:   { backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  storyDoneTxt:     { fontSize: 11, color: "#16A34A", fontWeight: "700" },
  storyStartBtn:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  storyStartTxt:    { color: "#fff", fontWeight: "700", fontSize: 12 },
  // Story reader
  storyCard:        { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 16, borderTopWidth: 4, elevation: 2 },
  storyPageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  storyBackBtn:     {},
  storyBackTxt:     { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "600" },
  storyPageNum:     { fontSize: 13, fontWeight: "700" },
  storyTitle:       { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  storyDots:        { flexDirection: "row", gap: 6, marginBottom: 20 },
  storyDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.BORDER },
  storyPageContent: { alignItems: "center", paddingVertical: 20 },
  storyPageEmoji:   { fontSize: 72, marginBottom: 20 },
  storyPageTxt:     { fontSize: 16, color: COLORS.TEXT_PRIMARY, lineHeight: 24, textAlign: "center" },
  storyNav:         { flexDirection: "row", gap: 10, marginTop: 24 },
  storyNavBtn:      { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1.5, borderColor: COLORS.BORDER },
  storyNavBtnPrimary:{ borderWidth: 0 },
  storyNavBtnTxt:   { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  // Facility
  facilityCard:     { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  facilityTitle:    { fontSize: 15, fontWeight: "800", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  facilitySub:      { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 14 },
  facilityStep:     { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  facilityStepNum:  { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.PRIMARY, justifyContent: "center", alignItems: "center", marginTop: 2 },
  facilityStepNumTxt:{ color: "#fff", fontSize: 11, fontWeight: "800" },
  facilityStepTitle:{ fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  facilityStepDesc: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2, lineHeight: 16 },
  // Passport
  passportCard:     { backgroundColor: COLORS.PRIMARY, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  passportAvatarWrap:{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  passportAvatar:   { fontSize: 26 },
  passportInfo:     { flex: 1 },
  passportName:     { fontSize: 16, fontWeight: "800", color: "#fff" },
  passportLevel:    { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
  passportLevelTxt: { fontSize: 11, fontWeight: "700" },
  passportMsg:      { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 4 },
  passportScore:    { alignItems: "center" },
  passportScoreNum: { fontSize: 28, fontWeight: "900", color: "#fff" },
  passportScoreLbl: { fontSize: 11, color: COLORS.PRIMARY_TINT },
  progressCard:     { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.BORDER },
  progressCardTitle:{ fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY, marginBottom: 8 },
  progressBarWrap:  { height: 8, backgroundColor: COLORS.BORDER, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  progressBarFill:  { height: "100%", backgroundColor: COLORS.PRIMARY, borderRadius: 4 },
  progressBarLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  statsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  statGridCard:     { width: "30%", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, elevation: 1, flexGrow: 1 },
  statGridNum:      { fontSize: 22, fontWeight: "900", marginTop: 4 },
  statGridLbl:      { fontSize: 9, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 2 },
  emptyLibrary:     { alignItems: "center", padding: 24, backgroundColor: COLORS.SURFACE, borderRadius: 14, borderWidth: 1, borderColor: COLORS.BORDER, gap: 8 },
  emptyLibraryTxt:  { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  libraryCard:      { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.BORDER },
  libraryCardTitle: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY, marginBottom: 10 },
  libraryItem:      { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  libraryItemBorder:{ borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  libraryItemTitle: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  libraryItemCat:   { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  continueCard:     { borderRadius: 14, padding: 14, marginBottom: 4 },
  continueTxt:      { color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  // My Progress Tab styles
  progressTabContent: { paddingTop: 14 },
  progressSectionLabel: { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 24, marginBottom: 10, marginTop: 6 },
  progressProfileCard: { marginTop: 16, marginBottom: 16, marginHorizontal: 16, borderRadius: 20, padding: 18, elevation: 4 },
  progressProfileTop:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  progressAvatar:      { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  progressAvatarTxt:   { fontSize: 26 },
  progressProfileInfo: { flex: 1 },
  progressProfileName: { fontSize: 18, fontWeight: "800", color: "#fff" },
  progressLevelBadge:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  progressLevelEmoji:  { fontSize: 14 },
  progressLevelLabel:  { fontSize: 12, color: "#fff", fontWeight: "700" },
  progressScoreBox:    { alignItems: "center" },
  progressScoreNum:    { fontSize: 32, fontWeight: "900", color: "#fff" },
  progressScoreLbl:    { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  progressXpSection:   { gap: 6 },
  progressXpBarBg:     { height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" },
  progressXpBarFill:   { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
  progressXpLabel:     { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  progressStatsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 24, marginBottom: 4 },
  progressStatCard:    { width: "30%", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, elevation: 1, flexGrow: 1 },
  progressStatNum:     { fontSize: 22, fontWeight: "900", marginTop: 4 },
  progressStatLbl:     { fontSize: 9, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 2 },
  progressChartCard:  { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 16, marginBottom: 4, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  progressChartTitle:  { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  progressChartBars:   { gap: 12 },
  progressChartBarRow:{ flexDirection: "row", alignItems: "center", gap: 10 },
  progressChartBarLabel:{ width: 60, fontSize: 11, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  progressChartBarTrack:{ flex: 1, height: 8, backgroundColor: COLORS.BORDER, borderRadius: 4, overflow: "hidden" },
  progressChartBarFill:{ height: "100%", borderRadius: 4 },
  progressChartBarValue:{ fontSize: 11, fontWeight: "700", color: COLORS.TEXT_PRIMARY, width: 35, textAlign: "right" },
  progressLineChart:  { alignItems: "center", paddingTop: 8 },
  progressLineChartBars:{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 100, paddingHorizontal: 8 },
  progressLineChartBarCol:{ alignItems: "center", gap: 6 },
  progressLineChartBar:{ width: 28, borderRadius: 6, minHeight: 10 },
  progressLineChartLabel:{ fontSize: 10, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  progressLineChartValue:{ fontSize: 10, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  progressTrendChart:  { alignItems: "center", paddingTop: 8 },
  progressTrendLineContainer:{ width: "100%", height: 100, position: "relative" },
  progressTrendLine:   { position: "absolute", height: 3, backgroundColor: COLORS.PRIMARY, borderRadius: 2, transformOrigin: "0 50%" },
  progressTrendPoint:  { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.PRIMARY, borderWidth: 2, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  progressTrendPointValue:{ fontSize: 8, fontWeight: "700", color: "#fff", position: "absolute", top: -14, width: 20, textAlign: "center" },
  progressTrendLabel:  { fontSize: 10, fontWeight: "600", color: COLORS.TEXT_SECONDARY, position: "absolute" },
  progressCatCard:     { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 24, marginBottom: 4, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  progressCatRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER, gap: 10 },
  progressCatName:     { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  progressCatPill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  progressCatPillTxt:  { fontSize: 11, fontWeight: "700" },
  achievementSubLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY, paddingHorizontal: 16, marginBottom: 8, fontWeight: "600" },
  progressAchievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 24, marginBottom: 10 },
  progressAchievementCard: { width: "47%", borderRadius: 14, padding: 12, alignItems: "center", gap: 4, elevation: 1, borderWidth: 1, flexGrow: 1 },
  progressAchievementUnlocked: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  progressAchievementLocked: { backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER },
  progressAchievementEmoji: { fontSize: 28 },
  progressAchievementLabel: { fontSize: 12, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  progressAchievementDesc: { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  progressMotivCard:  { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14, marginHorizontal: 24, marginTop: 4 },
  progressMotivEmoji: { fontSize: 24 },
  progressMotivTxt:   { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
