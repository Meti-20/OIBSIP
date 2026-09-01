/**
 * ============================================================================
 * To-Do Web — Advanced Productivity Dashboard
 * Task 3 Internship Project — Vanilla JavaScript Implementation
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. STATE MANAGEMENT & CONSTANTS
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
  TASKS: 'todo_web_tasks_v1',
  THEME: 'todo_web_theme_v1'
};

// Application State
let tasks = [];
let editingTaskId = null;
let taskToDeleteId = null;
let currentSearchQuery = '';
let currentFilter = 'all';
let currentSort = 'newest';

// Sample Starter Tasks for First-time users
const DEFAULT_STARTER_TASKS = [
  {
    id: 'task_sample_1',
    text: 'Complete Internship Task 3 — To-Do Web Application',
    completed: false,
    priority: 'high',
    category: 'Work',
    dueDate: new Date().toISOString().split('T')[0], // Today
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: null
  },
  {
    id: 'task_sample_2',
    text: 'Review JavaScript DOM manipulation & event handling',
    completed: false,
    priority: 'medium',
    category: 'Study',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: null
  },
  {
    id: 'task_sample_3',
    text: 'Prepare presentation demo for evaluation meeting',
    completed: true,
    priority: 'high',
    category: 'Work',
    dueDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

// ---------------------------------------------------------------------------
// 2. DOM ELEMENT REFERENCES
// ---------------------------------------------------------------------------
const DOM = {
  // Theme Toggle
  themeToggle: document.getElementById('theme-toggle'),
  themeText: document.getElementById('theme-text'),
  headerDate: document.getElementById('header-date'),

  // Stats Elements
  statTotal: document.getElementById('stat-total'),
  statPending: document.getElementById('stat-pending'),
  statCompleted: document.getElementById('stat-completed'),
  statRate: document.getElementById('stat-rate'),

  // Progress Elements
  progressBarFill: document.getElementById('progress-bar-fill'),
  progressBadge: document.getElementById('progress-percentage-badge'),
  progressMessage: document.getElementById('progress-message'),

  // Form Elements
  taskForm: document.getElementById('task-form'),
  taskInput: document.getElementById('task-input'),
  taskPriority: document.getElementById('task-priority'),
  taskCategory: document.getElementById('task-category'),
  taskDueDate: document.getElementById('task-due-date'),

  // Controls Elements
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  filterSelect: document.getElementById('filter-select'),
  sortSelect: document.getElementById('sort-select'),
  activeFilterIndicator: document.getElementById('active-filter-indicator'),
  activeFilterText: document.getElementById('active-filter-text'),
  resetFilterBtn: document.getElementById('reset-filter-btn'),

  // Task Lists & Badges
  pendingTasksList: document.getElementById('pending-tasks-list'),
  completedTasksList: document.getElementById('completed-tasks-list'),
  pendingCountBadge: document.getElementById('pending-count-badge'),
  completedCountBadge: document.getElementById('completed-count-badge'),
  pendingEmptyState: document.getElementById('pending-empty-state'),
  completedEmptyState: document.getElementById('completed-empty-state'),
  clearCompletedBtn: document.getElementById('clear-completed-btn'),

  // Modal Elements
  deleteModal: document.getElementById('delete-modal'),
  deleteModalText: document.getElementById('delete-modal-text'),
  modalCancelBtn: document.getElementById('modal-cancel-btn'),
  modalConfirmBtn: document.getElementById('modal-confirm-btn'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

// ---------------------------------------------------------------------------
// 3. INITIALIZATION
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDateDisplay();
  loadTasks();
  initEventListeners();
  render();
});

/**
 * Initializes the header date display.
 */
function initDateDisplay() {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const today = new Date();
  DOM.headerDate.textContent = today.toLocaleDateString('en-US', options);
}

/**
 * Initializes and binds all application event listeners.
 */
