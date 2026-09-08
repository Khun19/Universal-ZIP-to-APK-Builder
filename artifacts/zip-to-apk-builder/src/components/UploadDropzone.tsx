import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, FileArchive, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { ProjectType } from '@/context/BuildContext';

interface UploadDropzoneProps {
  onStartAnalysis: (file: { name: string; size: number }, customName?: string, preset?: ProjectType) => void;
  isProcessing?: boolean;
  className?: string;
}

export function UploadDropzone({ onStartAnalysis, isProcessing = false, className = '' }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [presetType, setPresetType] = useState<ProjectType | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Only standard .ZIP project archives are supported.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('Archive exceeds the 500 MB maximum threshold.');
      return;
    }

    setSelectedFile({ name: file.name, size: file.size });
    if (!projectName) {
      setProjectName(file.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' '));
    }
  };

  const selectSamplePreset = (name: string, sizeMb: number, type: ProjectType) => {
    setSelectedFile({ name: `${name.toLowerCase().replace(/\s+/g, '-')}-project.zip`, size: sizeMb * 1024 * 1024 });
    setProjectName(name);
    setPresetType(type);
    setError(null);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setError('Please select or drag a project ZIP file first.');
      return;
    }
    onStartAnalysis(selectedFile, projectName, presetType);
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setProjectName('');
    setError(null);
    setPresetType(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="upload-dropzone">
      {/* Upload Zone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-300 ${
          dragOver
            ? 'border-primary bg-primary/10 scale-[1.01]'
            : selectedFile
            ? 'border-emerald-500/50 bg-card'
            : 'border-border bg-card/60 hover:border-primary/50 hover:bg-card cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileInput}
          className="hidden"
          data-testid="input-file-upload"
        />

        {/* Dynamic State Display */}
        {selectedFile ? (
          <div className="w-full max-w-lg space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono-ui text-xs font-bold text-emerald-500 uppercase tracking-widest">
                  Archive Ready for Inspection
                </span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-foreground truncate max-w-md mx-auto">
                {selectedFile.name}
              </h3>
              <p className="mt-0.5 font-mono-ui text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)} · Safe isolated sandbox
              </p>
            </div>

            {/* Custom Project Name Field */}
            <div className="pt-2 text-left" onClick={(e) => e.stopPropagation()}>
              <label className="font-mono-ui text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                Project Label (Display Name)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Photo Studio Mobile"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-sans text-sm focus:border-primary focus:outline-none"
              />
            </div>

            {/* Buttons inside selected state */}
            <div className="flex items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={resetSelection}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                disabled={isProcessing}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all"
                data-testid="button-analyze-project"
              >
                <span>{isProcessing ? 'Inspecting Archive...' : 'Analyze Project'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UploadCloud size={32} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground">
                Drop your ZIP file here
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                or <span className="text-primary underline font-medium">browse files</span> from your computer
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-muted-foreground font-mono-ui">
              <span className="flex items-center gap-1.5">
                <FileArchive size={13} className="text-primary" /> ZIP archives
              </span>
              <span>•</span>
              <span>Max 500 MB</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" /> Automated inspection
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-500"
          role="alert"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Test Samples Picker */}
      <div className="rounded-2xl border border-border bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-primary" />
          <span className="font-mono-ui text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Or test with verified project templates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => selectSamplePreset('AI Photo Studio', 28.4, 'Capacitor')}
            className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all text-xs"
          >
            <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-500 mt-0.5">
              <FileArchive size={14} />
            </div>
            <div>
              <div className="font-semibold text-foreground">AI Photo Studio</div>
              <div className="text-[11px] text-muted-foreground font-mono-ui">Capacitor 6 · 28.4 MB</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectSamplePreset('TrailPulse GPS Tracker', 14.2, 'Native Android')}
            className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all text-xs"
          >
            <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500 mt-0.5">
              <FileArchive size={14} />
            </div>
            <div>
              <div className="font-semibold text-foreground">Native Trail GPS</div>
              <div className="text-[11px] text-muted-foreground font-mono-ui">AGP 8.3 · 14.2 MB</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectSamplePreset('Telemetry Sensor Web', 9.1, 'React / Vite')}
            className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-background/60 p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all text-xs"
          >
            <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500 mt-0.5">
              <FileArchive size={14} />
            </div>
            <div>
              <div className="font-semibold text-foreground">Vite Sensor Shell</div>
              <div className="text-[11px] text-muted-foreground font-mono-ui">React 19 · 9.1 MB</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
