export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/* All calls go to the same origin. The X-Requested-With header is what the server checks to block cross-site form posts. */
export async function api(method, path, body) {
  let res;
  try {
    res = await fetch("/api" + path, {
      method, credentials: "same-origin", keepalive: method !== "GET" && body !== undefined && JSON.stringify(body).length < 60000,
      headers: Object.assign({ "X-Requested-With": "osi" }, body !== undefined ? { "Content-Type": "application/json" } : {}),
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (e) { throw new ApiError(0, "You seem to be offline. Check your connection and try again."); }
  let data = null;
  if ((res.headers.get("content-type") || "").includes("json")) data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login" && path !== "/auth/me" && path !== "/auth/password") window.dispatchEvent(new Event("osi-unauth"));
    throw new ApiError(res.status, (data && data.error) || "Something went wrong. Try again.");
  }
  return data;
}
