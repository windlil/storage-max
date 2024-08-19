export const setStorageItem = (key: string, value: any, expire?: number) => {
  localStorage.setItem(key, JSON.stringify({
    value,
    expire: expire ? (new Date().getTime() + expire) : undefined
  }))
}

export const getStorageItem = <T>(key: string, justReturn = false): T | null => {
  const jsonItem = localStorage.getItem(key)
  if (justReturn) return jsonItem as any
  if (jsonItem) {
    const item: {
      value: any
      expire?: number
    } = JSON.parse(jsonItem)
    if (item?.expire) {
      if (new Date().getTime() < item.expire) {
        return item.value
      } else {
        removeStorageItem(key)
      }
    } else {
      return item.value
    }
  }
  return null
}

export const removeStorageItem = (key: string) => {
  const item = getStorageItem(key, true)
  if (item) {
    localStorage.removeItem(key)
  }
}

export const clearStorage = () => {
  localStorage.clear()
}