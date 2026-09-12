import * as fs from 'fs';
import * as path from 'path';

export interface FlutterCapabilities {
  gps: boolean; camera: boolean; maps: boolean; network: boolean; storage: boolean;
  notifications: boolean; firebase: boolean; supabase: boolean;
  permissions: string[]; evidence: string[]; warnings: string[];
}

function readIfExists(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

export function analyzeFlutterCapabilities(projectPath: string): FlutterCapabilities {
  const pubspec = readIfExists(path.join(projectPath, 'pubspec.yaml'));
  const manifest = readIfExists(path.join(projectPath, 'android/app/src/main/AndroidManifest.xml'));
  const has = (...names: string[]) => names.some((name) => new RegExp(`^\\s*${name}\\s*:`, 'm').test(pubspec) || pubspec.includes(` ${name}:`));
  const permissions = [...manifest.matchAll(/android:name=["'](android\.permission\.[A-Z_]+)["']/g)].map((m) => m[1]);
  const gps = has('geolocator', 'location', 'permission_handler') || permissions.some((p) => /ACCESS_(FINE|COARSE)_LOCATION$/.test(p));
  const camera = has('camera', 'mobile_scanner', 'qr_code_scanner', 'permission_handler') || permissions.includes('android.permission.CAMERA');
  const maps = has('google_maps_flutter', 'flutter_map', 'mapbox_maps_flutter') || /google_maps|mapbox|MAPS_API_KEY/i.test(manifest);
  const network = has('http', 'dio', 'chopper') || permissions.includes('android.permission.INTERNET');
  const storage = has('path_provider', 'shared_preferences', 'hive', 'sqflite', 'isar');
  const notifications = has('firebase_messaging', 'flutter_local_notifications') || permissions.includes('android.permission.POST_NOTIFICATIONS');
  const firebase = has('firebase_core', 'firebase_auth', 'cloud_firestore', 'firebase_messaging') || fs.existsSync(path.join(projectPath, 'android/app/google-services.json')) || fs.existsSync(path.join(projectPath, 'lib/firebase_options.dart'));
  const supabase = has('supabase_flutter') || fs.existsSync(path.join(projectPath, 'supabase', 'config.toml'));
  const evidence: string[] = [];
  if (gps) evidence.push('GPS/location capability detected');
  if (camera) evidence.push('Camera capability detected');
  if (maps) evidence.push('Maps capability detected');
  if (network) evidence.push('Network capability detected');
  if (storage) evidence.push('Local storage capability detected');
  if (notifications) evidence.push('Notification capability detected');
  if (firebase) evidence.push('Firebase integration detected');
  if (supabase) evidence.push('Supabase integration detected');
  const warnings: string[] = [];
  if (maps && !/MAPS_API_KEY|com\.google\.android\.geo\.API_KEY/i.test(manifest)) warnings.push('Maps detected but no Android Maps API key metadata was found; secrets are never injected automatically.');
  if (gps && !permissions.some((p) => /ACCESS_(FINE|COARSE)_LOCATION$/.test(p))) warnings.push('GPS package detected but Android location permissions were not found.');
  if (camera && !permissions.includes('android.permission.CAMERA')) warnings.push('Camera package detected but CAMERA permission was not found.');
  return { gps, camera, maps, network, storage, notifications, firebase, supabase, permissions, evidence, warnings };
}
