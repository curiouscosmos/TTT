export function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString() : 'None';
}

export function todayDateInputValue() {
  // The API accepts date-only strings; use local date components so the default
  // does not jump a day for users outside UTC.
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toDateInputValue(date: string) {
  return date.slice(0, 10);
}
