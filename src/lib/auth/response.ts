type ScrubResult = { value: unknown; changed: boolean };

function scrubInternalEmails(value: unknown): ScrubResult {
  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const result = scrubInternalEmails(item);
      changed ||= result.changed;
      return result.value;
    });
    return { value: items, changed };
  }

  if (!value || typeof value !== "object") return { value, changed: false };

  let changed = false;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "email" && typeof item === "string" && item.endsWith("@auth.invalid")) {
      changed = true;
      continue;
    }
    const scrubbed = scrubInternalEmails(item);
    result[key] = scrubbed.value;
    changed ||= scrubbed.changed;
  }
  return { value: result, changed };
}

export async function hideInternalAuthEmails(response: Response): Promise<Response> {
  if (!response.headers.get("content-type")?.includes("application/json")) return response;

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return response;
  }

  const scrubbed = scrubInternalEmails(payload);
  if (!scrubbed.changed) return response;

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(JSON.stringify(scrubbed.value), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
