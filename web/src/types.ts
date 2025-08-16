export type Platform = "facebook" | "instagram" | "google" | "linkedin";

export interface Campaign {
  _id?: string;
  name: string;
  product: string;
  audience: string;
  budget: number;
  platform: Platform;
  headline?: string;
  description?: string;
  imageUrl?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Tone = "Professional" | "Casual" | "Humorous" | "Urgent" | "Friendly";

export interface GeneratePayload {
  product: string;
  audience: string;
  platform: Platform;
  tone: Tone;
  details?: string;
}

export interface GenerateResult {
  headline: string;
  description: string;
  variants: string[];
  imageUrl: string;
} 