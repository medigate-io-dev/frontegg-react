import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { FeTableColumnOptions, FeTableColumnProps, TableProps } from './interfaces';
import {
  useTable,
  useFilters,
  useSortBy,
  TableState,
  UseTableOptions,
  UseFiltersOptions,
  UseFiltersState,
  UseSortByOptions,
  UseSortByState,
  TableSortByToggleProps,
  useExpanded,
  UseExpandedOptions,
  Cell,
  UseExpandedRowProps,
  Row,
  Column,
  useFlexLayout,
  usePagination,
  PluginHook,
  UsePaginationOptions,
  UsePaginationState,
  UsePaginationInstanceProps,
  UseTableInstanceProps,
  TableInstance,
  useRowSelect,
  UseRowSelectRowProps,
  UseRowSelectOptions,
  UseRowSelectInstanceProps,
  UseRowSelectState,
} from 'react-table';

import './FeTable.scss';
import classNames from 'classnames';
import { FeTableFilterColumn } from './FeTableFilterColumn';
import { FeTableSortColumn } from './FeTableSortColumn';
import { FeButton } from '../Button/FeButton';
import { FeIcon } from '../Icon/FeIcon';
import { FeTableTHead } from './FeTableTHead';
import { FeTableTBody } from './FeTableTBody';
import { FeTablePagination } from './FeTablePagination';
import { FeTableToolbar } from './FeTableToolbar';
import { FeCheckbox } from '../Checkbox/FeCheckbox';

