// <!-- # Create user dashboard JavaScript
// cat > frontend/js/pages/dashboard/user-dashboard.js << 'EOF' -->
import AuthService from '/js/services/auth-service.js';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/auth/login.html';
        return;
    }

    const user = AuthService.getCurrentUser();
    displayUserInfo(user);
    setupEventListeners();

    function displayUserInfo(user) {
        // Update welcome message
        document.getElementById('userWelcome').textContent = `Welcome, ${user.name}!`;
        
        // Display user info
        const userInfoDiv = document.getElementById('userInfo');
        userInfoDiv.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="font-semibold">Name:</p>
                    <p>${user.name}</p>
                </div>
                <div>
                    <p class="font-semibold">Email:</p>
                    <p>${user.email}</p>
                </div>
                <div>
                    <p class="font-semibold">Role:</p>
                    <p class="capitalize">${user.role}</p>
                </div>
                <div>
                    <p class="font-semibold">Guide Status:</p>
                    <p class="capitalize">${user.guide_status || 'Not applicable'}</p>
                </div>
            </div>
        `;
    }

    function setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', function() {
            AuthService.logout();
        });

        // Apply as guide button
        const applyGuideBtn = document.getElementById('applyGuideBtn');
        if (applyGuideBtn) {
            applyGuideBtn.addEventListener('click', async function() {
                if (confirm('Are you sure you want to apply as a guide? This will submit your application for review.')) {
                    try {
                        // This will be implemented when we create the guide service
                        alert('Guide application feature coming soon!');
                    } catch (error) {
                        console.error('Error applying as guide:', error);
                        alert('Error submitting application. Please try again.');
                    }
                }
            });
        }
    }
});
