class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        
        this.todoForm = document.getElementById('todo-form');
        this.todoInput = document.getElementById('todo-input');      
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');
        this.taskCount = document.getElementById('task-count');

        this.filterButtons = document.querySelectorAll('.filter-btn');

        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.editModal = document.getElementById('edit-modal');
        this.editForm = document.getElementById('edit-form');
        this.editInput = document.getElementById('edit-input');
        this.closeModalBtn = document.getElementById('close-modal');
        this.cancelEditBtn = document.getElementById('cancel-edit');
    }

    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.clearCompletedBtn.addEventListener('click', () => {
            this.clearCompleted();
        });

        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveToStorage();
        this.render();
        this.updateStats();
        
        this.todoInput.value = '';
        this.todoInput.focus();
        
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTodo(id) {
        const index = this.todos.findIndex(todo => todo.id === id);
        if (index > -1) {
            this.todos.splice(index, 1);
            this.saveToStorage();
            this.render();
            this.updateStats();
            this.showNotification('Task deleted!', 'info');
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            this.editingId = id;
            this.editInput.value = todo.text;
            this.openModal();
        }
    }

    saveEdit() {
        const text = this.editInput.value.trim();
        if (!text) return;

        const todo = this.todos.find(todo => todo.id === this.editingId);
        if (todo) {
            todo.text = text;
            this.saveToStorage();
            this.render();
            this.closeModal();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    openModal() {
        this.editModal.style.display = 'block';
        this.editInput.focus();
        this.editInput.select();
    }

    closeModal() {
        this.editModal.style.display = 'none';
        this.editingId = null;
        this.editInput.value = '';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        this.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.render();
    }

    clearCompleted() {
        const completedCount = this.todos.filter(todo => todo.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'warning');
            return;
        }

        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveToStorage();
        this.render();
        this.updateStats();
        this.showNotification(`${completedCount} completed task(s) cleared!`, 'info');
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
            
            const emptyMessage = this.getEmptyStateMessage();
            this.emptyState.querySelector('p').textContent = emptyMessage;
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('');
            
            this.addTodoEventListeners();
        }
    }

    createTodoElement(todo) {
        const completedClass = todo.completed ? 'completed' : '';
        const checked = todo.completed ? 'checked' : '';
        
        return `
            <li class="todo-item ${completedClass}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${checked}>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }

    addTodoEventListeners() {
        this.todoList.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const todoId = parseInt(e.target.closest('.todo-item').dataset.id);
                this.toggleTodo(todoId);
            });
        });

        this.todoList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('.todo-item').dataset.id);
                this.editTodo(todoId);
            });
        });

        this.todoList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const todoId = parseInt(e.target.closest('.todo-item').dataset.id);
                this.deleteTodo(todoId);
            });
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const active = total - completed;
        
        this.taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}`;
        this.clearCompletedBtn.style.display = completed > 0 ? 'block' : 'none';
    }

    getEmptyStateMessage() {
        switch (this.currentFilter) {
            case 'active':
                return 'No active tasks. Great job!';
            case 'completed':
                return 'No completed tasks yet.';
            default:
                return 'No tasks yet. Add your first task above!';
        }
    }

    saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            default: return '#17a2b8';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const todoInput = document.getElementById('todo-input');
        if (document.activeElement === todoInput) {
            document.getElementById('todo-form').dispatchEvent(new Event('submit'));
        }
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('todo-input').focus();
    }
});
