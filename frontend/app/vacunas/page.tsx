import { redirect } from 'next/navigation'
import { getCurrentUserProfile, getVacunas } from '@/app/actions/vacunas'
import VacunasClient from './VacunasClient'

export default async function VacunasPage() {
  const perfil = await getCurrentUserProfile()

  if (!perfil) {
    redirect('/login')
  }

  const vacunas = await getVacunas()

  return (
    <VacunasClient
      perfil={perfil}
      vacunasIniciales={vacunas}
    />
  )
}
