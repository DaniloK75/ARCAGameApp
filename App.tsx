import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { APIDataReader } from './APIDataReader';
import DashboardTabScreen from './screens/DashboardScreen';
import MapTabScreen from './screens/MapScreen';
import SocialTabScreen from './screens/SocialScreen';
import JournalTabScreen from './screens/JournalScreen';
import StatisticsTabScreen from './screens/StatisticsScreen';

const Tab = createBottomTabNavigator();
type RootTabParamList = {
  Dashboard: undefined;
  Statistics: undefined;
  Map: undefined;
  Journal: undefined;
  Social: undefined;
};
const navigationRef = createNavigationContainerRef<RootTabParamList>();

type MapTypeOption = 'standard' | 'satellite' | 'hybrid' | 'terrain';

const MAP_TYPES = [
  { label: 'Standard map', value: 'standard', icon: 'map-outline' },
  { label: 'Satellite map', value: 'satellite', icon: 'earth-outline' },
  { label: 'Hybrid map', value: 'hybrid', icon: 'layers-outline' },
  { label: 'Terrain map', value: 'terrain', icon: 'trail-sign-outline' },
] as const;

const ARCA_REGION = {
  latitude: 42.2,
  longitude: 16.8,
  latitudeDelta: 10.8,
  longitudeDelta: 18.8,
};

type MarkerPoint = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
};

const ARCA_POINT: MarkerPoint = {
  latitude: ARCA_REGION.latitude,
  longitude: ARCA_REGION.longitude,
  title: 'ARCA',
  description: 'ARCA Region',
};

const BELGRADE_POINT: MarkerPoint = {
  latitude: 44.7866,
  longitude: 20.4489,
  title: 'Belgrade',
  description: 'Belgrade, Serbia',
};

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
};

type HomeScreenProps = {
  onSerbiaFlagPress: () => void;
};

