import React, { ReactNode, useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
  width?: number
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
  const [searchQuery, setSearchQuery] = React.useState('')
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({})
  const tableRef = useRef<HTMLTableElement>(null)
  const resizeRef = useRef<{
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

  // Initialize column widths
  useEffect(() => {
    const initialWidths: { [key: string]: number } = {}
    columns.forEach((column) => {
      const key = String(column.key)
      initialWidths[key] = column.width || 150
    })
    setColumnWidths(initialWidths)
  }, [columns])

  // Calculate total table width
  const totalTableWidth = React.useMemo(() => {
    const columnsWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)
    const actionsWidth = actions ? 120 : 0
    return columnsWidth + actionsWidth
  }, [columnWidths, actions])

  // Handle resize start
  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const column = columns.find(col => String(col.key) === columnKey)
    if (!column) return
    
    resizeRef.current = {
      isResizing: true,
      column: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey] || 150
    }
    
    // Add visual feedback
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [columns, columnWidths])

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { isResizing, column, startX, startWidth } = resizeRef.current
    
    if (!isResizing || !column) return
    
    const deltaX = e.clientX - startX
    const col = columns.find(c => String(c.key) === column)
    const minWidth = col?.minWidth || 50
    const maxWidth = col?.maxWidth || 800
    const newWidth = Math.min(Math.max(minWidth, startWidth + deltaX), maxWidth)
    
    setColumnWidths(prev => ({
      ...prev,
      [column]: newWidth
    }))
  }, [columns])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    resizeRef.current = {
      isResizing: false,
      column: null,
      startX: 0,
      startWidth: 0
    }
    
    // Remove visual feedback
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Add event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

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
            <table 
              ref={tableRef} 
              className="border-collapse"
              style={{ 
                width: `${totalTableWidth}px`,
                minWidth: '100%'
              }}
            >
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column, index) => {
                    const columnKey = String(column.key)
                    const width = columnWidths[columnKey] || 150
                    const isLastColumn = index === columns.length - 1
                    
                    return (
                      <th
                        key={columnKey}
                        className="relative text-left font-medium text-sm text-gray-700"
                        style={{ 
                          width: `${width}px`,
                          minWidth: `${width}px`,
                          maxWidth: `${width}px`
                        }}
                      >
                        <div className="px-4 py-3 truncate" title={column.header}>
                          {column.header}
                        </div>
                        {!isLastColumn && (
                          <div
                            className="absolute top-0 right-0 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
                            style={{
                              width: '3px',
                              backgroundColor: resizeRef.current.column === columnKey ? '#3b82f6' : '#e5e7eb'
                            }}
                            onMouseDown={(e) => handleMouseDown(e, columnKey)}
                          />
                        )}
                      </th>
                    )
                  })}
                  {actions && (
                    <th 
                      className="text-left font-medium text-sm text-gray-700 bg-gray-50" 
                      style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                    >
                      <div className="px-4 py-3">Actions</div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((column) => {
                      const columnKey = String(column.key)
                      const width = columnWidths[columnKey] || 150
                      return (
                        <td
                          key={columnKey}
                          className="text-sm"
                          style={{ 
                            width: `${width}px`,
                            minWidth: `${width}px`,
                            maxWidth: `${width}px`
                          }}
                        >
                          <div className="px-4 py-3 truncate" title={String(item[column.key] || '')}>
                            {column.render
                              ? column.render(item[column.key], item)
                              : String(item[column.key] || '')}
                          </div>
                        </td>
                      )
                    })}
                    {actions && (
                      <td className="text-sm" style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                        <div className="px-4 py-3">
                          {actions(item)}
                        </div>
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