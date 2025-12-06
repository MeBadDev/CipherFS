import { useState } from 'react';
import { GitHubStorage } from '../utils/github';
import { deriveKey, encryptGroupItems, generateSalt, encryptData } from '../utils/crypto';
import type { RepoIndex, Group, GroupItem, DecryptedGroup } from '../types';

interface UseAdminProps {
  owner: string;
  repo: string;
  storage: GitHubStorage | null;
  setStorage: (storage: GitHubStorage) => void;
  repoIndex: RepoIndex | null;
  saveRepoIndex: (index: RepoIndex, storageInstance?: GitHubStorage) => Promise<void>;
  isRepoEmpty: boolean;
  decryptedGroups: DecryptedGroup[];
  setDecryptedGroups: React.Dispatch<React.SetStateAction<DecryptedGroup[]>>;
  setError: (error: string | null) => void;
}

export function useAdmin({
  owner,
  repo,
  storage,
  setStorage,
  repoIndex,
  saveRepoIndex,
  isRepoEmpty,
  decryptedGroups,
  setDecryptedGroups,
  setError
}: UseAdminProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [, setAdminToken] = useState('');

  const handleAdminAuth = async () => {
    if (!adminTokenInput.trim()) {
      setError('Please enter an admin token');
      return;
    }

    try {
      const gh = new GitHubStorage(adminTokenInput, owner, repo);
      const isValid = await gh.validateToken();

      if (!isValid) {
        throw new Error('Invalid token or insufficient permissions');
      }

      setAdminToken(adminTokenInput);
      setStorage(gh);
      setIsAdmin(true);

      if (isRepoEmpty && repoIndex) {
        await saveRepoIndex(repoIndex, gh);
      }

      setShowAdminAuth(false);
      setShowAdminPanel(true);
      setError(null);
    } catch (err: any) {
      console.error('Admin auth error:', err);
      setError(err.message || 'Authentication failed');
    }
  };

  const handleCreateGroup = async (name: string, passphrase: string) => {
    if (!isAdmin || !storage || !repoIndex) return;

    try {
      const salt = await generateSalt();
      const key = await deriveKey(passphrase, salt);
      const { iv, ciphertext } = await encryptGroupItems([], key);

      const newGroup: Group = {
        id: crypto.randomUUID(),
        name,
        salt,
        iv,
        ciphertext,
        created: Date.now(),
        modified: Date.now(),
      };

      const newIndex: RepoIndex = {
        ...repoIndex,
        groups: [...repoIndex.groups, newGroup],
      };

      await saveRepoIndex(newIndex);
    } catch (err: any) {
      console.error('Create group error:', err);
      setError(err.message || 'Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!isAdmin || !storage || !repoIndex) return;

    try {
      const newIndex: RepoIndex = {
        ...repoIndex,
        groups: repoIndex.groups.filter(g => g.id !== groupId),
      };

      await saveRepoIndex(newIndex);

      // Remove from decrypted groups if present
      setDecryptedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      console.error('Delete group error:', err);
      setError(err.message || 'Failed to delete group');
    }
  };

  const handleAddItem = async (
    groupId: string,
    itemData: Omit<GroupItem, 'id' | 'created'>,
    file?: File
  ) => {
    if (!isAdmin || !storage || !repoIndex) return;

    try {
      // Find if group is decrypted
      const decryptedGroup = decryptedGroups.find(g => g.id === groupId);

      if (!decryptedGroup) {
        setError('Group must be unlocked to add items');
        return;
      }

      const newItem: GroupItem = {
        ...itemData,
        id: crypto.randomUUID(),
        created: Date.now(),
      };

      if (file) {
        // Read file
        const buffer = await file.arrayBuffer();
        
        // Encrypt file
        const { iv, ciphertext } = await encryptData(buffer, decryptedGroup.key);
        
        // Create encrypted blob
        const encryptedBlob = {
          iv,
          ciphertext,
          metadata: {
            filename: file.name,
            size: file.size,
            type: file.type
          }
        };
        
        // Upload to GitHub
        const path = `files/${newItem.id}.enc`;
        const contentBase64 = btoa(JSON.stringify(encryptedBlob));
        
        await storage.uploadFile(
          path,
          contentBase64,
          `Add file ${file.name}`
        );
        
        newItem.path = path;
      }

      const updatedItems = [...decryptedGroup.items, newItem];

      // Re-encrypt group
      const { iv, ciphertext } = await encryptGroupItems(updatedItems, decryptedGroup.key);

      // Update repo index
      const updatedGroups = repoIndex.groups.map(g => {
        if (g.id === groupId) {
          return { ...g, iv, ciphertext, modified: Date.now() };
        }
        return g;
      });

      const newIndex: RepoIndex = { ...repoIndex, groups: updatedGroups };
      await saveRepoIndex(newIndex);

      // Update local state
      setDecryptedGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, items: updatedItems } : g))
      );
    } catch (err: any) {
      console.error('Add item error:', err);
      setError(err.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (groupId: string, itemId: string) => {
    if (!isAdmin || !storage || !repoIndex) return;

    const group = decryptedGroups.find(g => g.id === groupId);
    if (!group) return;

    if (!confirm('Delete this item?')) return;

    try {
      // Remove item from decrypted group
      const updatedItems = group.items.filter(i => i.id !== itemId);

      // Re-encrypt group with updated items
      const { iv, ciphertext } = await encryptGroupItems(updatedItems, group.key);

      // Update repo index
      const updatedGroups = repoIndex.groups.map(g => {
        if (g.id === groupId) {
          return { ...g, iv, ciphertext, modified: Date.now() };
        }
        return g;
      });

      const newIndex: RepoIndex = { ...repoIndex, groups: updatedGroups };
      await saveRepoIndex(newIndex);

      // Update local state
      setDecryptedGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, items: updatedItems } : g))
      );
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete item');
    }
  };

  return {
    isAdmin,
    setIsAdmin,
    showAdminPanel,
    setShowAdminPanel,
    showAdminAuth,
    setShowAdminAuth,
    adminTokenInput,
    setAdminTokenInput,
    handleAdminAuth,
    handleCreateGroup,
    handleDeleteGroup,
    handleAddItem,
    handleDeleteItem
  };
}
