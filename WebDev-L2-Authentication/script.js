/**
 * ============================================================================
 * SECURELOGIN - Client-Side Authentication Engine
 * ============================================================================
 * Features:
 * - Web Crypto API (SHA-256) password hashing
 * - LocalStorage user database & session management
 * - Protected dashboard with session validation & expiration
 * - Real-time input validation & live password strength meter
 * - Duplicate user/email prevention
 * - Generic credential security messages
 * - Toast notification system (cross-page persistent)
 * - Dark / Light theme toggle with persistence (Dark by default)
 * - Accessible, responsive UI interactions
 * ============================================================================
 */

'use strict';

// ----------------------------------------------------------------------------
// 1. CONSTANTS & STORAGE KEYS
// ----------------------------------------------------------------------------
const STORAGE_KEYS = {
  USERS: 'secureLoginUsers',
  SESSION: 'secureLoginSession',
  THEME: 'secureLoginTheme',
  PENDING_TOAST: 'secureLoginPendingToast'
};

const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

// ----------------------------------------------------------------------------
// 2. CRYPTOGRAPHY / HASHING (Web Crypto API SHA-256)
// ----------------------------------------------------------------------------
/**
 * Hashes a plaintext password using the Web Crypto API SHA-256 algorithm.
 * Converts the digest into a hexadecimal representation.
 * @param {string} password - The raw password string
 * @returns {Promise<string>} Hexadecimal SHA-256 hash
 */
async function hashPassword(password) {
  if (typeof password !== 'string') {
    throw new Error('Invalid input: Password must be a string');
  }

  // Modern browser standard Web Crypto API
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (err) {
      console.warn('SubtleCrypto error, falling back to JS SHA-256 algorithm', err);
      return jsSha256(password);
    }
  }

  // Fallback SHA-256 implementation for legacy or restricted sandbox origins
  return jsSha256(password);
}

/**
 * Pure JavaScript standard SHA-256 implementation for absolute offline/file-protocol resilience
 */
function jsSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// ----------------------------------------------------------------------------
// 3. STORAGE & DATA MANAGEMENT
// ----------------------------------------------------------------------------
/**
 * Safely fetches all stored users from localStorage.
 * @returns {Array<Object>} List of registered users
 */
function getUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) return [];
    const users = JSON.parse(data);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Error reading users from storage:', error);
    return [];
  }
}

/**
 * Persists the user array into localStorage.
 * @param {Array<Object>} users - The array of user objects
 */
function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to storage:', error);
  }
}

/**
 * Finds a user by matching either username or email (case-insensitive).
 * @param {string} identifier - Username or Email
 * @returns {Object|null} The matching user object or null
 */
function findUser(identifier) {
  if (!identifier) return null;
  const cleanId = identifier.trim().toLowerCase();
  const users = getUsers();
  return users.find(u => 
    (u.username && u.username.toLowerCase() === cleanId) ||
    (u.email && u.email.toLowerCase() === cleanId)
  ) || null;
}

/**
 * Generates a collision-resistant unique ID for a new user.
 * @returns {string} Unique User ID
 */
function generateUserId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `usr_${timestamp}_${randomPart}`;
}

/**
 * Retrieves the current authentication session.
 * @returns {Object|null} Session data or null
 */
function getSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

/**
 * Saves a new authentication session.
 * @param {Object} sessionData - Session information
 */
function saveSession(sessionData) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Clears the active authentication session.
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Validates the current session against expiration and registered user record.
 * @returns {Object|null} The authenticated user object, or null if invalid/expired
 */
function validateSession() {
  const session = getSession();
  if (!session || !session.userId) {
    return null;
  }

  // Check expiration if timestamp exists
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearSession();
    return null;
  }

  // Ensure the referenced user actually exists in database
  const users = getUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) {
    clearSession();
    return null;
  }

  return user;
}

// ----------------------------------------------------------------------------
// 4. THEME MANAGEMENT (Dark / Light)
// ----------------------------------------------------------------------------
/**
 * Initializes and applies the theme from storage or defaults to dark.
 */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || THEMES.DARK;
  applyTheme(savedTheme);

  // Setup theme toggle buttons
  const themeToggleBtns = document.querySelectorAll('.theme-toggle');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

