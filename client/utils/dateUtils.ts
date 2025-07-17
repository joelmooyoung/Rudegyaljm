export function formatDate(dateValue: any): string {
  if (!dateValue) return "No date";

  try {
    // Handle various date formats
    let date: Date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === "string" || typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      return "Invalid date";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    // Format the date
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Date error";
  }
}

export function formatDateTime(dateValue: any): string {
  if (!dateValue) return "No date";

  try {
    let date: Date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleString();
  } catch (error) {
    console.error("DateTime formatting error:", error);
    return "DateTime error";
  }
}
