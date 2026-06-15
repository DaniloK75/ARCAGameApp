import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { WebView } from 'react-native-webview';
import { APIDataReader } from '../APIDataReader';

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
};



const FIRE_PREVENTION_LINKS = [
  {
    title: 'EFFIS – European Forest Fire Information System',
    description: 'Real-time fire danger, active fire detection and damage assessment across Europe.',
    url: 'https://effis.jrc.ec.europa.eu/',
  },
  {
    title: 'FAO – Forest Fire Management',
    description: 'UN guidelines and resources on integrated fire management globally.',
    url: 'https://www.fao.org/forestry/fire/en/',
  },
  {
    title: 'Global Fire Monitoring Center (GFMC)',
    description: 'International wildland fire policy, research and early warning.',
    url: 'https://gfmc.online/',
  },
  {
    title: 'UNEP – Wildfire Prevention',
    description: 'UNEP resources addressing the global wildfire crisis and ecosystem recovery.',
    url: 'https://www.unep.org/explore-topics/forests/what-we-do/forest-fires',
  },
  {
    title: 'JRC – Forest Fires in Europe',
    description: 'Annual scientific reports on forest fire statistics across EU member states.',
    url: 'https://forest.jrc.ec.europa.eu/en/activities/fire/',
  },
  {
    title: 'Copernicus Emergency Management Service',
    description: 'Satellite-based fire monitoring and post-fire damage assessment maps.',
    url: 'https://emergency.copernicus.eu/',
  },
  {
    title: 'IPSF – International Peatland Society Fire',
    description: 'Resources on peatland fire prevention and carbon emission reduction.',
    url: 'https://peatlands.org/peatlands/threats/fire/',
  },
];

export default function SocialScreen() {
  const instagramProfileUrl = 'https://www.instagram.com/arca_interregproject/';

  return (
    <View style={styles.socialContainer}>
      <Text style={styles.socialTitle}>Social and learning hub</Text>
      <Text style={styles.socialDescription}>
        Connect with the ARCA community and share your observations and experiences.
        Improve your knowledge on the latest developments concerning active prevention
         of forest fires and climate change mitigation.
      </Text>

      <View style={styles.contentArea}>
        <View style={styles.instagramSection}>
          <Pressable
            onPress={() => Linking.openURL(instagramProfileUrl)}
            style={({ pressed }) => [styles.instagramProfileButton, pressed && styles.instagramProfileButtonPressed]}
          >
            <Ionicons name="logo-instagram" size={28} color="#ffffff" />
            <View style={styles.instagramProfileButtonText}>
              <Text style={styles.instagramProfileButtonTitle}>@arca_interregproject</Text>
              <Text style={styles.instagramProfileButtonSub}>View profile on Instagram</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.linksSection}
          contentContainerStyle={styles.linksContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.linksSectionTitle}>🌲 Forest Fire Prevention Resources</Text>
          {FIRE_PREVENTION_LINKS.map((link) => (
            <Pressable
              key={link.url}
              onPress={() => Linking.openURL(link.url)}
              style={({ pressed }) => [styles.linkItem, pressed && styles.linkItemPressed]}
            >
              <Ionicons name="open-outline" size={16} color="#003049" />
              <View style={styles.linkTextBlock}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkDesc} numberOfLines={2}>{link.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#8aa0a8" />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  socialContainer: {
    flex: 1,
    backgroundColor: '#f4f8f9',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
  },
  socialTitle: {
    color: '#003049',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 75,
  },
  socialDescription: {
    color: '#49636d',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  contentArea: {
    flex: 1,
    width: '90%',
    marginTop: 16,
    marginBottom: 0,
  },
  linksSection: {
    flex: 67,
    marginTop: 6,
  },
  linksContent: {
    paddingBottom: 24,
    gap: 8,
  },
  linksSectionTitle: {
    color: '#003049',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(12, 97, 143, 0.56)',
  },
  linkItemPressed: {
    backgroundColor: '#eaf1f3',
  },
  linkTextBlock: {
    flex: 1,
  },
  linkTitle: {
    color: '#003049',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkDesc: {
    color: '#5f7a83',
    fontSize: 11,
    lineHeight: 15,
  },
  instagramSection: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  instagramProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#c13584',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  instagramProfileButtonPressed: {
    backgroundColor: '#a02a6b',
  },
  instagramProfileButtonText: {
    flex: 1,
  },
  instagramProfileButtonTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  instagramProfileButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  instagramHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    display: 'none',
  },
  instagramTitle: {
    color: '#003049',
    fontSize: 18,
    fontWeight: '700',
    display: 'none',
  },
  instagramRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#003049',
    display: 'none',
  },
  instagramRefreshText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    display: 'none',
  },
  instagramErrorText: {
    color: '#a11d33',
    marginBottom: 8,
    fontSize: 12,
    display: 'none',
  },
  instagramCardsRow: {
    gap: 10,
    paddingBottom: 8,
    display: 'none',
  },
  instagramCard: {
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.08)',
    display: 'none',
  },
  instagramImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#eaf1f3',
    display: 'none',
  },
  instagramImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'none',
  },
  instagramCaption: {
    color: '#23424d',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    display: 'none',
  },
  instagramProfileLink: {
    color: '#005d8f',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    display: 'none',
  },
});
