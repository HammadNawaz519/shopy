/**
 * Cold-launch instrumentation for the instant-launch shell.
 *
 * Every milestone is printed with a `[shopy]` prefix so it is visible in
 * `adb logcat` (Chromium WebView logs console output there) with the
 * process start as t0. The numbers feed the startup timing section of the
 * performance report; none of this adds any work to the first frame.
 */
const t0 =
  performance && performance.timeOrigin
    ? performance.timeOrigin
    : Date.now() - performance.now();

interface Milestone {
  name: string;
  at: number;
}

const milestones: Milestone[] = [];

export function mark(name: string) {
  const at = performance.now();
  milestones.push({ name, at });
  // eslint-disable-next-line no-console
  console.info(`[shopy] t+${Math.round(at)}ms ${name}`);
}

/** First animation frame after mount — the landing UI is on screen. */
export function markFirstFrame(cb: () => void) {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      mark("first-frame");
      cb();
    });
  } else {
    setTimeout(() => {
      mark("first-frame");
      cb();
    }, 0);
  }
}

export function dumpTimeline() {
  const summary = milestones
    .map((m) => `${m.name}@${Math.round(m.at)}ms`)
    .join(" ");
  // eslint-disable-next-line no-console
  console.info(`[shopy] timeline: ${summary || "(no milestones yet)"}`);
}

export function t0Timestamp() {
  return t0;
}
