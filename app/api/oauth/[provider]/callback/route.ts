import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "@/lib/api/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROVIDERS = new Set(["meta", "instagram", "x", "threads", "linkedin", "gmail"]);

function fail(request: NextRequest, message: string) {
  const url = new URL("/channels", request.nextUrl.origin);
  url.searchParams.set("oauth", "error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url, 302);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  if (!PROVIDERS.has(provider)) {
    return fail(request, "Unknown OAuth provider");
  }

  const upstream = new URL(`${API_URL}/channels/oauth/${provider}/callback`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  try {
    const res = await fetch(upstream.toString(), {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    const location = res.headers.get("location");
    if (location) {
      return NextResponse.redirect(new URL(location, request.nextUrl.origin), 302);
    }
  } catch {
    return fail(request, "Could not reach the API to finish connect");
  }

  return fail(request, "Connect failed");
}
