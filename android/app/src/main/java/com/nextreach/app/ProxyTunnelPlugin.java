package com.nextreach.app;

import android.app.Activity;
import android.content.Intent;
import android.net.VpnService;
import com.getcapacitor.JSObject;
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
import com.wireguard.config.InetEndpoint;
import com.wireguard.config.InetNetwork;
import com.wireguard.crypto.KeyPair;

import java.net.InetAddress;

@CapacitorPlugin(name = "ProxyTunnel")
public class ProxyTunnelPlugin extends Plugin {

    private static final int VPN_REQUEST_CODE = 7331;

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
    public void generateKeypair(PluginCall call) {
        try {
            KeyPair keyPair = new KeyPair();

            JSObject ret = new JSObject();
            ret.put("privateKey", keyPair.getPrivateKey().toBase64());
            ret.put("publicKey", keyPair.getPublicKey().toBase64());
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to generate keypair: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startConnection(PluginCall call) {
        String proxyIp = call.getString("ip");
        Integer port = call.getInt("port");
        String clientPrivateKey = call.getString("clientPrivateKey");
        String serverPublicKey = call.getString("serverPublicKey");
        String clientAddressCidr = call.getString("clientAddressCidr", "10.0.0.2/32");
        String dns = call.getString("dns", "1.1.1.1");
        Integer mtu = call.getInt("mtu", 1280);

        if (proxyIp == null || port == null || clientPrivateKey == null || serverPublicKey == null) {
            call.reject("Missing required fields: ip, port, clientPrivateKey, serverPublicKey");
            return;
        }

        // Request VPN permission only when user taps Connect
        Intent prepareIntent = VpnService.prepare(getContext());
        if (prepareIntent != null) {
            saveCall(call);
            startActivityForResult(call, prepareIntent, VPN_REQUEST_CODE);
            return;
        }

        connect(call, proxyIp, port, clientPrivateKey, serverPublicKey, clientAddressCidr, dns, mtu);
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode != VPN_REQUEST_CODE) {
            return;
        }

        PluginCall saved = getSavedCall();
        if (saved == null) {
            return;
        }

        if (resultCode != Activity.RESULT_OK) {
            saved.reject("VPN permission denied by user");
            return;
        }

        String proxyIp = saved.getString("ip");
        Integer port = saved.getInt("port");
        String clientPrivateKey = saved.getString("clientPrivateKey");
        String serverPublicKey = saved.getString("serverPublicKey");
        String clientAddressCidr = saved.getString("clientAddressCidr", "10.0.0.2/32");
        String dns = saved.getString("dns", "1.1.1.1");
        Integer mtu = saved.getInt("mtu", 1280);

        if (proxyIp == null || port == null || clientPrivateKey == null || serverPublicKey == null) {
            saved.reject("Missing required fields after VPN permission");
            return;
        }

        connect(saved, proxyIp, port, clientPrivateKey, serverPublicKey, clientAddressCidr, dns, mtu);
    }

    private void connect(
            PluginCall call,
            String proxyIp,
            int port,
            String clientPrivateKey,
            String serverPublicKey,
            String clientAddressCidr,
            String dns,
            int mtu
    ) {
        try {
            // 1. Phone Config (Client)
            Interface.Builder iface = new Interface.Builder()
                    .addAddress(InetNetwork.parse(clientAddressCidr))
                    .addDnsServer(InetAddress.getByName(dns))
                    .setMtu(mtu)
                    .parsePrivateKey(clientPrivateKey);

            // 2. Server Config (Peer)
            Peer.Builder peer = new Peer.Builder()
                    .addAllowedIp(InetNetwork.parse("0.0.0.0/0")) // Route ALL traffic
                    .setEndpoint(InetEndpoint.parse(proxyIp + ":" + port))
                    .setPersistentKeepalive(25)
                    .parsePublicKey(serverPublicKey);

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