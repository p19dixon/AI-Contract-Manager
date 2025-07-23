import React, { useState, useRef, useEffect } from 'react'

interface Column {
  key: string
  header: string
  width: number
}

interface SimpleResizableTableProps {
  columns: Column[]
  data: any[]
}

export function SimpleResizableTable({ columns: initialColumns, data }: SimpleResizableTableProps) {
  const [columns, setColumns] = useState(initialColumns)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeIndex === null) return

      const table = tableRef.current
      if (!table) return

      const newColumns = [...columns]
      const diff = e.clientX - newColumns[activeIndex].width
      newColumns[activeIndex].width = Math.max(20, newColumns[activeIndex].width + diff)
      
      setColumns(newColumns)
    }

    const handleMouseUp = () => {
      setActiveIndex(null)
    }

    if (activeIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeIndex, columns])

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveIndex(index)
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg">
      <table ref={tableRef} className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b">
            {columns.map((col, index) => (
              <th
                key={col.key}
                className="relative text-left p-2 font-medium text-sm"
                style={{ width: col.width }}
              >
                <div className="pr-4">{col.header}</div>
                {index < columns.length - 1 && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-blue-500"
                    onMouseDown={handleMouseDown(index)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="p-2 text-sm"
                  style={{ width: col.width }}
                >
                  <div className="truncate">{row[col.key]}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}