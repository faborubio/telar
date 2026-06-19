<script setup lang="ts" generic="TData">
// DataTable — patrón (SAD §4.2, capa 5) sobre TanStack Table (ADR-010): la LÓGICA de
// tabla (orden, filtro, paginación) es headless y probada; Telar solo renderiza con sus
// tokens y componentes. Maneja además los estados que duelen en producción: loading/empty/error.
import { ref } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import type { ColumnDef, SortingState } from '@tanstack/vue-table'
import Input from '../../components/Input/Input.vue'
import Button from '../../components/Button/Button.vue'

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData>[]
    data: TData[]
    /** Nombre accesible de la tabla (caption oculto visualmente). */
    caption: string
    loading?: boolean
    /** Mensaje de error; muestra el estado de error con botón de reintento. */
    error?: string
    pageSize?: number
    filterLabel?: string
    filterPlaceholder?: string
    emptyMessage?: string
  }>(),
  {
    loading: false,
    pageSize: 10,
    filterLabel: 'Buscar',
    filterPlaceholder: 'Filtrar…',
    emptyMessage: 'No hay resultados.',
  },
)

const emit = defineEmits<{ retry: [] }>()

const sorting = ref<SortingState>([])
const globalFilter = ref('')

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get globalFilter() {
      return globalFilter.value
    },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onGlobalFilterChange: (updater) => {
    globalFilter.value = typeof updater === 'function' ? updater(globalFilter.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: props.pageSize } },
})

function ariaSort(state: false | 'asc' | 'desc'): 'ascending' | 'descending' | 'none' {
  if (state === 'asc') return 'ascending'
  if (state === 'desc') return 'descending'
  return 'none'
}
</script>

<template>
  <div class="telar-datatable">
    <div class="telar-datatable__toolbar">
      <Input
        :model-value="globalFilter"
        :label="filterLabel"
        :placeholder="filterPlaceholder"
        type="search"
        @update:model-value="globalFilter = $event"
      />
    </div>

    <div class="telar-datatable__scroll" :aria-busy="loading">
      <table class="telar-datatable__table">
        <caption class="telar-datatable__caption">
          {{
            caption
          }}
        </caption>
        <thead>
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              scope="col"
              :aria-sort="
                header.column.getCanSort() ? ariaSort(header.column.getIsSorted()) : undefined
              "
            >
              <button
                v-if="header.column.getCanSort()"
                type="button"
                class="telar-datatable__sort"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <span class="telar-datatable__sort-icon" aria-hidden="true">
                  {{
                    header.column.getIsSorted() === 'asc'
                      ? '▲'
                      : header.column.getIsSorted() === 'desc'
                        ? '▼'
                        : '↕'
                  }}
                </span>
              </button>
              <FlexRender
                v-else
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading" class="telar-datatable__state">
            <td :colspan="columns.length">Cargando…</td>
          </tr>
          <tr v-else-if="error" class="telar-datatable__state">
            <td :colspan="columns.length">
              <span class="telar-datatable__error">{{ error }}</span>
              <Button size="sm" variant="secondary" @click="emit('retry')">Reintentar</Button>
            </td>
          </tr>
          <tr v-else-if="table.getRowModel().rows.length === 0" class="telar-datatable__state">
            <td :colspan="columns.length">{{ emptyMessage }}</td>
          </tr>
          <template v-else>
            <tr v-for="row in table.getRowModel().rows" :key="row.id">
              <td v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="telar-datatable__footer">
      <span class="telar-datatable__count">
        {{ table.getFilteredRowModel().rows.length }} resultado(s)
      </span>
      <div class="telar-datatable__pagination">
        <Button
          size="sm"
          variant="secondary"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          Anterior
        </Button>
        <span class="telar-datatable__page">
          Página {{ table.getState().pagination.pageIndex + 1 }} de
          {{ Math.max(table.getPageCount(), 1) }}
        </span>
        <Button
          size="sm"
          variant="secondary"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Siguiente
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@layer ds {
  .telar-datatable {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .telar-datatable__toolbar {
    max-width: 20rem;
  }

  .telar-datatable__scroll {
    overflow-x: auto;
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .telar-datatable__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  .telar-datatable__caption {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .telar-datatable__table :where(th, td) {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: var(--border-width-thin) solid var(--color-border);
  }

  .telar-datatable__table thead th {
    background: var(--color-bg-subtle);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
  }

  .telar-datatable__sort {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font: inherit;
    color: inherit;
    font-weight: inherit;
  }

  .telar-datatable__sort-icon {
    color: var(--color-text-subtle);
    font-size: var(--font-size-xs);
  }

  .telar-datatable__table tbody tr:hover {
    background: var(--color-bg-subtle);
  }

  .telar-datatable__state td {
    text-align: center;
    color: var(--color-text-muted);
    padding-block: var(--space-8);
  }

  .telar-datatable__error {
    color: var(--color-danger);
    margin-right: var(--space-3);
  }

  .telar-datatable__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .telar-datatable__count {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .telar-datatable__pagination {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .telar-datatable__page {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}
</style>
