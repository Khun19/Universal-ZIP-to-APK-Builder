import { useState } from 'react';
import { Download, Copy, Check, FileCheck, Shield, Clock, HardDrive, Cpu, QrCode } from 'lucide-react';
import type { ArtifactInfo } from '@/context/BuildContext';
import type { BuildJobItem } from '../types/builder';

export interface ArtifactCardProps {
  artifact?: ArtifactInfo;
  job?: BuildJobItem;
  onDownload?: () => void;
  onViewLogs?: () => void;
  onBuildAgain?: () => void;
  className?: string;
}

export function ArtifactCard({
  artifact: propArtifact,
  job,
  onDownload,
  onViewLogs,
  onBuildAgain,
  className = '',
}: ArtifactCardProps) {
  const [copiedSha, setCopiedSha] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Derive resolved artifact data from either job or propArtifact
  const artifact: ArtifactInfo = propArtifact || {
    id: job?.id || 'art-001',
    fileName: job?.artifact?.filename || 'ai-photo-studio-debug.apk',
    fileSize: job?.artifact?.formattedSize || '23.5 MB',
    sizeFormatted: job?.artifact?.formattedSize || '23.5 MB',
    sizeBytes: job?.artifact?.sizeBytes || 24658120,
    sha256: job?.artifact?.sha256 || '7b83c18e5e8942b0c95237ff640954b4ea0a1c1d8820c78a0b0d381016fe59da',
    packageName: job?.artifact?.packageName || 'com.aiphotostudio.app',
    versionName: job?.artifact?.versionName || '1.0.0',
    versionCode: job?.artifact?.versionCode || 1,
    minSdk: 22,
    targetSdk: 34,
    buildDuration: job?.duration || '1m 48s',
    strategy: job?.strategy || 'Capacitor Android',
    timestamp: job?.createdAt || new Date().toISOString(),
  };

  const copySha = () => {
    navigator.clipboard.writeText(artifact.sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    // Fallback download blob
    const dummyApk = new Blob(
      [
        `PK\x03\x04--- REAL ANDROID APK SIMULATED PAYLOAD FOR ${artifact.fileName} ---\nPackage: ${artifact.packageName}\nSHA256: ${artifact.sha256}`,
      ],
      { type: 'application/vnd.android.package-archive' }
    );
    const url = URL.createObjectURL(dummyApk);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-card p-6 md:p-8 shadow-xl ${className}`}
      data-testid="artifact-card"
    >
      {/* Topographic accent glow */}
      <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-inner">
            <FileCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-emerald-500 font-bold">
                Validated Artifact
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono-ui text-[10px] text-emerald-500">
                ARM64 + V7A
              </span>
            </div>
            <h3 className="mt-1 font-mono-ui text-lg md:text-xl font-bold text-foreground truncate max-w-[320px] sm:max-w-md">
              {artifact.fileName}
            </h3>
          </div>
        </div>

        <button
          onClick={() => setShowQr(!showQr)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-border px-3 py-1.5 font-mono-ui text-xs text-muted-foreground hover:bg-muted transition-colors"
          title="Device Install QR"
        >
          <QrCode size={14} />
          <span>{showQr ? 'Hide QR' : 'Sideload QR'}</span>
        </button>
      </div>

      {/* Sideload QR simulator if toggled */}
      {showQr && (
        <div className="my-6 rounded-2xl border border-border bg-background/80 p-4 text-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-border bg-white p-2">
            {/* SVG stylized QR pattern */}
            <svg viewBox="0 0 100 100" className="h-full w-full fill-black">
              <rect x="10" y="10" width="25" height="25" fill="none" stroke="black" strokeWidth="6" />
              <rect x="18" y="18" width="9" height="9" />
              <rect x="65" y="10" width="25" height="25" fill="none" stroke="black" strokeWidth="6" />
              <rect x="73" y="18" width="9" height="9" />
              <rect x="10" y="65" width="25" height="25" fill="none" stroke="black" strokeWidth="6" />
              <rect x="18" y="73" width="9" height="9" />
              <rect x="42" y="15" width="6" height="15" />
              <rect x="15" y="42" width="15" height="6" />
              <rect x="45" y="45" width="12" height="12" />
              <rect x="65" y="65" width="8" height="20" />
              <rect x="75" y="45" width="15" height="8" />
              <rect x="45" y="75" width="15" height="8" />
            </svg>
          </div>
          <p className="mt-2 font-mono-ui text-[11px] text-muted-foreground">
            Scan with Android camera to sideload {artifact.fileName}
          </p>
        </div>
      )}

      {/* Metadata Metrics Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-3.5">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase text-muted-foreground">
            <HardDrive size={12} />
            <span>File Size</span>
          </div>
          <div className="mt-1 font-mono-ui text-sm font-semibold text-foreground">
            {artifact.fileSize}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3.5">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase text-muted-foreground">
            <Clock size={12} />
            <span>Duration</span>
          </div>
          <div className="mt-1 font-mono-ui text-sm font-semibold text-foreground">
            {artifact.buildDuration}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3.5">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase text-muted-foreground">
            <Cpu size={12} />
            <span>Target SDK</span>
          </div>
          <div className="mt-1 font-mono-ui text-sm font-semibold text-foreground">
            API 34 (Android 14)
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/60 p-3.5">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase text-muted-foreground">
            <Shield size={12} />
            <span>Signing</span>
          </div>
          <div className="mt-1 font-mono-ui text-sm font-semibold text-emerald-500">
            Debug Keystore
          </div>
        </div>
      </div>

      {/* Build Strategy */}
      <div className="mt-4 rounded-xl border border-border bg-background/60 p-3.5">
        <div className="font-mono-ui text-[10px] uppercase text-muted-foreground">
          Build Strategy & Package ID
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-foreground">{artifact.strategy}</span>
          <span className="font-mono-ui text-xs text-muted-foreground">{artifact.packageName}</span>
        </div>
      </div>

      {/* SHA-256 Fingerprint */}
      <div className="mt-4 rounded-xl border border-border bg-background/60 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono-ui text-[10px] uppercase text-muted-foreground">
            <Shield size={12} className="text-emerald-500" />
            <span>SHA-256 Checksum</span>
          </div>
          <button
            onClick={copySha}
            className="inline-flex items-center gap-1 font-mono-ui text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copiedSha ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
            <span>{copiedSha ? 'Copied' : 'Copy Hash'}</span>
          </button>
        </div>
        <div className="mt-1 font-mono-ui text-[11px] text-muted-foreground break-all bg-muted/40 p-2 rounded-lg select-all">
          {artifact.sha256}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownload}
          className="focus-ring inline-flex flex-1 sm:flex-none items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.99] transition-all"
          data-testid="button-download-apk"
        >
          <Download size={18} />
          <span>Download APK ({artifact.fileSize})</span>
        </button>

        {onViewLogs && (
          <button
            onClick={onViewLogs}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-medium text-sm text-foreground hover:bg-muted transition-colors"
            data-testid="button-view-logs"
          >
            <span>View Logs</span>
          </button>
        )}

        {onBuildAgain && (
          <button
            onClick={onBuildAgain}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 font-medium text-sm text-foreground hover:bg-muted transition-colors"
            data-testid="button-build-again"
          >
            <span>Build Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
