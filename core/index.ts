type ItemsContainer<T extends (Array<unknown> | Record<string, unknown>)> = T extends Array<unknown> ? T : Record<string, unknown>

type Interceptor = (item: {
  namespace: string
}) => {
  namespace: string
}

type SetItemObjectParameter<T> = {
  key: string
  value: T
  expire?: number
  interceptor?: Interceptor
  callback?: (({value}: {value: T}) => void) | undefined
}

type SetItemReturn = {
  remove: () => void
  prevSet: () => void
  uniKey: string
}

type RemoveItemObjectParameter= {
  key: string
  callback?: () => any
}

const enum MAX_STORAGE_MAP {
  UNI_KEYS_ARRAY = 'UNI_KEYS_ARRAY',
  DEFAULT_NAMESPACE = '_DEFAULT_'
}

export const isObject = (target: unknown) => typeof target === 'object' && target !== null
export const isFunction = (target: unknown) => typeof target === 'function'

class MaxStorage {
  private UNI_KEYS_ARRAY: Array<string> = []

  constructor(private storage: Storage, private namespace: string = MAX_STORAGE_MAP['DEFAULT_NAMESPACE']) {
    this.storage = storage
    this.initUniKeysSet()
  }

  private initUniKeysSet() {
    const list = this.getItem<Array<string> | null>(MAX_STORAGE_MAP['UNI_KEYS_ARRAY'])

    if (list) {
      this.UNI_KEYS_ARRAY = list
    } else {
      this.UNI_KEYS_ARRAY = []
      this.setItem(MAX_STORAGE_MAP['UNI_KEYS_ARRAY'], this.UNI_KEYS_ARRAY)
    }
  }

  private getUniKey(key: string, manualNameSpace?: string) {
    return `${manualNameSpace ?? this.namespace}${key}`
  }

  setItem<T = any>(stringOrObject: SetItemObjectParameter<T>): SetItemReturn
  setItem<T = any>(stringOrObject: string, value: T, expire?: number): SetItemReturn
  setItem<T = any>(stringOrObject: string | SetItemObjectParameter<T>, value?: T, expire?: number): SetItemReturn {
    let uniKey: string
    let callback: (({value}: {value: T}) => void) | undefined
    let _manualNameSpace
    let _item = {
      value: value,
      expire
    }

    if (isObject(stringOrObject)) {
      _item.value = stringOrObject.value
      _item.expire = stringOrObject?.expire ? new Date().getTime() + stringOrObject.expire : undefined
      callback = stringOrObject?.callback

      // handle interceptor
      if (isFunction(stringOrObject?.interceptor)) {
        const { namespace: manualNameSpace } = stringOrObject.interceptor({
          namespace: this.namespace
        })
        _manualNameSpace = manualNameSpace
        uniKey = this.getUniKey(stringOrObject?.key, manualNameSpace)
      } else {
        uniKey = this.getUniKey(stringOrObject?.key)
      }
    } else {
      _item.value = value
      uniKey = this.getUniKey(stringOrObject)
    }
    
    this.storage.setItem(uniKey, JSON.stringify(_item))

    // dont handle manualnamespacec
    if (!_manualNameSpace) {
      this.UNI_KEYS_ARRAY.push(uniKey)
      this.storage.setItem(this.getUniKey(MAX_STORAGE_MAP['UNI_KEYS_ARRAY']), JSON.stringify({
        value: this.UNI_KEYS_ARRAY
      }))
    }

    typeof callback === 'function' && callback({
      value: _item.value as T,
    })

    return {
      remove:() => {
        this.removeItem(uniKey)
      },
      prevSet: () => {
        this.setItem(stringOrObject as any, value, expire)
      },
      uniKey: uniKey,
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
          this.removeItem(key)
          this.removeUniKeyArrayItem(key)
        }
      } else {
        return item.value
      }
    }
    
    return null
  }

  removeUniKeyArrayItem(key: string) {
    const uniKey = this.getUniKey(key)
    const index = this.UNI_KEYS_ARRAY.findIndex((value) => value === uniKey)
    if (index !== -1) {
      this.UNI_KEYS_ARRAY.splice(index, 1)
      this.setItem(MAX_STORAGE_MAP['UNI_KEYS_ARRAY'], this.UNI_KEYS_ARRAY)
    }
  }

  removeItem(stringOrObject: string | RemoveItemObjectParameter): void {
    let key: string
    let callback
    if (isObject(stringOrObject)) {
      key = stringOrObject.key
      callback = stringOrObject?.callback
    } else {
      key = stringOrObject
    }
    const item = this.getItem(key, true)

    if (item) {
      this.storage.removeItem(this.getUniKey(key))
      typeof callback === 'function' && callback()
    }
  }

  clear() {
    this.storage.clear()
  }

  getNameSpace() {
    return this.namespace
  }

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

  setItems<T = any>(target: SetItemObjectParameter<T>[] | Record<string, T>):Record<string, ()=>void> {
    const targetIsArray = Array.isArray(target)
    const removeCallbacks: any = {}
    if (targetIsArray) {
      target.map(({ key, value, expire, interceptor, callback }) => {
        const { remove } = this.setItem({
          key,
          value,
          expire,
          interceptor,
          callback
        })
        removeCallbacks[key] = remove
      })
    } else {
      for (const k in target) {
        const { remove } = this.setItem(k, target[k])
        removeCallbacks[k] = remove
      }
    }
    return removeCallbacks
  }


  removeItems(keyList: RemoveItemObjectParameter[]) {
    keyList.map((k) => {
      this.removeItem({
        key: k.key,
        callback: k?.callback
      })
    })
  }
}

export const defineLocalStorage = (namespace?: string) => {
  return new MaxStorage(localStorage, namespace)
}

export const defineSessionStorage = (namespace?: string) => {
  return new MaxStorage(sessionStorage, namespace)
}

export default MaxStorage
export * from './mini'