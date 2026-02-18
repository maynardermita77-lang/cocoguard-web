/**
 * Notifications Module - Pest Alert Management
 * Handles fetching and displaying pest alert notifications from the API
 */

// Wrap in IIFE to prevent duplicate declarations on script reload
(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.notificationsModuleLoaded) {
        console.log('Notifications module already loaded, skipping...');
        return;
    }
    window.notificationsModuleLoaded = true;

    // Global notification state (use window to avoid redeclaration issues)
    if (typeof window.notificationsData === 'undefined') {
        window.notificationsData = [];
    }

    // Polling interval reference
    let pollingInterval = null;
    let currentView = 'cards';
    let currentFilter = { type: 'all', time: 'all', search: '' };

    /**
     * Initialize notifications module
     */
    function initNotifications() {
        console.log('Initializing notifications module...');
        loadNotifications();
        setupNotificationEventListeners();
        setupFilters();
        
        // Clear existing interval if any
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        // Start polling for new notifications every 30 seconds
        pollingInterval = setInterval(checkForNewAlerts, 30000);
    }

    /**
     * Setup filter and view controls
     */
    function setupFilters() {
        const searchInput = document.getElementById('alertSearchInput');
        const filterType = document.getElementById('alertFilterType');
        const filterTime = document.getElementById('alertFilterTime');
        const viewButtons = document.querySelectorAll('.view-btn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                currentFilter.search = e.target.value.toLowerCase();
                renderNotifications();
            }, 300));
        }

        if (filterType) {
            filterType.addEventListener('change', (e) => {
                currentFilter.type = e.target.value;
                renderNotifications();
            });
        }

        if (filterTime) {
            filterTime.addEventListener('change', (e) => {
                currentFilter.time = e.target.value;
                renderNotifications();
            });
        }

        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;
                const list = document.getElementById('notificationsList');
                if (list) {
                    list.classList.toggle('compact-view', currentView === 'compact');
                }
            });
        });
    }

    /**
     * Debounce helper
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

/**
 * Setup event listeners
 */
function setupNotificationEventListeners() {
    const refreshBtn = document.getElementById('refreshNotificationsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadNotifications);
    }
    
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllNotificationsRead);
    }
    
    // Header notification bell click
    const bellBtn = document.getElementById('notificationBell');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            // Navigate to notifications page
            window.location.hash = '#notifications';
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.page === 'notifications') {
                    link.classList.add('active');
                }
            });
        });
    }
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
    const loadingEl = document.getElementById('notificationsLoading');
    const emptyEl = document.getElementById('notificationsEmpty');
    const listEl = document.getElementById('notificationsList');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (listEl) listEl.classList.add('hidden');
    
    try {
        // Use the global apiClient instance
        const data = await apiClient.request('/notifications/admin/pest-alerts?limit=50');
        
        // Debug: Log the first notification's created_at value
        if (data && data.length > 0) {
            console.log('[API DEBUG] First notification created_at:', data[0].created_at);
            console.log('[API DEBUG] Parsed as Date:', new Date(data[0].created_at));
        }
        
        window.notificationsData = data || [];
        renderNotifications();
        updateAlertBadge();
    } catch (error) {
        console.error('Error loading notifications:', error);
        showNotificationError('Error connecting to server: ' + error.message);
    }
    
    if (loadingEl) loadingEl.classList.add('hidden');
}

/**
 * Render notifications list
 */
