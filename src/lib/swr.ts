import useSWR, { SWRConfiguration } from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** SWR hook for listings with 10s dedup + 30s stale-while-revalidate */
export function useListings() {
  return useSWR('/api/listings', fetcher, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
  });
}

/** SWR hook for players with 30s dedup */
export function usePlayers(limit = 200) {
  return useSWR(`/api/players?limit=${limit}`, fetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  });
}

/** SWR hook for platform stats with 60s dedup */
export function usePlatformStats() {
  return useSWR('/api/stats', fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
}

/** Generic SWR hook with sensible defaults */
export function useAPI<T = any>(url: string | null, config?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    dedupingInterval: 10_000,
    revalidateOnFocus: false,
    ...config,
  });
}
