'use client';

import { useState } from 'react';
import ProxyTunnel from '@/lib/plugins/ProxyTunnel';

export default function Home() {
  const [status, setStatus] = useState<string>('Disconnected');
  const [ip, setIp] = useState<string>(''); // e.g. "3.110.xx.yy"
  const [port, setPort] = useState<string>('51820');
  const [clientPrivateKey, setClientPrivateKey] = useState<string>('');
  const [clientPublicKey, setClientPublicKey] = useState<string>('');
  const [serverPublicKey, setServerPublicKey] = useState<string>('');
  const [clientAddressCidr, setClientAddressCidr] = useState<string>('10.0.0.2/32');
  const [dns, setDns] = useState<string>('1.1.1.1');

  const handleGenerateKeys = async () => {
    try {
      setStatus('Generating keys…');
      const { privateKey, publicKey } = await ProxyTunnel.generateKeypair();
      setClientPrivateKey(privateKey);
      setClientPublicKey(publicKey);

      // Suggest a random /32 in 10.0.0.0/24 to reduce collisions.
      // (Server must still allow this exact IP for the peer.)
      const lastOctet = 2 + Math.floor(Math.random() * 240);
      setClientAddressCidr(`10.0.0.${lastOctet}/32`);

      setStatus('Keys generated (add public key on server)');
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(publicKey);
      }
    } catch (error) {
      console.error(error);
      setStatus('Disconnected (Failed to generate keys)');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConnect = async () => {
    try {
      if (!ip.trim()) {
        setStatus('Disconnected (Missing server IP)');
        return;
      }
      const parsedPort = Number(port);
      if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
        setStatus('Disconnected (Invalid port)');
        return;
      }
      if (!clientPrivateKey.trim() || !serverPublicKey.trim()) {
        setStatus('Disconnected (Missing keys)');
        return;
      }

      setStatus('Connecting… (VPN prompt may appear)');

      await ProxyTunnel.startConnection({
        ip: ip.trim(),
        port: parsedPort,
        clientPrivateKey: clientPrivateKey.trim(),
        serverPublicKey: serverPublicKey.trim(),
        clientAddressCidr: clientAddressCidr.trim() || undefined,
        dns: dns.trim() || undefined,
      });

      setStatus(`Connected to ${ip.trim()}:${parsedPort}`);
    } catch (error) {
      console.error(error);
      setStatus('Disconnected (Error occurred)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-gray-950 to-gray-950 pointer-events-none" />
      
      <div className="z-10 w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center">
        
        {/* Radar / Status Indicator */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border-2 ${status.startsWith('Connected') ? 'border-emerald-500/50' : status.startsWith('Disconnected') ? 'border-red-500/50' : 'border-cyan-500/50'} animate-pulse`} />
          <div className={`w-24 h-24 rounded-full ${status.startsWith('Connected') ? 'bg-emerald-500/20' : status.startsWith('Disconnected') ? 'bg-red-500/20' : 'bg-cyan-500/20'} flex items-center justify-center blur-sm`} />
          <div className={`absolute w-16 h-16 rounded-full ${status.startsWith('Connected') ? 'bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : status.startsWith('Disconnected') ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.5)]'}`} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          ProxyTunnel
        </h1>
        
        <p className="text-lg font-medium mb-6 h-8 text-cyan-400 animate-pulse text-center">
          {status}
        </p>

        <div className="w-full bg-black/40 rounded-2xl p-4 mb-8 border border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-2">
              <div className="text-xs text-gray-400 mb-1 font-mono">SERVER IP / HOST</div>
              <input
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="e.g. 3.110.xx.yy"
                className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              />
            </label>
            <label>
              <div className="text-xs text-gray-400 mb-1 font-mono">PORT</div>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                inputMode="numeric"
                placeholder="51820"
                className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              />
            </label>
          </div>

          <label>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-gray-400 mb-1 font-mono">CLIENT PRIVATE KEY (DEVICE)</div>
              <button
                type="button"
                onClick={handleGenerateKeys}
                className="text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                GENERATE ON THIS DEVICE
              </button>
            </div>
            <input
              value={clientPrivateKey}
              onChange={(e) => setClientPrivateKey(e.target.value)}
              placeholder="base64 private key"
              className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
            />
          </label>

          <label>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-gray-400 mb-1 font-mono">CLIENT PUBLIC KEY (ADD TO SERVER)</div>
              <button
                type="button"
                onClick={() => copyToClipboard(clientPublicKey)}
                className="text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors disabled:opacity-50"
                disabled={!clientPublicKey}
              >
                COPY
              </button>
            </div>
            <input
              value={clientPublicKey}
              readOnly
              placeholder="generated public key will appear here"
              className="w-full rounded-xl bg-gray-950/20 border border-white/10 px-3 py-2 text-sm text-white/80 outline-none"
            />
          </label>

          <label>
            <div className="text-xs text-gray-400 mb-1 font-mono">SERVER PUBLIC KEY</div>
            <input
              value={serverPublicKey}
              onChange={(e) => setServerPublicKey(e.target.value)}
              placeholder="base64 public key"
              className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <div className="text-xs text-gray-400 mb-1 font-mono">CLIENT ADDRESS (CIDR)</div>
              <input
                value={clientAddressCidr}
                onChange={(e) => setClientAddressCidr(e.target.value)}
                placeholder="10.0.0.2/32"
                className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              />
            </label>
            <label>
              <div className="text-xs text-gray-400 mb-1 font-mono">DNS (OPTIONAL)</div>
              <input
                value={dns}
                onChange={(e) => setDns(e.target.value)}
                placeholder="1.1.1.1"
                className="w-full rounded-xl bg-gray-950/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/60"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={status.startsWith('Connecting')}
          className="relative w-full group overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-500 to-cyan-700 p-[1px] transition-all hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="relative h-14 w-full bg-gray-950/50 backdrop-blur-sm rounded-2xl flex items-center justify-center transition-all group-hover:bg-transparent">
            <span className="text-lg font-bold text-white tracking-wide">
              {status.startsWith('Connected') ? 'RECONNECT' : 'CONNECT'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