function HomeScreen({ onSerbiaFlagPress }: HomeScreenProps) {
  return (
    <View style={styles.dashboardScreen}>
      <ImageBackground
        source={require('./assets/ProjectMap.png')}
        style={styles.dashboardImageArea}
        imageStyle={styles.dashboardBackgroundImage}
        resizeMode="stretch"
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Image
              source={require('./assets/Logo_interreg_ARCA_ORR.png')}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.dashboardCaptionArea}>
        
        <Text style={styles.dashboardCaptionTitle}>ARCA Interreg IPA Adrion project</Text>
        <Text style={styles.dashboardCaptionSubtitle}>ARtificial intelligence platform to prevent Climate change natural hazArds</Text>

        <View style={styles.flagsContainer}>
          <View style={styles.flagsRow}>
            <Image source={require('./assets/flags/Italy.png')} style={styles.flagImage} resizeMode="contain" />
            <Image source={require('./assets/flags/Greece.png')} style={styles.flagImage} resizeMode="contain" />
            <Image source={require('./assets/flags/Croatia.png')} style={styles.flagImage} resizeMode="contain" />
          </View>
          <View style={styles.flagsRow}>
            <Image source={require('./assets/flags/Albania.png')} style={styles.flagImage} resizeMode="contain" />
            <Image source={require('./assets/flags/MonteNegro.png')} style={styles.flagImage} resizeMode="contain" />
            <Pressable onPress={onSerbiaFlagPress} accessibilityLabel="Open Belgrade on map">
              <Image source={require('./assets/flags/Serbia.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

type MapScreenProps = {
  markerPoint: MarkerPoint;
};

function MapScreen({ markerPoint }: MapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const currentRegion = useRef<Region>(ARCA_REGION);
  const [activeMarkerPoint, setActiveMarkerPoint] = useState<MarkerPoint>(markerPoint);
  const [mapType, setMapType] = useState<MapTypeOption>('hybrid');
  const [isMapTypeSelectorOpen, setIsMapTypeSelectorOpen] = useState(false);

  useEffect(() => {
    setActiveMarkerPoint(markerPoint);
    const focusRegion: Region = {
      latitude: markerPoint.latitude,
      longitude: markerPoint.longitude,
      latitudeDelta: 0.25,
      longitudeDelta: 0.25,
    };
    currentRegion.current = focusRegion;
    mapRef.current?.animateToRegion(focusRegion, 450);
  }, [markerPoint]);

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
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={ARCA_REGION}
        mapType={mapType}
        onRegionChangeComplete={(region) => {
          currentRegion.current = region;
        }}
      >
        <Marker
          coordinate={{
            latitude: activeMarkerPoint.latitude,
            longitude: activeMarkerPoint.longitude,
          }}
          title={activeMarkerPoint.title}
          description={activeMarkerPoint.description}
        />
      </MapView>
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

function SocialScreen() {
  const [apiResult, setApiResult] = useState('Tap button to run All_Sensors GET request.');
  const [loading, setLoading] = useState(false);
  const [instagramPosts, setInstagramPosts] = useState<InstagramMedia[]>([]);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);

  const instagramProfileUrl = 'https://www.instagram.com/arca_interregproject/';

  const getApiData = async () => {
    try {
      setLoading(true);

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

      const getData = await api.get<unknown>('/sensors/All_sensors/');
      setApiResult(JSON.stringify(getData, null, 2));
      console.log('API request successful', { endpoint: 'sensors/All_sensors/', data: getData });
    } catch (error) {
      setApiResult(error instanceof Error ? error.message : 'API request failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadInstagramFeed = async () => {
    try {
      setInstagramLoading(true);
      setInstagramError(null);

      const accessToken = process.env.EXPO_PUBLIC_INSTAGRAM_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error('Set EXPO_PUBLIC_INSTAGRAM_ACCESS_TOKEN in .env to load Instagram feed.');
      }

      const params = new URLSearchParams({
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
        limit: '9',
        access_token: accessToken,
      });

      const response = await fetch(`https://graph.instagram.com/me/media?${params.toString()}`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Instagram API error (${response.status}): ${text}`);
      }

      const json = (await response.json()) as { data?: InstagramMedia[] };
      setInstagramPosts(json.data ?? []);
    } catch (error) {
      setInstagramError(error instanceof Error ? error.message : 'Failed to load Instagram feed.');
    } finally {
      setInstagramLoading(false);
    }
  };

  useEffect(() => {
    loadInstagramFeed();
  }, []);

  return (
    <View style={styles.socialContainer}>
      <Text style={styles.socialTitle}>Social</Text>
      <Text style={styles.socialDescription}>
        Connect with the ARCA community and share your experiences.
      </Text>

      <Pressable
        onPress={getApiData}
        disabled={loading}
        accessibilityLabel="Get sensor data"
        style={({ pressed }) => [
          styles.apiButton,
          pressed && styles.apiButtonPressed,
          loading && styles.apiButtonLoading,
        ]}
      >
        <Ionicons
          name={loading ? 'cloud-download-outline' : 'cloud-download'}
          color="#ffffff"
          size={20}
        />
        <Text style={styles.apiButtonText}>
          {loading ? 'Loading...' : 'Get Data'}
        </Text>
      </Pressable>

      {apiResult ? (
        <ScrollView
          style={styles.apiResultScroll}
          contentContainerStyle={styles.apiResultContent}
        >
          <Text style={styles.apiResultText}>{apiResult}</Text>
        </ScrollView>
      ) : null}

      <View style={styles.instagramSection}>
        <View style={styles.instagramHeaderRow}>
          <Text style={styles.instagramTitle}>Instagram Feed</Text>
          <Pressable
            onPress={loadInstagramFeed}
            disabled={instagramLoading}
            style={({ pressed }) => [styles.instagramRefreshButton, pressed && styles.apiButtonPressed]}
          >
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.instagramRefreshText}>Refresh</Text>
          </Pressable>
        </View>

        {instagramLoading ? <ActivityIndicator color="#003049" /> : null}

        {instagramError ? (
          <Text style={styles.instagramErrorText}>{instagramError}</Text>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instagramCardsRow}>
          {instagramPosts.map((post) => (
            <Pressable
              key={post.id}
              onPress={() => Linking.openURL(post.permalink)}
              style={styles.instagramCard}
            >
              {post.media_url || post.thumbnail_url ? (
                <Image
                  source={{ uri: post.media_url ?? post.thumbnail_url }}
                  style={styles.instagramImage}
                />
              ) : (
                <View style={[styles.instagramImage, styles.instagramImagePlaceholder]}>
                  <Ionicons name="image-outline" size={26} color="#68818a" />
                </View>
              )}
              <Text numberOfLines={2} style={styles.instagramCaption}>
                {post.caption ?? 'View post'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable onPress={() => Linking.openURL(instagramProfileUrl)}>
          <Text style={styles.instagramProfileLink}>Open @arca_interregproject profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

function JournalScreen() {
  return (
    <View style={styles.socialContainer}>
      <Text style={styles.socialTitle}>Journal</Text>
      <Text style={styles.socialDescription}>
        Track your notes, progress, and daily ARCA activities.
      </Text>
    </View>
  );
}

function StatisticsScreen() {
  return (
    <View style={styles.socialContainer}>
      <Text style={styles.socialTitle}>Statistics</Text>
      <Text style={styles.socialDescription}>
        View project metrics, trends, and performance indicators.
      </Text>
    </View>
  );
}

export default function App() {
  const [markerPoint, setMarkerPoint] = useState<MarkerPoint>(ARCA_POINT);

  const handleSerbiaFlagPress = () => {
    setMarkerPoint(BELGRADE_POINT);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Map');
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#003049',
        }}
      >
        <Tab.Screen
          name="Dashboard"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                color={color}
                size={size}
              />
            ),
          }}
        >
          {() => <DashboardTabScreen onSerbiaFlagPress={handleSerbiaFlagPress} />}
        </Tab.Screen>
        <Tab.Screen
          name="Statistics"
          component={StatisticsTabScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'globe' : 'globe-outline'}
                color={color}
                size={size}
              />
            ),
          }}
        >
          {() => <MapTabScreen markerPoint={markerPoint} />}
        </Tab.Screen>
        <Tab.Screen
          name="Journal"
          component={JournalTabScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'journal' : 'journal-outline'}
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Social"
          component={SocialTabScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  dashboardScreen: {
    flex: 1,
    backgroundColor: '#f4f8f9',
  },
  background: {
    flex: 1,
  },
  dashboardImageArea: {
    flex: 0.72,
    marginTop: 26,
  },
  dashboardBackgroundImage: {
    transform: [{ scaleY: 0.7 }],
  },
  dashboardCaptionArea: {
    flex: 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dashboardCaptionTitle: {
    color: '#003049',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  dashboardCaptionSubtitle: {
    color: '#49636d',
    fontSize: 16,
    textAlign: 'center',
  },
  flagsContainer: {
    marginTop: 10,
    width: '100%',
    gap: 8,
  },
  flagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  flagImage: {
    width: 82,
    height: 48,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerContainer: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 70,
    opacity: 0.7,
  },
  text: {
    color: '#003049',
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  socialContainer: {
    flex: 1,
    backgroundColor: '#f4f8f9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  socialTitle: {
    color: '#003049',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  socialDescription: {
    color: '#49636d',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  apiButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#003049',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  apiButtonPressed: {
    backgroundColor: '#004f73',
    opacity: 0.9,
  },
  apiButtonLoading: {
    opacity: 0.6,
  },
  apiButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  apiResultScroll: {
    marginTop: 16,
    width: '100%',
    maxHeight: 320,
    backgroundColor: 'rgba(0,48,73,0.06)',
    borderRadius: 8,
  },
  apiResultContent: {
    padding: 12,
  },
  apiResultText: {
    color: '#23424d',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'monospace' as const,
  },
  instagramSection: {
    width: '100%',
    marginTop: 16,
  },
  instagramHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  instagramTitle: {
    color: '#003049',
    fontSize: 18,
    fontWeight: '700',
  },
  instagramRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#003049',
  },
  instagramRefreshText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  instagramErrorText: {
    color: '#a11d33',
    marginBottom: 8,
    fontSize: 12,
  },
  instagramCardsRow: {
    gap: 10,
    paddingBottom: 8,
  },
  instagramCard: {
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.08)',
  },
  instagramImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#eaf1f3',
  },
  instagramImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagramCaption: {
    color: '#23424d',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  instagramProfileLink: {
    color: '#005d8f',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
});
