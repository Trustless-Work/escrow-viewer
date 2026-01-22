import { useState, useEffect, useCallback } from 'react';
import { SorobanRpc } from '@stellar/stellar-sdk';
import { getNetworkConfig, type NetworkType } from '@/lib/network-config';

export interface ContractEvent {
  id: string;
  type: string;
  ledger: number;
  contractId: string;
  topics: string[]; // base64 or decoded
  value: string; // base64 or decoded
}

export interface UseRecentEventsResult {
  events: ContractEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRecentEvents(
  contractId: string,
  network: NetworkType
): UseRecentEventsResult {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!contractId) return;

    setLoading(true);
    setError(null);

    try {
      const config = getNetworkConfig(network);
      const server = new SorobanRpc.Server(config.rpcUrl);

      // Get latest ledger
      const latestLedger = await server.getLatestLedger();
      const endLedger = latestLedger.sequence;

      // Approximate 7 days: ~5 seconds per ledger, 7*24*3600/5 ≈ 12096
      const sevenDaysLedgers = Math.floor((7 * 24 * 3600) / 5);
      const startLedger = Math.max(1, endLedger - sevenDaysLedgers);

      const response = await server.getEvents({
        startLedger,
        filters: [
          {
            contractIds: [contractId],
            type: 'contract',
          },
        ],
        limit: 100, // reasonable limit
      });

      // Map to our interface
      const mappedEvents: ContractEvent[] = response.events.map((event) => ({
        id: event.id,
        type: event.type,
        ledger: event.ledger,
        contractId: event.contractId,
        topics: event.topic.map((topic) => topic.toString('base64')), // keep as base64 for now
        value: event.value.toString('base64'), // keep as base64
      }));

      // Sort by ledger descending (most recent first)
      mappedEvents.sort((a, b) => b.ledger - a.ledger);

      setEvents(mappedEvents);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent events');
    } finally {
      setLoading(false);
    }
  }, [contractId, network]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
}