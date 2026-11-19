import { TestBed } from '@angular/core/testing'
import { CartStore, Dish } from './cart.store'
import { Table } from '../models/table.model'

const mesa = (restaurantId: string, id = 'mesa-1'): Table => ({
  id,
  restaurantId,
  number: 3,
  description: null,
  capacity: 4,
  status: 'ocupada',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
})

const plato = (restaurantId: string, id = 'plato-1'): Dish => ({
  id,
  name: 'Paella',
  description: null,
  price: 12,
  category: 'Principales',
  available: true,
  restaurantId,
  ingredients: []
})

describe('CartStore - mesa', () => {
  let store: CartStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(CartStore)
  })

  it('no tiene mesa al empezar', () => {
    expect(store.table()).toBeNull()
    expect(store.hasTableFor('rest-1')).toBe(false)
  })

  it('setTable guarda la mesa del restaurante', () => {
    store.setTable('rest-1', mesa('rest-1'))
    expect(store.table()?.id).toBe('mesa-1')
    expect(store.hasTableFor('rest-1')).toBe(true)
    expect(store.hasTableFor('rest-2')).toBe(false)
  })

  it('clear() vacía el carrito pero mantiene la mesa', () => {
    store.setTable('rest-1', mesa('rest-1'))
    store.addItem(plato('rest-1'))
    store.clear()
    expect(store.items()).toEqual([])
    expect(store.table()?.id).toBe('mesa-1')
  })

  it('addItem de un plato del mismo restaurante mantiene la mesa', () => {
    store.setTable('rest-1', mesa('rest-1'))
    store.addItem(plato('rest-1'))
    expect(store.table()?.id).toBe('mesa-1')
  })

  it('addItem de un plato de otro restaurante borra la mesa', () => {
    store.setTable('rest-1', mesa('rest-1'))
    store.addItem(plato('rest-2'))
    expect(store.table()).toBeNull()
  })
})
