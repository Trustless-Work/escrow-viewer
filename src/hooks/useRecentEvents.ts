import { useState, useEffect, useCallback } from 'react';
import { type NetworkType } from '@/lib/network-config';

export interface ContractEvent {
  id: string;
  type: string;
  ledger: number;
  contractId?: string;
  topics: string[]; // base64
  value: string; // base64
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
      // Get latest ledger
      const latestLedgerResponse = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          jsonrpc: '2.0',
          id: 1,
          method: 'getLatestLedger',
        }),
      });

      if (!latestLedgerResponse.ok) {
        throw new Error('Failed to get latest ledger');
      }

      const latestLedgerData = await latestLedgerResponse.json();
      const endLedger = latestLedgerData.result.sequence;

      // Approximate 7 days: ~5 seconds per ledger, 7*24*3600/5 ≈ 12096
      const sevenDaysLedgers = Math.floor((7 * 24 * 3600) / 5);
      const startLedger = Math.max(1, endLedger - sevenDaysLedgers);

      // Get events
      const eventsResponse = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          jsonrpc: '2.0',
          id: 2,
          method: 'getEvents',
          params: {
            startLedger,
            filters: [
              {
                contractIds: [contractId],
                type: 'contract',
              },
            ],
            limit: 100,
          },
        }),
      });

      if (!eventsResponse.ok) {
        throw new Error('Failed to get events');
      }

      const eventsData = await eventsResponse.json();

      if (eventsData.error) {
        throw new Error(eventsData.error.message || 'Failed to fetch events');
      }

      // Map to our interface
      const mappedEvents: ContractEvent[] = (eventsData.result?.events || []).map((event: {
        id: string;
        type: string;
        ledger: number;
        contractId?: string;
        topic: string[];
        value: string;
      }) => ({
        id: event.id,
        type: event.type,
        ledger: event.ledger,
        contractId: event.contractId,
        topics: event.topic,
        value: event.value,
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