function initEventListeners() {
  // Theme Switcher
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Task Creation Form Submit
  DOM.taskForm.addEventListener('submit', handleTaskFormSubmit);

  // Search Input (Real-time)
  DOM.searchInput.addEventListener('input', handleSearchInput);
  DOM.searchClearBtn.addEventListener('click', clearSearch);

  // Filter & Sort Change
  DOM.filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    render();
  });

  DOM.sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  // Reset Filter Button
  DOM.resetFilterBtn.addEventListener('click', resetAllFilters);

  // Clear All Completed Button
  DOM.clearCompletedBtn.addEventListener('click', handleClearCompleted);

  // Delete Modal Buttons
  DOM.modalCancelBtn.addEventListener('click', closeDeleteModal);
  DOM.modalConfirmBtn.addEventListener('click', confirmDeleteTask);

  // Close modal when clicking on overlay background
  DOM.deleteModal.addEventListener('click', (e) => {
    if (e.target === DOM.deleteModal) {
      closeDeleteModal();
    }
  });

  // Keyboard Shortcuts (Escape to close modals/cancel edit)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.deleteModal.classList.contains('is-active')) {
        closeDeleteModal();
      } else if (editingTaskId) {
        cancelInlineEdit();
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 4. THEME MANAGEMENT (DARK / LIGHT MODE)
// ---------------------------------------------------------------------------
/**
 * Initializes theme from localStorage or defaults to Dark mode.
 */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  applyTheme(savedTheme);
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
}

/**
 * Applies the given theme to HTML document and updates toggle text.
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  DOM.themeText.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
}

// ---------------------------------------------------------------------------
// 5. LOCAL STORAGE OPERATIONS
// ---------------------------------------------------------------------------
/**
 * Loads tasks from localStorage or seeds initial sample data.
 */
function loadTasks() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (rawData) {
      tasks = JSON.parse(rawData);
    } else {
      // First-time visit: seed with starter tasks
      tasks = [...DEFAULT_STARTER_TASKS];
      saveTasks();
    }
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    tasks = [];
  }
}

/**
 * Persists the current tasks array to localStorage.
 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
    showToast('Error saving data to local storage', 'danger');
  }
}

// ---------------------------------------------------------------------------
// 6. TASK CRUD OPERATIONS
// ---------------------------------------------------------------------------
/**
 * Handles adding a new task from the main input form.
 */
function handleTaskFormSubmit(e) {
  e.preventDefault();

  const title = DOM.taskInput.value.trim();
  const priority = DOM.taskPriority.value;
  const category = DOM.taskCategory.value;
  const dueDate = DOM.taskDueDate.value;

  // Validation: Check for empty or whitespace-only input
  if (!title) {
    showToast('Please enter a task title.', 'warning');
    DOM.taskInput.focus();
    return;
  }

  // Create new task object
  const newTask = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    text: title,
    completed: false,
    priority: priority,
    category: category,
    dueDate: dueDate || '',
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  // Add task to state
  tasks.unshift(newTask);
  saveTasks();

  // Reset form inputs
  DOM.taskInput.value = '';
  DOM.taskDueDate.value = '';
  DOM.taskPriority.value = 'medium';
  DOM.taskCategory.value = 'Personal';
  DOM.taskInput.focus();

  // Re-render UI & notify
  render();
  showToast('Task added successfully', 'success');
}

/**
 * Toggles a task between pending and completed.
 */
function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  task.completedAt = task.completed ? new Date().toISOString() : null;

  saveTasks();
  render();

  if (task.completed) {
    showToast('Task completed 🎉', 'success');
  } else {
    showToast('Task moved back to Pending', 'info');
  }
}

/**
 * Initiates the delete process by opening confirmation modal.
 */
function openDeleteModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  taskToDeleteId = taskId;
  DOM.deleteModalText.textContent = `Are you sure you want to permanently delete "${task.text}"? This action cannot be undone.`;
  DOM.deleteModal.classList.add('is-active');
  DOM.deleteModal.setAttribute('aria-hidden', 'false');
  DOM.modalConfirmBtn.focus();
}

