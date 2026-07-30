import { getCurrentUserProfile } from '@/app/actions/inventario'
import { getExpedientes, getMascotasDeClinica } from '@/app/actions/expedientes'
import { redirect } from 'next/navigation'
import ExpedientesClient from './ExpedientesClient'

export const metadata = {
  title: 'Expedientes Médicos | PetCare',
}

export default async function ExpedientesPage() {
  const perfil = await getCurrentUserProfile()
  if (!perfil) redirect('/login')

  const [expedientes, mascotas] = await Promise.all([
    getExpedientes(),
    getMascotasDeClinica(),
  ])

  return (
    <ExpedientesClient
      perfil={perfil}
      expedientesIniciales={expedientes}
      mascotas={mascotas}
    />
  )
}
