"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/shared/info-tooltip";
import {
  Zap,
  AlertCircle
} from "lucide-react";
import {
  type EventMetadata,
} from "@/utils/transactionFetcher";

interface EventTableProps {
  events: EventMetadata[];
  loading: boolean;
  error?: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  isMobile: boolean;
}

export const EventTable: React.FC<EventTableProps> = ({
  events,
  loading,
  error,
  hasMore,
  onLoadMore,
  isMobile,
}) => {
  const getEventTypeColor = () => {
    return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700/40";
  };

  if (loading && events.length === 0) {
    return (
      <div className="w-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-[#BFEFFD]">Recent Contract Events</h3>
            <InfoTooltip content="Recent contract events fetched from Soroban RPC. Events are emitted by smart contracts and show important state changes." />
          </div>
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-600 dark:text-[#6fbfe6]">Loading contract events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-[#BFEFFD]">Recent Contract Events</h3>
          </div>
          <div className="flex items-center gap-2 text-red-600 py-6 bg-red-50 rounded-lg px-4 dark:bg-red-900/25">
            <AlertCircle className="h-5 w-5" />
            <span className="dark:text-red-200">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-[#BFEFFD]">Recent Contract Events</h3>
          <InfoTooltip content="Recent contract events emitted by this escrow contract. Shows milestones, releases, disputes, and other contract activities." />
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-[#6fbfe6]">Last 7 days (RPC-limited)</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-[#BFEFFD] mb-2">No Contract Events Found</h4>
            <p className="text-sm text-gray-600 dark:text-[#6fbfe6] max-w-md mx-auto">
              This contract has not emitted any events in the last 7 days, or events are not yet available via RPC.
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-[#6fbfe6]">
              <p>Note: Contract events are only available for the last ~7 days due to RPC retention limits.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {isMobile ? (
              // Mobile: Card layout
              <div className="space-y-3">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl p-4 hover:shadow-md hover:bg-white/80 cursor-pointer transition-all duration-200 dark:bg-[#070708] dark:border-[rgba(255,255,255,0.04)] dark:hover:bg-[#0b1115]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-mono text-sm text-purple-600 font-medium">
                            Event {event.id}
                          </span>
                        </div>
                        <Badge className={getEventTypeColor()}>
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-[#6fbfe6]">
                          <span className="font-medium">Ledger:</span>
                          <span>{event.ledger.toLocaleString()}</span>
                        </div>
                      </div>
                      {event.topics.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-[#BFEFFD]">Topics:</span>
                          <div className="mt-1 space-y-1">
                            {event.topics.slice(0, 2).map((topic, idx) => (
                              <div key={idx} className="font-mono text-xs bg-gray-100 dark:bg-[#0b1115] px-2 py-1 rounded">
                                {topic.length > 20 ? `${topic.substring(0, 20)}...` : topic}
                              </div>
                            ))}
                            {event.topics.length > 2 && (
                              <div className="text-xs text-gray-500">+{event.topics.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      )}
                      {event.value && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-[#BFEFFD]">Value:</span>
                          <div className="font-mono text-xs bg-gray-100 dark:bg-[#0b1115] px-2 py-1 rounded mt-1 break-all">
                            {event.value.length > 50 ? `${event.value.substring(0, 50)}...` : event.value}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Desktop: Table layout
              <div className="overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200 dark:bg-[#080809] dark:border-[rgba(255,255,255,0.04)]">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-[#BFEFFD] text-sm">
                          Event ID
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-[#BFEFFD] text-sm">
                          Type
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-[#BFEFFD] text-sm">
                          Ledger
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-[#BFEFFD] text-sm">
                          Topics
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-[#BFEFFD] text-sm">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {events.map((event, index) => (
                        <motion.tr
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-purple-50/50 cursor-pointer transition-all duration-200 group dark:hover:bg-[#081014]/40"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <span className="font-mono text-sm text-purple-600 group-hover:text-purple-700 font-medium">
                                {event.id}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getEventTypeColor()}>
                              {event.type}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-[#BFEFFD]">
                            {event.ledger.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {event.topics.length > 0 ? (
                              <div className="space-y-1">
                                {event.topics.slice(0, 1).map((topic, idx) => (
                                  <div key={idx} className="font-mono text-xs bg-gray-100 dark:bg-[#0b1115] px-2 py-1 rounded max-w-xs truncate">
                                    {topic}
                                  </div>
                                ))}
                                {event.topics.length > 1 && (
                                  <div className="text-xs text-gray-500">+{event.topics.length - 1} more</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {event.value ? (
                              <div className="font-mono text-xs bg-gray-100 dark:bg-[#0b1115] px-2 py-1 rounded max-w-xs truncate">
                                {event.value}
                              </div>
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-6">
                <Button
                  onClick={onLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white border-purple-200 text-purple-600 hover:text-purple-700 px-6 py-2 dark:bg-[#070708] dark:border-[rgba(255,255,255,0.04)] dark:text-[#BFEFFD]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Events
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};