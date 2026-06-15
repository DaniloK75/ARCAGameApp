import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MarkerPoint } from './types';
import { APIDataReader } from '../APIDataReader';

type MapTypeOption = 'standard' | 'satellite' | 'hybrid' | 'terrain';

const MAP_TYPES = [
  { label: 'Standard map', value: 'standard', icon: 'map-outline' },
  { label: 'Satellite map', value: 'satellite', icon: 'earth-outline' },
  { label: 'Hybrid map', value: 'hybrid', icon: 'layers-outline' },
  { label: 'Terrain map', value: 'terrain', icon: 'trail-sign-outline' },
] as const;

const DEFAULT_REGION: Region = {
  latitude: 42,
  longitude: 19,
  latitudeDelta: 8,
  longitudeDelta: 14,
};

type MapScreenProps = {
  markerPoint: MarkerPoint;
};

type SensorMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  sensorType: string;
};

type RawSensorRecord = {
  id?: string | number;
  type?: string;
  lat?: number | string;
  lon?: number | string;
  lng?: number | string;
  long?: number | string;
  longitude?: number | string;
  latitude?: number | string;
  [key: string]: unknown;
};

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function findNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = asNumber(record[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function normalizeSensorMarkers(payload: unknown): SensorMarker[] {
  const root = payload as {
    data?: unknown;
    results?: unknown;
    items?: unknown;
    sensors?: unknown;
  } | unknown[];

  const addMarkers = (list: unknown[], locationName?: string): SensorMarker[] =>
    list
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const record = entry as RawSensorRecord;
        const latitude = findNumber(record, ['lat', 'latitude', 'Latitude', 'LAT']);
        const longitude = findNumber(record, ['lon', 'lng', 'long', 'longitude', 'Longitude', 'LON', 'LNG']);

        if (latitude === null || longitude === null) {
          return null;
        }

        const sensorId =
          (typeof record.id === 'string' && record.id) ||
          (typeof record.id === 'number' && String(record.id)) ||
          `sensor-${index + 1}`;

        const sensorType = typeof record.type === 'string' ? record.type : 'Sensor';
        const title = locationName ? `${sensorType} • ${locationName}` : sensorType;

        return {
          id: locationName ? `${locationName}-${sensorId}` : sensorId,
          latitude,
          longitude,
          title,
          description: `ID: ${sensorId} • (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          sensorType,
        };
      })
      .filter((marker): marker is SensorMarker => marker !== null);

  if (Array.isArray(root)) {
    return addMarkers(root);
  }

  if (Array.isArray(root?.data)) {
    return addMarkers(root.data);
  }

  if (Array.isArray(root?.results)) {
    return addMarkers(root.results);
  }

  if (Array.isArray(root?.items)) {
    return addMarkers(root.items);
  }

  if (root?.sensors && typeof root.sensors === 'object' && !Array.isArray(root.sensors)) {
    const grouped = root.sensors as Record<string, unknown>;
    const markers: SensorMarker[] = [];

    for (const [locationName, sensorsAtLocation] of Object.entries(grouped)) {
      if (Array.isArray(sensorsAtLocation)) {
        markers.push(...addMarkers(sensorsAtLocation, locationName));
      }
    }

    return markers;
  }

  if (Array.isArray(root?.sensors)) {
    return addMarkers(root.sensors);
  }

  return [];
}

function getTypeColor(sensorType: string): string {
  const normalized = sensorType.toLowerCase();

  if (normalized.includes('fire')) {
    return '#d62828';
  }

  if (normalized.includes('cyber')) {
    return '#1d4ed8';
  }

  return '#2a9d8f';
}

function calculateBoundingRegion(markers: { latitude: number; longitude: number }[]): Region | null {
  if (markers.length === 0) return null;

  let minLat = markers[0].latitude;
  let maxLat = markers[0].latitude;
  let minLng = markers[0].longitude;
  let maxLng = markers[0].longitude;

  for (const marker of markers) {
    minLat = Math.min(minLat, marker.latitude);
    maxLat = Math.max(maxLat, marker.latitude);
    minLng = Math.min(minLng, marker.longitude);
    maxLng = Math.max(maxLng, marker.longitude);
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) * 1.3;
  const lngDelta = (maxLng - minLng) * 1.3;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.5),
    longitudeDelta: Math.max(lngDelta, 0.5),
  };
}

export default function MapScreen({ markerPoint }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const currentRegion = useRef<Region>(DEFAULT_REGION);
  const hasInitialRenderRun = useRef(false);
  const [activeMarkerPoint, setActiveMarkerPoint] = useState<MarkerPoint>(markerPoint);
  const [mapType, setMapType] = useState<MapTypeOption>('standard');
  const [isMapTypeSelectorOpen, setIsMapTypeSelectorOpen] = useState(false);
  const [sensorMarkers, setSensorMarkers] = useState<SensorMarker[]>([]);
  const [sensorsLoading, setSensorsLoading] = useState(false);
  const [sensorsError, setSensorsError] = useState<string | null>(null);

  useEffect(() => {
    setActiveMarkerPoint(markerPoint);

    if (!hasInitialRenderRun.current) {
      hasInitialRenderRun.current = true;
      currentRegion.current = DEFAULT_REGION;
      return;
    }

    const focusRegion: Region = {
      latitude: markerPoint.latitude,
      longitude: markerPoint.longitude,
      latitudeDelta: 0.8,
      longitudeDelta: 0.8,
    };
    currentRegion.current = focusRegion;
    mapRef.current?.animateToRegion(focusRegion, 450);
  }, [markerPoint]);

  useEffect(() => {
    const loadSensors = async () => {
      try {
        setSensorsLoading(true);
        setSensorsError(null);

        const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
        const tokenUrl = process.env.EXPO_PUBLIC_OAUTH_TOKEN_URL;
        const clientId = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID;
        const clientSecret = process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET;
        const scope = process.env.EXPO_PUBLIC_OAUTH_SCOPE;

        if (!baseUrl || !tokenUrl || !clientId || !clientSecret) {
          throw new Error(
            'Missing env vars. Set EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_OAUTH_TOKEN_URL, EXPO_PUBLIC_OAUTH_CLIENT_ID, EXPO_PUBLIC_OAUTH_CLIENT_SECRET.'
          );
        }

        const api = new APIDataReader({
          baseUrl,
          oauth: {
            tokenUrl,
            clientId,
            clientSecret,
            scope,
          },
        });

        const response = await api.get<unknown>('/sensors/All_sensors/');
        const normalized = normalizeSensorMarkers(response);
        setSensorMarkers(normalized);

        if (normalized.length > 0) {
          const boundingRegion = calculateBoundingRegion(normalized);
          if (boundingRegion) {
            currentRegion.current = boundingRegion;
            setTimeout(() => {
              mapRef.current?.animateToRegion(boundingRegion, 500);
            }, 300);
          }
        }
      } catch (error) {
        setSensorMarkers([]);
        const message = error instanceof Error ? error.message : 'Failed to load sensors.';
        setSensorsError(message);
        console.error('Sensor load failed', message);
      } finally {
        setSensorsLoading(false);
      }
    };

    loadSensors();
  }, []);

  const zoom = (factor: number) => {
    const region = currentRegion.current;
    const nextRegion = {
      ...region,
      latitudeDelta: Math.min(Math.max(region.latitudeDelta * factor, 0.0005), 90),
      longitudeDelta: Math.min(Math.max(region.longitudeDelta * factor, 0.0005), 180),
    };

    currentRegion.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 250);
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        
        //region={DEFAULT_REGION}
        
        showsUserLocation={true}
        mapType={mapType}
        onRegionChangeComplete={(region) => {
          currentRegion.current = region;
        }}
        // {ttList.map((tt) => (
        //   <Marker
        //     key={tt.id}
        //     coordinate={{ latitude: tt.lat, longitude: tt.long }}
        //     title="Treetalker"
        //     description={`Treetalker at (${tt.lat}, ${tt.long})`}
        //   >
        //     <View style={{ alignItems: "center" }}>
        //       <Text style={{ fontSize: 32 }}>🌲</Text>
        //     </View>
        //   </Marker>
        // ))}
      >
        {sensorMarkers.length > 0 ? (
          sensorMarkers.map((sensor) => (
            <Marker
              key={sensor.id}
              coordinate={{
                latitude: sensor.latitude,
                longitude: sensor.longitude,
              }}
              title={sensor.title}
              description={sensor.description}
              >
                <View
                  style={[
                    styles.treeMarker,
                    { backgroundColor: getTypeColor(sensor.sensorType) },
                  ]}
                >
                  <Text style={styles.treeMarkerEmoji}>🌲</Text>
                </View>
              </Marker>
          ))
        ) : (
          <Marker
            coordinate={{
              latitude: activeMarkerPoint.latitude,
              longitude: activeMarkerPoint.longitude,
            }}
            title={activeMarkerPoint.title}
            description={activeMarkerPoint.description}
            >
              <View style={[styles.treeMarker, styles.treeMarkerFallback]}>
                <Text style={styles.treeMarkerEmoji}>🌲</Text>
              </View>
            </Marker>
        )}
        <Marker
            coordinate={{
              latitude: 44.82,
              longitude: 20.42,
            }}
            title="Project partner Serbia"
            description= "CAD Solutions doo location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 40.54,
              longitude: 23.02,
            }}
            title="Project partner Greece"
            description= "ANATOLIKI location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 42.66,
              longitude: 18.08,
            }}
            title="Project partner Croatia"
            description= "UniDU location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 45.09,
              longitude: 14.12,
            }}
            title="Project partner Croatia"
            description= "IRENA location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 41.35,
              longitude: 19.78,
            }}
            title="Project partner Albania"
            description= "UBT location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 40.36,
              longitude: 18.20,
            }}
            title="Lead partner Italy"
            description= "CMCC location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 40.33,
              longitude: 18.12,
            }}
            title="Project partner Italy"
            description= "DHITECH location"
            >
            </Marker>
            <Marker
            coordinate={{
              latitude: 42.43,
              longitude: 19.25,
            }}
            title="Project partner Montenegro"
            description= "MECONET location"
            >
            </Marker>
      </MapView>

      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>
          {sensorsLoading
            ? 'Loading sensors...'
            : sensorsError
              ? 'Sensor load failed'
              : `Sensors: ${sensorMarkers.length}`}
        </Text>
        {!!sensorsError && <Text style={styles.statusPillError}>{sensorsError}</Text>}
      </View>

      <View style={styles.zoomControls}>
        <Pressable
          accessibilityLabel="Zoom in"
          onPress={() => zoom(0.5)}
          style={({ pressed }) => [styles.zoomButton, pressed && styles.zoomButtonPressed]}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </Pressable>
        <View style={styles.zoomDivider} />
        <Pressable
          accessibilityLabel="Zoom out"
          onPress={() => zoom(2)}
          style={({ pressed }) => [styles.zoomButton, pressed && styles.zoomButtonPressed]}
        >
          <Text style={styles.zoomButtonText}>−</Text>
        </Pressable>
      </View>

      <View style={styles.mapTypeContainer}>
        <Pressable
          accessibilityLabel="Select map type"
          accessibilityState={{ expanded: isMapTypeSelectorOpen }}
          onPress={() => setIsMapTypeSelectorOpen((isOpen) => !isOpen)}
          style={({ pressed }) => [styles.mapTypeButton, pressed && styles.zoomButtonPressed]}
        >
          <Ionicons name="layers-outline" color="#003049" size={22} />
        </Pressable>

        {isMapTypeSelectorOpen && (
          <View style={styles.mapTypeMenu}>
            {MAP_TYPES.map((option) => (
              <Pressable
                key={option.value}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: mapType === option.value }}
                onPress={() => {
                  setMapType(option.value);
                  setIsMapTypeSelectorOpen(false);
                }}
                style={({ pressed }) => [
                  styles.mapTypeOption,
                  mapType === option.value && styles.mapTypeOptionSelected,
                  pressed && styles.zoomButtonPressed,
                ]}
              >
                <Ionicons name={option.icon} color="#003049" size={22} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statusPill: {
    position: 'absolute',
    top: 18,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.86)',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  statusPillText: {
    color: '#003049',
    fontSize: 12,
    fontWeight: '600',
  },
  statusPillError: {
    marginTop: 4,
    color: '#7f1d1d',
    fontSize: 10,
    maxWidth: 240,
  },
  treeMarker: {
    minWidth: 30,
    minHeight: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  treeMarkerFallback: {
    backgroundColor: '#2a9d8f',
  },
  treeMarkerEmoji: {
    fontSize: 17,
    lineHeight: 19,
  },
  zoomControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonPressed: {
    backgroundColor: 'rgba(232,239,241,0.85)',
  },
  zoomButtonText: {
    color: '#003049',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
  zoomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(73,99,109,0.45)',
  },
  mapTypeContainer: {
    position: 'absolute',
    top: 164,
    right: 16,
    alignItems: 'flex-end',
  },
  mapTypeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapTypeMenu: {
    width: 44,
    marginTop: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mapTypeOption: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeOptionSelected: {
    backgroundColor: 'rgba(200,220,225,0.7)',
  },
});
