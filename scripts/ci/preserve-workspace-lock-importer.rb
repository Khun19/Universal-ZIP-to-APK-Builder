require "yaml"

old_lock = YAML.load_file("pnpm-lock.before.yaml", aliases: true)
next_lock = YAML.load_file("pnpm-lock.yaml", aliases: true)
m6_key = ".workspace/m6-react-native-direct-integration"
m6_importer = old_lock.fetch("importers", {})[m6_key]
abort("Baseline M6 importer missing; stop rather than inventing it") unless m6_importer

next_lock["importers"] ||= {}
next_lock["packages"] ||= {}
next_lock["snapshots"] ||= {}
next_lock["importers"][m6_key] = m6_importer

(old_lock["packages"] || {}).each do |key, value|
  next_lock["packages"][key] ||= value
end
(old_lock["snapshots"] || {}).each do |key, value|
  next_lock["snapshots"][key] ||= value
end

File.write("pnpm-lock.yaml", YAML.dump(next_lock))
abort("M6 importer was not retained") unless File.read("pnpm-lock.yaml").include?(m6_key)
puts("Retained historical M6 importer and baseline package/snapshot entries; active workspace frozen install is validated separately.")
