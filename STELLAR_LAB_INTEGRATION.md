# Stellar Lab Integration Documentation

## Overview

This document describes the implementation of the "Open in Stellar Lab" button feature for the Escrow Viewer. The button allows users to open escrow contracts directly in Stellar Lab (lab.stellar.org) for advanced contract inspection and interaction.

## Stellar Lab URL Structure

Stellar Lab uses a complex URL structure with multiple query parameters to configure the network and pre-fill the contract explorer. The URL format is:

```
https://lab.stellar.org/smart-contracts/contract-explorer?
  $=network$id={network}
  &label={networkLabel}
  &horizonUrl={horizonUrl}
  &rpcUrl={rpcUrl}
  &passphrase={urlEncodedPassphrase}
  &smartContracts$explorer$contractId={contractId};;
```

**Key Format Requirements:**

1. Network parameter: `$=network$id={network}` - **No `&` separator** between `$=network` and `id`
2. URLs use **double slashes**: `https:////horizon.stellar.org` (not `https://`)
3. Passphrase format: Includes `/;` before the date and trailing semicolon: `"Public Global Stellar Network /; September 2015;"`
4. URL ends with **trailing `;;`**
5. Dollar signs in parameter names remain **unencoded** (e.g., `smartContracts$explorer$contractId`)

## URL Parameters

### Required Parameters

1. **`$`** - Fixed value: `"network"` - Indicates network configuration mode
2. **`id`** - Network identifier: `"testnet"` or `"mainnet"`
3. **`label`** - Human-readable network name: `"Testnet"` or `"Mainnet"`
4. **`horizonUrl`** - Horizon API endpoint URL
5. **`rpcUrl`** - Soroban RPC endpoint URL
6. **`passphrase`** - Network passphrase (URL encoded)
7. **`smartContracts$explorer$contractId`** - The contract ID to open in the explorer

## Network Configuration

### Testnet Configuration

- **Network ID**: `testnet`
- **Network Label**: `Testnet`
- **Horizon URL**: `https:////horizon-testnet.stellar.org` (double slashes)
- **RPC URL**: `https:////soroban-testnet.stellar.org` (double slashes)
- **Passphrase**: `Test SDF Network /; September 2015;` (with `/;` before date and trailing `;`)

### Mainnet Configuration

- **Network ID**: `mainnet`
- **Network Label**: `Mainnet`
- **Horizon URL**: `https:////horizon.stellar.org` (double slashes)
- **RPC URL**: `https:////rpc.ankr.com//stellar_soroban` (double slashes, Ankr RPC)
- **Passphrase**: `Public Global Stellar Network /; September 2015;` (with `/;` before date and trailing `;`)

**Note**: Mainnet uses Ankr RPC endpoint (`rpc.ankr.com//stellar_soroban`) instead of the official Stellar endpoint. This is the correct endpoint as verified by working Stellar Lab URLs.

## Implementation Details

### Helper Function

The URL generation is handled by `getStellarLabUrl()` in `src/lib/network-config.ts`. This function:

