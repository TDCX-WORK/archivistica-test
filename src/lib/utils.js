import { clsx } from 'clsx'

// Versión simplificada del cn de shadcn/ui — sin tailwind-merge
// porque no usamos Tailwind en este proyecto
export function cn(...inputs) {
  return clsx(inputs)
}
