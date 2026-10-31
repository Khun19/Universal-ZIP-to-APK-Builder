import { readFile, writeFile } from "node:fs/promises";
import YAML from "yaml";

const oldLock = YAML.parse(await readFile("pnpm-lock.before.yaml", "utf8"));
const nextLock = YAML.parse(await readFile("pnpm-lock.yaml", "utf8"));
const m6Key = ".workspace/m6-react-native-direct-integration";
const m6Importer = oldLock.importers?.[m6Key];
if (!m6Importer) throw new Error(`Protected M6 importer missing from baseline lockfile: ${m6Key}`);

nextLock.importers ??= {};
nextLock.packages ??= {};
nextLock.snapshots ??= {};
nextLock.importers[m6Key] = m6Importer;

const referencesPatchedEsbuild = value => {
  const serialized = JSON.stringify(value);
  return serialized.includes("esbuild@0.27.3") || /"esbuild"\\s*:\\s*"0\\.27\\.3"/.test(serialized);
};
for (const [key, value] of Object.entries(oldLock.packages || {})) {
  if (key.startsWith("esbuild@0.27.3") || referencesPatchedEsbuild(value)) continue;
  if (!(key in nextLock.packages)) nextLock.packages[key] = value;
}
for (const [key, value] of Object.entries(oldLock.snapshots || {})) {
  if (key.includes("esbuild@0.27.3") || referencesPatchedEsbuild(value)) continue;
  if (!(key in nextLock.snapshots)) nextLock.snapshots[key] = value;
}

function snapshotFor(name, version) {
  const normalized = String(version).split("(")[0];
  const exact = `${name}@${version}`;
  if (nextLock.snapshots[exact]) return exact;
  const prefix = `${name}@${normalized}`;
  return Object.keys(nextLock.snapshots).find(key => key === prefix || key.startsWith(prefix + "("));
}
const pending = [];
for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
  for (const [name, spec] of Object.entries(m6Importer[section] || {})) {
    if (spec.version && !/^(link:|workspace:|file:)/.test(spec.version)) pending.push([name, spec.version]);
  }
}
const visited = new Set();
while (pending.length) {
  const [name, version] = pending.pop();
  const key = snapshotFor(name, version);
  if (!key) throw new Error(`M6 lockfile dependency snapshot missing after safe merge: ${name}@${version}`);
  if (visited.has(key)) continue;
  visited.add(key);
  const snapshot = nextLock.snapshots[key];
  for (const section of ["dependencies", "optionalDependencies"]) {
    for (const [childName, childVersion] of Object.entries(snapshot[section] || {})) {
      if (!/^(link:|workspace:|file:)/.test(String(childVersion))) pending.push([childName, childVersion]);
    }
  }
}
const output = YAML.stringify(nextLock, { lineWidth: 0 });
if (output.includes("esbuild@0.27.3") || /esbuild:\\s*0\\.27\\.3/.test(output) || /"esbuild"\\s*:\\s*"0\\.27\\.3"/.test(output)) {
  throw new Error("Vulnerable esbuild 0.27.3 reference remains in regenerated lockfile.");
}
if (!output.includes("esbuild: 0.28.1")) throw new Error("Patched esbuild override 0.28.1 missing from lockfile.");
await writeFile("pnpm-lock.yaml", output, "utf8");
console.log(`Preserved ${m6Key}; validated ${visited.size} reachable M6 dependency snapshots; removed all esbuild 0.27.3 references.`);
