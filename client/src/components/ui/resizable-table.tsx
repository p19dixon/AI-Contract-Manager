import React, { useState, useRef, useEffect, useCallback } from 'react'

interface Column<T> {
  key: keyof T
  header: string
  width?: number
  minWidth?: number
  maxWidth?: number
  render?: (value: any, item: T) => React.ReactNode
}

interface ResizableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
}

export function ResizableTable<T extends Record<string, any>>({
  data,
  columns,
  className = ''
}: ResizableTableProps<T>) {
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
    const widths: { [key: string]: number } = {}
    columns.forEach(col => {
      widths[String(col.key)] = col.width || 150
    })
    return widths
  })

  const tableRef = useRef<HTMLTableElement>(null)
  const resizeDataRef = useRef<{
    isResizing: boolean
    column: string | null
    startX: number
    startWidth: number
  }>({
    isResizing: false,
    column: null,
    startX: 0,
    startWidth: 0
  })

  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const column = columns.find(col => String(col.key) === columnKey)
    if (!column) return
    
    resizeDataRef.current = {
      isResizing: true,
      column: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey] || 150
    }
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [columns, columnWidths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { isResizing, column, startX, startWidth } = resizeDataRef.current
    
    if (!isResizing || !column) return
    
    const deltaX = e.clientX - startX
    const col = columns.find(c => String(c.key) === column)
    const minWidth = col?.minWidth || 50
    const maxWidth = col?.maxWidth || 500
    const newWidth = Math.min(Math.max(minWidth, startWidth + deltaX), maxWidth)
    
    setColumnWidths(prev => ({
      ...prev,
      [column]: newWidth
    }))
  }, [columns])

  const handleMouseUp = useCallback(() => {
    resizeDataRef.current = {
      isResizing: false,
      column: null,
      startX: 0,
      startWidth: 0
    }
    
    // Remove cursor style from body
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table ref={tableRef} className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b">
            {columns.map((column) => {
              const columnKey = String(column.key)
              const width = columnWidths[columnKey]
              
              return (
                <th
                  key={columnKey}
                  className="relative bg-gray-50 text-left font-medium text-sm text-gray-700"
                  style={{ width: `${width}px` }}
                >
                  <div className="px-4 py-3 pr-8">
                    <span className="block truncate">{column.header}</span>
                  </div>
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-gray-300"
                    onMouseDown={(e) => handleMouseDown(e, columnKey)}
                    style={{
                      touchAction: 'none'
                    }}
                  />
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50">
              {columns.map((column) => {
                const columnKey = String(column.key)
                const width = columnWidths[columnKey]
                
                return (
                  <td
                    key={columnKey}
                    className="px-4 py-3 text-sm"
                    style={{ width: `${width}px` }}
                  >
                    <div className="truncate">
                      {column.render
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}