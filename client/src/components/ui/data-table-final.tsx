import React, { ReactNode, useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
  width?: string | number
  minWidth?: number
  maxWidth?: number
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onAdd?: () => void
  addButtonText?: string
  loading?: boolean
  emptyMessage?: string
  actions?: (item: T) => ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  onAdd,
  addButtonText = 'Add New',
  loading = false,
  emptyMessage = 'No data available',
  actions
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const tableRef = useRef<HTMLTableElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeData, setResizeData] = useState({ colIndex: -1, startX: 0, startWidth: 0 })
  
  // Track all column elements
  const columnRefs = useRef<(HTMLTableCellElement | null)[]>([])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch?.(query)
  }

  const filteredData = React.useMemo(() => {
    if (!searchQuery || onSearch) return data

    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [data, searchQuery, onSearch])

  // Mouse down handler
  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    const th = columnRefs.current[index]
    if (!th) return
    
    setIsResizing(true)
    setResizeData({
      colIndex: index,
      startX: e.clientX,
      startWidth: th.offsetWidth
    })
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || resizeData.colIndex === -1) return
      
      const deltaX = e.clientX - resizeData.startX
      const newWidth = Math.max(20, resizeData.startWidth + deltaX)
      
      // Update header width
      const th = columnRefs.current[resizeData.colIndex]
      if (th) {
        th.style.width = newWidth + 'px'
      }
      
      // Update all body cells in this column
      const tbody = tableRef.current?.querySelector('tbody')
      if (tbody) {
        const rows = tbody.querySelectorAll('tr')
        rows.forEach(row => {
          const td = row.cells[resizeData.colIndex]
          if (td) {
            td.style.width = newWidth + 'px'
          }
        })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeData({ colIndex: -1, startX: 0, startWidth: 0 })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeData])

  // Calculate initial widths
  const getInitialWidth = (column: Column<T>) => {
    if (typeof column.width === 'string') {
      return parseInt(column.width) * 4
    }
    return column.width || 150
  }

  return (
    <Card>
      {(title || description || searchable || onAdd) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {searchable && (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-64"
                />
              )}
              {onAdd && (
                <Button onClick={onAdd}>
                  {addButtonText}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table ref={tableRef} className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column, index) => {
                    const width = getInitialWidth(column)
                    
                    return (
                      <th
                        key={String(column.key)}
                        ref={el => columnRefs.current[index] = el}
                        className="relative text-left font-medium text-sm text-gray-700 px-4 py-3"
                        style={{ width }}
                      >
                        <div className="truncate pr-2">{column.header}</div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 hover:opacity-50"
                          onMouseDown={handleMouseDown(index)}
                          style={{ 
                            backgroundColor: isResizing && resizeData.colIndex === index ? '#3b82f6' : undefined,
                            opacity: isResizing && resizeData.colIndex === index ? 0.5 : undefined
                          }}
                        />
                      </th>
                    )
                  })}
                  {actions && (
                    <th 
                      ref={el => columnRefs.current[columns.length] = el}
                      className="relative text-left font-medium text-sm text-gray-700 px-4 py-3" 
                      style={{ width: 120 }}
                    >
                      <div>Actions</div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 hover:opacity-50"
                        onMouseDown={handleMouseDown(columns.length)}
                        style={{ 
                          backgroundColor: isResizing && resizeData.colIndex === columns.length ? '#3b82f6' : undefined,
                          opacity: isResizing && resizeData.colIndex === columns.length ? 0.5 : undefined
                        }}
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                    {columns.map((column) => {
                      const width = getInitialWidth(column)
                      
                      return (
                        <td
                          key={String(column.key)}
                          className="px-4 py-3 text-sm"
                          style={{ width }}
                        >
                          <div className="truncate">
                            {column.render
                              ? column.render(item[column.key], item)
                              : String(item[column.key] || '')}
                          </div>
                        </td>
                      )
                    })}
                    {actions && (
                      <td 
                        className="px-4 py-3 text-sm" 
                        style={{ width: 120 }}
                      >
                        {actions(item)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Utility component for action buttons
export function TableActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center space-x-1">
      {children}
    </div>
  )
}