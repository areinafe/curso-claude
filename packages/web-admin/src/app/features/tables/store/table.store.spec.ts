import { TestBed } from '@angular/core/testing'
import { of, Subject, throwError } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { TableService } from '../services/table.service'
import { TableStore } from './table.store'
import type { Table } from '../models/table.model'

function mesa(id: string, restaurantId: string, number = 1): Table {
  return {
    id,
    restaurantId,
    number,
    description: null,
    capacity: 4,
    status: 'libre',
    createdAt: '',
    updatedAt: ''
  }
}

describe('TableStore', () => {
  describe('loadByRestaurant', () => {
    let respuestas: Record<string, Subject<Table[]>>
    let store: TableStore

    beforeEach(() => {
      respuestas = { 'rest-1': new Subject(), 'rest-2': new Subject() }
      TestBed.configureTestingModule({
        providers: [{ provide: TableService, useValue: { getAll: (id: string) => respuestas[id] } }]
      })
      store = TestBed.inject(TableStore)
    })

    it('carga las mesas y gestiona loading', async () => {
      const carga = store.loadByRestaurant('rest-1')
      expect(store.loading()).toBe(true)

      respuestas['rest-1'].next([mesa('a', 'rest-1')])
      respuestas['rest-1'].complete()
      await carga

      expect(store.tables().map(t => t.id)).toEqual(['a'])
      expect(store.loading()).toBe(false)
      expect(store.error()).toBeNull()
    })

    it('expone un error si falla la carga', async () => {
      const carga = store.loadByRestaurant('rest-1')
      respuestas['rest-1'].error(new Error('fallo'))
      await carga

      expect(store.error()).toBe('No se pudieron cargar las mesas.')
      expect(store.loading()).toBe(false)
    })

    it('descarta la respuesta obsoleta de un restaurante anterior', async () => {
      const carga1 = store.loadByRestaurant('rest-1')
      const carga2 = store.loadByRestaurant('rest-2')

      respuestas['rest-2'].next([mesa('b', 'rest-2')])
      respuestas['rest-2'].complete()
      await carga2
      respuestas['rest-1'].next([mesa('a', 'rest-1')])
      respuestas['rest-1'].complete()
      await carga1

      expect(store.tables().map(t => t.id)).toEqual(['b'])
      expect(store.loading()).toBe(false)
    })

    it('vacía la lista mientras carga otro restaurante', async () => {
      const carga1 = store.loadByRestaurant('rest-1')
      respuestas['rest-1'].next([mesa('a', 'rest-1')])
      respuestas['rest-1'].complete()
      await carga1
      expect(store.tables()).toHaveLength(1)

      const carga2 = store.loadByRestaurant('rest-2')

      expect(store.tables()).toEqual([])
      respuestas['rest-2'].next([])
      respuestas['rest-2'].complete()
      await carga2
    })
  })
  describe('create/update/delete', () => {
    let service: { getAll: ReturnType<typeof vi.fn>, create: ReturnType<typeof vi.fn>, update: ReturnType<typeof vi.fn>, delete: ReturnType<typeof vi.fn> }
    let store: TableStore

    const errorApi = (error: string, message = 'msg') =>
      throwError(() => new HttpErrorResponse({ status: 400, error: { error, message } }))

    beforeEach(async () => {
      service = {
        getAll: vi.fn(() => of([mesa('a', 'rest-1', 1), mesa('b', 'rest-1', 2)])),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
      TestBed.configureTestingModule({ providers: [{ provide: TableService, useValue: service }] })
      store = TestBed.inject(TableStore)
      await store.loadByRestaurant('rest-1')
    })

    it('create añade la mesa a la lista', async () => {
      const dto = { number: 3, capacity: 2 }
      service.create.mockReturnValue(of(mesa('c', 'rest-1', 3)))

      await store.create('rest-1', dto)

      expect(service.create).toHaveBeenCalledWith('rest-1', dto)
      expect(store.tables().map(t => t.id)).toEqual(['a', 'b', 'c'])
      expect(store.error()).toBeNull()
    })

    it('update reemplaza la mesa en la lista', async () => {
      const actualizada = { ...mesa('a', 'rest-1', 10), capacity: 6 }
      service.update.mockReturnValue(of(actualizada))

      await store.update('rest-1', 'a', { number: 10, capacity: 6 })

      expect(store.tables()[0]).toEqual(actualizada)
      expect(store.tables()).toHaveLength(2)
    })

    it('delete quita la mesa de la lista', async () => {
      service.delete.mockReturnValue(of(undefined))

      await store.delete('rest-1', 'a')

      expect(store.tables().map(t => t.id)).toEqual(['b'])
    })

    it('traduce DuplicatedTableNumberError a un mensaje en español y relanza el error', async () => {
      service.create.mockReturnValue(errorApi('DuplicatedTableNumberError', 'Table number already exists'))

      await expect(store.create('rest-1', { number: 1, capacity: 2 })).rejects.toBeTruthy()

      expect(store.error()).toBe('Ya existe una mesa con ese número en este restaurante.')
      expect(store.tables()).toHaveLength(2)
    })

    it('expone un mensaje genérico para otros errores al guardar', async () => {
      service.update.mockReturnValue(errorApi('InvalidTableCapacityError'))

      await expect(store.update('rest-1', 'a', { number: 1, capacity: 0 })).rejects.toBeTruthy()

      expect(store.error()).toBe('Error al guardar la mesa.')
    })

    it('expone un error si falla el borrado', async () => {
      service.delete.mockReturnValue(errorApi('TableNotFoundError'))

      await expect(store.delete('rest-1', 'a')).rejects.toBeTruthy()

      expect(store.error()).toBe('Error al eliminar la mesa.')
      expect(store.tables()).toHaveLength(2)
    })
  })
})
