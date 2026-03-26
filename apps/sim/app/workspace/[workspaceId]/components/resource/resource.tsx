'use client'
import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ArrowDown, ArrowUp, Button, Checkbox, Loader, Plus, Skeleton } from '@/components/emcn'
import { cn } from '@/lib/core/utils/cn'
import type { BreadcrumbItem, CreateAction, HeaderAction } from './components/resource-header'
import { ResourceHeader } from './components/resource-header'
import type { FilterTag, SearchConfig, SortConfig } from './components/resource-options-bar'
import { ResourceOptionsBar } from './components/resource-options-bar'

export interface ResourceColumn {
  id: string
  header: string
  widthMultiplier?: number
}

export interface ResourceCell {
  icon?: ReactNode
  label?: string | null
  content?: ReactNode
}

export interface ResourceRow {
  id: string
  cells: Record<string, ResourceCell>
  sortValues?: Record<string, string | number>
}

export interface SelectableConfig {
  selectedIds: Set<string>
  onSelectRow: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  isAllSelected: boolean
  disabled?: boolean
}

export interface PaginationConfig {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface ResourceProps {
  icon: React.ElementType
  title: string
  breadcrumbs?: BreadcrumbItem[]
  create?: CreateAction
  search?: SearchConfig
  defaultSort?: string
  sort?: SortConfig
  headerActions?: HeaderAction[]
  columns: ResourceColumn[]
  rows: ResourceRow[]
  selectedRowId?: string | null
  selectable?: SelectableConfig
  onRowClick?: (rowId: string) => void
  onRowHover?: (rowId: string) => void
  onRowContextMenu?: (e: React.MouseEvent, rowId: string) => void
  isLoading?: boolean
  onContextMenu?: (e: React.MouseEvent) => void
  filter?: ReactNode
  filterTags?: FilterTag[]
  extras?: ReactNode
  pagination?: PaginationConfig
  emptyMessage?: string
  overlay?: ReactNode
}

const EMPTY_CELL_PLACEHOLDER = '-  -  -'
const SKELETON_ROW_COUNT = 5

/**
 * Shared page shell for resource list pages (tables, files, knowledge, schedules, logs).
 * Renders the header, toolbar with search, and a data table from column/row definitions.
 */
export const Resource = memo(function Resource({
  icon,
  title,
  breadcrumbs,
  create,
  search,
  defaultSort,
  sort: sortOverride,
  headerActions,
  columns,
  rows,
  selectedRowId,
  selectable,
  onRowClick,
  onRowHover,
  onRowContextMenu,
  isLoading,
  onContextMenu,
  filter,
  filterTags,
  extras,
  pagination,
  emptyMessage,
  overlay,
}: ResourceProps) {
  return (
    <div
      className='flex h-full flex-1 flex-col overflow-hidden bg-[var(--bg)]'
      onContextMenu={onContextMenu}
    >
      <ResourceHeader
        icon={icon}
        title={title}
        breadcrumbs={breadcrumbs}
        create={create}
        actions={headerActions}
      />
      <ResourceOptionsBar
        search={search}
        sort={sortOverride ?? undefined}
        filter={filter}
        filterTags={filterTags}
        extras={extras}
      />
      <ResourceTable
        columns={columns}
        rows={rows}
        defaultSort={defaultSort}
        sort={sortOverride}
        selectedRowId={selectedRowId}
        selectable={selectable}
        onRowClick={onRowClick}
        onRowHover={onRowHover}
        onRowContextMenu={onRowContextMenu}
        isLoading={isLoading}
        create={create}
        pagination={pagination}
        emptyMessage={emptyMessage}
        overlay={overlay}
      />
    </div>
  )
})

export interface ResourceTableProps {
  columns: ResourceColumn[]
  rows: ResourceRow[]
  defaultSort?: string
  sort?: SortConfig
  selectedRowId?: string | null
  selectable?: SelectableConfig
  onRowClick?: (rowId: string) => void
  onRowHover?: (rowId: string) => void
  onRowContextMenu?: (e: React.MouseEvent, rowId: string) => void
  isLoading?: boolean
  create?: CreateAction
  onLoadMore?: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  pagination?: PaginationConfig
  emptyMessage?: string
  overlay?: ReactNode
}

/**
 * Data table body extracted from Resource for independent composition.
 * Use directly when rendering a table without the Resource header/toolbar.
 */
export const ResourceTable = memo(function ResourceTable({
  columns,
  rows,
  defaultSort,
  sort: externalSort,
  selectedRowId,
  selectable,
  onRowClick,
  onRowHover,
  onRowContextMenu,
  isLoading,
  create,
  onLoadMore,
  hasMore,
  isLoadingMore,
  pagination,
  emptyMessage,
  overlay,
}: ResourceTableProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const sortEnabled = defaultSort != null
  const [internalSort, setInternalSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({
    column: defaultSort ?? '',
    direction: 'desc',
  })

  const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  const handleSort = useCallback((column: string, direction: 'asc' | 'desc') => {
    setInternalSort({ column, direction })
  }, [])

  const displayRows = useMemo(() => {
    if (!sortEnabled || externalSort) return rows
    return [...rows].sort((a, b) => {
      const col = internalSort.column
      const aVal = a.sortValues?.[col] ?? a.cells[col]?.label ?? ''
      const bVal = b.sortValues?.[col] ?? b.cells[col]?.label ?? ''
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal))
      return internalSort.direction === 'asc' ? -cmp : cmp
    })
  }, [rows, internalSort, sortEnabled, externalSort])

  useEffect(() => {
    if (!onLoadMore || !hasMore) return
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore])

  const hasCheckbox = selectable != null
  const totalColSpan = columns.length + (hasCheckbox ? 1 : 0)

  const onRowClickRef = useRef(onRowClick)
  onRowClickRef.current = onRowClick
  const onRowHoverRef = useRef(onRowHover)
  onRowHoverRef.current = onRowHover
  const onRowContextMenuRef = useRef(onRowContextMenu)
  onRowContextMenuRef.current = onRowContextMenu
  const selectableRef = useRef(selectable)
  selectableRef.current = selectable

  const handleRowClick = useCallback((rowId: string) => {
    onRowClickRef.current?.(rowId)
  }, [])

  const handleRowHover = useCallback((rowId: string) => {
    onRowHoverRef.current?.(rowId)
  }, [])

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowId: string) => {
    onRowContextMenuRef.current?.(e, rowId)
  }, [])

  const handleSelectRow = useCallback((rowId: string, checked: boolean) => {
    selectableRef.current?.onSelectRow(rowId, checked)
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    selectableRef.current?.onSelectAll(checked)
  }, [])

  if (isLoading) {
    return (
      <MemoizedDataTableSkeleton
        columns={columns}
        rowCount={SKELETON_ROW_COUNT}
        hasCheckbox={hasCheckbox}
      />
    )
  }

  if (rows.length === 0 && emptyMessage) {
    return (
      <div className='flex min-h-0 flex-1 items-center justify-center'>
        <span className='text-[13px] text-[var(--text-secondary)]'>{emptyMessage}</span>
      </div>
    )
  }

  return (
    <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
      <div ref={headerRef} className='overflow-hidden'>
        <table className='w-full table-fixed text-[13px]'>
          <MemoizedColGroup columns={columns} hasCheckbox={hasCheckbox} />
          <MemoizedTableHeader
            columns={columns}
            hasCheckbox={hasCheckbox}
            sortEnabled={sortEnabled}
            sortColumn={internalSort.column}
            sortDirection={internalSort.direction}
            onSort={handleSort}
            isAllSelected={selectable?.isAllSelected ?? false}
            onSelectAll={handleSelectAll}
            selectableDisabled={selectable?.disabled}
          />
        </table>
      </div>
      <div className='min-h-0 flex-1 overflow-auto' onScroll={handleBodyScroll}>
        <table className='w-full table-fixed text-[13px]'>
          <MemoizedColGroup columns={columns} hasCheckbox={hasCheckbox} />
          <tbody>
            {displayRows.map((row) => (
              <MemoizedRow
                key={row.id}
                row={row}
                columns={columns}
                isSelectedById={selectedRowId === row.id}
                isChecked={selectable?.selectedIds.has(row.id) ?? false}
                hasCheckbox={hasCheckbox}
                hasClickHandler={onRowClick != null}
                hasHoverHandler={onRowHover != null}
                selectableDisabled={selectable?.disabled}
                onRowClick={handleRowClick}
                onRowHover={handleRowHover}
                onRowContextMenu={handleRowContextMenu}
                onSelectRow={handleSelectRow}
              />
            ))}
            {create && (
              <MemoizedCreateRow
                label={create.label}
                disabled={create.disabled}
                onClick={create.onClick}
                colSpan={totalColSpan}
              />
            )}
          </tbody>
        </table>
        {hasMore && (
          <div ref={loadMoreRef} className='flex items-center justify-center py-[12px]'>
            {isLoadingMore && (
              <Loader className='h-[16px] w-[16px] text-[var(--text-secondary)]' animate />
            )}
          </div>
        )}
      </div>
      {overlay}
      {pagination && pagination.totalPages > 1 && (
        <MemoizedPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
})

interface MemoizedTableHeaderProps {
  columns: ResourceColumn[]
  hasCheckbox: boolean
  sortEnabled: boolean
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: string, direction: 'asc' | 'desc') => void
  isAllSelected: boolean
  onSelectAll: (checked: boolean) => void
  selectableDisabled?: boolean
}

