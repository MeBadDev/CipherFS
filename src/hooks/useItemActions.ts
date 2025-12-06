import { decryptData } from '../utils/crypto';
import { GitHubStorage } from '../utils/github';
import type { DecryptedGroup, GroupItem } from '../types';

export function useItemActions(
  decryptedGroups: DecryptedGroup[],
  storage: GitHubStorage | null,
  setError: (error: string | null) => void
) {
  const handleItemActivation = async (groupId: string, item: GroupItem) => {
    const group = decryptedGroups.find(g => g.id === groupId);
    if (!group || !storage) return;

    try {
      if (item.type === 'link' && item.url) {
        window.open(item.url, '_blank');
        return;
      }

      if (item.type === 'text' && item.content) {
        // Download text content as .txt file
        // TODO: in-website viewer instead of download
        const blob = new Blob([item.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      if (item.type === 'file' && item.path) {
        // Fetch encrypted file from GitHub
        const fileData = await storage.getFile(item.path);
        if (!fileData) throw new Error('File not found');

        const encryptedBlob = JSON.parse(atob(fileData.content));
        const decryptedBuffer = await decryptData(
          encryptedBlob.iv,
          encryptedBlob.ciphertext,
          group.key
        );

        const blob = new Blob([decryptedBuffer], { type: item.mimeType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download item');
    }
  };

  return { handleItemActivation };
}
