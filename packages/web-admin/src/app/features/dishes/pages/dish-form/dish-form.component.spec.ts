import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { LucideAngularModule, ChevronLeft, Plus, Trash2 } from 'lucide-angular'
import { IngredientStore } from '../../../ingredients/store/ingredient.store'
import { DishService } from '../../services/dish.service'
import { DishStore } from '../../store/dish.store'
import { DishFormComponent } from './dish-form.component'

describe('DishFormComponent (accesibilidad)', () => {
  let fixture: ComponentFixture<DishFormComponent>
  let dishStore: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }

  const root = () => fixture.nativeElement as HTMLElement

  beforeEach(async () => {
    dishStore = { create: vi.fn().mockResolvedValue(undefined), update: vi.fn().mockResolvedValue(undefined) }
    await TestBed.configureTestingModule({
      imports: [LucideAngularModule.pick({ ChevronLeft, Plus, Trash2 })],
      providers: [
        provideRouter([]),
        { provide: DishStore, useValue: dishStore },
        { provide: DishService, useValue: {} },
        { provide: IngredientStore, useValue: { ingredients: signal([]), loadByRestaurant: vi.fn() } }
      ]
    }).compileComponents()
    fixture = TestBed.createComponent(DishFormComponent)
    fixture.componentInstance.restaurantId = 'rest-1'
    fixture.detectChanges()
  })

  it('asocia una etiqueta a cada control del formulario', () => {
    const esperadas: Record<string, string> = {
      name: 'Nombre del plato',
      price: 'Precio',
      category: 'Categoría',
      available: 'Disponible',
      description: 'Descripción',
      newIngredientId: 'Ingrediente',
      newIngredientQty: 'Cantidad'
    }

    for (const [name, texto] of Object.entries(esperadas)) {
      const control = root().querySelector(`[name="${name}"]`)
      expect(control, `control ${name}`).not.toBeNull()
      const id = control!.id
      expect(id, `id de ${name}`).not.toBe('')
      const label = root().querySelector(`label[for="${id}"]`)
      expect(label?.textContent, `etiqueta de ${name}`).toContain(texto)
    }
  })

  it('usa encabezados semánticos y oculta los iconos decorativos', () => {
    const h1 = root().querySelectorAll('h1')
    expect(h1).toHaveLength(1)
    expect(h1[0].textContent).toContain('Nuevo plato')
    const h2 = root().querySelectorAll('h2')
    expect(h2).toHaveLength(1)
    expect(h2[0].textContent).toContain('Ingredientes del plato')
    expect(root().querySelector('a.back-link')?.getAttribute('aria-label')).toBe('Volver a platos')
    const iconos = Array.from(root().querySelectorAll('lucide-icon'))
    expect(iconos.length).toBeGreaterThan(0)
    expect(iconos.every(i => i.getAttribute('aria-hidden') === 'true')).toBe(true)
  })
})