const MemoizedTableHeader = memo(
  function TableHeader({
    columns,
    hasCheckbox,
    sortEnabled,
    sortColumn,
    sortDirection,
    onSort,
    isAllSelected,
    onSelectAll,
    selectableDisabled,
  }: MemoizedTableHeaderProps) {
    const handleSelectAllChange = useCallback(
      (checked: boolean | 'indeterminate') => {
        onSelectAll(checked as boolean)
      },
      [onSelectAll]
    )

    return (
      <thead className='shadow-[inset_0_-1px_0_var(--border)]'>
        <tr>
          {hasCheckbox && (
            <th className='h-10 w-[52px] py-[6px] pr-0 pl-[20px] text-left align-middle'>
              <Checkbox
                size='sm'
                checked={isAllSelected}
                onCheckedChange={handleSelectAllChange}
                disabled={selectableDisabled}
                aria-label='Select all'
              />
            </th>
          )}
          {columns.map((col) => {
            if (!sortEnabled) {
              return (
                <th
                  key={col.id}
                  className='h-10 px-[24px] py-[6px] text-left align-middle font-base text-[12px] text-[var(--text-muted)]'
                >
                  {col.header}
                </th>
              )
            }
            const isActive = sortColumn === col.id
            const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown
            return (
              <th key={col.id} className='h-10 px-[16px] py-[6px] text-left align-middle'>
                <Button
                  variant='subtle'
                  className='px-[8px] py-[4px] font-base text-[var(--text-muted)] hover:text-[var(--text-muted)]'
                  onClick={() =>
                    onSort(col.id, isActive ? (sortDirection === 'desc' ? 'asc' : 'desc') : 'desc')
                  }
                >
                  {col.header}
                  {isActive && (
                    <SortIcon className='ml-[4px] h-[12px] w-[12px] text-[var(--text-icon)]' />
                  )}
                </Button>
              </th>
            )
          })}
        </tr>
      </thead>
    )
  },
  (prev, next) =>
    prev.columns === next.columns &&
    prev.hasCheckbox === next.hasCheckbox &&
    prev.sortEnabled === next.sortEnabled &&
    prev.sortColumn === next.sortColumn &&
    prev.sortDirection === next.sortDirection &&
    prev.onSort === next.onSort &&
    prev.isAllSelected === next.isAllSelected &&
    prev.onSelectAll === next.onSelectAll &&
    prev.selectableDisabled === next.selectableDisabled
)

