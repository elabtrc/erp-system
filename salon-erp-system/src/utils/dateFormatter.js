export const formatDateForBackend = (date) => {
    if (!date) return null;
    
    // If it's already a Date object
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    // If it's a string that can be parsed
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
    
    // Fallback to current date if invalid
    console.warn('Invalid date provided, using current date as fallback');
    return new Date().toISOString();
  };