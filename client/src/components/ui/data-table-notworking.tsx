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
  
  // Initialize column widths with column keys
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {}
    columns.forEach(col => {
      const key = String(col.key)
      widths[key] = typeof col.width === 'string' ? parseInt(col.width) * 4 : (col.width || 150)
    })
    if (actions) {
      widths['actions'] = 120
    }
    return widths
  })

  // Resize state
  const [resizingKey, setResizingKey] = useState<string | null>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

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

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingKey) return

      const diff = e.clientX - startX.current
      const newWidth = Math.max(20, startWidth.current + diff)
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingKey]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizingKey(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (resizingKey) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingKey])

  const handleMouseDown = (columnKey: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingKey(columnKey)
    startX.current = e.clientX
    startWidth.current = columnWidths[columnKey] || 150
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
            <table ref={tableRef} className="w-full table-fixed">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column) => {
                    const columnKey = String(column.key)
                    const width = columnWidths[columnKey] || 150
                    
                    return (
                      <th
                        key={columnKey}
                        className="relative text-left font-medium text-sm text-gray-700 px-4 py-3"
                        style={{ width }}
                      >
                        <div className="truncate pr-2">{column.header}</div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500"
                          onMouseDown={handleMouseDown(columnKey)}
                          style={{ 
                            backgroundColor: resizingKey === columnKey ? '#3b82f6' : undefined 
                          }}
                        />
                      </th>
                    )
                  })}
                  {actions && (
                    <th 
                      className="relative text-left font-medium text-sm text-gray-700 px-4 py-3" 
                      style={{ width: columnWidths['actions'] || 120 }}
                    >
                      <div>Actions</div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500"
                        onMouseDown={handleMouseDown('actions')}
                        style={{ 
                          backgroundColor: resizingKey === 'actions' ? '#3b82f6' : undefined 
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
                      const columnKey = String(column.key)
                      const width = columnWidths[columnKey] || 150
                      
                      return (
                        <td
                          key={columnKey}
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
                        style={{ width: columnWidths['actions'] || 120 }}
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