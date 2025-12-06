import { useState, useEffect } from 'react';
import { MindMap } from './components/MindMap';
import { AdminPanel } from './components/AdminPanel';
import { Sidebar } from './components/Sidebar';
import { ParticlesBackground } from './components/ParticlesBackground';
import { AdminAuthDialog } from './components/AdminAuthDialog';
import { ErrorToast } from './components/ErrorToast';
import { LoadingScreen } from './components/LoadingScreen';
import { AdminControls } from './components/AdminControls';
import { useRepo } from './hooks/useRepo';
import { useDecryption } from './hooks/useDecryption';
import { useAdmin } from './hooks/useAdmin';
import { useItemActions } from './hooks/useItemActions';

function App() {
  // Repo & Config
  const {
    owner,
    repo,
    storage,
    setStorage,
    repoIndex,
    isRepoEmpty,
    appState,
    setAppState,
    error,
    setError,
    saveRepoIndex
  } = useRepo();

  // Decryption
  const {
    decryptedGroups,
    setDecryptedGroups,
    currentPassphrase,
    setCurrentPassphrase,
    decryptionStatus,
    handlePassphraseSubmit
  } = useDecryption(repoIndex);

  // Admin
  const {
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
  } = useAdmin({
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
  });

  // Item Actions
  const { handleItemActivation } = useItemActions(decryptedGroups, storage, setError);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleLogout = () => {
    setDecryptedGroups([]);
    setCurrentPassphrase('');
    setAppState('interactive');
    setError(null);
    setIsAdmin(false);
  };

  if (appState === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      <ParticlesBackground />

      {repoIndex && (
        <>
          <Sidebar
            repoName={`${owner}/${repo}`}
            groups={repoIndex.groups}
            decryptedGroups={decryptedGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            onDownloadItem={handleItemActivation}
            isAdmin={isAdmin}
            onDeleteItem={handleDeleteItem}
            onFocusNode={setFocusedNodeId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <MindMap
            repoName={`${owner}/${repo}`}
            groups={repoIndex.groups}
            decryptedGroups={decryptedGroups}
            decryptionStatus={decryptionStatus}
            onPassphraseChange={setCurrentPassphrase}
            onPassphraseSubmit={handlePassphraseSubmit}
            onItemClick={handleItemActivation}
            onGroupClick={setSelectedGroupId}
            onDeleteItem={handleDeleteItem}
            isDecrypting={Object.values(decryptionStatus).some(s => s === 'decrypting')}
            passphrase={currentPassphrase}
            isAdmin={isAdmin}
            focusedNodeId={focusedNodeId}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </>
      )}

      <AdminControls
        isAdmin={isAdmin}
        onShowAuth={() => setShowAdminAuth(true)}
        onShowPanel={() => setShowAdminPanel(true)}
        onLogout={handleLogout}
      />

      <ErrorToast message={error} />

      {isRepoEmpty && !showAdminAuth && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-40">
          <p className="text-slate-500 text-sm">Repository is empty</p>
        </div>
      )}

      <AdminAuthDialog
        isOpen={showAdminAuth}
        onClose={() => {
          setShowAdminAuth(false);
          setAdminTokenInput('');
          setError(null);
        }}
        onAuth={handleAdminAuth}
        token={adminTokenInput}
        onTokenChange={setAdminTokenInput}
        error={error}
        isRepoEmpty={isRepoEmpty}
      />

      {showAdminPanel && repoIndex && (
        <AdminPanel
          groups={repoIndex.groups}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddItem={handleAddItem}
          onClose={() => {
            setShowAdminPanel(false);
            if (isRepoEmpty) {
              setIsAdmin(false);
            }
          }}
          isInitializing={isRepoEmpty}
        />
      )}
    </div>
  );
}

export default App;
