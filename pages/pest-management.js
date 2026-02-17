// Pest Management Page Script
// Version: 2.0 - IIFE Wrapper Fix

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.pestManagementModuleLoaded) {
        console.log('Pest Management module already loaded, skipping...');
        return;
    }
    window.pestManagementModuleLoaded = true;

    console.log('🐛 Pest Management page script loaded v2.0');

// Get risk level badge styling
function getRiskLevelBadge(riskLevel) {
    // Normalize risk level to capitalize first letter
    const normalized = riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1).toLowerCase() : 'Medium';
    const styles = {
        'Critical': { bg: '#fecaca', color: '#991b1b' },
        'High': { bg: '#fee2e2', color: '#dc2626' },
        'Medium': { bg: '#fef3c7', color: '#d97706' },
        'Low': { bg: '#d1fae5', color: '#059669' }
    };
    const style = styles[normalized] || styles['Medium'];
    return `<span class="status-badge" style="background: ${style.bg}; color: ${style.color};">${normalized}</span>`;
}

// Modal elements (local to IIFE)
var addPestModal, addPestForm, pestModalTitle, pestEditId;

// Open modal for adding new pest
function openAddPestModal() {
    console.log('📝 Opening Add Pest modal');
    pestModalTitle.textContent = 'Add New Pest Type';
    addPestForm.reset();
    pestEditId.value = '';
    document.getElementById('isActive').checked = true;
    addPestModal.style.display = 'flex';
}

// Open modal for editing pest
function openEditPestModal(pest) {
    console.log('📝 Opening Edit Pest modal for:', pest);
    pestModalTitle.textContent = 'Edit Pest Type';
    pestEditId.value = pest.id;
    document.getElementById('pestName').value = pest.name || '';
    document.getElementById('scientificName').value = pest.scientific_name || '';
    document.getElementById('riskLevel').value = pest.risk_level ? pest.risk_level.toLowerCase() : '';
    document.getElementById('isActive').checked = pest.is_active !== false;
    addPestModal.style.display = 'flex';
}

// Close modal
function closePestModal() {
    console.log('📝 Closing pest modal');
    addPestModal.style.display = 'none';
    addPestForm.reset();
    pestEditId.value = '';
}

