import { useState } from 'react'
import { Search, Filter, RefreshCw, Package } from 'lucide-react'
import { useInventory, InventoryFilters } from '../hooks/useInventory'
import { InventoryTable } from '../components/inventory/InventoryTable'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select'
import { Button } from '../components/ui/button'

export default function Inventory(): JSX.Element {
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    vendor: 'all',
    category: 'all',
    stockStatus: 'all',
  })

  const { items, loading, vendors, categories, total } = useInventory(filters)

  function resetFilters(): void {
    setFilters({ search: '', vendor: 'all', category: 'all', stockStatus: 'all' })
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.vendor !== 'all' ||
    filters.category !== 'all' ||
    filters.stockStatus !== 'all'

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="shrink-0 border-b bg-white px-4 py-3 space-y-3">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand" />
            <span className="text-sm font-semibold text-charcoal-800">
              Inventory Items
            </span>
            <Badge variant="info" className="text-[10px] font-mono">
              {items.length} / {total}
            </Badge>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2 text-xs text-muted-foreground gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Reset filters
            </Button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search code or description..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-8 h-8 text-xs bg-gray-50 border-silver-300"
            />
          </div>

          {/* Vendor filter */}
          <Select value={filters.vendor} onValueChange={v => setFilters(f => ({ ...f, vendor: v }))}>
            <SelectTrigger className="h-8 text-xs w-[170px] bg-gray-50 border-silver-300">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {vendors.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category filter */}
          <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v }))}>
            <SelectTrigger className="h-8 text-xs w-[170px] bg-gray-50 border-silver-300">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock status filter */}
          <Select value={filters.stockStatus} onValueChange={v => setFilters(f => ({ ...f, stockStatus: v as InventoryFilters['stockStatus'] }))}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-gray-50 border-silver-300">
              <SelectValue placeholder="Stock status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <InventoryTable items={items} loading={loading} />
      </div>
    </div>
  )
}
