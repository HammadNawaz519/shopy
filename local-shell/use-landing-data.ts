/**
 * Landing data for the instant-launch shell.
 *
 * First paint uses the build-time snapshot (live data baked in at build
 * time, or the static catalog fallback). After the frame is up, the live
 * APIs refresh each slice in place — never replacing data that a partial
 * outage returned empty. This keeps the landing section current without
 * ever delaying or re-laying-out the first visible frame.
 */
import { useCallback, useEffect, useState } from "react";
import { installApiFetchPatch, refreshLandingData, warmRemoteApp } from "./live";
import { mark } from "./timeline";
import { staticFallbackSnapshot, type ShellSnapshot } from "./defaults-source";

declare const __SHOPY_SHELL_SNAPSHOT__: string;

function parseSnapshot(): ShellSnapshot {
  try {
    const parsed = JSON.parse(__SHOPY_SHELL_SNAPSHOT__);
    if (!parsed || typeof parsed !== "object") return staticFallbackSnapshot();
    return parsed as ShellSnapshot;
  } catch {
    return staticFallbackSnapshot();
  }
}

type LiveSlice = ShellSnapshot;

export function useLandingData() {
  const [data, setData] = useState<LiveSlice>(() => parseSnapshot());

  const refresh = useCallback(async () => {
    const live = await refreshLandingData();
    if (!live) return;
    const gotData =
      live.homepage !== null ||
      live.categories.length > 0 ||
      live.featuredProducts.length > 0 ||
      live.navigation.length > 0 ||
      live.editorialQuote !== undefined;
    if (!gotData) return; // total outage — keep the bundled snapshot
    setData((prev) => ({
      homepage: live.homepage ?? prev?.homepage ?? null,
      categories:
        live.categories.length > 0 ? live.categories : (prev?.categories ?? []),
      products:
        live.featuredProducts.length > 0
          ? live.featuredProducts
          : (prev?.products ?? []),
      navigation:
        live.navigation.length > 0
          ? live.navigation
          : (prev?.navigation ?? []),
      quote: live.editorialQuote ?? prev?.quote ?? null,
      source: "live",
    }));
    mark("live-data");
  }, []);

  useEffect(() => {
    // Installed at module scope too; repeated calls are no-ops.
    installApiFetchPatch();
    warmRemoteApp();

    // Refresh on idle so the network never competes with first paint.
    let timer: number;
    const idle = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;
    if (idle) {
      timer = idle(() => void refresh(), { timeout: 10000 }) as unknown as number;
    } else {
      timer = window.setTimeout(() => void refresh(), 2000);
    }

    const onOnline = () => void refresh();
    window.addEventListener("online", onOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  return data;
}
