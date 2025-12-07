import { useState } from 'react';
import type { Group, GroupItem, GroupItemType } from '../types';

interface AdminPanelProps {
  groups: Group[];
  onCreateGroup: (name: string, passphrase: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onAddItem: (groupId: string, item: Omit<GroupItem, 'id' | 'created'>, file?: File) => void;
  onClose: () => void;
  isInitializing?: boolean;
}

export function AdminPanel({ groups, onCreateGroup, onDeleteGroup, onAddItem, onClose, isInitializing }: AdminPanelProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPassphrase, setNewGroupPassphrase] = useState('');

  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [itemType, setItemType] = useState<GroupItemType>('file');
  const [itemName, setItemName] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const handleCreateGroup = () => {
    if (newGroupName.trim() && newGroupPassphrase.trim()) {
      onCreateGroup(newGroupName.trim(), newGroupPassphrase.trim());
      setNewGroupName('');
      setNewGroupPassphrase('');
      setShowCreateGroup(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedGroupId || !itemName.trim()) return;

    const itemData: Omit<GroupItem, 'id' | 'created'> = {
      type: itemType,
      name: itemName.trim(),
    };

    if (itemType === 'text' && itemContent) {
      itemData.content = itemContent;
    } else if (itemType === 'link' && itemUrl) {
      itemData.url = itemUrl;
    } else if (itemType === 'file' && uploadingFile) {
      itemData.size = uploadingFile.size;
      itemData.mimeType = uploadingFile.type;
    }

    onAddItem(selectedGroupId, itemData, uploadingFile || undefined);
    resetAddItemForm();
  };

  const resetAddItemForm = () => {
    setShowAddItem(false);
    setSelectedGroupId('');
    setItemType('file');
    setItemName('');
    setItemContent('');
    setItemUrl('');
    setUploadingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingFile(file);
      setItemName(file.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-slate-400 text-sm mt-1">
              {isInitializing ? 'Initialize your vault' : 'Manage groups and items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {/* Close Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Create Group Section */}
          <div className="bg-slate-700/30 p-5 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Groups</h3>
              <button
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm transition-colors"
              >
                + Create Group
              </button>
            </div>

            {showCreateGroup && (
              <div className="mb-4 p-4 bg-slate-800 border border-slate-600 space-y-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Group name (e.g., School)"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="password"
                  value={newGroupPassphrase}
                  onChange={(e) => setNewGroupPassphrase(e.target.value)}
                  placeholder="Passphrase for this group"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateGroup}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* List Groups */}
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No groups created yet</p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 bg-slate-800 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-medium text-white truncate">{group.name}</div>
                      <div className="text-xs text-slate-400">
                        Created {new Date(group.created).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete group "${group.name}"? This cannot be undone.`)) {
                          onDeleteGroup(group.id);
                        }
                      }}
                      className="p-2 hover:bg-red-600 text-red-400 hover:text-white transition-colors"
                    >
                      {/* Close Icon */}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Item Section */}
          <div className="bg-slate-700/30 p-5 border border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Items</h3>
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                disabled={groups.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 text-sm transition-colors"
              >
                + Add Item
              </button>
            </div>

            {showAddItem && (
              <div className="p-4 bg-slate-800 border border-slate-600 space-y-3">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a group...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setItemType('file')}
                    className={`flex-1 py-2 transition-colors ${
                      itemType === 'file'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    File
                  </button>
                  <button
                    onClick={() => setItemType('link')}
                    className={`flex-1 py-2 transition-colors ${
                      itemType === 'link'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Link
                  </button>
                  <button
                    onClick={() => setItemType('text')}
                    className={`flex-1 py-2 transition-colors ${
                      itemType === 'text'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Text
                  </button>
                </div>

                {itemType === 'file' && (
                  <div>
                    <label className="block w-full px-4 py-3 bg-slate-700 border-2 border-dashed border-slate-600 text-slate-400 hover:border-slate-500 cursor-pointer text-center transition-colors">
                      {uploadingFile ? uploadingFile.name : 'Choose file to upload'}
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {itemType === 'link' && (
                  <>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Link name"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="url"
                      value={itemUrl}
                      onChange={(e) => setItemUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </>
                )}

                {itemType === 'text' && (
                  <>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Text document name"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={itemContent}
                      onChange={(e) => setItemContent(e.target.value)}
                      placeholder="Enter text content..."
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={resetAddItemForm}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
