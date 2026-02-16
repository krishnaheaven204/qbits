export async function POST(req) {
  try {
    const token = req.headers.get("authorization") || "";
    const body = await req.text();

    if (!body) {
      return Response.json(
        { status: 400, data: null, error: "Empty request body" },
        { status: 400 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return Response.json(
        {
          status: 400,
          data: null,
          error: "Invalid JSON body",
        },
        { status: 400 }
      );
    }

    const serial = String(parsed?.serial ?? "").trim();
    const plantIdRaw = parsed?.plantId ?? parsed?.pid;
    const plantId =
      plantIdRaw === null || plantIdRaw === undefined || plantIdRaw === ""
        ? null
        : Number(plantIdRaw);

    if (!serial) {
      return Response.json(
        { status: 400, data: null, error: "Missing serial" },
        { status: 400 }
      );
    }

    const upstreamPayload = {
      ...parsed,
      serial,
      ...(plantId !== null && !Number.isNaN(plantId) ? { plantId } : {}),
    };

    let upstreamResp;
    try {
      upstreamResp = await fetch(
        "https://qbits.quickestimate.co/api/v1/frontend/add-collector",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: token } : {}),
          },
          body: JSON.stringify(upstreamPayload),
          cache: "no-store",
        }
      );
    } catch (fetchErr) {
      return Response.json(
        {
          status: 502,
          data: null,
          error: fetchErr?.message || "Upstream fetch failed",
        },
        { status: 502 }
      );
    }

    const contentType = upstreamResp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const rawText = await upstreamResp.text();
    let respBody = rawText;

    if (isJson) {
      try {
        respBody = rawText ? JSON.parse(rawText) : null;
      } catch {
        respBody = rawText;
      }
    }

    return new Response(isJson ? JSON.stringify(respBody) : String(respBody ?? ""), {
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
