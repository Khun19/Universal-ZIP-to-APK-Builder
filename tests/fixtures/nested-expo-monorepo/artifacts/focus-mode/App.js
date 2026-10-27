import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Focus Mode nested Expo build fixture</Text>
      </View>
    </SafeAreaView>
  );
}
