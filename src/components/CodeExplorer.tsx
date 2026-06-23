import React, { useState } from 'react';
import { 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Info, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  RotateCcw,
  Save,
  CheckCircle,
  Code
} from 'lucide-react';
import JSZip from 'jszip';
import { CodeFile } from '../types';

interface CodeExplorerProps {
  files: CodeFile[];
  onUpdateFile: (path: string, newContent: string) => void;
  onResetFiles: () => void;
  onLogTerminal: (type: 'server' | 'request' | 'db', message: string) => void;
}

export default function CodeExplorer({ 
  files, 
  onUpdateFile, 
  onResetFiles,
  onLogTerminal
}: CodeExplorerProps) {
  const [activeTab, setActiveTab] = useState<string>("app.py");
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>("");
  const [showSaveConfirm, setShowSaveConfirm] = useState<boolean>(false);
  const [explorerOpen, setExplorerOpen] = useState<boolean>(true);

  const activeFile = files.find(f => f.path === activeTab) || files[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      onLogTerminal('server', `Copied file content of: ${activeFile.path}`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleStartEdit = () => {
    setEditContent(activeFile.content);
    setIsEditing(true);
    onLogTerminal('server', `Opened ${activeFile.path} in edit mode`);
  };

  const handleSaveEdit = () => {
    onUpdateFile(activeFile.path, editContent);
    setIsEditing(false);
    setShowSaveConfirm(true);
    onLogTerminal('server', `Successfully saved manual edits directly to code workspace: ${activeFile.path}`);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    onLogTerminal('server', `Cancelled code edits on: ${activeFile.path}`);
  };

  // Helper to trigger ZIP download in-browser
  const handleDownloadZip = async () => {
    onLogTerminal('server', "Compressing Flask structure and resources...");
    try {
      const zip = new JSZip();
      
      // Structure and fill files in ZIP
      files.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Generate the zip blob
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Download trigger
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "flask_record_crud_app.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      onLogTerminal('server', "ZIP Compilation download complete! Generated asset: flask_record_crud_app.zip");
    } catch (err) {
      onLogTerminal('server', `ZIP packaging failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" id="code-explorer-container">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-semibold text-slate-100 font-sans">Flask Source Environment</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Reset button to clear edits */}
          <button 
            type="button"
            onClick={onResetFiles}
            title="Reset code files to original state"
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-100 bg-slate-850 hover:bg-slate-800 px-2 py-1.5 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Workspace</span>
          </button>
          
          {/* ZIP Downloader */}
          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-900 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ZIP</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Side: Directory Tree Navigator */}
        <div className={`border-r border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 ${explorerOpen ? 'w-48' : 'w-10'}`}>
          <div className="p-2 border-b border-slate-850 flex items-center justify-between text-slate-400 text-xs font-semibold tracking-wider font-mono">
            {explorerOpen ? (
              <>
                <span>FILES</span>
                <button onClick={() => setExplorerOpen(false)} className="hover:text-slate-200">
                  <ChevronRight className="w-4 h-4 transform rotate-180" />
                </button>
              </>
            ) : (
              <button onClick={() => setExplorerOpen(true)} className="mx-auto hover:text-slate-200" title="Open directory tree">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {explorerOpen ? (
            <div className="p-2 space-y-1 overflow-y-auto">
              <div className="flex items-center text-slate-400 text-xs px-1.5 py-1 select-none">
                <FolderOpen className="w-4 h-4 text-amber-500/80 mr-1.5" />
                <span>flask_project/</span>
              </div>
              
              {/* Inner lists */}
              <div className="pl-3 space-y-0.5">
                {/* app.py */}
                {files.filter(f => !f.path.includes('/')).map(f => (
                  <button
                    key={f.path}
                    onClick={() => { setActiveTab(f.path); setIsEditing(false); }}
                    className={`nav-file flex items-center w-full px-2 py-1.5 rounded text-xs text-left font-mono transition ${
                      activeTab === f.path 
                        ? 'bg-slate-800 text-slate-100 font-bold' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-amber-500 mr-2 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}

                {/* Templates Folder */}
                <div className="flex items-center text-slate-400 text-xs px-1.5 py-1 select-none mt-2">
                  <Folder className="w-3.5 h-3.5 text-amber-500/80 mr-1.5" />
                  <span>templates/</span>
                </div>
                <div className="pl-3 space-y-0.5">
                  {files.filter(f => f.path.includes('/')).map(f => (
                    <button
                      key={f.path}
                      onClick={() => { setActiveTab(f.path); setIsEditing(false); }}
                      className={`nav-file flex items-center w-full px-2 py-1.5 rounded text-xs text-left font-mono transition ${
                        activeTab === f.path 
                          ? 'bg-slate-800 text-slate-100 font-bold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-orange-400 mr-2 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 space-y-3">
              {files.map(f => {
                const isTemplate = f.path.includes('/');
                return (
                  <button
                    key={f.path}
                    onClick={() => { setActiveTab(f.path); setIsEditing(false); }}
                    title={f.path}
                    className={`p-1.5 rounded transition ${
                      activeTab === f.path ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 ${isTemplate ? 'text-orange-400' : 'text-amber-500'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Code Display & Editing Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden relative">
          
          {/* File description callout */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-2 text-slate-400 text-xs">
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{activeFile.description}</span>
          </div>

          {/* Code Viewer Workspace */}
          <div className="flex-1 overflow-auto min-h-0 relative font-mono text-xs leading-relaxed p-4 bg-slate-900">
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full p-2 bg-slate-950 text-slate-100 focus:outline-none resize-none rounded border border-slate-800 font-mono text-xs focus:ring-1 focus:ring-amber-500"
                style={{ tabSize: 4 }}
              />
            ) : (
              <div className="flex min-h-full">
                {/* Mock line numbers */}
                <div className="text-slate-600 text-right pr-4 select-none border-r border-slate-800/60 mr-4 font-mono w-8 text-xs shrink-0">
                  {activeFile.content.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                {/* Code display */}
                <pre className="text-slate-100 whitespace-pre scrollbar-thin text-xs overflow-x-auto select-text flex-1">
                  <code>{activeFile.content}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Clipboard Feedback Banner */}
          {copied && (
            <div className="absolute top-12 right-4 bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-lg animate-bounce z-10">
              <Check className="w-3.5 h-3.5" />
              <span>Copied file to clipboard!</span>
            </div>
          )}

          {/* Inline Save confirmation alert */}
          {showSaveConfirm && (
            <div className="absolute top-12 right-4 bg-sky-500 text-slate-950 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 shadow-lg animate-bounce z-10">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saved dynamically! App simulator refreshed.</span>
            </div>
          )}

          {/* Footer controls for Copy/Edit/Save */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-slate-400 text-xs">
            <span>Encoding: <code className="text-slate-300">UTF-8</code></span>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 rounded transition"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-450 hover:bg-emerald-400 bg-cyan-400 hover:bg-cyan-300 rounded transition shadow"
                  >
                    <Save className="w-3 h-3" />
                    <span>Apply Edits</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                  >
                    Edit File Content
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
