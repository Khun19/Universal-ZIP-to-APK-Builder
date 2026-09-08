import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  FolderGit2,
  PlusCircle,
  Play,
  Download,
  Trash2,
  FileCode2,
  Calendar,
  Layers,
  ChevronRight,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import {
  getStoredProjects,
  saveStoredProjects,
  ProjectItem,
} from '../services/mockData';

export const ProjectsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState('');

  const loadProjects = () => {
    setProjects(getStoredProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this project repository from workspace?')) {
      const updated = projects.filter((p) => p.id !== id);
      setProjects(updated);
      saveStoredProjects(updated);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-accent">
              <FolderGit2 className="w-3.5 h-3.5" />
              Repository Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans mt-0.5">
              Projects
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage uploaded archives, inspected project definitions, and target platforms.
            </p>
          </div>

          <Link
            href="/build/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:brightness-105 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Archive</span>
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-accent"
          />
        </div>

        {/* PROJECTS GRID */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground space-y-3">
            <FolderGit2 className="w-8 h-8 mx-auto stroke-[1.2] opacity-40" />
            <div className="font-semibold text-sm">No projects found</div>
            <p className="text-xs">Upload a ZIP archive to begin inspection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const build = project.latestBuild;
              return (
                <div
                  key={project.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-2xs hover:border-border/90 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                          <FileCode2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground font-sans truncate">
                            {project.name}
                          </h3>
                          <span className="font-mono text-[10px] text-muted-foreground truncate block">
                            {project.filename}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Analysis Badges */}
                    {project.analysis && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                          {project.analysis.projectType}
                        </span>
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                          {project.analysis.strategy}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground px-1.5 py-0.5">
                          API {project.analysis.targetSdk}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Latest Build Status footer */}
                  <div className="pt-3 border-t border-border/70 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground">Latest Build:</span>
                      {build ? (
                        <span className="flex items-center gap-1">
                          {build.status === 'SUCCESS' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> SUCCESS
                            </span>
                          ) : build.status === 'FAILED' ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> FAILED
                            </span>
                          ) : (
                            <span className="text-amber-500 font-bold">{build.status}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/build/${project.id}/analysis`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                      >
                        <span>Inspect</span>
                      </Link>

                      <Link
                        href={`/build/${project.id}/console`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-2xs hover:brightness-105 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Build</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProjectsPage;
