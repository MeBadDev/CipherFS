import React from 'react';

interface AdminAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: () => void;
  token: string;
  onTokenChange: (token: string) => void;
  error: string | null;
  isRepoEmpty: boolean;
}

export function AdminAuthDialog({
  isOpen,
  onClose,
  onAuth,
  token,
  onTokenChange,
  error,
  isRepoEmpty
}: AdminAuthDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-white mb-2">Admin Authentication</h2>
        {isRepoEmpty && (
          <p className="text-slate-400 text-sm mb-4">
            Initialize this repository with your GitHub token
          </p>
        )}
        <input
          type="password"
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="GitHub Personal Access Token"
          onKeyDown={(e) => e.key === 'Enter' && onAuth()}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAuth}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 transition-colors"
          >
            {isRepoEmpty ? 'Initialize' : 'Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
}
