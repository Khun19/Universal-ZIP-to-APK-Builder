import React, {useState} from 'react';
import {SafeAreaView, Text, Pressable, StyleSheet} from 'react-native';

export default function App() {
  const [tapCount, setTapCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <Text testID="m6-status" style={styles.title}>
        M6 React Native direct build fixture
      </Text>
      <Text testID="m6-counter" accessibilityLiveRegion="polite" style={styles.counter}>
        Button taps: {tapCount}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increment test counter"
        testID="m6-increment-button"
        onPress={() => setTapCount((count) => count + 1)}
        style={styles.button}>
        <Text style={styles.buttonText}>Tap to test interaction</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  counter: {
    marginTop: 20,
    marginBottom: 16,
    fontSize: 18,
    color: '#111827',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
