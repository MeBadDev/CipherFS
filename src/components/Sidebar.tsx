import type { Group, DecryptedGroup, GroupItem } from '../types';

interface SidebarProps {
  repoName: string;
  groups: Group[];
  decryptedGroups: DecryptedGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onDownloadItem: (groupId: string, item: GroupItem) => void;
  onFocusNode: (nodeId: string | null) => void;
  isAdmin: boolean;
  onDeleteItem?: (groupId: string, itemId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  passphrase?: string;
  onPassphraseChange?: (passphrase: string) => void;
  onPassphraseSubmit?: () => void;
  isDecrypting?: boolean;
}

export function Sidebar({ 
  repoName, 
  groups, 
  decryptedGroups, 
  selectedGroupId, 
  onSelectGroup,
  onDownloadItem, 
  onFocusNode,
  isAdmin, 
  onDeleteItem,
  isCollapsed,
  onToggleCollapse,
  passphrase,
  onPassphraseChange,
  onPassphraseSubmit,
  isDecrypting
}: SidebarProps) {
  const getItemIcon = (type: GroupItem['type']) => {
    switch (type) {
      case 'file': return '📄';
      case 'link': return '🔗';
      case 'text': return '📝';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const unlockedCount = decryptedGroups.length;
  const totalCount = groups.length;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className={`fixed top-4 z-50 p-2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all duration-300 ${
          isCollapsed ? 'left-4' : 'left-4 sm:left-80'
        }`}
      >
        {isCollapsed ? '>' : '<'}
      </button>

      {/* Sidebar Container */}
      <div 
        className={`fixed left-0 top-0 bottom-0 w-full sm:w-80 bg-slate-900/95 backdrop-blur border-r border-slate-800 transition-transform duration-300 z-40 flex flex-col ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 pt-16 sm:pt-6 border-b border-slate-800">
          <h2 
            className="text-xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors truncate"
            onClick={() => onSelectGroup(null)} // Select Main Node
            onMouseEnter={() => onFocusNode('center')}
            onMouseLeave={() => onFocusNode(null)}
          >
            {repoName}
          </h2>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            [{unlockedCount}/{totalCount}] groups deciphered
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {selectedGroupId === null && (
            <div className="animate-fadeIn">
              <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">Root</div>
              
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded mb-6 md:hidden">
                <p className="text-sm text-slate-300 mb-3">
                  Enter passphrase to decrypt groups:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={passphrase || ''}
                    onChange={(e) => onPassphraseChange?.(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onPassphraseSubmit?.()}
                    placeholder="Passphrase..."
                    className="flex-1 bg-slate-900 border border-slate-600 text-white px-3 py-1.5 text-sm rounded focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={onPassphraseSubmit}
                    disabled={isDecrypting || !passphrase}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 text-sm rounded transition-colors"
                  >
                    {isDecrypting ? '...' : 'Go'}
                  </button>
                </div>
              </div>

              <div className="hidden md:block">
                <p className="text-sm text-slate-300 mb-3">
                  Enter passphrase in the Root Node to decrypt groups.
                </p>
              </div>
              
              <div className="mt-6">
                <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">All Groups</div>
                <div className="space-y-1">
                  {groups.map(group => {
                    const isUnlocked = decryptedGroups.some(g => g.id === group.id);
                    return (
                      <button
                        key={group.id}
                        onClick={() => onSelectGroup(group.id)}
                        onMouseEnter={() => onFocusNode(group.id)}
                        onMouseLeave={() => onFocusNode(null)}
                        className={`w-full text-left px-3 py-2 rounded text-sm font-mono flex items-center justify-between group transition-colors ${
                          selectedGroupId === group.id 
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-900' 
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{group.name}</span>
                        <span className={`text-xs ${isUnlocked ? 'text-green-500' : 'text-slate-600'}`}>
                          {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Selected Group Details */}
          {selectedGroupId && (
            <div className="animate-fadeIn">
              {(() => {
                const group = groups.find(g => g.id === selectedGroupId);
                const decryptedGroup = decryptedGroups.find(g => g.id === selectedGroupId);
                
                if (!group) return null;

                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={() => onSelectGroup(null)}
                        className="text-xs text-slate-500 hover:text-white flex items-center gap-1"
                      >
                        Back to Root
                      </button>
                      <span className={`text-xs font-mono ${decryptedGroup ? 'text-green-500' : 'text-red-500'}`}>
                        {decryptedGroup ? 'DECRYPTED' : 'ENCRYPTED'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4 wrap-break-words">{group.name}</h3>

                    {decryptedGroup ? (
                      <div className="space-y-2">
                        {decryptedGroup.items.length === 0 ? (
                          <p className="text-sm text-slate-500 italic">No items in this group.</p>
                        ) : (
                          decryptedGroup.items.map(item => (
                            <button 
                              key={item.id}
                              onMouseEnter={() => onFocusNode(item.id)}
                              onMouseLeave={() => onFocusNode(null)}
                              onClick={() => onDownloadItem(group.id, item)}
                              className="p-3 bg-slate-800 border w-full text-left cursor-pointer border-slate-700 hover:border-slate-600 transition-colors group relative"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-lg">{getItemIcon(item.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-200 text-sm truncate" title={item.name}>
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span className="capitalize">{item.type}</span>
                                    {item.size && <span>- {formatSize(item.size)}</span>}
                                  </div>
                                </div>
                                  
                              </div>
                              
                              {isAdmin && onDeleteItem && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem(group.id, item.id);
                                  }}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400"
                                  title="Delete item"
                                >
                                  [X]
                                </button>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-800/50 border border-slate-700 border-dashed rounded text-center">
                        <p className="text-sm text-slate-400 mb-2">This group is locked.</p>
                        <p className="text-xs text-slate-500">
                          Enter the passphrase in the Root Node to decrypt it.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
