export interface BackofficePerson {
  id: number
  nombre: string
  horario: string
  contacto: string
}

export const INITIAL_BA_PERSONAS: BackofficePerson[] = [
  { id: 1, nombre: 'Angela Flores',    horario: '08:00-17:00 (L-V)',                  contacto: '+56 9 6203 7939' },
  { id: 2, nombre: 'Andrés Agostini',  horario: '10:30-19:00 (L-J), 10:30-18:00 (V)', contacto: '+56 9 4168 9745' },
  { id: 3, nombre: 'Andrea Viloria',   horario: '10:30-19:00 (L-J), 11:30-19:00 (V)', contacto: '+56 9 5176 9267' },
  { id: 4, nombre: 'Susana Soto',      horario: '10:00-19:00 (L-V)',                 contacto: '+56 9 5615 5958' },
]

export const INITIAL_BP_PERSONAS: BackofficePerson[] = [
  { id: 1, nombre: 'Ana Linares',       horario: '09:00-18:00', contacto: '+56 9 5224 3849' },
  { id: 2, nombre: 'Gabriela Delgado',  horario: '12:00-22:00', contacto: '+56 9 4248 9258' },
]
