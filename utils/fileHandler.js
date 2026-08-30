/**
 * SmartFill AI Assistant — File Compression & Storage Quota Manager (fileHandler.js)
 * Handles client-side canvas downsampling, progressive image compression (<300KB),
 * base64 encoding, document storage, and chrome.storage.local quota tracking.
 */

const FileHandler = {
  MAX_FILE_SIZE_BYTES: 300 * 1024, // 300 KB budget per document
  MAX_IMAGE_DIMENSION: 1200,        // Max width or height in px for crisp readability
  STORAGE_QUOTA_BYTES: (chrome.storage?.local?.QUOTA_BYTES) || (10 * 1024 * 1024), // 10 MB default

  /**
   * Compresses and processes an image File or Blob using HTML5 Canvas.
   * Scales dimension and adjusts JPEG quality iteratively until size <= 300KB.
   * @param {File} file Raw image file
   * @returns {Promise<{base64: string, size: number, type: string, name: string}>}
   */
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file format'));
        img.onload = () => {
          try {
            let width = img.width;
            let height = img.height;

            // Preserve aspect ratio and scale within bounds
            if (width > this.MAX_IMAGE_DIMENSION || height > this.MAX_IMAGE_DIMENSION) {
              if (width > height) {
                height = Math.round((height * this.MAX_IMAGE_DIMENSION) / width);
                width = this.MAX_IMAGE_DIMENSION;
              } else {
                width = Math.round((width * this.MAX_IMAGE_DIMENSION) / height);
                height = this.MAX_IMAGE_DIMENSION;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Draw smooth background and image
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Iterative compression to satisfy 300KB limit
            let quality = 0.85;
            let mimeType = file.type === 'image/png' && file.size < this.MAX_FILE_SIZE_BYTES ? 'image/png' : 'image/jpeg';
            let dataUrl = canvas.toDataURL(mimeType, quality);

            while (dataUrl.length * 0.75 > this.MAX_FILE_SIZE_BYTES && quality > 0.3) {
              quality -= 0.15;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            const approximateBytes = Math.round(dataUrl.length * 0.75);
            resolve({
              base64: dataUrl,
              size: approximateBytes,
              type: file.type || 'image/jpeg',
              name: file.name
            });
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Processes a PDF file into base64.
   * Warns or restricts if raw size exceeds allowable quota.
   * @param {File} file PDF document
   */
  async processPdf(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('PDF size exceeds 2 MB. Please select a smaller PDF or compress it first.'));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.onload = (e) => {
        const base64 = e.target.result;
        resolve({
          base64: base64,
          size: file.size,
          type: 'application/pdf',
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Unified dispatcher for PDF, PNG, JPG, and WEBP files.
   */
  async processFile(file) {
    if (!file) throw new Error('No file provided');
    if (file.type.startsWith('image/')) {
      return await this.processImage(file);
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return await this.processPdf(file);
    } else {
      throw new Error('Unsupported format. Please upload PDF, PNG, or JPG files.');
    }
  },

  /**
   * Calculates real-time storage usage in chrome.storage.local.
   * @returns {Promise<{usedBytes: number, quotaBytes: number, percentage: number, formattedUsed: string, formattedQuota: string, isWarning: boolean}>}
   */
  async getStorageUsage() {
    try {
      const allData = await chrome.storage.local.get(null);
      const jsonString = JSON.stringify(allData);
      const usedBytes = new Blob([jsonString]).size;
      const quotaBytes = this.STORAGE_QUOTA_BYTES;
      const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

      const formatBytes = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
      };

      return {
        usedBytes,
        quotaBytes,
        percentage,
        formattedUsed: formatBytes(usedBytes),
        formattedQuota: formatBytes(quotaBytes),
        isWarning: percentage >= 80
      };
    } catch (e) {
      console.error('Storage calculation failed:', e);
      return {
        usedBytes: 0,
        quotaBytes: this.STORAGE_QUOTA_BYTES,
        percentage: 0,
        formattedUsed: '0 MB',
        formattedQuota: '10 MB',
        isWarning: false
      };
    }
  },

  /**
   * Export all extension data as JSON string for backup.
   */
  async exportBackup() {
    const data = await chrome.storage.local.get(null);
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import extension data from JSON string.
   */
  async importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid backup file structure');
      }
      await chrome.storage.local.clear();
      await chrome.storage.local.set(data);
      return true;
    } catch (e) {
      throw new Error('Failed to import backup: ' + e.message);
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileHandler;
} else {
  globalThis.FileHandler = FileHandler;
}
