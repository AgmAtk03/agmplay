import { NextResponse } from "next/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function apiOk<T>(data: T, status = 200, cacheSeconds = 15) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...CORS,
      "Cache-Control": `public, max-age=${cacheSeconds}`,
    },
  });
}

export function apiError(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status, headers: CORS },
  );
}

export function apiOptions() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
