import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { handleLogout } from '../utils/onboardingState';
import { supabase } from '../lib/supabase';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [userEmail, setUserEmail] = useState('');

  // Function to format display name (First name + Last initial)
  const formatDisplayName = (fullName: string): string => {
    if (!fullName || fullName.trim() === '') return 'User';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      // Only first name provided
      return nameParts[0];
    } else if (nameParts.length >= 2) {
      // First name + last initial
      const firstName = nameParts[0];
      const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    }
    
    return fullName;
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          return;
        }

        if (user) {
          setUserEmail(user.email || '');
          
          // Try to get user's full name from user metadata or profile
          let fullName = '';
          
          // Check user metadata first (from auth providers like Google)
          if (user.user_metadata?.full_name) {
            fullName = user.user_metadata.full_name;
          } else if (user.user_metadata?.name) {
            fullName = user.user_metadata.name;
          } else if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
            fullName = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
          }
          
          // If no metadata, try to get from profiles table
          if (!fullName) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, first_name, last_name')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              if (profile.full_name) {
                fullName = profile.full_name;
              } else if (profile.first_name && profile.last_name) {
                fullName = `${profile.first_name} ${profile.last_name}`;
              } else if (profile.first_name) {
                fullName = profile.first_name;
              }
            }
          }
          
          // Format and set display name
          const displayName = formatDisplayName(fullName);
          setUserDisplayName(displayName);
          
          console.log('User data loaded:', {
            email: user.email,
            fullName,
            displayName,
            metadata: user.user_metadata
          });
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      }
    };

    fetchUserData();
  }, []);
  const profileOptions = [
    {
      title: 'Account Settings',
      icon: 'person',
      onPress: () => Alert.alert('Coming Soon', 'Account settings will be available soon'),
    },
    {
      title: 'Subscription',
      icon: 'card',
      onPress: () => Alert.alert('Coming Soon', 'Subscription management will be available soon'),
    },
    {
      title: 'Usage Statistics',
      icon: 'analytics',
      onPress: () => Alert.alert('Coming Soon', 'Usage statistics will be available soon'),
    },
    {
      title: 'Export Data',
      icon: 'download',
      onPress: () => Alert.alert('Coming Soon', 'Data export will be available soon'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      onPress: () => Alert.alert('Coming Soon', 'Help & support will be available soon'),
    },
    {
      title: 'About',
      icon: 'information-circle',
      onPress: () => Alert.alert('About', 'NotesSummarizer v1.0.0\n\nTransform any content into clear summaries'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <Text style={styles.userName}>{userDisplayName}</Text>
          <Text style={styles.userEmail}>{userEmail || 'user@example.com'}</Text>
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>Free Plan</Text>
          </View>
        </View>

        {/* Usage Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage This Month</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Summaries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0%</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
          </View>
        </View>

        {/* Profile Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {profileOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.onPress}
            >
              <View style={styles.optionContent}>
                <Ionicons name={option.icon as any} size={24} color="#007AFF" />
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Logout',
                    onPress: () => {
                      // TODO: Clear user session/token here
                      handleLogout();
                    },
                    style: 'destructive'
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  subscriptionBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subscriptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  optionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
});

export default ProfileScreen; 