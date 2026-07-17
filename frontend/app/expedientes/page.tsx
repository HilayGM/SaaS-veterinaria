import { redirect } from 'next/navigation'
import { getCurrentUserProfile, getExpedientes, getMascotasExpediente } from '@/app/actions/expedientes'
import { getInventario } from '@/app/actions/inventario'
import ExpedientesClient from './ExpedientesClient'

export default async function ExpedientesPage() {
  const perfil = await getCurrentUserProfile()

  if (!perfil) {
    redirect('/login')
  }

  const expedientes = await getExpedientes(perfil.id_clinica)
  const mascotas = await getMascotasExpediente(perfil.id_clinica)
  const productosInventario = await getInventario()

  return (
    <ExpedientesClient
      perfil={perfil}
      expedientesIniciales={expedientes}
      mascotas={mascotas}
      productosInventario={productosInventario}
    />
  )
}
