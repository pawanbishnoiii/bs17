import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAppSettings } from "@/lib/study";

const DEFAULT_MOBILE = "/__l5e/assets-v1/cec1c937-a95b-42d7-b526-642821c969f3/bg-mobile.png";
const DEFAULT_DESKTOP = "/__l5e/assets-v1/94b13068-037f-4aac-b941-2580a7a04114/bg-desktop.png";
const CACHE_KEY = "app-bg-cache-v1";
type Cfg = { m: string; d: string; blur: number; overlay: number };

function readCache(): Cfg | null {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch { return null; }
}

/** Fixed background layer: shows a plain page until the image is fully loaded, then fades it in. Settings are cached. */
export function AppBackground() {
  const settings = useQuery({ queryKey: ["app-settings"], queryFn: fetchAppSettings, staleTime: 5 * 60_000 });
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    setCfg(readCache() ?? { m: DEFAULT_MOBILE, d: DEFAULT_DESKTOP, blur: 0, overlay: 0 });
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    const next: Cfg = {
      m: s.bg_mobile_url || DEFAULT_MOBILE,
      d: s.bg_desktop_url || DEFAULT_DESKTOP,
      blur: s.bg_blur ?? 0,
      overlay: s.bg_overlay ?? 0,
    };
    setCfg(next);
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  }, [settings.data]);

  const url = cfg ? (isDesktop ? cfg.d : cfg.m) : null;

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => setLoaded(url);
    img.src = url;
    if (img.complete) setLoaded(url);
  }, [url]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {url ? (
        <div
          className="absolute -inset-8 bg-cover bg-center transition-opacity duration-700 ease-out"
          style={{
            backgroundImage: `url("${url}")`,
            opacity: loaded === url ? 1 : 0,
            filter: cfg?.blur ? `blur(${cfg.blur}px)` : undefined,
          }}
        />
      ) : null}
      {cfg?.overlay ? <div className="absolute inset-0 bg-background" style={{ opacity: cfg.overlay / 100 }} /> : null}
    </div>
  );
}
