import { getCurrentUserProfile } from '@/app/actions/inventario'
import { getMascotaDetalle, getExpedientes, getVacunas } from '@/app/actions/detalle-mascota'
import { redirect, notFound } from 'next/navigation'
import MascotaDetalleClient from './MascotaDetalleClient'

export const metadata = {
  title: 'Perfil del Paciente | PetCare',
}

export default async function MascotaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await getCurrentUserProfile()
  
  if (!perfil) {
    redirect('/login')
  }

  const { id } = await params
  const idMascota = parseInt(id, 10)
  
  if (isNaN(idMascota)) {
    notFound()
  }

  const [mascota, expedientes, vacunas] = await Promise.all([
    getMascotaDetalle(idMascota),
    getExpedientes(idMascota),
    getVacunas(idMascota),
  ])

  if (!mascota) {
    // Si no existe o no tiene permisos (RLS)
    notFound()
  }

  return (
    <MascotaDetalleClient 
      perfil={perfil} 
      mascota={mascota}
      expedientes={expedientes}
      vacunas={vacunas}
    />
  )
}
