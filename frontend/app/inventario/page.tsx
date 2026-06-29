import { redirect } from 'next/navigation'
import { getCurrentUserProfile, getInventario } from '@/app/actions/inventario'
import InventarioClient from './InventarioClient'

export default async function InventarioPage() {
  const perfil = await getCurrentUserProfile()

  // Sin sesión válida (o sin fila en `usuarios`) -> de regreso al login
  if (!perfil) {
    redirect('/login')
  }

  const productos = await getInventario()

  return (
    <InventarioClient
      perfil={perfil}
      productosIniciales={productos}
    />
  )
}
