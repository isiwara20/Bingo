/**
 * BinGo – Onboarding Screen
 *
 * Multi-step onboarding shown to first-time users before login/register.
 * Three slides covering the app's core value propositions.
 *
 * Features:
 *  - Animated slide transitions (react-native-reanimated)
 *  - Dot pagination indicator
 *  - Skip button (jumps to end)
 *  - Next / Get Started CTA
 *  - "I already have an account" link on final slide
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Slide Data ────────────────────────────────────────────────────────────────
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

// ── Dot Indicator ─────────────────────────────────────────────────────────────
const DotIndicator = ({ count, activeIndex }) => (
  <View style={styles.dotsContainer} accessibilityRole="none">
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

// ── Single Slide ──────────────────────────────────────────────────────────────
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

// ── Main Screen ───────────────────────────────────────────────────────────────
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

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={SLIDES[activeIndex].backgroundColor}
      />

      {/* Skip button – hidden on last slide */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>BinGo</Text>
        </View>
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
        {/* Dot indicator */}
        <DotIndicator count={SLIDES.length} activeIndex={activeIndex} />

        {/* Primary CTA */}
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

        {/* Login link – only on last slide */}
        {isLastSlide && (
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
        )}

        {/* Spacer so login row doesn't sit right at the edge */}
        {!isLastSlide && <View style={styles.loginRowSpacer} />}
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    letterSpacing: 0.5,
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

  // FlatList
  flatList: {
    flex: 1,
  },

  // Slide
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
  emoji: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: "center",
  },
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

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 20,
    gap: 16,
  },

  // Dots
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.PRIMARY,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.BORDER,
  },

  // Buttons
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

  // Login row
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  loginRowSpacer: {
    height: 24,
  },
  loginPrompt: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },
});

export default OnboardingScreen;
