import * as fs from 'fs';
import * as path from 'path';
import { getTemplate, validateTemplateId, TemplateMetadata } from './template-registry';

export interface GenerateOptions {
  projectName: string;
  appName?: string;
  packageName?: string;
}

export interface GenerateResult {
  success: boolean;
  projectPath?: string;
  filePaths?: string[];
  error?: string;
}

function sanitizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') throw new Error('projectName is required');
  if (name.includes('/') || name.includes('\\')) throw new Error('Invalid projectName (contains path separators)');
  const trimmed = name.trim();
  if (!/^[a-zA-Z0-9\-\_ ]{1,80}$/.test(trimmed)) throw new Error('Invalid projectName (only letters, numbers, space, -, _ allowed)');
  return trimmed;
}

function validatePackageName(p?: string): boolean {
  if (!p) return true; // optional
  const segments = p.split('.');
  if (segments.length < 2) return false;
  return segments.every(s => /^[a-z][a-z0-9_]*$/.test(s));
}

function isTextFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.html', '.htm', '.js', '.ts', '.json', '.css', '.xml', '.gradle', '.properties', '.txt', '.md', '.jsx', '.tsx'].includes(ext) || !ext;
}

function replaceVariablesInFile(srcPath: string, destPath: string, vars: Record<string,string>) {
  const content = fs.readFileSync(srcPath, 'utf8');
  let out = content;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  fs.writeFileSync(destPath, out, 'utf8');
}

export async function generateFromTemplate(templateId: string, opts: GenerateOptions): Promise<GenerateResult> {
  try {
    if (!validateTemplateId(templateId)) return { success: false, error: 'Invalid template id' };
    const tmpl = getTemplate(templateId);
    if (!tmpl) return { success: false, error: 'Unknown template id' };

    const safeName = sanitizeProjectName(opts.projectName);
    if (!validatePackageName(opts.packageName)) return { success: false, error: 'Invalid package name' };

    const workspaceRoot = path.resolve(process.cwd(), '.workspace');
    fs.mkdirSync(workspaceRoot, { recursive: true });

    const now = Date.now();
    const genDir = path.join(workspaceRoot, `template-${templateId}-${now}-${safeName.replace(/\s+/g, '-')}`);
    fs.mkdirSync(genDir, { recursive: true });

    const templatePath = path.resolve(process.cwd(), tmpl.path);
    if (!fs.existsSync(templatePath)) return { success: false, error: 'Template files missing on disk' };

    const vars: Record<string,string> = {
      PROJECT_NAME: safeName,
      APP_NAME: opts.appName || safeName,
      PACKAGE_NAME: opts.packageName || ''
    };

    function copyRec(srcDir: string, destDir: string) {
      const entries = fs.readdirSync(srcDir, { withFileTypes: true });
      fs.mkdirSync(destDir, { recursive: true });
      for (const ent of entries) {
        if (ent.name.includes('..')) throw new Error('Template contains unsafe file names');
        const src = path.join(srcDir, ent.name);
        const dest = path.join(destDir, ent.name);
        const resolved = path.resolve(dest);
        if (!resolved.startsWith(path.resolve(genDir) + path.sep)) throw new Error('Path traversal attempt blocked');
        if (ent.isDirectory()) {
          copyRec(src, dest);
        } else if (ent.isFile()) {
          if (isTextFile(ent.name)) {
            replaceVariablesInFile(src, dest, vars);
          } else {
            fs.copyFileSync(src, dest);
          }
        }
      }
    }

    copyRec(templatePath, genDir);

    const filePaths: string[] = [];
    function collect(p: string) {
      const entries = fs.readdirSync(p, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(p, e.name);
        if (e.isDirectory()) collect(full);
        else filePaths.push(full);
      }
    }
    collect(genDir);

    return { success: true, projectPath: genDir, filePaths };
  } catch (err: any) {
    return { success: false, error: String(err?.message || err) };
  }
}
