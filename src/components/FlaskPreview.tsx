import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Lock, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  HelpCircle,
  Database,
  Sliders,
  X,
  FileCheck,
  House,
  Briefcase,
  User,
  Lightbulb,
  Check,
  AlertCircle
} from 'lucide-react';
import { Task } from '../types';

interface FlaskPreviewProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'created_at' | 'completed'>) => void;
  onToggleTask: (id: number) => void;
  onEditTask: (id: number, updated: Omit<Task, 'id' | 'created_at' | 'completed'>) => void;
  onDeleteTask: (id: number) => void;
  onResetDatabase: () => void;
  onLogTerminal: (type: 'server' | 'request' | 'db', message: string) => void;
}

export default function FlaskPreview({
  tasks,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onResetDatabase,
  onLogTerminal
}: FlaskPreviewProps) {
  // Navigation & Address Bar Simulation
  const [currentStatus, setCurrentStatus] = useState<string>("all");
  const [currentPriority, setCurrentPriority] = useState<string>("all");
  const [currentCategory, setCurrentCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [addressBarQuery, setAddressBarQuery] = useState<string>("/");

  // Modal displays
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Form Fields for Add
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newCategory, setNewCategory] = useState<'Work' | 'Personal' | 'Ideas'>("Personal");

  // Form Fields for Edit
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [editCategory, setEditCategory] = useState<'Work' | 'Personal' | 'Ideas'>("Personal");

  // Flash Banner messages list
  interface FlashAlert {
    id: string;
    type: 'success' | 'warning' | 'info' | 'danger';
    message: string;
  }
  const [flashMessages, setFlashMessages] = useState<FlashAlert[]>([]);

  // Update virtual URL address bar whenever filters change
  useEffect(() => {
    let path = "/";
    const params: string[] = [];
    if (currentStatus !== 'all') params.push(`status=${currentStatus}`);
    if (currentPriority !== 'all') params.push(`priority=${currentPriority}`);
    if (currentCategory !== 'all') params.push(`category=${currentCategory}`);
    if (searchQuery.trim() !== '') params.push(`q=${encodeURIComponent(searchQuery)}`);

    if (params.length > 0) {
      path += "?" + params.join("&");
    }
    setAddressBarQuery(path);
  }, [currentStatus, currentPriority, currentCategory, searchQuery]);

  const addFlash = (type: 'success' | 'warning' | 'info' | 'danger', message: string) => {
    const newFlash: FlashAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message
    };
    setFlashMessages(prev => [newFlash, ...prev]);
    // Auto clear after 4s
    setTimeout(() => {
      setFlashMessages(prev => prev.filter(f => f.id !== newFlash.id));
    }, 4000);
  };

  const handleLogClickRoute = (method: 'GET' | 'POST', path: string, code: number = 200) => {
    onLogTerminal('request', `127.0.0.1 - - [${new Date().toLocaleTimeString()}] "${method} ${path} HTTP/1.1" ${code} -`);
  };

  // Trigger actions
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addFlash('danger', 'Task title is required!');
      handleLogClickRoute('POST', '/add', 302);
      onLogTerminal('server', 'Flash Error: Title omitted in target payload.');
      return;
    }

    onAddTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      category: newCategory
    });

    handleLogClickRoute('POST', '/add', 302);
    onLogTerminal('db', `[SQLAlchemy] INSERT INTO task (title, description, completed, priority, category, created_at) VALUES ('${newTitle.replace(/'/g, "''")}', ...);`);
    addFlash('success', `Successfully added: "${newTitle}"!`);
    
    // reset form
    setNewTitle("");
    setNewDesc("");
    setNewPriority("Medium");
    setNewCategory("Personal");
    setShowAddModal(false);

    // Filter index updated
    handleLogClickRoute('GET', addressBarQuery, 200);
  };

  const handleToggleCompleted = (id: number, title: string, oldState: boolean) => {
    onToggleTask(id);
    const textState = !oldState ? "completed" : "active";
    handleLogClickRoute('GET', `/toggle/${id}`, 302);
    onLogTerminal('db', `[SQLAlchemy] UPDATE task SET completed = ${!oldState ? '1' : '0'} WHERE id = ${id};`);
    addFlash('info', `Task "${title}" marked as ${textState}!`);
    handleLogClickRoute('GET', addressBarQuery, 200);
  };

  const handleInitiateEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditCategory(task.category);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;

    if (!editTitle.trim()) {
      addFlash('danger', 'Task title cannot be empty!');
      handleLogClickRoute('POST', `/edit/${editingTaskId}`, 302);
      return;
    }

    onEditTask(editingTaskId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      category: editCategory
    });

    handleLogClickRoute('POST', `/edit/${editingTaskId}`, 302);
    onLogTerminal('db', `[SQLAlchemy] UPDATE task SET title='${editTitle.replace(/'/g, "''")}', description='${editDesc.replace(/'/g, "''")}', priority='${editPriority}', category='${editCategory}' WHERE id = ${editingTaskId};`);
    addFlash('success', `Task "${editTitle}" updated successfully!`);
    
    setEditingTaskId(null);
    handleLogClickRoute('GET', addressBarQuery, 200);
  };

  const handleDeleteSubmit = (id: number, title: string) => {
    if (confirm(`Permanently remove task item: "${title}"?`)) {
      onDeleteTask(id);
      handleLogClickRoute('POST', `/delete/${id}`, 302);
      onLogTerminal('db', `[SQLAlchemy] DELETE FROM task WHERE id = ${id};`);
      addFlash('warning', `Task "${title}" deleted completely!`);
      handleLogClickRoute('GET', addressBarQuery, 200);
    }
  };

  const handleLocalDbReset = () => {
    if (confirm('Rebuild database schema? All custom additions will revert to defaults.')) {
      onResetDatabase();
      handleLogClickRoute('GET', '/reset-db', 302);
      onLogTerminal('db', '[SQLAlchemy] DROP ALL TABLES && CREATE ALL SCHEMA TABLES (Task initialized);');
      addFlash('success', 'SQLite Database re-initialized to initial placeholder seed tasks!');
      setCurrentStatus("all");
      setCurrentPriority("all");
      setCurrentCategory("all");
      setSearchQuery("");
      handleLogClickRoute('GET', '/', 200);
    }
  };

  // Frontend filters applying on React tasks state
  const filteredTasks = tasks.filter(task => {
    // search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // status filter
    if (currentStatus === 'active' && task.completed) return false;
    if (currentStatus === 'completed' && !task.completed) return false;

    // priority filter
    if (currentPriority !== 'all' && task.priority !== currentPriority) return false;

    // category filter
    if (currentCategory !== 'all' && task.category !== currentCategory) return false;

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 border border-slate-300 rounded-xl overflow-hidden shadow-2xl relative" id="flask-preview-container">
      
      {/* Simulation Browser Address Header bar */}
      <div className="flex items-center space-x-3 px-4 py-2.5 bg-slate-200 border-b border-slate-300 select-none">
        {/* Navigation Action mock icons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-450 bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-450 bg-amber-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-450 bg-emerald-400"></div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            type="button" 
            title="Back"
            className="p-1 rounded hover:bg-slate-300 transition text-slate-500"
            onClick={() => {
              setCurrentStatus("all");
              setCurrentPriority("all");
              setCurrentCategory("all");
              setSearchQuery("");
              addFlash('info', 'Navigated back to index page');
              handleLogClickRoute('GET', '/', 200);
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled className="p-1 rounded text-slate-300"><ArrowRight className="w-3.5 h-3.5" /></button>
          <button 
            type="button" 
            title="Refresh Flask View" 
            onClick={() => {
              handleLogClickRoute('GET', addressBarQuery, 200);
              addFlash('info', 'Simulated template rendering refreshed');
            }}
            className="p-1 rounded hover:bg-slate-300 transition text-slate-500"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address Input Bar */}
        <div className="flex-grow flex items-center bg-white border border-slate-300 text-xs px-3 py-1 rounded-md text-slate-600 font-mono focus-within:ring-1 focus-within:ring-sky-500">
          <Lock className="w-3 h-3 text-slate-400 mr-1.5 shrink-0" />
          <span className="text-slate-400 shrink-0 select-all font-sans">http://127.0.0.1:5000</span>
          <span className="text-slate-800 truncate">{addressBarQuery}</span>
        </div>

        <div className="text-slate-500 text-xs text-xs tracking-wide shrink-0 hidden md:block">
          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-300/65 font-semibold text-slate-700">Client Preview</span>
        </div>
      </div>

      {/* Webapp Sandbox Viewport */}
      <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0 relative font-sans">
        
        {/* Bootstrap Header Navbar Mock */}
        <nav className="navbar navbar-dark bg-dark shadow-sm bg-zinc-900 border-b border-zinc-850 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => {
                setCurrentStatus("all");
                setCurrentPriority("all");
                setCurrentCategory("all");
                setSearchQuery("");
                handleLogClickRoute('GET', '/', 200);
              }}
              className="flex items-center text-white hover:text-amber-400 font-bold tracking-tight text-base transition"
            >
              <FileCheck className="w-5 h-5 text-amber-400 mr-2 shrink-0" />
              <span>FlaskNotes</span>
            </button>
          </div>
          <div className="flex items-center space-x-4 text-sm font-medium text-zinc-300">
            <button 
              onClick={() => {
                setCurrentStatus("all");
                setCurrentPriority("all");
                setCurrentCategory("all");
                setSearchQuery("");
                handleLogClickRoute('GET', '/', 200);
              }}
              className="hover:text-white flex items-center space-x-1"
            >
              <House className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Home Dashboard</span>
            </button>
            <button 
              onClick={() => {
                handleLogClickRoute('GET', '/add', 200);
                setShowAddModal(true);
              }}
              className="border border-amber-400/80 hover:bg-amber-400 hover:text-zinc-950 text-amber-400 px-3 py-1 rounded text-xs transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Bootstrap Flash Alert Feeds */}
        <div className="px-4 pt-3 space-y-2">
          {flashMessages.map(msg => (
            <div 
              key={msg.id}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-sans shadow-sm transition-all duration-300 ${
                msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                msg.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                msg.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                {msg.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                {msg.type === 'warning' && <AlertCircle className="w-4 h-4 shrink-0" />}
                {msg.type === 'info' && <Check className="w-4 h-4 shrink-0" />}
                {msg.type === 'danger' && <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{msg.message}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFlashMessages(prev => prev.filter(f => f.id !== msg.id))}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Main Bootstrap Container Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Sidebar Column: Filters */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b pb-2 mb-3">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span>Jinja2 Filter Blocks</span>
                </div>

                {/* All / Active / Completed Status List */}
                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      setCurrentStatus("all");
                      handleLogClickRoute('GET', `/?status=all&priority=${currentPriority}&category=${currentCategory}`, 200);
                    }}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded text-left transition ${
                      currentStatus === "all" 
                        ? 'bg-zinc-800 text-white font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>All Records</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${currentStatus === "all" ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                      {tasks.length}
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      setCurrentStatus("active");
                      handleLogClickRoute('GET', `/?status=active&priority=${currentPriority}&category=${currentCategory}`, 200);
                    }}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded text-left transition ${
                      currentStatus === "active" 
                        ? 'bg-zinc-800 text-white font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Active Tasks</span>
                    <span className="px-1.5 py-0.5 text-xs text-slate-500 rounded-full">
                      {tasks.filter(t => !t.completed).length}
                    </span>
                  </button>

                  <button 
                    onClick={() => {
                      setCurrentStatus("completed");
                      handleLogClickRoute('GET', `/?status=completed&priority=${currentPriority}&category=${currentCategory}`, 200);
                    }}
                    className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded text-left transition ${
                      currentStatus === "completed" 
                        ? 'bg-zinc-800 text-white font-semibold' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>Completed</span>
                    <span className="px-1.5 py-0.5 text-xs text-slate-500 rounded-full">
                      {tasks.filter(t => t.completed).length}
                    </span>
                  </button>
                </div>

                {/* Priority filter pills */}
                <h6 className="font-bold text-slate-500 tracking-wide mt-4 mb-2 uppercase text-2xs fs-7" style={{ fontSize: '10px' }}>Priority levels</h6>
                <div className="flex flex-wrap gap-1 mb-3">
                  {['all', 'High', 'Medium', 'Low'].map(prio => (
                    <button
                      key={prio}
                      onClick={() => {
                        setCurrentPriority(prio);
                        handleLogClickRoute('GET', `/?status=${currentStatus}&priority=${prio}&category=${currentCategory}`, 200);
                      }}
                      className={`px-2 py-1 rounded-full text-2xs text-xs capitalize border transition ${
                        currentPriority === prio 
                          ? 'bg-slate-600 text-white border-slate-600' 
                          : prio === 'High' ? 'border-red-200 text-red-650 hover:bg-red-50'
                          : prio === 'Medium' ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : prio === 'Low' ? 'border-cyan-200 text-cyan-650 hover:bg-cyan-50'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>

                {/* Category selectors */}
                <h6 className="font-bold text-slate-500 tracking-wide mt-4 mb-2 uppercase text-2xs fs-7" style={{ fontSize: '10px' }}>Categories</h6>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All Categories', icon: HelpCircle, color: 'text-slate-400' },
                    { id: 'Work', label: 'Work Focus', icon: Briefcase, color: 'text-sky-500' },
                    { id: 'Personal', label: 'Personal Project', icon: User, color: 'text-emerald-500' },
                    { id: 'Ideas', label: 'Ideas & Drafts', icon: Lightbulb, color: 'text-amber-500' }
                  ].map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCurrentCategory(cat.id);
                          handleLogClickRoute('GET', `/?status=${currentStatus}&priority=${currentPriority}&category=${cat.id}`, 200);
                        }}
                        className={`w-full flex items-center space-x-2 text-2xs text-xs px-2 py-1.5 rounded text-left transition ${
                          currentCategory === cat.id 
                            ? 'bg-slate-100 font-bold text-slate-900 border-l-2 border-slate-700' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${cat.color}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SQLite status mock card */}
              <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-lg flex items-start space-x-2.5">
                <Database className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-2xs text-xs">
                  <h6 className="font-bold text-slate-800 mb-0.5">SQLite Engine (Local)</h6>
                  <p className="text-slate-500 mb-1 leading-tight">Instance: <code className="text-slate-700">tasks.db</code></p>
                  <button 
                    type="button" 
                    onClick={handleLocalDbReset}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline transition"
                  >
                    Reset DB Cache
                  </button>
                </div>
              </div>
            </div>

            {/* Dashboard Contents lists */}
            <div className="space-y-3 lg:col-span-3">
              {/* Search panel */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Title or notes description..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-slate-800 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-zinc-800"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="bg-amber-400 hover:bg-amber-350 hover:bg-amber-400/90 text-slate-900 border border-amber-400 shadow-sm px-4 py-1.5 rounded-md font-semibold text-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Entry</span>
                </button>
              </div>

              {/* Task/Note Cards lists */}
              <div className="space-y-2.5">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map(task => {
                    const isCompleted = task.completed;
                    
                    return (
                      <div 
                        key={task.id}
                        className={`bg-white border rounded-lg border-l-4 shadow-sm p-4 transition-all duration-200 group relative ${
                          isCompleted ? 'bg-slate-50 border-slate-250 opacity-70' : 'border-slate-200'
                        } ${
                          task.priority === 'High' ? 'border-l-red-500' :
                          task.priority === 'Medium' ? 'border-l-amber-400' :
                          'border-l-cyan-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Toggle Action and title info wrappers */}
                          <div className="flex items-start space-x-3 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCompleted(task.id, task.title, task.completed)}
                              className="pt-0.5 cursor-pointer text-slate-400 hover:text-slate-700 transition shrink-0"
                            >
                              {isCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check className="w-3.5 h-3.5 stroke-[3]" /></div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-slate-500"></div>
                              )}
                            </button>

                            <div className="flex-1">
                              {/* Title, indicators */}
                              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <h5 className={`font-semibold text-sm text-slate-800 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                                  {task.title}
                                </h5>

                                {/* Category tag */}
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-3xs text-[10px] border">
                                  {task.category === 'Work' && '💼 Work'}
                                  {task.category === 'Personal' && '👤 Personal'}
                                  {task.category === 'Ideas' && '💡 Ideas'}
                                </span>

                                {/* Priority Badge */}
                                <span className={`px-1.5 py-0.2 rounded-full text-3xs text-[10px] font-semibold tracking-wide ${
                                  task.priority === 'High' ? 'bg-red-50 text-red-700' :
                                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                                  'bg-cyan-50 text-cyan-700'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>

                              {/* Description details */}
                              <p className={`text-slate-500 text-xs leading-relaxed max-w-xl mb-1.5 ${isCompleted ? 'line-through' : ''}`}>
                                {task.description || "No supplemental details provided."}
                              </p>

                              {/* Created timestamps */}
                              <span className="text-slate-400 text-3xs text-[10.5px]">
                                created: <code>{task.created_at}</code>
                              </span>
                            </div>
                          </div>

                          {/* Action Items side icons */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleInitiateEdit(task)}
                              title="Edit item values"
                              className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition border border-transparent hover:border-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmit(task.id, task.title)}
                              title="Delete task note"
                              className="p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition border border-transparent hover:border-slate-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white border rounded-lg p-10 text-center shadow-sm">
                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h5 className="font-semibold text-slate-800 text-sm mb-1">No Matching Records Found</h5>
                    <p className="text-slate-400 text-xs max-w-xs mx-auto mb-4">
                      Try clearing filters, searching different keywords, or click create to write another card to the SQLite backend.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => { setSearchQuery(""); setCurrentStatus("all"); setCurrentPriority("all"); setCurrentCategory("all"); handleLogClickRoute('GET', '/', 200); }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded border shadow-sm transition"
                    >
                      Clear All Search Queries
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Mock HTML base.html consistent footer */}
        <div className="py-4 bg-white border-t border-slate-200 mt-10 text-center select-none text-slate-550 text-[11px] text-slate-400 font-mono">
          © 22026 FlaskNotes Mini Hub - Powered by Flask & Jinja2 Template inheritance
        </div>

      </div>

      {/* HTML OVERLAYS: MOCK BOOTSTRAP CREATE TASK MODAL */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in" id="addTaskModalSim">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-250 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-zinc-900 text-white px-4 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm flex items-center">
                <FileCheck className="w-4 h-4 text-warning text-amber-400 mr-2 shrink-0" />
                <span>Create New Flask Record</span>
              </h5>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTaskSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Note Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Run Flask db upgrade migrations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Details & Context</label>
                <textarea 
                  rows={3}
                  placeholder="Insert subtasks or URLs context here..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Priority Level</label>
                  <select 
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-805"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🔵 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category Code</label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-805"
                  >
                    <option value="Work">💼 Work Service</option>
                    <option value="Personal">👤 Personal Health</option>
                    <option value="Ideas">💡 Ideas/Inspiration</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 -mx-4 -mb-4 p-3 border-t border-slate-150 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-250 text-slate-700 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-400 rounded-md text-xs font-bold shadow-sm"
                >
                  Submit Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML OVERLAYS: MOCK BOOTSTRAP EDIT TASK MODAL */}
      {editingTaskId !== null && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in" id="editTaskModalSim">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-250 w-full max-w-md overflow-hidden animate-slide-up">
            <div className="bg-zinc-900 text-white px-4 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm flex items-center">
                <Edit3 className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
                <span>Edit Existing Entry</span>
              </h5>
              <button 
                type="button" 
                onClick={() => setEditingTaskId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Record Title *</label>
                <input 
                  type="text" 
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Priority</label>
                  <select 
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-805"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🔵 Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 text-slate-800 border rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-805"
                  >
                    <option value="Work">💼 Work Service</option>
                    <option value="Personal">👤 Personal Health</option>
                    <option value="Ideas">💡 Ideas/Inspiration</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 -mx-4 -mb-4 p-3 border-t border-slate-150 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTaskId(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-250 text-slate-700 rounded-md text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-dark bg-zinc-800 hover:bg-zinc-750 hover:bg-zinc-700 text-white rounded-md text-slate-100 text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
