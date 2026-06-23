import { CodeFile, Task } from './types';

export const initialTasks: Task[] = [
  {
    id: 1,
    title: "Complete client onboarding forms",
    description: "Fill in the service level agreements and project scope documentation for the marketing launch.",
    completed: false,
    priority: "High",
    category: "Work",
    created_at: "2026-06-23 09:12"
  },
  {
    id: 2,
    title: "Weekly grocery list & meal prep",
    description: "Stock up on organic greens, almond milk, and salmon. Prep meals for Tuesday to Thursday.",
    completed: true,
    priority: "Medium",
    category: "Personal",
    created_at: "2026-06-22 18:30"
  },
  {
    id: 3,
    title: "SaaS App marketing brainstorming",
    description: "Draft 5 interesting hook lines for our LinkedIn feature release campaign.",
    completed: false,
    priority: "Low",
    category: "Ideas",
    created_at: "2026-06-23 01:15"
  }
];

export const codeFiles: CodeFile[] = [
  {
    name: "app.py",
    path: "app.py",
    language: "python",
    description: "Main Flask application routing and SQLAlchemy database CRUD logic.",
    content: `import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SECRET_KEY'] = 'flask-mini-app-super-secret-key-1337'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(300), nullable=True)
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default='Medium') # High, Medium, Low
    category = db.Column(db.String(20), default='Personal') # Work, Personal, Ideas
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Task {self.title}>'

# Initialize Database Context
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    # Retrieve query parameters for filtering and search
    status_filter = request.args.get('status', 'all')
    priority_filter = request.args.get('priority', 'all')
    category_filter = request.args.get('category', 'all')
    query = request.args.get('q', '').strip()

    tasks_query = Task.query

    if status_filter == 'active':
        tasks_query = tasks_query.filter_by(completed=False)
    elif status_filter == 'completed':
        tasks_query = tasks_query.filter_by(completed=True)

    if priority_filter != 'all':
        tasks_query = tasks_query.filter_by(priority=priority_filter)

    if category_filter != 'all':
        tasks_query = tasks_query.filter_by(category=category_filter)

    if query:
        tasks_query = tasks_query.filter(
            (Task.title.contains(query)) | (Task.description.contains(query))
        )

    # Sort: active first, then newest
    tasks = tasks_query.order_by(Task.completed.asc(), Task.created_at.desc()).all()
    return render_template(
        'index.html', 
        tasks=tasks, 
        current_status=status_filter,
        current_priority=priority_filter,
        current_category=category_filter,
        search_query=query
    )

@app.route('/add', methods=['POST'])
def add_task():
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    priority = request.form.get('priority', 'Medium')
    category = request.form.get('category', 'Personal')

    if not title:
        flash('Task title is required!', 'danger')
        return redirect(url_for('index'))

    new_task = Task(
        title=title, 
        description=description, 
        priority=priority, 
        category=category
    )
    db.session.add(new_task)
    db.session.commit()
    
    flash(f'Successfully added: "{title}"!', 'success')
    return redirect(url_for('index'))

@app.route('/toggle/<int:task_id>')
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    db.session.commit()
    
    status_str = "completed" if task.completed else "active"
    flash(f'Task marked as {status_str}!', 'info')
    return redirect(url_for('index'))

@app.route('/edit/<int:task_id>', methods=['POST'])
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    priority = request.form.get('priority', 'Medium')
    category = request.form.get('category', 'Personal')

    if not title:
        flash('Task title cannot be empty!', 'danger')
        return redirect(url_for('index'))

    task.title = title
    task.description = description
    task.priority = priority
    task.category = category
    db.session.commit()

    flash(f'Task "{title}" updated successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/delete/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    flash(f'Task "{task.title}" deleted completely!', 'warning')
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Bind to port 3000 to keep it standard for routing
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
`
  },
  {
    name: "templates/base.html",
    path: "templates/base.html",
    language: "html",
    description: "Global HTML skeleton importing Bootstrap 5, managing template blocks, flash alerts, and a navigation navbar.",
    content: `<!DOCTYPE html>
<html lang="en" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Flask Notes & Tasks{% endblock %}</title>
    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f8f9fa;
        }
        .navbar-brand {
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .card-task {
            transition: all 0.2s ease-in-out;
            border-left: 5px solid transparent;
        }
        .card-task:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }
        .priority-High { border-left-color: #dc3545; }
        .priority-Medium { border-left-color: #ffc107; }
        .priority-Low { border-left-color: #0dcaf0; }
        .task-completed {
            opacity: 0.65;
            text-decoration: line-through;
        }
    </style>
</head>
<body class="d-flex flex-column h-100">

    <!-- Active Navigation Header -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="{{ url_for('index') }}">
                <i class="bi bi-journal-check me-2 text-warning"></i>FlaskNotes
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-center">
                    <li class="nav-item">
                        <a class="nav-link active" href="{{ url_for('index') }}">
                            <i class="bi bi-house-door me-1"></i>Home Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="btn btn-outline-warning btn-sm ms-2" href="#" data-bs-toggle="modal" data-bs-target="#addTaskModal">
                            <i class="bi bi-plus-circle me-1"></i>New Task
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content Body -->
    <main class="flex-shrink-0 my-4">
        <div class="container">
            
            <!-- Flask Flash Messaging Feed -->
            {% with messages = get_flashed_messages(with_categories=true) %}
                {% if messages %}
                    {% for category, message in messages %}
                        <div class="alert alert-{{ category }} alert-dismissible fade show shadow-sm" role="alert">
                            <i class="bi {% if category == 'success' %}bi-check-circle-fill{% elif category == 'danger' %}bi-exclamation-triangle-fill{% else %}bi-info-circle-fill{% endif %} me-2"></i>
                            {{ message }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    {% endfor %}
                {% endif %}
            {% endwith %}

            {% block content %}{% endblock %}
        </div>
    </main>

    <!-- Consistent Sticky Footer -->
    <footer class="footer mt-auto py-3 bg-white border-top">
        <div class="container text-center">
            <span class="text-muted small">
                © 2026 FlaskNotes Mini Hub - Powered by Flask & SQLite
            </span>
        </div>
    </footer>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`
  },
  {
    name: "templates/index.html",
    path: "templates/index.html",
    language: "html",
    description: "The core dashboard template displaying notes lists, quick CRUD controllers, status statistics, and responsive grid layouts.",
    content: `{% extends 'base.html' %}

{% block title %}Dashboard | Flask Tasks & Notes{% endblock %}

{% block content %}
<div class="row g-4">
    <!-- Sidebar Statistics & Filter Panel -->
    <div class="col-lg-3">
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <h5 class="card-title mb-3">
                    <i class="bi bi-sliders me-2 text-primary"></i>Filters
                </h5>
                
                <!-- Filter List Actions -->
                <div class="list-group list-group-flush mb-4">
                    <a href="{{ url_for('index', status='all', priority=current_priority, category=current_category, q=search_query) }}" 
                       class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 rounded px-3 mb-1 {% if current_status == 'all' %}active bg-dark text-white{% endif %}">
                        <span><i class="bi bi-grid-fill me-2"></i>All Records</span>
                        <span class="badge rounded-pill bg-secondary">{{ tasks|length }}</span>
                    </a>
                    <a href="{{ url_for('index', status='active', priority=current_priority, category=current_category, q=search_query) }}" 
                       class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 rounded px-3 mb-1 {% if current_status == 'active' %}active bg-dark text-white{% endif %}">
                        <span><i class="bi bi-circle me-2"></i>Active</span>
                    </a>
                    <a href="{{ url_for('index', status='completed', priority=current_priority, category=current_category, q=search_query) }}" 
                       class="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0 rounded px-3 mb-1 {% if current_status == 'completed' %}active bg-dark text-white{% endif %}">
                        <span><i class="bi bi-check-circle-fill me-2"></i>Completed</span>
                    </a>
                </div>

                <!-- Priority Categorization Filters -->
                <h6 class="fw-bold mb-2 small text-muted text-uppercase">Priority Level</h6>
                <div class="d-flex flex-wrap gap-1 mb-4">
                    <a href="{{ url_for('index', status=current_status, priority='all', category=current_category, q=search_query) }}" 
                       class="btn btn-xs rounded-pill {% if current_priority == 'all' %}btn-secondary{% else %}btn-outline-secondary{% endif %} py-1 px-2 small text-xs">All</a>
                    <a href="{{ url_for('index', status=current_status, priority='High', category=current_category, q=search_query) }}" 
                       class="btn btn-xs rounded-pill {% if current_priority == 'High' %}btn-danger{% else %}btn-outline-danger{% endif %} py-1 px-2 small text-xs">High</a>
                    <a href="{{ url_for('index', status=current_status, priority='Medium', category=current_category, q=search_query) }}" 
                       class="btn btn-xs rounded-pill {% if current_priority == 'Medium' %}btn-warning{% else %}btn-outline-warning{% endif %} py-1 px-2 small text-xs">Medium</a>
                    <a href="{{ url_for('index', status=current_status, priority='Low', category=current_category, q=search_query) }}" 
                       class="btn btn-xs rounded-pill {% if current_priority == 'Low' %}btn-info{% else %}btn-outline-info{% endif %} py-1 px-2 small text-xs">Low</a>
                </div>

                <!-- Category Filters -->
                <h6 class="fw-bold mb-2 small text-muted text-uppercase">Category</h6>
                <div class="list-group list-group-flush small">
                    <a href="{{ url_for('index', status=current_status, priority=current_priority, category='all', q=search_query) }}" 
                       class="list-group-item list-group-item-action py-2 border-0 rounded {% if current_category == 'all' %}bg-light fw-bold{% endif %}">
                        <i class="bi bi-archive me-2 text-muted"></i>All Categories
                    </a>
                    <a href="{{ url_for('index', status=current_status, priority=current_priority, category='Work', q=search_query) }}" 
                       class="list-group-item list-group-item-action py-2 border-0 rounded {% if current_category == 'Work' %}bg-light fw-bold{% endif %}">
                        <i class="bi bi-briefcase me-2 text-primary"></i>Work
                    </a>
                    <a href="{{ url_for('index', status=current_status, priority=current_priority, category='Personal', q=search_query) }}" 
                       class="list-group-item list-group-item-action py-2 border-0 rounded {% if current_category == 'Personal' %}bg-light fw-bold{% endif %}">
                        <i class="bi bi-person me-2 text-success"></i>Personal
                    </a>
                    <a href="{{ url_for('index', status=current_status, priority=current_priority, category='Ideas', q=search_query) }}" 
                       class="list-group-item list-group-item-action py-2 border-0 rounded {% if current_category == 'Ideas' %}bg-light fw-bold{% endif %}">
                        <i class="bi bi-lightbulb me-2 text-warning"></i>Ideas
                    </a>
                </div>
            </div>
        </div>

        <!-- Quick Database Reset / Diagnostic Info Card -->
        <div class="card bg-light border-0 shadow-sm p-3 small text-muted">
            <h6 class="fw-bold mb-1 text-dark"><i class="bi bi-database me-2"></i>SQLite Local Engine</h6>
            <p class="mb-0">Storage: <code>sqlite:///instance/tasks.db</code></p>
            <p class="mb-0">State: <span class="text-success fw-bold">Connected</span></p>
        </div>
    </div>

    <!-- Main List View and Search Header -->
    <div class="col-lg-9">
        <div class="row align-items-center mb-4 g-3">
            <!-- Search bar -->
            <div class="col-md-7">
                <form action="{{ url_for('index') }}" method="GET" class="d-flex">
                    <!-- Carry filters along in search terms -->
                    <input type="hidden" name="status" value="{{ current_status }}">
                    <input type="hidden" name="priority" value="{{ current_priority }}">
                    <input type="hidden" name="category" value="{{ current_category }}">
                    <div class="input-group">
                        <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                        <input type="text" name="q" value="{{ search_query }}" class="form-control border-start-0 ps-0" placeholder="Search title or description...">
                        {% if search_query %}
                            <a href="{{ url_for('index', status=current_status, priority=current_priority, category=current_category) }}" class="btn btn-outline-secondary">Clear</a>
                        {% endif %}
                        <button type="submit" class="btn btn-dark px-4">Find</button>
                    </div>
                </form>
            </div>
            
            <!-- Quick Add Launch Button -->
            <div class="col-md-5 text-md-end">
                <button type="button" class="btn btn-warning shadow-sm" data-bs-toggle="modal" data-bs-target="#addTaskModal">
                    <i class="bi bi-plus-circle-fill me-2"></i>Create New Note
                </button>
            </div>
        </div>

        <!-- Task & Notes Feed -->
        {% if tasks %}
            <div class="row g-3">
                {% for task in tasks %}
                    <div class="col-12">
                        <div class="card card-task border-0 shadow-sm priority-{{ task.priority }} {% if task.completed %}bg-light{% endif %}">
                            <div class="card-body p-4">
                                <div class="d-flex align-items-start gap-3">
                                    
                                    <!-- Toggle checkbox -->
                                    <div class="mt-1">
                                        <a href="{{ url_for('toggle_task', task_id=task.id) }}" class="text-decoration-none">
                                            {% if task.completed %}
                                                <i class="bi bi-check-circle-fill fs-4 text-success cursor-pointer"></i>
                                            {% else %}
                                                <i class="bi bi-circle fs-4 text-muted cursor-pointer"></i>
                                            {% endif %}
                                        </a>
                                    </div>

                                    <!-- Content Info -->
                                    <div class="flex-grow-1">
                                        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                                            <!-- Title with completed state check -->
                                            <h5 class="mb-0 fw-semibold text-dark {% if task.completed %}task-completed text-muted{% endif %}">
                                                {{ task.title }}
                                            </h5>
                                            
                                            <!-- Category Badge -->
                                            <span class="badge bg-light text-dark border small rounded px-2">
                                                {% if task.category == 'Work' %}💼 Work
                                                {% elif task.category == 'Personal' %}👤 Personal
                                                {% else %}💡 Ideas{% endif %}
                                            </span>

                                            <!-- Priority badge -->
                                            <span class="badge px-2 py-1 small rounded-pill
                                                {% if task.priority == 'High' %}bg-danger-subtle text-danger
                                                {% elif task.priority == 'Medium' %}bg-warning-subtle text-warning-emphasis
                                                {% else %}bg-info-subtle text-info-emphasis{% endif %}">
                                                {{ task.priority }}
                                            </span>
                                        </div>

                                        <!-- Description -->
                                        <p class="mb-2 text-muted small {% if task.completed %}task-completed{% endif %}">
                                            {{ task.description or "No secondary description provided." }}
                                        </p>

                                        <!-- Created Timestamp -->
                                        <div class="text-muted text-xs small">
                                            <i class="bi bi-calendar3 me-1"></i>Created on {{ task.created_at.strftime('%Y-%m-%d %H:%M') }}
                                        </div>
                                    </div>

                                    <!-- Action options (Edit, Delete) -->
                                    <div class="d-flex gap-1">
                                        <!-- Edit trigger modal -->
                                        <button class="btn btn-outline-secondary btn-sm border-0" 
                                                data-bs-toggle="modal" 
                                                data-bs-target="#editTaskModal-{{ task.id }}">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        
                                        <!-- Delete action with quick form submission -->
                                        <form action="{{ url_for('delete_task', task_id=task.id) }}" method="POST" class="d-inline" onsubmit="return confirm('Permanently remove this entry?');">
                                            <button type="submit" class="btn btn-outline-danger btn-sm border-0">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Individual Edit Modal for this specific item -->
                    <div class="modal fade" id="editTaskModal-{{ task.id }}" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog">
                            <form action="{{ url_for('edit_task', task_id=task.id) }}" method="POST" class="modal-content">
                                <div class="modal-header bg-dark text-white">
                                    <h5 class="modal-title fw-bold">
                                        <i class="bi bi-pencil-square me-2"></i>Edit Existing Entry
                                    </h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Record Title</label>
                                        <input type="text" name="title" value="{{ task.title }}" class="form-control shadow-sm" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Description</label>
                                        <textarea name="description" rows="3" class="form-control shadow-sm" placeholder="Details or subtasks...">{{ task.description }}</textarea>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Priority</label>
                                            <select name="priority" class="form-select shadow-sm">
                                                <option value="High" {% if task.priority == 'High' %}selected{% endif %}>High</option>
                                                <option value="Medium" {% if task.priority == 'Medium' %}selected{% endif %}>Medium</option>
                                                <option value="Low" {% if task.priority == 'Low' %}selected{% endif %}>Low</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label fw-semibold">Category</label>
                                            <select name="category" class="form-select shadow-sm">
                                                <option value="Work" {% if task.category == 'Work' %}selected{% endif %}>Work Service</option>
                                                <option value="Personal" {% if task.category == 'Personal' %}selected{% endif %}>Personal Health</option>
                                                <option value="Ideas" {% if task.category == 'Ideas' %}selected{% endif %}>Ideas/Inspiration</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer bg-light border-top">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" class="btn btn-dark px-4">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                {% endfor %}
            </div>
        {% else %}
            <!-- Styled Empty State Warning -->
            <div class="card border-0 shadow-sm text-center p-5 bg-white">
                <div class="card-body">
                    <i class="bi bi-clipboard2-x fs-1 text-muted mb-3 d-block"></i>
                    <h4 class="fw-semibold mb-3">No Notes Found</h4>
                    <p class="text-muted max-w-sm mx-auto mb-4">
                        We couldn't find items matching your search. Create a new task entry above to populate your Flask dashboard!
                    </p>
                    <button type="button" class="btn btn-warning" data-bs-toggle="modal" data-bs-target="#addTaskModal">
                        <i class="bi bi-plus-circle me-1"></i>Create First Entry
                    </button>
                </div>
            </div>
        {% endif %}
    </div>
</div>

<!-- Core Dashboard Create Modal -->
<div class="modal fade" id="addTaskModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <form action="{{ url_for('add_task') }}" method="POST" class="modal-content">
            <div class="modal-header bg-dark text-white">
                <h5 class="modal-title fw-bold">
                    <i class="bi bi-file-earmark-plus me-2"></i>Create New Flask Record
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label fw-semibold">Title</label>
                    <input type="text" name="title" class="form-control shadow-sm" placeholder="e.g. Brainstorm marketing copies" required>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-semibold">Detailed description</label>
                    <textarea name="description" rows="3" class="form-control shadow-sm" placeholder="Write context or subheadings here..."></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Priority level</label>
                        <select name="priority" class="form-select shadow-sm">
                            <option value="High">High</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">Category type</label>
                        <select name="category" class="form-select shadow-sm">
                            <option value="Work">Work Service</option>
                            <option value="Personal" selected>Personal Health</option>
                            <option value="Ideas">Ideas/Inspiration</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer bg-light border-top">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="submit" class="btn btn-warning text-dark px-4">Submit Entry</button>
            </div>
        </form>
    </div>
</div>
{% endblock %}
`
  },
  {
    name: "requirements.txt",
    path: "requirements.txt",
    language: "text",
    description: "Python standard dependency list required for Render, Heroku or PythonAnywhere pip installation.",
    content: `Flask==3.0.2
Flask-SQLAlchemy==3.1.1
SQLAlchemy==2.0.27
`
  },
  {
    name: "README.md",
    path: "README.md",
    language: "markdown",
    description: "Interactive instructions on starting, configuring, and deploying this Flask application on Render, Linux/Mac, or Windows.",
    content: `# Flask Mini Web App: Notes & Todo CRUD

A complete, working micro web application crafted with Python Flask, SQLite, and Bootstrap 5.

## Project Structure
\`\`\`text
├── app.py                  # Main Flask app routing, config & DB Models
├── requirements.txt        # python packages configuration
├── README.md               # setup and deployment instructions
├── instance/               # created automatically at runtime (contains SQLite database)
└── templates/              # Jinja2 template folder
    ├── base.html           # Bootstrap layout skeleton
    └── index.html          # dashboard cards lists, filter cards & forms
\`\`\`

## 🚀 Speedrun Local Installation

1. **Clone or Download files** from this applet's export panel to matching folder structures.
2. **Setup virtual directory environment**:
   \`\`\`bash
   # Create python environment
   python3 -m venv venv

   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   venv\\Scripts\\activate
   \`\`\`
3. **Install exact pip libraries**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
4. **Boot Flask local host server**:
   \`\`\`bash
   python app.py
   \`\`\`
5. Open your web browser of choice and browse to: \`http://127.0.0.1:5000\`.

---

## ☁️ Continuous Cloud Deployment

### Method A: Deploy on Render (Free Hosting tier)
1. Commit the code folder to your personal **GitHub repository**.
2. Visit **Render.com** and register or log in using GitHub.
3. Select **New** ➔ **Web Service**.
4. Connect your new GitHub repository.
5. In configuration form settings, set:
   * **Language**: \`Python 3\` or \`Python\`
   * **Build Command**: \`pip install -r requirements.txt\`
   * **Start Command**: \`gunicorn app:app\` (or install gunicorn library additionally in requirements, or keep \`python app.py\` running)
6. Press deploy. Render provisions and binds public networks immediately.

### Method B: Deploy on PythonAnywhere

1. Log in to your **PythonAnywhere** account.
2. Upload files in the \`Files\` section or use bash container run clone repository.
3. Head to the \`Web\` tab and click **Add a new web app**.
4. Choose **Manual configuration** and specify **Python 3.10** (or similar compatible version).
5. Open your virtual environment or install dependencies to user context (\`pip install --user flask flask-sqlalchemy\`).
6. Update the WSGI configuration file under Code paths \`/var/www/yourusername_pythonanywhere_com_wsgi.py\`:
   \`\`\`python
   import sys
   path = '/home/yourusername/folder_name'
   if path not in sys.path:
       sys.path.insert(0, path)

   from app import app as application
   \`\`\`
7. Re-boot your applet domain in the console dashboard. Beautiful active Flask routes will load!
`
  }
];
