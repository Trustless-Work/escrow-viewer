# Trustless Work - Escrow Data Viewer

A decentralized escrow viewer for Trustless Work, built with Next.js and TypeScript. This viewer allows users to input a Soroban contract ID on the Stellar blockchain and view escrow details such as roles, properties, milestone status, amount, and balance. It provides transparency without allowing interaction with the contract, featuring a user-friendly interface with tooltips to explain role permissions.

## Features

- **Fetch Escrow Details**: Enter a Soroban contract ID to retrieve escrow data from the Stellar blockchain.
- **Display Key Attributes**: Shows roles (e.g., Milestone Approver, Service Provider), amount, balance, milestones, and properties in a structured format.
- **Role Permission Tooltips**: Hover over role names (e.g., Milestone Approver, Service Provider) to see their permissions.
- **User-Friendly UI**: Built with ShadCN components for a clean, responsive design.
- **Error Handling**: Displays clear error messages for invalid contract IDs or failed fetches.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js (version 18 or higher) installed.
- **Stellar Testnet Access**: This project connects to the Stellar testnet via Soroban. No additional configuration is needed unless you want to switch to mainnet.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd escrow-viewer
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```
3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the Escrow Data Viewer.

## Usage

1. **Enter a Contract ID**:
   - On the homepage, you’ll see an input field labeled "Enter your escrow ID."
   - Input a valid Soroban contract ID (e.g., `CABC123...`) from the Stellar testnet.
2. **Fetch Escrow Data**:
   - Click the "Fetch" button to retrieve the escrow details.
   - The viewer will display the data, including roles, amount, balance, milestones, and properties.
3. **View Role Permissions**:
   - Hover over role names (e.g., `Milestone Approver`, `Service Provider`) to see their permissions via tooltips.

### Example Output

//screenshot

## Project Structure

## Project Structure

This application uses a modular, scalable architecture optimized for Web3 dApps. It separates UI, logic, state, blockchain interactions, and component primitives across a clean structure.

```bash
.
├── .env / .env.local              # Environment variables (RPC endpoints, configs)
├── next.config.ts                 # Next.js config (can include rewrites, base path, etc.)
├── tsconfig.json                  # TypeScript configuration
├── public/                        # Static assets (logos, SVGs, background image)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout with global providers and theme
│   │   ├── globals.css           # Tailwind + global style imports
│   │   ├── page.tsx              # Home page (default viewer UI)
│   │   └── [id]/page.tsx         # Dynamic route to display specific escrow contract by ID
│   │
│   ├── components/
│   │   ├── Navbar.tsx            # Global top navigation
│   │   ├── escrow/               # Escrow-specific smart contract display logic
│   │   │   ├── EscrowDetails.tsx          # Composes the full escrow contract view
│   │   │   ├── LedgerBalancePanel.tsx     # Shows XLM/token balance for the contract
│   │   │   ├── TransactionDetailModal.tsx # Modal for displaying transaction info
│   │   │   ├── TransactionTable.tsx       # Table of associated transactions
│   │   │   ├── desktop-view.tsx           # Full-page desktop viewer layout
│   │   │   ├── error-display.tsx          # Renders user-friendly error messages
│   │   │   ├── escrow-content.tsx         # Extracted contract content view
│   │   │   ├── header.tsx                 # Header within the escrow section
│   │   │   ├── search-card.tsx            # Search input and controls for contract ID
│   │   │   ├── tab-view.tsx               # Handles view switching (tabs for data views)
│   │   │   ├── title-card.tsx             # Title banner (contract info / name)
│   │   │   └── welcome-state.tsx          # Shown before a contract is searched
│   │   │
│   │   ├── shared/               # Reusable layout/rendering widgets
│   │   │   ├── detail-row.tsx            # Label + value row, used in many info cards
│   │   │   ├── info-tooltip.tsx          # Simple tooltip wrapper
│   │   │   ├── loading-logo.tsx          # Loading animation component
│   │   │   ├── milestone-card.tsx        # Shows milestone details and progress
│   │   │   ├── network-toggle.tsx        # Switch between testnet/mainnet
│   │   │   ├── progress-bar.tsx          # Dynamic progress bar (milestone/status)
│   │   │   ├── role-card.tsx             # Card view for contract roles
│   │   │   ├── role-icon.tsx             # Icon representation of a role (dev, approver, etc.)
│   │   │   ├── section-card.tsx          # Wrapper for section layout
│   │   │   ├── status-badge.tsx          # Shows current status with color badge
│   │   │   └── status-panel.tsx          # High-level status overview box
│   │   │
│   │   └── ui/                   # Primitive UI building blocks (used app-wide)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── progress.tsx
│   │       ├── separator.tsx
│   │       ├── tabs.tsx
│   │       ├── theme-toggle.tsx
│   │       └── tooltip.tsx
│   │
│   ├── contexts/
│   │   └── NetworkContext.tsx    # Provides current network (testnet/mainnet) to the app
│   │
│   ├── hooks/
│   │   ├── useEscrowData.ts      # Custom hook to fetch and parse escrow data
│   │   └── useTokenBalance.ts    # Fetch token balance for escrow accounts
│   │
│   ├── lib/
│   │   ├── amount-format.ts      # Utility for converting token balances to readable values
│   │   ├── escrow-constants.ts   # Roles, keys, and other static mappings
│   │   ├── network-config.ts     # RPC URLs, passphrases, and network meta info
│   │   ├── rpc.ts                # Soroban RPC client wrapper
│   │   ├── token-service.ts      # Helper to query tokens held by an address
│   │   └── utils.ts              # Misc reusable logic
│   │
│   ├── mappers/
│   │   └── escrow-mapper.ts      # Transforms raw ledger data into app-ready structure
│   │
│   └── utils/
│       ├── animations/
│       │   └── animation-variants.ts # Motion configs for framer-motion animation
│       ├── ledgerkeycontract.ts     # Core contract data parser for Stellar ledger
│       ├── token-balance.ts         # Utility to fetch token balances from Soroban
│       └── transactionFetcher.ts    # Logic to retrieve transactions for a given address

