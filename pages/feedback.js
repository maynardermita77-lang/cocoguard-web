// Feedback Page Script
// Version: 2.0 - IIFE Wrapper Fix

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.feedbackModuleLoaded) {
        console.log('Feedback module already loaded, skipping...');
        return;
    }
    window.feedbackModuleLoaded = true;

    console.log('💬 Feedback page script loaded v2.0');


// Format date for display in Philippine Time (UTC+8)
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Database stores UTC time without 'Z' suffix
    let utcDateString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        utcDateString = dateString + 'Z';
    }
    const date = new Date(utcDateString);
    return date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Render feedback table
function renderFeedbackTable(feedbacks) {
    const tbody = document.getElementById('feedbackTableBody');
    if (!tbody) return;
    if (!feedbacks || feedbacks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #888;">No feedback found.</td></tr>`;
        return;
    }
    tbody.innerHTML = feedbacks.map(f => {
        let userName = '-';
        if (f.user && (f.user.full_name || f.user.username)) {
            userName = f.user.full_name || f.user.username;
        }
        return `
        <tr>
            <td>${userName}</td>
            <td>${formatDate(f.created_at)}</td>
            <td>${f.type || '-'}</td>
            <td>${f.message}</td>
        </tr>
        `;
    }).join('');
}

// Load feedbacks from API
async function loadFeedbacks() {
    const tbody = document.getElementById('feedbackTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">Loading feedback...</td></tr>`;
    try {
        let feedbacks = [];
        if (typeof apiClient !== 'undefined') {
            feedbacks = await apiClient.request('/feedback/', { method: 'GET' });
        } else {
            // fallback fetch - use production URL for deployed sites
            const host = window.location.hostname;
            const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
            const apiBase = isLocal ? `${window.location.protocol}//${host}:8000` : 'https://cocoguard-backend.onrender.com';
            const response = await fetch(`${apiBase}/feedback/`);
            feedbacks = await response.json();
        }
        renderFeedbackTable(feedbacks);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #d32f2f;">Failed to load feedbacks.</td></tr>`;
    }
}

// Initialize feedback page
function initFeedback() {
    console.log('🔧 Initializing feedback module...');
    loadFeedbacks();
    console.log('✅ Feedback module initialized successfully');
}

// Export for use in main script
window.feedbackModule = {
    init: initFeedback,
    loadFeedbacks: loadFeedbacks,
    renderFeedbackTable: renderFeedbackTable
};

console.log('✓ feedbackModule exported v2.0');

})(); // End IIFE
