/**
 * BinGo – Onboarding Screen
 *
 * Multi-step onboarding shown to first-time users before login/register.
 * Three slides covering the app's core value propositions.
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "🗑️",
    title: "Report Illegal Dumping",
    description:
      "Spot illegal waste in your neighbourhood? Report it in seconds with a photo and location. Help keep your community clean.",
    backgroundColor: "#E8F5E9",
    accentColor: COLORS.PRIMARY,
  },
  {
    id: "2",
    emoji: "♻️",
    title: "Find Recycling Centres",
    description:
      "Locate nearby recycling centres and collection points on an interactive map. Know what to recycle and where.",
    backgroundColor: "#FFF8E1",
    accentColor: COLORS.SECONDARY,
  },
  {
    id: "3",
    emoji: "📅",
    title: "Stay on Schedule",
    description:
      "Never miss a collection day. Get reminders for waste collection schedules and earn rewards for responsible disposal.",
    backgroundColor: "#E3F2FD",
    accentColor: COLORS.INFO,
  },
];

const DotIndicator = ({ count, activeIndex }) => (
  <View style={styles.dotsContainer}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === activeIndex ? styles.dotActive : styles.dotInactive,
        ]}
      />
    ))}
  </View>
);

const Slide = ({ item }) => (
  <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
    <View style={styles.illustrationContainer}>
      <Text style={styles.emoji}>{item.emoji}</Text>
    </View>
    <View style={styles.textContainer}>
      <Text style={[styles.slideTitle, { color: item.accentColor }]}>
        {item.title}
      </Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  </View>
);

const OnboardingScreen = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      navigation.navigate("Register");
      return;
    }
    const nextIndex = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleSkip = () => {
    const lastIndex = SLIDES.length - 1;
    flatListRef.current?.scrollToIndex({ index: lastIndex, animated: true });
    setActiveIndex(lastIndex);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={SLIDES[activeIndex].backgroundColor}
      />

      {/* Top bar with logo */}
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="BinGo logo"
        />
        {!isLastSlide && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom section */}
      <View
        style={[
          styles.bottomSection,
          { backgroundColor: SLIDES[activeIndex].backgroundColor },
        ]}
      >
        <DotIndicator count={SLIDES.length} activeIndex={activeIndex} />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: SLIDES[activeIndex].accentColor },
          ]}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? "Get started with BinGo" : "Next slide"}
        >
          <Text style={styles.primaryButtonText}>
            {isLastSlide ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>

        {isLastSlide ? (
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="link"
              accessibilityLabel="Sign in to existing BinGo account"
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginRowSpacer} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logo: {
    width: 120,
    height: 44,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },

  flatList: { flex: 1 },

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emoji: { fontSize: 80 },
  textContainer: { alignItems: "center" },
  slideTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 26,
  },

  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 20,
    gap: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: COLORS.PRIMARY },
  dotInactive: { width: 8, backgroundColor: COLORS.BORDER },

  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.TEXT_INVERSE,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  loginRowSpacer: { height: 24 },
  loginPrompt: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  loginLink: { fontSize: 14, color: COLORS.PRIMARY, fontWeight: "600" },
});

export default OnboardingScreen;
