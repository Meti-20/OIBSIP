# ✅ To-Do Web

> A modern, responsive productivity dashboard designed to help users organize, prioritize, and manage their daily tasks efficiently.

![To-Do Web](https://img.shields.io/badge/Project-To--Do%20Web-111827)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![Responsive](https://img.shields.io/badge/Design-Responsive-22C55E)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

## 📌 About The Project

**To-Do Web** is a modern client-side task management application developed as **Task 3 of an internship project**.

The application goes beyond a basic to-do list by combining the required task-management functionality with additional productivity features such as priorities, categories, due dates, search, filtering, sorting, progress tracking, timestamps, theme switching, and persistent local storage.

The goal was to create an application that is not only functional but also provides a polished and professional user experience.

---

## ✨ Features

### 📝 Task Management

- Add new tasks
- Add tasks using the **Enter** key
- View tasks in **Pending Tasks**
- Mark tasks as completed
- Automatically move completed tasks to **Completed Tasks**
- Edit task text inline
- Save or cancel edits
- Delete tasks permanently
- Confirmation before deleting tasks
- Friendly empty-state messages

### 🎯 Task Organization

- Set task priority:
  - 🔴 High
  - 🟡 Medium
  - 🟢 Low
- Assign categories:
  - Personal
  - Work
  - Study
  - Other
- Set due dates
- Automatically identify overdue pending tasks
- Display task creation timestamps
- Display completion timestamps

### 🔎 Search, Filter & Sort

- Real-time task search
- Filter tasks by:
  - All
  - Pending
  - Completed
  - High Priority
  - Medium Priority
  - Low Priority
- Sort tasks by:
  - Newest first
  - Oldest first
  - Priority
  - Due date

### 📊 Productivity Dashboard

The dashboard dynamically displays:

- Total tasks
- Pending tasks
- Completed tasks
- Completion rate
- Daily progress percentage
- Visual progress bar

All statistics update automatically whenever tasks are added, completed, edited, or deleted.

### 💾 Persistent Data

Tasks are stored using **Browser Local Storage**, allowing them to remain available after:

- Page refresh
- Closing and reopening the browser

Stored task information includes:

- Task ID
- Task text
- Completion status
- Priority
- Category
- Due date
- Creation timestamp
- Completion timestamp

### 🌙 Theme Support

- Dark mode enabled by default
- Light mode
- Theme toggle
- Theme preference saved in Local Storage
- Smooth theme transitions

### 🔔 User Experience

- Toast notifications
- Smooth task animations
- Interactive hover states
- Responsive layout
- Friendly empty states
- Accessible form controls
- Keyboard-friendly interactions
- Visible focus states

---

## 🛠️ Technologies Used

| Technology             | Purpose                                                                      |
| ---------------------- | ---------------------------------------------------------------------------- |
| **HTML5**              | Semantic page structure                                                      |
| **CSS3**               | Layout, styling, responsiveness, animations, and themes                      |
| **Vanilla JavaScript** | Task management, DOM manipulation, filtering, sorting, and application logic |
| **Local Storage API**  | Persistent task and theme data                                               |

### No Frameworks

This project intentionally uses **Vanilla JavaScript** without React, Next.js, TypeScript, Bootstrap, Tailwind CSS, or a backend/database.

This keeps the application lightweight while demonstrating core frontend development skills.

---

## 📂 Project Structure

```text
to-do-web/
│
├── index.html      # Application structure
├── style.css       # Styling, responsive design, and themes
├── script.js       # Application logic and functionality
└── README.md       # Project documentation
```
