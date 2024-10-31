export async function openURL(
  url: string,
  type: 'redirect' | 'popup',
  target?: string,
  features?: string,
) {
  const open = await import('open')
  return await open.default(url, { app: { name: 'google chrome' } })
}
