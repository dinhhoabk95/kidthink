/**
 * Spec sở hữu: content-versioning.md §7.4 & BR-VER-05
 */

export interface PlaySessionVersionAnchor {
  entityId: number;
  contentVersion: number;
  startedAt: Date;
}

export interface VersionChangeMilestone {
  entityId: number;
  previousVersion: number;
  newVersion: number;
  changedAt: Date;
}

export function getVersionChangeMilestones(
  sessions: PlaySessionVersionAnchor[]
): VersionChangeMilestone[] {
  if (sessions.length < 2) {
    return [];
  }

  // Sort sessions chronologically by startedAt
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  const milestones: VersionChangeMilestone[] = [];
  const first = sorted[0];
  if (!first) {
    return [];
  }
  let currentVersion = first.contentVersion;

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    if (s && s.contentVersion !== currentVersion) {
      milestones.push({
        entityId: s.entityId,
        previousVersion: currentVersion,
        newVersion: s.contentVersion,
        changedAt: new Date(s.startedAt),
      });
      currentVersion = s.contentVersion;
    }
  }

  return milestones;
}
