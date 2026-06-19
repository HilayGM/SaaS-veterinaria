'use client'

import { useActionState, useState } from 'react'
import { loginAction, registerAction } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'

const ROLES = ['Administrador', 'Veterinario', 'Recepcionista'] as const

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'registro'>('login')

  const [loginState, loginFormAction, loginPending] = useActionState<AuthState, FormData>(
    loginAction,
    null
  )
  const [registerState, registerFormAction, registerPending] = useActionState<AuthState, FormData>(
    registerAction,
    null
  )

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <i className="fa-solid fa-heart-pulse" />
          <span>PetCare <strong>Intelligence</strong></span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'registro' ? 'active' : ''}`}
            onClick={() => setTab('registro')}
          >
            Crear cuenta
          </button>
        </div>

        {/* ── LOGIN ── */}
        {tab === 'login' && (
          <form action={loginFormAction} className="auth-form" noValidate>
            <h2 className="auth-title">Bienvenido de vuelta</h2>
            <p className="auth-subtitle">Ingresa con tu cuenta para continuar</p>

            {loginState?.error && (
              <div className="auth-error" role="alert">
                <i className="fa-solid fa-circle-exclamation" />
                {loginState.error}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                disabled={loginPending}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={loginPending}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loginPending}>
              {loginPending ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Ingresando...</>
              ) : (
                <><i className="fa-solid fa-right-to-bracket" /> Iniciar sesión</>
              )}
            </button>
          </form>
        )}

        {/* ── REGISTRO ── */}
        {tab === 'registro' && (
          <form action={registerFormAction} className="auth-form" noValidate>
            <h2 className="auth-title">Crear cuenta nueva</h2>
            <p className="auth-subtitle">Únete a PetCare Intelligence</p>

            {registerState?.error && (
              <div className="auth-error" role="alert">
                <i className="fa-solid fa-circle-exclamation" />
                {registerState.error}
              </div>
            )}

            {registerState?.success && (
              <div className="auth-success" role="status">
                <i className="fa-solid fa-circle-check" />
                Cuenta creada. Revisa tu correo para confirmar.
              </div>
            )}

            <div className="auth-grid">
              <div className="auth-field">
                <label htmlFor="reg-nombre">Nombre completo *</label>
                <input
                  id="reg-nombre"
                  name="nombre"
                  type="text"
                  placeholder="Ej. Ana Pérez"
                  required
                  autoComplete="name"
                  disabled={registerPending}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-email">Correo electrónico *</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  disabled={registerPending}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-password">Contraseña *</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  disabled={registerPending}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirm">Confirmar contraseña *</label>
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  required
                  autoComplete="new-password"
                  disabled={registerPending}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-rol">Rol en la clínica *</label>
              <select id="reg-rol" name="rol" required disabled={registerPending}>
                <option value="">-- Selecciona tu rol --</option>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-clinica">
                ID de clínica
                <span className="auth-hint">(Opcional — tu admin te lo proporciona)</span>
              </label>
              <input
                id="reg-clinica"
                name="id_clinica"
                type="number"
                min={1}
                placeholder="Ej. 1"
                disabled={registerPending}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={registerPending}>
              {registerPending ? (
                <><i className="fa-solid fa-circle-notch fa-spin" /> Creando cuenta...</>
              ) : (
                <><i className="fa-solid fa-user-plus" /> Crear cuenta</>
              )}
            </button>
          </form>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');

        .auth-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #010b2f 10%, #001f73 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: 'Poppins', sans-serif;
        }

        .auth-card {
          background: #fff;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          padding: 36px 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.4rem;
          color: #001f73;
          margin-bottom: 28px;
        }
        .auth-logo i { color: #22d3ee; font-size: 1.6rem; }
        .auth-logo strong { color: #22d3ee; }

        .auth-tabs {
          display: flex;
          background: #f4f7fb;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
          font-size: .9rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: .2s;
        }
        .auth-tab.active {
          background: #001f73;
          color: #fff;
        }

        .auth-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .auth-subtitle {
          font-size: .85rem;
          color: #64748b;
          margin-bottom: 22px;
        }

        .auth-error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: .85rem;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .auth-success {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: .85rem;
          color: #16a34a;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .auth-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .auth-field label {
          font-size: .82rem;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .auth-hint {
          font-weight: 400;
          color: #9ca3af;
          font-size: .75rem;
        }
        .auth-field input,
        .auth-field select {
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-size: .9rem;
          color: #0f172a;
          background: #f8fafc;
          transition: border-color .2s;
          outline: none;
          width: 100%;
        }
        .auth-field input:focus,
        .auth-field select:focus {
          border-color: #22d3ee;
          background: #fff;
        }
        .auth-field input:disabled,
        .auth-field select:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .auth-btn {
          width: 100%;
          padding: 13px;
          background: #001f73;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .2s, transform .15s;
          margin-top: 4px;
        }
        .auth-btn:hover:not(:disabled) {
          background: #1e3a8a;
          transform: translateY(-1px);
        }
        .auth-btn:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .auth-grid .auth-field {
          margin-bottom: 0;
        }

        @media (max-width: 520px) {
          .auth-card { padding: 28px 20px; }
          .auth-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
