import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Image, StatusBar, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const GREEN = "#185B43";
const SLIDES = [
  { id: "report", label: "A CLEANER NEIGHBOURHOOD", title: "Small reports.\nReal change.", description: "Spot waste where it doesn’t belong? Take a photo, pin the location and help your community take action.", icon: "camera-outline", caption: "See it. Snap it. Report it.", tint: "#E8F1E8" },
  { id: "recycle", label: "A BETTER WAY TO RECYCLE", title: "The right place\nfor a fresh start.", description: "Find nearby recycling points and discover where your everyday waste can begin its next chapter.", icon: "recycle", caption: "Less waste. More possibility.", tint: "#F1EEDC" },
  { id: "schedule", label: "GOOD HABITS, MADE SIMPLE", title: "Your collection.\nAll in one place.", description: "Keep your neighbourhood’s collection schedule close, so you can plan ahead and put waste out at the right time.", icon: "calendar-check-outline", caption: "A little planning goes a long way.", tint: "#E4EDF0" },
];

const MiniRow = ({ icon, title, subtitle, color = GREEN }) => (
  <View style={s.miniRow}>
    <View style={[s.miniIcon, { backgroundColor: color + "12" }]}><Icon name={icon} color={color} size={23} /></View>
    <View style={s.grow}><Text style={s.miniTitle}>{title}</Text><Text style={s.miniSub}>{subtitle}</Text></View>
    <Icon name="chevron-right" size={20} color="#8D9E95" />
  </View>
);

