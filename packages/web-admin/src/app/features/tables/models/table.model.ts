export type TableStatus = 'libre' | 'ocupada' | 'reservada'

export const TABLE_STATUSES: TableStatus[] = ['libre', 'ocupada', 'reservada']

export interface Table {
  id: string
  restaurantId: string
  number: number
  description: string | null
  capacity: number
  status: TableStatus
  createdAt: string
  updatedAt: string
}

export interface CreateTableDto {
  number: number
  description?: string | null
  capacity: number
  status?: TableStatus
}

/** En PUT el estado es opcional: si no se envía, la API conserva el actual. */
export interface UpdateTableDto {
  number: number
  description?: string | null
  capacity: number
  status?: TableStatus
}