interface MemoizedRowProps {
  row: ResourceRow
  columns: ResourceColumn[]
  isSelectedById: boolean
  isChecked: boolean
  hasCheckbox: boolean
  hasClickHandler: boolean
  hasHoverHandler: boolean
  selectableDisabled?: boolean
  onRowClick: (rowId: string) => void
  onRowHover: (rowId: string) => void
  onRowContextMenu: (e: React.MouseEvent, rowId: string) => void
  onSelectRow: (rowId: string, checked: boolean) => void
}

const MemoizedRow = memo(
  function MemoizedRow({
    row,
    columns,
    isSelectedById,
    isChecked,
    hasCheckbox,
    hasClickHandler,
    hasHoverHandler,
    selectableDisabled,
    onRowClick,
    onRowHover,
    onRowContextMenu,
    onSelectRow,
  }: MemoizedRowProps) {
    const handleClick = useCallback(() => {
      onRowClick(row.id)
    }, [onRowClick, row.id])

    const handleHover = useCallback(() => {
      onRowHover(row.id)
    }, [onRowHover, row.id])

    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        onRowContextMenu(e, row.id)
      },
      [onRowContextMenu, row.id]
    )

    const handleSelect = useCallback(
      (checked: boolean | 'indeterminate') => {
        onSelectRow(row.id, checked as boolean)
      },
      [onSelectRow, row.id]
    )

    const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
    }, [])

    return (
      <tr
        data-resource-row
        data-row-id={row.id}
        className={cn(
          'transition-colors hover:bg-[var(--surface-3)]',
          hasClickHandler && 'cursor-pointer',
          (isSelectedById || isChecked) && 'bg-[var(--surface-3)]'
        )}
        onClick={hasClickHandler ? handleClick : undefined}
        onMouseEnter={hasHoverHandler ? handleHover : undefined}
        onContextMenu={handleContextMenu}
      >
        {hasCheckbox && (
          <td className='w-[52px] py-[10px] pr-0 pl-[20px] align-middle'>
            <Checkbox
              size='sm'
              checked={isChecked}
              onCheckedChange={handleSelect}
              disabled={selectableDisabled}
              aria-label='Select row'
              onClick={handleCheckboxClick}
            />
          </td>
        )}
        {columns.map((col, colIdx) => {
          const cell = row.cells[col.id]
          return (
            <td key={col.id} className='px-[24px] py-[10px] align-middle'>
              <MemoizedCellContent cell={cell} primary={colIdx === 0} />
            </td>
          )
        })}
      </tr>
    )
  },
  (prev, next) =>
    prev.row === next.row &&
    prev.columns === next.columns &&
    prev.isSelectedById === next.isSelectedById &&
    prev.isChecked === next.isChecked &&
    prev.hasCheckbox === next.hasCheckbox &&
    prev.hasClickHandler === next.hasClickHandler &&
    prev.hasHoverHandler === next.hasHoverHandler &&
    prev.selectableDisabled === next.selectableDisabled &&
    prev.onRowClick === next.onRowClick &&
    prev.onRowHover === next.onRowHover &&
    prev.onRowContextMenu === next.onRowContextMenu &&
    prev.onSelectRow === next.onSelectRow
)

