CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  upload_status text NOT NULL DEFAULT 'PENDING',
  analysis_status text NOT NULL DEFAULT 'PENDING',
  upload_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at);
CREATE TABLE IF NOT EXISTS analysis_results (
  project_id text PRIMARY KEY REFERENCES projects(id),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS build_jobs (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  status text NOT NULL DEFAULT 'QUEUED',
  progress integer NOT NULL DEFAULT 0,
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  artifact_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS build_jobs_project_idx ON build_jobs (project_id);
CREATE TABLE IF NOT EXISTS build_logs (
  id text PRIMARY KEY,
  build_id text NOT NULL REFERENCES build_jobs(id),
  line text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS build_logs_build_idx ON build_logs (build_id, created_at);
CREATE TABLE IF NOT EXISTS artifacts (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  build_job_id text NOT NULL REFERENCES build_jobs(id),
  filename text NOT NULL,
  file_path text NOT NULL,
  size integer NOT NULL,
  sha256 text NOT NULL,
  application_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);