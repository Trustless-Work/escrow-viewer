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

/**
 * Generates a Stellar Lab URL for the contract explorer
 * 
 * Stellar Lab URL format:
 * https://lab.stellar.org/smart-contracts/contract-explorer?
 *   $=network
 *   &id={network}
 *   &label={networkLabel}
 *   &horizonUrl={horizonUrl}
 *   &rpcUrl={rpcUrl}
 *   &passphrase={urlEncodedPassphrase}
 *   &smartContracts$explorer$contractId={contractId}
 * 
 * Note: We manually construct the URL string instead of using URLSearchParams
 * because Stellar Lab requires dollar signs ($) to remain unencoded in the
 * parameter names (e.g., smartContracts$explorer$contractId), and the passphrase
 * should only be encoded once, not double-encoded.
 * 
 * @param network - The network type (testnet or mainnet)
 * @param contractId - The contract ID to open in Stellar Lab
 * @returns The complete Stellar Lab URL
 */
export function getStellarLabUrl(network: NetworkType, contractId: string): string {
  // CONTRACT ID IS REQUIRED - throw error if not provided
  if (!contractId || typeof contractId !== 'string' || contractId.trim() === '') {
    throw new Error(`getStellarLabUrl: contractId is required but was: ${JSON.stringify(contractId)}`);
  }
  
  const config = getNetworkConfig(network);
  const trimmedContractId = contractId.trim();
  
  // Base URL for Stellar Lab contract explorer
  const baseUrl = 'https://lab.stellar.org/smart-contracts/contract-explorer';
  
  // Stellar Lab uses specific RPC endpoints
  // Mainnet uses Ankr RPC, testnet uses official Stellar endpoint
  // Note: URLs use double slashes (https:////) as required by Stellar Lab
  const labRpcUrl = network === 'testnet' 
    ? 'https:////soroban-testnet.stellar.org'
    : 'https:////rpc.ankr.com//stellar_soroban';
  
  // Horizon URLs also use double slashes
  const labHorizonUrl = network === 'testnet'
    ? 'https:////horizon-testnet.stellar.org'
    : 'https:////horizon.stellar.org';
  
  // URL encode individual values (but not the parameter names with $)
  // The passphrase format includes /; before the date and trailing semicolon
  // Note: The trailing semicolon in passphrase becomes %3B when encoded
  let encodedPassphrase: string;
  if (network === 'mainnet') {
    // Mainnet passphrase: "Public Global Stellar Network /; September 2015;"
    // When encoded: "Public%20Global%20Stellar%20Network%20/;%20September%202015;"
    // The /; stays as /; (not encoded), the trailing ; becomes part of the encoded value
    encodedPassphrase = encodeURIComponent('Public Global Stellar Network /; September 2015;');
  } else {
    // Testnet passphrase: "Test SDF Network /; September 2015;"
    encodedPassphrase = encodeURIComponent('Test SDF Network /; September 2015;');
  }
  
  const encodedLabel = encodeURIComponent(config.name);
  
  // Stellar Lab URL format uses $=network$id={network} (no & between $=network and id)
  // Passphrase ends with ; (encoded as %3B), then &, then contract ID, then ;; at the very end
  // CONTRACT ID IS REQUIRED - always include it
  const params: string[] = [
    `$=network$id=${network}`, // Special format: $=network$id (no & separator)
    `label=${encodedLabel}`,
    `horizonUrl=${labHorizonUrl}`, // Double slashes preserved
    `rpcUrl=${labRpcUrl}`, // Double slashes preserved
    `passphrase=${encodedPassphrase}`, // Ends with ; (encoded as %3B)
    `smartContracts$explorer$contractId=${trimmedContractId}`, // Dollar signs must remain unencoded - REQUIRED
  ];
  
  const queryString = params.join('&') + ';;'; // Trailing ;; at the very end
  const finalUrl = `${baseUrl}?${queryString}`;
  
  return finalUrl;
} 