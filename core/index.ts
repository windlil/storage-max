
abstract class AbstractStrongStorage {
  protected storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }
}

type ItemsContainer<T extends (Array<unknown> | Record<string, unknown>)> = T extends Array<unknown> ? T : Record<string, unknown>

type Interceptor = (item: {
  namespace: string
}) => {
  namespace: string
}

class MaxStorage extends AbstractStrongStorage {
  protected UNI_KEYS_SET: Set<string>

  constructor(storage: Storage, private namespace = '_MAXSTORAGE_') {
    super(storage)
    this.initUniKeysSet()
  }

  private initUniKeysSet() {
    const list = this.getItem<Set<string> | null>('UNI_KEYS_SET')

    if (list) {
      this.UNI_KEYS_SET = list
    } else {
      this.UNI_KEYS_SET = new Set()
      this.setItem('UNI_KEYS_SET', this.UNI_KEYS_SET)
    }
  }

  private getUniKey(key: string, manualNameSpace?: string) {
    return `${manualNameSpace ?? this.namespace}${key}`
  }

  setItem<T = any>(keyOrObject: string | {
    key: string
    value: T
    expire?: number
    interceptor?: Interceptor
  }, value?: T, expire?: number) {
    let uniKey: string
    if (typeof keyOrObject === 'object') {
      if (typeof keyOrObject?.interceptor === 'function') {
        const { namespace: manualNameSpace } = keyOrObject.interceptor({
          namespace: this.namespace
        })
        uniKey = this.getUniKey(keyOrObject?.key, manualNameSpace)
      } else {
        uniKey = this.getUniKey(keyOrObject?.key)
      }
    } else {
      uniKey = this.getUniKey(keyOrObject)
    }

    this.UNI_KEYS_SET.add(uniKey)

    let _item = {
      value,
      expire: expire ? (new Date().getTime() + expire) : undefined
    }
    
    this.storage.setItem(uniKey, JSON.stringify(_item))

    return {
      remove:() => {
        this.removeItem(uniKey)
      }
    }
  }
  
  getItem<T>(key: string, justReturn = false): T | null {
    const uniKey = this.getUniKey(key)
    const data = this.storage.getItem(uniKey)
    if (justReturn) return data as any
    if (data) {
      const item: {
        value: T
        expire?: number
      } = JSON.parse(data)

      if (item?.expire) {
        if (new Date().getTime() < item.expire) {
          return item.value
        } else {
          this.UNI_KEYS_SET.delete(uniKey)
          this.removeItem(key)
        }
      } else {
        return item.value
      }
    }
    return null
  }

  removeItem(key: string) {
    const item = this.getItem(key, true)
    let result: boolean

    if (item) {
      this.storage.removeItem(this.getUniKey(key))
      result = true
    }
  }

  clear() {
    this.storage.clear()
  }

  getNameSpace() {
    return this.namespace
  }

  getItems<T extends (Array<unknown> | Record<string, unknown>)>(keyList: string[], itemsContainer: Record<string | symbol, unknown>): Record<string | symbol, unknown>
  getItems<T extends (Array<unknown> | Record<string, unknown>)>(keyList: string[], itemsContainer: Array<unknown>): T
  getItems<T extends (Array<unknown> | Record<string, unknown>)>(keyList: string[], itemsContainer: ItemsContainer<T>): T{
    const items = itemsContainer

    if (Array.isArray(items)) {
      keyList.forEach((key) => {
        const data = this.getItem(key)
        if (data) {
          items.push(data)
        }
      })
    } else {
      keyList.forEach((key) => {
        const data = this.getItem(key)
        if (data) {
          items[key] = data
        }
      })
    }

    return items as T
  }

  setItems<T = any>(target: {key: string, value: T, expire?: number, interceptor?: Interceptor }[] | Record<string, T>) {
    const targetIsArray = Array.isArray(target)
    if (targetIsArray) {
      target.map(({ key, value, expire, interceptor }) => {
        this.setItem({
          key, value, expire, interceptor
        })
      })
    } else {
      for (const k in target) {
        this.setItem(k, target[k])
      }
    }
  }

  removeItems(keyList: string[]) {
    keyList.map((k) => {
      this.removeItem(k)
    })
  }
}

export default MaxStorage