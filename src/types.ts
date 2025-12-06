export interface EncryptedBlob {
  iv: string;
  ciphertext: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  filename: string;
  size: number;
  type: string;
  isURL?: boolean;
  url?: string;
}

export interface IndexEntry {
  id: string;
  path: string;
  uploaded: number;
  metadata: FileMetadata;
}

export type IndexFile = IndexEntry[];

export interface EncryptedIndex {
  salt: string;
  iv: string;
  ciphertext: string;
}

// New multi-group types
export type GroupItemType = 'file' | 'link' | 'text';

export interface GroupItem {
  id: string;
  type: GroupItemType;
  name: string;
  content?: string; // For text items
  url?: string; // For link items
  path?: string; // For file items (path in repo)
  size?: number; // For files
  mimeType?: string; // For files
  created: number;
}

export interface Group {
  id: string;
  name: string;
  salt: string; // Each group has its own salt
  iv: string;
  ciphertext: string; // Encrypted array of GroupItem[]
  created: number;
  modified: number;
}

export interface DecryptedGroup {
  id: string;
  name: string;
  items: GroupItem[];
  key: CryptoKey;
}

export interface RepoIndex {
  version: string;
  groups: Group[];
}
