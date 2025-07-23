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

interface ColumnState {
  key: string
  width: number
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
  const [columnStates, setColumnStates] = useState<ColumnState[]>([])
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  // Initialize column states
  useEffect(() => {
    const states: ColumnState[] = columns.map(col => ({
      key: String(col.key),
      width: typeof col.width === 'string' ? parseInt(col.width) * 4 : (col.width || 150)
    }))
    if (actions) {
      states.push({ key: 'actions', width: 120 })
    }
    setColumnStates(states)
  }, [columns, actions])

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
      if (activeIndex === null) return

      const diff = e.clientX - startX.current
      const newWidth = Math.max(1, startWidth.current + diff)
      
      const newStates = [...columnStates]
      newStates[activeIndex].width = newWidth
      setColumnStates(newStates)
    }

    const handleMouseUp = () => {
      setActiveIndex(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (activeIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeIndex, columnStates])

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveIndex(index)
    startX.current = e.clientX
    startWidth.current = columnStates[index]?.width || 150
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
            <table ref={tableRef} className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column, index) => {
                    const columnState = columnStates[index]
                    const width = columnState?.width || 150
                    
                    return (
                      <th
                        key={String(column.key)}
                        className="relative text-left font-medium text-sm text-gray-700 px-4 py-3"
                        style={{ width, minWidth: 1 }}
                      >
                        <div className="truncate pr-4">{column.header}</div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-300"
                          onMouseDown={handleMouseDown(index)}
                        />
                      </th>
                    )
                  })}
                  {actions && (
                    <th 
                      className="relative text-left font-medium text-sm text-gray-700 px-4 py-3" 
                      style={{ width: columnStates[columns.length]?.width || 120, minWidth: 1 }}
                    >
                      <div>Actions</div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 bg-gray-300"
                        onMouseDown={handleMouseDown(columns.length)}
                      />
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                    {columns.map((column, colIndex) => {
                      const columnState = columnStates[colIndex]
                      const width = columnState?.width || 150
                      
                      return (
                        <td
                          key={String(column.key)}
                          className="px-4 py-3 text-sm"
                          style={{ width, minWidth: 1 }}
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
                        style={{ width: columnStates[columns.length]?.width || 120, minWidth: 1 }}
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