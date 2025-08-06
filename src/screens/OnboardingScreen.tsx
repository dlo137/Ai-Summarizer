import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Initialize animations outside of component
const wave1Animation = new Animated.Value(0);
const wave2Animation = new Animated.Value(0);
const wave3Animation = new Animated.Value(0);

const OnboardingScreen = ({ navigation }: any) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Start all animations together with different configurations
    Animated.parallel([
      // Wave 1: Up and down movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave1Animation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave1Animation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      // Wave 2: Left and right movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave2Animation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave2Animation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      // Wave 3: Diagonal movement
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave3Animation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wave3Animation, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const onboardingSteps = [
    {
      title: 'Cut Through the Clutter. Understand More, Faster.',
      subtitle: '',
      icon: 'mic',
      color: '#007AFF',
    },
    {
      title: 'Instant notes from audio, video, & text.',
      subtitle: 'Powered by AI',
      icon: 'document-text',
      color: '#34C759',
      stats: [
        { number: '5 min', label: 'average summary time' },
        { number: '1-Click', label: 'instant insights' },
      ],
    },
  ];

  const currentStepData = onboardingSteps[currentStep];

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to welcome screen when onboarding is complete
      navigation.navigate('Welcome');
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E3F2FD', '#FFFFFF']}
        style={styles.gradient}
      >
        {/* Wave Pattern Background */}
        <View style={styles.wavePattern}>
          <Animated.View style={[
            styles.wave1,
            styles.waveCommon,
            {
              transform: [{
                translateY: wave1Animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40]  // Increased movement range
                })
              }]
            }
          ]} />
          <Animated.View style={[
            styles.wave2,
            styles.waveCommon,
            {
              transform: [{
                translateX: wave2Animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 30]  // Increased movement range
                })
              }]
            }
          ]} />
          <Animated.View style={[
            styles.wave3,
            styles.waveCommon,
            {
              transform: [{
                translateY: wave3Animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -35]  // Increased movement range
                })
              }]
            }
          ]} />
        </View>



        {/* Main Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            {currentStepData.subtitle && (
              <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
            )}
          </View>

          {/* Stats Section (for step 1) */}
          {currentStep === 1 && (
            <View style={styles.statsSection}>
              {currentStepData.stats?.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statIcon}>
                    <Ionicons 
                      name={index === 0 ? "time-outline" : "flash-outline"} 
                      size={24} 
                      color={index === 0 ? "#007AFF" : "#34C759"} 
                    />
                  </View>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Removed waveform section */}

          {/* Removed report section */}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
  },
  wavePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wave1: {
    position: 'absolute',
    top: 100,
    left: -50,
    width: 200,
    height: 100,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 100,
  },
  wave2: {
    position: 'absolute',
    top: 200,
    right: -30,
    width: 150,
    height: 80,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 80,
  },
  wave3: {
    position: 'absolute',
    bottom: 200,
    left: 50,
    width: 120,
    height: 60,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 60,
  },
  waveCommon: {
    position: 'absolute',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40, // Add some top margin to push content down
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    justifyContent: 'center',
    flex: 0,
    maxWidth: '80%', // Constrain width for better readability
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  waveformSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 30,
    position: 'relative',
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  playbackIndicator: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: 80,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  transcriptPreview: {
    width: '100%',
  },
  transcriptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  transcriptContent: {
    flex: 1,
  },
  speakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  messageBubble: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  // Removed unused report styles
  continueButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    alignSelf: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
});

export default OnboardingScreen; 