/**
 * Applies the selected theme to the root HTML element and updates icon states.
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  const currentTheme = theme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);

  // Update theme toggle icons
  const toggleIcons = document.querySelectorAll('.theme-toggle-icon');
  toggleIcons.forEach(icon => {
    if (currentTheme === THEMES.LIGHT) {
      // Show Moon icon (for switching to dark)
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`;
    } else {
      // Show Sun icon (for switching to light)
      icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`;
    }
  });
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || THEMES.DARK;
  const next = current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
  applyTheme(next);
}

// ----------------------------------------------------------------------------
// 5. TOAST NOTIFICATION SYSTEM
// ----------------------------------------------------------------------------
/**
 * Displays a non-blocking toast notification on screen.
 * @param {string} message - Toast message text
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Auto-dismiss delay in ms (default: 3500)
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`;
  }

  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" aria-label="Close notification">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  `;

  container.appendChild(toast);

  const dismissToast = () => {
    toast.classList.add('toast-hide');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 250);
  };

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', dismissToast);
  }

  if (duration > 0) {
    setTimeout(dismissToast, duration);
  }
}

/**
 * Sets a toast message to trigger immediately after a page navigation.
 * @param {string} message - Message content
 * @param {string} type - Toast type
 */
function setPendingToast(message, type = 'info') {
  try {
    sessionStorage.setItem(STORAGE_KEYS.PENDING_TOAST, JSON.stringify({ message, type }));
  } catch (e) {
    console.error('Session storage error:', e);
  }
}

/**
 * Checks for and displays any queued toast message across redirects.
 */
function checkPendingToast() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEYS.PENDING_TOAST);
    if (data) {
      const { message, type } = JSON.parse(data);
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_TOAST);
      setTimeout(() => showToast(message, type), 150);
    }
  } catch (e) {
    console.error('Error checking pending toast:', e);
  }
}

// ----------------------------------------------------------------------------
// 6. VALIDATION & FORMATTING UTILITIES
// ----------------------------------------------------------------------------
/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates email format according to standard web rules.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates username length and permitted characters.
 * @param {string} username
 * @returns {{isValid: boolean, message: string}}
 */
