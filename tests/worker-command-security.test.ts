import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFlutterInvocation } from '../lib/worker.ts';

test('Flutter native invocation keeps project paths as discrete arguments', () => {
  const maliciousPath = "/tmp/project with spaces/$(touch /tmp/m6-pwned);`echo pwned`";
  const invocation = buildFlutterInvocation(
    {
      mode: 'native',
      commandPrefix: 'flutter',
      displayCommand: 'flutter',
    },
    maliciousPath,
    ['create', '-t', 'app', '--platforms=android', maliciousPath],
  );

  assert.equal(invocation.file, 'flutter');
  assert.deepEqual(invocation.args, [
    'create',
    '-t',
    'app',
    '--platforms=android',
    maliciousPath,
  ]);
});

test('Flutter Ubuntu PRoot invocation does not interpolate project paths into the shell script', () => {
  const maliciousPath = "/tmp/project with spaces/$(touch /tmp/m6-pwned);`echo pwned`";
  const invocation = buildFlutterInvocation(
    {
      mode: 'ubuntu-proot',
      commandPrefix: 'proot-distro',
      displayCommand: 'proot-distro login ubuntu -- /opt/flutter/bin/flutter',
      prootDistro: 'ubuntu',
      prootFlutter: '/opt/flutter/bin/flutter',
    },
    maliciousPath,
    ['create', '-t', 'app', '--platforms=android', maliciousPath],
  );

  assert.equal(invocation.file, 'proot-distro');
  assert.equal(invocation.args[0], 'login');
  assert.equal(invocation.args[1], 'ubuntu');
  assert.equal(invocation.args[2], '--');
  assert.equal(invocation.args[3], 'sh');
  assert.equal(invocation.args[4], '-lc');
  assert.match(invocation.args[5], /cd -- "\$1"/);
  assert.doesNotMatch(invocation.args[5], /m6-pwned/);
  assert.equal(invocation.args[7], maliciousPath);
  assert.equal(invocation.args[8], '/opt/flutter/bin/flutter');
  assert.equal(invocation.args.at(-1), maliciousPath);
});
