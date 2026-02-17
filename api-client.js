/**
 * CocoGuard API Client
 * Handles all communication with the backend API
 */

class CocoGuardAPI {
    constructor(baseURL = null) {
        // Dynamically detect API URL based on current hostname
        // Works for: localhost, LAN IP, mobile hotspot, any network
        const host = window.location.hostname;
        const port = 8000;
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
        
        // Use custom URL from storage if set, otherwise auto-detect
        const storedUrl = localStorage.getItem('api_base_url');
        if (storedUrl) {
            this.baseURL = storedUrl;
        } else {
            this.baseURL = `${protocol}://${host}:${port}`;
        }
        
        console.log('API Client initialized with URL:', this.baseURL);
        this.token = localStorage.getItem('access_token');
        this.headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            this.headers['Authorization'] = `Bearer ${this.token}`;
        }
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('access_token', token);
        } else {
            delete this.headers['Authorization'];
            localStorage.removeItem('access_token');
        }
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        // Always get fresh token from storage
        const currentToken = localStorage.getItem('access_token');
        const headers = { 
            'Content-Type': 'application/json',
            ...(currentToken && { 'Authorization': `Bearer ${currentToken}` }),
            ...options.headers 
        };
        
        const config = {
            method,
            headers,
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        console.log(`🔐 API Request to ${endpoint}:`, {
            method,
            hasToken: !!currentToken,
            tokenPreview: currentToken ? currentToken.substring(0, 20) + '...' : 'none'
        });

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || `API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }


    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData,
        });
    }

    async login(email, password) {
        console.log('🔑 Login: Clearing old token before login...');
        localStorage.removeItem('access_token');
        
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: {
                email_or_username: email,
                password,
            },
        });
        
        console.log('🔑 Login successful! New token:', response.access_token.substring(0, 50) + '...');
        this.setToken(response.access_token);
        console.log('🔑 Token saved to localStorage');
        
        return response;
    }

    logout() {
        this.setToken(null);
    }

    // ============= USERS =============

    async getCurrentUser() {
        return this.request('/users/me');
    }

    async listUsers() {
        console.log('📡 API: Calling GET /users');
        return this.request('/users');
    }

    async createUser(userData) {
        console.log('📡 API: Creating new user');
        return this.request('/users', {
            method: 'POST',
            body: userData,
        });
    }

    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: userData,
        });
    }

    async setUserStatus(userId, status) {
        return this.request(`/users/${userId}/status?status=${status}`, {
            method: 'PUT',
        });
    }

    // ============= FARMS =============

    async listFarms(limit = 50, skip = 0) {
        return this.request(`/farms?limit=${limit}&skip=${skip}`);
    }

    async createFarm(farmData) {
        return this.request('/farms', {
            method: 'POST',
            body: farmData,
        });
    }

    async getFarm(farmId) {
        return this.request(`/farms/${farmId}`);
    }

    async updateFarm(farmId, farmData) {
        return this.request(`/farms/${farmId}`, {
            method: 'PUT',
            body: farmData,
        });
    }

    async deleteFarm(farmId) {
        return this.request(`/farms/${farmId}`, {
            method: 'DELETE',
        });
    }

    // ============= PEST TYPES =============

    async listPestTypes(limit = 100) {
        return this.request(`/pest-types?limit=${limit}`);
    }

    async getPestType(pestTypeId) {
        return this.request(`/pest-types/${pestTypeId}`);
    }

    async createPestType(pestData) {
        return this.request('/pest-types', {
            method: 'POST',
            body: pestData,
        });
    }

    async updatePestType(pestTypeId, pestData) {
        return this.request(`/pest-types/${pestTypeId}`, {
            method: 'PUT',
            body: pestData,
        });
    }

    // ============= SCANS =============

    async createScan(scanData) {
        return this.request('/scans', {
            method: 'POST',
            body: scanData,
        });
    }

    async listMyScans(limit = 50, skip = 0) {
        return this.request(`/scans/my-scans?limit=${limit}&skip=${skip}`);
    }

    async adminListScans() {
        return this.request('/scans/admin');
    }

    async getScan(scanId) {
        return this.request(`/scans/${scanId}`);
    }

    async updateScanStatus(scanId, status, notes = '') {
        return this.request(`/scans/${scanId}/status`, {
            method: 'PUT',
            body: { status, notes },
        });
    }

    // ============= UPLOADS =============

    async uploadScanImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseURL}/uploads/scan-image`, {
            method: 'POST',
            headers: {
                'Authorization': this.headers['Authorization'] || '',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        return response.json();
    }

    async deleteFile(filename) {
        return this.request(`/uploads/files/${filename}`, {
            method: 'DELETE',
        });
    }

    // ============= FEEDBACK =============

    async submitFeedback(feedbackData) {
        return this.request('/feedback', {
            method: 'POST',
            body: feedbackData,
        });
    }

    // ============= KNOWLEDGE BASE =============

    async listKnowledge(limit = 50, category = null, tag = null) {
        let query = `/knowledge?limit=${limit}`;
        if (category) query += `&category=${encodeURIComponent(category)}`;
        if (tag) query += `&tag=${encodeURIComponent(tag)}`;
        return this.request(query);
    }

    async getKnowledgeArticle(articleId) {
        return this.request(`/knowledge/${articleId}`);
    }

    async getKnowledgeByCategory(category, limit = 50) {
        return this.request(`/knowledge/category/${category}?limit=${limit}`);
    }

    async createKnowledgeArticle(articleData) {
        return this.request('/knowledge', {
            method: 'POST',
            body: articleData,
        });
    }

    // ============= ANALYTICS =============

    async getDashboardSummary() {
        return this.request('/analytics/dashboard/summary');
    }

    async getAdminDashboardSummary() {
        return this.request('/analytics/admin/dashboard/summary');
    }

    async getScansByPest(days = 30) {
        return this.request(`/analytics/scans/by-pest?days=${days}`);
    }

    async getScansByStatus() {
        return this.request('/analytics/scans/by-status');
    }

    async getScanTrends(days = 30) {
        return this.request(`/analytics/scans/trends?days=${days}`);
    }

    async getFarmsSummary() {
        return this.request('/analytics/farms/summary');
    }

    async getSystemStats() {
        return this.request('/analytics/admin/system-stats');
    }

    async getAdminScansByPest(days = 30) {
        return this.request(`/analytics/admin/scans/by-pest?days=${days}`);
    }

    async getAdminScansByFarm(days = 30) {
        return this.request(`/analytics/admin/scans/by-farm?days=${days}`);
    }

    async getAdminMonthlyScans(months = 6) {
        return this.request(`/analytics/admin/monthly-scans?months=${months}`);
    }

    async getAdminDailyScans(days = 7) {
        return this.request(`/analytics/admin/daily-scans?days=${days}`);
    }

    // ============= PASSWORD RESET =============

    /**
     * Request a password reset code to be sent to email
     */
    async requestPasswordReset(email) {
        return this.request('/password-reset/request', {
            method: 'POST',
            body: { email },
        });
    }

    /**
     * Verify the password reset code
     */
    async verifyResetCode(email, code) {
        return this.request('/password-reset/verify', {
            method: 'POST',
            body: { email, code },
        });
    }

    /**
     * Confirm password reset with new password
     */
    async confirmPasswordReset(email, code, newPassword) {
        return this.request('/password-reset/confirm', {
            method: 'POST',
            body: { 
                email, 
                code, 
                new_password: newPassword 
            },
        });
    }

    /**
     * Resend the password reset code
     */
    async resendResetCode(email) {
        return this.request('/password-reset/resend', {
            method: 'POST',
            body: { email },
        });
    }

    // ============= HEALTH CHECK =============

    async healthCheck() {
        return this.request('/');
    }
}

// Create global API client instance
// Dynamically uses current hostname - works across any network (LAN, hotspot, etc.)
const apiClient = new CocoGuardAPI();
