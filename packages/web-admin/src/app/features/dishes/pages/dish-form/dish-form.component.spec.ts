import { signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { LucideAngularModule, ChevronLeft, Plus, Trash2 } from 'lucide-angular'
import type { Ingredient } from '../../../ingredients/models/ingredient.model'
import { IngredientStore } from '../../../ingredients/store/ingredient.store'
import { DishService } from '../../services/dish.service'
import { DishStore } from '../../store/dish.store'
import { DishFormComponent } from './dish-form.component'

describe('DishFormComponent (accesibilidad)', () => {
  let fixture: ComponentFixture<DishFormComponent>
  const ingredientes = signal<Ingredient[]>([])
  let dishStore: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }

  const root = () => fixture.nativeElement as HTMLElement

  beforeEach(async () => {
    ingredientes.set([
      { id: 'i1', name: 'Tomate', unit: 'kg', currentStock: 1, restaurantId: 'rest-1', createdAt: '', updatedAt: '' }
    ])
    dishStore = { create: vi.fn().mockResolvedValue(undefined), update: vi.fn().mockResolvedValue(undefined) }
    await TestBed.configureTestingModule({
      imports: [LucideAngularModule.pick({ ChevronLeft, Plus, Trash2 })],
      providers: [
        provideRouter([]),
        { provide: DishStore, useValue: dishStore },
        { provide: DishService, useValue: {} },
        { provide: IngredientStore, useValue: { ingredients: ingredientes, loadByRestaurant: vi.fn() } }
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

  it('usa botones y enlaces reales con nombre accesible', () => {
    const component = fixture.componentInstance
    const botones = (nombre: string) =>
      Array.from(root().querySelectorAll('button')).filter(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === nombre)

    expect(botones('Guardar')).toHaveLength(1)
    expect(Array.from(root().querySelectorAll('a')).some(a => a.textContent?.trim() === 'Cancelar')).toBe(true)
    const anadir = botones('Añadir ingrediente')[0]
    expect(anadir?.getAttribute('type')).toBe('button')

    component.newIngredientId = 'i1'
    anadir.click()
    fixture.detectChanges()

    expect(component.form.ingredients).toEqual([{ ingredientId: 'i1', quantity: 1 }])
    const quitar = botones('Quitar Tomate (kg)')[0]
    expect(quitar?.getAttribute('type')).toBe('button')
    quitar.click()
    fixture.detectChanges()
    expect(component.form.ingredients).toEqual([])
  })

  it('envuelve los campos en un form cuyo envío llama a onSubmit', () => {
    const component = fixture.componentInstance
    const onSubmit = vi.spyOn(component, 'onSubmit').mockResolvedValue(undefined)
    const form = root().querySelector('form')
    expect(form).not.toBeNull()
    const guardar = Array.from(form!.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Guardar')
    expect(guardar?.getAttribute('type')).toBe('submit')

    form!.dispatchEvent(new Event('submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('no envía si faltan el nombre o el precio y registra los errores', async () => {
    const component = fixture.componentInstance
    component.form.name = '   '
    component.form.price = 0

    await component.onSubmit()

    expect(dishStore.create).not.toHaveBeenCalled()
    expect(Object.keys(component.fieldErrors())).toEqual(['name', 'price'])
  })

  it('envía cuando el nombre y el precio son válidos', async () => {
    const component = fixture.componentInstance
    component.form.name = 'Tarta'
    component.form.price = 5

    await component.onSubmit()

    expect(component.fieldErrors()).toEqual({})
    expect(dishStore.create).toHaveBeenCalledTimes(1)
  })
})
