package com.shopy.fashion;

import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;
import com.shopy.fashion.auth.NativeGoogleAuthPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        requestHighestRefreshRate();
    }

    @Override
    public void onResume() {
        super.onResume();
        requestHighestRefreshRate();
    }

    private void requestHighestRefreshRate() {
        try {
            Display display = getWindowManager().getDefaultDisplay();
            Display.Mode[] modes = display.getSupportedModes();
            if (modes == null || modes.length == 0) return;

            Display.Mode current = display.getMode();
            Display.Mode sameResolutionBest = null;
            Display.Mode highestRefresh = modes[0];

            for (Display.Mode mode : modes) {
                if (mode.getRefreshRate() > highestRefresh.getRefreshRate()) {
                    highestRefresh = mode;
                }
                if (mode.getPhysicalWidth() == current.getPhysicalWidth()
                        && mode.getPhysicalHeight() == current.getPhysicalHeight()
                        && (sameResolutionBest == null
                        || mode.getRefreshRate() > sameResolutionBest.getRefreshRate())) {
                    sameResolutionBest = mode;
                }
            }

            Display.Mode selected = sameResolutionBest != null
                    ? sameResolutionBest : highestRefresh;
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.preferredDisplayModeId = selected.getModeId();
            attributes.preferredRefreshRate = selected.getRefreshRate();
            getWindow().setAttributes(attributes);
        } catch (RuntimeException ignored) {
            // Devices without selectable display modes keep their default mode.
        }
    }
}
