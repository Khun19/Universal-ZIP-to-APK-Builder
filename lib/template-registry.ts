import * as fs from 'fs';
import * as path from 'path';

export interface TemplateMetadata {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  framework: string;
  buildStrategy: string;
  requiredTools: string[];
  path: string;
}

const registryPath = path.join(process.cwd(), 'templates', 'registry.json');

function readRegistryRaw(): any {
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Template registry not found at ${registryPath}`);
  }
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse template registry: ${e?.message || e}`);
  }
}

export function loadRegistry(): TemplateMetadata[] {
  const data = readRegistryRaw();
  if (!data || !Array.isArray(data.templates)) {
    throw new Error('Invalid template registry format: expected { templates: [...] }');
  }

  const templates: TemplateMetadata[] = data.templates.map((t: any) => {
    if (
      !t.id ||
      !t.name ||
      !t.version ||
      !t.category ||
      !t.description ||
      !t.framework ||
      !t.buildStrategy ||
      !t.path
    ) {
      throw new Error(`Malformed template entry: ${JSON.stringify(t)}`);
    }
    return {
      id: String(t.id),
      name: String(t.name),
      version: String(t.version),
      category: String(t.category),
      description: String(t.description),
      framework: String(t.framework),
      buildStrategy: String(t.buildStrategy),
      requiredTools: Array.isArray(t.requiredTools) ? t.requiredTools.map(String) : [],
      path: String(t.path),
    } as TemplateMetadata;
  });

  return templates;
}

export function listTemplates(): TemplateMetadata[] {
  return loadRegistry();
}

export function getTemplate(id: string): TemplateMetadata | null {
  if (!validateTemplateId(id)) return null;
  const templates = loadRegistry();
  return templates.find((t) => t.id === id) || null;
}

export function validateTemplateId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (id.length > 64) return false;
  return /^[a-z0-9\-_]+$/.test(id);
}
