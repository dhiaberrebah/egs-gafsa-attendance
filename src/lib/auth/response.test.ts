import { describe, expect, it } from "vitest";
import { hideInternalAuthEmails } from "./response";

describe("Better Auth response privacy", () => {
  it("removes internal auth emails while preserving contact data and auth headers", async () => {
    const headers = new Headers({ "content-type": "application/json", "set-auth-token": "signed-token" });
    headers.append("set-cookie", "session=abc; HttpOnly");
    headers.append("set-cookie", "csrf=def; SameSite=Lax");
    const response = new Response(JSON.stringify({
      user: { id: "coach-id", email: "coach-id@auth.invalid", contactEmail: "coach@example.com" },
      nested: [{ email: "person@auth.invalid" }],
    }), { headers });

    const sanitized = await hideInternalAuthEmails(response);
    const body = await sanitized.json();

    expect(body.user).not.toHaveProperty("email");
    expect(body.user.contactEmail).toBe("coach@example.com");
    expect(body.nested[0]).not.toHaveProperty("email");
    expect(sanitized.headers.get("set-auth-token")).toBe("signed-token");
    expect(sanitized.headers.getSetCookie()).toHaveLength(2);
  });

  it("returns non-JSON responses unchanged", async () => {
    const response = new Response("plain text", { headers: { "content-type": "text/plain" } });
    await expect(hideInternalAuthEmails(response)).resolves.toBe(response);
  });
});
