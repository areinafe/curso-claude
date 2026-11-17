import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { Subject } from 'rxjs'
import { DishStore } from '../../store/dish.store'
import { DishListComponent } from './dish-list.component'

describe('DishListComponent', () => {
  it('recarga los platos al cambiar el restaurante de la ruta', () => {
    const paramMap$ = new Subject<ReturnType<typeof convertToParamMap>>()
    const store = { loadByRestaurant: vi.fn() }
    TestBed.configureTestingModule({
      providers: [
        { provide: DishStore, useValue: store },
        { provide: ActivatedRoute, useValue: { parent: { paramMap: paramMap$ } } }
      ]
    })
    TestBed.overrideComponent(DishListComponent, { set: { template: '', imports: [] } })
    const fixture = TestBed.createComponent(DishListComponent)
    fixture.detectChanges()

    paramMap$.next(convertToParamMap({ restaurantId: 'rest-1' }))
    paramMap$.next(convertToParamMap({ restaurantId: 'rest-2' }))

    expect(store.loadByRestaurant).toHaveBeenNthCalledWith(1, 'rest-1')
    expect(store.loadByRestaurant).toHaveBeenNthCalledWith(2, 'rest-2')
    expect(fixture.componentInstance.restaurantId).toBe('rest-2')
  })
})
