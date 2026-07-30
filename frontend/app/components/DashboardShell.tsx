'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/auth'
import type { PerfilUsuario } from '@/app/actions/inventario'
import './dashboard.css'

type Props = {
  perfil: PerfilUsuario
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/mascotas', icon: 'fa-solid fa-paw', label: 'Registro de Mascotas' },
  { href: '/vacunas', icon: 'fa-solid fa-syringe', label: 'Vacunas' },
  { href: '/expedientes', icon: 'fa-solid fa-notes-medical', label: 'Expedientes' },
  { href: '/citas', icon: 'fa-solid fa-calendar-check', label: 'Citas' },
  { href: '/inventario', icon: 'fa-solid fa-boxes-stacked', label: 'Control de Inventario' },
]

export default function DashboardShell({ perfil, children }: Props) {
  const pathname = usePathname()

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__top">
          <div className="dashboard-logo">
            <span className="dashboard-logo__mark">
              <i className="fa-solid fa-heart-pulse" />
            </span>
            <span>
              PetCare<strong className="dashboard-logo__dot">.</strong>
            </span>
          </div>

          {perfil.nombre_clinica && (
            <div className="dashboard-clinic">
              <i className="fa-solid fa-hospital" />
              <span>{perfil.nombre_clinica}</span>
            </div>
          )}

          <div className="dashboard-nav" role="navigation" aria-label="Módulos principales">
            {NAV_ITEMS.map(({ href, icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`)

              return (
                <Link
                  key={href}
                  href={href}
                  className={`dashboard-nav__link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <i className={`${icon} dashboard-nav__icon`} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="dashboard-user">
          <div className="dashboard-user__avatar">
            <i className="fa-solid fa-user-doctor" />
          </div>
          <div className="dashboard-user__info">
            <span className="dashboard-user__name">{perfil.nombre}</span>
            <span className="dashboard-user__role">{perfil.rol}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="dashboard-logout" title="Cerrar sesión">
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </form>
        </div>
      </aside>

      <div className="dashboard-content">{children}</div>
    </div>
  )
}
