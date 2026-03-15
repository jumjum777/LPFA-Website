'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileItem {
  id: string;
  name: string;
  folder: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface FolderNode {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(mime: string | null, name: string): { icon: string; color: string } {
  if (!mime) {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { icon: 'fas fa-file-pdf', color: '#EF4444' };
    if (['doc', 'docx'].includes(ext || '')) return { icon: 'fas fa-file-word', color: '#2563EB' };
    if (['xls', 'xlsx'].includes(ext || '')) return { icon: 'fas fa-file-excel', color: '#059669' };
    if (['ppt', 'pptx'].includes(ext || '')) return { icon: 'fas fa-file-powerpoint', color: '#D97706' };
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return { icon: 'fas fa-file-image', color: '#7C3AED' };
    return { icon: 'fas fa-file', color: '#64748B' };
  }
  if (mime.startsWith('image/')) return { icon: 'fas fa-file-image', color: '#7C3AED' };
  if (mime === 'application/pdf') return { icon: 'fas fa-file-pdf', color: '#EF4444' };
  if (mime.includes('word') || mime.includes('document')) return { icon: 'fas fa-file-word', color: '#2563EB' };
  if (mime.includes('sheet') || mime.includes('excel')) return { icon: 'fas fa-file-excel', color: '#059669' };
  if (mime.includes('presentation') || mime.includes('powerpoint')) return { icon: 'fas fa-file-powerpoint', color: '#D97706' };
  return { icon: 'fas fa-file', color: '#64748B' };
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isImage(mime: string | null, name: string): boolean {
  if (mime?.startsWith('image/')) return true;
  const ext = name.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
}

function buildFolderTree(files: FileItem[]): FolderNode[] {
  const folderCounts: Record<string, number> = {};
  files.forEach(f => {
    folderCounts[f.folder] = (folderCounts[f.folder] || 0) + 1;
  });

  const allPaths = new Set(Object.keys(folderCounts));
  Object.keys(folderCounts).forEach(p => {
    const parts = p.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      const parent = '/' + parts.slice(0, i).join('/');
      allPaths.add(parent);
    }
  });

  const root: FolderNode[] = [];
  const nodeMap: Record<string, FolderNode> = {};

  const sorted = Array.from(allPaths).sort();
  sorted.forEach(path => {
    const parts = path.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || '/';
    const node: FolderNode = { name, path, count: folderCounts[path] || 0, children: [] };
    nodeMap[path] = node;

    if (parts.length <= 1) {
      root.push(node);
    } else {
      const parentPath = '/' + parts.slice(0, -1).join('/');
      if (nodeMap[parentPath]) {
        nodeMap[parentPath].children.push(node);
      } else {
        root.push(node);
      }
    }
  });

  return root;
}

function getTotalSize(files: FileItem[]): string {
  const total = files.reduce((sum, f) => sum + (f.file_size || 0), 0);
  if (total < 1024) return total + ' B';
  if (total < 1024 * 1024) return (total / 1024).toFixed(1) + ' KB';
  if (total < 1024 * 1024 * 1024) return (total / (1024 * 1024)).toFixed(1) + ' MB';
  return (total / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [addingSubfolder, setAddingSubfolder] = useState<string | null>(null);
  const [subfolderName, setSubfolderName] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moving, setMoving] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadFiles(); }, []);

  async function loadFiles() {
    try {
      const res = await fetch('/api/admin/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Files load failed:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Computed ─────────────────────────────────────────────────────────

  const realFiles = files.filter(f => f.mime_type !== 'application/x-folder');
  const folderTree = buildFolderTree(files);
  const allFolders = Array.from(new Set(files.map(f => f.folder))).sort();
  const folderCount = allFolders.length;
  const imageCount = realFiles.filter(f => isImage(f.mime_type, f.file_name)).length;
  const filteredFiles = files.filter(f => {
    if (search) return f.name.toLowerCase().includes(search.toLowerCase());
    if (currentFolder === null) return true;
    return f.folder === currentFolder || f.folder.startsWith(currentFolder + '/');
  });

  const breadcrumbs = currentFolder ? currentFolder.split('/').filter(Boolean) : [];

  // ─── Actions ──────────────────────────────────────────────────────────

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    const supabase = createClient();
    const folder = currentFolder || '/Shared';
    const total = fileList.length;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(`Uploading ${i + 1} of ${total}: ${file.name}`);

      const ext = file.name.split('.').pop();
      const path = `files/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error } = await supabase.storage.from('new-images').upload(path, file);
      if (error) { alert(`Failed to upload ${file.name}: ${error.message}`); continue; }

      const { data: urlData } = supabase.storage.from('new-images').getPublicUrl(path);

      await supabase.from('files').insert({
        name: file.name.replace(/\.[^/.]+$/, ''),
        folder,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
      });
    }

    setUploading(false);
    setUploadProgress('');
    e.target.value = '';
    loadFiles();
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const parent = currentFolder || '';
    const folderPath = parent + '/' + newFolderName.trim();
    const supabase = createClient();
    await supabase.from('files').insert({
      name: '.folder', folder: folderPath, file_url: '', file_name: '.folder',
      file_size: 0, mime_type: 'application/x-folder',
    });
    setNewFolderName('');
    setShowNewFolder(false);
    loadFiles();
  }

  async function handleCreateSubfolder(parentPath: string) {
    if (!subfolderName.trim()) return;
    const folderPath = parentPath + '/' + subfolderName.trim();
    const supabase = createClient();
    await supabase.from('files').insert({
      name: '.folder', folder: folderPath, file_url: '', file_name: '.folder',
      file_size: 0, mime_type: 'application/x-folder',
    });
    setSubfolderName('');
    setAddingSubfolder(null);
    loadFiles();
  }

  async function handleDelete(file: FileItem) {
    if (!confirm(`Delete "${file.name}"?`)) return;
    const supabase = createClient();
    await supabase.from('files').delete().eq('id', file.id);
    setActionMenu(null);
    loadFiles();
  }

  async function handleRename(file: FileItem) {
    if (!renameValue.trim()) return;
    const supabase = createClient();
    await supabase.from('files').update({ name: renameValue.trim() }).eq('id', file.id);
    setRenaming(null);
    setRenameValue('');
    loadFiles();
  }

  async function handleMove(file: FileItem) {
    if (!moveTarget) return;
    const supabase = createClient();
    await supabase.from('files').update({ folder: moveTarget }).eq('id', file.id);
    setMoving(null);
    setMoveTarget('');
    loadFiles();
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    setActionMenu(null);
  }

  async function handleDeleteFolder(folderPath: string) {
    const folderFiles = files.filter(f => f.folder === folderPath || f.folder.startsWith(folderPath + '/'));
    const realInFolder = folderFiles.filter(f => f.mime_type !== 'application/x-folder');
    const msg = realInFolder.length > 0
      ? `Delete folder "${folderPath}" and ${realInFolder.length} file${realInFolder.length !== 1 ? 's' : ''} inside it?`
      : `Delete empty folder "${folderPath}"?`;
    if (!confirm(msg)) return;

    const supabase = createClient();
    for (const file of realInFolder) {
      const storagePath = file.file_url.split('/new-images/')[1];
      if (storagePath) await supabase.storage.from('new-images').remove([storagePath]);
    }

    const ids = folderFiles.map(f => f.id);
    if (ids.length > 0) await supabase.from('files').delete().in('id', ids);

    if (currentFolder === folderPath || currentFolder?.startsWith(folderPath + '/')) {
      setCurrentFolder(null);
    }
    loadFiles();
  }

  // ─── Folder Tree Item ────────────────────────────────────────────────

  function FolderTreeItem({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
    const isActive = currentFolder === node.path;
    const [expanded, setExpanded] = useState(true);

    return (
      <>
        <div
          className={`fr-folder-item ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
          onClick={() => setCurrentFolder(isActive ? null : node.path)}
        >
          {node.children.length > 0 && (
            <i className={`fas fa-chevron-${expanded ? 'down' : 'right'} fr-folder-chevron`}
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}></i>
          )}
          <i className={`fas ${isActive ? 'fa-folder-open' : 'fa-folder'} fr-folder-icon`}></i>
          <span className="fr-folder-name">{node.name}</span>
          {node.count > 0 && <span className="fr-folder-count">{node.count}</span>}
          <button className="fr-folder-add" title="Add subfolder"
            onClick={(e) => { e.stopPropagation(); setAddingSubfolder(addingSubfolder === node.path ? null : node.path); setSubfolderName(''); }}>
            <i className="fas fa-plus"></i>
          </button>
          <button className="fr-folder-delete" title="Delete folder"
            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(node.path); }}>
            <i className="fas fa-trash"></i>
          </button>
        </div>
        {addingSubfolder === node.path && (
          <div className="fr-subfolder-input" style={{ paddingLeft: `${0.75 + (depth + 1) * 1}rem` }}>
            <i className="fas fa-folder-plus" style={{ color: '#D97706', fontSize: '0.8rem' }}></i>
            <input type="text" placeholder="Subfolder name..." value={subfolderName}
              onChange={e => setSubfolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateSubfolder(node.path); if (e.key === 'Escape') setAddingSubfolder(null); }}
              autoFocus />
            <button onClick={() => handleCreateSubfolder(node.path)} title="Create"><i className="fas fa-check"></i></button>
            <button onClick={() => setAddingSubfolder(null)} title="Cancel"><i className="fas fa-times"></i></button>
          </div>
        )}
        {expanded && node.children.map(child => (
          <FolderTreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header"><h1>Files</h1></div>
        <div className="admin-card p-12 text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-blue"></i>
          <p className="mt-3 text-slate-500 dark:text-slate-400">Loading files...</p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1><i className="fas fa-folder-open mr-2" style={{ color: '#D97706' }}></i> Files</h1>
          <p>Shared file repository for LPFA and ROTR documents, logos, and assets.</p>
        </div>
        <div className="admin-header-actions">
          <button className="admin-btn admin-btn-secondary" onClick={() => setShowNewFolder(true)}>
            <i className="fas fa-folder-plus"></i> New Folder
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()}>
            <i className="fas fa-upload"></i> Upload Files
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="rotr-stats-row" style={{ marginBottom: '2rem' }}>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-blue/10 text-blue"><i className="fas fa-file"></i></div>
          <div className="rotr-stat-value">{realFiles.length}</div>
          <div className="rotr-stat-label">Total Files</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-amber-50/10 text-amber-800"><i className="fas fa-folder"></i></div>
          <div className="rotr-stat-value">{folderCount}</div>
          <div className="rotr-stat-label">Folders</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-purple-50/10 text-purple-800"><i className="fas fa-image"></i></div>
          <div className="rotr-stat-value">{imageCount}</div>
          <div className="rotr-stat-label">Images</div>
        </div>
        <div className="rotr-stat-card">
          <div className="rotr-stat-icon bg-green-50/10 text-green-800"><i className="fas fa-hard-drive"></i></div>
          <div className="rotr-stat-value">{getTotalSize(realFiles)}</div>
          <div className="rotr-stat-label">Storage Used</div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="fr-upload-bar">
          <i className="fas fa-spinner fa-spin"></i> {uploadProgress}
        </div>
      )}

      {/* New Folder Bar */}
      {showNewFolder && (
        <div className="fr-new-folder-bar">
          <input type="text" placeholder="Folder name..." value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            autoFocus />
          <button className="admin-btn admin-btn-primary" onClick={handleCreateFolder}>Create</button>
          <button className="admin-btn admin-btn-secondary" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</button>
        </div>
      )}

      {/* File Manager Layout */}
      <div className="fr-layout">
        {/* Folder Tree Sidebar */}
        <div className="fr-sidebar">
          <div className="fr-sidebar-header">
            <i className="fas fa-sitemap" style={{ marginRight: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}></i> Folders
          </div>
          <button className={`fr-folder-item ${currentFolder === null ? 'active' : ''}`} onClick={() => setCurrentFolder(null)}>
            <i className="fas fa-home fr-folder-icon"></i>
            <span className="fr-folder-name">All Files</span>
            <span className="fr-folder-count">{realFiles.length}</span>
          </button>
          {folderTree.map(node => (
            <FolderTreeItem key={node.path} node={node} />
          ))}
        </div>

        {/* File Grid Main */}
        <div className="fr-main">
          {/* Breadcrumb + Search Toolbar */}
          <div className="fr-toolbar">
            <div className="fr-breadcrumb">
              <button onClick={() => setCurrentFolder(null)} className="fr-crumb">
                <i className="fas fa-home"></i>
              </button>
              {breadcrumbs.map((part, i) => {
                const path = '/' + breadcrumbs.slice(0, i + 1).join('/');
                return (
                  <span key={path}>
                    <i className="fas fa-chevron-right fr-crumb-sep"></i>
                    <button className="fr-crumb" onClick={() => setCurrentFolder(path)}>{part}</button>
                  </span>
                );
              })}
              {currentFolder && (
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
                  {filteredFiles.filter(f => f.mime_type !== 'application/x-folder').length} file{filteredFiles.filter(f => f.mime_type !== 'application/x-folder').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="fr-search">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search files..." value={search}
                onChange={e => setSearch(e.target.value)} />
              {search && (
                <button className="fr-search-clear" onClick={() => setSearch('')}>
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Files Grid */}
          {filteredFiles.filter(f => f.mime_type !== 'application/x-folder').length === 0 ? (
            <div className="fr-empty">
              <i className="fas fa-folder-open"></i>
              <p>{search ? 'No files match your search.' : 'No files in this folder.'}</p>
              <button className="admin-btn admin-btn-primary" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '0.75rem' }}>
                <i className="fas fa-upload"></i> Upload Files
              </button>
            </div>
          ) : (
            <div className="fr-grid">
              {filteredFiles.filter(f => f.mime_type !== 'application/x-folder').map(file => {
                const { icon, color } = getFileIcon(file.mime_type, file.file_name);
                const showPreview = isImage(file.mime_type, file.file_name);

                return (
                  <div key={file.id} className="fr-file-card">
                    <div className="fr-file-preview" onClick={() => window.open(file.file_url, '_blank')}>
                      {showPreview ? (
                        <img src={file.file_url} alt={file.name} loading="lazy" />
                      ) : (
                        <i className={icon} style={{ color }}></i>
                      )}
                    </div>

                    <div className="fr-file-info">
                      {renaming === file.id ? (
                        <div className="fr-rename-row">
                          <input type="text" value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleRename(file); if (e.key === 'Escape') setRenaming(null); }}
                            autoFocus />
                          <button onClick={() => handleRename(file)}><i className="fas fa-check"></i></button>
                        </div>
                      ) : (
                        <div className="fr-file-name" title={file.name}>{file.name}</div>
                      )}
                      <div className="fr-file-meta">
                        <span>{formatSize(file.file_size)}</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>

                    <div className="fr-file-actions">
                      <button className="fr-action-btn"
                        onClick={() => setActionMenu(actionMenu === file.id ? null : file.id)}>
                        <i className="fas fa-ellipsis-v"></i>
                      </button>

                      {actionMenu === file.id && (
                        <div className="fr-action-menu">
                          <button onClick={() => window.open(file.file_url, '_blank')}>
                            <i className="fas fa-download"></i> Download
                          </button>
                          <button onClick={() => copyUrl(file.file_url, file.id)}>
                            <i className="fas fa-link"></i> {copied === file.id ? 'Copied!' : 'Copy URL'}
                          </button>
                          <button onClick={() => { setRenaming(file.id); setRenameValue(file.name); setActionMenu(null); }}>
                            <i className="fas fa-pen"></i> Rename
                          </button>
                          <button onClick={() => { setMoving(file.id); setMoveTarget(file.folder); setActionMenu(null); }}>
                            <i className="fas fa-folder"></i> Move
                          </button>
                          <button className="fr-action-delete" onClick={() => handleDelete(file)}>
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      )}

                      {moving === file.id && (
                        <div className="fr-move-menu">
                          <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)}>
                            {allFolders.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <button className="admin-btn admin-btn-primary" onClick={() => handleMove(file)}>Move</button>
                          <button className="admin-btn admin-btn-secondary" onClick={() => setMoving(null)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
