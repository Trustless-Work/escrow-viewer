export type NetworkType = 'testnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  horizonUrl: string;
  networkPassphrase: string;
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015'
  },
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://stellar.api.onfinality.io/public',
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015'
  }
};

export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

export function getDefaultNetwork(): NetworkType {
  return 'testnet';
} 