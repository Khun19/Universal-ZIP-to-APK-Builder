import { useState } from 'react';
import { useLocation } from 'wouter';
import { Layers, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { useBuild, type ProjectType } from '@/context/BuildContext';
import { UploadDropzone } from '@/components/UploadDropzone';

export function NewBuildView() {
  const [, setLocation] = useLocation();
  const { startInspection } = useBuild();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartAnalysis = async (
    file: { name: string; size: number },
    projectName?: string,
    preset?: ProjectType
  ) => {
    setIsProcessing(true);
    try {
      const buildId = await startInspection(file, projectName, preset);
      // Navigate to the Inspection screen
      setLocation(`/inspect/${buildId}`);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="new-build-view">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono-ui text-xs font-semibold text-primary">
          <Sparkles size={13} />
          <span>INITIALIZE ANDROID PIPELINE</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Build your Android APK
        </h1>

        <p className="max-w-xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
          Upload your project ZIP and let the Builder inspect and prepare it for Android.
        </p>
      </div>

      {/* Upload Dropzone Container */}
      <UploadDropzone
        onStartAnalysis={handleStartAnalysis}
        isProcessing={isProcessing}
      />

      {/* Security & Processing Notice */}
      <div className="rounded-2xl border border-border bg-card/40 p-5">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono-ui uppercase tracking-wider text-foreground">
              Sandboxed Automated Inspection
            </h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Every archive is decompressed in a transient, isolated virtual environment. The Builder parses Gradle configurations, checks package IDs, validates asset trees, and configures native Android dependencies before launching Gradle tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
