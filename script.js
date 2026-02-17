// API Client is initialized in api-client.js as a global variable
// No need to re-declare it here
// Page modules configuration is defined inside DOMContentLoaded handler below

console.log('✓ Main script loaded!');

// Apply saved theme immediately on load
(function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    let effectiveTheme = savedTheme;
    
    if (savedTheme === 'auto') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.classList.add(`theme-${effectiveTheme}`);
    console.log('🎨 Applied saved theme:', savedTheme, '(effective:', effectiveTheme + ')');
})();

// Apply saved language immediately on load
(function applySavedLanguage() {
    const savedLang = localStorage.getItem('app_language') || 'en';
    if (window.Translator) {
        window.Translator.setLang(savedLang);
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ DOM Content Loaded');

    // ========== MOBILE SIDEBAR TOGGLE ==========
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        if (hamburgerBtn) hamburgerBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            if (sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when a nav link is clicked (on mobile)
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1024) {
                closeSidebar();
            }
        });
    });

    // Close sidebar on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Auto-close sidebar on resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
    });
    // ========== END MOBILE SIDEBAR TOGGLE ==========

    // Register modal logic
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const registerModal = document.getElementById('registerModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const sendVerificationCodeBtn = document.getElementById('sendVerificationCodeBtn');
    const registerBtn = document.getElementById('registerBtn');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerCode = document.getElementById('registerCode');
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    const registerStep1 = document.getElementById('registerStep1');
    const registerStep2 = document.getElementById('registerStep2');
    const registerResendCodeLink = document.getElementById('registerResendCode');
    if (showRegisterBtn && registerModal && closeRegisterModal && sendVerificationCodeBtn && registerBtn) {
        showRegisterBtn.onclick = function() {
            registerModal.classList.add('show');
            registerError.textContent = '';
            registerSuccess.textContent = '';
            registerEmail.value = '';
            registerPassword.value = '';
            registerCode.value = '';
            registerStep1.style.display = '';
            registerStep2.style.display = 'none';
        };
        closeRegisterModal.onclick = function() {
            registerModal.classList.remove('show');
        };
        // Step 1: Send verification code
        sendVerificationCodeBtn.onclick = async function() {
            const email = registerEmail.value.trim();
            registerError.textContent = '';
            registerSuccess.textContent = '';
            if (!email) {
                registerError.textContent = 'Please enter your email.';
                return;
            }
            try {
                await apiClient.request('/public-register/send-verification-code', {
                    method: 'POST',
                    body: { recipient: email },
                    headers: { 'Content-Type': 'application/json' }
                });
                registerStep1.style.display = 'none';
                registerStep2.style.display = '';
                registerSuccess.textContent = 'Verification code sent! Please check your email.';
            } catch (err) {
                registerError.textContent = err.message || 'Failed to send verification code.';
            }
        };
        // Step 2: Register with code
        registerBtn.onclick = async function() {
            const email = registerEmail.value.trim();
            const password = registerPassword.value.trim();
            const code = registerCode.value.trim();
            registerError.textContent = '';
            registerSuccess.textContent = '';
            if (!email || !password || !code) {
                registerError.textContent = 'Please fill in all fields.';
                return;
            }
            try {
                await apiClient.request('/public-register/register-admin-verified', {
                    method: 'POST',
                    body: { email, password, code },
                });
                registerSuccess.textContent = 'Admin account created successfully! Redirecting to login...';
                setTimeout(() => {
                    registerModal.classList.remove('show');
                    location.reload();
                }, 1500);
            } catch (err) {
                registerError.textContent = err.message || 'Registration failed.';
            }
        };
        // Resend code
        registerResendCodeLink.onclick = function() {
            sendVerificationCodeBtn.onclick();
        };
        // Close modal on overlay click
        registerModal.querySelector('.modal-overlay').onclick = function() {
            registerModal.classList.remove('show');
        };
    }

    // Avatar dropdown logic
    const avatarBtn = document.getElementById('avatarDropdownBtn');
    const avatarDropdown = document.getElementById('avatarDropdown');
    if (avatarBtn && avatarDropdown) {
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarDropdown.style.display = (avatarDropdown.style.display === 'none' || avatarDropdown.style.display === '') ? 'block' : 'none';
        });
        document.addEventListener('click', function(e) {
            if (avatarDropdown.style.display === 'block') {
                avatarDropdown.style.display = 'none';
            }
        });
        avatarDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        document.getElementById('settingsMenu').onclick = function() {
            loadPage('settings');
        };
        document.getElementById('logoutMenu').onclick = function() {
            window.location.hash = '#logout';
            location.reload();
        };
    }

