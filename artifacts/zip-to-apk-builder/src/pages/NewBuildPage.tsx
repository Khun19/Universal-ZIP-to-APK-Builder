import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  UploadCloud,
  FileArchive,
  Check,
  AlertTriangle,
  ArrowRight,
  X,
  FileCode2,
  ShieldCheck,
  HardDrive,
  Sparkles,
  Loader2,
  Layers,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import {
  getStoredProjects,
  saveStoredProjects,
  ProjectItem,
} from '../services/mockData';

export const NewBuildPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'selected' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFile = (file: File) => {
    if (!file) return;

    // Validate ZIP
    if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
      setUploadState('error');
      setErrorMessage('Please provide a valid .zip archive file.');
      return;
    }

    // Validate size (500 MB max)
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadState('error');
      setErrorMessage('Archive exceeds the 500 MB limit. Please trim unnecessary dependencies.');
      return;
    }

    setSelectedFile(file);
    setUploadState('selected');
    setErrorMessage('');

    // Pre-populate project name from filename
    if (!projectName) {
      const cleanName = file.name
        .replace(/\.zip$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setProjectName(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sampleType: 'capacitor' | 'native' | 'react') => {
    const samples = {
      capacitor: {
        name: 'AI Photo Studio',
        filename: 'ai-photo-studio-mobile.zip',
        size: 42891240,
      },
      native: {
        name: 'Field Notes Android',
        filename: 'field-notes-native.zip',
        size: 28410500,
      },
      react: {
        name: 'Zen Dashboard App',
        filename: 'zen-dashboard-react.zip',
        size: 18250000,
      },
    }[sampleType];

    const fakeFile = new File(['mock content'], samples.filename, {
      type: 'application/zip',
    });
    // Override size property on mock
    Object.defineProperty(fakeFile, 'size', { value: samples.size });

    setSelectedFile(fakeFile);
    setProjectName(samples.name);
    setUploadState('selected');
    setErrorMessage('');
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setUploadState('uploaded');

      // Create new project in persistence
      const newProjectId = `proj-${Date.now().toString(36)}`;
      const newProject: ProjectItem = {
        id: newProjectId,
        name: projectName.trim() || 'Untitled Android App',
        filename: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysis: {
          projectId: newProjectId,
          projectName: projectName.trim() || 'Untitled Android App',
          projectType: selectedFile.name.includes('native') ? 'Native Android' : 'Capacitor',
          confidence: 96,
          strategy: selectedFile.name.includes('native') ? 'Native Gradle' : 'Capacitor Android',
          framework: selectedFile.name.includes('native') ? 'Jetpack Compose' : 'React 19 / Vite',
          language: selectedFile.name.includes('native') ? 'Kotlin' : 'TypeScript',
          buildTool: selectedFile.name.includes('native') ? 'Gradle 8.4' : 'Capacitor Android (Gradle 8.4)',
          packageManager: selectedFile.name.includes('native') ? 'Maven' : 'npm',
          minSdk: 22,
          targetSdk: 34,
          evidence: [
            'Verified ZIP archive structure',
            'Valid project descriptors detected in root',
            'Compilation target compatible with Android SDK API 34',
          ],
          warnings: [],
          blockers: [],
        },
      };

      const existing = getStoredProjects();
      saveStoredProjects([newProject, ...existing]);

      // Route directly to the Analyzing screen!
      setTimeout(() => {
        setLocation(`/build/${newProjectId}/analyzing`);
      }, 400);
    }, 1000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* HERO HEADER */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-semibold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Archive Ingestion
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-sans">
            Build your Android APK
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Upload your project ZIP and let the Builder inspect and prepare it for Android.
          </p>
        </div>

        {/* MAIN UPLOAD CARD */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          {/* Project Name Field */}
          <div>
            <label
              htmlFor="project-name-input"
              className="block font-mono text-[11px] uppercase tracking-wider font-semibold text-foreground mb-1.5"
            >
              Project Name (Optional)
            </label>
            <input
              id="project-name-input"
              type="text"
              placeholder="e.g. AI Photo Studio"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-accent transition-colors"
              data-testid="input-project-name"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A recognizable title for your team in the build history.
            </p>
          </div>

          {/* LARGE DROPZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
              dragOver
                ? 'border-accent bg-accent/10 scale-[1.01]'
                : uploadState === 'selected' || uploadState === 'uploaded'
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : uploadState === 'error'
                ? 'border-rose-500/50 bg-rose-500/5'
                : 'border-border bg-background/50 hover:border-accent/60 hover:bg-muted/40'
            }`}
            data-testid="zip-dropzone"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              data-testid="file-input-zip"
            />

            {/* Visual States */}
            {uploadState === 'uploading' ? (
              <div className="space-y-4 max-w-xs w-full">
                <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto stroke-[1.5]" />
                <div className="space-y-1 text-center">
                  <div className="font-semibold text-sm text-foreground">Uploading and staging archive...</div>
                  <div className="font-mono text-xs text-muted-foreground">{uploadProgress}% complete</div>
                </div>
                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : selectedFile ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileArchive className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-base text-foreground font-mono">{selectedFile.name}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">
                    {formatSize(selectedFile.size)} · Ready for inspection
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setUploadState('idle');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-mono text-rose-500 hover:underline pt-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-bold text-base text-foreground">
                    Drop your ZIP file here or <span className="text-accent underline">browse files</span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">
                    Accepts .ZIP projects · Maximum 500 MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message if any */}
          {uploadState === 'error' && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUPPORTED INFO BADGES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-border bg-background/50 text-center">
              <div className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Format</div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">ZIP Archives</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-background/50 text-center">
              <div className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Max Limit</div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">500 MB</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-background/50 text-center">
              <div className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Inspection</div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">Automated AST</div>
            </div>
            <div className="p-3 rounded-xl border border-border bg-background/50 text-center">
              <div className="font-mono text-[10px] uppercase font-bold text-muted-foreground">Security</div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">Sandbox Isolated</div>
            </div>
          </div>

          {/* SAMPLE TEST PROJECTS PRESETS */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Or try a sample project archive
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectSample('capacitor')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-background hover:bg-muted/70 text-left transition-colors cursor-pointer group"
              >
                <FileCode2 className="w-4 h-4 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-foreground">AI Photo Studio</div>
                  <div className="font-mono text-[10px] text-muted-foreground">Capacitor Android · 42.8 MB</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample('native')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-background hover:bg-muted/70 text-left transition-colors cursor-pointer group"
              >
                <FileCode2 className="w-4 h-4 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-foreground">Field Notes Native</div>
                  <div className="font-mono text-[10px] text-muted-foreground">Kotlin Gradle · 28.4 MB</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample('react')}
                className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-background hover:bg-muted/70 text-left transition-colors cursor-pointer group"
              >
                <FileCode2 className="w-4 h-4 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-foreground">Zen Dashboard</div>
                  <div className="font-mono text-[10px] text-muted-foreground">React / Vite · 18.2 MB</div>
                </div>
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setUploadState('idle');
                setLocation('/dashboard');
              }}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={!selectedFile || uploadState === 'uploading'}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              data-testid="button-analyze-project"
            >
              <span>Analyze Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default NewBuildPage;
