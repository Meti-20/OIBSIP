# 🔐 SecureLogin — Authentication Dashboard

> A modern client-side authentication system built with HTML5, CSS3, Vanilla JavaScript, localStorage, and the Web Crypto API.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Web Crypto API](https://img.shields.io/badge/Web%20Crypto%20API-SHA--256-8B7355?style=flat-square)
![Responsive](https://img.shields.io/badge/Responsive-Design-6B7280?style=flat-square)
![Status](https://img.shields.io/badge/Status-Completed-2E7D32?style=flat-square)

---

## 📌 Overview

**SecureLogin** is a polished client-side authentication system designed as an internship project.

The application provides a complete authentication flow including user registration, password validation, password hashing, login authentication, session management, protected dashboard access, logout functionality, theme switching, and responsive design.

The project uses only **HTML5, CSS3, and Vanilla JavaScript**, with **localStorage** used for client-side data persistence and the browser's built-in **Web Crypto API** used for SHA-256 password hashing.

The interface was designed to feel like a modern authentication product while keeping the underlying code clean, understandable, and suitable for a student portfolio.

---

## 🎯 Project Objectives

The main objectives of SecureLogin are to:

- Build a complete client-side authentication system
- Implement user registration and login
- Validate user input in real time
- Prevent duplicate accounts
- Hash passwords before storing them
- Implement authenticated sessions
- Protect the dashboard from unauthenticated access
- Provide a functional logout system
- Create a polished and responsive user interface
- Implement dark and light themes
- Practice secure authentication concepts in a client-side environment
- Maintain clean and understandable Vanilla JavaScript

---

## ✨ Features

### 👤 User Registration

Users can create an account using:

- Username
- Email
- Password
- Confirm Password

Registration includes:

- Required-field validation
- Username validation
- Email validation
- Minimum 8-character password requirement
- At least one number requirement
- Password confirmation
- Real-time validation feedback
- Password strength indicator
- Duplicate username detection
- Duplicate email detection
- Password visibility controls

---

### 🔑 Secure Login

Users can authenticate using either:

- Username
- Email

The login system includes:

- Password authentication
- Show/hide password control
- Remember Me option
- Loading state
- Generic authentication errors
- Keyboard-friendly form submission
- Automatic redirection after successful authentication

For incorrect credentials, the application uses a generic message:

> **Invalid username/email or password.**

This prevents the interface from revealing whether the username, email, or password was incorrect.

---

### 🔐 Password Hashing

Passwords are **never stored as plaintext**.

Before a password is stored, it is processed using the browser's built-in **Web Crypto API** with SHA-256 hashing.

The authentication flow is:

```text
User enters password
        ↓
SHA-256 hashing
        ↓
Password hash stored
        ↓
User attempts login
        ↓
Entered password is hashed
        ↓
Hashes are compared
        ↓
Authentication succeeds or fails
```