export const FeTable: FC<TableProps> = <T extends object>(props: TableProps<T>) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(() => {
    const columns = props.columns.map(
      ({ sortable, Filter, ...rest }) =>
        ({
          ...rest,
          disableSortBy: !sortable,
          disableFilters: !Filter,
          Filter,
        } as FeTableColumnOptions<T>)
    );
    if (props.expandable) {
      columns.unshift({
        id: 'fe-expander',
        minWidth: 60,
        maxWidth: '60px' as any,
        Cell: (cell: Cell<T>) => {
          const row = cell.row as Row<T> & UseExpandedRowProps<T>;
          return (
            <FeButton
              className={classNames('fe-table__expand-button', { 'is-expanded': row.isExpanded })}
              {...row.getToggleRowExpandedProps()}
              variant={row.isExpanded ? 'primary' : undefined}
            >
              <FeIcon name='right-arrow' />
            </FeButton>
          );
        },
      });
    }
    if (props.selection) {
      columns.unshift({
        id: 'fe-selection',
        minWidth: 60,
        maxWidth: '60px' as any,
        Cell: (cell: Cell<T>) => {
          const row = cell.row as Row<T> & UseRowSelectRowProps<T>;
          return (
            <FeCheckbox
              {...row.getToggleRowSelectedProps()}
              checked={row.isSelected}
              onChange={(e) => onRowSelected(row.original, e.target.checked)}
            />
          );
        },
      });
    }
    return columns as Column<T>[];
  }, [props.columns, props.expandable]);

  const tableHooks: PluginHook<T>[] = [useFilters, useSortBy];
  if (props.expandable) {
    tableHooks.push(useExpanded);
  }
  if (props.pagination) {
    tableHooks.push(usePagination);
  }
  if (props.selection) {
    tableHooks.push(useRowSelect);
  }
  tableHooks.push(useFlexLayout);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,

    // The page controls ;)
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,

    // select props
    toggleAllRowsSelected,
    isAllRowsSelected,
    selectedFlatRows,
    toggleRowSelected,
  } = useTable(
    {
      columns,
      data: props.data,
      getRowId: (row: any) => row[props.rowKey],
      manualSortBy: !!props.onSortChange,
      manualFilters: !!props.onFilterChange,
      manualPagination: !!props.onPageChange,
      manualRowSelectedKey: props.rowKey,
      pageCount: props.pageCount ?? 0,
      useControlledState: (state1: any) =>
        ({
          ...state1,
          sortBy: props.sortBy ?? state1.sortBy,
          filters: props.filters ?? state1.filters,
          selectedRowIds: props.selectedRowIds ?? state1.selectedRowIds,
        } as TableState<T> & UseFiltersState<T> & UseSortByState<T> & UseRowSelectState<T>),
      expandSubRows: false,
      initialState: {
        pageIndex: 0,
        pageSize: props.pageSize ?? 0,
        selectedRowIds: props.selectedRowIds || {},
      },
    } as UseTableOptions<T> &
      UseFiltersOptions<T> &
      UseSortByOptions<T> &
      UseExpandedOptions<T> &
      UseRowSelectOptions<T> &
      UsePaginationOptions<T>,
    ...tableHooks
  ) as TableInstance<T> & UseTableInstanceProps<T> & UsePaginationInstanceProps<T> & UseRowSelectInstanceProps<T>;

  if (props.expandable && !props.renderExpandedComponent) {
    throw Error('FeTable: you must provide renderExpandedComponent property if the table is expandable');
  }
  if (props.hasOwnProperty('sortBy') && !props.onSortChange) {
    throw Error('FeTable: you must provide onSortChange property if sortBy is controlled');
  }
  if (props.hasOwnProperty('filters') && !props.onFilterChange) {
    throw Error('FeTable: you must provide onFilterChange property if filters is controlled');
  }
  if (props.hasOwnProperty('pagination') && !props.pageSize) {
    throw Error('FeTable: you must provide pageSize property if pagination enabled');
  }
  if (props.hasOwnProperty('onPageChange') && !props.pageCount) {
    throw Error('FeTable: you must provide pageCount property if onPageChange is controlled');
  }

  const tableState = state as UseSortByState<T> & UseFiltersState<T> & UsePaginationState<T> & UseRowSelectState<T>;

  const onSortChange = useCallback(
    (column: FeTableColumnProps<T>) => {
      if (props.hasOwnProperty('sortBy')) {
        const sortBy = props.isMultiSort ? tableState.sortBy.filter(({ id }) => id !== column.id) : [];
        if (!column.isSorted) {
          sortBy.push({ id: column.id, desc: false });
        } else if (!column.isSortedDesc) {
          sortBy.push({ id: column.id, desc: true });
        }
        props.onSortChange?.(sortBy);
      } else {
        if (column.isSorted && column.isSortedDesc) {
          column.clearSortBy();
        } else {
          column.toggleSortBy(column.isSorted, props.isMultiSort ?? false);
        }
      }
    },
    [props.onSortChange]
  );

  const onFilterChange = useCallback(
    (column: FeTableColumnProps<T>, filterValue?: any) => {
      if (props.hasOwnProperty('filters')) {
        const filters = tableState.filters.filter(({ id }) => id !== column.id);
        if (filterValue != null) {
          filters.push({ id: column.id, value: filterValue });
        }
        props.onFilterChange?.(filters);
      } else {
        column.setFilter(filterValue);
      }
    },
    [props.onFilterChange]
  );

  const onToggleAllRowsSelected = useCallback(
    (value: boolean) => {
      if (props.hasOwnProperty('selectedRowIds')) {
        const selectedIds = props.data.reduce((p, n: any) => ({ ...p, [n[props.rowKey]]: true }), {});
        props.onRowSelected?.(value ? selectedIds : {});
      } else {
        toggleAllRowsSelected(value);
      }
    },
    [props.onRowSelected]
  );

  const onRowSelected = useCallback(
    (row: any, value: boolean) => {
      const id = row[props.rowKey];
      if (props.hasOwnProperty('selectedRowIds')) {
        const newSelectedRows: any = { ...props.selectedRowIds };
        if (value) {
          newSelectedRows[id] = true;
        } else {
          delete newSelectedRows[id];
        }
        props.onRowSelected?.(newSelectedRows);
      } else {
        toggleRowSelected(id, value);
      }
    },
    [props.onRowSelected]
  );

  useEffect(() => {
    !props.hasOwnProperty('sortBy') && props.onSortChange?.(tableState.sortBy);
  }, [props.sortBy, tableState.sortBy]);

  useEffect(() => {
    !props.hasOwnProperty('filters') && props.onFilterChange?.(tableState.filters);
  }, [props.filters, tableState.filters]);

  useEffect(() => {
    tableRef.current?.querySelector('.fe-table__tbody')?.scroll?.({ top: 0, left: 0, behavior: 'smooth' });
    props.onPageChange?.(tableState.pageSize, tableState.pageIndex);
  }, [tableState.pageIndex]);

  useEffect(() => {
    !props.hasOwnProperty('selectedRowIds') && props.onRowSelected?.(tableState.selectedRowIds as any);
  }, [tableState.selectedRowIds]);

  return (
    <div className='fe-table__container'>
      <div ref={tableRef} className='fe-table' {...getTableProps()}>
        {props.toolbar && <FeTableToolbar />}
        <FeTableTHead
          headerGroups={headerGroups}
          onSortChange={onSortChange}
          onFilterChange={onFilterChange}
          toggleAllRowsSelected={onToggleAllRowsSelected}
          isAllRowsSelected={isAllRowsSelected}
          selectedFlatRows={selectedFlatRows}
        />
        <FeTableTBody
          getTableBodyProps={getTableBodyProps}
          prepareRow={prepareRow}
          rows={(props.pagination ? page : rows) as (Row<T> & UseExpandedRowProps<T>)[]}
          renderExpandedComponent={props.renderExpandedComponent}
        />

        {props.pagination === 'pages' && (
          <FeTablePagination
            pageIndex={tableState.pageIndex}
            pageSize={tableState.pageSize}
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            pageOptions={pageOptions}
            pageCount={pageCount}
            gotoPage={gotoPage}
            nextPage={nextPage}
            previousPage={previousPage}
            setPageSize={setPageSize}
          />
        )}
      </div>
    </div>
  );
};