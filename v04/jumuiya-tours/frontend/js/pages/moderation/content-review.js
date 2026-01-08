// frontend/js/pages/moderation/content-review.js
import AuthService from '../../services/auth-service.js';
import ModerationService from '../../services/moderation-service.js';
import router from '../../app/router.js';
import { Navigation } from '../../components/navigation.js';

class ContentReviewController {
  constructor() {
    this.reviewContainer = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.approveForm = null;
    this.rejectForm = null;
    this.moderationId = null;
    this.init();
  }

  init() {
    if (!AuthService.isAuthenticated() || !AuthService.hasRole(['admin', 'auditor'])) {
      router.navigate('/auth/login');
      return;
    }
    this.moderationId = parseInt(window.location.pathname.split('/').pop());
    this.bindElements();
    this.bindEvents();
    this.loadModerationRequest();
  }

  bindElements() {
    this.reviewContainer = document.getElementById('reviewContainer');
    this.errorMessage = document.getElementById('errorMessage');
    this.successMessage = document.getElementById('successMessage');
    this.approveForm = document.getElementById('approveForm');
    this.rejectForm = document.getElementById('rejectForm');
  }

  bindEvents() {
    if (this.approveForm) {
      this.approveForm.addEventListener('submit', (e) => this.handleApprove(e));
    }
    if (this.rejectForm) {
      this.rejectForm.addEventListener('submit', (e) => this.handleReject(e));
    }
  }

  async loadModerationRequest() {
    this.setLoadingState(true);
    try {
      const response = await ModerationService.getModerationRequest(this.moderationId);
      this.renderReview(response.moderationLog);
    } catch (error) {
      this.showError(error.message || 'Failed to load moderation request');
    } finally {
      this.setLoadingState(false);
    }
  }

  renderReview(moderationLog) {
    if (!this.reviewContainer) return;

    this.reviewContainer.innerHTML = `
      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-2xl font-bold font-display text-uganda-black mb-4">Review ${moderationLog.content_type}: ${moderationLog.destination.name}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> ${moderationLog.destination.name}</p>
            <p><strong>Description:</strong> ${moderationLog.destination.description}</p>
            <p><strong>Region:</strong> ${moderationLog.destination.region}</p>
            <p><strong>Difficulty:</strong> ${moderationLog.destination.difficulty || 'N/A'}</p>
            <p><strong>Price Range:</strong> ${moderationLog.destination.price_range || 'N/A'}</p>
            <p><strong>Submitted by:</strong> ${moderationLog.submitter.name} (${moderationLog.submitter.email})</p>
            <p><strong>Status:</strong> <span class="${moderationLog.status === 'pending' ? 'text-gray-600' : moderationLog.status === 'approved' ? 'text-safari-forest' : 'text-uganda-red'}">${moderationLog.status}</span></p>
            ${moderationLog.notes ? `<p><strong>Notes:</strong> ${moderationLog.notes}</p>` : ''}
          </div>
          <div>
            ${moderationLog.destination.images.length > 0 ? `
              <p><strong>Images:</strong></p>
              <div class="grid grid-cols-2 gap-2">
                ${moderationLog.destination.images.map(img => `
                  <img src="${img}" alt="${moderationLog.destination.name}" class="w-full h-32 object-cover rounded-lg">
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async handleApprove(e) {
    e.preventDefault();
    this.setLoadingState(true, true);
    try {
      const formData = new FormData(this.approveForm);
      const notes = formData.get('notes').trim();
      await ModerationService.approveContent(this.moderationId, notes);
      this.showSuccess('Content approved successfully');
      setTimeout(() => router.navigate('/moderation/pending'), 2000);
    } catch (error) {
      this.showError(error.message || 'Failed to approve content');
    } finally {
      this.setLoadingState(false, true);
    }
  }

  async handleReject(e) {
    e.preventDefault();
    this.setLoadingState(true, false);
    try {
      const formData = new FormData(this.rejectForm);
      const reason = formData.get('reason').trim();
      if (!reason) {
        this.showError('Rejection reason is required');
        return;
      }
      await ModerationService.rejectContent(this.moderationId, reason);
      this.showSuccess('Content rejected successfully');
      setTimeout(() => router.navigate('/moderation/pending'), 2000);
    } catch (error) {
      this.showError(error.message || 'Failed to reject content');
    } finally {
      this.setLoadingState(false, false);
    }
  }

  setLoadingState(loading, isApprove = true) {
    const form = isApprove ? this.approveForm : this.rejectForm;
    if (!form) return;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = loading;
      submitButton.innerHTML = loading
        ? `<svg class="animate-spin h-5 w-5 text-uganda-black inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${isApprove ? 'Approving...' : 'Rejecting...'}`
        : isApprove ? 'Approve Content' : 'Reject Content';
      submitButton.className = loading
        ? `bg-${isApprove ? 'safari-forest' : 'uganda-red'} text-white px-4 py-2 rounded-lg opacity-50 font-display`
        : `bg-${isApprove ? 'safari-forest' : 'uganda-red'} text-white px-4 py-2 rounded-lg hover:bg-${isApprove ? 'green-600' : 'uganda-dark-red'} font-display`;
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.className = 'error-message visible bg-uganda-red/10 border border-uganda-red text-uganda-red px-4 py-3 rounded-lg font-african';
      setTimeout(() => {
        this.errorMessage.className = 'error-message hidden';
      }, 5000);
    }
    window.navigation.showNotification(message, 'error');
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.textContent = message;
      this.successMessage.className = 'success-message visible bg-safari-forest/10 border border-safari-forest text-safari-forest px-4 py-3 rounded-lg font-african';
      setTimeout(() => {
        this.successMessage.className = 'success-message hidden';
      }, 3000);
    }
    window.navigation.showNotification(message, 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ContentReviewController();
});

export default ContentReviewController;