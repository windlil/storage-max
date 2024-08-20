---
sidebar_label: 'Introduction'
sidebar_position: 3
---

# Introduction
> storage-max is a powerful browser storage management tool with functions such as time-limited settings, batch operations, and custom namespaces. It can make storage more compliant with modular specifications and have safer typescript type constraints and prompts.

## Installation
``` bash
#npm
$ npm i storage-max

#yarn
$ yarn add storage-max

#pnpm
$ pnpm i storage-max
```

# Basic Usage

### First create a storage instance
Use function to create a MaxStorage instance.
```ts
import { defineLocalStorage } from 'storage-max'

const useLocalStorage = defineLocalStorage('UNIQ')
```
Use new class to create a MaxStorage instance.
```ts
import MaxStorage from 'storage-max'

const useLocalStorage = new MaxStorage(localStorage, 'UNIQ')
// if want to use sessionStorage, type sessionStorage
```

### Set first item
The key will become ```UNIQ_PRICE```.
```ts
useLocalStorage.setItem({
  key: 'PRICE',
  value: '100',
  expire:  60 * 60 //unit is seconds, will be unavailable in one minute.
})
```

### Get item
There is no need to add a namespace prefix when getting the value.
```ts
useLocalStorage.getItem('PRICE') //100
```

### Rmove item
```ts
useLocalStorage.removeItem('PRICE')
```

### Clear all
```ts
useLocalStorage.clear()
```
