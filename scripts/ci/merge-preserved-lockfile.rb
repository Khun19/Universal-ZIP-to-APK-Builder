require "json"
require "yaml"

old_lock = YAML.load_file("pnpm-lock.before.yaml", aliases: true)
next_lock = YAML.load_file("pnpm-lock.yaml", aliases: true)
m6_key = ".workspace/m6-react-native-direct-integration"
m6_importer = old_lock.fetch("importers", {})[m6_key]
abort("Protected M6 importer missing from baseline lockfile") unless m6_importer

next_lock["importers"] ||= {}
next_lock["packages"] ||= {}
next_lock["snapshots"] ||= {}
next_lock["importers"][m6_key] = m6_importer

def references_old_esbuild(value)
  serialized = JSON.generate(value)
  serialized.include?("esbuild@0.27.3") || serialized.match?(/"esbuild"\s*:\s*"0\.27\.3"/)
end

(old_lock["packages"] || {}).each do |key, value|
  next if key.start_with?("esbuild@0.27.3") || references_old_esbuild(value)
  next_lock["packages"][key] ||= value
end

(old_lock["snapshots"] || {}).each do |key, value|
  next if key.include?("esbuild@0.27.3") || references_old_esbuild(value)
  next_lock["snapshots"][key] ||= value
end

def snapshot_for(snapshots, name, version)
  exact = "#{name}@#{version}"
  return exact if snapshots.key?(exact)
  normalized = version.to_s.split("(").first
  prefix = "#{name}@#{normalized}"
  snapshots.keys.find { |key| key == prefix || key.start_with?("#{prefix}(") }
end

pending = []
%w[dependencies devDependencies optionalDependencies].each do |section|
  (m6_importer[section] || {}).each do |name, spec|
    version = spec["version"]
    pending << [name, version] if version && !version.match?(/\A(link:|workspace:|file:)/)
  end
end

visited = {}
until pending.empty?
  name, version = pending.pop
  key = snapshot_for(next_lock["snapshots"], name, version)
  abort("M6 dependency snapshot missing after merge: #{name}@#{version}") unless key
  next if visited[key]
  visited[key] = true
  snapshot = next_lock["snapshots"][key]
  %w[dependencies optionalDependencies].each do |section|
    (snapshot[section] || {}).each do |child_name, child_version|
      next if child_version.to_s.match?(/\A(link:|workspace:|file:)/)
      pending << [child_name, child_version]
    end
  end
end

output = YAML.dump(next_lock)
if output.include?("esbuild@0.27.3") || output.match?(/esbuild:\s*0\.27\.3/) || output.match?(/"esbuild"\s*:\s*"0\.27\.3"/)
  abort("Vulnerable esbuild 0.27.3 reference remains in lockfile")
end
abort("Patched esbuild override 0.28.1 missing from lockfile") unless output.match?(/esbuild:\s*0\.28\.1/)
File.write("pnpm-lock.yaml", output)
puts("Preserved #{m6_key}; validated #{visited.length} reachable M6 dependency snapshots; removed all esbuild 0.27.3 references.")
