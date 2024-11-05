export function openURL(
  url: string,
  type: 'redirect' | 'popup',
  target?: string,
  features?: string,
) {
  if (type === 'redirect') {
    window.location.href = url
  } else {
    return window.open(url, target, features)
  }
}
