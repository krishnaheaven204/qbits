export async function POST(req) {
  try {
    const token = req.headers.get("authorization") || "";
    const body = await req.text();

    const upstreamResp = await fetch(
      "https://qbits.quickestimate.co/api/v1/frontend/create-plant",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body,
        cache: "no-store",
      }
    );

    const contentType = upstreamResp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const respBody = isJson ? await upstreamResp.json() : await upstreamResp.text();

    return new Response(isJson ? JSON.stringify(respBody) : respBody, {
      status: upstreamResp.status,
      headers: {
        "Content-Type": isJson ? "application/json" : "text/plain",
      },
    });
  } catch (err) {
    return Response.json(
      {
        status: 500,
        data: null,
        error: err?.message || "Proxy error",
      },
      { status: 500 }
    );
  }
}
