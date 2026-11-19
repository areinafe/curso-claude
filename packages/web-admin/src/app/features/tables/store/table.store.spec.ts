import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
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
})
