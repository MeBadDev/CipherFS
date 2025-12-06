import { useState } from 'react';
import { tryDecryptGroup } from '../utils/crypto';
import type { RepoIndex, DecryptedGroup } from '../types';

export function useDecryption(repoIndex: RepoIndex | null) {
  const [decryptedGroups, setDecryptedGroups] = useState<DecryptedGroup[]>([]);
  const [currentPassphrase, setCurrentPassphrase] = useState('');
  const [decryptionStatus, setDecryptionStatus] = useState<Record<string, 'pending' | 'decrypting' | 'success' | 'failed'>>({});

  const handlePassphraseSubmit = async () => {
    const passphrase = currentPassphrase;

    if (!repoIndex || repoIndex.groups.length === 0) {
      return;
    }

    const newStatus: Record<string, 'pending' | 'decrypting' | 'success' | 'failed'> = {};
    repoIndex.groups.forEach(g => {
      // Only reset if not already successful
      if (decryptionStatus[g.id] !== 'success') {
        newStatus[g.id] = 'pending';
      } else {
        newStatus[g.id] = 'success';
      }
    });
    setDecryptionStatus(newStatus);

    const groupsToTry = repoIndex.groups.filter(g => decryptionStatus[g.id] !== 'success');

    for (let i = 0; i < groupsToTry.length; i++) {
      const group = groupsToTry[i];

      // Set to decrypting
      setDecryptionStatus(prev => ({ ...prev, [group.id]: 'decrypting' }));

      // delay for cool animation lol
      await new Promise(resolve => setTimeout(resolve, 300));

      const result = await tryDecryptGroup(
        passphrase,
        group.salt,
        group.iv,
        group.ciphertext
      );

      if (result.success && result.key && result.items) {
        setDecryptedGroups(prev => [
          ...prev.filter(g => g.id !== group.id),
          {
            id: group.id,
            name: group.name,
            items: result.items!,
            key: result.key!,
          }
        ]);
        setDecryptionStatus(prev => ({ ...prev, [group.id]: 'success' }));
      } else {
        setDecryptionStatus(prev => ({ ...prev, [group.id]: 'failed' }));
      }
    }

    // Clear passphrase after attempt
    setCurrentPassphrase('');
  };

  return {
    decryptedGroups,
    setDecryptedGroups,
    currentPassphrase,
    setCurrentPassphrase,
    decryptionStatus,
    setDecryptionStatus,
    handlePassphraseSubmit
  };
}
