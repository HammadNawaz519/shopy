package com.shopy.fashion;

import android.os.Bundle;
import android.view.Display;
import android.view.WindowManager;

import androidx.core.splashscreen.SplashScreen;
import androidx.webkit.WebViewCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSExport;
import com.shopy.fashion.auth.NativeGoogleAuthPlugin;

import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    // The live application origin. The instant-launch shell boots from the
    // local origin (https://localhost); everything the user taps deep into the
    // store loads this origin in the SAME WebView.
    private static final String REMOTE_ORIGIN = "https://buyatshopy.vercel.app";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Documented AndroidX order: install the (neutral, background-only)
        // splash window FIRST, before the activity inflates its content. It
        // auto-dismisses on the first drawn frame of the WebView — no timer,
        // no artificial hold, so the splash never adds to launch time.
        // Documented AndroidX order: install the splash window FIRST, before
        // the activity inflates its content. The splash releases the instant
        // the WebView draws its first frame (no timer, no artificial hold —
        // "0 second" launch), and the system then plays its default ~250 ms
        // icon cross-fade out of the branded logo (values/styles.xml now
        // points windowSplashScreenAnimatedIcon at @mipmap/ic_launcher_foreground
        // instead of the old 1x1 transparent icon), which sits inside the
        // requested 0.2-0.4 s icon-animation window. We do NOT customize the
        // exit listener: core-splashscreen 1.2.0's listener API changed and
        // the default timing is already what this app wants.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        registerPlugin(NativeGoogleAuthPlugin.class);
        verifyNativeGoogleAuthRegistered();
        extendNativeBridgeToRemoteOrigin();
        requestHighestRefreshRate();
    }

    /**
     * Guarantee the NativeGoogleAuth plugin is actually in this Bridge's plugin
     * map. If the Class-based registration in {@code registerPlugin(...)}
     * silently failed (Capacitor catches PluginLoadException and only logs
     * it), every JS call from the live pages dies with the bridge error
     * "unable to find plugin : NativeGoogleAuth". Retry with an instance-based
     * registration (which skips the failing step) and log the outcome under
     * the NativeGoogleAuth tag so logcat pins the exact state.
     */
    private void verifyNativeGoogleAuthRegistered() {
        final String tag = "NativeGoogleAuth";
        try {
            if (getBridge() != null && getBridge().getPlugin("NativeGoogleAuth") != null) {
                android.util.Log.d(tag, "registered=true");
                return;
            }
            getBridge().registerPluginInstance(new NativeGoogleAuthPlugin());
            android.util.Log.d(
                    tag,
                    "registered="
                            + (getBridge() != null
                                    && getBridge().getPlugin("NativeGoogleAuth") != null));
        } catch (Throwable t) {
            android.util.Log.e(tag, "registration failed", t);
        }
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
     * headers, so {@code registerPlugin("NativeGoogleAuth")} on the live pages
     * found no implementation and the button threw "sign-in failed".
     *
     * We re-register a document-start script for BOTH the local origin and the
     * live origin. The script carries the native-bridge runtime + the
     * NativeGoogleAuth header. The local shell uses no Capacitor native
     * plugins, so replacing the start script with this lighter one does not
     * affect the ~0.3s first frame (the first frame is the shell's own HTML/
     * CSS/JS, not the bridge). The start script runs before page scripts, so
     * the header is present by the time the live app's registerPlugin() runs.
     */
    private void extendNativeBridgeToRemoteOrigin() {
        final Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }
        try {
            final String script;
            try {
                String globalJs = JSExport.getGlobalJS(this, false, bridge.isDevMode());
                String nativeBridgeJs = JSExport.getBridgeJS(this);
                String nativeGoogleHeader =
                    "(function(){try{" +
                    "var c=window.Capacitor=window.Capacitor||{};" +
                    "c.PluginHeaders=c.PluginHeaders||[];" +
                    "if(!c.PluginHeaders.some(function(h){return h&&h.name==='NativeGoogleAuth';})){c.PluginHeaders.push({name:'NativeGoogleAuth',methods:[{name:'signIn',rtype:'promise'}]});}" +
                    "}catch(e){}})();";
                script = globalJs + "\n" + nativeBridgeJs + "\n" + nativeGoogleHeader;
            } catch (Throwable t) {
                return; // can't build the bridge script — leave Capacitor's original intact
            }

            Set<String> origins = new HashSet<>();
            String local = bridge.getLocalUrl();
            if (local != null && !local.trim().isEmpty()) {
                origins.add(local);
            }
            origins.add(REMOTE_ORIGIN);

            WebViewCompat.addDocumentStartJavaScript(bridge.getWebView(), script, origins);
        } catch (Throwable ignored) {
            // Never break startup; the live app also has a web-OAuth fallback.
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
