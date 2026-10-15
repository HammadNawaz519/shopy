package com.shopy.fashion.auth;

import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

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

        GetGoogleIdOption googleOption = new GetGoogleIdOption.Builder()
                .setServerClientId(serverClientId)
                .setFilterByAuthorizedAccounts(false)
                .setAutoSelectEnabled(false)
                .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleOption)
                .build();

        CredentialManager credentialManager = CredentialManager.create(getContext());
        credentialManager.getCredentialAsync(
                getActivity(),
                request,
                new CancellationSignal(),
                executor,
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
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

                    @Override
                    public void onError(@NonNull GetCredentialException error) {
                        call.reject("Google sign-in was cancelled or failed", error);
                    }
                }
        );
    }
}
