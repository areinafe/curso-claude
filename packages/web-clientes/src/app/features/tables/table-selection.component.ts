import { Component, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { HttpErrorResponse } from '@angular/common/http'
import { TableService } from '../../core/services/table.service'
import { CartStore } from '../../core/store/cart.store'
import { Table } from '../../core/models/table.model'

// Errores de la API tras los que la lista de mesas ha cambiado y hay que recargarla
const RELOAD_ERRORS = ['TableNotAvailableError', 'TableNotFoundError']

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <a routerLink="/restaurants" class="back-link">← Volver a restaurantes</a>
          <h1>Elige tu mesa</h1>
        </div>
      </div>

      <form class="people-form card" (submit)="$event.preventDefault(); search()">
        <div class="form-group">
          <label for="people">¿Cuántas personas sois?</label>
          <input id="people" type="number" min="1" step="1" class="form-control"
                 [value]="people()" (input)="onPeopleInput($event)" />
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">Buscar mesas</button>
      </form>

      @if (validationError()) {
        <div class="alert-error">{{ validationError() }}</div>
      }
      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="spinner"></div>
      } @else if (searched()) {
        @if (tables().length === 0) {
          <div class="empty-state card">
            <p>No hay mesas disponibles para {{ searchedPeople() }} personas</p>
          </div>
        } @else {
          <div class="tables-grid">
            @for (table of tables(); track table.id) {
              <button type="button" class="table-card card"
                      [class.selected]="selected()?.id === table.id"
                      (click)="select(table)">
                <h3>Mesa {{ table.number }}</h3>
                <p class="capacity">Hasta {{ table.capacity }} personas</p>
                @if (table.description) {
                  <p class="description">{{ table.description }}</p>
                }
              </button>
            }
          </div>
          <button type="button" class="btn btn-primary continue-btn"
                  [disabled]="!selected() || occupying()" (click)="continue()">
            @if (occupying()) { Reservando... } @else { Continuar }
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .people-form {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .people-form .form-group {
      margin-bottom: 0;
      flex: 1;
      min-width: 200px;
    }
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .table-card {
      text-align: left;
      color: var(--text-primary);
      cursor: pointer;
      transition: all var(--transition);
    }
    .table-card:hover,
    .table-card.selected {
      border-color: var(--green-medium);
    }
    .table-card.selected {
      background: var(--green-glow);
    }
    .table-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .capacity {
      color: var(--text-secondary);
      font-size: 13px;
    }
    .description {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 4px;
    }
    .continue-btn {
      width: 100%;
      justify-content: center;
    }
  `]
})
export class TableSelectionComponent {
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly tableService = inject(TableService)
  private readonly cartStore = inject(CartStore)

  private readonly restaurantId = this.route.snapshot.paramMap.get('id')!

  readonly people = signal(2)
  readonly searchedPeople = signal(0)
  readonly tables = signal<Table[]>([])
  readonly selected = signal<Table | null>(null)
  readonly searched = signal(false)
  readonly loading = signal(false)
  readonly occupying = signal(false)
  readonly validationError = signal<string | null>(null)
  readonly error = signal<string | null>(null)

  onPeopleInput(event: Event): void {
    this.people.set((event.target as HTMLInputElement).valueAsNumber)
  }

  search(): void {
    const people = this.people()
    if (!Number.isInteger(people) || people < 1) {
      this.validationError.set('Indica un número de personas válido (entero, 1 o más)')
      return
    }
    this.validationError.set(null)
    this.error.set(null)
    this.loadTables(people)
  }

  select(table: Table): void {
    this.selected.set(table)
  }

  continue(): void {
    const table = this.selected()
    if (!table) return

    this.occupying.set(true)
    this.error.set(null)

    this.tableService.occupy(this.restaurantId, table.id).subscribe({
      next: (occupied) => {
        this.occupying.set(false)
        this.cartStore.setTable(this.restaurantId, occupied)
        this.router.navigate(['/restaurants', this.restaurantId])
      },
      error: (err: HttpErrorResponse) => {
        this.occupying.set(false)
        if (RELOAD_ERRORS.includes(err.error?.error)) {
          this.error.set('Esa mesa ya no está disponible. Elige otra, por favor.')
          this.loadTables(this.searchedPeople())
        } else {
          this.error.set('No se ha podido ocupar la mesa. Inténtalo de nuevo.')
        }
      }
    })
  }

  private loadTables(people: number): void {
    this.loading.set(true)
    this.selected.set(null)
    this.searchedPeople.set(people)

    this.tableService.getAvailable(this.restaurantId, people).subscribe({
      next: (tables) => {
        this.tables.set(tables)
        this.searched.set(true)
        this.loading.set(false)
      },
      error: () => {
        this.tables.set([])
        this.error.set('Error al cargar las mesas disponibles')
        this.loading.set(false)
      }
    })
  }
}
