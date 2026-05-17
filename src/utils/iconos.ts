import {
  Utensils, Car, Shirt, Heart, Film, Zap, Home,
  MoreHorizontal, Briefcase, Laptop, Gift, PlusCircle,
  Wallet, PiggyBank, CreditCard, Banknote,
  type LucideIcon,
} from 'lucide-react'

// Mapa centralizado de todos los íconos disponibles
export const iconosMap: Record<string, LucideIcon> = {
  // Cuentas
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  banknote: Banknote,
  
  // Categorías de egreso
  utensils: Utensils,
  car: Car,
  shirt: Shirt,
  heart: Heart,
  film: Film,
  zap: Zap,
  home: Home,
  'more-horizontal': MoreHorizontal,
  
  // Categorías de ingreso
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
  'plus-circle': PlusCircle,
}

/**
 * Retorna el componente de ícono correspondiente al string,
 * o un ícono genérico si no se encuentra.
 */
export function obtenerIcono(nombre: string): LucideIcon {
  return iconosMap[nombre] ?? MoreHorizontal
}