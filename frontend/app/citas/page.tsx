import { getCurrentUserProfile } from '@/app/actions/inventario'
import { getCitasHoy } from '@/app/actions/citas'
import { redirect } from 'next/navigation'
import CitasClient from './CitasClient'

export const metadata = {
  title: 'Citas de Hoy | PetCare',
  description: 'Módulo de gestión de citas veterinarias diarias',
}

export default async function CitasPage() {
  const perfil = await getCurrentUserProfile()
  
  if (!perfil) {
    redirect('/login')
  }

  // Fetch server-side on initial load
  const citas = await getCitasHoy()

  return (
    <CitasClient perfil={perfil} initialCitas={citas} />
  )
}
