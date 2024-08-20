import { useCallback, useEffect, useState } from "react"
import { _localStorage } from "./storage"

const mockListData = [
  {
    name: 'jack',
    age: '22',
  },
  {
    name: 'mike',
    age: '30',
  },
]

const App = () => {
  const [list, setList] = useState<any>([])

  const getStorageData = useCallback(() => {
    let listData = _localStorage.getItem('LIST')
    if (!listData) {
      _localStorage.setItem<Array<{name: string, age: string}>>({
        key: 'LIST',
        value: mockListData,
        callback: ({value}) => {
          listData = value
        },
      })
    }
    setList(listData)
  }, [])

  const removeList = useCallback(() => {
    _localStorage.removeItem({
      key: 'LIST',
      callback() {
        setList([])
      }
    })
  }, [])

  useEffect(() => {
    getStorageData()
  }, [])

  return (
    <div className="font-mono text-zinc-100 p-6">
      <ul>
        {list?.length ? list.map((item: any, index: number) => (
          <li key={index}>
            <span>name:{item.name} - age:{item.age}</span>
          </li>
        )) : <p>No Data</p>}
      </ul>
      <button onClick={removeList} className="bg-white p-2 text-black rounded-md hover:bg-zinc-100">remove list</button>
    </div>
  )
}

export default App