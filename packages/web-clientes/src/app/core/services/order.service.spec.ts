import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { API_URL } from '@resttek/web-shared'
import { OrderService } from './order.service'

describe('OrderService', () => {
  it('createOrder envía el tableId en el cuerpo', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: '/api/v1' }]
    })
    const service = TestBed.inject(OrderService)
    const http = TestBed.inject(HttpTestingController)
    const items = [{ dishId: 'plato-1', quantity: 1, notes: null }]

    service.createOrder('rest-1', items, 'table-rest-1-3').subscribe()

    const req = http.expectOne('/api/v1/orders')
    expect(req.request.method).toBe('POST')
    expect(req.request.body).toEqual({ restaurantId: 'rest-1', tableId: 'table-rest-1-3', items })
    req.flush({})
    http.verify()
  })
})
