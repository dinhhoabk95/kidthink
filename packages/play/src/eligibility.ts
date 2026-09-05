export interface MasteryEligibilityResult {
  readonly eligible: boolean;
  readonly reason?: string;
}

export function checkMasteryEligibility(params: {
  readonly childProfileId: number | null | bigint;
  readonly isPreview: boolean;
  readonly completionStatus: string;
  readonly levelHasSkills: boolean;
}): MasteryEligibilityResult {
  if (params.childProfileId === null || params.childProfileId === undefined) {
    return {
      eligible: false,
      reason: "BR-PSL-04: Guest session has no child profile",
    };
  }

  if (params.isPreview) {
    return {
      eligible: false,
      reason: "BR-PSL-05: Preview session does not update mastery",
    };
  }

  if (params.completionStatus !== "completed") {
    return { eligible: false, reason: "Session is not completed" };
  }

  if (!params.levelHasSkills) {
    return { eligible: false, reason: "Level has no skills attached" };
  }

  return { eligible: true };
}
