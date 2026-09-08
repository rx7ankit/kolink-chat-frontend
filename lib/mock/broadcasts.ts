import type { ChannelId } from "./channels";
import type { BroadcastStatus, PlatformStatus, PostMode, PostType, PublishPlatformId } from "@/lib/publish";

export type Broadcast = {
  id: string;
  name: string;
  channel: ChannelId;
  platforms: PublishPlatformId[];
  postMode: PostMode;
  postType: PostType;
  body: string;
  mediaUrls: string[];
  audience: string;
  audienceKey: string;
  status: BroadcastStatus;
  platformStatuses: Record<string, PlatformStatus>;
  metrics: Record<string, Record<string, number>>;
  sent: number;
  delivered: number;
  clicked: number;
  at: string;
  createdAt?: string;
  updatedAt?: string;
};

export const broadcasts: Broadcast[] = [];