function renderNotifications() {
    const emptyEl = document.getElementById('notificationsEmpty');
    const listEl = document.getElementById('notificationsList');
    
    if (!listEl) return;
    
    // Filter notifications
    const filteredData = filterNotifications(window.notificationsData);
    
    // Update statistics
    updateStatistics(window.notificationsData);
    
    if (filteredData.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        return;
    }
    
    if (emptyEl) emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    
    listEl.innerHTML = filteredData.map(notification => {
        const isAPW = notification.pest_type && 
            (notification.pest_type.includes('APW') || 
             notification.pest_type.toLowerCase().includes('asiatic'));
        
        const date = new Date(notification.created_at);
        const formattedDate = formatNotificationDate(date);
        
        // Truncate location for cleaner display
        const location = notification.location_text || 'Unknown location';
        const shortLocation = location.length > 50 ? location.substring(0, 50) + '...' : location;
        
        return `
            <div class="alert-item" data-id="${notification.id}">
                <div class="alert-icon ${isAPW ? 'critical' : 'normal'}">
                    ${isAPW ? '⚠️' : '🔔'}
                </div>
                <div class="alert-content">
                    <div class="alert-header">
                        <div class="alert-type">
                            <span class="alert-badge ${isAPW ? 'critical' : 'warning'}">
                                ${isAPW ? 'CRITICAL' : 'WARNING'}
                            </span>
                            <span class="pest-name">${notification.pest_type || 'Pest Detected'}</span>
                        </div>
                        <span class="alert-time">${formattedDate}</span>
                    </div>
                    <p class="alert-message">${notification.message || 'A pest has been detected in the field.'}</p>
                    <div class="alert-footer">
                        <div class="alert-location">
                            📍 ${shortLocation}
                            ${notification.scan_id ? `<span class="scan-id">#${notification.scan_id}</span>` : ''}
                        </div>
                        <div class="alert-actions">
                            ${notification.latitude && notification.longitude ? `
                            <button class="btn-action secondary" onclick="event.stopPropagation(); viewOnMap(${notification.latitude}, ${notification.longitude})">
                                🗺️ Map
                            </button>
                            ` : ''}
                            <button class="btn-action primary" onclick="event.stopPropagation(); viewNotificationDetails(${notification.id})">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter notifications based on current filters
 */
function filterNotifications(data) {
    if (!data) return [];
    
    return data.filter(notification => {
        // Type filter
        if (currentFilter.type !== 'all') {
            const isAPW = notification.pest_type && 
                (notification.pest_type.includes('APW') || 
                 notification.pest_type.toLowerCase().includes('asiatic'));
            if (currentFilter.type === 'apw' && !isAPW) return false;
            if (currentFilter.type === 'other' && isAPW) return false;
        }
        
        // Time filter
        if (currentFilter.time !== 'all') {
            const date = new Date(notification.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (currentFilter.time === 'today' && diffDays > 0) return false;
            if (currentFilter.time === 'week' && diffDays > 7) return false;
            if (currentFilter.time === 'month' && diffDays > 30) return false;
        }
        
        // Search filter
        if (currentFilter.search) {
            const searchStr = currentFilter.search.toLowerCase();
            const matchesLocation = notification.location_text?.toLowerCase().includes(searchStr);
            const matchesPest = notification.pest_type?.toLowerCase().includes(searchStr);
            const matchesMessage = notification.message?.toLowerCase().includes(searchStr);
            if (!matchesLocation && !matchesPest && !matchesMessage) return false;
        }
        
        return true;
    });
}

/**
 * Update statistics cards
 */
function updateStatistics(data) {
    if (!data) return;
    
    const criticalCount = data.filter(n => 
        n.pest_type && (n.pest_type.includes('APW') || n.pest_type.toLowerCase().includes('asiatic'))
    ).length;
    
    const uniqueLocations = new Set(data.map(n => n.location_text).filter(Boolean)).size;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = data.filter(n => new Date(n.created_at) >= today).length;
    
    const criticalEl = document.getElementById('criticalCount');
    const totalEl = document.getElementById('totalAlerts');
    const locationsEl = document.getElementById('locationsCount');
    const todayEl = document.getElementById('todayAlerts');
    
    if (criticalEl) criticalEl.textContent = criticalCount;
    if (totalEl) totalEl.textContent = data.length;
    if (locationsEl) locationsEl.textContent = uniqueLocations;
    if (todayEl) todayEl.textContent = todayCount;
}

/**
 * View notification details - displays scan image and details
 */
function viewNotificationDetails(notificationId) {
    if (!notificationId) {
        alert('Alert details not available');
        return;
    }
    
    // Find the notification in our data
    const notification = window.notificationsData.find(n => n.id === notificationId);
    
    if (!notification) {
        alert('Alert not found');
        return;
    }
    
    const modal = document.getElementById('scanDetailsModal');
    const modalBody = document.getElementById('scanDetailsBody');
    const modalTitle = document.getElementById('scanDetailsTitle');
    
    if (!modal || !modalBody) return;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Format date
    const date = new Date(notification.created_at);
    const formattedDate = date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    // Update modal title
    const scanId = notification.scan_id || notification.id;
    modalTitle.textContent = `Pest Alert #${String(scanId).padStart(3, '0')}`;
    
    // Get image URL from notification - use dynamic hostname
    let imageUrl = '';
    if (notification.image_url) {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
        const apiBase = (typeof apiClient !== 'undefined' && apiClient.baseURL)
            ? apiClient.baseURL
            : isLocal ? `${window.location.protocol}//${host}:8000` : 'https://cocoguard-backend.onrender.com';
        imageUrl = notification.image_url.startsWith('http') ? 
            notification.image_url : 
            `${apiBase}${notification.image_url}`;
    }
    
    // Build modal content
    modalBody.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="Scan Image" class="scan-detail-image" onclick="window.open('${imageUrl}', '_blank')" title="Click to open in new tab">` : '<div style="background: #f3f4f6; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 20px; color: #9ca3af;">📷 Image not available</div>'}
        
        <div class="scan-detail-grid">
            <div class="scan-detail-item">
                <div class="scan-detail-label">Pest Type</div>
                <div class="scan-detail-value">${notification.pest_type || 'Unknown'}</div>
            </div>
            
            <div class="scan-detail-item">
                <div class="scan-detail-label">Detection Date</div>
                <div class="scan-detail-value">${formattedDate}</div>
            </div>
            
            <div class="scan-detail-item scan-detail-full">
                <div class="scan-detail-label">Location</div>
                <div class="scan-detail-value">${notification.location_text || 'Unknown location'}</div>
            </div>
            
            ${notification.latitude && notification.longitude ? `
            <div class="scan-detail-item">
                <div class="scan-detail-label">Coordinates</div>
                <div class="scan-detail-value">${notification.latitude}, ${notification.longitude}</div>
            </div>
            ` : ''}
            
            ${notification.farmer_name ? `
            <div class="scan-detail-item">
                <div class="scan-detail-label">Submitted By</div>
                <div class="scan-detail-value">${notification.farmer_name}</div>
            </div>
            ` : ''}
            
            ${notification.message ? `
            <div class="scan-detail-item scan-detail-full">
                <div class="scan-detail-label">Alert Message</div>
                <div class="scan-detail-value">${notification.message}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="scan-detail-actions">
            ${notification.latitude && notification.longitude ? `
            <button class="btn-action primary" onclick="viewOnMap(${notification.latitude}, ${notification.longitude})">
                🗺️ View on Map
            </button>
            ` : ''}
            <button class="btn-action secondary" onclick="closeScanDetailsModal()">
                Close
            </button>
        </div>
    `;
}

/**
 * View location on map - Opens Google Maps with coordinates
 */
function viewOnMap(lat, lng) {
    // Convert to numbers and validate
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude) || !latitude || !longitude) {
        alert('❌ Location coordinates not available for this alert.');
        return;
    }
    
    // Open Google Maps with the coordinates
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
    window.open(mapsUrl, '_blank');
}

/**
 * Close scan details modal
 */
function closeScanDetailsModal() {
    const modal = document.getElementById('scanDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Make functions globally accessible
window.viewNotificationDetails = viewNotificationDetails;
window.viewOnMap = viewOnMap;
window.closeScanDetailsModal = closeScanDetailsModal;

/**
 * Format notification date for display
 * Server returns ISO timestamps with timezone info (Asia/Manila UTC+8)
 */
function formatNotificationDate(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Handle case where diff is negative (shouldn't happen with proper timezone)
    if (diff < 0) {
        return 'Just now';
    }
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Check for new alerts (called periodically)
 */
async function checkForNewAlerts() {
    try {
        const data = await apiClient.request('/notifications/admin/pest-alerts?limit=1');
        if (data && data.length > 0) {
            const latestId = data[0].id;
            const currentLatestId = window.notificationsData.length > 0 ? window.notificationsData[0].id : 0;
            
            if (latestId > currentLatestId) {
                // New notification detected
                console.log('New pest alert detected!');
                loadNotifications();
                
                // Show browser notification if supported
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('⚠️ New Pest Alert!', {
                        body: 'A dangerous pest has been detected. Check the admin panel.',
                        icon: '🥥'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error checking for new alerts:', error);
    }
}

/**
 * Mark all notifications as read - hides the badge and updates localStorage
 */
async function markAllNotificationsRead() {
    // Store the last read notification ID to prevent badge showing for already read items
    if (window.notificationsData.length > 0) {
        const latestId = Math.max(...window.notificationsData.map(n => n.id));
        localStorage.setItem('lastReadNotificationId', latestId);
    }
    
    // Mark all current notifications as read (timestamp-based)
    localStorage.setItem('notificationsLastRead', new Date().toISOString());
    
    // Hide the badge in navigation
    const navBadge = document.getElementById('navAlertBadge');
    if (navBadge) {
        navBadge.classList.add('hidden');
        navBadge.textContent = '0';
    }
    
    // Show confirmation
    const markBtn = document.getElementById('markAllReadBtn');
    if (markBtn) {
        const originalText = markBtn.innerHTML;
        markBtn.innerHTML = '✓ Marked as Read';
        markBtn.style.background = '#16a34a';
        setTimeout(() => {
            markBtn.innerHTML = originalText;
            markBtn.style.background = '';
        }, 2000);
    }
}

/**
 * Get unread notification count (notifications after last read timestamp)
 */
function getUnreadCount() {
    const lastRead = localStorage.getItem('notificationsLastRead');
    if (!lastRead) return window.notificationsData.length;
    
    const lastReadDate = new Date(lastRead);
    return window.notificationsData.filter(n => new Date(n.created_at) > lastReadDate).length;
}

/**
 * Update alert badge count in header and nav (only unread)
 */
function updateAlertBadge() {
    const unreadCount = getUnreadCount();
    
    const navBadge = document.getElementById('navAlertBadge');
    
    if (navBadge) {
        if (unreadCount > 0) {
            navBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            navBadge.classList.remove('hidden');
        } else {
            navBadge.classList.add('hidden');
        }
    }
}

/**
 * Show error message
 */
function showNotificationError(message) {
    const listEl = document.getElementById('notificationsList');
    const emptyEl = document.getElementById('notificationsEmpty');
    
    if (emptyEl) {
        emptyEl.innerHTML = `
            <div class="icon">❌</div>
            <h3>Error Loading Alerts</h3>
            <p>${message}</p>
            <button class="btn-refresh" onclick="window.notificationsModule.reload()" style="margin-top: 15px;">
                🔄 Try Again
            </button>
        `;
        emptyEl.classList.remove('hidden');
    }
    
    if (listEl) listEl.classList.add('hidden');
}

/**
 * Request browser notification permission
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Initialize on page load if on notifications page
if (typeof window !== 'undefined') {
    // Request notification permission
    requestNotificationPermission();
}

// Export module for main script
window.notificationsModule = {
    init: initNotifications,
    reload: loadNotifications
};

// Also export individual functions
window.initNotifications = initNotifications;
window.checkForNewAlerts = checkForNewAlerts;
window.updateAlertBadge = updateAlertBadge;
window.markAllNotificationsRead = markAllNotificationsRead;

console.log('✓ notificationsModule exported');

})(); // End IIFE