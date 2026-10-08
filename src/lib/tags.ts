/** Project tags and the names of interactive demos. Shared by the content schema and the UI. */
export const PROJECT_TAGS = ['research', 'independent'] as const;
export type ProjectTag = (typeof PROJECT_TAGS)[number];

export const TAG_LABELS: Record<ProjectTag, string> = {
  research: 'Research',
  independent: 'Independent',
};

export const DEMOS = ['MoireExplorer'] as const;
