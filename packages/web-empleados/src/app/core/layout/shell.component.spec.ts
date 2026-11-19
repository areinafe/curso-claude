import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { provideRouter } from '@angular/router'
import { AuthService, AuthStore } from '@resttek/web-shared'
import { ShellComponent } from './shell.component'

describe('ShellComponent', () => {
  function crear(role: string): ShellComponent {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        {
          provide: AuthStore,
          useValue: {
            userRole: signal(role).asReadonly(),
            user: signal({ role, restaurantId: 'rest-1' }).asReadonly()
          }
        }
      ]
    })
    return TestBed.runInInjectionContext(() => new ShellComponent())
  }

  it.each([
    ['manager', true],
    ['camarero', true],
    ['cocinero', false]
  ])('canSeeMesas para %s es %s', (role, esperado) => {
    expect(crear(role).canSeeMesas()).toBe(esperado)
  })
})
