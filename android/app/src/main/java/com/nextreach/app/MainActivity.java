package com.nextreach.app;

import android.content.Intent;
import android.net.VpnService;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(ProxyTunnelPlugin.class);
    }

    @Override
    public void onResume() {
        super.onResume();
        // Triggers the "Allow VPN" OS popup
        Intent intent = VpnService.prepare(this);
        if (intent != null) {
            startActivityForResult(intent, 0);
        }
    }
}