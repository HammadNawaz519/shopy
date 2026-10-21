package com.shopy.fashion.auth;

import android.app.Activity;
import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.UUID;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private final Executor executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = call.getString("serverClientId");
        if (serverClientId == null || serverClientId.trim().isEmpty()) {
            call.reject("Missing Google server client ID");
            return;
        }

        // Account picker can outlive Capacitor's default call lifetime.
        call.setKeepAlive(true);

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Google sign-in failed (no activity)");
            return;
        }

        final String webClientId = serverClientId.trim();
        activity.runOnUiThread(() -> startSignIn(activity, call, webClientId));
    }

    private void startSignIn(Activity activity, PluginCall call, String webClientId) {
        // The on-screen control is a Sign in with Google button, so the
        // button-specific option is the primary request. serverClientId MUST
        // be the Web OAuth client, not the Android-type client.
        GetSignInWithGoogleOption googleButtonOption =
                new GetSignInWithGoogleOption.Builder(webClientId)
                        .setNonce(generateNonce())
                        .build();
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleButtonOption)
                .build();
        CredentialManager credentialManager = CredentialManager.create(activity);
        requestCredential(activity, credentialManager, call, request, webClientId, true);
    }

    private void requestCredential(
            Activity activity,
            CredentialManager credentialManager,
            PluginCall call,
            GetCredentialRequest request,
            String webClientId,
            boolean allowBottomSheetFallback
    ) {
        credentialManager.getCredentialAsync(
                activity,
                request,
                new CancellationSignal(),
                executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        resolveGoogleCredential(call, response);
                    }

                    @Override
                    public void onError(@NonNull GetCredentialException error) {
                        if (allowBottomSheetFallback && shouldFallbackToBottomSheet(error)) {
                            GetGoogleIdOption googleOption = new GetGoogleIdOption.Builder()
                                    .setServerClientId(webClientId)
                                    .setFilterByAuthorizedAccounts(false)
                                    .setAutoSelectEnabled(false)
                                    .setNonce(generateNonce())
                                    .build();
                            GetCredentialRequest fallbackRequest = new GetCredentialRequest.Builder()
                                    .addCredentialOption(googleOption)
                                    .build();
                            activity.runOnUiThread(() -> requestCredential(
                                    activity,
                                    credentialManager,
                                    call,
                                    fallbackRequest,
                                    webClientId,
                                    false
                            ));
                            return;
                        }

                        String detail = describeCredentialError(error);
                        android.util.Log.e("NativeGoogleAuth", detail, error);
                        if (error instanceof GetCredentialCancellationException) {
                            call.reject("Google credential provider cancelled the request (" + detail + ")");
                        } else {
                            call.reject("Google sign-in failed (" + detail + ")");
                        }
                    }
                }
        );
    }

    private boolean shouldFallbackToBottomSheet(GetCredentialException error) {
        if (error instanceof NoCredentialException) {
            return true;
        }
        String type = error.getType();
        String message = error.getMessage();
        String haystack = ((type == null ? "" : type) + " " + (message == null ? "" : message))
                .toLowerCase();
        return haystack.contains("internal") || haystack.contains("unknown");
    }

    private String describeCredentialError(GetCredentialException error) {
        StringBuilder sb = new StringBuilder();
        sb.append(error.getClass().getSimpleName());
        String type = error.getType();
        if (type != null && !type.isEmpty()) {
            sb.append(" type=").append(type);
        }
        String message = error.getMessage();
        if (message != null && !message.isEmpty()) {
            sb.append(": ").append(message);
        }
        Throwable cause = error.getCause();
        int depth = 0;
        while (cause != null && depth < 5) {
            sb.append(" <- ").append(cause.getClass().getSimpleName());
            String causeMessage = cause.getMessage();
            if (causeMessage != null && !causeMessage.isEmpty()) {
                sb.append(": ").append(causeMessage);
            }
            cause = cause.getCause();
            depth++;
        }
        return sb.toString();
    }

    private String generateNonce() {
        return UUID.randomUUID().toString();
    }

    private void resolveGoogleCredential(PluginCall call, GetCredentialResponse response) {
        Credential credential = response.getCredential();
        if (credential instanceof androidx.credentials.CustomCredential) {
            androidx.credentials.CustomCredential customCredential =
                    (androidx.credentials.CustomCredential) credential;
            if (GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                    .equals(customCredential.getType())) {
                GoogleIdTokenCredential googleCredential =
                        GoogleIdTokenCredential.createFrom(customCredential.getData());
                JSObject result = new JSObject();
                result.put("idToken", googleCredential.getIdToken());
                call.resolve(result);
                return;
            }
        }
        call.reject("Google did not return an ID token");
    }
}
