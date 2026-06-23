import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Settings, 
  Trash2, 
  Play, 
  Server, 
  Smartphone, 
  Monitor, 
  Compass, 
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Task, CodeFile, TerminalLog } from './types';
import { initialTasks, codeFiles as initialCodeFiles } from './data';
import CodeExplorer from './components/CodeExplorer';
import FlaskPreview from './components/FlaskPreview';

export default function App() {
  // Application Data States
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('flask_simulator_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [files, setFiles] = useState<CodeFile[]>(() => {
    const saved = localStorage.getItem('flask_simulator_files');
    return saved ? JSON.parse(saved) : initialCodeFiles;
  });

  // Terminal Logs State
  const [logs, setLogs] = useState<TerminalLog[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Initialize and Boot Flask microservice logs
  const bootFlaskLogs = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    const bootSequence: Omit<TerminalLog, 'id'>[] = [
      {
        timestamp: timeStr,
        type: 'server',
        message: "* Serving Flask app 'app' (lazy loading)"
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: "* Environment: development (SQLite embedded)"
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: "  WARNING: This is a virtual container simulator designed for local client verification."
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: " * Debug mode: on"
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: " * Running on http://127.0.0.1:5000 (Press CTRL+C to quit)"
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: " * Restarting with stat"
      },
      {
        timestamp: timeStr,
        type: 'server',
        message: " * Debugger is active (PIN: 184-903-517)"
      },
      {
        timestamp: timeStr,
        type: 'db',
        message: "[SQLAlchemy] Binding connection: sqlite:///tasks.db (schema active)"
      },
      {
        timestamp: timeStr,
        type: 'db',
        message: "[SQLAlchemy] Verified DB tables: task (3 custom pre-loaded seed records)"
      }
    ];

    setLogs(bootSequence.map((log, i) => ({
      ...log,
      id: `${now.getTime()}-${i}`
    })));
  };

  useEffect(() => {
    bootFlaskLogs();
  }, []);

  // Sync state changes with persistence
  useEffect(() => {
    localStorage.setItem('flask_simulator_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('flask_simulator_files', JSON.stringify(files));
  }, [files]);

  // Handle auto-scroll terminal outputs
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Terminal writing callback
  const handleLogTerminal = (type: 'server' | 'request' | 'db', message: string) => {
    const newLog: TerminalLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  // CRUD Implementations
  const handleAddTask = (newTask: Omit<Task, 'id' | 'created_at' | 'completed'>) => {
    const formattedDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const added: Task = {
      ...newTask,
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      completed: false,
      created_at: formattedDate
    };
    setTasks(prev => [added, ...prev]);
  };

  const handleToggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const handleEditTask = (id: number, updated: Omit<Task, 'id' | 'created_at' | 'completed'>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          title: updated.title,
          description: updated.description,
          priority: updated.priority,
          category: updated.category
        };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleResetDatabase = () => {
    setTasks(initialTasks);
  };

  const handleUpdateFileCode = (path: string, newContent: string) => {
    setFiles(prev => prev.map(f => {
      if (f.path === path) {
        return { ...f, content: newContent };
      }
      return f;
    }));
  };

  const handleResetFiles = () => {
    setFiles(initialCodeFiles);
    handleLogTerminal('server', "Restored all default Python & Jinja HTML source codes to initial project values.");
  };

  const handleClearTerminal = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="app-root">
      {/* Dynamic Header Navbar banner */}
      <header className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-amber-500 shadow-sm">
              <Server className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-100 font-sans">Flask Studio</h1>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide">
                  v3.0.2-Active
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-none mt-0.5">Interactive Python Flask & SQLite Micro Web App Sandbox</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Specs badges */}
            <div className="hidden md:flex items-center space-x-3 text-xs bg-slate-950 border border-slate-850 px-3.5 py-1.5 rounded-lg select-none">
              <div className="flex items-center space-x-1.5 border-r border-slate-850 pr-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-400 font-mono">Server Port: 5000</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-slate-400">Database:</span>
                <code className="bg-slate-900 border border-slate-800 text-slate-300 font-mono px-1 py-0.5 rounded text-[10px]">SQLite</code>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sandbox Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Section (7 columns on desktop): Code Workspace, Logs terminal */}
        <div className="xl:col-span-6 flex flex-col space-y-4 min-w-0 h-full">
          
          {/* File explorer & code viewer */}
          <div className="flex-1 min-h-[350px] xl:min-h-0 xl:h-[58%]">
            <CodeExplorer 
              files={files}
              onUpdateFile={handleUpdateFileCode}
              onResetFiles={handleResetFiles}
              onLogTerminal={handleLogTerminal}
            />
          </div>

          {/* Interactive Flask Log Terminal Output Panel */}
          <div className="h-[230px] xl:h-[35%] bg-slate-950 border border-slate-850 rounded-xl overflow-hidden flex flex-col shadow-xl">
            <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-850/60 flex items-center justify-between text-xs select-none">
              <div className="flex items-center space-x-2 text-slate-350 text-slate-300">
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-semibold">flask-app-process stderr stdout</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={bootFlaskLogs}
                  title="Cold boot Flask kernel processes"
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleClearTerminal}
                  title="Wipe current log terminal records"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrolling logs output area */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-3xs text-xs whitespace-pre-wrap leading-relaxed space-y-1.5">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="text-slate-300 flex items-start space-x-2 text-[11px]">
                    <span className="text-slate-600 select-none shrink-0" style={{ fontSize: '10.5px' }}>[{log.timestamp}]</span>
                    
                    {log.type === 'request' ? (
                      <span className="text-sky-400 font-bold shrink-0">[REQUEST]</span>
                    ) : log.type === 'db' ? (
                      <span className="text-amber-400 font-bold shrink-0">[DATABASE]</span>
                    ) : (
                      <span className="text-emerald-400 font-bold shrink-0">[FLASK]</span>
                    )}

                    <span className={`flex-1 ${
                      log.type === 'request' ? 'text-slate-100 font-semibold' :
                      log.type === 'db' ? 'text-amber-100/95 font-medium' :
                      'text-emerald-100/85'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 font-mono text-center">
                  Terminal console clean. Execute web clicks in client view on right side to monitor microservice stream.
                </div>
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>

        </div>

        {/* Right Section (5 columns on desktop): Live virtual hosted application UI viewport */}
        <div className="xl:col-span-6 min-w-0">
          <FlaskPreview 
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onResetDatabase={handleResetDatabase}
            onLogTerminal={handleLogTerminal}
          />
        </div>

      </main>

      {/* Simple footer metadata tags */}
      <footer className="py-6 bg-slate-900 border-t border-slate-850 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8 text-xs text-slate-500 font-mono">
          Flask Mini Web App Workspace • Runs locally via React routing virtualization • Full Python templates bundle zipped and validated
        </div>
      </footer>
    </div>
  );
}
