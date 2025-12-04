// Centralized admin configuration
// Only authorized ADNU personnel emails listed here have admin access

export const ADMIN_EMAILS = [
  'lojenar@gbox.adnu.edu.ph',
  'laojenar@gbox.adnu.edu.ph',
  'mtresreyes@gbox.adnu.edu.ph', // Added for quiz admin access
  // Add other authorized ADNU admin emails here as needed:
  // 'admin@gbox.adnu.edu.ph',
  // 'it.admin@gbox.adnu.edu.ph',
]

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