// Page modules configuration
const pageModules = {
    'dashboard': {
        html: 'pages/dashboard.html?v=' + Date.now(),
        css: 'pages/dashboard.css?v=' + Date.now(),
        js: 'pages/dashboard.js?v=' + Date.now(),
        title: 'Dashboard Overview'
    },
    'scan': {
        html: 'pages/scan.html',
        css: 'pages/scan.css',
        js: 'pages/scan.js?v=' + Date.now(),
        title: 'Scan History'
    },
    'pest-management': {
        html: 'pages/pest-management.html',
        css: 'pages/pest-management.css',
        js: 'pages/pest-management.js?v=' + Date.now(),
        title: 'Pest Type Management'
    },
    'feedback': {
        html: 'pages/feedback.html',
        css: 'pages/feedback.css',
        js: 'pages/feedback.js?v=' + Date.now(),
        title: 'User Feedback & Reports'
    },
    'knowledge': {
        html: 'pages/knowledge.html',
        css: 'pages/knowledge.css',
        js: 'pages/knowledge.js?v=' + Date.now(),
        title: 'Knowledge Base'
    },
    'users': {
        html: 'pages/users.html',
        css: 'pages/users.css',
        js: 'pages/users.js?v=' + Date.now(),
        title: 'User Management'
    },
    'notifications': {
        html: 'pages/notifications.html?v=' + Date.now(),
        css: 'pages/notifications.css?v=' + Date.now(),
        js: 'pages/notifications.js?v=' + Date.now(),
        title: 'Pest Alerts'
    },
    'settings': {
        html: 'pages/settings.html?v=' + Date.now(),
        css: 'pages/settings.css?v=' + Date.now(),
        js: 'pages/settings.js?v=' + Date.now(),
        title: 'Settings'
    }
};

const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const loginPage = document.getElementById('loginPage');
const mainDashboard = document.getElementById('mainDashboard');
const pageContainer = document.getElementById('pageContainer');
const pageTitle = document.getElementById('pageTitle');


console.log('✓ Elements found:');
console.log('  loginBtn:', !!loginBtn);
console.log('  pageContainer:', !!pageContainer);
console.log('  pageTitle:', !!pageTitle);

