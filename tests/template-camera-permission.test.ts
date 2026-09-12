import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

test('Android WebView wrapper declares and auto-requests camera permission', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'lib', 'template.ts'), 'utf8');

  assert.match(source, /android\.permission\.CAMERA/);
  assert.match(source, /requestPermissions\(new String\[\]\{Manifest\.permission\.CAMERA\}/);
  assert.match(source, /onPermissionRequest\(final PermissionRequest request\)/);
  assert.match(source, /PermissionRequest\.RESOURCE_VIDEO_CAPTURE/);
  assert.match(source, /onRequestPermissionsResult\(int requestCode/);
  assert.match(source, /pendingWebPermissionRequest\.grant/);
  assert.match(source, /pendingWebPermissionRequest\.deny/);
});
