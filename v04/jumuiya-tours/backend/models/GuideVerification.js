// backend/models/GuideVerification.js
class GuideVerification {
  static validateCredentials(credentials) {
    try {
      const parsed = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
      if (!parsed.experience || !parsed.certifications || !Array.isArray(parsed.certifications)) {
        throw new Error('Experience and certifications (array) are required');
      }
      return true;
    } catch (error) {
      throw new Error('Invalid credentials format');
    }
  }
}

module.exports = GuideVerification;