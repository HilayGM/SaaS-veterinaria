import { redirect } from 'next/navigation'
import { getCurrentUserProfile, getMascotas } from '@/app/actions/mascotas'
import MascotasClient from './MascotasClient'

export default async function MascotasPage() {
  const perfil = await getCurrentUserProfile()

  if (!perfil) {
    redirect('/login')
  }

  const mascotas = await getMascotas()

  return (
    <MascotasClient
      perfil={perfil}
      mascotasIniciales={mascotas}
    />
  )
}