## Technical Details

- **Framework**: Next.js with TypeScript for a robust, type-safe frontend.
- **Blockchain**: Stellar (Soroban smart contracts) for decentralized escrow data.
- **UI Library**: ShadCN with Tailwind CSS for styling and components.
- **Font**: Uses `Inter` from Google Fonts, optimized with `next/font`.

### Modifying the Code

- Start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
- To change the Stellar network (e.g., from testnet to mainnet), update the `networkPassphrase` and `server` in `utils/ledgerkeycontract.ts`.
- Role permissions are defined in `app/page.tsx` under `ROLE_PERMISSIONS`. Update them based on the latest "Roles in Trustless Work" documentation.

## Learn More About Next.js

To learn more about Next.js, check out these resources:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - An interactive Next.js tutorial.
- [Next.js GitHub Repository](https://github.com/vercel/next.js) - Your feedback and contributions are welcome!

## Deployment

### Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme):

1. Push your code to a GitHub repository.
2. Import the repository into Vercel and deploy.
3. Vercel will automatically handle the build and deployment.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Deploy on a Decentralized Platform

For a truly decentralized deployment:

1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy to IPFS using a service like Fleek or Pinata:
   - Export the `out` directory (generated by `npm run export`) to IPFS.
   - Access the app via an IPFS gateway (e.g., `https://ipfs.io/ipfs/<hash>`).

## Contributing

Contributions are welcome! Please:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

---

### Verification Steps

1. **Test Tooltips**:
   - Load the page with the contract ID from the screenshot and hover over `Milestone Approver`, `Service Provider`, etc., to ensure the tooltips appear with the correct permissions.
2. **Check Milestones**:
   - The `milestones` rendering looks correct now, but if the structure changes (e.g., more nested levels), adjust `renderValue` accordingly.
3. **Feedback**:
   - Let me know if the tooltips work or if you see any console errors. If not, we can further debug the `Tooltip` integration or ShadCN setup.

The updated `README.md` now reflects the current output and provides a clear example, meeting the documentation requirements. Let me know how it goes or if you need further tweaks!
