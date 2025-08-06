import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { completeOnboarding } from '../utils/onboardingState';

const LoadingScreen = ({ navigation }: any) => {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const rotationAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Animate rotation
    Animated.loop(
      Animated.timing(rotationAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Complete onboarding and handle navigation
    const timer = setTimeout(() => {
      // First complete the onboarding
      completeOnboarding();

      // Reset the entire navigation state to the App stack
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Loading',
            state: {
              routes: [
                {
                  name: 'Home'
                }
              ]
            }
          }
        ]
      });

    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolate = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Loading Circle */}
      <View style={styles.loadingContainer}>
        {/* Background Circle */}
        <View style={styles.backgroundCircle}>
          <Ionicons name="mic" size={32} color="white" />
        </View>
        
        {/* Progress Ring */}
        <Animated.View
          style={[
            styles.progressRing,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <View style={styles.progressArc} />
        </Animated.View>
      </View>

      {/* Loading Text */}
      <Text style={styles.loadingTitle}>Preparing premium subscription</Text>
      <Text style={styles.loadingSubtitle}>This may take a few seconds</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  backgroundCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#E3F2FD',
  },
  progressArc: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: '#007AFF',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingScreen; 