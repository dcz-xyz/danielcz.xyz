/** Project tags and the names of interactive demos. Shared by the content schema and the UI. */
export const PROJECT_TAGS = ['research', 'not-research'] as const;
export type ProjectTag = (typeof PROJECT_TAGS)[number];

export const TAG_LABELS: Record<ProjectTag, string> = {
  research: 'Research',
  'not-research': 'Not Research',
};

export const DEMOS = ['MoireExplorer'] as const;
