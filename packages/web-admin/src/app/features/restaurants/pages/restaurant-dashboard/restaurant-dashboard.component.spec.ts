import { importProvidersFrom } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { LucideAngularModule, Armchair, Package, Users, Utensils } from 'lucide-angular'
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
  it('muestra un enlace "Mesas" a /restaurants/:id/tables', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'restaurants/:restaurantId',
            children: [{ path: 'dashboard', component: RestaurantDashboardComponent }]
          }
        ]),
        importProvidersFrom(LucideAngularModule.pick({ Armchair, Package, Users, Utensils })),
        { provide: RestaurantStore, useValue: { getById: () => ({ id: 'rest-1', name: 'Restaurante Uno' }) } }
      ]
    })
    const harness = await RouterTestingHarness.create()
    await harness.navigateByUrl('/restaurants/rest-1/dashboard')

    const enlaces = Array.from(harness.routeNativeElement!.querySelectorAll('a'))
    const mesas = enlaces.find(a => a.textContent?.includes('Mesas'))

    expect(mesas).toBeDefined()
    expect(mesas!.getAttribute('href')).toBe('/restaurants/rest-1/tables')
  })
})
