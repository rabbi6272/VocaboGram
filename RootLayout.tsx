import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Image } from 'react-native';

import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagePage } from './pages/MessagePage';
import { ReelsPage } from './pages/ReelsPage';
import { AddPage } from './pages/AddPage';

const Tab = createBottomTabNavigator();
export function AllBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          height: 70,
        },
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* //Home Page */}
      <Tab.Screen
        name="Home"
        component={HomePage}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => {
            return (
              <Image
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : 'gray',
                }}
                source={require('./assets/images/home.png')}
              />
            );
          },
        }}
      />
      {/* //Reel Page */}
      <Tab.Screen
        name="Reels"
        component={ReelsPage}
        options={{
          tabBarLabel: 'Reels',
          tabBarIcon: ({ focused }) => {
            return (
              <Image
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : 'gray',
                }}
                source={require('./assets/images/reel.png')}
              />
            );
          },
        }}
      />
      {/* //Add Page */}
      <Tab.Screen
        name="Add"
        component={AddPage}
        options={{
          tabBarLabel: 'Add',
          tabBarIcon: ({ focused }) => {
            return (
              <Image
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : 'gray',
                }}
                source={require('./assets/images/add.png')}
              />
            );
          },
        }}
      />
      {/* //Message Page */}
      <Tab.Screen
        name="Chat"
        component={MessagePage}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused }) => {
            return (
              <Image
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : 'gray',
                }}
                source={require('./assets/images/chat.png')}
              />
            );
          },
        }}
      />
      {/* //Profile Page */}
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => {
            return (
              <Image
                style={{
                  width: 22,
                  height: 22,
                  tintColor: focused ? '#000' : 'gray',
                }}
                source={require('./assets/images/profile.png')}
              />
            );
          },
        }}
      />
    </Tab.Navigator>
  );
}
