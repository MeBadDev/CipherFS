import React from 'react';

interface AdminControlsProps {
  isAdmin: boolean;
  onShowAuth: () => void;
  onShowPanel: () => void;
  onLogout: () => void;
}

export function AdminControls({
  isAdmin,
  onShowAuth,
  onShowPanel,
  onLogout
}: AdminControlsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {!isAdmin && (
        <button
          onClick={onShowAuth}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm border border-slate-700 transition-colors"
        >
          Admin
        </button>
      )}
      {isAdmin && (
        <>
          <button
            onClick={onShowPanel}
            className="px-3 py-1 bg-green-900 hover:bg-green-800 text-green-400 text-sm border border-green-800 transition-colors"
          >
            Panel
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-900 hover:bg-red-800 text-red-400 text-sm border border-red-800 transition-colors"
          >
            Lock
          </button>
        </>
      )}
    </div>
  );
}