/**
 * Closes the delete confirmation modal.
 */
function closeDeleteModal() {
  taskToDeleteId = null;
  DOM.deleteModal.classList.remove('is-active');
  DOM.deleteModal.setAttribute('aria-hidden', 'true');
}

/**
 * Confirms deletion of the selected task.
 */
function confirmDeleteTask() {
  if (!taskToDeleteId) return;

  tasks = tasks.filter(t => t.id !== taskToDeleteId);
  saveTasks();
  closeDeleteModal();
  render();
  showToast('Task deleted', 'danger');
}

/**
 * Clears all completed tasks at once.
 */
function handleClearCompleted() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  if (confirm(`Clear all ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`)) {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    render();
    showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`, 'info');
  }
}

// ---------------------------------------------------------------------------
// 7. INLINE EDITING OPERATIONS
// ---------------------------------------------------------------------------
/**
 * Enables inline edit mode for a specific task card.
 */
function startInlineEdit(taskId) {
  editingTaskId = taskId;
  render();

  // Focus the edit input field
  const editInput = document.getElementById(`edit-input-${taskId}`);
  if (editInput) {
    editInput.focus();
    editInput.select();
  }
}

/**
 * Cancels inline edit mode without saving changes.
 */
function cancelInlineEdit() {
  editingTaskId = null;
  render();
}

/**
 * Saves modifications made in inline edit mode.
 */
function saveInlineEdit(taskId) {
  const editInput = document.getElementById(`edit-input-${taskId}`);
  const editPriority = document.getElementById(`edit-priority-${taskId}`);
  const editCategory = document.getElementById(`edit-category-${taskId}`);
  const editDueDate = document.getElementById(`edit-due-date-${taskId}`);

  if (!editInput) return;

  const newText = editInput.value.trim();
  if (!newText) {
    showToast('Task title cannot be empty.', 'warning');
    editInput.focus();
    return;
  }

  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.text = newText;
    if (editPriority) task.priority = editPriority.value;
    if (editCategory) task.category = editCategory.value;
    if (editDueDate) task.dueDate = editDueDate.value;

    saveTasks();
    showToast('Task updated', 'success');
  }

  editingTaskId = null;
  render();
}

// ---------------------------------------------------------------------------
// 8. SEARCH, FILTERING & SORTING PIPELINE
// ---------------------------------------------------------------------------
/**
 * Handles real-time typing in the search bar.
 */
function handleSearchInput(e) {
  currentSearchQuery = e.target.value.trim().toLowerCase();
  DOM.searchClearBtn.style.display = currentSearchQuery ? 'flex' : 'none';
  render();
}

/**
 * Clears search input and refreshes list.
 */
function clearSearch() {
  DOM.searchInput.value = '';
  currentSearchQuery = '';
  DOM.searchClearBtn.style.display = 'none';
  DOM.searchInput.focus();
  render();
}

/**
 * Resets all search, filter, and sort options to default.
 */
function resetAllFilters() {
  DOM.searchInput.value = '';
  currentSearchQuery = '';
  DOM.searchClearBtn.style.display = 'none';
  
  currentFilter = 'all';
  DOM.filterSelect.value = 'all';

  currentSort = 'newest';
  DOM.sortSelect.value = 'newest';

  render();
  showToast('Filters reset to default', 'info');
}

/**
 * Filters the list of tasks according to search query and active filter.
 */
function applyFilterAndSearch(taskList) {
  return taskList.filter(task => {
    // 1. Search Query match
    if (currentSearchQuery) {
      const matchText = task.text.toLowerCase().includes(currentSearchQuery);
      const matchCategory = task.category.toLowerCase().includes(currentSearchQuery);
      if (!matchText && !matchCategory) return false;
    }

    // 2. Filter criteria
    if (currentFilter === 'all') return true;
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    if (currentFilter === 'high') return task.priority === 'high';
    if (currentFilter === 'medium') return task.priority === 'medium';
    if (currentFilter === 'low') return task.priority === 'low';
    if (currentFilter.startsWith('cat-')) {
      const targetCategory = currentFilter.replace('cat-', '');
      return task.category.toLowerCase() === targetCategory.toLowerCase();
    }

    return true;
  });
}

/**
 * Sorts the tasks array according to currentSort criteria.
 */
function applySorting(taskList) {
  const sorted = [...taskList];

  switch (currentSort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    case 'priority': {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return sorted.sort((a, b) => {
        const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    case 'due-date':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1; // Tasks with no due date come last
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

    default:
      return sorted;
  }
}

// ---------------------------------------------------------------------------
// 9. RENDERING FUNCTIONS
// ---------------------------------------------------------------------------
/**
 * Master render function: updates stats, progress bar, and both task columns.
 */
function render() {
  updateStatistics();
  updateProgress();
  updateFilterIndicator();

  // Process tasks through filter & sort
  const processedTasks = applySorting(applyFilterAndSearch(tasks));

  // Split into Pending and Completed lists
  const pendingTasks = processedTasks.filter(t => !t.completed);
  const completedTasks = processedTasks.filter(t => t.completed);

  // Render each column
  renderTaskList(DOM.pendingTasksList, pendingTasks, false);
  renderTaskList(DOM.completedTasksList, completedTasks, true);

  // Update counts
  const totalPendingInAll = tasks.filter(t => !t.completed).length;
  const totalCompletedInAll = tasks.filter(t => t.completed).length;

  DOM.pendingCountBadge.textContent = `${pendingTasks.length} pending`;
  DOM.completedCountBadge.textContent = `${completedTasks.length} completed`;

  // Empty state handling
  DOM.pendingEmptyState.classList.toggle('is-visible', pendingTasks.length === 0);
  DOM.completedEmptyState.classList.toggle('is-visible', completedTasks.length === 0);

  // Show "Clear All" button only if there are completed tasks
  DOM.clearCompletedBtn.style.display = totalCompletedInAll > 0 ? 'inline-block' : 'none';
}

/**
 * Renders a list of task cards into the specified UL container.
 */
function renderTaskList(container, taskList, isCompletedColumn) {
  container.innerHTML = '';

  taskList.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-card priority-${task.priority || 'medium'} ${task.completed ? 'is-completed' : ''}`;
    li.id = `task-card-${task.id}`;

    // If task is currently being edited inline
    if (editingTaskId === task.id) {
      li.innerHTML = renderInlineEditTemplate(task);
      attachInlineEditEvents(li, task.id);
    } else {
      li.innerHTML = renderTaskCardTemplate(task);
      attachTaskCardEvents(li, task.id);
    }

    container.appendChild(li);
  });
}

