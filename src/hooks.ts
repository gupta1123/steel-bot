import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

export function useApiData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(await api<T>(path));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to load this page");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", options || {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}
