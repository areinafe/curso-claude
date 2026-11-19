import { describe, it, expect } from 'vitest'
import { normalizeTableStatus } from './table.model.js'
import { InvalidTableStatusError } from '@errors/DomainErrors.js'

describe('normalizeTableStatus', () => {
    it('acepta los tres estados válidos', () => {
        expect(normalizeTableStatus('libre')).toBe('libre')
        expect(normalizeTableStatus('ocupada')).toBe('ocupada')
        expect(normalizeTableStatus('reservada')).toBe('reservada')
    })

    it('normaliza mayúsculas y espacios', () => {
        expect(normalizeTableStatus('  OCUPADA ')).toBe('ocupada')
        expect(normalizeTableStatus('Reservada')).toBe('reservada')
    })

    it('lanza InvalidTableStatusError con un estado desconocido', () => {
        expect(() => normalizeTableStatus('rota')).toThrow(InvalidTableStatusError)
    })

    it('lanza InvalidTableStatusError si no es un string', () => {
        expect(() => normalizeTableStatus(undefined)).toThrow(InvalidTableStatusError)
        expect(() => normalizeTableStatus(3)).toThrow(InvalidTableStatusError)
        expect(() => normalizeTableStatus('')).toThrow(InvalidTableStatusError)
    })
})
