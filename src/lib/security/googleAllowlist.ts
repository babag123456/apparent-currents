export function isGoogleEmailAllowed({
  allowedDomain,
  allowedEmails,
  email,
}: {
  allowedDomain?: string
  allowedEmails: string[]
  email: string
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedAllowedDomain = allowedDomain?.trim().toLowerCase() || ''
  const emailDomain = normalizedEmail.split('@')[1] || ''
  const normalizedAllowedEmails = allowedEmails.map((value) => value.trim().toLowerCase())

  return (
    normalizedAllowedEmails.includes(normalizedEmail) ||
    Boolean(normalizedAllowedDomain && emailDomain === normalizedAllowedDomain)
  )
}
