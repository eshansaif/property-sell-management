/** fetch() that never throws: network failures come back as a 503 Response with a readable error. */
export async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    return new Response(JSON.stringify({ error: "Network error. Please check your connection and try again." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function readError(res: Response, fallback = "Something went wrong. Please try again."): Promise<string> {
  try {
    const d = await res.json();
    return d?.error ?? fallback;
  } catch {
    return fallback;
  }
}
