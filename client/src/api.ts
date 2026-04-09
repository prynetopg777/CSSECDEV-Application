const base = "";

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: "Invalid response." };
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const data = (await parseJson(res)) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Cannot reach the API server. Is it running, and is the port correct?" } as T,
    };
  }
}

export type Role = "ADMIN" | "PRODUCT_MANAGER" | "CUSTOMER";

export type MeUser = { id: string; email: string; role: Role };

export type LoginResult = {
  user: MeUser;
  lastSuccessfulLoginAt: string | null;
  lastFailedLoginAt: string | null;
};

export type AuditRow = {
  id: string;
  userId: string | null;
  eventType: string;
  message: string;
  metadata: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};
