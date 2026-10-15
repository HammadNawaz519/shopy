package com.shopy.fashion;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.shopy.fashion.auth.NativeGoogleAuthPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
        requestHighestRefreshRate();
        // Configure immediately (the Bridge inflates the view tree synchronously
        // in super.onCreate) and again on the next frame to cover attach races.
        // The Bridge may only attach the WebView in onResume (before the first
        // draw), so one short retry guarantees the transparent background is in
        // place before any web frame can paint over the splash.
        configureWebViewRendering(getWindow().getDecorView());
        final View decorView = getWindow().getDecorView();
        decorView.post(() -> configureWebViewRendering(decorView));
        decorView.postDelayed(() -> configureWebViewRendering(decorView), 150);
    }

    @Override
    public void onResume() {
        super.onResume();
        requestHighestRefreshRate();
    }

    /**
     * Run this window at the panel's highest refresh rate (e.g. 120Hz) so WebView
     * scrolling and animations are not pinned to 60Hz.
     *
     * Prefers a mode with the SAME pixel resolution as the current one, so the UI
     * keeps its exact sharpness — only the refresh rate goes up. Falls back to the
     * highest-refresh mode overall if no same-resolution mode exists.
     */
    private void requestHighestRefreshRate() {
        try {
            Display display = getWindowManager().getDefaultDisplay();
            Display.Mode[] modes = display.getSupportedModes();
            if (modes == null || modes.length == 0) return;

            Display.Mode current = display.getMode();
            int curW = current.getPhysicalWidth();
            int curH = current.getPhysicalHeight();

            Display.Mode sameResBest = null;   // highest refresh at identical resolution
            Display.Mode anyBest = modes[0];   // highest refresh overall (fallback)

            for (Display.Mode mode : modes) {
                if (mode.getRefreshRate() > anyBest.getRefreshRate()) {
                    anyBest = mode;
                }
                if (mode.getPhysicalWidth() == curW && mode.getPhysicalHeight() == curH) {
                    if (sameResBest == null || mode.getRefreshRate() > sameResBest.getRefreshRate()) {
                        sameResBest = mode;
                    }
                }
            }

            Display.Mode best = sameResBest != null ? sameResBest : anyBest;

            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.preferredDisplayModeId = best.getModeId();
            lp.preferredRefreshRate = best.getRefreshRate();
            getWindow().setAttributes(lp);

        } catch (Throwable ignored) {
            // Device without multiple display modes or restricted window — no-op.
        }
    }

    /**
     * WebView rendering hardening for launch smoothness and 120 Hz scrolling.
     *
     * The WebView is found by walking the (framework-stable) view hierarchy,
     * not by touching Capacitor internals, so this keeps compiling across
     * Capacitor versions. Everything is optional and fully guarded:
     *
     *   - Transparent WebView background: the launch activity's window
     *     background (the SHOPY splash drawable, set by the
     *     AppTheme.NoActionBarLaunch theme) stays visible *behind* the
     *     WebView while the remote app shell is still loading. Once the web
     *     content's first frame paints, it covers the splash — so the
     *     launch screen dismisses exactly when the first meaningful SHOPY
     *     interface is ready, with no white flash and no blank frame in
     *     between. (An opaque WebView would paint white immediately after
     *     layout, killing the splash and flashing a blank screen on cold
     *     starts.)
     *   - setOffscreenPreRaster(true): the compositor pre-renders content
     *     just below the viewport, so fast scrolling / swiping shows
     *     already-painted frames instead of waiting for a paint (this is
     *     the single biggest win for 90/120 Hz scroll smoothness).
     *   - LAYER_TYPE_NONE: keep the WebView on the hardware-accelerated
     *     surface (the default) — never a software layer.
     *
     * Warm starts are unaffected: a backgrounded app is not re-created
     * (singleTask + configChanges covers the rest), so the WebView keeps
     * its content and no splash is re-shown. On activity recreation the
     * same transparent-over-splash sequence plays once more.
     */
    private void configureWebViewRendering(View root) {
        try {
            final android.webkit.WebView wv = findWebView(root);
            if (wv == null) return;
            try {
                wv.setBackgroundColor(Color.TRANSPARENT);
                if (wv.getSettings() != null) {
                    wv.getSettings().setOffscreenPreRaster(true);
                }
                if (wv.getLayerType() != View.LAYER_TYPE_NONE) {
                    wv.setLayerType(View.LAYER_TYPE_NONE, null);
                }
            } catch (Throwable ignored) {
                // Unsupported platform / OEM restriction — no-op.
            }
        } catch (Throwable ignored) {
            // WebView not attached yet — harmless, the posted pass covers
            // the next layout frame.
        }
    }

    /** Depth-first walk of the view tree; returns the first WebView found. */
    private android.webkit.WebView findWebView(View root) {
        if (root instanceof android.webkit.WebView) {
            return (android.webkit.WebView) root;
        }
        if (root instanceof ViewGroup) {
            final ViewGroup group = (ViewGroup) root;
            for (int i = 0; i < group.getChildCount(); i++) {
                final android.webkit.WebView found = findWebView(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
}
