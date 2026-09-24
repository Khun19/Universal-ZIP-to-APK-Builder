import 'package:flutter/material.dart';

void main() {
  runApp(const M5FlutterFixtureApp());
}

class M5FlutterFixtureApp extends StatelessWidget {
  const M5FlutterFixtureApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'M5 Flutter Fixture',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: const Scaffold(
        body: Center(child: Text('M5 Flutter direct build fixture')),
      ),
    );
  }
}
