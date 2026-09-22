import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
export const goalError = error => error?.errors?.[0]?.message || error?.message || "We couldn’t save your changes. Please try again.";

// Refresh on focus (including after a mutation) and discard stale/unmounted requests.
export function useGoalResource(loader) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const active = useRef(false);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError("");
    try { const result = await loader(); if (active.current && request === sequence.current) setData(result); }
    catch (e) { if (active.current && request === sequence.current) setError(goalError(e)); }
    finally { if (active.current && request === sequence.current) setLoading(false); }
  }, [loader]);
  useFocusEffect(useCallback(() => {
    active.current = true; reload();
    return () => { active.current = false; sequence.current++; };
  }, [reload, user?._id]));
  return { data, setData, loading, error, reload };
}

export function useGoalAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async action => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await action(); }
    catch (e) { if (mounted.current) setError(goalError(e)); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  return { run, busy, error, setError };
}
