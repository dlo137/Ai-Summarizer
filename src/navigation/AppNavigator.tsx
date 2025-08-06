import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DocumentDetailScreen from '../screens/DocumentDetailScreen';
import SummariesScreen from '../screens/SummariesScreen';
import SummaryDetailScreen from '../screens/SummaryDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddDocumentScreen from '../screens/AddDocumentScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import OnboardingNavigator from './OnboardingNavigator';

export type RootStackParamList = {
  App: undefined;
  Onboarding: undefined;
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create stack navigators for each tab
const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home' }} />
    <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ title: 'Add Document' }} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
  </Stack.Navigator>
);

const DocumentsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} options={{ title: 'My Documents' }} />
    <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} options={{ title: 'Document Details' }} />
    <Stack.Screen name="AddDocument" component={AddDocumentScreen} options={{ title: 'Add Document' }} />
  </Stack.Navigator>
);

const SummariesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen name="SummariesScreen" component={SummariesScreen} options={{ title: 'My Summaries' }} />
    <Stack.Screen name="SummaryDetail" component={SummaryDetailScreen} options={{ title: 'Summary Details' }} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#007AFF',
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Documents':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Summaries':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Documents" component={DocumentsStack} />
      <Tab.Screen name="Summaries" component={SummariesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
