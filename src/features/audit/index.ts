import type { FeatureDefinition } from "@/features/feature-types";

export const auditFeature = {
  key: "audit",
  title: "Auditoria",
  owner: "system",
  stage: "bootstrap",
} satisfies FeatureDefinition;
