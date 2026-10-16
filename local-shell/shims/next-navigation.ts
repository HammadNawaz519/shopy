/**
 * Local-shell stand-in for `next/navigation`.
 *
 * The shell document is always the landing page, so `usePathname` reports
 * "/" — which is exactly what the real app's root layout sees when the
 * landing page renders (navbar transparency, footer visibility, status-bar
 * tint all key off it). `useRouter` maps onto plain window navigation into
 * the live app; the shell tree currently only consumes `usePathname`.
 */
import { remotePath } from "../constants";

export function usePathname(): string {
  return "/";
}

export function useRouter() {
  return {
    push: (path: string) => {
      window.location.assign(remotePath(path));
    },
    replace: (path: string) => {
      window.location.replace(remotePath(path));
    },
    back: () => {
      window.history.back();
    },
  };
}

export function useSearchParams() {
  return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
}

export function useSearchParamsSync() {
  return useSearchParams();
}
