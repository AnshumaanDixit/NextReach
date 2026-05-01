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
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return String(error);
                }
              })();
      setStatus(`Disconnected (Failed to generate keys: ${message})`);
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
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return String(error);
                }
              })();
      setStatus(`Disconnected (Error occurred: ${message})`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#00E5FF]/30 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#11131A] via-[#0D1117] to-[#0D1117] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
      
      <div className="z-10 w-full max-w-lg flex flex-col items-center">
        
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          ProxyTunnel
        </h1>
        
        {/* Radar / Status Indicator */}
        <div className="relative w-40 h-40 mt-6 mb-8 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full border border-opacity-30 ${status.startsWith('Connected') ? 'border-[#00FF9C]' : status.startsWith('Disconnected') ? 'border-[#FF4D4D]' : 'border-[#00E5FF]'} ${status.startsWith('Connecting') ? 'animate-ping' : ''}`} />
          <div className={`absolute inset-4 rounded-full border border-opacity-20 ${status.startsWith('Connected') ? 'border-[#00FF9C]' : status.startsWith('Disconnected') ? 'border-[#FF4D4D]' : 'border-[#00E5FF]'} ${status.startsWith('Connecting') ? 'animate-pulse' : ''}`} />
          <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md border border-white/5 bg-[#11131A]/60">
             <div className={`w-16 h-16 rounded-full ${status.startsWith('Connected') ? 'bg-[#00FF9C] shadow-[0_0_40px_rgba(0,255,156,0.8)]' : status.startsWith('Disconnected') ? 'bg-[#FF4D4D] shadow-[0_0_40px_rgba(255,77,77,0.8)]' : 'bg-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.8)]'} transition-all duration-700 ease-in-out`} />
          </div>
        </div>

        <p className={`text-sm tracking-[0.2em] uppercase font-bold mb-8 transition-colors duration-500 ${status.startsWith('Connected') ? 'text-[#00FF9C] drop-shadow-[0_0_8px_rgba(0,255,156,0.8)]' : status.startsWith('Disconnected') ? 'text-[#FF4D4D] drop-shadow-[0_0_8px_rgba(255,77,77,0.8)]' : 'text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] animate-pulse'}`}>
          {status}
        </p>

        {/* Input Card */}
        <div className="w-full bg-[#11131A]/80 backdrop-blur-xl rounded-[22px] p-6 mb-8 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden">
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* SERVER IP & PORT */}
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Server IP / Host</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#00E5FF]/60 group-focus-within:text-[#00E5FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                </div>
                <input
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="e.g. 3.110.xx.yy"
                  className="w-full bg-black/30 rounded-xl border border-white/5 pl-10 pr-3 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#00E5FF]/60 focus:shadow-[0_0_15px_rgba(0,229,255,0.15)] focus:bg-black/50"
                />
              </div>
            </div>
            <div className="w-full sm:w-28 space-y-1.5">
              <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Port</label>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                inputMode="numeric"
                placeholder="51820"
                className="w-full bg-black/30 rounded-xl border border-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#2FFFEA]/60 focus:shadow-[0_0_15px_rgba(47,255,234,0.15)] focus:bg-black/50 text-center"
              />
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* CLIENT PRIVATE KEY */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Client Private Key</label>
              <button
                type="button"
                onClick={handleGenerateKeys}
                className="text-[10px] font-bold text-[#00E5FF] hover:text-white transition-colors bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 px-2 py-1 rounded border border-[#00E5FF]/30 hover:border-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.4)]"
              >
                GENERATE ON THIS DEVICE
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#2FFFEA]/60 group-focus-within:text-[#2FFFEA] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
              </div>
              <input
                value={clientPrivateKey}
                onChange={(e) => setClientPrivateKey(e.target.value)}
                placeholder="Base64 Private Key"
                className="w-full bg-black/30 rounded-xl border border-[#00E5FF]/20 pl-10 pr-3 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-[#00E5FF] focus:shadow-[0_0_20px_rgba(0,229,255,0.2)] focus:bg-black/50"
              />
            </div>
          </div>

          {/* CLIENT PUBLIC KEY */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Client Public Key</label>
            <div className="flex bg-black/20 rounded-xl border border-white/5 overflow-hidden focus-within:border-[#00E5FF]/40 transition-colors">
              <input
                value={clientPublicKey}
                readOnly
                placeholder="Generated key will appear here"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-[#A9B2C8] outline-none"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(clientPublicKey)}
                disabled={!clientPublicKey}
                className="px-4 py-3 bg-white/5 hover:bg-[#00E5FF]/20 text-xs font-bold text-[#A9B2C8] hover:text-[#00E5FF] transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:text-[#A9B2C8] border-l border-white/5"
              >
                COPY
              </button>
            </div>
          </div>

          {/* SERVER PUBLIC KEY */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Server Public Key</label>
            <div className="relative group p-[1px] rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent focus-within:via-[#00E5FF]/50 transition-all">
              <input
                value={serverPublicKey}
                onChange={(e) => setServerPublicKey(e.target.value)}
                placeholder="Base64 Server Public Key"
                className="w-full bg-[#0D1117] rounded-[11px] px-4 py-3 text-sm text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* CIDR & DNS */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">Client Address (CIDR)</label>
              <input
                value={clientAddressCidr}
                onChange={(e) => setClientAddressCidr(e.target.value)}
                placeholder="10.0.0.2/32"
                className="w-full bg-black/30 rounded-xl border border-white/5 px-4 py-3 text-sm text-[#2FFFEA] font-mono placeholder-gray-600 outline-none transition-all focus:border-[#2FFFEA]/60 focus:shadow-[0_0_15px_rgba(47,255,234,0.15)] focus:bg-black/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#A9B2C8] font-bold tracking-widest uppercase">DNS (Optional)</label>
              <input
                value={dns}
                onChange={(e) => setDns(e.target.value)}
                placeholder="1.1.1.1 (Cloudflare)"
                className="w-full bg-black/30 rounded-xl border border-white/5 px-4 py-3 text-sm text-[#A9B2C8] placeholder-gray-600/50 outline-none transition-all focus:border-[#00E5FF]/40 focus:bg-black/50"
              />
            </div>
          </div>
        </div>

        {/* PRIMARY BUTTON */}
        <button
          onClick={handleConnect}
          disabled={status.startsWith('Connecting')}
          className="w-full group relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#2FFFEA] to-[#00E5FF] p-px shadow-[0_10px_30px_rgba(0,229,255,0.3)] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none hover:shadow-[0_15px_40px_rgba(0,229,255,0.5)]"
        >
          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
          
          <div className="relative h-14 w-full bg-gradient-to-r from-[#2FFFEA]/90 to-[#00E5FF]/90 rounded-[23px] flex items-center justify-center backdrop-blur-sm group-hover:from-[#2FFFEA] group-hover:to-[#00E5FF] transition-colors">
            <span className="text-[15px] font-extrabold text-[#0D1117] tracking-[0.15em] uppercase drop-shadow-sm">
              {status.startsWith('Connected') ? 'Reconnect' : 'Connect'}
            </span>
          </div>
        </button>

      </div>
    </div>
  );
}
