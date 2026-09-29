const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok)
    throw new ApiError(
      body.error?.code,
      body.error?.message || "Có lỗi xảy ra",
    );
  return body as { success: true; data: T; pagination?: any };
}
