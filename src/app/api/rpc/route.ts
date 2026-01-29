import { NextRequest, NextResponse } from 'next/server';
import { getNetworkConfig } from '@/lib/network-config';

export async function POST(request: NextRequest) {
  try {
    const { network, ...body } = await request.json();

    if (!network || !['testnet', 'mainnet'].includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const networkConfig = getNetworkConfig(network as 'testnet' | 'mainnet');

    const response = await fetch(networkConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `RPC error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}