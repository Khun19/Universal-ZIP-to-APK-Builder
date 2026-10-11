import React, {useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, Text} from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>
        M6 React Native direct build fixture
      </Text>
      <Text testID="interaction-count" style={styles.counter}>
        Tap count: {count}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increment tap count"
        onPress={() => setCount((current) => current + 1)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Tap to verify interaction</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#172033',
  },
  counter: {
    marginTop: 20,
    marginBottom: 16,
    fontSize: 18,
    color: '#172033',
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2458d3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