// Load page dynamically using XMLHttpRequest (works with file:// protocol)
function loadPage(pageName) {
    try {
        const module = pageModules[pageName];
        if (!module) {
            console.error('❌ Module not found:', pageName);
            return;
        }

        console.log('⏳ Loading page:', pageName);

        // Load HTML using XMLHttpRequest (works with file:// protocol)
        const xhr = new XMLHttpRequest();
        xhr.open('GET', module.html, true);
        xhr.onload = function() {
            if (xhr.status === 0 || xhr.status === 200) {
                pageContainer.innerHTML = xhr.responseText;
                console.log('✓ HTML loaded:', module.html);

                // Load CSS dynamically
                if (module.css) {
                    const cssId = `css-${pageName}`;
                    const existingLink = document.getElementById(cssId);
                    if (existingLink) {
                        existingLink.remove();
                    }
                    
                    const link = document.createElement('link');
                    link.id = cssId;
                    link.rel = 'stylesheet';
                    // Check if version is already in the string (from pageModules config)
                    if (module.css.includes('?v=')) {
                        link.href = module.css;
                    } else {
                        link.href = `${module.css}?v=${new Date().getTime()}`;
                    }
                    document.head.appendChild(link);
                    console.log('✓ CSS loaded:', module.css);
                }

                // Convert page name to camelCase for module name lookup
                // e.g., 'pest-management' -> 'pestManagementModule'
                const camelCaseName = pageName.split('-').map((word, index) => {
                    if (index === 0) return word;
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }).join('');
                const moduleVarName = camelCaseName + 'Module';
                console.log('🔍 Looking for module:', moduleVarName);
                console.log('✓ Available modules:', Object.keys(window).filter(k => k.includes('Module')));

                // Always call module init after HTML is loaded
                const reinitModule = () => {
                    const moduleInitFunc = window[moduleVarName];
                    if (moduleInitFunc && moduleInitFunc.init) {
                        console.log('✓ (Re)Initializing module:', moduleVarName);
                        try {
                            moduleInitFunc.init();
                            console.log('✅ Module initialized successfully');
                        } catch (err) {
                            console.error('❌ Error during module init:', err);
                        }
                    } else {
                        console.warn('❌ Module not found or missing init:', moduleVarName);
                        console.warn('🔍 Available window properties:', Object.keys(window).filter(k => k.includes('module')));
                    }
                    // Apply translations to newly loaded page content
                    if (window.Translator) {
                        window.Translator.applyTranslations();
                    }
                };

                const existingScript = document.getElementById(`js-${pageName}`);
                if (existingScript) {
                    existingScript.remove(); // Always remove old script to force reload
                }

                const script = document.createElement('script');
                script.id = `js-${pageName}`;
                // Add timestamp to prevent caching during development
                script.src = `${module.js}?v=${new Date().getTime()}`;
                script.onload = () => {
                    console.log('✓ Script loaded:', module.js);
                    setTimeout(reinitModule, 100);
                };
                script.onerror = () => {
                    console.error('❌ Failed to load script:', module.js);
                };
                document.body.appendChild(script);

                // Update page title (use translated version if available)
                if (window.Translator) {
                    const titleKey = 'page.' + pageName.replace(/-/g, '_');
                    const translated = window.Translator.t(titleKey);
                    pageTitle.textContent = (translated !== titleKey) ? translated : module.title;
                } else {
                    pageTitle.textContent = module.title;
                }
            } else {
                throw new Error(`Failed to load ${module.html}: ${xhr.status}`);
            }
        };
        
        xhr.onerror = function() {
            console.error('❌ Error loading page:', xhr.status);
            pageContainer.innerHTML = `<div class="table-card"><h3>Error loading page: ${xhr.status}</h3></div>`;
        };
        
        xhr.send();
    } catch (error) {
        console.error('❌ Error loading page:', error);
        pageContainer.innerHTML = `<div class="table-card"><h3>Error loading page: ${error.message}</h3></div>`;
    }
}

