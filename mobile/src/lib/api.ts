export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export type MobileAuthUser = {
  role: string;
};

export type CoachSession = {
  id: string;
  categoryId: string;
  category: { nameFr: string; nameAr: string };
  type: "TRAINING" | "MATCH" | "MEETING" | "OTHER";
  status: "DRAFT" | "SUBMITTED" | "LOCKED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  attendanceCount: number;
};

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "INJURED";

export type AttendanceParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  role: "PLAYER" | "COACH" | "DIRIGEANT";
};

export type AttendanceRecord = {
  userId: string;
  status: AttendanceStatus;
  note: string | null;
};

export type AttendanceSheet = {
  session: {
    id: string;
    category: { nameFr: string; nameAr: string };
    type: string;
    status: CoachSession["status"];
    startsAt: string;
    endsAt: string | null;
    location: string | null;
  };
  participants: AttendanceParticipant[];
  records: AttendanceRecord[];
};

type ApiErrorPayload = { error?: unknown; code?: unknown; message?: unknown };

function apiBaseUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!value) throw new ApiError(0, "API_URL_NOT_CONFIGURED");
  return value;
}

async function readJson(response: Response) {
  try {
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

function responseCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return "REQUEST_FAILED";
  const data = payload as ApiErrorPayload;
  if (typeof data.error === "string") return data.error;
  if (typeof data.code === "string") return data.code;
  return "REQUEST_FAILED";
}

export async function mobileSignIn(username: string, password: string) {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}/api/mobile/auth/sign-in/username`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR");
  }
  const payload = await readJson(response);
  if (!response.ok) throw new ApiError(response.status, responseCode(payload));

  const token = response.headers.get("set-auth-token");
  const user = (payload as { user?: MobileAuthUser } | null)?.user;
  if (!token || !user) throw new ApiError(500, "AUTH_RESPONSE_INVALID");
  return { token, user };
}

export async function validateMobileToken(token: string) {
  const response = await fetch(`${apiBaseUrl()}/api/mobile/auth/get-session`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    credentials: "omit",
  });
  const payload = await readJson(response);
  if (!response.ok) throw new ApiError(response.status, responseCode(payload));
  const session = payload as { user?: MobileAuthUser } | null;
  if (!session?.user) throw new ApiError(401, "UNAUTHENTICATED");
  return { user: session.user, refreshedToken: response.headers.get("set-auth-token") };
}

export async function mobileSignOut(token: string) {
  const response = await fetch(`${apiBaseUrl()}/api/mobile/auth/sign-out`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "omit",
    body: "{}",
  });
  if (!response.ok) throw new ApiError(response.status, responseCode(await readJson(response)));
}

export async function requestJson<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, { ...options, headers, credentials: "omit" });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR");
  }

  const payload = await readJson(response);
  if (!response.ok) throw new ApiError(response.status, responseCode(payload));
  return payload as T;
}
