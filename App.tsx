import { enableScreens } from 'react-native-screens';
enableScreens();

import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationContainer } from '@react-navigation/native';

import { AllBottomTabs } from './RootLayout';

export default function App() {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={'#f0f0f0'}
        translucent={false}
      />
      <SafeAreaProvider style={{ flex: 1 }}>
        <NavigationContainer>
          <AllBottomTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </>
  );
}
