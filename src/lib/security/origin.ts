export function areApexWWWOriginSiblings(firstOrigin: string, secondOrigin: string): boolean {
  let first: URL
  let second: URL

  try {
    first = new URL(firstOrigin)
    second = new URL(secondOrigin)
  } catch {
    return false
  }

  if (first.protocol !== second.protocol || first.port !== second.port) {
    return false
  }

  const firstHostname = first.hostname.toLowerCase()
  const secondHostname = second.hostname.toLowerCase()

  if (firstHostname === secondHostname) {
    return false
  }

  return (
    firstHostname === `www.${secondHostname}` ||
    secondHostname === `www.${firstHostname}`
  )
}

export function getApexWWWCookieDomain(firstOrigin: string, secondOrigin: string): string | null {
  if (!areApexWWWOriginSiblings(firstOrigin, secondOrigin)) {
    return null
  }

  const firstHostname = new URL(firstOrigin).hostname.toLowerCase()
  const secondHostname = new URL(secondOrigin).hostname.toLowerCase()

  return firstHostname.startsWith('www.') ? firstHostname.slice(4) : secondHostname.slice(4)
}
