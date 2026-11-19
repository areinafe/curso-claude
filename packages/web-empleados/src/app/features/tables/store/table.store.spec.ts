import { TestBed } from '@angular/core/testing'
import { HttpErrorResponse } from '@angular/common/http'
import { of, Subject, throwError } from 'rxjs'
import { TableService } from '../services/table.service'
import { TableStore } from './table.store'
import type { Table, TableStatus } from '../models/table.model'

function mesa(id: string, number: number, status: TableStatus = 'libre'): Table {
  return {
    id,
    restaurantId: 'rest-1',
    number,
    description: null,
    capacity: 4,
    status,
    createdAt: '2026-11-19T00:00:00.000Z',
    updatedAt: '2026-11-19T00:00:00.000Z'
  }
}

describe('TableStore', () => {
  let service: { getAll: ReturnType<typeof vi.fn>; updateStatus: ReturnType<typeof vi.fn> }
  let store: TableStore

  beforeEach(() => {
    service = { getAll: vi.fn(), updateStatus: vi.fn() }
    TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
    store = TestBed.inject(TableStore)
  })

  it('loadTables rellena las mesas y gestiona loading', async () => {
    const respuesta = new Subject<Table[]>()
    service.getAll.mockReturnValue(respuesta)

    const carga = store.loadTables('rest-1')
    expect(store.loading()).toBe(true)
    respuesta.next([mesa('t1', 1), mesa('t2', 2)])
    respuesta.complete()
    await carga

    expect(service.getAll).toHaveBeenCalledWith('rest-1')
    expect(store.tables().map(t => t.id)).toEqual(['t1', 't2'])
    expect(store.loading()).toBe(false)
    expect(store.error()).toBeNull()
  })

  it('loadTables expone el error si falla la carga', async () => {
    service.getAll.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })))

    await store.loadTables('rest-1')

    expect(store.error()).toBe('No se pudieron cargar las mesas.')
    expect(store.loading()).toBe(false)
  })

  it('updateStatus sustituye la mesa por la devuelta por la API', async () => {
    service.getAll.mockReturnValue(of([mesa('t1', 1), mesa('t2', 2)]))
    await store.loadTables('rest-1')
    service.updateStatus.mockReturnValue(of(mesa('t2', 2, 'ocupada')))

    await store.updateStatus('rest-1', 't2', 'ocupada')

    expect(service.updateStatus).toHaveBeenCalledWith('rest-1', 't2', 'ocupada')
    expect(store.tables().map(t => t.status)).toEqual(['libre', 'ocupada'])
    expect(store.error()).toBeNull()
  })

  it('updateStatus expone el error por nombre de clase y no cambia la lista', async () => {
    service.getAll.mockReturnValue(of([mesa('t1', 1)]))
    await store.loadTables('rest-1')
    service.updateStatus.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 404,
      error: { error: 'TableNotFoundError', message: 'Table not found' }
    })))

    await store.updateStatus('rest-1', 't1', 'ocupada')

    expect(store.tables()[0].status).toBe('libre')
    expect(store.error()).toBe('La mesa ya no existe.')
  })
})
