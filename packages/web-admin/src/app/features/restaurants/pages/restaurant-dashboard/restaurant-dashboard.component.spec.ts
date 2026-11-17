import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { BehaviorSubject } from 'rxjs'
import { RestaurantStore } from '../../store/restaurant.store'
import { RestaurantDashboardComponent } from './restaurant-dashboard.component'

describe('RestaurantDashboardComponent', () => {
  it('actualiza el nombre al cambiar el restaurante de la ruta', () => {
    const paramMap$ = new BehaviorSubject(convertToParamMap({ restaurantId: 'rest-1' }))
    const restaurantes = [
      { id: 'rest-1', name: 'Restaurante Uno' },
      { id: 'rest-2', name: 'Restaurante Dos' }
    ]
    const store = { getById: (id: string) => restaurantes.find(r => r.id === id) }
    TestBed.configureTestingModule({
      providers: [
        { provide: RestaurantStore, useValue: store },
        { provide: ActivatedRoute, useValue: { parent: { paramMap: paramMap$ } } }
      ]
    })
    TestBed.overrideComponent(RestaurantDashboardComponent, { set: { template: '', imports: [] } })
    const component = TestBed.createComponent(RestaurantDashboardComponent).componentInstance
    component.ngOnInit()
    expect(component.restaurantName()).toBe('Restaurante Uno')

    paramMap$.next(convertToParamMap({ restaurantId: 'rest-2' }))

    expect(component.restaurantName()).toBe('Restaurante Dos')
  })
})
