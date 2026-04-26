export type UploadPolicyRiskDecision =
  | {
      isHighConfidenceRisk: false;
      reason: null;
      adminNote: null;
    }
  | {
      isHighConfidenceRisk: true;
      reason: "sexual_adult_unsafe";
      adminNote: string;
    };

interface UploadedReelPolicyInput {
  caption: string;
  originalFileName?: string | null;
  reelVideoPath: string;
  title: string;
}

const HIGH_RISK_TERMS = [
  "explicit sex",
  "hardcore porn",
  "sexual assault",
  "child sexual",
  "gore",
  "terrorist",
];

export async function checkUploadedReelForPolicyRisk(
  input: UploadedReelPolicyInput,
): Promise<UploadPolicyRiskDecision> {
  const searchableText = [
    input.title,
    input.caption,
    input.originalFileName ?? "",
    input.reelVideoPath,
  ].join(" ").toLowerCase();

  const matchedTerm = HIGH_RISK_TERMS.find((term) => searchableText.includes(term));

  if (!matchedTerm) {
    return {
      adminNote: null,
      isHighConfidenceRisk: false,
      reason: null,
    };
  }

  return {
    adminNote: `Placeholder upload policy check matched high-risk term: ${matchedTerm}`,
    isHighConfidenceRisk: true,
    reason: "sexual_adult_unsafe",
  };
}
