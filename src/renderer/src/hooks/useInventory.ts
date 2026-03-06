import { useState, useEffect, useMemo } from 'react'
import { subscribeToInventory } from '../lib/inventory-service'
import { inventorySeed } from '../lib/inventory-seed'
import { InventoryItem } from '../types/inventory'

export interface InventoryFilters {
  search: string
  vendor: string
  category: string
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
}

export function useInventory(filters: InventoryFilters) {
  const [items, setItems] = useState<InventoryItem[]>(inventorySeed)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    try {
      const unsubscribe = subscribeToInventory((firestoreItems) => {
        if (firestoreItems.length > 0) {
          setItems(firestoreItems)
        } else {
          setItems(inventorySeed)
        }
        setLoading(false)
      })
      return unsubscribe
    } catch {
      // Firebase not configured - use seed data
      setItems(inventorySeed)
      setLoading(false)
      setError(null)
    }
  }, [])

  const filtered = useMemo(() => {
    let result = items.filter(i => i.rowType === 'item')
    const s = filters.search.toLowerCase()
    if (s) {
      result = result.filter(i =>
        i.description.toLowerCase().includes(s) ||
        i.itemCode.toLowerCase().includes(s) ||
        i.prefVendor?.toLowerCase().includes(s)
      )
    }
    if (filters.vendor && filters.vendor !== 'all') {
      result = result.filter(i => i.vendor === filters.vendor)
    }
    if (filters.category && filters.category !== 'all') {
      result = result.filter(i => i.category === filters.category)
    }
    if (filters.stockStatus !== 'all') {
      result = result.filter(i => {
        if (filters.stockStatus === 'out-of-stock') return i.onHand <= 0
        if (filters.stockStatus === 'low-stock') return i.onHand > 0 && i.reorderPt !== null && i.onHand <= i.reorderPt
        return i.onHand > 0 && (i.reorderPt === null || i.onHand > i.reorderPt)
      })
    }
    return result
  }, [items, filters])

  const vendors = useMemo(() => [...new Set(items.map(i => i.vendor))].sort(), [items])
  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))].sort(), [items])

  return { items: filtered, loading, error, vendors, categories, total: items.filter(i => i.rowType === 'item').length }
}
