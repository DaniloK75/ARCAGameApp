import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const logoSource = require('../assets/Logo_ interreg_ARCA.png');

type DashboardScreenProps = {
  onSerbiaFlagPress: () => void;
};

export default function DashboardScreen({ onSerbiaFlagPress }: DashboardScreenProps) {
  const { setLanguage } = useLanguage();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const [scrollTextHeight, setScrollTextHeight] = useState(0);

  const flagLanguageMap: Record<string, any> = {
    italy: 'it',
    greece: 'el',
    croatia: 'hr',
    albania: 'sq',
    montenegro: 'sr',
    serbia: 'sr',
  };

  const handleFlagPress = (flagName: string) => {
    const language = flagLanguageMap[flagName];
    if (language) {
      setLanguage(language);
    }
  };

  useEffect(() => {
    if (!scrollViewportHeight || !scrollTextHeight) {
      return;
    }

    scrollY.setValue(scrollViewportHeight);

    const travelDistance = scrollViewportHeight + scrollTextHeight;
    const duration = Math.max(40950, travelDistance * 52.65);

    const animation = Animated.loop(
      Animated.timing(scrollY, {
        toValue: -scrollTextHeight,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scrollViewportHeight, scrollTextHeight, scrollY]);

  return (
    <View style={styles.dashboardScreen}>
      <ImageBackground
        source={require('../assets/ARCATree.png')}
        style={styles.dashboardImageArea}
        imageStyle={styles.dashboardBackgroundImage}
        resizeMode="stretch"
      >
        

        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Image
              source={logoSource}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>
          <View
            style={styles.scrollingTextViewport}
            onLayout={(event) => setScrollViewportHeight(event.nativeEvent.layout.height)}
          >
            <Animated.Text
              onLayout={(event) => setScrollTextHeight(event.nativeEvent.layout.height)}
              style={[styles.scrollingText, { transform: [{ translateY: scrollY }] }]}
            >
              Forest monitoring stands as a crucial endeavor for the well-being of our planet and human communities.
              {'\n'}The project named ARtificial intelligence platform to 
              prevent Climate change natural hazArds (ARCA) aims to 
              address forest monitoring by developing an innovative system
               utilizing Artificial Intelligence (AI). The primary 
               objective is to create a transnationally applicable 
               platform through pilot initiatives in wooded areas, 
               employing cutting-edge technologies to combat the risks 
               posed by climate change-induced natural hazards. The project
                relies on advanced algorithms based on Machine Learning 
                (ML) and diverse networks made of Internet of Things (IoT)
                 sensors.
            </Animated.Text>
          </View>
        </View>
      </ImageBackground>

      <ImageBackground
        source={require('../assets/ProjectMap.png')}
        style={styles.dashboardCaptionArea}
        imageStyle={styles.dashboardCaptionBackgroundImage}
        resizeMode="cover"
      >
        <Text style={styles.dashboardCaptionTitle}>ARCA Interreg IPA Adrion project</Text>
        <Text style={styles.dashboardCaptionSubtitle}>
          ARtificial intelligence platform to prevent Climate change natural hazArds
        </Text>

        <View style={styles.flagsContainer}>
          <View style={styles.flagsRow}>
            <Pressable onPress={() => handleFlagPress('italy')} accessibilityLabel="Switch to Italian">
              <Image source={require('../assets/flags/Italy.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
            <Pressable onPress={() => handleFlagPress('greece')} accessibilityLabel="Switch to Greek">
              <Image source={require('../assets/flags/Greece.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
            <Pressable onPress={() => handleFlagPress('croatia')} accessibilityLabel="Switch to Croatian">
              <Image source={require('../assets/flags/Croatia.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
          </View>
          <View style={styles.flagsRow}>
            <Pressable onPress={() => handleFlagPress('albania')} accessibilityLabel="Switch to Albanian">
              <Image source={require('../assets/flags/Albania.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
            <Pressable onPress={() => handleFlagPress('montenegro')} accessibilityLabel="Switch to Serbian">
              <Image source={require('../assets/flags/MonteNegro.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
            <Pressable onPress={() => { handleFlagPress('serbia'); onSerbiaFlagPress(); }} accessibilityLabel="Open CAD Solutions on map">
              <Image source={require('../assets/flags/Serbia.png')} style={styles.flagImage} resizeMode="contain" />
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardScreen: {
    flex: 1,
    backgroundColor: '#f4f8f9',
    position: 'relative',
  },
  dashboardImageArea: {
    height: '88%',
    overflow: 'hidden',
  },
  dashboardBackgroundImage: {
    transform: [{ scaleY: 0.8
     }],
  },
  treeOverlayImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '31%',
    opacity: 0.5,
  },
  dashboardCaptionArea: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 22,
    backgroundColor: 'transparent',
    opacity: 0.85,
  },
  dashboardCaptionBackgroundImage: {
    opacity: 0.65,
  },
  dashboardCaptionTitle: {
    color: '#003049',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dashboardCaptionSubtitle: {
    color: '#050bbbe5',
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(240, 125, 125, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  flagsContainer: {
    marginTop: 5.0,
    width: '100%',
    gap: 8,
    verticalAlign: 'bottom',
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
  scrollingTextViewport: {
    position: 'absolute',
    top: '33%',
    left: 16,
    right: 16,
    height: '24.5%',
    overflow: 'hidden',
  },
  scrollingText: {
    fontSize: 12,
    textAlign: 'justify',
    color: '#3d0366',
    lineHeight: 18,
  },
  headerContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerImage: {
    width: '80%',
    height: 140,
    opacity: 1.0,
  },
});
