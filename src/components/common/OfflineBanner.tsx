import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    setSimulatedOffline,
    pendingOfflineCount,
    syncOfflineQueue,
  } = useRestaurant();

  return (
    <>
      {/* Persistent Offline Notice when disconnected */}
      {!isOnline && (
        <div className="bg-amber-600/90 text-neutral-950 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md z-40 transition-all">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-bounce" />
            <span>
              <strong>Offline Mode Active:</strong> Restaurant operations running uninterrupted on local cache.
              {pendingOfflineCount > 0 && ` (${pendingOfflineCount} order(s) waiting to sync)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pendingOfflineCount > 0 && (
              <button
                onClick={syncOfflineQueue}
                className="flex items-center gap-1 bg-neutral-950/20 hover:bg-neutral-950/30 text-neutral-950 px-2 py-1 rounded text-xs font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Sync Now
              </button>
            )}
            <button
              onClick={() => setSimulatedOffline(false)}
              className="underline text-xs hover:text-neutral-900 ml-2"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Floating Offline Simulator Toggle Widget */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setSimulatedOffline(!isSimulatedOffline)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-md border transition-all ${
            isSimulatedOffline
              ? 'bg-red-500/90 border-red-400 text-white animate-pulse'
              : 'bg-neutral-900/80 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
          }`}
          title="Toggle Network Outage Simulation to test offline resilience"
        >
          {isSimulatedOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-white" />
              <span>Simulating Outage (Offline)</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Network Online (Test Outage)</span>
              <span className="sm:hidden">Online</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