// Login function
async function handleLogin() {
    console.log('Login button clicked!');
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('Username entered:', username);
    console.log('Password entered:', password);
    
    if (!username || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        const response = await apiClient.login(username, password);
        console.log('Login successful!', response);
        
        loginPage.classList.add('hidden');
        mainDashboard.classList.remove('hidden');
        
        // Display current user info in header from login response
        const userData = response.user || {};
        const email = userData.email || '';
        const role = userData.role === 'admin' ? 'Admin' : (userData.role || 'User');
        const initial = (role.charAt(0) || 'A').toUpperCase();
        // Update header avatar and info
        const avatarEl = document.getElementById('avatarDropdownBtn');
        if (avatarEl) avatarEl.textContent = initial;
        const headerUsername = document.getElementById('headerUsername');
        if (headerUsername) headerUsername.textContent = role;
        const headerEmail = document.getElementById('headerEmail');
        if (headerEmail) headerEmail.textContent = email;
        // Update dropdown avatar and info
        const dropdownAvatar = document.querySelector('.dropdown-avatar');
        if (dropdownAvatar) dropdownAvatar.textContent = initial;
        const dropdownUsername = document.getElementById('dropdownUsername');
        if (dropdownUsername) dropdownUsername.textContent = role;
        const dropdownEmail = document.getElementById('dropdownEmail');
        if (dropdownEmail) dropdownEmail.textContent = email;

        // Apply translations to dashboard sidebar/header
        if (window.Translator) {
            window.Translator.applyTranslations();
        }
        
        // Load dashboard on login
        loadPage('dashboard');
        
        // Check for pest alerts
        setTimeout(() => {
            if (typeof checkForNewAlerts === 'function') {
                checkForNewAlerts();
            }
        }, 1000);
    } catch (error) {
        console.error('Login failed:', error);
        
        // Show alert with appropriate error message
        let errorMessage = 'Invalid username or password. Please try again.';
        
        if (error.message.includes('credentials')) {
            errorMessage = 'Invalid username or password!\n\nPlease check your credentials and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error!\n\nPlease check your connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// Add click event
if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
    console.log('✓ Login button event listener added!');
} else {
    console.error('❌ Login button not found!');
}

// Add Enter key support for login form
if (usernameInput && passwordInput) {
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    console.log('✓ Enter key support added for login form!');
}

// Forgot Password Link Handler
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const backToLoginLink = document.getElementById('backToLoginLink');
const resetLinkBtn = document.getElementById('resetLinkBtn');
const forgotEmailInput = document.getElementById('forgotEmailInput');
const forgotError = document.getElementById('forgotError');
const forgotSuccess = document.getElementById('forgotSuccess');
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

// Password Reset Flow State
let resetEmail = '';
let resetCode = '';

// Step elements
const step1Email = document.getElementById('step1-email');
const step2Code = document.getElementById('step2-code');
const step3Password = document.getElementById('step3-password');
const step4Success = document.getElementById('step4-success');

// Step 2 elements
const sentToEmail = document.getElementById('sentToEmail');
const verificationCodeInput = document.getElementById('verificationCodeInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
const resendCodeLink = document.getElementById('resendCodeLink');
const backToStep1 = document.getElementById('backToStep1');
const codeError = document.getElementById('codeError');
const codeSuccess = document.getElementById('codeSuccess');

// Step 3 elements
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const resetPasswordBtn = document.getElementById('resetPasswordBtn');
const passwordError = document.getElementById('passwordError');
const passwordSuccess = document.getElementById('passwordSuccess');

// Step 4 elements
const goToLoginBtn = document.getElementById('goToLoginBtn');

// Helper function to show a step
function showPasswordResetStep(stepNumber) {
    [step1Email, step2Code, step3Password, step4Success].forEach(step => {
        if (step) step.classList.add('hidden');
    });
    
    switch(stepNumber) {
        case 1:
            if (step1Email) step1Email.classList.remove('hidden');
            break;
        case 2:
            if (step2Code) step2Code.classList.remove('hidden');
            break;
        case 3:
            if (step3Password) step3Password.classList.remove('hidden');
            break;
        case 4:
            if (step4Success) step4Success.classList.remove('hidden');
            break;
    }
}

// Clear all error/success messages
function clearPasswordResetMessages() {
    [forgotError, forgotSuccess, codeError, codeSuccess, passwordError, passwordSuccess].forEach(el => {
        if (el) {
            el.textContent = '';
            el.classList.remove('show');
        }
    });
}

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔑 Forgot Password link clicked');
        loginForm.classList.add('hidden');
        forgotPasswordForm.classList.remove('hidden');
        clearPasswordResetMessages();
        showPasswordResetStep(1);
        if (forgotEmailInput) forgotEmailInput.value = '';
        resetEmail = '';
        resetCode = '';
    });
    console.log('✓ Forgot Password link event listener added!');
}

if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('← Back to Login clicked');
        forgotPasswordForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        clearPasswordResetMessages();
        showPasswordResetStep(1);
    });
    console.log('✓ Back to Login link event listener added!');
}