/**
 * HTML template for standard task card.
 */
function renderTaskCardTemplate(task) {
  const isOverdue = checkIsOverdue(task.dueDate, task.completed);
  const formattedDueDate = formatDueDate(task.dueDate);
  const priorityLabel = getPriorityLabel(task.priority);
  const categoryIcon = getCategoryIcon(task.category);
  const timestampText = task.completed
    ? `Completed ${formatTimestamp(task.completedAt)}`
    : `Added ${formatTimestamp(task.createdAt)}`;

  return `
    <button 
      type="button" 
      class="task-checkbox-btn" 
      data-action="toggle" 
      data-id="${task.id}" 
      aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
      title="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </button>

    <div class="task-content">
      <span class="task-title">${escapeHtml(task.text)}</span>
      
      <div class="task-meta">
        <!-- Priority Badge -->
        <span class="badge badge-priority-${task.priority || 'medium'}">
          ${priorityLabel}
        </span>

        <!-- Category Badge -->
        <span class="badge badge-category">
          ${categoryIcon} ${escapeHtml(task.category || 'General')}
        </span>

        <!-- Due Date Badge -->
        ${task.dueDate ? `
          <span class="badge badge-due-date">
            📅 ${formattedDueDate}
          </span>
        ` : ''}

        <!-- Overdue Warning Badge -->
        ${isOverdue ? `
          <span class="badge badge-overdue" title="Task is past its due date">
            ⚠️ Overdue
          </span>
        ` : ''}
      </div>

      <!-- Subtle Timestamps -->
      <span class="task-timestamp" title="${task.completed ? 'Completion timestamp' : 'Creation timestamp'}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        ${timestampText}
      </span>
    </div>

    <div class="task-actions">
      ${!task.completed ? `
        <button 
          type="button" 
          class="action-btn edit-btn" 
          data-action="edit" 
          data-id="${task.id}" 
          aria-label="Edit task" 
          title="Edit task"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      ` : ''}

      <button 
        type="button" 
        class="action-btn delete-btn" 
        data-action="delete" 
        data-id="${task.id}" 
        aria-label="Delete task" 
        title="Delete task"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;
}

/**
 * HTML template for inline editing a task card.
 */
function renderInlineEditTemplate(task) {
  return `
    <form class="task-edit-form" id="edit-form-${task.id}" onsubmit="return false;">
      <input 
        type="text" 
        id="edit-input-${task.id}" 
        class="task-edit-input" 
        value="${escapeHtml(task.text)}" 
        aria-label="Edit task title"
        required
        maxlength="200"
      >

      <div class="task-edit-controls">
        <select id="edit-priority-${task.id}" aria-label="Edit priority">
          <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
          <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
          <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 High</option>
        </select>

        <select id="edit-category-${task.id}" aria-label="Edit category">
          <option value="Personal" ${task.category === 'Personal' ? 'selected' : ''}>👤 Personal</option>
          <option value="Work" ${task.category === 'Work' ? 'selected' : ''}>💼 Work</option>
          <option value="Study" ${task.category === 'Study' ? 'selected' : ''}>📚 Study</option>
          <option value="Other" ${task.category === 'Other' ? 'selected' : ''}>📌 Other</option>
        </select>

        <input 
          type="date" 
          id="edit-due-date-${task.id}" 
          value="${task.dueDate || ''}" 
          aria-label="Edit due date"
        >

        <div class="task-edit-btn-group">
          <button type="button" class="btn-cancel" data-action="cancel-edit" data-id="${task.id}">
            Cancel
          </button>
          <button type="button" class="btn-save" data-action="save-edit" data-id="${task.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Save
          </button>
        </div>
      </div>
    </form>
  `;
}

/**
 * Attaches event listeners for standard task card buttons.
 */
function attachTaskCardEvents(element, taskId) {
  // Toggle Complete Button
  const toggleBtn = element.querySelector('[data-action="toggle"]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleTaskComplete(taskId));
  }

  // Edit Button
  const editBtn = element.querySelector('[data-action="edit"]');
  if (editBtn) {
    editBtn.addEventListener('click', () => startInlineEdit(taskId));
  }

  // Delete Button
  const deleteBtn = element.querySelector('[data-action="delete"]');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => openDeleteModal(taskId));
  }
}

/**
 * Attaches event listeners for inline editing controls.
 */
function attachInlineEditEvents(element, taskId) {
  const saveBtn = element.querySelector('[data-action="save-edit"]');
  const cancelBtn = element.querySelector('[data-action="cancel-edit"]');
  const input = element.querySelector(`#edit-input-${taskId}`);

  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveInlineEdit(taskId));
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelInlineEdit);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveInlineEdit(taskId);
      } else if (e.key === 'Escape') {
        cancelInlineEdit();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 10. STATISTICS & PROGRESS CALCULATIONS
// ---------------------------------------------------------------------------
/**
 * Calculates and updates productivity statistics cards.
 */
function updateStatistics() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  DOM.statTotal.textContent = total;
  DOM.statPending.textContent = pending;
  DOM.statCompleted.textContent = completed;
  DOM.statRate.textContent = `${rate}%`;
}

