import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/actions/inventario'
import { getMascotasParaCita, getCitas } from '@/app/actions/citas'
import CitasClient from './CitasClient'

export default async function CitasPage() {
  const perfil = await getCurrentUserProfile()

  if (!perfil) {
    redirect('/login')
  }

  const mascotasIniciales = await getMascotasParaCita()
  const citasIniciales = await getCitas()

  return (
    <CitasClient
      perfil={perfil}
      mascotasIniciales={mascotasIniciales}
      citasIniciales={citasIniciales}
    />
  )
}
