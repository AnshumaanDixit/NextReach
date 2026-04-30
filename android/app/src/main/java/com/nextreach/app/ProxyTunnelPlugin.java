package com.nextreach.app;

import android.content.Intent;
import android.net.VpnService;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.wireguard.android.backend.Backend;
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;
import com.wireguard.config.Interface;
import com.wireguard.config.Peer;
import com.wireguard.config.InetNetwork;

import java.net.InetAddress;

@CapacitorPlugin(name = "ProxyTunnel")
public class ProxyTunnelPlugin extends Plugin {

    // WireGuard uses a Singleton pattern for the engine
    private static Backend backend;
    private final Tunnel tunnel = new WgTunnel();

    @Override
    public void load() {
        // Initialize the engine safely when the app opens
        if (backend == null) {
            backend = new GoBackend(getContext());
        }
    }

    @PluginMethod
    public void startConnection(PluginCall call) {
        String proxyIp = call.getString("ip");
        Integer port = call.getInt("port");

        if (proxyIp == null || port == null) {
            call.reject("Missing IP or Port from frontend");
            return;
        }

        // Failsafe: Check if user accepted the VPN prompt yet
        Intent prepareIntent = VpnService.prepare(getContext());
        if (prepareIntent != null) {
            call.reject("VPN permission not granted by OS yet.");
            return;
        }

        try {
            // 1. Phone Config (Client)
            Interface.Builder iface = new Interface.Builder()
                    .addAddress(InetNetwork.parse("10.0.0.2/32"))
                    .addDnsServer(InetAddress.getByName("1.1.1.1"))
                    .setMtu(1280)
                    // WARNING: Replace with valid Base64 keys or this line will crash at runtime!
                    .parsePrivateKey("yJ4M/YOUR+VALID+PHONE+PRIVATE+KEY+HERE=");

            // 2. Server Config (Peer)
            Peer.Builder peer = new Peer.Builder()
                    .addAllowedIP(InetNetwork.parse("0.0.0.0/0")) // Route ALL traffic
                    .setEndpoint(proxyIp + ":" + port)
                    .setPersistentKeepalive(25)
                    // WARNING: Replace with valid Base64 keys or this line will crash at runtime!
                    .parsePublicKey("T8x/YOUR+VALID+SERVER+PUBLIC+KEY+HERE=");

            Config config = new Config.Builder()
                    .setInterface(iface.build())
                    .addPeer(peer.build())
                    .build();

            // 3. Connect the Tunnel
            backend.setState(tunnel, Tunnel.State.UP, config);

            call.resolve();

        } catch (Exception e) {
            e.printStackTrace();
            call.reject("WireGuard Engine Error: " + e.getMessage());
        }
    }
}