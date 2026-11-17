import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { IngredientService } from '../services/ingredient.service'
import { IngredientStore } from './ingredient.store'
import type { Ingredient } from '../models/ingredient.model'

function ingredient(id: string, restaurantId: string): Ingredient {
  return {
    id,
    name: `Ingrediente ${id}`,
    unit: 'kg',
    currentStock: 1,
    restaurantId,
    createdAt: '',
    updatedAt: ''
  }
}

describe('IngredientStore', () => {
  let respuestas: Record<string, Subject<Ingredient[]>>
  let store: IngredientStore

  beforeEach(() => {
    respuestas = { 'rest-1': new Subject(), 'rest-2': new Subject() }
    TestBed.configureTestingModule({
      providers: [{ provide: IngredientService, useValue: { getAll: (id: string) => respuestas[id] } }]
    })
    store = TestBed.inject(IngredientStore)
  })

  it('descarta la respuesta obsoleta de un restaurante anterior', async () => {
    const carga1 = store.loadByRestaurant('rest-1')
    const carga2 = store.loadByRestaurant('rest-2')

    respuestas['rest-2'].next([ingredient('b', 'rest-2')])
    respuestas['rest-2'].complete()
    await carga2
    respuestas['rest-1'].next([ingredient('a', 'rest-1')])
    respuestas['rest-1'].complete()
    await carga1

    expect(store.ingredients().map(i => i.id)).toEqual(['b'])
    expect(store.loading()).toBe(false)
  })
})
