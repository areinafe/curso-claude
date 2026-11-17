import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { Subject } from 'rxjs'
import { EmployeeStore } from '../../store/employee.store'
import { EmployeeListComponent } from './employee-list.component'

describe('EmployeeListComponent', () => {
  it('recarga los empleados al cambiar el restaurante de la ruta', () => {
    const paramMap$ = new Subject<ReturnType<typeof convertToParamMap>>()
    const store = { loadByRestaurant: vi.fn() }
    TestBed.configureTestingModule({
      providers: [
        { provide: EmployeeStore, useValue: store },
        { provide: ActivatedRoute, useValue: { parent: { paramMap: paramMap$ } } }
      ]
    })
    TestBed.overrideComponent(EmployeeListComponent, { set: { template: '', imports: [] } })
    const fixture = TestBed.createComponent(EmployeeListComponent)
    fixture.detectChanges()

    paramMap$.next(convertToParamMap({ restaurantId: 'rest-1' }))
    paramMap$.next(convertToParamMap({ restaurantId: 'rest-2' }))

    expect(store.loadByRestaurant).toHaveBeenNthCalledWith(1, 'rest-1')
    expect(store.loadByRestaurant).toHaveBeenNthCalledWith(2, 'rest-2')
    expect(fixture.componentInstance.restaurantId).toBe('rest-2')
  })
})
