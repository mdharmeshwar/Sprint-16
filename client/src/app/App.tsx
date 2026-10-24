import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { createTask, deleteTask, getTasks, improveTaskDescription, updateTask } from './services/taskService';

type Task = {
  _id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type ThemeMode = 'dark' | 'light';

type CommandAction =
  | 'dashboard'
  | 'board'
  | 'list'
  | 'new-task'
  | 'theme'
  | 'upgrade'
  | 'logout';

const createEmptyTask = () => ({
  title: '',
  description: '',
  priority: 'medium' as const,
  status: 'todo' as const,
  dueDate: '',
});

const emptyTask = createEmptyTask();

const statusMeta: Record<string, { label: string; color: string; soft: string }> = {
  todo: { label: 'Todo', color: '#7dd3fc', soft: 'rgba(125, 211, 252, 0.14)' },
  'in-progress': { label: 'In progress', color: '#fbbf24', soft: 'rgba(251, 191, 36, 0.15)' },
  done: { label: 'Done', color: '#3dd6a2', soft: 'rgba(61, 214, 162, 0.14)' },
  blocked: { label: 'Blocked', color: '#ff687c', soft: 'rgba(255, 104, 124, 0.14)' },
};

const sidebarItems = ['Dashboard', 'My Tasks', 'Board View', 'Analytics'];

const App = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(localStorage.getItem('taskmatrix_token'));
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('taskmatrix_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [taskQuery, setTaskQuery] = useState('');

  const navigateSection = (item: string) => {
    setActiveNav(item);
    if (item === 'My Tasks') {
      setViewMode('list');
      document.querySelector('.tasklist-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (item === 'Board View') {
      setViewMode('board');
      document.querySelector('.tasklist-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (item === 'Analytics') {
      document.querySelector('.analytics-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('taskmatrix_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === 'Escape') {
        setCommandOpen(false);
        setUpgradeOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Go to dashboard', shortcut: 'G D', action: 'dashboard' as CommandAction },
      { id: 'board', label: 'Switch to board view', shortcut: 'B', action: 'board' as CommandAction },
      { id: 'list', label: 'Switch to list view', shortcut: 'L', action: 'list' as CommandAction },
      { id: 'new-task', label: 'Create a new task', shortcut: 'N', action: 'new-task' as CommandAction },
      { id: 'theme', label: 'Toggle theme', shortcut: 'T', action: 'theme' as CommandAction },
      { id: 'upgrade', label: 'Open upgrade modal', shortcut: 'U', action: 'upgrade' as CommandAction },
      { id: 'logout', label: 'Log out', shortcut: 'Esc', action: 'logout' as CommandAction },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return commandItems;
    return commandItems.filter((item) => `${item.label} ${item.shortcut}`.toLowerCase().includes(query));
  }, [commandItems, commandQuery]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'done').length;
    const pending = total - completed;
    const byStatus = {
      todo: tasks.filter((task) => task.status === 'todo').length,
      'in-progress': tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
      blocked: tasks.filter((task) => task.status === 'blocked').length,
    };

    return { total, completed, pending, byStatus };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) => `${task.title} ${task.description} ${task.priority} ${statusMeta[task.status]?.label || task.status}`.toLowerCase().includes(query));
  }, [tasks, taskQuery]);
  const completionRate = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;

  const logoutSession = () => {
    localStorage.removeItem('taskmatrix_token');
    setToken(null);
    setUser(null);
    setTasks([]);
    setError('');
    navigate('/');
  };

  const isUnauthorizedError = (err: any) => {
    const message = String(err?.message || '');
    return err?.status === 401 || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401');
  };

  const loadMe = async (jwt: string) => {
    try {
      const response = await api.get('/auth/me', jwt);
      if (response.user) setUser(response.user);
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        logoutSession();
        return;
      }

      logoutSession();
    }
  };

  const loadTasks = async (jwt: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await getTasks(jwt);
      setTasks(response.data || []);
    } catch (err: any) {
      if (isUnauthorizedError(err)) {
        logoutSession();
        return;
      }
      setError(err.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadMe(token);
    void loadTasks(token);
  }, [token]);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password };

      const response = await api.post(endpoint, payload);
      if (!response.token) throw new Error('Authentication token missing.');

      localStorage.setItem('taskmatrix_token', response.token);
      setToken(response.token);
      setUser(response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    }
  };

  const resetTaskForm = () => {
    setTaskForm(createEmptyTask());
    setEditingTaskId(null);
    setAiSuggestion('');
  };

  const handleImproveDescription = async () => {
    if (!token || aiLoading) return;
    setAiLoading(true);
    setError('');
    setAiSuggestion('');
    try {
      const response = await improveTaskDescription(token, taskForm.description);
      setAiSuggestion(response.data.suggestion);
    } catch (err: any) {
      setError(err.message || 'Could not improve the description.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTaskSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const trimmedTitle = taskForm.title.trim();
    const trimmedDescription = taskForm.description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setError('Title and description are required.');
      return;
    }

    const payload = {
      ...taskForm,
      title: trimmedTitle,
      description: trimmedDescription,
      dueDate: taskForm.dueDate || undefined,
    };

    const validEditingId = editingTaskId && editingTaskId.trim() ? editingTaskId : null;
    setError('');

    try {
      if (validEditingId) {
        const response = await updateTask(token, validEditingId, payload);
        setTasks((current) => current.map((task) => task._id === validEditingId ? response.data : task));
      } else {
        const response = await createTask(token, payload);
        setTasks((current) => [response.data, ...current]);
      }
      resetTaskForm();
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('not found')) {
        setEditingTaskId(null);
        const fallbackResponse = await createTask(token, payload);
        setTasks((current) => [fallbackResponse.data, ...current]);
        resetTaskForm();
        return;
      }
      setError(err.message || 'Task action failed.');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!token || !taskId) return;
    const previousTasks = tasks;
    setTasks((current) => current.filter((task) => task._id !== taskId));

    try {
      await deleteTask(token, taskId);
    } catch (err: any) {
      setTasks(previousTasks);
      if (err.message?.toLowerCase().includes('not found')) {
        setError('The task was already removed or could not be found.');
        return;
      }
      setError(err.message || 'Delete failed.');
    }
  };

  const handleStatusDrop = async (status: Task['status'], droppedTaskId?: string) => {
    const taskId = droppedTaskId || draggedTaskId;
    setDragOverStatus(null);
    if (!taskId || !token) return;
    const currentTask = tasks.find((task) => task._id === taskId);

    if (!currentTask) {
      setDraggedTaskId(null);
      setError('Task not found. Refresh the board and try again.');
      return;
    }

    if (currentTask.status === status) {
      setDraggedTaskId(null);
      return;
    }

    setTasks((current) => current.map((task) => (task._id === taskId ? { ...task, status } : task)));
    setDraggedTaskId(null);

    try {
      await updateTask(token, taskId, { ...currentTask, status });
      setError('');
    } catch (err: any) {
      setTasks((current) => current.map((task) => (task._id === taskId ? currentTask : task)));
      if (err.message?.toLowerCase().includes('not found')) {
        setError('The task could not be found during the update.');
        return;
      }
      setError(err.message || 'Status update failed.');
    }
  };

  const openTaskComposer = () => {
    resetTaskForm();
    const formRegion = document.querySelector('.taskcomposer');
    formRegion?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCommandOpen(false);
  };

  const startTaskEdit = (task: Task) => {
    setEditingTaskId(task._id || null);
    setTaskForm({ ...task, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' });
  };

  const handleCommandExecute = (action: CommandAction) => {
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'board':
        setViewMode('board');
        break;
      case 'list':
        setViewMode('list');
        break;
      case 'new-task':
        openTaskComposer();
        break;
      case 'theme':
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
        break;
      case 'upgrade':
        setUpgradeOpen(true);
        break;
      case 'logout':
        logoutSession();
        break;
      default:
        break;
    }
    setCommandOpen(false);
    setCommandQuery('');
  };

  const handleUpgrade = async () => {
    if (!token) return;
    try {
      setUpgradeOpen(false);
      const response = await api.post('/stripe/create-checkout-session', {}, token);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err: any) {
      setError(err.message || 'Stripe checkout failed.');
    }
  };

  const renderAuthPage = () => (
    <div className="tm-shell">
      <div className="auth-stage">
        <div className="brand-panel">
          <div className="brand-header">
            <div className="brand-mark">TM</div>
            <div className="meta-pill">Nexus Interface</div>
          </div>

          <div className="brand-copy">
            <p className="eyebrow">Task intelligence</p>
            <h1>Run work with precision.</h1>
            <p>Turn plans, priorities, and execution into a single elegant operating rhythm for your team.</p>
          </div>

          <div className="brand-features">
            <div className="feat-card">
              <strong>Adaptive planning</strong>
              <span>Real-time visibility into task flow and handoff.</span>
            </div>
            <div className="feat-card">
              <strong>Focused execution</strong>
              <span>Keep momentum with a calmer, richer work surface.</span>
            </div>
            <div className="feat-card">
              <strong>Signal clarity</strong>
              <span>Track urgency, status, and delivery without visual noise.</span>
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <div className="toggle-row">
              <button type="button" className={`toggle-switch ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>
                Login
              </button>
              <button type="button" className={`toggle-switch ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === 'register' && (
                <input
                required
                className="input"
                placeholder="Name"
                value={authForm.name}
                onChange={(e) => setAuthForm((current) => ({ ...current, name: e.target.value }))}
              />
            )}

            <div className="input-stack">
              <input
                required
                className="input"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((current) => ({ ...current, email: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Password"
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm((current) => ({ ...current, password: e.target.value }))}
              />
            </div>

            {error && <p className="form-error">{error}</p>}
            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="tm-app-shell">
      {commandOpen && (
        <div className="command-palette-backdrop" onClick={() => setCommandOpen(false)}>
          <div className="command-palette" onClick={(event) => event.stopPropagation()}>
            <div className="command-header">
              <span>Quick actions</span>
              <span className="shortcut-tag">⌘ K</span>
            </div>
            <input
              autoFocus
              className="command-input"
              placeholder="Search actions or shortcuts"
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
            />
            <div className="command-list">
              {filteredCommands.length ? (
                filteredCommands.map((item) => (
                  <button key={item.id} type="button" className="command-item" onClick={() => handleCommandExecute(item.action)}>
                    <span>{item.label}</span>
                    <span className="command-shortcut">{item.shortcut}</span>
                  </button>
                ))
              ) : (
                <div className="command-empty">No commands match your search.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {upgradeOpen && (
        <div className="upgrade-overlay" onClick={() => setUpgradeOpen(false)}>
          <div className="upgrade-modal" onClick={(event) => event.stopPropagation()}>
            <div className="upgrade-header">
              <div>
                <p className="eyebrow">Upgrade</p>
                <h3>Task Matrix Pro</h3>
              </div>
              <button type="button" className="ghost-button" onClick={() => setUpgradeOpen(false)}>Close</button>
            </div>
            <div className="plan-grid">
              <div className="plan-card featured">
                <span className="plan-badge">Most popular</span>
                <h4>Pro</h4>
                <div className="price-row">
                  <strong>$30</strong>
                  <span>/month</span>
                </div>
                <ul>
                  <li>Advanced analytics</li>
                  <li>Unlimited tasks</li>
                  <li>Priority support</li>
                </ul>
              </div>
              <div className="plan-card">
                <h4>Workflow</h4>
                <div className="price-row">
                  <strong>Built</strong>
                  <span>for teams</span>
                </div>
                <ul>
                  <li>Board automation</li>
                  <li>Signal-rich dashboards</li>
                  <li>Fast task triage</li>
                </ul>
              </div>
            </div>
            <button className="primary-button full-width" type="button" onClick={handleUpgrade}>
              Start checkout
            </button>
          </div>
        </div>
      )}

      <aside className="tm-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">TM</div>
          <div>
            <strong>Task Matrix</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="Sidebar navigation">
          {sidebarItems.map((item) => (
            <button key={item} type="button" className={`nav-item ${activeNav === item ? 'active' : ''}`} onClick={() => navigateSection(item)}>
              <span className="nav-dot" />
              {item}
            </button>
          ))}
        </nav>

        <div className="workspace-chip">
          <strong>Work OS</strong>
          <span>Product delivery stream</span>
        </div>
      </aside>

      <main className="tm-main">
        <header className="tm-topbar">
          <div className="topbar-left">
            <span className="topbar-status" />
            <span className="topbar-label">Operations center</span>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={() => setCommandOpen(true)}>
              ⌘ K
            </button>
            <button type="button" className="theme-toggle" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button type="button" className="ghost-button" onClick={logoutSession}>Logout</button>
          </div>
        </header>

        <div className="page-header">
          <div>
            <p className="eyebrow">Execution center <span className="eyebrow-divider">/</span> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1>Good to see you, <span>{user?.name?.split(' ')[0] || 'Operator'}.</span></h1>
            <p className="page-subtitle">A clear view of what is moving, what is next, and where you need to focus.</p>
          </div>
          <button type="button" className="primary-button" onClick={openTaskComposer}>
            + New task
          </button>
        </div>

        <section className="metric-grid">
          <StatCard label="Total tasks" value={String(summary.total)} delta="Across your workspace" icon="01" accent="#8b7cff" />
          <StatCard label="Completed" value={String(summary.completed)} delta={`${completionRate}% completion rate`} icon="02" accent="#3dd6a2" />
          <StatCard label="In progress" value={String(summary.byStatus['in-progress'])} delta="Active right now" icon="03" accent="#f4b860" />
          <StatCard label="Blocked" value={String(summary.byStatus.blocked)} delta={summary.byStatus.blocked ? 'Needs a decision' : 'Nothing is blocked'} icon="04" accent="#ff687c" />
        </section>

        <section className="analytics-panel">
          <div className="panel-header">
            <h3>Progress overview</h3>
            <div className="view-switcher">
              <button type="button" className={`small-toggle ${viewMode === 'board' ? 'active' : ''}`} onClick={() => setViewMode('board')}>
                Board
              </button>
              <button type="button" className={`small-toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                List
              </button>
            </div>
          </div>

          <div className="overview-content">
            <div className="completion-module">
              <div className="completion-ring" style={{ '--completion': `${completionRate}%` } as React.CSSProperties}>
                <div className="completion-ring-inner"><strong>{completionRate}<span>%</span></strong><small>complete</small></div>
              </div>
              <div className="completion-copy"><span className="module-kicker">WORKSPACE HEALTH</span><strong>{summary.pending} open {summary.pending === 1 ? 'task' : 'tasks'}</strong><p>{summary.completed} of {summary.total} tasks completed</p></div>
            </div>
            <div className="overview-divider" />
          <div className="status-list">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className="status-row">
                <span className="status-text">{statusMeta[status]?.label || status}</span>
                <div className="progress-rail">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${summary.total ? (count / summary.total) * 100 : 0}%`,
                      background: `linear-gradient(90deg, ${statusMeta[status]?.color || '#8b7cff'}, ${statusMeta[status]?.soft || '#8b7cff'})`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="content-grid">
          <form onSubmit={handleTaskSubmit} className="taskcomposer">
            <h3>{editingTaskId ? 'Edit task' : 'Create task'}</h3>
            <div className="form-grid">
              <input
                className="input"
                required
                placeholder="Title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((current) => ({ ...current, title: e.target.value }))}
              />

              <textarea
                className="textarea"
                placeholder="Description"
                value={taskForm.description}
                onChange={(e) => {
                  setAiSuggestion('');
                  setTaskForm((current) => ({ ...current, description: e.target.value }));
                }}
              />
              <button type="button" className="ghost-button" onClick={handleImproveDescription} disabled={aiLoading || !taskForm.description.trim()}>
                {aiLoading ? 'Improving...' : 'Improve description'}
              </button>
              {aiSuggestion && (
                <div className="ai-suggestion" role="status" aria-live="polite">
                  <p>{aiSuggestion}</p>
                  <button type="button" className="ghost-button" onClick={() => {
                    setTaskForm((current) => ({ ...current, description: aiSuggestion }));
                    setAiSuggestion('');
                  }}>Use suggestion</button>
                  <button type="button" className="ghost-button" onClick={() => setAiSuggestion('')}>Dismiss</button>
                </div>
              )}

              <div className="inline-grid">
                <select
                  className="select"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((current) => ({ ...current, priority: e.target.value as Task['priority'] }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <select
                  className="select"
                  value={taskForm.status}
                  onChange={(e) => setTaskForm((current) => ({ ...current, status: e.target.value as Task['status'] }))}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <input
                className="input"
                type="date"
                value={taskForm.dueDate || ''}
                onChange={(e) => setTaskForm((current) => ({ ...current, dueDate: e.target.value }))}
              />

              {error && <p className="form-error">{error}</p>}

              <div className="inline-grid">
                <button type="submit" className="primary-button">
                  {editingTaskId ? 'Save changes' : 'Add task'}
                </button>
                {editingTaskId && (
                  <button type="button" className="ghost-button" onClick={resetTaskForm}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="tasklist-panel" onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => {
            if (touchStart === null) return;
            const delta = event.changedTouches[0]?.clientX - touchStart;
            if (Math.abs(delta) > 70) setViewMode(delta < 0 ? 'list' : 'board');
            setTouchStart(null);
          }}>
            <div className="panel-header task-panel-header">
              <div className="task-panel-title"><span className="module-kicker">WORK QUEUE</span><h3>{viewMode === 'board' ? 'Task board' : 'All tasks'} <span className="task-total">{filteredTasks.length}</span></h3>{viewMode === 'board' && <span className="drag-hint">Drag a card into another column to update its status</span>}</div>
              <div className="task-panel-actions">
              <label className="task-search"><span aria-hidden="true">⌕</span><input aria-label="Search tasks" value={taskQuery} onChange={(event) => setTaskQuery(event.target.value)} placeholder="Search tasks" /></label>
              <button type="button" className="view-button" aria-label="Board view" title="Board view" onClick={() => setViewMode('board')} data-active={viewMode === 'board'}>▦</button>
              <button type="button" className="view-button" aria-label="List view" title="List view" onClick={() => setViewMode('list')} data-active={viewMode === 'list'}>☷</button>
              <button type="button" className="ghost-button" onClick={() => setUpgradeOpen(true)}>
                Upgrade
              </button>
              </div>
            </div>

            {loading ? (
              <div className="empty-state large">
                <div>
                  <strong>Loading workflow</strong>
                  <p>Syncing your latest tasks...</p>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state large">
                <div>
                  <strong>{taskQuery ? 'No matching tasks' : 'No tasks yet'}</strong>
                  <p>{taskQuery ? 'Try a different search term.' : 'Create a task to start building momentum.'}</p>
                </div>
              </div>
            ) : viewMode === 'board' ? (
              <div className="kanban-board">
                {(['todo', 'in-progress', 'done', 'blocked'] as const).map((status) => {
                  const columnTasks = filteredTasks.filter((task) => task.status === status);

                  return (
                    <div
                      key={status}
                      className={`kanban-column ${dragOverStatus === status ? 'drag-over' : ''}`}
                      onDragEnter={(event) => { event.preventDefault(); setDragOverStatus(status); }}
                      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverStatus(status); }}
                      onDragLeave={(event) => { if (event.currentTarget === event.target) setDragOverStatus(null); }}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId || undefined;
                        void handleStatusDrop(status, taskId);
                      }}
                    >
                      <div className="kanban-header">
                        <span>{statusMeta[status]?.label || status}</span>
                        <strong>{columnTasks.length}</strong>
                      </div>

                      {columnTasks.length ? (
                <div className="kanban-list">
                          {columnTasks.map((task) => (
                            <div
                              key={task._id || task.title}
                              className={`kanban-card ${draggedTaskId === task._id ? 'is-dragging' : ''}`}
                              draggable
                              onDragStart={(event) => {
                                if (!task._id) { event.preventDefault(); return; }
                                event.dataTransfer.setData('text/plain', task._id);
                                event.dataTransfer.effectAllowed = 'move';
                                setDraggedTaskId(task._id);
                              }}
                              onDragEnd={() => { setDraggedTaskId(null); setDragOverStatus(null); }}
                            >
                              <div className="kanban-card-head">
                                <span className="kanban-chip">{task.priority}</span>
                                <span className="task-badge" style={{ background: statusMeta[task.status]?.soft || 'rgba(139,124,255,0.12)', color: statusMeta[task.status]?.color || '#8b7cff' }}>
                                  {statusMeta[task.status]?.label || task.status}
                                </span>
                              </div>
                              <h4>{task.title}</h4>
                              <p>{task.description}</p>
                              <div className="task-meta">
                                <span className="meta-tag">
                                  {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                                </span>
                              </div>
                              <div className="task-actions small-gap">
                                <button type="button" className="icon-button" onClick={() => startTaskEdit(task)}>
                                  Edit
                                </button>
                                <button type="button" className="danger-button" onClick={() => handleDelete(task._id || '')}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="kanban-empty">Drop a task here</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <div key={task._id || task.title} className="task-item">
                    <div className="task-head">
                      <div className="task-title">{task.title}</div>
                      <span className="task-badge" style={{ background: statusMeta[task.status]?.soft || 'rgba(139,124,255,0.12)', color: statusMeta[task.status]?.color || '#8b7cff' }}>
                        {statusMeta[task.status]?.label || task.status}
                      </span>
                    </div>
                    <p className="task-description">{task.description}</p>
                    <div className="task-meta">
                      <span className="meta-tag">Priority: {task.priority}</span>
                      <span className="meta-tag">{task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}</span>
                    </div>
                    <div className="task-actions">
                      <button type="button" className="icon-button" onClick={() => startTaskEdit(task)}>
                        Edit
                      </button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(task._id || '')}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : renderAuthPage()} />
      <Route path="/dashboard" element={token ? renderDashboard() : <Navigate to="/" replace />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/checkout/cancel" element={<CancelPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const SuccessPage = () => (
  <div className="tm-shell">
    <div className="success-card">
      <div className="brand-mark">✓</div>
      <h1>Checkout complete</h1>
      <p>Your Task Matrix Pro test checkout was successful. You can return to the dashboard and continue working.</p>
      <Link to="/dashboard">
        <button type="button" className="primary-button">Return to dashboard</button>
      </Link>
    </div>
  </div>
);

const CancelPage = () => (
  <div className="tm-shell">
    <div className="success-card">
      <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #f4b860, #ff687c)' }}>!</div>
      <h1>Checkout cancelled</h1>
      <p>No charge was made and you can continue using Task Matrix at your own pace.</p>
      <Link to="/dashboard">
        <button type="button" className="primary-button">Back to dashboard</button>
      </Link>
    </div>
  </div>
);

const StatCard = ({ label, value, delta, icon, accent }: { label: string; value: string; delta: string; icon: string; accent: string }) => {
  const accentStyle = { ['--accent' as string]: accent } as React.CSSProperties;

  return (
    <div className="metric-card" style={accentStyle}>
      <div className="metric-head">
        <p className="metric-label">{label}</p>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-foot">
        <span className="metric-trend">{delta}</span>
        <span>vs last week</span>
      </div>
    </div>
  );
};

export default App;
