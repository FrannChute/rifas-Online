export type FeatureOwner = "admin" | "public" | "system";

export type FeatureStage = "bootstrap" | "planned" | "active";

export type FeatureDefinition = {
  key: string;
  title: string;
  owner: FeatureOwner;
  stage: FeatureStage;
};