const MemoizedCellContent = memo(
  function CellContent({ cell, primary }: { cell: ResourceCell | undefined; primary?: boolean }) {
    if (cell?.content) return <>{cell.content}</>
    const label = cell?.label || EMPTY_CELL_PLACEHOLDER
    return (
      <span
        className={cn(
          'flex min-w-0 items-center gap-[12px] font-medium text-[14px]',
          primary ? 'text-[var(--text-body)]' : 'text-[var(--text-secondary)]'
        )}
      >
        {cell?.icon && <span className='flex-shrink-0 text-[var(--text-icon)]'>{cell.icon}</span>}
        <span className='truncate'>{label}</span>
      </span>
    )
  },
  (prev, next) => prev.cell === next.cell && prev.primary === next.primary
)

const MemoizedColGroup = memo(function ResourceColGroup({
  columns,
  hasCheckbox,
}: {
  columns: ResourceColumn[]
  hasCheckbox?: boolean
}) {
  return (
    <colgroup>
      {hasCheckbox && <col className='w-[52px]' />}
      {columns.map((col, colIdx) => (
        <col
          key={col.id}
          style={
            colIdx === 0
              ? { minWidth: 200 * (col.widthMultiplier ?? 1) }
              : { width: 160 * (col.widthMultiplier ?? 1) }
          }
        />
      ))}
    </colgroup>
  )
})