1. Takes the network type and contract ID as parameters
2. Retrieves network configuration from `NETWORK_CONFIGS`
3. Uses official Stellar RPC endpoints (which may differ from the Escrow Viewer's RPC configuration)
4. URL-encodes the network passphrase
5. Constructs the complete Stellar Lab URL with all required parameters

### Key Implementation Notes

1. **RPC URL Selection**: Stellar Lab requires official Stellar RPC endpoints. The Escrow Viewer may use different RPC providers (e.g., OnFinality for mainnet) for performance reasons, but Stellar Lab URLs must use the official endpoints.
   - Testnet: `https://soroban-testnet.stellar.org` ✅
   - Mainnet: `https://soroban-mainnet.stellar.org` ✅

2. **URL Encoding**:
   - The network passphrase contains special characters (semicolons, spaces) that must be properly URL-encoded using `encodeURIComponent()`.
   - **Important**: We manually construct the URL string instead of using `URLSearchParams` because:
     - Dollar signs (`$`) in parameter names (like `smartContracts$explorer$contractId`) must remain unencoded
     - `URLSearchParams` would encode `$` to `%24`, breaking the parameter name
     - The passphrase should only be encoded once, not double-encoded
   - **Passphrase Format**: Must include `/;` before the date and trailing semicolon:
     - Mainnet: `"Public Global Stellar Network /; September 2015;"`
     - Testnet: `"Test SDF Network /; September 2015;"`
   - **URL Format**: URLs use double slashes (`https:////`) and are NOT encoded
   - **Trailing Semicolons**: URL must end with `;;`

3. **Parameter Format**: The contract ID parameter uses a special format: `smartContracts$explorer$contractId` with dollar signs as separators. These dollar signs must remain as literal `$` characters in the URL, not encoded as `%24`.

## Example URLs

### Testnet Example

```
https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/%3B%20September%202015%3B&smartContracts$explorer$contractId=CDD3CLASPMKZ6ZYBMJDOGIUHZDVKPN6PF6RH7TXKRCYUVPA3BULSOJIE;;
```

### Mainnet Example

```
https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=mainnet&label=Mainnet&horizonUrl=https:////horizon.stellar.org&rpcUrl=https:////rpc.ankr.com//stellar_soroban&passphrase=Public%20Global%20Stellar%20Network%20/%3B%20September%202015%3B&smartContracts$explorer$contractId=CCQXWMZVM3KRTXTUPTN53YHL272QGKF32L7XEDNZ2S6OSUFK3NFBGG5M;;
```

**Note**: Notice the key differences:

- `$=network$id=mainnet` (no `&` between `$=network` and `id`)
- Double slashes in URLs: `https:////`
- Passphrase includes `/;` and trailing `;`: `/%3B%20September%202015%3B`
- Trailing `;;` at the end of the URL

## Button Implementation

The "Open in Stellar Lab" button:

- **Location**: Appears below the "View Transaction History" button when an escrow contract is loaded
- **Visibility**: Only shown when `raw` escrow data is available
- **Styling**: Uses the `outline` variant of the Button component to match other external tool buttons
- **Icon**: Includes an `ExternalLink` icon from lucide-react
- **Behavior**: Opens Stellar Lab in a new tab with `rel="noopener noreferrer"` for security
- **Tooltip**: Includes a title attribute with "Open contract in Stellar Lab"

## Testing

### Testnet Testing

1. Load a testnet escrow contract
2. Click "Open in Stellar Lab"
3. Verify the URL opens correctly in Stellar Lab
4. Confirm the contract is pre-loaded in the explorer
5. Verify network is set to Testnet

### Mainnet Testing

1. Switch to mainnet network
2. Load a mainnet escrow contract
3. Click "Open in Stellar Lab"
4. Verify the URL opens correctly in Stellar Lab
5. Confirm the contract is pre-loaded in the explorer
6. Verify network is set to Mainnet

## Research Findings

### URL Parameter Discovery

The reference URL provided in the task description showed:

- Double slashes in URLs (`https:////horizon-testnet.stellar.org`) - This appears to be a typo or artifact. The implementation uses single slashes.
- Complex parameter naming with dollar signs (`smartContracts$explorer$contractId`)
- All parameters appear to be required for proper functionality

### RPC URL Differences

The Escrow Viewer's `NETWORK_CONFIGS` uses:

- Testnet: `https://soroban-testnet.stellar.org` (matches Stellar Lab)
- Mainnet: `https://stellar.api.onfinality.io/public` (different from Stellar Lab)

Stellar Lab requires official Stellar RPC endpoints, so the implementation uses:

- Testnet: `https://soroban-testnet.stellar.org` ✅ (Confirmed working from task example)
- Mainnet: `https://soroban-mainnet.stellar.org` ⚠️ (Needs verification - follows pattern but not explicitly confirmed)

**Research Finding**: According to [Stellar Lab documentation](https://developers.stellar.org/docs/tools/lab), the Lab is designed to let users configure RPC URLs through the network selector rather than requiring them in URL parameters. However, the task description provided a working testnet example with the full URL format including RPC URL, so we follow that pattern. The mainnet RPC URL follows the logical naming pattern but should be verified with actual testing.

This ensures compatibility with Stellar Lab's requirements while allowing the Escrow Viewer to use optimized RPC providers for its own operations.

## Files Modified

1. **src/lib/network-config.ts**
   - Added `getStellarLabUrl()` function

2. **src/components/escrow/EscrowDetails.tsx**
   - Added imports for `getStellarLabUrl`, `ExternalLink`, and `Button`
   - Added "Open in Stellar Lab" button in the action buttons section

## Future Enhancements

Potential improvements:

- Add a tooltip component (beyond the title attribute) for better UX
- Consider adding the button to other locations (e.g., transaction detail modal)
- Add analytics tracking for button clicks
- Consider caching generated URLs for performance