/**
 * Updates the daily progress bar and motivational feedback message.
 */
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  DOM.progressBarFill.style.width = `${rate}%`;
  DOM.progressBadge.textContent = `${rate}%`;

  // Dynamic feedback messages based on completion level
  if (total === 0) {
    DOM.progressMessage.textContent = 'Start adding tasks to track your productivity.';
  } else if (rate === 100) {
    DOM.progressMessage.textContent = 'All tasks completed! Outstanding job! 🎉';
  } else if (rate >= 75) {
    DOM.progressMessage.textContent = "Almost there! Finish strong today.";
  } else if (rate >= 50) {
    DOM.progressMessage.textContent = "Great momentum! You're past the halfway mark.";
  } else if (rate > 0) {
    DOM.progressMessage.textContent = 'Good start! Keep moving through your list.';
  } else {
    DOM.progressMessage.textContent = "Let's get started! Complete your first task today.";
  }
}

/**
 * Updates the active filter banner indicator.
 */
function updateFilterIndicator() {
  const isSearchActive = currentSearchQuery.length > 0;
  const isFilterActive = currentFilter !== 'all';

  if (isSearchActive || isFilterActive) {
    DOM.activeFilterIndicator.style.display = 'flex';
    
    let description = [];
    if (isSearchActive) description.push(`Search: "${currentSearchQuery}"`);
    if (isFilterActive) {
      const filterLabels = {
        pending: 'Pending Tasks',
        completed: 'Completed Tasks',
        high: 'High Priority',
        medium: 'Medium Priority',
        low: 'Low Priority',
        'cat-Personal': 'Personal Category',
        'cat-Work': 'Work Category',
        'cat-Study': 'Study Category',
        'cat-Other': 'Other Category'
      };
      description.push(`Filtered by ${filterLabels[currentFilter] || currentFilter}`);
    }

    DOM.activeFilterText.textContent = `Showing results for: ${description.join(' • ')}`;
  } else {
    DOM.activeFilterIndicator.style.display = 'none';
  }
}

