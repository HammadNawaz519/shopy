/**
 * SHOPY native Google sign-in — app-link target.
 *
 * This URL (https://buyatshopy.vercel.app/oauth/complete) is claimed by the
 * Android app as a verified HTTPS App Link (autoVerify intent-filter in
 * android/app/src/main/AndroidManifest.xml + the cert declaration in
 * public/.well-known/assetlinks.json). After a native Google sign-in
 * finishes in the system browser, the OAuth callback redirects here:
 *
 *  - If the SHOPY app is installed and the link is verified: the OS opens
 *    the app directly (the page never renders in the browser). The app's
 *    appUrlOpen listeners + the pending handoff poll then complete the
 *    login automatically.
 *  - If the app is missing / not yet verified: this page renders in the
 *    browser as the informational fallback. No button is offered on
 *    purpose — going back to the SHOPY app completes the sign-in by
 *    itself (the persisted handoff record auto-resumes).
 *
 * Static page: no data, no auth, no middleware interception (the edge
 * matcher only covers /admin and /account).
 */
export default function OauthCompletePage() {
  return (
    <main
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F4F2",
        color: "#495464",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "320px" }}>
        <h1
          style={{
            fontWeight: 300,
            letterSpacing: ".3em",
            fontSize: "2rem",
            margin: 0,
          }}
        >
          SHOPY
        </h1>
        <p style={{ fontSize: "14px", letterSpacing: ".1em", marginTop: "1rem" }}>
          Sign-in complete&hellip;
        </p>
        <p style={{ fontSize: "11px", marginTop: "1.5rem" }}>
          Returning to SHOPY&hellip;
        </p>
        <p style={{ fontSize: "10px", opacity: 0.6, marginTop: "1.5rem" }}>
          If the app does not open, return to SHOPY — your sign-in will
          finish automatically.
        </p>
      </div>
    </main>
  );
}
