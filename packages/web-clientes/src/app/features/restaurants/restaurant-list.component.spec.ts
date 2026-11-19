import { importProvidersFrom } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { LucideAngularModule, Utensils } from 'lucide-angular'
import { provideRouter } from '@angular/router'
import { of } from 'rxjs'
import { RestaurantListComponent } from './restaurant-list.component'
import { RestaurantService } from '../../core/services/restaurant.service'

describe('RestaurantListComponent', () => {
  it('enlaza cada restaurante con la selección de mesa', () => {
    TestBed.configureTestingModule({
      imports: [RestaurantListComponent],
      providers: [
        provideRouter([]),
        importProvidersFrom(LucideAngularModule.pick({ Utensils })),
        {
          provide: RestaurantService,
          useValue: { getAll: vi.fn().mockReturnValue(of([{ id: 'rest-1', name: 'Casa Pepe', address: 'C/ Mayor 1', phone: '600000000', logoUrl: null }])) }
        }
      ]
    })
    const fixture = TestBed.createComponent(RestaurantListComponent)
    fixture.detectChanges()
    const link = (fixture.nativeElement as HTMLElement).querySelector('a.restaurant-card')
    expect(link?.getAttribute('href')).toBe('/restaurants/rest-1/table')
  })
})
