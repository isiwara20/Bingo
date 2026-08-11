/**
 * BinGo – useApi Hook
 *
 * Generic hook for API calls with loading, error, and data state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(getMyReports);
 *   useEffect(() => { execute(); }, []);
 */

import { useState, useCallback } from "react";

const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = () => {
    setData(null);
    setError(null);
    setLoading(false);
  };

  return { data, loading, error, execute, reset };
};

export default useApi;
