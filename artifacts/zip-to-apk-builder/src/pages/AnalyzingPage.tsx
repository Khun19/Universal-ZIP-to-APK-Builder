import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import {
  Check,
  CircleDot,
  ArrowRight,
  ShieldCheck,
  Search,
  FileCode2,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { BuilderTerrain } from '../components/BuilderTerrain';
import { getStoredProjects, ProjectItem } from '../services/mockData';

interface ActivityStep {
  id: string;
  name: string;
  detail: string;
  status: 'complete' | 'active' | 'pending';
}

export const AnalyzingPage: React.FC = () => {
  const [, params] = useRoute('/build/:id/analyzing');
  const [, setLocation] = useLocation();
  const projectId = params?.id || 'proj-ai-photo-studio';

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Starts at "Inspecting project"
  const [analysisFinished, setAnalysisFinished] = useState(false);

  useEffect(() => {
    const all = getStoredProjects();
    const found = all.find((p) => p.id === projectId) || all[0];
    setProject(found);
  }, [projectId]);

  const steps: ActivityStep[] = [
    {
      id: 'step-1',
      name: 'ZIP archive received',
      detail: 'Staged into secure isolation container',
      status: currentStepIndex > 0 ? 'complete' : currentStepIndex === 0 ? 'active' : 'pending',
    },
    {
      id: 'step-2',
      name: 'File integrity validated',
      detail: 'CRC32 and archive headers verified',
      status: currentStepIndex > 1 ? 'complete' : currentStepIndex === 1 ? 'active' : 'pending',
    },
    {
      id: 'step-3',
      name: 'Inspecting project structure',
      detail: 'Scanning manifest, build configurations, and source tree',
      status: currentStepIndex > 2 ? 'complete' : currentStepIndex === 2 ? 'active' : 'pending',
    },
    {
      id: 'step-4',
      name: 'Detecting project type & toolchain',
      detail: 'Evaluating native vs hybrid vs web build strategies',
      status: currentStepIndex > 3 ? 'complete' : currentStepIndex === 3 ? 'active' : 'pending',
    },
    {
      id: 'step-5',
      name: 'Compatibility scoring',
      detail: 'Auditing API targets, SDK compatibility, and permissions',
      status: currentStepIndex > 4 ? 'complete' : currentStepIndex === 4 ? 'active' : 'pending',
    },
  ];

  // Auto-progress through the inspection phases for a live realistic experience
  useEffect(() => {
    if (currentStepIndex < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setAnalysisFinished(true);
      // Auto-navigate to the Project Analysis screen after a short celebration pause
      const navTimer = setTimeout(() => {
        setLocation(`/build/${projectId}/analysis`);
      }, 1800);
      return () => clearTimeout(navTimer);
    }
  }, [currentStepIndex, projectId, setLocation, steps.length]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-[10px] font-semibold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            Inspection Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
            {project ? project.name : 'Project Inspection'}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {project?.filename || 'archive.zip'}
          </p>
        </div>

        {/* HERO TOPOGRAPHIC TERRAIN VISUALIZATION */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
          <BuilderTerrain
            state={analysisFinished ? 'SUCCESS' : 'ANALYZING'}
            size="lg"
            centerTitle={analysisFinished ? 'INSPECTED' : 'ANALYZING'}
            centerSubtitle={
              analysisFinished
                ? 'Strategy resolved: Capacitor Android'
                : 'Inspecting project structure'
            }
          />

          {analysisFinished && (
            <div className="mt-4 animate-fade-in text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
                Compatibility Analysis Complete
              </span>
            </div>
          )}
        </div>

        {/* BUILDER ACTIVITY CHECKLIST */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="font-bold text-sm text-foreground font-sans">Builder Activity Stream</h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Phase {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {steps.map((step) => {
              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                    step.status === 'active'
                      ? 'bg-accent/10 border border-accent/20'
                      : 'hover:bg-muted/40'
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'complete' ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    ) : step.status === 'active' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-border bg-muted flex items-center justify-center text-muted-foreground">
                        <CircleDot className="w-3 h-3 opacity-40" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          step.status === 'complete'
                            ? 'text-foreground'
                            : step.status === 'active'
                            ? 'text-accent font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.name}
                      </span>
                      {step.status === 'active' && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-accent font-bold px-1.5 py-0.5 rounded-sm bg-accent/15">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Skip or Direct Link */}
          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              Automated deep inspection takes approx. 5 seconds
            </span>
            <Link
              href={`/build/${projectId}/analysis`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:brightness-105 transition-all"
            >
              <span>View Analysis Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default AnalyzingPage;
