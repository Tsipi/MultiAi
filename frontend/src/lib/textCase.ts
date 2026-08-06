/** Uppercases the first character only, leaving the rest of the user's wording untouched. */
export function capitaliseFirst(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
