import { useState } from 'react'

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    offset: (page - 1) * pageSize,
  }
}

export function useFilters(initialFilters: Record<string, any> = {}) {
  const [filters, setFilters] = useState(initialFilters)

  const setFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
  )

  return { filters, setFilter, resetFilters, cleanFilters }
}