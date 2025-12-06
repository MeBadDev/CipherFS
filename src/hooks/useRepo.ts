import { useState, useEffect, useCallback } from 'react';
import { GitHubStorage } from '../utils/github';
import { loadConfig } from '../utils/config';
import type { RepoIndex } from '../types';

export type AppState = 'loading' | 'interactive' | 'admin-init';

export function useRepo() {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [storage, setStorage] = useState<GitHubStorage | null>(null);
  const [repoIndex, setRepoIndex] = useState<RepoIndex | null>(null);
  const [isRepoEmpty, setIsRepoEmpty] = useState(false);
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchRepoIndex = useCallback(async (ownerName: string, repoName: string, token?: string) => {
    try {
      const gh = new GitHubStorage(token, ownerName, repoName);
      setStorage(gh);

      const indexFile = await gh.getFile('vault-index.json');

      if (indexFile) {
        const index: RepoIndex = JSON.parse(atob(indexFile.content));
        setRepoIndex(index);
        setIsRepoEmpty(false);
        setAppState('interactive');
      } else {
        // Assume repo is empty since vault-index.json does not exist
        // TODO: verify that repo is actually empty
        setRepoIndex({ version: '2.0', groups: [] });
        setIsRepoEmpty(true);
        setAppState('interactive');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch repository');
      setAppState('interactive');
    }
  }, []);

  const saveRepoIndex = useCallback(async (index: RepoIndex, storageInstance?: GitHubStorage) => {
    const gh = storageInstance || storage;
    if (!gh) throw new Error('Storage not initialized');

    const contentBase64 = btoa(JSON.stringify(index, null, 2));

    // Get current SHA for update
    const currentFile = await gh.getFile('vault-index.json');
    const sha = currentFile?.sha;

    await gh.uploadFile(
      'vault-index.json',
      contentBase64,
      'Update vault index',
      sha
    );

    setRepoIndex(index);
  }, [storage]);

  useEffect(() => {
    const init = async () => {
      try {
        const config = await loadConfig();
        if (config.owner && config.repo) {
          setOwner(config.owner);
          setRepo(config.repo);
          await fetchRepoIndex(config.owner, config.repo);
        } else {
          setError('Repository not configured in config.yaml');
          setAppState('interactive');
        }
      } catch (err: any) {
        console.error('Init error:', err);
        setError(err.message || 'Failed to initialize');
        setAppState('interactive');
      }
    };
    init();
  }, [fetchRepoIndex]);

  return {
    owner,
    repo,
    storage,
    setStorage,
    repoIndex,
    setRepoIndex,
    isRepoEmpty,
    appState,
    setAppState,
    error,
    setError,
    fetchRepoIndex,
    saveRepoIndex
  };
}
