export const getModalAppElement = () => {
  if (typeof document === 'undefined') return undefined

  return document.getElementById('app-root') ?? document.body
}
