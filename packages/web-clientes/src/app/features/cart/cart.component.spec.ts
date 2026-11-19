import { TestBed, ComponentFixture } from '@angular/core/testing'
import { Router, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { CartComponent } from './cart.component'
import { OrderService } from '../../core/services/order.service'
import { CartStore, Dish } from '../../core/store/cart.store'
import { Table } from '../../core/models/table.model'

const mesa: Table = {
  id: 'table-rest-1-3',
  restaurantId: 'rest-1',
  number: 3,
  description: null,
  capacity: 4,
  status: 'ocupada',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
}

const plato: Dish = {
  id: 'plato-1',
  name: 'Paella',
  description: null,
  price: 12,
  category: 'Principales',
  available: true,
  restaurantId: 'rest-1',
  ingredients: []
}

describe('CartComponent - mesa', () => {
  let fixture: ComponentFixture<CartComponent>
  let orderService: { createOrder: ReturnType<typeof vi.fn> }
  let cartStore: CartStore

  beforeEach(() => {
    orderService = { createOrder: vi.fn().mockReturnValue(of({ id: 'pedido-1' })) }
    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [provideRouter([]), { provide: OrderService, useValue: orderService }]
    })
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
    cartStore = TestBed.inject(CartStore)
    cartStore.setTable('rest-1', mesa)
    cartStore.addItem(plato, 2)
    fixture = TestBed.createComponent(CartComponent)
    fixture.detectChanges()
  })

  it('muestra la mesa en el resumen', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mesa 3')
  })

  it('confirmOrder envía el id de la mesa como tableId', () => {
    fixture.componentInstance.confirmOrder()
    expect(orderService.createOrder).toHaveBeenCalledWith(
      'rest-1',
      [{ dishId: 'plato-1', quantity: 2, notes: null }],
      'table-rest-1-3'
    )
  })
})
