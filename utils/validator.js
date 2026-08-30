/**
 * SmartFill AI Assistant — Data Validation & Auto-Formatting Engine (validator.js)
 * Provides real-time syntax checking, format validation, and sanitization for
 * email, phone numbers, date of birth, URLs, and Government ID documents.
 */

var DataValidator = globalThis.DataValidator || (function () {
  return {
    /**
     * Validates email address format using standard RFC 5322 regex.
     * @param {string} email
     * @returns {{isValid: boolean, message: string}}
     */
    validateEmail(email) {
      if (!email || !email.trim()) {
        return { isValid: true, message: '' }; // Optional until filled
      }
      const trimmed = email.trim();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      const isValid = emailRegex.test(trimmed);
      return {
        isValid,
        message: isValid ? '✓ Valid email address' : 'Invalid email format (e.g. name@domain.com)'
      };
    },

    /**
     * Validates and cleans phone numbers according to international standard E.164 guidelines.
     * Supports +, parentheses, hyphens, spaces (7 to 15 digits).
     * @param {string} phone
     * @returns {{isValid: boolean, cleaned: string, message: string}}
     */
    validatePhone(phone) {
      if (!phone || !phone.trim()) {
        return { isValid: true, cleaned: '', message: '' };
      }
      const trimmed = phone.trim();
      // Extract numeric digits
      const digitsOnly = trimmed.replace(/\D/g, '');
      const hasLeadingPlus = trimmed.startsWith('+');

      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return {
          isValid: false,
          cleaned: trimmed,
          message: 'Phone number must be between 7 and 15 digits'
        };
      }

      // Check if raw string has invalid characters
      const validCharsRegex = /^[+]?[\d\s\-().]{7,25}$/;
      const isValid = validCharsRegex.test(trimmed);

      return {
        isValid,
        cleaned: hasLeadingPlus ? `+${digitsOnly}` : digitsOnly,
        message: isValid ? '✓ Valid phone number' : 'Invalid characters in phone number'
      };
    },

    /**
     * Validates Date of Birth (must be in past, age between 5 and 120 years).
     * Calculates user age in years.
     * @param {string} dobStr YYYY-MM-DD
     * @returns {{isValid: boolean, age: number, message: string}}
     */
    validateDob(dobStr) {
      if (!dobStr) {
        return { isValid: true, age: 0, message: '' };
      }
      const dobDate = new Date(dobStr);
      if (isNaN(dobDate.getTime())) {
        return { isValid: false, age: 0, message: 'Invalid date format' };
      }

      const today = new Date();
      if (dobDate >= today) {
        return { isValid: false, age: 0, message: 'Date of birth cannot be in the future' };
      }

      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }

      if (age < 3) {
        return { isValid: false, age, message: 'Date of birth indicates age < 3' };
      }
      if (age > 120) {
        return { isValid: false, age, message: 'Date of birth indicates age > 120' };
      }

      return {
        isValid: true,
        age,
        message: `✓ Age: ${age} years old`
      };
    },

    /**
     * Validates and auto-formats website / profile URLs.
     * Prepends https:// if omitted.
     * @param {string} url
     * @returns {{isValid: boolean, formatted: string, message: string}}
     */
    validateUrl(url) {
      if (!url || !url.trim()) {
        return { isValid: true, formatted: '', message: '' };
      }
      let formatted = url.trim();
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = 'https://' + formatted;
      }

      try {
        const parsed = new URL(formatted);
        const isValid = Boolean(parsed.hostname && parsed.hostname.includes('.'));
        return {
          isValid,
          formatted: isValid ? formatted : url,
          message: isValid ? '✓ Valid web address' : 'Invalid URL (e.g. https://linkedin.com/in/...)'
        };
      } catch (_) {
        return {
          isValid: false,
          formatted: url,
          message: 'Invalid URL format'
        };
      }
    },

    /**
     * Validates Government Document formats (PAN, Aadhaar, Passport, SSN).
     * @param {string} docType
     * @param {string} docNum
     * @returns {{isValid: boolean, message: string}}
     */
    validateDocument(docType, docNum) {
      if (!docNum || !docNum.trim()) {
        return { isValid: true, message: '' };
      }
      const raw = docNum.trim().toUpperCase().replace(/[\s-]/g, '');
      const type = (docType || '').toLowerCase();

      // PAN Card (India): 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F)
      if (type.includes('pan')) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        const isValid = panRegex.test(raw);
        return {
          isValid,
          message: isValid ? '✓ Valid PAN format' : 'PAN format must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F)'
        };
      }

      // Aadhaar Card (India): 12 digits
      if (type.includes('aadhaar') || type.includes('aadhar')) {
        const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
        const isValid = aadhaarRegex.test(raw);
        return {
          isValid,
          message: isValid ? '✓ Valid Aadhaar format' : 'Aadhaar must be 12 numeric digits'
        };
      }

      // Passport: 1 letter + 7 digits or 8-9 alphanumeric
      if (type.includes('passport')) {
        const passRegex = /^[A-Z0-9]{6,9}$/;
        const isValid = passRegex.test(raw);
        return {
          isValid,
          message: isValid ? '✓ Valid Passport format' : 'Passport format must be 6 to 9 alphanumeric characters'
        };
      }

      // US SSN: 9 digits
      if (type.includes('ssn') || type.includes('social')) {
        const ssnRegex = /^[0-9]{9}$/;
        const isValid = ssnRegex.test(raw);
        return {
          isValid,
          message: isValid ? '✓ Valid SSN format' : 'SSN must be 9 numeric digits'
        };
      }

      return { isValid: true, message: '✓ Document number recorded' };
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
} else {
  globalThis.DataValidator = DataValidator;
}
