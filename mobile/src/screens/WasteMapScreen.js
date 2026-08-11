/**
 * BinGo – Waste Map Screen
 * Member 2 – US-M2-06, US-M2-07
 *
 * Interactive map showing:
 *   - Illegal dumping report markers (pending/under_review)
 *   - Recycling centre markers
 *   - Waste collection point markers
 *
 * Features:
 *   - Current user location
 *   - Tap-to-view marker callout panel
 *   - Filter bar: All / Dumping / Recycling / Collection
 *   - Refresh control
 *   - Loading / error / empty states
 *
 * Map data: live from backend API.
 * MOCK location data is in seed.js – clearly labelled.
 *
 * TODO Sprint 2: marker clustering for large datasets.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { getCurrentLocation } from "../services/locationService";
import { getReportLocations, getWasteLocations } from "../services/mapService";
import COLORS from "../constants/colors";

// ── Default region: Colombo, Sri Lanka ────────────────────────────────────
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

// ── Filter definitions ─────────────────────────────────────────────────────
const FILTERS = [
  { id: "all",              label: "All",        emoji: "🗺️" },
  { id: "illegal_dumping",  label: "Dumping",    emoji: "🚨" },
  { id: "recycling_centre", label: "Recycling",  emoji: "♻️" },
  { id: "collection_point", label: "Collection", emoji: "📦" },
];

const WASTE_EMOJIS = {
  general: "🗑️", plastic: "🧴", glass: "🍶", paper: "📄",
  metal: "🔩", electronic: "📱", construction: "🧱",
  organic: "🌿", hazardous: "☢️", mixed: "♻️", other: "❓",
};

const STATUS_LABELS = {
  pending: "Pending", under_review: "Under Review",
  cleaned: "Cleaned", rejected: "Rejected",
};

// ── Sub-components ─────────────────────────────────────────────────────────
const FilterBar = ({ activeFilter, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterBarContent}
    style={styles.filterBar}
  >
    {FILTERS.map((f) => (
      <TouchableOpacity
        key={f.id}
        style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
        onPress={() => onSelect(f.id)}
        accessibilityRole="button"
        accessibilityLabel={`Filter: ${f.label}`}
        accessibilityState={{ selected: activeFilter === f.id }}
      >
        <Text style={styles.filterEmoji}>{f.emoji}</Text>
        <Text style={[
          styles.filterLabel,
          activeFilter === f.id && styles.filterLabelActive,
        ]}>
          {f.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const MarkerCallout = ({ item, type, onViewDetails }) => {
  if (type === "report") {
    return (
      <Callout onPress={onViewDetails} style={styles.callout}>
        <View style={styles.calloutContent}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutIcon}>🚨</Text>
            <Text style={styles.calloutTitle}>Illegal Dumping</Text>
          </View>
          <Text style={styles.calloutRow}>
            <Text style={styles.calloutKey}>Waste: </Text>
            {WASTE_EMOJIS[item.wasteType] || "🗑️"} {item.wasteType?.charAt(0).toUpperCase() + item.wasteType?.slice(1)}
          </Text>
          <Text style={styles.calloutRow}>
            <Text style={styles.calloutKey}>Status: </Text>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
          <Text style={styles.calloutRow}>
            <Text style={styles.calloutKey}>Date: </Text>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </Text>
          {item.address ? (
            <Text style={styles.calloutRow} numberOfLines={1}>
              <Text style={styles.calloutKey}>Area: </Text>
              {item.address}
            </Text>
          ) : null}
          <TouchableOpacity style={styles.calloutBtn} onPress={onViewDetails}>
            <Text style={styles.calloutBtnText}>View Details →</Text>
          </TouchableOpacity>
        </View>
      </Callout>
    );
  }

  if (type === "recycling_centre") {
    return (
      <Callout style={styles.callout}>
        <View style={styles.calloutContent}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutIcon}>♻️</Text>
            <Text style={styles.calloutTitle}>Recycling Centre</Text>
          </View>
          <Text style={styles.calloutRow}>
            <Text style={styles.calloutKey}>Name: </Text>
            {item.name}
          </Text>
          {item.address ? (
            <Text style={styles.calloutRow} numberOfLines={2}>
              <Text style={styles.calloutKey}>Address: </Text>
              {item.address}
            </Text>
          ) : null}
          {item.operatingHours ? (
            <Text style={styles.calloutRow}>
              <Text style={styles.calloutKey}>Hours: </Text>
              {item.operatingHours}
            </Text>
          ) : null}
          {item.acceptedWasteTypes?.length > 0 ? (
            <Text style={styles.calloutRow} numberOfLines={2}>
              <Text style={styles.calloutKey}>Accepts: </Text>
              {item.acceptedWasteTypes.join(", ")}
            </Text>
          ) : null}
        </View>
      </Callout>
    );
  }

  // collection_point or bin
  return (
    <Callout style={styles.callout}>
      <View style={styles.calloutContent}>
        <View style={styles.calloutHeader}>
          <Text style={styles.calloutIcon}>📦</Text>
          <Text style={styles.calloutTitle}>Collection Point</Text>
        </View>
        <Text style={styles.calloutRow}>
          <Text style={styles.calloutKey}>Name: </Text>
          {item.name}
        </Text>
        {item.address ? (
          <Text style={styles.calloutRow} numberOfLines={2}>
            <Text style={styles.calloutKey}>Address: </Text>
            {item.address}
          </Text>
        ) : null}
      </View>
    </Callout>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const WasteMapScreen = ({ navigation }) => {
  const mapRef = useRef(null);

  const [region, setRegion]               = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation]   = useState(null);
  const [reportMarkers, setReportMarkers] = useState([]);
  const [locationMarkers, setLocationMarkers] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [activeFilter, setActiveFilter]   = useState("all");

  // ── Load all map data ────────────────────────────────────────────────────
  const loadMapData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    // 1. Try to get user location (non-blocking if denied)
    try {
      const coords = await getCurrentLocation();
      setUserLocation(coords);
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      });
    } catch {
      // Location denied or unavailable – use default region, continue loading
    }

    // 2. Load report markers and facility markers in parallel
    const [reportRes, locationRes] = await Promise.allSettled([
      getReportLocations(),
      getWasteLocations(),
    ]);

    if (reportRes.status === "fulfilled") {
      setReportMarkers(reportRes.value || []);
    } else {
      console.warn("[Map] Failed to load report markers:", reportRes.reason?.message);
    }

    if (locationRes.status === "fulfilled") {
      setLocationMarkers(locationRes.value || []);
    } else {
      console.warn("[Map] Failed to load facility markers:", locationRes.reason?.message);
    }

    // If both failed it's likely a network/auth issue
    if (
      reportRes.status === "rejected" &&
      locationRes.status === "rejected"
    ) {
      setError("Could not load map data. Check your connection.");
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadMapData(); }, [loadMapData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMapData(true);
  };

  // ── Centre map on user ───────────────────────────────────────────────────
  const centreOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }, 400);
    } else {
      Alert.alert(
        "Location Unavailable",
        "Could not determine your location. Check your GPS and permissions."
      );
    }
  };

  // ── Navigate to report details ───────────────────────────────────────────
  const viewReportDetails = (reportId) => {
    navigation.navigate("ReportDetails", { reportId });
  };

  // ── Compute visible markers by active filter ─────────────────────────────
  const visibleReports = (activeFilter === "all" || activeFilter === "illegal_dumping")
    ? reportMarkers : [];

  const visibleLocations = locationMarkers.filter((loc) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "recycling_centre") return loc.type === "recycling_centre";
    if (activeFilter === "collection_point") return loc.type === "collection_point" || loc.type === "bin";
    return false;
  });

  const totalVisible = visibleReports.length + visibleLocations.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Waste Map</Text>
          {!loading && (
            <Text style={styles.headerSub}>
              {totalVisible} location{totalVisible !== 1 ? "s" : ""} visible
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing || loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh map data"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Text style={styles.refreshText}>↻ Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <FilterBar activeFilter={activeFilter} onSelect={setActiveFilter} />

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          accessibilityLabel="Interactive waste map"
        >
          {/* Illegal dumping report markers */}
          {visibleReports.map((report) => {
            const lat = report.location?.coordinates?.[1];
            const lng = report.location?.coordinates?.[0];
            if (lat == null || lng == null) return null;
            return (
              <Marker
                key={`report-${report._id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={COLORS.MARKER_REPORT}
                accessibilityLabel={`Dumping report: ${report.wasteType}`}
              >
                <MarkerCallout
                  item={report}
                  type="report"
                  onViewDetails={() => viewReportDetails(report._id)}
                />
              </Marker>
            );
          })}

          {/* Facility markers (recycling centres + collection points) */}
          {visibleLocations.map((loc) => {
            const lat = loc.location?.coordinates?.[1];
            const lng = loc.location?.coordinates?.[0];
            if (lat == null || lng == null) return null;
            const pinColor =
              loc.type === "recycling_centre"
                ? COLORS.MARKER_RECYCLING
                : COLORS.MARKER_COLLECTION;
            return (
              <Marker
                key={`loc-${loc._id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={pinColor}
                accessibilityLabel={`${loc.type}: ${loc.name}`}
              >
                <MarkerCallout item={loc} type={loc.type} />
              </Marker>
            );
          })}
        </MapView>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading map data…</Text>
          </View>
        )}

        {/* Error overlay */}
        {error && !loading && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.errorRetryBtn}
              onPress={() => loadMapData()}
            >
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Centre-on-user FAB */}
        <TouchableOpacity
          style={styles.locationFab}
          onPress={centreOnUser}
          accessibilityRole="button"
          accessibilityLabel="Centre map on my location"
        >
          <Text style={styles.locationFabIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <View style={styles.legend}>
        <LegendDot color={COLORS.MARKER_REPORT}     label="Dumping" />
        <LegendDot color={COLORS.MARKER_RECYCLING}  label="Recycling" />
        <LegendDot color={COLORS.MARKER_COLLECTION} label="Collection" />
        <Text style={styles.legendNote}>
          {reportMarkers.length} reports · {locationMarkers.length} facilities
        </Text>
      </View>
    </SafeAreaView>
  );
};

const LegendDot = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerSub: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  refreshText: { color: COLORS.PRIMARY, fontWeight: "600", fontSize: 14 },

  filterBar: {
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    maxHeight: 52,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  filterChipActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#E8F5E9",
  },
  filterEmoji: { fontSize: 13 },
  filterLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  filterLabelActive: { color: COLORS.PRIMARY, fontWeight: "700" },

  mapWrap: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  errorOverlay: {
    position: "absolute",
    top: 16, left: 16, right: 16,
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  errorText: { color: COLORS.ERROR, fontSize: 13, textAlign: "center" },
  errorRetryBtn: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorRetryText: { color: COLORS.TEXT_INVERSE, fontWeight: "700", fontSize: 13 },

  locationFab: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.SURFACE,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationFabIcon: { fontSize: 24 },

  callout: { width: 240 },
  calloutContent: { padding: 8 },
  calloutHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  calloutIcon: { fontSize: 18 },
  calloutTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, flex: 1 },
  calloutRow: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 3, lineHeight: 17 },
  calloutKey: { fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  calloutBtn: {
    marginTop: 6,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  calloutBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "700", fontSize: 12 },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  legendNote: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginLeft: "auto" },
});

export default WasteMapScreen;
