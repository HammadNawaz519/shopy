package com.shopy.fashion;

import android.os.Bundle;
import android.view.Display;
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
     * scrolling and animations are not pinned to 60Hz. Safe no-op on devices that
     * only expose a single display mode.
     */
    private void requestHighestRefreshRate() {
        try {
            Display display = getWindowManager().getDefaultDisplay();
            Display.Mode[] modes = display.getSupportedModes();
            if (modes == null || modes.length == 0) return;

            Display.Mode best = modes[0];
            for (Display.Mode mode : modes) {
                if (mode.getRefreshRate() > best.getRefreshRate()) {
                    best = mode;
                }
            }

            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.preferredDisplayModeId = best.getModeId();
            getWindow().setAttributes(lp);
        } catch (Throwable ignored) {
            // Device without multiple display modes or restricted window — no-op.
        }
    }
}