// ---------------------------------------------------------------------------
// 11. TOAST NOTIFICATION SYSTEM
// ---------------------------------------------------------------------------
/**
 * Displays an elegant floating toast notification.
 * @param {string} message - Message text to display
 * @param {'success'|'info'|'warning'|'danger'} type - Notification type
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    danger: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
  };

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Trigger entrance transition
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Auto remove after 3.2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3200);
}

// ---------------------------------------------------------------------------
// 12. HELPER UTILITIES
// ---------------------------------------------------------------------------
/**
 * Checks if a task is overdue (past due date & pending).
 */
function checkIsOverdue(dueDateStr, isCompleted) {
  if (!dueDateStr || isCompleted) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);

  return dueDate < today;
}

/**
 * Formats a due date string (YYYY-MM-DD) into user-friendly text.
 */
function formatDueDate(dueDateStr) {
  if (!dueDateStr) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDateStr.split('-').map(Number);
  const dueDate = new Date(year, month - 1, day);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  const options = { month: 'short', day: 'numeric' };
  if (dueDate.getFullYear() !== today.getFullYear()) {
    options.year = 'numeric';
  }

  return `Due ${dueDate.toLocaleDateString('en-US', options)}`;
}

/**
 * Formats an ISO timestamp string into readable date and time.
 */
function formatTimestamp(isoString) {
  if (!isoString) return '';

  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today at ${timeString}`;
    }

    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });

    return `${dateString} at ${timeString}`;
  } catch {
    return '';
  }
}

/**
 * Returns formatted priority label with visual dot.
 */
function getPriorityLabel(priority) {
  switch (priority) {
    case 'high': return '🔴 High';
    case 'medium': return '🟡 Medium';
    case 'low': return '🟢 Low';
    default: return '🟡 Medium';
  }
}

/**
 * Returns category icon.
 */
function getCategoryIcon(category) {
  switch (category) {
    case 'Work': return '💼';
    case 'Personal': return '👤';
    case 'Study': return '📚';
    case 'Other': return '📌';
    default: return '🏷️';
  }
}

/**
 * Basic HTML escaping to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
