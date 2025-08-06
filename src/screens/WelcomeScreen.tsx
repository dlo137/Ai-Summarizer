import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Initialize animation value outside component
const fadeAnim = new Animated.Value(1);

const WelcomeScreen = ({ navigation }: any) => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  
  const icons: { name: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { name: 'mic', color: 'white' },
    { name: 'videocam', color: 'white' },
    { name: 'document-text', color: 'white' },
    { name: 'link', color: 'white' },
  ];

  useEffect(() => {
    const animate = () => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,  // Faster fade out
        useNativeDriver: true,
      }).start(() => {
        // Change icon while fully faded out
        setCurrentIconIndex((prev) => (prev + 1) % icons.length);
        
        // Fade in with new icon
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,  // Faster fade in
            useNativeDriver: true,
          }).start();
        }, 25); // Shorter delay
      });
    };

    // Start the animation cycle with shorter interval
    const intervalId = setInterval(animate, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSignUp = () => {
    // Navigate to sign up screen
    navigation.navigate('SignUp');
  };

  const handleLogIn = () => {
    // Navigate to login screen
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Welcome Modal - Full Screen */}
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          {/* App Icon */}
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Ionicons 
                  name={icons[currentIconIndex].name} 
                  size={32} 
                  color={icons[currentIconIndex].color} 
                />
              </Animated.View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome to Summarizer</Text>
            <View style={styles.speakerIcon}>
              <Ionicons name="volume-high" size={16} color="#007AFF" />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            With your account you will never lose your info. Switch devices anytime you want
          </Text>

          {/* Sign Up and Log In Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logInButton} onPress={handleLogIn}>
              <Text style={styles.logInButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Disclaimer */}
          <Text style={styles.legalText}>
            By clicking 'Sign Up' or 'Log In' above, you acknowledge that you have read, understood and agree to{' '}
            <Text style={styles.linkText}>Notespace's Terms & Conditions</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  modal: {
    alignItems: 'center',
  },
  appIconContainer: {
    marginBottom: 20,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 8,
  },
  speakerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  logInButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  legalText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#007AFF',
  },
});

export default WelcomeScreen; 