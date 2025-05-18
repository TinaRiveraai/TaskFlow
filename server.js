const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TASKS_FILE = './tasks.json';

app.use(express.json());
app.use(express.static('public'));

// Initialize tasks file if it doesn't exist
if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
}

// Get all tasks
app.get('/api/tasks', (req, res) => {
    try {
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read tasks' });
    }
});

// Add new task
app.post('/api/tasks', (req, res) => {
    try {
        const { title, priority } = req.body;
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        
        const newTask = {
            id: Date.now().toString(),
            title,
            priority: priority || 'medium',
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Update task status
app.put('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        tasks[taskIndex].status = status;
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        
        res.json(tasks[taskIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        
        const filteredTasks = tasks.filter(task => task.id !== id);
        if (filteredTasks.length === tasks.length) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        fs.writeFileSync(TASKS_FILE, JSON.stringify(filteredTasks, null, 2));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

app.listen(PORT, () => {
    console.log(`TaskFlow server running on http://localhost:${PORT}`);
});