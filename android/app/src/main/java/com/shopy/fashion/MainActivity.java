package com.shopy.fashion;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestHighestRefreshRate();
        configureWebViewRendering();
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
     * WebView rendering hardening for high refresh-rate (120 Hz) smoothness.
     *
     * The WebView is found by walking the (framework-stable) view hierarchy,
     * not by touching Capacitor internals, so this keeps compiling across
     * Capacitor versions. Everything is optional and fully guarded:
     *
     *   - setOffscreenPreRaster(true): the compositor pre-renders content
     *     just below the viewport, so fast scrolling / swiping shows
     *     already-painted frames instead of waiting for a paint (this is
     *     the single biggest win for 90/120 Hz scroll smoothness).
     *   - LAYER_TYPE_NONE: keep the WebView on the hardware-accelerated
     *     surface (the default) — never a software layer.
     *
     * On stock AOSP devices these are effectively defaults; on OEM skins
     * they act as explicit hints. No functional behavior changes.
     */
    private void configureWebViewRendering() {
        getWindow().getDecorView().post(() -> {
            try {
                final android.webkit.WebView wv = findWebView(getWindow().getDecorView());
                if (wv == null) return;
                try {
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
                // WebView not attached yet — harmless, it is configured on
                // its own next layout pass by the framework defaults.
            }
        });
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
