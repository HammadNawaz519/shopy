package com.shopy.fashion;

import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSExport;
import com.getcapacitor.WebViewListener;
import com.shopy.fashion.auth.NativeGoogleAuthPlugin;

public class MainActivity extends BridgeActivity {
    // The live application origin. The instant-launch shell boots from the
    // local origin (https://localhost); everything the user taps deep into the
    // store loads this origin in the SAME WebView.
    private static final String REMOTE_ORIGINS = "buyatshopy.vercel.app";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Documented AndroidX order: install the (neutral, background-only)
        // splash window FIRST, before the activity inflates its content. It
        // auto-dismisses on the first drawn frame of the WebView — no timer.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        registerPlugin(NativeGoogleAuthPlugin.class);
        injectNativeBridgeForRemoteOrigin();
        requestHighestRefreshRate();
    }

    /**
     * Make the in-app native Google sign-in (NativeGoogleAuth) reachable from
     * the live application's pages.
     *
     * Capacitor injects its JS bridge (native-bridge.js + plugin headers) only
     * into the app's own origin (the local shell). The live app is a
     * cross-origin page: it still has the {@code androidBridge} Java interface
     * (set at the WebView level) but NOT the Capacitor JS runtime
     * ({@code Capacitor.nativePromise/nativeCallback}) nor the native plugin
     * headers. So {@code registerPlugin("NativeGoogleAuth")} on the live pages
     * found no implementation and the button threw "sign-in failed".
     *
     * We therefore re-inject the native bridge + the NativeGoogleAuth header on
     * every load of the live origin. This happens on the live pages only — it
     * never touches the local shell's start script or its first frame, so the
     * ~0.3s startup is unaffected.
     */
    private void injectNativeBridgeForRemoteOrigin() {
        final Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }
        try {
            bridge.addWebViewListener(new WebViewListener() {
                @Override
                public void onPageCommitVisible(WebView view, String url) {
                    if (url != null && url.contains(REMOTE_ORIGINS)) {
                        injectNativeBridge(view);
                    }
                }
            });
        } catch (Throwable ignored) {
            // Best-effort; the live app also has a web-OAuth fallback.
        }
    }

    private void injectNativeBridge(WebView webView) {
        try {
            // The same native-bridge runtime Capacitor injects into the shell,
            // which wires window.Capacitor.nativePromise/nativeCallback to the
            // androidBridge Java interface already present on every page.
            String nativeBridgeJs = JSExport.getBridgeJS(getApplicationContext());
            // Expose the native Google plugin to @capacitor/core's
            // registerPlugin() (it resolves a native method from PluginHeaders).
            String pluginHeadersJs =
                "(function(){try{" +
                "var c=window.Capacitor=window.Capacitor||{};" +
                "c.PluginHeaders=c.PluginHeaders||[];" +
                "if(!c.PluginHeaders.some(function(h){return h&&h.name==='NativeGoogleAuth';})){c.PluginHeaders.push({name:'NativeGoogleAuth',methods:[{name:'signIn',rtype:'promise'}]});}" +
                "}catch(e){}})();";
            webView.evaluateJavascript(nativeBridgeJs + "\n" + pluginHeadersJs, null);
        } catch (Throwable ignored) {
            // Best-effort; the live app also has a web-OAuth fallback.
        }
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
