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
  hideOnMobile?: boolean
  priority?: 'high' | 'medium' | 'low'
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
  wrapText?: boolean
  mobileView?: 'table' | 'cards'
  cardRenderer?: (item: T) => ReactNode
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
  actions,
  wrapText = true,
  mobileView = 'cards',
  cardRenderer
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const tableRef = useRef<HTMLTableElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [isResizingTable, setIsResizingTable] = useState(false)
  const [resizeData, setResizeData] = useState({ colIndex: -1, startX: 0, startWidth: 0 })
  const [tableWidth, setTableWidth] = useState<number | null>(null)
  
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

  // Table resize handler
  const handleTableResize = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!tableRef.current) return
    
    setIsResizingTable(true)
    setResizeData({
      colIndex: -1,
      startX: e.clientX,
      startWidth: tableRef.current.offsetWidth
    })
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTable) {
        // Resizing the entire table
        const deltaX = e.clientX - resizeData.startX
        const newWidth = Math.max(400, resizeData.startWidth + deltaX)
        
        if (tableRef.current) {
          tableRef.current.style.width = newWidth + 'px'
          setTableWidth(newWidth)
        }
      } else if (isResizing && resizeData.colIndex !== -1) {
        // Resizing individual column
        const deltaX = e.clientX - resizeData.startX
        const newWidth = Math.max(20, resizeData.startWidth + deltaX)
        
        // Update header width
        const th = columnRefs.current[resizeData.colIndex]
        if (th) {
          th.style.width = newWidth + 'px'
        }
        
        // If using fixed table layout with text wrap, also update body cells
        if (wrapText && tableRef.current) {
          const tbody = tableRef.current.querySelector('tbody')
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
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setIsResizingTable(false)
      setResizeData({ colIndex: -1, startX: 0, startWidth: 0 })
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing || isResizingTable) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isResizingTable, resizeData])

  // Calculate initial widths
  const getInitialWidth = (column: Column<T>) => {
    if (typeof column.width === 'string') {
      return parseInt(column.width) * 4
    }
    return column.width || 150
  }

  // Default card renderer
  const defaultCardRenderer = (item: T) => {
    const primaryColumn = columns[0]
    const secondaryColumn = columns[1]
    
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
        {/* Primary info */}
        <div>
          <div className="text-sm text-gray-500">{primaryColumn.header}</div>
          <div className="font-medium">
            {primaryColumn.render 
              ? primaryColumn.render(item[primaryColumn.key], item)
              : String(item[primaryColumn.key] || '')}
          </div>
        </div>
        
        {/* Secondary info */}
        {secondaryColumn && (
          <div>
            <div className="text-sm text-gray-500">{secondaryColumn.header}</div>
            <div className="text-sm">
              {secondaryColumn.render 
                ? secondaryColumn.render(item[secondaryColumn.key], item)
                : String(item[secondaryColumn.key] || '')}
            </div>
          </div>
        )}
        
        {/* Additional fields */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {columns.slice(2, 5).map((column) => (
            <div key={String(column.key)}>
              <span className="text-gray-500">{column.header}:</span>{' '}
              <span>
                {column.render 
                  ? column.render(item[column.key], item)
                  : String(item[column.key] || '')}
              </span>
            </div>
          ))}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="pt-2 border-t border-gray-100">
            {actions(item)}
          </div>
        )}
      </div>
    )
  }

  const renderCard = cardRenderer || defaultCardRenderer

  return (
    <Card>
      {(title || description || searchable || onAdd) && (
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {searchable && (
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="flex-1 sm:w-64"
                />
              )}
              {onAdd && (
                <Button onClick={onAdd} className="whitespace-nowrap">
                  <span className="hidden sm:inline">{addButtonText}</span>
                  <span className="sm:hidden">+</span>
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
          <>
            {/* Mobile Card View */}
            <div className={`grid gap-4 p-4 ${mobileView === 'cards' ? 'sm:hidden' : 'hidden'}`}>
              {filteredData.map((item, index) => (
                <div key={index}>
                  {renderCard(item)}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className={`overflow-x-auto ${mobileView === 'cards' ? 'hidden sm:block' : ''}`} ref={tableContainerRef}>
            <table 
              ref={tableRef} 
              className="w-full" 
              style={{ 
                tableLayout: wrapText ? 'fixed' : 'auto',
                width: tableWidth || '100%',
                minWidth: wrapText ? undefined : '100%'
              }}
            >
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column, index) => {
                    const width = getInitialWidth(column)
                    const mobileClass = column.hideOnMobile ? 'hidden sm:table-cell' : ''
                    
                    return (
                      <th
                        key={String(column.key)}
                        ref={el => columnRefs.current[index] = el}
                        className={`relative text-left font-medium text-sm text-gray-700 px-4 py-3 ${mobileClass}`}
                        style={{ width, minWidth: width }}
                      >
                        <div className={wrapText ? "pr-2 break-words" : "pr-2 truncate"}>{column.header}</div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 hover:opacity-50 hidden sm:block"
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
                      style={{ width: 120, minWidth: 120 }}
                    >
                      <div>Actions</div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-transparent hover:bg-blue-500 hover:opacity-50 hidden sm:block"
                        onMouseDown={handleMouseDown(columns.length)}
                        style={{ 
                          backgroundColor: isResizing && resizeData.colIndex === columns.length ? '#3b82f6' : undefined,
                          opacity: isResizing && resizeData.colIndex === columns.length ? 0.5 : undefined
                        }}
                      />
                    </th>
                  )}
                  {/* Table resize handle - desktop only */}
                  <th className="relative hidden sm:table-cell" style={{ width: 5, padding: 0 }}>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-gray-400 hover:bg-blue-500"
                      onMouseDown={handleTableResize}
                      title="Drag to resize table"
                      style={{ 
                        backgroundColor: isResizingTable ? '#3b82f6' : undefined,
                        opacity: isResizingTable ? 0.8 : undefined
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-colors">
                    {columns.map((column) => {
                      const width = wrapText ? getInitialWidth(column) : undefined
                      const mobileClass = column.hideOnMobile ? 'hidden sm:table-cell' : ''
                      return (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 text-sm ${mobileClass}`}
                          style={wrapText ? { width } : undefined}
                        >
                        <div className={wrapText ? "break-words" : "truncate"}>
                          {column.render
                            ? column.render(item[column.key], item)
                            : String(item[column.key] || '')}
                        </div>
                      </td>
                      )
                    })}
                    {actions && (
                      <td className="px-4 py-3 text-sm">
                        {actions(item)}
                      </td>
                    )}
                    {/* Empty cell for table resize handle column - desktop only */}
                    <td className="hidden sm:table-cell" style={{ width: 5, padding: 0 }}></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Utility component for action buttons
export function TableActions({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Desktop view - horizontal buttons */}
      <div className="hidden sm:flex items-center space-x-1">
        {children}
      </div>
      
      {/* Mobile view - dropdown menu */}
      <div className="sm:hidden">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      </div>
    </>
  )
}