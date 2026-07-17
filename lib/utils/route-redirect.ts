export type RouteSearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function redirectPath(
  pathname: string,
  searchParams: RouteSearchParams,
  overrides: RouteSearchParams = {}
) {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries({ ...searchParams, ...overrides })) {
    if (rawValue === undefined) continue;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) params.append(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
