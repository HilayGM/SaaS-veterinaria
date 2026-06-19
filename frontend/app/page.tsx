import { redirect } from 'next/navigation'

// La raíz del sitio ahora entra directo al login.
// La landing comercial (la que vende el producto) se movió a /landing.
export default function Home() {
  redirect('/login')
}
