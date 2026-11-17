import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { DishService } from '../services/dish.service'
import { DishStore } from './dish.store'
import type { Dish } from '../models/dish.model'

function dish(id: string, restaurantId: string): Dish {
  return {
    id,
    name: `Plato ${id}`,
    description: null,
    price: 10,
    category: 'principal',
    available: true,
    restaurantId,
    ingredients: [],
    createdAt: '',
    updatedAt: ''
  }
}

describe('DishStore', () => {
  let respuestas: Record<string, Subject<Dish[]>>
  let store: DishStore

  beforeEach(() => {
    respuestas = { 'rest-1': new Subject(), 'rest-2': new Subject() }
    TestBed.configureTestingModule({
      providers: [{ provide: DishService, useValue: { getAll: (id: string) => respuestas[id] } }]
    })
    store = TestBed.inject(DishStore)
  })

  it('descarta la respuesta obsoleta de un restaurante anterior', async () => {
    const carga1 = store.loadByRestaurant('rest-1')
    const carga2 = store.loadByRestaurant('rest-2')

    respuestas['rest-2'].next([dish('b', 'rest-2')])
    respuestas['rest-2'].complete()
    await carga2
    respuestas['rest-1'].next([dish('a', 'rest-1')])
    respuestas['rest-1'].complete()
    await carga1

    expect(store.dishes().map(d => d.id)).toEqual(['b'])
    expect(store.loading()).toBe(false)
  })

  it('vacía la lista mientras carga otro restaurante', async () => {
    const carga1 = store.loadByRestaurant('rest-1')
    respuestas['rest-1'].next([dish('a', 'rest-1')])
    respuestas['rest-1'].complete()
    await carga1
    expect(store.dishes()).toHaveLength(1)

    const carga2 = store.loadByRestaurant('rest-2')

    expect(store.dishes()).toEqual([])
    respuestas['rest-2'].next([])
    respuestas['rest-2'].complete()
    await carga2
  })
})
