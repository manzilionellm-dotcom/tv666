package com.blackseven.tv;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The Few — Plugin Capacitor « Vlc » : ouvre une URL de flux dans l'Activity
 * libVLC plein écran (décodage universel).
 */
@CapacitorPlugin(name = "Vlc")
public class VlcPlugin extends Plugin {

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url manquante");
            return;
        }
        Intent intent = new Intent(getContext(), VlcPlayerActivity.class);
        intent.putExtra("url", url);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }
}
