import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 12000;

function isPrivateIp(ip: string) {
  const value = ip.toLowerCase().replace(/^::ffff:/, "");
  if (value === "127.0.0.1" || value === "::1" || value === "0.0.0.0") return true;
  const parts = value.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part))) {
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80")) return true;
  return false;
}

function isBlockedHost(hostname: string) {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "metadata.google.internal" || host.endsWith(".internal")) return true;
  if (isIP(host) && isPrivateIp(host)) return true;
  return false;
}

async function assertPublicUrl(raw: string) {
  const parsed = new URL(raw);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("unsupported protocol");
  }
  if (parsed.username || parsed.password) {
    throw new Error("credentials not allowed");
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error("blocked host");
  }
  const records = await lookup(parsed.hostname, { all: true });
  if (!records.length || records.some((row) => isPrivateIp(row.address))) {
    throw new Error("blocked address");
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") || "";
  let current = raw;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const parsed = await assertPublicUrl(current);
      const upstream = await fetch(parsed.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      });

      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get("location");
        if (!location) return new NextResponse("Redirect missing location", { status: 400 });
        current = new URL(location, parsed).toString();
        continue;
      }

      if (!upstream.ok) {
        return new NextResponse("Image unavailable", { status: 502 });
      }

      const contentType = (upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (contentType && !contentType.startsWith("image/")) {
        return new NextResponse("Not an image", { status: 415 });
      }

      const bytes = Buffer.from(await upstream.arrayBuffer());
      if (!bytes.length || bytes.length > MAX_BYTES) {
        return new NextResponse("Image too large", { status: 400 });
      }

      return new NextResponse(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": contentType || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
    return new NextResponse("Too many redirects", { status: 400 });
  } catch {
    return new NextResponse("Could not load image", { status: 400 });
  }
}