const MemoizedPagination = memo(function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className='flex items-center justify-center border-[var(--border)] border-t bg-[var(--bg)] px-4 py-[10px]'>
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </Button>
        <div className='mx-[12px] flex items-center gap-[16px]'>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let page: number
            if (totalPages <= 5) {
              page = i + 1
            } else if (currentPage <= 3) {
              page = i + 1
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i
            } else {
              page = currentPage - 2 + i
            }
            if (page < 1 || page > totalPages) return null
            return (
              <button
                key={page}
                type='button'
                onClick={() => onPageChange(page)}
                className={cn(
                  'font-medium text-sm transition-colors hover:text-[var(--text-body)]',
                  page === currentPage ? 'text-[var(--text-body)]' : 'text-[var(--text-secondary)]'
                )}
              >
                {page}
              </button>
            )
          })}
        </div>
        <Button
          variant='ghost'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
})

const MemoizedCreateRow = memo(
  function CreateRow({
    label,
    disabled,
    onClick,
    colSpan,
  }: {
    label: string
    disabled?: boolean
    onClick: () => void
    colSpan: number
  }) {
    return (
      <tr
        className={cn(
          'transition-colors',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--surface-3)]'
        )}
        onClick={disabled ? undefined : onClick}
      >
        <td colSpan={colSpan} className='px-[24px] py-[10px] align-middle'>
          <span className='flex items-center gap-[12px] font-medium text-[14px] text-[var(--text-secondary)]'>
            <Plus className='h-[14px] w-[14px] text-[var(--text-subtle)]' />
            {label}
          </span>
        </td>
      </tr>
    )
  },
  (prev, next) =>
    prev.label === next.label &&
    prev.disabled === next.disabled &&
    prev.onClick === next.onClick &&
    prev.colSpan === next.colSpan
)

const MemoizedDataTableSkeleton = memo(function DataTableSkeleton({
  columns,
  rowCount,
  hasCheckbox,
}: {
  columns: ResourceColumn[]
  rowCount: number
  hasCheckbox?: boolean
}) {
  return (
    <>
      <div className='overflow-hidden'>
        <table className='w-full table-fixed text-[13px]'>
          <MemoizedColGroup columns={columns} hasCheckbox={hasCheckbox} />
          <thead className='shadow-[inset_0_-1px_0_var(--border)]'>
            <tr>
              {hasCheckbox && (
                <th className='h-10 w-[52px] py-[10px] pr-0 pl-[20px] text-left align-middle'>
                  <Skeleton className='h-[14px] w-[14px] rounded-[2px]' />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className='h-10 px-[24px] py-[10px] text-left align-middle font-base text-[var(--text-muted)]'
                >
                  <div className='flex min-h-[20px] items-center'>
                    <Skeleton className='h-[12px] w-[56px]' />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>
      <div className='min-h-0 flex-1 overflow-auto'>
        <table className='w-full table-fixed text-[13px]'>
          <MemoizedColGroup columns={columns} hasCheckbox={hasCheckbox} />
          <tbody>
            {Array.from({ length: rowCount }, (_, i) => (
              <tr key={i}>
                {hasCheckbox && (
                  <td className='w-[52px] py-[10px] pr-0 pl-[20px] align-middle'>
                    <Skeleton className='h-[14px] w-[14px] rounded-[2px]' />
                  </td>
                )}
                {columns.map((col, colIdx) => (
                  <td key={col.id} className='px-[24px] py-[10px] align-middle'>
                    <span className='flex min-h-[21px] items-center gap-[12px]'>
                      {colIdx === 0 && <Skeleton className='h-[14px] w-[14px] rounded-[2px]' />}
                      <Skeleton className='h-[14px] w-[128px]' />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
})
