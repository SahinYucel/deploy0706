export const generateAlphanumericId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('')
}

export const formatPhoneNumber = (number) => {
  if (!number) return ''
  const cleanNumber = number.replace(/[^0-9]/g, '').replace(/^0/, '')
  return cleanNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3').trim()
}

export const capitalizeCompanyName = (name) => {
  if (!name) return ''
  return name.toLowerCase().split(' ')
    .map(word => word.charAt(0).toLowerCase() + word.slice(1))
    .join(' ')
} 