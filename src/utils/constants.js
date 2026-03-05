/**
 * Mapping for student age levels to Arabic descriptive names.
 * Used for displaying levels in Firestore collections.
 */
export const AGE_LEVEL_MAP = {
    0: 'حضانة',
    1: 'أولى ابتدائى',
    2: 'ثانية ابتدائى',
    3: 'ثالثة ابتدائى',
    4: 'رابعة ابتدائى',
    5: 'خامسة ابتدائى',
    6: 'سادسة ابتدائى',
    7: 'اعدادى فما فوق'
};

/**
 * Truncates text to a specified length and adds an ellipsis.
 * @param {string} text - The text to truncate.
 * @param {number} length - Maximum length before truncation.
 * @returns {string} Truncated text.
 */
export const truncateText = (text, length = 100) => {
    if (!text || typeof text !== 'string') return text;
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
};
