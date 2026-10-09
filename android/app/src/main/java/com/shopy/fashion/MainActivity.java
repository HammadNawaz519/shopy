package com.shopy.fashion;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.Surface;
import android.view.SurfaceControl;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestHighestRefreshRate();
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

            // Android 12+: the display-mode hint above is ignored by some OEM skins
            // for the WebView. Requesting the frame rate on the window's own surface
            // steers the compositor directly — this is what actually lifts the
            // WebView (and thus scrolling) to 120Hz rather than a hard 60.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                SurfaceControl surfaceControl = getWindow().getDecorView().getRootSurfaceControl();
                if (surfaceControl != null) {
                    new SurfaceControl.Transaction()
                            .setFrameRate(
                                    surfaceControl,
                                    best.getRefreshRate(),
                                    Surface.FRAME_RATE_COMPATIBILITY_FIXED_SOURCE)
                            .apply();
                }
            }
        } catch (Throwable ignored) {
            // Device without multiple display modes or restricted window — no-op.
        }
    }
}
