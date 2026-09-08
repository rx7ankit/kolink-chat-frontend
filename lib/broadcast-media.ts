import { uploadInboxFile } from "@/lib/api/inbox";
import { detectMediaKind, type PostType, type PublishPlatformId } from "@/lib/publish";

function platformsRequiringMedia(platforms: PublishPlatformId[], postType: PostType): boolean {
  return platforms.some((platform) => {
    if (platform === "threads" || platform === "x" || platform === "linkedin") return false;
    if (postType === "reel") return platform === "instagram" || platform === "tiktok";
    if (postType === "story") return platform === "instagram";
    if (postType === "carousel") return platform === "instagram";
    return platform === "instagram" || platform === "facebook";
  });
}

export function mediaWarningsForPost(
  postType: PostType,
  urls: string[],
  platforms: PublishPlatformId[] = [],
): string[] {
  const warnings: string[] = [];
  const needsMedia = platformsRequiringMedia(platforms, postType);

  if (!urls.length) {
    if (needsMedia) {
      if (postType === "feed" || postType === "carousel") {
        warnings.push("Add at least one image for the selected platforms.");
      }
      if (postType === "reel") {
        warnings.push("Reels require a video file.");
      }
      if (postType === "story") {
        warnings.push("Stories need an image or video.");
      }
    }
    if (platforms.includes("threads") && !platforms.some((p) => p !== "threads")) {
      return warnings;
    }
    return warnings;
  }
  if (postType === "reel") {
    if (urls.some((url) => detectMediaKind(url) !== "video")) {
      warnings.push("Reels require a video (.mp4) — images cannot be published as Reels.");
    }
  }
  if (postType === "carousel") {
    if (urls.length >= 2 && urls.some((url) => detectMediaKind(url) !== "image")) {
      warnings.push("Carousels support images only — use Reel for video.");
    }
    if (urls.length === 1) {
      warnings.push("Only one image — will publish as a single feed post.");
    }
  }
  if (postType === "feed" && urls.some((url) => detectMediaKind(url) === "video")) {
    const needsImageFeed = platforms.some((p) => p === "instagram" || p === "facebook");
    if (needsImageFeed && platforms.includes("threads")) {
      warnings.push(
        "Video will publish to Threads; Instagram and Facebook feed posts need an image — choose Reel for video there.",
      );
    } else if (needsImageFeed) {
      warnings.push("Feed posts use a single image — choose Reel for video.");
    }
  }
  if (urls.some((url) => url.startsWith("data:"))) {
    warnings.push("Uploading media to your server before publish…");
  }
  return warnings;
}

export async function ensurePublicMediaUrl(url: string): Promise<string> {
  if (url.startsWith("https://") || url.startsWith("http://")) {
    return url;
  }
  if (!url.startsWith("data:")) {
    return url;
  }
  const response = await fetch(url);
  const blob = await response.blob();
  const ext = blob.type.split("/")[1]?.split("+")[0] || "jpg";
  const file = new File([blob], `broadcast.${ext}`, { type: blob.type || "image/jpeg" });
  const uploaded = await uploadInboxFile(file);
  return uploaded.url;
}

export async function ensurePublicMediaUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map((url) => ensurePublicMediaUrl(url)));
}

export function aspectForPostType(postType: PostType): number {
  if (postType === "reel" || postType === "story") return 9 / 16;
  return 1;
}
