import { getCurrentUserProfile } from '@/app/actions/inventario'
import { getCitas } from '@/app/actions/citas'
import { getMascotasDeClinica } from '@/app/actions/expedientes'
import { redirect } from 'next/navigation'
import CitasClient from './CitasClient'

export const metadata = {
  title: 'Citas | PetCare',
}

export default async function CitasPage() {
  const perfil = await getCurrentUserProfile()
  if (!perfil) redirect('/login')

  const [citas, mascotas] = await Promise.all([
    getCitas(),
    getMascotasDeClinica(),
  ])

  return (
    <CitasClient perfil={perfil} initialCitas={citas} mascotas={mascotas} />
  )
}
