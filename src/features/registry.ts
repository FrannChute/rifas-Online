import { adminFeature } from "@/features/admin";
import { auditFeature } from "@/features/audit";
import { authFeature } from "@/features/auth";
import { drawsFeature } from "@/features/draws";
import type { FeatureDefinition } from "@/features/feature-types";
import { ordersFeature } from "@/features/orders";
import { participantsFeature } from "@/features/participants";
import { paymentsFeature } from "@/features/payments";
import { prizesFeature } from "@/features/prizes";
import { rafflesFeature } from "@/features/raffles";
import { ticketsFeature } from "@/features/tickets";

export const features = [
  authFeature,
  adminFeature,
  rafflesFeature,
  ticketsFeature,
  ordersFeature,
  paymentsFeature,
  participantsFeature,
  prizesFeature,
  drawsFeature,
  auditFeature,
] satisfies FeatureDefinition[];
