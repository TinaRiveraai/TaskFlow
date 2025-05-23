class TaskFlow {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTasks();
    }

    bindEvents() {
        const addBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
    }

    async loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Failed to load tasks:', error);
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
        if (this.currentFilter === 'all') return this.tasks;
        return this.tasks.filter(task => {
            const statusMap = {
                'todo': 'todo',
                'progress': 'progress',
                'done': 'done'
            };
            return task.status === statusMap[this.currentFilter];
        });
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskFlow = new TaskFlow();
});