const Illustration = ({ item, compact }) => (
  <View style={[s.scene, { backgroundColor: item.tint }, compact && s.sceneCompact]} accessible accessibilityLabel={`${item.id === "report" ? "Waste reporting" : item.id === "recycle" ? "Recycling map" : "Collection schedule"} illustration`}>
    <View style={s.orbit} /><View style={s.orbitSmall} />
    {item.id === "report" ? (
      <View style={s.preview}>
        <View style={s.previewTop}><View style={s.tinyDot} /><Text style={s.previewLabel}>NEIGHBOURHOOD REPORT</Text><Icon name="dots-horizontal" size={20} color="#7C8B82" /></View>
        <View style={s.photo}>
          <View style={s.landscape} />
          <Icon name="tree-outline" color="#8AA88B" size={62} style={s.tree} />
          <View style={s.bin}><Icon name="trash-can-outline" color={GREEN} size={65} /></View>
          <View style={s.camera}><Icon name="camera-outline" color="#fff" size={20} /></View>
        </View>
        <MiniRow icon="map-marker-outline" title="Location pinned" subtitle="Ready to send to your community" />
        <View style={s.reportButton}><Text style={s.reportButtonText}>Submit report</Text><Icon name="arrow-top-right" size={18} color="#fff" /></View>
      </View>
    ) : item.id === "recycle" ? (
      <View style={s.preview}>
        <View style={s.map}>
          <View style={s.park} /><View style={s.roadOne} /><View style={s.roadTwo} /><View style={s.roadThree} />
          <View style={s.mapLabel}><Icon name="magnify" size={17} color={GREEN} /><Text style={s.miniTitle}>Recycling near you</Text></View>
          <View style={s.mapPin}><Icon name="recycle" size={28} color="#fff" /></View>
          <View style={s.locationDot} />
          <View style={s.smallPin}><Icon name="map-marker" size={30} color={GREEN} /></View>
        </View>
        <MiniRow icon="recycle" title="A place for every material" subtitle="Discover local recycling points" />
        <View style={s.chips}>{["Plastic", "Paper", "Glass"].map(x => <Text style={s.chip} key={x}>{x}</Text>)}</View>
      </View>
    ) : (
      <View style={s.preview}>
        <View style={s.calendarTop}><View><Text style={s.previewLabel}>YOUR WEEK, SORTED</Text><Text style={s.calendarTitle}>Collection planner</Text></View><Icon name="calendar-month-outline" size={28} color={GREEN} /></View>
        <View style={s.week}>{["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <View key={i} style={[s.day, i === 2 && s.activeDay]}><Text style={[s.dayLabel, i === 2 && s.white]}>{day}</Text><Text style={[s.dayNumber, i === 2 && s.white]}>{12 + i}</Text>{i === 2 && <View style={s.dayDot} />}</View>)}</View>
        <MiniRow icon="leaf" title="Organic waste" subtitle="Keep your collection days in view" />
        <View style={s.divider} />
        <MiniRow icon="recycle" title="Recyclables" subtitle="Make room for better habits" color="#A07527" />
      </View>
    )}
    <View style={s.floatingBadge}><Icon name={item.icon} size={18} color={GREEN} /><Text style={s.floatingText}>{item.caption}</Text></View>
  </View>
);

export default function OnboardingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const list = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const last = active === 2;
  const go = index => { list.current?.scrollToIndex({ index, animated: true }); setActive(index); };
  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBF7" />
      <View style={s.topBar}>
        <Image source={require("../../assets/logo.png")} resizeMode="contain" style={s.logo} accessibilityLabel="BinGo logo" />
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={s.skip} accessibilityRole="button"><Text style={s.skipText}>Skip intro</Text><Icon name="arrow-right" size={16} color={GREEN} /></TouchableOpacity>
      </View>
      <Animated.FlatList
        key={width} ref={list} initialScrollIndex={active} data={SLIDES} keyExtractor={item => item.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false} bounces={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={event => setActive(Math.round(event.nativeEvent.contentOffset.x / width))}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <ScrollView style={{ width }} contentContainerStyle={s.slide} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: scrollX.interpolate({ inputRange: [(index - 1) * width, index * width, (index + 1) * width], outputRange: [0.45, 1, 0.45], extrapolate: "clamp" }) }}>
              <Illustration item={item} compact={height < 740} />
              <Text style={s.eyebrow}>{item.label}</Text>
              <Text style={[s.title, height < 740 && { fontSize: 31, lineHeight: 37 }]}>{item.title}</Text>
              <Text style={s.description}>{item.description}</Text>
            </Animated.View>
          </ScrollView>
        )}
      />
      <View style={s.footer}>
        <View style={s.progressRow}>
          <View style={s.dots}>{SLIDES.map((item, i) => <TouchableOpacity key={item.id} onPress={() => go(i)} style={s.dotTouch} accessibilityRole="button" accessibilityLabel={`Introduction ${i + 1} of 3`} accessibilityState={{ selected: i === active }}><View style={[s.dot, i === active && s.dotActive]} /></TouchableOpacity>)}</View>
          <Text style={s.counter}>0{active + 1}<Text style={s.counterMuted}> / 03</Text></Text>
        </View>
        <TouchableOpacity style={s.primary} accessibilityRole="button" onPress={() => last ? navigation.navigate("Register") : go(active + 1)}><Text style={s.primaryText}>{last ? "Create your account" : "Continue"}</Text><Icon name="arrow-right" size={22} color="#fff" /></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} accessibilityRole="link" style={s.signIn}><Text style={s.signInText}>Already part of BinGo? <Text style={s.signInLink}>Sign in</Text></Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBF7" }, grow: { flex: 1 },
  topBar: { paddingHorizontal: 24, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logo: { width: 112, height: 44 }, skip: { flexDirection: "row", gap: 8, alignItems: "center", minHeight: 44 }, skipText: { color: GREEN, fontSize: 13, fontWeight: "600" },
  slide: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, flexGrow: 1, justifyContent: "center" },
  scene: { height: 310, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 28, overflow: "hidden" }, sceneCompact: { height: 280, marginBottom: 22 },
  orbit: { position: "absolute", width: 310, height: 310, borderRadius: 155, borderWidth: 1, borderColor: "#FFFFFF90", top: -65, right: -100 },
  orbitSmall: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: "#FFFFFFAA", bottom: -65, left: -70 },
  preview: { width: "84%", maxWidth: 330, backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 18, elevation: 4, shadowColor: GREEN, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  previewTop: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }, tinyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }, previewLabel: { fontSize: 8, letterSpacing: 1.1, fontWeight: "700", color: "#62776A", flex: 1 },
  photo: { height: 94, borderRadius: 10, backgroundColor: "#EEF3E8", overflow: "hidden" }, landscape: { position: "absolute", width: 350, height: 90, backgroundColor: "#D4E2CE", bottom: -55, transform: [{ rotate: "-10deg" }] }, tree: { position: "absolute", left: 20, top: 10 }, bin: { position: "absolute", right: 55, top: 20 }, camera: { position: "absolute", right: 10, bottom: 10, borderRadius: 20, padding: 7, backgroundColor: GREEN },
  miniRow: { flexDirection: "row", gap: 9, alignItems: "center", paddingVertical: 12 }, miniIcon: { padding: 8, borderRadius: 11 }, miniTitle: { fontSize: 11, fontWeight: "700", color: "#243D30" }, miniSub: { fontSize: 9, color: "#76857C", marginTop: 4, lineHeight: 13 },
  reportButton: { backgroundColor: GREEN, padding: 9, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, reportButtonText: { color: "white", fontWeight: "600", fontSize: 10 },
  floatingBadge: { position: "absolute", bottom: 12, backgroundColor: "#fff", borderRadius: 30, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", gap: 7, alignItems: "center", elevation: 3 }, floatingText: { fontSize: 10, color: GREEN, fontWeight: "600" },
  map: { height: 140, backgroundColor: "#EDF0E6", borderRadius: 10, overflow: "hidden" }, park: { position: "absolute", width: 110, height: 85, right: -10, bottom: -10, borderRadius: 20, backgroundColor: "#C7DCBE", transform: [{ rotate: "-25deg" }] },
  roadOne: { position: "absolute", width: 350, height: 14, backgroundColor: "white", top: 80, left: -30, transform: [{ rotate: "-30deg" }] }, roadTwo: { position: "absolute", width: 14, height: 230, backgroundColor: "white", top: -30, left: 75, transform: [{ rotate: "-20deg" }] }, roadThree: { position: "absolute", width: 14, height: 240, backgroundColor: "white", top: -40, right: 35, transform: [{ rotate: "20deg" }] },
  mapLabel: { position: "absolute", top: 8, left: 8, right: 8, backgroundColor: "white", borderRadius: 8, padding: 9, flexDirection: "row", gap: 6, alignItems: "center" }, mapPin: { position: "absolute", top: 60, right: 70, padding: 10, backgroundColor: GREEN, borderRadius: 25, borderBottomLeftRadius: 4 }, smallPin: { position: "absolute", top: 59, left: 32 }, locationDot: { position: "absolute", bottom: 10, left: 90, width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: "#BDD5EA", backgroundColor: "#467EAB" },
  chips: { flexDirection: "row", gap: 6 }, chip: { color: GREEN, backgroundColor: "#F0F4EE", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, fontSize: 9 },
  calendarTop: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 14 }, calendarTitle: { fontSize: 16, fontWeight: "700", color: GREEN, marginTop: 6 }, week: { flexDirection: "row", justifyContent: "space-between", gap: 3 }, day: { flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 9, gap: 5 }, activeDay: { backgroundColor: GREEN }, dayLabel: { fontSize: 9, color: "#87958C" }, dayNumber: { fontSize: 13, fontWeight: "700", color: GREEN }, white: { color: "white" }, dayDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "white" }, divider: { height: 1, backgroundColor: "#EFF2ED" },
  eyebrow: { color: GREEN, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, marginBottom: 12 }, title: { fontSize: 37, lineHeight: 43, fontWeight: "800", letterSpacing: -1.2, color: "#173F2E", marginBottom: 14 }, description: { color: "#6B7B71", fontSize: 14, lineHeight: 23, maxWidth: 470 },
  footer: { paddingHorizontal: 24, paddingBottom: 6 }, progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, dots: { flexDirection: "row" }, dotTouch: { minWidth: 34, height: 38, justifyContent: "center" }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#D5DFD4" }, dotActive: { width: 25, backgroundColor: GREEN }, counter: { color: GREEN, fontWeight: "700", fontSize: 12 }, counterMuted: { color: "#94A093", fontWeight: "400" },
  primary: { backgroundColor: GREEN, borderRadius: 16, minHeight: 56, paddingHorizontal: 22, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryText: { color: "white", fontSize: 16, fontWeight: "700" }, signIn: { minHeight: 48, justifyContent: "center", alignItems: "center" }, signInText: { color: "#778479", fontSize: 12 }, signInLink: { color: GREEN, fontWeight: "700" },
});
