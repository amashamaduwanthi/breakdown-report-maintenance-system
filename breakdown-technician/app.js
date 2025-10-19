// Main application logic for Technician Dashboard
class TechnicianDashboard {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.assignedTasks = [];
        this.authUnsubscribe = null;
        this.tasksUnsubscribe = null;
        this.profileUnsubscribe = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    checkAuthState() {
        this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserProfile();
                this.showDashboard();
            } else {
                this.showLogin();
            }
        });
    }

    async loadUserProfile() {
        return new Promise((resolve) => {
            const userRef = ref(database, `users/${this.currentUser.uid}`);
            this.profileUnsubscribe = onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    this.userProfile = snapshot.val();
                    if (this.userProfile.role !== 'technician') {
                        alert('Access denied. Only technicians can access this dashboard.');
                        this.handleLogout();
                        return;
                    }
                    this.loadAssignedTasks();
                    resolve();
                }
            });
        });
    }

    loadAssignedTasks() {
        const tasksRef = ref(database, 'breakdowns');
        const tasksQuery = query(tasksRef, orderByChild('assignedTechnician/uid'), equalTo(this.currentUser.uid));
        
        this.tasksUnsubscribe = onValue(tasksQuery, (snapshot) => {
            this.assignedTasks = [];
            snapshot.forEach((childSnapshot) => {
                const task = {
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                };
                this.assignedTasks.push(task);
            });
            this.displayTasks();
        });
    }

    displayTasks() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;

        tasksList.innerHTML = '';
        
        if (this.assignedTasks.length === 0) {
            tasksList.innerHTML = '<div class="no-tasks">No assigned tasks</div>';
            return;
        }

        this.assignedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-card';
        taskDiv.innerHTML = `
            <div class="task-header">
                <h3>${this.escapeHtml(task.message)}</h3>
                <span class="status status-${task.status}">${this.getStatusLabel(task.status)}</span>
            </div>
            <div class="task-details">
                <p><strong>Reporter:</strong> ${this.escapeHtml(task.reporterName)} (${this.escapeHtml(task.reporterEmail)})</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Created:</strong> ${this.formatDate(task.timestamps?.createdAt)}</p>
                ${task.fixDetails ? `<p><strong>Fix Details:</strong> ${this.escapeHtml(task.fixDetails)}</p>` : ''}
            </div>
            <div class="task-actions">
                <select id="statusSelect-${task.id}" onchange="dashboard.updateTaskStatus('${task.id}', this.value)">
                    <option value="approved" ${task.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                    <option value="resolved" ${task.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
                <button onclick="dashboard.addTaskUpdate('${task.id}')" class="btn-update">Add Update</button>
            </div>
            <div class="task-updates" id="updates-${task.id}">
                ${this.renderTaskUpdates(task.updates)}
            </div>
        `;
        return taskDiv;
    }

    renderTaskUpdates(updates) {
        if (!updates) return '<p class="no-updates">No updates yet</p>';
        
        const updatesList = Object.values(updates)
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
            .map(update => `
                <div class="update-item">
                    <div class="update-meta">
                        <span class="update-author">${this.escapeHtml(update.authorName)}</span>
                        <span class="update-time">${this.formatDate(update.createdAt)}</span>
                    </div>
                    <p class="update-message">${this.escapeHtml(update.message)}</p>
                </div>
            `).join('');
        
        return `<div class="updates-list">${updatesList}</div>`;
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            const taskRef = ref(database, `breakdowns/${taskId}`);
            await update(taskRef, {
                status: newStatus,
                'timestamps/updatedAt': serverTimestamp()
            });
            
            if (newStatus === 'resolved') {
                await update(taskRef, {
                    'timestamps/resolvedAt': serverTimestamp()
                });
            }
            
            // Add automatic update
            await this.addTaskUpdate(taskId, `Status changed to ${this.getStatusLabel(newStatus)}`);
            
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Error updating task status');
        }
    }

    async addTaskUpdate(taskId, message = null) {
        if (!message) {
            message = prompt('Enter update message:');
            if (!message) return;
        }
        
        try {
            const newUpdateRef = ref(database, `breakdowns/${taskId}/updates/${Date.now()}`);
            await update(newUpdateRef, {
                authorUid: this.currentUser.uid,
                authorName: this.userProfile.displayName,
                message: message,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error adding task update:', error);
            alert('Error adding task update');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    }

    async handleLogout() {
        try {
            this.cleanup();
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    cleanup() {
        if (this.authUnsubscribe) {
            this.authUnsubscribe();
            this.authUnsubscribe = null;
        }
        if (this.tasksUnsubscribe) {
            this.tasksUnsubscribe();
            this.tasksUnsubscribe = null;
        }
        if (this.profileUnsubscribe) {
            this.profileUnsubscribe();
            this.profileUnsubscribe = null;
        }
    }

    showLogin() {
        const loginSection = document.getElementById('loginSection');
        const dashboard = document.getElementById('dashboard');
        if (loginSection) loginSection.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
    }

    showDashboard() {
        const loginSection = document.getElementById('loginSection');
        const dashboard = document.getElementById('dashboard');
        const userInfo = document.getElementById('userInfo');
        
        if (loginSection) loginSection.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        if (userInfo && this.userProfile) {
            userInfo.innerHTML = `
                <span>Welcome, ${this.escapeHtml(this.userProfile.displayName)}</span>
                <span class="role">Technician</span>
            `;
        }
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'approved': 'Approved',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'rejected': 'Rejected'
        };
        return labels[status] || status;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new TechnicianDashboard();
});

