import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { RestaurantMenuComponent } from './restaurant-menu.component'
import { DishService } from '../../core/services/dish.service'
import { RestaurantService } from '../../core/services/restaurant.service'
import { CartStore } from '../../core/store/cart.store'
import { Table } from '../../core/models/table.model'

const mesa = (restaurantId: string): Table => ({
  id: 'mesa-1',
  restaurantId,
  number: 1,
  description: null,
  capacity: 2,
  status: 'ocupada',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
})

describe('RestaurantMenuComponent - mesa', () => {
  let dishService: { getByRestaurant: ReturnType<typeof vi.fn> }
  let router: Router
  let cartStore: CartStore

  beforeEach(() => {
    dishService = { getByRestaurant: vi.fn().mockReturnValue(of([])) }
    TestBed.configureTestingModule({
      imports: [RestaurantMenuComponent],
      providers: [
        provideRouter([]),
        { provide: DishService, useValue: dishService },
        { provide: RestaurantService, useValue: { getById: vi.fn().mockReturnValue(of(null)) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'rest-1' }) } } }
      ]
    })
    router = TestBed.inject(Router)
    cartStore = TestBed.inject(CartStore)
    vi.spyOn(router, 'navigate').mockResolvedValue(true)
  })

  it('redirige a la selección de mesa si no hay mesa de este restaurante', () => {
    const fixture = TestBed.createComponent(RestaurantMenuComponent)
    fixture.detectChanges()
    expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'rest-1', 'table'], { replaceUrl: true })
    expect(dishService.getByRestaurant).not.toHaveBeenCalled()
  })

  it('redirige si la mesa guardada es de otro restaurante', () => {
    cartStore.setTable('rest-2', mesa('rest-2'))
    const fixture = TestBed.createComponent(RestaurantMenuComponent)
    fixture.detectChanges()
    expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'rest-1', 'table'], { replaceUrl: true })
  })

  it('carga la carta si ya hay mesa de este restaurante', () => {
    cartStore.setTable('rest-1', mesa('rest-1'))
    const fixture = TestBed.createComponent(RestaurantMenuComponent)
    fixture.detectChanges()
    expect(router.navigate).not.toHaveBeenCalled()
    expect(dishService.getByRestaurant).toHaveBeenCalledWith('rest-1')
  })
})
