'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import type { PerfilUsuario } from '@/app/actions/inventario'
import type { CSSProperties, ReactNode } from 'react'

type Props = {
  perfil: PerfilUsuario
  children: ReactNode
}

const NAV_ITEMS = [
  { href: '/mascotas',   icon: 'fa-solid fa-paw',           label: 'Registro de Mascota' },
  { href: '/inventario', icon: 'fa-solid fa-boxes-stacked',  label: 'Control Inventario'  },
]

export default function DashboardShell({ perfil, children }: Props) {
  const pathname = usePathname()

  return (
    // Inline styles en la estructura para que body{flex flex-col} del layout no interfiera
    <div style={s.root}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>

          {/* Logo */}
          <div style={s.logo}>
            <i className="fa-solid fa-heart-pulse" style={{ color: '#22d3ee', fontSize: '1.4rem' }} />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
              PetCare<strong style={{ color: '#22d3ee' }}>.</strong>
            </span>
          </div>

          {/* Clínica pill */}
          {perfil.nombre_clinica && (
            <div style={s.clinicaPill}>
              <i className="fa-solid fa-hospital" style={{ fontSize: '.8rem' }} />
              {perfil.nombre_clinica}
            </div>
          )}

          {/* Navegación */}
          <div style={s.nav}>
            {NAV_ITEMS.map(({ href, icon, label }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={active ? s.navItemActive : s.navItem}>
                  <i className={icon} style={{ width: 18, textAlign: 'center', fontSize: '.88rem' }} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Usuario */}
        <div style={s.userRow}>
          <div style={s.userAvatar}>
            <i className="fa-solid fa-user-doctor" style={{ color: '#22d3ee', fontSize: '.9rem' }} />
          </div>
          <div style={s.userInfo}>
            <span style={s.userName}>{perfil.nombre}</span>
            <span style={s.userRol}>{perfil.rol}</span>
          </div>
          <form action={logoutAction} style={{ marginLeft: 'auto' }}>
            <button type="submit" style={s.logoutBtn} title="Cerrar sesión">
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </form>
        </div>
      </aside>

      {/* ── CONTENIDO ── */}
      <div style={s.content}>
        {children}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
      `}</style>
    </div>
  )
}

// ── Estilos como objetos (evita conflictos con Tailwind / globals.css) ──────
const s: Record<string, CSSProperties> = {
  root: {
    display: 'block',
    minHeight: '100vh',
    width: '100%',
    fontFamily: "'Poppins', sans-serif",
    background: '#f4f7fb',
    position: 'relative',
  },
  sidebar: {
    width: '240px',
    background: '#0c1526',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '28px 16px 24px',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    overflowY: 'auto',
    zIndex: 50,
  },
  sidebarTop: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 8px',
  },
  clinicaPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(34,211,238,.1)',
    border: '1px solid rgba(34,211,238,.25)',
    color: '#67e8f9',
    fontSize: '.72rem',
    padding: '6px 12px',
    borderRadius: '8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    color: '#94a3b8',
    fontWeight: 500,
    fontSize: '.85rem',
    textDecoration: 'none',
    background: 'transparent',
    transition: 'background .2s, color .2s',
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    color: '#22d3ee',
    fontWeight: 600,
    fontSize: '.85rem',
    textDecoration: 'none',
    background: 'rgba(34,211,238,.12)',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: 'rgba(255,255,255,.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,.08)',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(34,211,238,.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  userName: {
    color: '#e2e8f0',
    fontSize: '.8rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRol: {
    color: '#64748b',
    fontSize: '.68rem',
  },
  logoutBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,.12)',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '.85rem',
  },
  content: {
    marginLeft: '240px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
}