// Handle form submission (add or edit)
async function handlePestFormSubmit(e) {
    e.preventDefault();
    console.log('📤 Submitting pest form...');
    
    const savePestBtn = document.getElementById('savePestBtn');
    const originalBtnText = savePestBtn.textContent;
    
    try {
        savePestBtn.disabled = true;
        savePestBtn.textContent = 'Saving...';
        
        const pestData = {
            name: document.getElementById('pestName').value.trim(),
            scientific_name: document.getElementById('scientificName').value.trim() || null,
            risk_level: document.getElementById('riskLevel').value,
            is_active: document.getElementById('isActive').checked
        };
        
        console.log('📦 Pest data:', pestData);
        
        // Validate required fields
        if (!pestData.name) {
            alert('Please enter a pest name');
            return;
        }
        if (!pestData.risk_level) {
            alert('Please select a risk level');
            return;
        }
        
        const editId = pestEditId.value;
        
        if (editId) {
            // Edit existing pest
            console.log('📝 Updating pest #' + editId);
            await apiClient.updatePestType(editId, pestData);
            console.log('✅ Pest updated successfully');
            showNotification('Pest type updated successfully!', 'success');
        } else {
            // Add new pest
            console.log('➕ Creating new pest');
            await apiClient.createPestType(pestData);
            console.log('✅ Pest created successfully');
            showNotification('Pest type added successfully!', 'success');
        }
        
        closePestModal();
        loadPestTypes(); // Reload the table
        
    } catch (error) {
        console.error('❌ Error saving pest:', error);
        showNotification('Error saving pest: ' + error.message, 'error');
    } finally {
        savePestBtn.disabled = false;
        savePestBtn.textContent = originalBtnText;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotif = document.querySelector('.pest-notification');
    if (existingNotif) existingNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = 'pest-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        ${type === 'success' ? 'background: #16a34a;' : ''}
        ${type === 'error' ? 'background: #dc2626;' : ''}
        ${type === 'info' ? 'background: #2563eb;' : ''}
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load pest types from API
async function loadPestTypes() {
    const tableBody = document.getElementById('pestTableBody');
    
    try {
        console.log('📡 Fetching pest types from API...');
        const pestTypes = await apiClient.listPestTypes();
        console.log('✓ Pest types loaded:', pestTypes);
        
        if (!pestTypes || pestTypes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                        No pest types found. Click "Add Pest Type" to create one.
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = pestTypes.map(pest => `
            <tr data-id="${pest.id}">
                <td>#${pest.id}</td>
                <td>${pest.name}</td>
                <td>${pest.scientific_name || '-'}</td>
                <td>${getRiskLevelBadge(pest.risk_level)}</td>
                <td>${pest.is_active ? '<span style="color: #16a34a;">✓ Active</span>' : '<span style="color: #dc2626;">✗ Inactive</span>'}</td>
                <td>
                    <button class="btn btn-secondary edit-pest-btn" data-id="${pest.id}" style="font-size: 12px; padding: 5px 10px;">Edit</button>
                    <button class="btn btn-danger delete-pest-btn" data-id="${pest.id}" style="font-size: 12px; padding: 5px 10px;">Delete</button>
                </td>
            </tr>
        `).join('');
        
        // Store pest data for editing
        window.pestTypesData = pestTypes;
        
        // Add event listeners for edit/delete buttons
        attachPestButtonListeners();
        
    } catch (error) {
        console.error('❌ Error loading pest types:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #dc2626;">
                    Error loading pest types: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Attach event listeners to edit/delete buttons
function attachPestButtonListeners() {
    document.querySelectorAll('.edit-pest-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pestId = parseInt(e.target.dataset.id);
            console.log('📝 Edit pest:', pestId);
            
            // Find the pest data
            const pest = window.pestTypesData?.find(p => p.id === pestId);
            if (pest) {
                openEditPestModal(pest);
            } else {
                alert('Could not find pest data. Please reload the page.');
            }
        });
    });
    
    document.querySelectorAll('.delete-pest-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const pestId = e.target.dataset.id;
            const pest = window.pestTypesData?.find(p => p.id === parseInt(pestId));
            const pestName = pest ? pest.name : `#${pestId}`;
            
            if (confirm(`Are you sure you want to delete "${pestName}"?\n\nThis action cannot be undone.`)) {
                try {
                    e.target.disabled = true;
                    e.target.textContent = 'Deleting...';
                    
                    await apiClient.deletePestType(pestId);
                    console.log('✓ Pest deleted:', pestId);
                    showNotification(`"${pestName}" deleted successfully`, 'success');
                    loadPestTypes(); // Reload the table
                } catch (error) {
                    console.error('❌ Error deleting pest:', error);
                    showNotification('Error deleting pest: ' + error.message, 'error');
                    e.target.disabled = false;
                    e.target.textContent = 'Delete';
                }
            }
        });
    });
}

// Initialize pest management page
function initPestManagement() {
    console.log('🔧 Initializing pest management module...');
    
    try {
        // Cache modal elements
        addPestModal = document.getElementById('addPestModal');
        addPestForm = document.getElementById('addPestForm');
        pestModalTitle = document.getElementById('pestModalTitle');
        pestEditId = document.getElementById('pestEditId');
        
        const addPestBtn = document.getElementById('addPestBtn');
        const closePestModalBtn = document.getElementById('closePestModal');
        const cancelPestBtn = document.getElementById('cancelPestBtn');
        
        // Add button click - open modal
        if (addPestBtn) {
            console.log('✓ Add Pest button found');
            addPestBtn.addEventListener('click', openAddPestModal);
        } else {
            console.warn('⚠ Add Pest button not found');
        }
        
        // Close modal button
        if (closePestModalBtn) {
            closePestModalBtn.addEventListener('click', closePestModal);
        }
        
        // Cancel button
        if (cancelPestBtn) {
            cancelPestBtn.addEventListener('click', closePestModal);
        }
        
        // Form submission
        if (addPestForm) {
            addPestForm.addEventListener('submit', handlePestFormSubmit);
        }
        
        // Close modal when clicking outside
        if (addPestModal) {
            addPestModal.addEventListener('click', (e) => {
                if (e.target === addPestModal) {
                    closePestModal();
                }
            });
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && addPestModal && addPestModal.style.display === 'flex') {
                closePestModal();
            }
        });
        
        // Load pest types from API
        loadPestTypes();
        
        console.log('✅ Pest Management module initialized successfully');
    } catch (err) {
        console.error('❌ Error initializing pest management:', err);
    }
}

// Export for use in main script
window.pestManagementModule = {
    init: initPestManagement,
    reload: loadPestTypes,
    openAddModal: openAddPestModal
};

console.log('✓ pestManagementModule exported v2.0');

})(); // End IIFE
