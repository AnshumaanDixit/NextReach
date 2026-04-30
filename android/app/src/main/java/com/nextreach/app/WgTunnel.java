package com.nextreach.app;

import androidx.annotation.NonNull;
import com.wireguard.android.backend.Tunnel;

public class WgTunnel implements Tunnel {
    @NonNull
    @Override
    public String getName() {
        return "NextReach_Proxy";
    }

    @Override
    public void onStateChange(@NonNull Tunnel.State newState) {
        System.out.println("Tunnel state changed to: " + newState.name());
    }
}