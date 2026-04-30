import { registerPlugin } from '@capacitor/core';

export interface ProxyTunnelPlugin {
  startConnection(options: { ip: string; port: number }): Promise<void>;
}

const ProxyTunnel = registerPlugin<ProxyTunnelPlugin>('ProxyTunnel');

export default ProxyTunnel;
