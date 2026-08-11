/**
 * BinGo – Waste Map Screen
 *
 * US-08: As a resident, I want to view waste locations on a map.
 *
 * Sprint 1 foundation:
 *   ✅ Map renders with current location
 *   ✅ Report location markers
 *   ✅ Waste location markers (recycling centres, collection points)
 *   ✅ Map legend
 *
 * TODO (Member 2 – Sprint 2):
 *   - Marker clustering for large datasets
 *   - Marker detail bottom sheet
 *   - Filter by waste type / location type
 *   - Directions integration
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { getCurrentLocation } from "../services/locationService";
import { getReportLocations, getWasteLocations } from "../services/mapService";
import COLORS from "../constants/colors";

// ── Default region (Colombo, Sri Lanka – adjust for your city) ─────────────
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ── Legend item ────────────────────────────────────────────────────────────
const LegendItem = ({ color, label }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const WasteMapScreen = () => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState(null);
  const [reportMarkers, setReportMarkers] = useState([]);
  const [locationMarkers, setLocationMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);

  useEffect(() => {
    initialiseMap();
  }, []);

  const initialiseMap = async () => {
    setLoading(true);
    try {
      // Get user location
      try {
        const coords = await getCurrentLocation();
        setUserLocation(coords);
        setRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch {
        // Location denied – show default region
      }

      // Load map data in parallel
      const [reports, locations] = await Promise.allSettled([
        getReportLocations(),
        getWasteLocations(),
      ]);

      if (reports.status === "fulfilled") setReportMarkers(reports.value);
      if (locations.status === "fulfilled") setLocationMarkers(locations.value);
    } catch (error) {
      Alert.alert("Map Error", error.message || "Failed to load map data.");
    } finally {
      setLoading(false);
    }
  };

  const centreOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } else {
      Alert.alert("Location Unavailable", "Unable to determine your current location.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Waste Map</Text>
        <TouchableOpacity
          onPress={initialiseMap}
          accessibilityRole="button"
          accessibilityLabel="Refresh map data"
        >
          <Text style={styles.refreshText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          showsUserLocation
          showsMyLocationButton={false}
          accessibilityLabel="Interactive waste map"
        >
          {/* Report markers */}
          {reportMarkers.map((report) => (
            <Marker
              key={`report-${report._id}`}
              coordinate={{
                latitude: report.location.coordinates[1],
                longitude: report.location.coordinates[0],
              }}
              title={`${report.wasteType} waste`}
              description={`Status: ${report.status}`}
              pinColor={COLORS.MARKER_REPORT}
              onPress={() => setSelectedMarker(report)}
            />
          ))}

          {/* Waste location markers */}
          {locationMarkers.map((loc) => (
            <Marker
              key={`loc-${loc._id}`}
              coordinate={{
                latitude: loc.location.coordinates[1],
                longitude: loc.location.coordinates[0],
              }}
              title={loc.name}
              description={loc.type?.replace("_", " ")}
              pinColor={
                loc.type === "recycling_centre"
                  ? COLORS.MARKER_RECYCLING
                  : COLORS.MARKER_COLLECTION
              }
              onPress={() => setSelectedMarker(loc)}
            />
          ))}
        </MapView>

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading map data...</Text>
          </View>
        )}

        {/* My location button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={centreOnUser}
          accessibilityRole="button"
          accessibilityLabel="Centre map on my location"
        >
          <Text style={styles.myLocationIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color={COLORS.MARKER_REPORT} label="Waste Report" />
        <LegendItem color={COLORS.MARKER_RECYCLING} label="Recycling Centre" />
        <LegendItem color={COLORS.MARKER_COLLECTION} label="Collection Point" />
        <Text style={styles.markerCount}>
          {reportMarkers.length} reports · {locationMarkers.length} locations
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  refreshText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },
  mapContainer: { flex: 1, position: "relative" },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  myLocationButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.SURFACE,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  myLocationIcon: { fontSize: 24 },
  legend: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    flexWrap: "wrap",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  markerCount: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginLeft: "auto" },
});

export default WasteMapScreen;
