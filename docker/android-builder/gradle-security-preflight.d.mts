export type GradleSecurityFinding = {
  path: string;
  reason: string;
};

export declare function inspectGradleProject(projectRoot: string): {
  projectRoot: string;
  findings: GradleSecurityFinding[];
};

export declare function assertGradleProjectSafe(projectRoot: string): void;
