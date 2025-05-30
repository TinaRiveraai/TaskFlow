class TaskFlow {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTasks();
    }

    bindEvents() {
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        searchInput.addEventListener('input', (e) => this.setSearchQuery(e.target.value));
        clearSearchBtn.addEventListener('click', () => this.clearSearch());

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('Failed to load tasks. Please refresh the page.');
        }
    }

    async addTask() {
        const titleInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        
        const title = titleInput.value.trim();
        if (!title) return;

        const taskData = {
            title,
            priority: prioritySelect.value
        };

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const newTask = await response.json();
                this.tasks.push(newTask);
                titleInput.value = '';
                this.renderTasks();
            }
        } catch (error) {
            console.error('Failed to add task:', error);
            this.showError('Failed to add task. Please try again.');
        }
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    this.renderTasks();
                }
            }
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    async deleteTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.renderTasks();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        
        // Apply status filter
        if (this.currentFilter !== 'all') {
            const statusMap = {
                'todo': 'todo',
                'progress': 'progress',
                'done': 'done'
            };
            filtered = filtered.filter(task => task.status === statusMap[this.currentFilter]);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }

    setSearchQuery(query) {
        this.searchQuery = query.trim();
        this.renderTasks();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        searchInput.value = '';
        this.searchQuery = '';
        this.renderTasks();
    }

    renderTasks() {
        const todoContainer = document.getElementById('todoTasks');
        const progressContainer = document.getElementById('progressTasks');
        const doneContainer = document.getElementById('doneTasks');

        // Clear containers
        todoContainer.innerHTML = '';
        progressContainer.innerHTML = '';
        doneContainer.innerHTML = '';

        const filteredTasks = this.getFilteredTasks();

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch (task.status) {
                case 'todo':
                    todoContainer.appendChild(taskElement);
                    break;
                case 'progress':
                    progressContainer.appendChild(taskElement);
                    break;
                case 'done':
                    doneContainer.appendChild(taskElement);
                    break;
            }
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item priority-${task.priority}`;
        taskDiv.innerHTML = `
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <span class="task-date">${new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="task-actions">
                ${this.getActionButtons(task)}
                <button class="action-btn delete-btn" onclick="taskFlow.deleteTask('${task.id}')">Delete</button>
            </div>
        `;
        
        return taskDiv;
    }

    getActionButtons(task) {
        const buttons = [];
        
        switch (task.status) {
            case 'todo':
                buttons.push(`<button class="action-btn move-btn" onclick="taskFlow.updateTaskStatus('${task.id}', 'progress')">Start</button>`);
                break;
            case 'progress':
                buttons.push(`<button class="action-btn move-btn" onclick="taskFlow.updateTaskStatus('${task.id}', 'todo')">Back</button>`);
                buttons.push(`<button class="action-btn move-btn" onclick="taskFlow.updateTaskStatus('${task.id}', 'done')">Complete</button>`);
                break;
            case 'done':
                buttons.push(`<button class="action-btn move-btn" onclick="taskFlow.updateTaskStatus('${task.id}', 'progress')">Reopen</button>`);
                break;
        }
        
        return buttons.join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
            z-index: 1000;
            font-weight: 500;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskFlow = new TaskFlow();
});