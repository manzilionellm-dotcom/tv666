package com.blackseven.tv;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugin natif libVLC (lecteur universel).
        registerPlugin(VlcPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