function validateUsername(username) {
  if (!username || !username.trim()) {
    return { isValid: false, message: 'Username is required' };
  }
  const clean = username.trim();
  if (clean.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  if (clean.length > 24) {
    return { isValid: false, message: 'Username must not exceed 24 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { isValid: false, message: 'Only letters, numbers, and underscores allowed' };
  }
  return { isValid: true, message: 'Username is valid' };
}

/**
 * Evaluates password strength and required rules.
 * Mandatory requirements:
 * - At least 8 characters
 * - At least 1 number
 * @param {string} password
 * @returns {{
 *   meetsMinLength: boolean,
 *   hasNumber: boolean,
 *   hasLetter: boolean,
 *   hasSpecial: boolean,
 *   isValid: boolean,
 *   score: number,
 *   label: string
 * }}
 */
function evaluatePasswordStrength(password) {
  const pwd = password || '';
  const meetsMinLength = pwd.length >= 8;
  const hasNumber = /\d/.test(pwd);
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

  const isValid = meetsMinLength && hasNumber;

  let score = 0;
  if (pwd.length > 0) {
    score = 1; // At least something typed -> Weak
  }
  if (meetsMinLength && hasNumber) {
    score = 2; // Meets mandatory baseline -> Medium
  }
  if (meetsMinLength && hasNumber && hasLetter && (hasSpecial || (hasUpper && hasLower) || pwd.length >= 12)) {
    score = 3; // Enhanced complexity -> Strong
  }

  let label = 'Weak';
  if (score === 3) {
    label = 'Strong';
  } else if (score === 2) {
    label = 'Medium';
  }

  return {
    meetsMinLength,
    hasNumber,
    hasLetter,
    hasSpecial,
    isValid,
    score,
    label
  };
}

/**
 * Formats date into readable format: "Month DD, YYYY" or "Month DD, YYYY at HH:MM AM/PM"
 * @param {string|Date} dateVal - ISO date string or Date instance
 * @param {boolean} includeTime - Whether to append time
 * @returns {string}
 */
function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return 'Never';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'Invalid date';

  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  if (!includeTime) {
    return d.toLocaleDateString('en-US', dateOptions);
  }

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const dateStr = d.toLocaleDateString('en-US', dateOptions);
  const timeStr = d.toLocaleTimeString('en-US', timeOptions);
  return `${dateStr} at ${timeStr}`;
}

// ----------------------------------------------------------------------------
// 7. PASSWORD VISIBILITY TOGGLE CONTROLLER
// ----------------------------------------------------------------------------
/**
 * Attaches show/hide password toggle handler to a button.
 * @param {HTMLElement} btn - Toggle button
 * @param {HTMLInputElement} input - Target password input
 */
function setupPasswordToggle(btn, input) {
  if (!btn || !input) return;

  const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
  const eyeSlashIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`;

  btn.innerHTML = eyeIcon;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = isPassword ? eyeSlashIcon : eyeIcon;
    btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });
}

// ----------------------------------------------------------------------------
// 8. REGISTRATION PAGE CONTROLLER
// ----------------------------------------------------------------------------
function initRegisterPage() {
  // If already logged in, redirect to dashboard
  if (validateSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('register-form');
  if (!form) return;

  const usernameInput = document.getElementById('register-username');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-confirm-password');
  const submitBtn = document.getElementById('register-submit-btn');

  // Password toggles
  setupPasswordToggle(document.getElementById('toggle-password-btn'), passwordInput);
  setupPasswordToggle(document.getElementById('toggle-confirm-password-btn'), confirmPasswordInput);

  // Live Password Strength UI elements
  const strengthBars = document.querySelectorAll('.strength-bar');
  const strengthText = document.getElementById('strength-text');
  const reqLength = document.getElementById('req-length');
  const reqNumber = document.getElementById('req-number');
  const matchFeedback = document.getElementById('match-feedback');

  /**
   * Updates the visual password meter and live requirements
   */
  function updatePasswordFeedback() {
    const pwd = passwordInput.value;
    const evaluation = evaluatePasswordStrength(pwd);

    // Update requirement checklist
    if (reqLength) {
      if (evaluation.meetsMinLength) {
        reqLength.classList.add('met');
      } else {
        reqLength.classList.remove('met');
      }
    }

    if (reqNumber) {
      if (evaluation.hasNumber) {
        reqNumber.classList.add('met');
      } else {
        reqNumber.classList.remove('met');
      }
    }

    // Update strength bars & label
    if (strengthBars && strengthBars.length > 0) {
      strengthBars.forEach((bar, index) => {
        bar.className = 'strength-bar';
        if (pwd.length > 0 && index < evaluation.score) {
          bar.classList.add(evaluation.label.toLowerCase());
        }
      });
    }

    if (strengthText) {
      strengthText.textContent = pwd.length > 0 ? evaluation.label : 'None';
      strengthText.className = 'strength-text ' + (pwd.length > 0 ? evaluation.label.toLowerCase() : '');
    }

    checkPasswordMatch();
  }

  /**
   * Checks if password and confirm password fields match
   */
  function checkPasswordMatch() {
    if (!matchFeedback) return;
    const pwd = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    if (!confirm) {
      matchFeedback.textContent = '';
      matchFeedback.className = 'form-feedback';
      confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
      return;
    }

    if (pwd === confirm) {
      matchFeedback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Passwords match`;
      matchFeedback.className = 'form-feedback success';
      confirmPasswordInput.classList.remove('is-invalid');
      confirmPasswordInput.classList.add('is-valid');
    } else {
      matchFeedback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Passwords do not match`;
      matchFeedback.className = 'form-feedback error';
      confirmPasswordInput.classList.remove('is-valid');
      confirmPasswordInput.classList.add('is-invalid');
    }
  }

  // Real-time input event listeners
  passwordInput.addEventListener('input', updatePasswordFeedback);
  confirmPasswordInput.addEventListener('input', checkPasswordMatch);

  usernameInput.addEventListener('blur', () => {
    const userVal = validateUsername(usernameInput.value);
    if (!userVal.isValid && usernameInput.value.trim() !== '') {
      usernameInput.classList.add('is-invalid');
      usernameInput.classList.remove('is-valid');
    } else if (userVal.isValid) {
      usernameInput.classList.remove('is-invalid');
      usernameInput.classList.add('is-valid');
    }
  });

  emailInput.addEventListener('blur', () => {
    const emailVal = emailInput.value.trim();
    if (emailVal && !isValidEmail(emailVal)) {
      emailInput.classList.add('is-invalid');
      emailInput.classList.remove('is-valid');
    } else if (isValidEmail(emailVal)) {
      emailInput.classList.remove('is-invalid');
      emailInput.classList.add('is-valid');
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // 1. Check for empty fields
    if (!username || !email || !password || !confirmPassword) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    // 2. Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      showToast(usernameValidation.message, 'error');
      usernameInput.focus();
      return;
    }

    // 3. Validate email
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    // 4. Validate password requirements (minimum 8 chars + 1 number)
    const pwdEval = evaluatePasswordStrength(password);
    if (!pwdEval.meetsMinLength) {
      showToast('Password must have at least 8 characters.', 'error');
      passwordInput.focus();
      return;
    }
    if (!pwdEval.hasNumber) {
      showToast('Password must contain at least 1 number.', 'error');
      passwordInput.focus();
      return;
    }

    // 5. Confirm password match
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      confirmPasswordInput.focus();
      return;
    }

    // 6. Duplicate User & Email Check
    const existingUsers = getUsers();
    const duplicate = existingUsers.some(u => 
      (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (duplicate) {
      showToast('An account with this username or email already exists.', 'error');
      return;
    }

    // Set loading state
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }

    try {
      // 7. Hash password using SHA-256 via Web Crypto API
      const passwordHash = await hashPassword(password);

      // 8. Create new user structure
      const newUser = {
        id: generateUserId(),
        username: username,
        email: email,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      // 9. Persist user to localStorage
      existingUsers.push(newUser);
      saveUsers(existingUsers);

      // 10. Queue success toast & redirect to Login page
      setPendingToast('Account created successfully. Please sign in.', 'success');
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Registration processing error:', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    }
  });
}

// ----------------------------------------------------------------------------
// 9. LOGIN PAGE CONTROLLER
// ----------------------------------------------------------------------------
function initLoginPage() {
  // If already logged in with valid session, redirect to dashboard
  if (validateSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('login-form');
  if (!form) return;

  const identifierInput = document.getElementById('login-identifier');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('remember-me');
  const submitBtn = document.getElementById('login-submit-btn');

  // Password toggle
  setupPasswordToggle(document.getElementById('toggle-password-btn'), passwordInput);

  // Handle Login Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;

    // 1. Basic empty check
    if (!identifier || !password) {
      showToast('Please enter both username/email and password.', 'error');
      return;
    }

    // Set loading state on button
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    }

    try {
      // 2. Lookup user by username OR email
      const user = findUser(identifier);

      // If user does not exist -> generic error
      if (!user) {
        // Add artificial delay to simulate realistic hash verification and protect against timing analysis
        await new Promise(r => setTimeout(r, 400));
        showToast('Invalid username/email or password.', 'error');
        if (submitBtn) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
        return;
      }

      // 3. Hash entered password with SHA-256
      const enteredHash = await hashPassword(password);

      // 4. Compare hashes
      if (enteredHash !== user.passwordHash) {
        await new Promise(r => setTimeout(r, 400));
        showToast('Invalid username/email or password.', 'error');
        if (submitBtn) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
        return;
      }

      // 5. Update user's lastLogin in localStorage
      const users = getUsers();
      const userIdx = users.findIndex(u => u.id === user.id);
      const loginTime = new Date().toISOString();
      if (userIdx !== -1) {
        users[userIdx].lastLogin = loginTime;
        saveUsers(users);
      }

      // 6. Create active authentication session
      // If Remember Me: 30 days session; otherwise 2 hours session
      const sessionDuration = rememberMe 
        ? (30 * 24 * 60 * 60 * 1000) 
        : (2 * 60 * 60 * 1000);

      const sessionData = {
        userId: user.id,
        username: user.username,
        email: user.email,
        loginTimestamp: loginTime,
        expiresAt: Date.now() + sessionDuration,
        rememberMe: rememberMe
      };

      saveSession(sessionData);

      // 7. Success notification & redirect to protected dashboard
      setPendingToast(`Welcome back, ${user.username}!`, 'success');
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Login error:', err);
      showToast('Authentication failed. Please try again.', 'error');
      if (submitBtn) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    }
  });
}

// ----------------------------------------------------------------------------
// 10. PROTECTED DASHBOARD PAGE CONTROLLER
// ----------------------------------------------------------------------------
function initDashboardPage() {
  // 1. Auth Guard - Check if valid session exists
  const currentUser = validateSession();
  const session = getSession();

  if (!currentUser || !session) {
    // Unauthenticated user -> Clear state, redirect to login
    clearSession();
    setPendingToast('Please sign in to access the dashboard.', 'error');
    window.location.href = 'index.html';
    return;
  }

  // 2. Render authenticated user info
  const greetingEl = document.getElementById('user-greeting');
  const usernameBadgeEl = document.getElementById('user-badge-name');
  const detailUsernameEl = document.getElementById('detail-username');
  const detailEmailEl = document.getElementById('detail-email');
  const detailMemberSinceEl = document.getElementById('detail-member-since');
  const detailLastLoginEl = document.getElementById('detail-last-login');
  const detailUserIdEl = document.getElementById('detail-user-id');
  const sessionExpiresEl = document.getElementById('session-expires-stat');
  const sessionRememberEl = document.getElementById('session-remember-stat');

  if (greetingEl) {
    greetingEl.textContent = `Welcome back, ${currentUser.username} 👋`;
  }

  if (usernameBadgeEl) {
    usernameBadgeEl.textContent = currentUser.username;
  }

  if (detailUsernameEl) {
    detailUsernameEl.textContent = currentUser.username;
  }

  if (detailEmailEl) {
    detailEmailEl.textContent = currentUser.email;
  }

  if (detailUserIdEl) {
    detailUserIdEl.textContent = currentUser.id;
  }

  if (detailMemberSinceEl) {
    detailMemberSinceEl.textContent = formatDate(currentUser.createdAt, false);
  }

  if (detailLastLoginEl) {
    detailLastLoginEl.textContent = formatDate(session.loginTimestamp || currentUser.lastLogin, true);
  }

  if (sessionExpiresEl) {
    if (session.rememberMe) {
      sessionExpiresEl.textContent = 'Persistent (30 Days)';
    } else {
      sessionExpiresEl.textContent = 'Standard (2 Hours)';
    }
  }

  if (sessionRememberEl) {
    sessionRememberEl.textContent = session.rememberMe ? 'Enabled' : 'Disabled';
  }

  // 3. Setup Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
}

/**
 * Handles user logout process cleanly.
 */
function handleLogout() {
  clearSession();
  setPendingToast('You have been logged out.', 'info');
  window.location.href = 'index.html';
}

// ----------------------------------------------------------------------------
// 11. GLOBAL INITIALIZATION
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Theme
  initTheme();

  // 2. Check for any queued toast messages across navigation
  checkPendingToast();

  // 3. Detect current page and invoke matching controller
  const currentPath = window.location.pathname.toLowerCase();

  if (document.getElementById('register-form') || currentPath.endsWith('register.html')) {
    initRegisterPage();
  } else if (document.getElementById('dashboard-main') || currentPath.endsWith('dashboard.html')) {
    initDashboardPage();
  } else if (document.getElementById('login-form') || currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
    initLoginPage();
  }
});
