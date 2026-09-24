import React from 'react';
import {SafeAreaView, Text} from 'react-native';

export default function App() {
  const hermes = typeof global.HermesInternal !== 'undefined';

  return (
    <SafeAreaView>
      <Text>M6 React Native direct build fixture</Text>
      <Text>Runtime: {hermes ? 'Hermes' : 'JSC'}</Text>
    </SafeAreaView>
  );
}
