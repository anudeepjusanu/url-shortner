/**
 * Social Media Share Utilities
 * Provides functions to share content across various platforms
 */

/**
 * Generate share URLs for different platforms
 */
export const shareUrls = {
  whatsapp: (url, text = "") => {
    const message = text ? `${text} ${url}` : url;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  },

  twitter: (url, text = "", hashtags = "") => {
    const params = new URLSearchParams();
    if (text) params.append("text", text);
    params.append("url", url);
    if (hashtags) params.append("hashtags", hashtags);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  },

  facebook: (url) => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  },

  linkedin: (url, title = "", summary = "") => {
    const params = new URLSearchParams();
    params.append("url", url);
    if (title) params.append("title", title);
    if (summary) params.append("summary", summary);
    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  },

  telegram: (url, text = "") => {
    const params = new URLSearchParams();
    params.append("url", url);
    if (text) params.append("text", text);
    return `https://t.me/share/url?${params.toString()}`;
  },

  email: (url, subject = "", body = "") => {
    const emailBody = body ? `${body}\n\n${url}` : url;
    const params = new URLSearchParams();
    if (subject) params.append("subject", subject);
    params.append("body", emailBody);
    return `mailto:?${params.toString()}`;
  },

  reddit: (url, title = "") => {
    const params = new URLSearchParams();
    params.append("url", url);
    if (title) params.append("title", title);
    return `https://reddit.com/submit?${params.toString()}`;
  },

  pinterest: (url, description = "", media = "") => {
    const params = new URLSearchParams();
    params.append("url", url);
    if (description) params.append("description", description);
    if (media) params.append("media", media);
    return `https://pinterest.com/pin/create/button/?${params.toString()}`;
  },
};

/**
 * Open share dialog with options
 * @param {string} url - The URL to share
 * @param {string} title - Title/text to accompany the share
 * @param {Function} onCopy - Callback when copy link is clicked
 */
export const openShareDialog = (url, title = "", onCopy = null) => {
  return {
    platforms: [
      {
        name: "WhatsApp",
        icon: "whatsapp",
        color: "bg-green-500 hover:bg-green-600",
        action: () => window.open(shareUrls.whatsapp(url, title), "_blank"),
      },
      {
        name: "Twitter",
        icon: "twitter",
        color: "bg-blue-400 hover:bg-blue-500",
        action: () => window.open(shareUrls.twitter(url, title), "_blank"),
      },
      {
        name: "Facebook",
        icon: "facebook",
        color: "bg-blue-600 hover:bg-blue-700",
        action: () => window.open(shareUrls.facebook(url), "_blank"),
      },
      {
        name: "LinkedIn",
        icon: "linkedin",
        color: "bg-blue-700 hover:bg-blue-800",
        action: () => window.open(shareUrls.linkedin(url, title), "_blank"),
      },
      {
        name: "Telegram",
        icon: "telegram",
        color: "bg-sky-500 hover:bg-sky-600",
        action: () => window.open(shareUrls.telegram(url, title), "_blank"),
      },
      {
        name: "Email",
        icon: "email",
        color: "bg-gray-600 hover:bg-gray-700",
        action: () => (window.location.href = shareUrls.email(url, title)),
      },
      {
        name: "Reddit",
        icon: "reddit",
        color: "bg-orange-500 hover:bg-orange-600",
        action: () => window.open(shareUrls.reddit(url, title), "_blank"),
      },
      {
        name: "Copy Link",
        icon: "copy",
        color: "bg-slate-600 hover:bg-slate-700",
        action: () => {
          navigator.clipboard.writeText(url);
          if (onCopy) onCopy();
        },
      },
    ],
  };
};

/**
 * Try to use native Web Share API if available, fallback to custom dialog
 * @param {string} url - The URL to share
 * @param {string} title - Title for the share
 * @param {string} text - Description text
 * @returns {Promise<boolean>} - true if shared successfully, false if fallback needed
 */
export const tryNativeShare = async (url, title = "", text = "") => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
      }
      return false;
    }
  }
  return false;
};

/**
 * Copy URL to clipboard
 * @param {string} url - The URL to copy
 * @returns {Promise<boolean>} - true if copied successfully
 */
export const copyToClipboard = async (url) => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      console.error("Failed to copy:", err);
      return false;
    }
  }
};

export default {
  shareUrls,
  openShareDialog,
  tryNativeShare,
  copyToClipboard,
};
