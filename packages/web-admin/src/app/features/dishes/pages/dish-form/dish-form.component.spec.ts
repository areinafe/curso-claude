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
})
