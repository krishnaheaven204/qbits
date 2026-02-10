import { NextResponse } from "next/server";

const normalizeApiBase = (input) => {
  if (!input) return "";
  let base = input.trim();
  const queryIndex = base.indexOf("?");
  if (queryIndex !== -1) base = base.substring(0, queryIndex);
  base = base.replace(/\/client\/index\/?$/i, "");
  base = base.replace(/\/client\/?$/i, "");
  base = base.replace(/\/$/, "");
  return base;
};

const API_BASE_ROOT = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);

const proxyUpstream = async (request, method) => {
  const token = request.headers.get("authorization");

  if (!API_BASE_ROOT) {
    return NextResponse.json(
      { success: false, error: "API base URL is not configured" },
      { status: 500 }
    );
  }

  const endpointsToTry = [
    `${API_BASE_ROOT}/client/run-inverter-command`,
    `${API_BASE_ROOT}/run-inverter-command`,
  ];

  let body = undefined;
  const contentType = request.headers.get("content-type");
  if (method !== "GET") {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  let lastErrorText = "";

  for (const url of endpointsToTry) {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = token;
      }

      if (contentType && method !== "GET") {
        headers["Content-Type"] = contentType;
      }

      const resp = await fetch(url, {
        method,
        headers,
        body: method === "GET" ? undefined : body,
        cache: "no-store",
      });

      if (resp.status === 405 && method !== "GET") {
        const retry = await fetch(url, {
          method: "GET",
          headers,
          cache: "no-store",
        });

        if (!retry.ok) {
          let retryText = "";
          try {
            retryText = await retry.text();
          } catch {
            retryText = "";
          }
          lastErrorText = `Upstream failed (${retry.status}): ${retryText || retry.statusText}`;
          continue;
        }

        const retryType = retry.headers.get("content-type") || "";
        if (retryType.includes("application/json")) {
          const data = await retry.json();
          return NextResponse.json(data, { status: 200 });
        }

        let text = "";
        try {
          text = await retry.text();
        } catch {
          text = "";
        }
        return NextResponse.json({ success: true, data: text }, { status: 200 });
      }

      if (!resp.ok) {
        let bodyText = "";
        try {
          bodyText = await resp.text();
        } catch {
          bodyText = "";
        }
        lastErrorText = `Upstream failed (${resp.status}): ${bodyText || resp.statusText}`;
        continue;
      }

      const upstreamType = resp.headers.get("content-type") || "";
      if (upstreamType.includes("application/json")) {
        const data = await resp.json();
        return NextResponse.json(data, { status: 200 });
      }

      let text = "";
      try {
        text = await resp.text();
      } catch {
        text = "";
      }
      return NextResponse.json({ success: true, data: text }, { status: 200 });
    } catch (e) {
      lastErrorText = e?.message || String(e);
    }
  }

  return NextResponse.json(
    { success: false, error: lastErrorText || "Upstream request failed" },
    { status: 502 }
  );
};

export async function GET(request) {
  return proxyUpstream(request, "GET");
}

export async function POST(request) {
  return proxyUpstream(request, "POST");
}
