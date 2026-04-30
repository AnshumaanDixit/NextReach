import { registerPlugin } from '@capacitor/core';

export type ProxyTunnelStartOptions = {
  /** WireGuard server public IP / hostname */
  ip: string;
  /** WireGuard server UDP port */
  port: number;
  /** This device's WireGuard private key (base64) */
  clientPrivateKey: string;
  /** Server's WireGuard public key (base64) */
  serverPublicKey: string;
  /** Client address CIDR (must be unique per device), e.g. "10.0.0.2/32" */
  clientAddressCidr?: string;
  /** DNS server for the tunnel, e.g. "1.1.1.1" */
  dns?: string;
  /** MTU for tunnel interface */
  mtu?: number;
};

export interface ProxyTunnelPlugin {
  startConnection(options: ProxyTunnelStartOptions): Promise<void>;
  generateKeypair(): Promise<{ privateKey: string; publicKey: string }>;
}

const ProxyTunnel = registerPlugin<ProxyTunnelPlugin>('ProxyTunnel');

export default ProxyTunnel;