// Step 1: Send verification code
if (resetLinkBtn) {
    resetLinkBtn.addEventListener('click', async () => {
        const email = forgotEmailInput.value.trim();
        console.log('Send Verification Code clicked for:', email);
        
        if (!email) {
            forgotError.textContent = '❌ Please enter your email address';
            forgotError.classList.add('show');
            return;
        }
        
        if (!isValidEmail(email)) {
            forgotError.textContent = '❌ Please enter a valid email address';
            forgotError.classList.add('show');
            return;
        }
        
        // Disable button and show loading
        resetLinkBtn.disabled = true;
        resetLinkBtn.textContent = 'Sending...';
        forgotError.textContent = '';
        
        try {
            const response = await apiClient.requestPasswordReset(email);
            
            if (response.success) {
                resetEmail = email;
                forgotSuccess.textContent = '✅ ' + response.message;
                forgotSuccess.classList.add('show');
                
                // Move to step 2 after short delay
                setTimeout(() => {
                    clearPasswordResetMessages();
                    if (sentToEmail) sentToEmail.textContent = email;
                    showPasswordResetStep(2);
                    if (verificationCodeInput) verificationCodeInput.focus();
                }, 1500);
            } else {
                forgotError.textContent = '❌ ' + (response.message || 'Failed to send code');
                forgotError.classList.add('show');
            }
        } catch (error) {
            console.error('Error sending reset code:', error);
            const errMsg = error.message || 'Failed to send verification code';
            // Show a prominent alert for "no account found"
            if (errMsg.toLowerCase().includes('no account found') || errMsg.toLowerCase().includes('create an account')) {
                forgotError.textContent = '';
                forgotError.classList.remove('show');
                alert('⚠️ Account Not Found\n\nNo account found with that email. Please create an account first by registering on the sign-up page.');
            } else {
                forgotError.textContent = '❌ ' + errMsg;
                forgotError.classList.add('show');
            }
        } finally {
            resetLinkBtn.disabled = false;
            resetLinkBtn.textContent = 'Send Verification Code';
        }
    });
    console.log('✓ Reset Link button event listener added!');
}

// Step 2: Verify code
if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener('click', async () => {
        const code = verificationCodeInput.value.trim();
        console.log('Verify Code clicked:', code);
        
        if (!code || code.length !== 6) {
            codeError.textContent = '❌ Please enter the 6-digit verification code';
            codeError.classList.add('show');
            return;
        }
        
        verifyCodeBtn.disabled = true;
        verifyCodeBtn.textContent = 'Verifying...';
        codeError.textContent = '';
        
        try {
            const response = await apiClient.verifyResetCode(resetEmail, code);
            
            if (response.success) {
                resetCode = code;
                codeSuccess.textContent = '✅ ' + response.message;
                codeSuccess.classList.add('show');
                
                // Move to step 3 after short delay
                setTimeout(() => {
                    clearPasswordResetMessages();
                    showPasswordResetStep(3);
                    if (newPasswordInput) newPasswordInput.focus();
                }, 1000);
            } else {
                codeError.textContent = '❌ ' + (response.message || 'Invalid code');
                codeError.classList.add('show');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            codeError.textContent = '❌ ' + (error.message || 'Failed to verify code');
            codeError.classList.add('show');
        } finally {
            verifyCodeBtn.disabled = false;
            verifyCodeBtn.textContent = 'Verify Code';
        }
    });
}

// Step 2: Resend code
if (resendCodeLink) {
    resendCodeLink.addEventListener('click', async () => {
        console.log('Resend code clicked');
        
        resendCodeLink.textContent = 'Sending...';
        resendCodeLink.style.pointerEvents = 'none';
        
        try {
            const response = await apiClient.resendResetCode(resetEmail);
            
            if (response.success) {
                codeSuccess.textContent = '✅ New code sent to your email';
                codeSuccess.classList.add('show');
                if (verificationCodeInput) verificationCodeInput.value = '';
            } else {
                codeError.textContent = '❌ ' + (response.message || 'Failed to resend code');
                codeError.classList.add('show');
            }
        } catch (error) {
            codeError.textContent = '❌ Failed to resend code';
            codeError.classList.add('show');
        } finally {
            resendCodeLink.textContent = 'Resend Code';
            resendCodeLink.style.pointerEvents = 'auto';
        }
    });
}

// Step 2: Back to step 1
if (backToStep1) {
    backToStep1.addEventListener('click', () => {
        clearPasswordResetMessages();
        showPasswordResetStep(1);
    });
}

// Step 3: Reset password
if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        console.log('Reset Password clicked');
        
        if (!newPassword || newPassword.length < 6) {
            passwordError.textContent = '❌ Password must be at least 6 characters';
            passwordError.classList.add('show');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            passwordError.textContent = '❌ Passwords do not match';
            passwordError.classList.add('show');
            return;
        }
        
        resetPasswordBtn.disabled = true;
        resetPasswordBtn.textContent = 'Resetting...';
        passwordError.textContent = '';
        
        try {
            const response = await apiClient.confirmPasswordReset(resetEmail, resetCode, newPassword);
            
            if (response.success) {
                passwordSuccess.textContent = '✅ ' + response.message;
                passwordSuccess.classList.add('show');
                
                // Move to success step
                setTimeout(() => {
                    clearPasswordResetMessages();
                    showPasswordResetStep(4);
                }, 1000);
            } else {
                passwordError.textContent = '❌ ' + (response.message || 'Failed to reset password');
                passwordError.classList.add('show');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            passwordError.textContent = '❌ ' + (error.message || 'Failed to reset password');
            passwordError.classList.add('show');
        } finally {
            resetPasswordBtn.disabled = false;
            resetPasswordBtn.textContent = 'Reset Password';
        }
    });
}

