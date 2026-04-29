'use client';

import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import ProxyTunnel from '@/lib/plugins/ProxyTunnel';

export default function Home() {
  const [status, setStatus] = useState<string>('Disconnected');
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });

  const handleConnect = async () => {
    try {
      setStatus('Fetching location...');
      
      // Request permissions and fetch location
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          setStatus('Permission denied. Disconnected.');
          return;
        }
      }

      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      setCoords({ lat, lng });
      setStatus('Finding best server...');

      // Connect to the backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/optimal-server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch optimal server');
      }

      const data = await response.json();
      const { proxyIp, port } = data;

      setStatus(`Connected to ${proxyIp}`);

      // Start Capacitor Native connection
      await ProxyTunnel.startConnection({ ip: proxyIp });
      
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

        <div className="w-full bg-black/40 rounded-xl p-4 mb-8 border border-white/5 font-mono text-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">LATITUDE:</span>
            <span className="text-white font-medium">{coords.lat !== null ? coords.lat.toFixed(6) : '---'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">LONGITUDE:</span>
            <span className="text-white font-medium">{coords.lng !== null ? coords.lng.toFixed(6) : '---'}</span>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={status.startsWith('Fetching') || status.startsWith('Finding')}
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
