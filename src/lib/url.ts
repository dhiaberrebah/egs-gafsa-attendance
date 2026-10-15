type QueryValue = string | undefined | null;

export function withQueryParams(pathname: string, current: Record<string, QueryValue>, updates: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...updates })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