// Step 4: Go back to login
if (goToLoginBtn) {
    goToLoginBtn.addEventListener('click', () => {
        forgotPasswordForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        showPasswordResetStep(1);
        // Clear inputs
        if (forgotEmailInput) forgotEmailInput.value = '';
        if (verificationCodeInput) verificationCodeInput.value = '';
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        resetEmail = '';
        resetCode = '';
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Add password visibility toggle for login form
const passwordIcon = document.querySelector('.input-icon');
if (passwordIcon) {
    passwordIcon.addEventListener('click', () => {
        const input = passwordIcon.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            passwordIcon.textContent = '👁️‍🗨️';
            console.log('Password visible');
        } else {
            input.type = 'password';
            passwordIcon.textContent = '👁️';
            console.log('Password hidden');
        }
    });
    console.log('✓ Password toggle event listener added!');
}

// Add password visibility toggle for password reset form
document.querySelectorAll('.toggle-pass-icon').forEach(icon => {
    icon.addEventListener('click', () => {
        const input = icon.previousElementSibling;
        if (input && input.type === 'password') {
            input.type = 'text';
            icon.textContent = '👁️‍🗨️';
        } else if (input) {
            input.type = 'password';
            icon.textContent = '👁️';
        }
    });
});

// Add enter key support for password reset forms
if (verificationCodeInput) {
    verificationCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && verifyCodeBtn) {
            verifyCodeBtn.click();
        }
    });
}

if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && resetPasswordBtn) {
            resetPasswordBtn.click();
        }
    });
}

// Add enter key support for login
if (passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed on password');
            handleLogin();
        }
    });
}

if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed on username');
            handleLogin();
        }
    });
}

// Add enter key support for forgot email
if (forgotEmailInput) {
    forgotEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed on forgot email');
            resetLinkBtn.click();
        }
    });
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchIcon = document.querySelector('.search-icon');

if (searchIcon) {
    searchIcon.addEventListener('click', () => {
        console.log('🔍 Search icon clicked');
        searchInput.focus();
        searchInput.select();
    });
    console.log('✓ Search icon click handler added!');
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        console.log('🔍 Searching for:', searchTerm);
        
        // Get all table rows in the current page
        const tables = document.querySelectorAll('table tbody tr');
        let foundCount = 0;
        let hiddenCount = 0;
        
        if (tables.length === 0) {
            console.log('No tables found on current page');
            return;
        }
        
        tables.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (searchTerm === '' || text.includes(searchTerm)) {
                row.style.display = '';
                foundCount++;
            } else {
                row.style.display = 'none';
                hiddenCount++;
            }
        });
        
        console.log(`✓ Search results: ${foundCount} visible, ${hiddenCount} hidden`);
    });
    
    // Clear search on escape key
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            // Trigger input event to show all rows
            searchInput.dispatchEvent(new Event('input'));
        }
    });
    
    console.log('✓ Search functionality enabled!');
} else {
    console.error('❌ Search input not found!');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        console.log('🚪 Logout clicked');
        mainDashboard.classList.add('hidden');
        loginPage.classList.remove('hidden');
        usernameInput.value = '';
        passwordInput.value = '';
        pageContainer.innerHTML = '';
    });
}

// Navigation
const navLinks = document.querySelectorAll('.nav-link[data-page]');
console.log('✓ Found nav links:', navLinks.length);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = link.dataset.page;
        console.log('📍 Navigation clicked:', targetPage);

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        loadPage(targetPage);
    });
});

console.log('✓✓✓ Script initialization complete!');

}); // End of DOMContentLoaded
