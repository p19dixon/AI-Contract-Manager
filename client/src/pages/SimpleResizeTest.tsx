import { Layout } from '../components/layout/Layout'
import { SimpleResizableTable } from '../components/ui/simple-resizable-table'

export function SimpleResizeTest() {
  const columns = [
    { key: 'id', header: 'ID', width: 100 },
    { key: 'name', header: 'Name', width: 200 },
    { key: 'email', header: 'Email', width: 250 },
    { key: 'status', header: 'Status', width: 150 },
    { key: 'amount', header: 'Amount', width: 150 }
  ]

  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', amount: '$1,000' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', amount: '$2,500' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active', amount: '$750' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', status: 'Inactive', amount: '$3,200' }
  ]

  return (
    <Layout title="Simple Resize Test" description="Testing a minimal resizable table implementation">
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>This is a simplified implementation with minimal code</li>
            <li>Drag the gray lines between columns to resize</li>
            <li>Columns can shrink to 20px minimum</li>
            <li>The last column doesn't have a resize handle (common pattern)</li>
          </ul>
        </div>

        <SimpleResizableTable columns={columns} data={data} />

        <div className="mt-8">
          <h3 className="font-semibold mb-2">Implementation Notes:</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
{`// Key differences in this implementation:
1. Stores column widths in component state
2. Uses simple mouse event tracking
3. Updates width directly on mouse move
4. No complex refs or callbacks
5. Minimal CSS - just width styles`}
          </pre>
        </div>
      </div>
    </Layout>
  )
}