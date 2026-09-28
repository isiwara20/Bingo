/**
 * BinGo – Waste Map Screen
 * Member 2 – US-M2-06, US-M2-07
 *
 * Interactive map using Leaflet + OpenStreetMap (no API key required).
 * Displays illegal dumping reports, recycling centres, collection points.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { getCurrentLocation } from "../services/locationService";
import { getReportLocations, getWasteLocations } from "../services/mapService";
import COLORS from "../constants/colors";

// ── Filter definitions ─────────────────────────────────────────────────────
const FILTERS = [
  { id: "all",              label: "All",        emoji: "🗺️" },
  { id: "illegal_dumping",  label: "Dumping",    emoji: "🚨" },
  { id: "recycling_centre", label: "Recycling",  emoji: "♻️" },
  { id: "collection_point", label: "Collection", emoji: "📦" },
];

// ── FilterBar ──────────────────────────────────────────────────────────────
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
      >
        <Text style={styles.filterEmoji}>{f.emoji}</Text>
        <Text style={[styles.filterLabel, activeFilter === f.id && styles.filterLabelActive]}>
          {f.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ── Build Leaflet HTML ─────────────────────────────────────────────────────
const buildMapHTML = (centerLat, centerLng, markers) => {
  const markersJson = JSON.stringify(markers);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-popup .leaflet-popup-content-wrapper {
      border-radius: 10px;
      padding: 0;
      min-width: 200px;
    }
    .popup-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px 6px; font-weight: bold; font-size: 14px; }
    .popup-row { padding: 2px 12px; font-size: 12px; color: #555; }
    .popup-key { font-weight: 600; color: #222; }
    .popup-btn {
      display: block; margin: 8px 12px 10px;
      background: #4CAF50; color: white;
      border: none; border-radius: 6px;
      padding: 6px 12px; font-size: 12px;
      cursor: pointer; text-align: center; width: calc(100% - 24px);
    }
    .dot-red    { background: #F44336; }
    .dot-green  { background: #4CAF50; }
    .dot-blue   { background: #2196F3; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  var markers = ${markersJson};

  function makeIcon(color) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 26 14 26s14-16.67 14-26C28 6.27 21.73 0 14 0z" fill="' + color + '"/>' +
      '<circle cx="14" cy="14" r="6" fill="white"/>' +
      '</svg>';
    return L.divIcon({
      html: svg,
      iconSize: [28, 40],
      iconAnchor: [14, 40],
      popupAnchor: [0, -40],
      className: ''
    });
  }

  var redIcon   = makeIcon('#F44336');
  var greenIcon = makeIcon('#4CAF50');
  var blueIcon  = makeIcon('#2196F3');

  markers.forEach(function(m) {
    var icon = m.type === 'report' ? redIcon : (m.type === 'recycling_centre' ? greenIcon : blueIcon);
    var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);

    var popupHtml = '<div>';
    if (m.type === 'report') {
      popupHtml += '<div class="popup-header">🚨 Illegal Dumping</div>';
      popupHtml += '<div class="popup-row"><span class="popup-key">Waste: </span>' + m.wasteType + '</div>';
      popupHtml += '<div class="popup-row"><span class="popup-key">Status: </span>' + m.status + '</div>';
      popupHtml += '<div class="popup-row"><span class="popup-key">Date: </span>' + m.date + '</div>';
      if (m.address) popupHtml += '<div class="popup-row"><span class="popup-key">📍 </span>' + m.address + '</div>';
      popupHtml += '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'viewReport\\',id:\\''+m.id+'\\'}))">View Details →</button>';
    } else if (m.type === 'recycling_centre') {
      popupHtml += '<div class="popup-header">♻️ Recycling Centre</div>';
      popupHtml += '<div class="popup-row"><span class="popup-key">Name: </span>' + m.name + '</div>';
      if (m.address) popupHtml += '<div class="popup-row"><span class="popup-key">📍 </span>' + m.address + '</div>';
      if (m.hours) popupHtml += '<div class="popup-row"><span class="popup-key">Hours: </span>' + m.hours + '</div>';
      if (m.accepts) popupHtml += '<div class="popup-row"><span class="popup-key">Accepts: </span>' + m.accepts + '</div>';
    } else {
      popupHtml += '<div class="popup-header">📦 Collection Point</div>';
      popupHtml += '<div class="popup-row"><span class="popup-key">Name: </span>' + m.name + '</div>';
      if (m.address) popupHtml += '<div class="popup-row"><span class="popup-key">📍 </span>' + m.address + '</div>';
    }
    popupHtml += '</div>';

    marker.bindPopup(popupHtml, { className: 'custom-popup', maxWidth: 240 });
  });
</script>
</body>
</html>`;
};

// ── Main Screen ────────────────────────────────────────────────────────────
const WasteMapScreen = ({ navigation }) => {
  const webViewRef = useRef(null);

  const [userLocation, setUserLocation]   = useState({ lat: 6.9271, lng: 79.8612 });
  const [reportMarkers, setReportMarkers] = useState([]);
  const [locationMarkers, setLocationMarkers] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [error, setError]                 = useState(null);
  const [activeFilter, setActiveFilter]   = useState("all");
  const [mapHtml, setMapHtml]             = useState(null);

  // ── Build markers array for Leaflet ────────────────────────────────────
  const buildMarkers = useCallback((reports, locations, filter) => {
    const result = [];

    if (filter === "all" || filter === "illegal_dumping") {
      reports.forEach((r) => {
        const lat = r.location?.coordinates?.[1];
        const lng = r.location?.coordinates?.[0];
        if (lat == null || lng == null) return;
        result.push({
          type: "report",
          id: r._id,
          lat, lng,
          wasteType: r.wasteType || "unknown",
          status: r.status || "pending",
          address: r.address || "",
          date: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
            : "",
        });
      });
    }

    locations.forEach((loc) => {
      const lat = loc.location?.coordinates?.[1];
      const lng = loc.location?.coordinates?.[0];
      if (lat == null || lng == null) return;
      if (filter !== "all" && filter !== loc.type &&
          !(filter === "collection_point" && loc.type === "bin")) return;
      result.push({
        type: loc.type === "recycling_centre" ? "recycling_centre" : "collection_point",
        id: loc._id,
        lat, lng,
        name: loc.name || "",
        address: loc.address || "",
        hours: loc.operatingHours || "",
        accepts: (loc.acceptedWasteTypes || []).join(", "),
      });
    });

    return result;
  }, []);

  // ── Load map data ────────────────────────────────────────────────────────
  const loadMapData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    let centerLat = 6.9271;
    let centerLng = 79.8612;

    try {
      const coords = await getCurrentLocation();
      centerLat = coords.latitude;
      centerLng = coords.longitude;
      setUserLocation({ lat: centerLat, lng: centerLng });
    } catch {
      // use default Colombo coords
    }

    const [reportRes, locationRes] = await Promise.allSettled([
      getReportLocations(),
      getWasteLocations(),
    ]);

    const reports   = reportRes.status   === "fulfilled" ? (reportRes.value   || []) : [];
    const locations = locationRes.status === "fulfilled" ? (locationRes.value || []) : [];

    if (reportRes.status === "rejected" && locationRes.status === "rejected") {
      setError("Could not load map data. Check your connection.");
    }

    setReportMarkers(reports);
    setLocationMarkers(locations);

    const markers = buildMarkers(reports, locations, activeFilter);
    setMapHtml(buildMapHTML(centerLat, centerLng, markers));

    setLoading(false);
    setRefreshing(false);
  }, [activeFilter, buildMarkers]);

  useEffect(() => { loadMapData(); }, [loadMapData]);

  // ── Rebuild HTML when filter changes ────────────────────────────────────
  useEffect(() => {
    if (reportMarkers.length > 0 || locationMarkers.length > 0) {
      const markers = buildMarkers(reportMarkers, locationMarkers, activeFilter);
      setMapHtml(buildMapHTML(userLocation.lat, userLocation.lng, markers));
    }
  }, [activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMapData(true);
  };

  // ── Handle messages from WebView (e.g. "View Details" button) ───────────
  const onWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "viewReport" && data.id) {
        navigation.navigate("ReportDetails", { reportId: data.id });
      }
    } catch (_) {}
  };

  const totalVisible = buildMarkers(reportMarkers, locationMarkers, activeFilter).length;

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
        {mapHtml ? (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={onWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mixedContentMode="always"
            accessibilityLabel="Interactive waste map"
          />
        ) : null}

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
            <TouchableOpacity style={styles.errorRetryBtn} onPress={() => loadMapData()}>
              <Text style={styles.errorRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <View style={styles.legend}>
        <LegendDot color="#F44336" label="Dumping" />
        <LegendDot color="#4CAF50" label="Recycling" />
        <LegendDot color="#2196F3" label="Collection" />
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
  container:   { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  refreshText: { color: COLORS.PRIMARY, fontWeight: "600", fontSize: 14 },

  filterBar:        { backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER, maxHeight: 52 },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: "row" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE,
  },
  filterChipActive: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" },
  filterEmoji:      { fontSize: 13 },
  filterLabel:      { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  filterLabelActive:{ color: COLORS.PRIMARY, fontWeight: "700" },

  mapWrap: { flex: 1, position: "relative" },
  map:     { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center", alignItems: "center", gap: 10,
  },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  errorOverlay: {
    position: "absolute", top: 16, left: 16, right: 16,
    backgroundColor: "#FFEBEE", borderRadius: 10, padding: 12,
    alignItems: "center", gap: 8,
  },
  errorText:     { color: COLORS.ERROR, fontSize: 13, textAlign: "center" },
  errorRetryBtn: { backgroundColor: COLORS.ERROR, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  errorRetryText:{ color: "#fff", fontWeight: "700", fontSize: 13 },

  legend: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    gap: 12, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.SURFACE, borderTopWidth: 1, borderTopColor: COLORS.BORDER,
  },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  legendNote:  { fontSize: 11, color: COLORS.TEXT_DISABLED, marginLeft: "auto" },
});

export default WasteMapScreen;
