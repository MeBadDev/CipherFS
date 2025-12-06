import React from 'react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading vault...</p>
      </div>
    </div>
  );
}
