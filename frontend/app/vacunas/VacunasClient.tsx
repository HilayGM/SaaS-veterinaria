'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/app/components/DashboardShell'
import { registrarVacunaAction } from '@/app/actions/vacunas'
import type { PerfilUsuario, VacunaConMascota, VacunaState } from '@/app/actions/vacunas'

type Props = {
  perfil: PerfilUsuario
  vacunasIniciales: VacunaConMascota[]
}

const DIAS_ALERTA_VACUNA = 30

export function calcularEstadoVacuna(
  proximaAplicacion: string | null
): 'vigente' | 'por-vencer' | 'vencida' | 'sin-fecha' {
  if (!proximaAplicacion) return 'sin-fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaProxima = new Date(proximaAplicacion + 'T00:00:00')
  const diffDias = Math.floor((fechaProxima.getTime() - hoy.getTime()) / 86_400_000)
  if (diffDias < 0) return 'vencida'
  if (diffDias <= DIAS_ALERTA_VACUNA) return 'por-vencer'
  return 'vigente'
}

function getFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function VacunasClient({ perfil, vacunasIniciales }: Props) {
  const router = useRouter()
  const vacunas = vacunasIniciales
  const [, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [busquedaVacuna, setBusquedaVacuna] = useState('')
  const [fechaAplicacion, setFechaAplicacion] = useState(getFechaActual())

  const vacunasFiltradas = vacunas.filter(v => {
    const q = busquedaVacuna.toLowerCase()
    return (
      v.nombre.toLowerCase().includes(q) ||
      (v.mascota?.nombre.toLowerCase().includes(q) ?? false)
    )
  })

  const [state, formAction, pending] = useActionState<VacunaState, FormData>(
    async (prev, formData) => {
      const result = await registrarVacunaAction(prev, formData)
      if (result?.success) {
        setFormKey(k => k + 1)
        setFechaAplicacion(getFechaActual())
        startTransition(() => {
          router.refresh()
        })
      }
      return result
    },
    null
  )

  return (
    <DashboardShell perfil={perfil}>
      <div style={{ padding: '36px 40px 60px', minWidth: 0 }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Registro de Vacunas
          </h1>
          <p style={{ color: '#64748b', fontSize: '.9rem' }}>
            Registra las vacunas aplicadas y consulta el historial de cada paciente.
          </p>
        </div>

        {/* Grid: formulario + guía */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Formulario */}
            <div className="vac-card">
              <form key={formKey} action={formAction}>

                {state?.error && (
                  <div className="vac-alert vac-alert-error">
                    <i className="fa-solid fa-circle-exclamation" /> {state.error}
                  </div>
                )}
                {state?.success && (
                  <div className="vac-alert vac-alert-success">
                    <i className="fa-solid fa-circle-check" /> Vacuna registrada correctamente.
                  </div>
                )}

                <SectionTitle title="Información de la Vacuna" />
                <div className="vac-form-grid">
                  <Field label="NOMBRE DE LA VACUNA">
                    <input name="nombre" type="text" placeholder="Ej. Rabia" required disabled={pending} />
                  </Field>
                  <Field label="ID DE MASCOTA">
                    <input name="id_mascota" type="number" min={1} placeholder="Ej. 12" required disabled={pending} />
                  </Field>
                  <Field label="FECHA DE APLICACIÓN">
                    <input
                      name="fecha_aplicacion"
                      type="date"
                      value={fechaAplicacion}
                      onChange={e => setFechaAplicacion(e.target.value)}
                      disabled={pending}
                    />
                  </Field>
                  <Field label="PRÓXIMA APLICACIÓN">
                    <input name="proxima_aplicacion" type="date" min={fechaAplicacion} disabled={pending} />
                  </Field>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="submit" className="vac-btn-primary" disabled={pending}>
                    {pending
                      ? <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</>
                      : <><i className="fa-solid fa-floppy-disk" /> Guardar Vacuna</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabla de vacunas */}
            <div className="vac-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-syringe" />
                Vacunas registradas
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  {vacunas.length}
                </span>
              </h3>

              <div className="vac-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  value={busquedaVacuna}
                  onChange={e => setBusquedaVacuna(e.target.value)}
                  placeholder="Buscar vacuna o paciente..."
                />
              </div>

              {vacunas.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-syringe" style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }} />
                  <p style={{ fontSize: '.88rem' }}>Aún no hay vacunas registradas en esta clínica.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  {vacunasFiltradas.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', background: '#fff' }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 10 }} />
                      <p style={{ fontSize: '.88rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                        No se encontraron vacunas con ese criterio.
                      </p>
                      <p style={{ fontSize: '.8rem' }}>Intenta escribir otro nombre de vacuna o paciente.</p>
                    </div>
                  ) : (
                    <table className="vac-table">
                      <thead>
                        <tr>
                          <th>Vacuna</th>
                          <th>Paciente</th>
                          <th>Aplicación</th>
                          <th>Próxima aplicación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacunasFiltradas.map(v => (
                          <FilaVacuna key={v.id_vacuna} vacuna={v} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guía de registro */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="vac-guide-card">
              <div className="vac-guide-header" style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
                <i className="fa-solid fa-circle-info" /> Guía de Registro
              </div>
              <div className="vac-guide-body">
                <p>Registra el nombre de la vacuna aplicada y selecciona la fecha real de aplicación.</p>
                <p>Los campos <strong>Nombre</strong> e <strong>ID de Mascota</strong> son obligatorios.</p>
                <p>La próxima aplicación debe ser posterior a la fecha de aplicación.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#0891b2', fontSize: '.8rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginTop: 2 }} />
                  El servidor valida que la mascota pertenezca a tu clínica.
                </div>
              </div>
            </div>

            <div className="vac-guide-card">
              <div className="vac-guide-header" style={{ background: 'linear-gradient(135deg,#010b2f,#001f73)' }}>
                <i className="fa-solid fa-chart-pie" /> Resumen
              </div>
              <div className="vac-guide-body">
                {[
                  { val: vacunas.length, label: 'Vacunas registradas' },
                  { val: vacunas.filter(v => v.proxima_aplicacion).length, label: 'Con próxima aplicación' },
                  { val: new Set(vacunas.map(v => v.id_mascota).filter(Boolean)).size, label: 'Pacientes vacunados' },
                ].map(({ val, label }) => (
                  <div key={label} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <strong style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>{val}</strong>
                    <span style={{ fontSize: '.75rem', color: '#64748b' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .vac-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 28px;
          font-family: 'Poppins', sans-serif;
        }
        .vac-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .vac-field { display: flex; flex-direction: column; gap: 6px; }
        .vac-field label { font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: #64748b; }
        .vac-field input, .vac-field select {
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-size: .88rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          width: 100%;
        }
        .vac-field input:focus, .vac-field select:focus { border-color: #22d3ee; background: #fff; }
        .vac-field input:disabled, .vac-field select:disabled { opacity: .6; }
        .vac-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #22d3ee; color: #0c1526;
          border: none; padding: 13px 28px; border-radius: 12px;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: .9rem;
          cursor: pointer;
        }
        .vac-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .vac-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-radius: 10px; font-size: .85rem; margin-bottom: 20px;
        }
        .vac-alert-error  { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
        .vac-alert-success { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; }
        .vac-search {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; margin-bottom: 16px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; color: #94a3b8;
        }
        .vac-search:focus-within { border-color: #22d3ee; background: #fff; }
        .vac-search input {
          border: none; outline: none; background: transparent;
          width: 100%; font-family: 'Poppins', sans-serif;
          font-size: .88rem; color: #0f172a;
        }
        .vac-search input::placeholder { color: #94a3b8; }
        .vac-table { width: 100%; border-collapse: collapse; font-size: .85rem; font-family: 'Poppins', sans-serif; }
        .vac-table th {
          padding: 12px 16px; text-align: left; background: #f8fafc;
          color: #64748b; font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .vac-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
        .vac-table tr:last-child td { border-bottom: none; }
        .vac-patient-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(34,211,238,.1); color: #0891b2;
          font-size: .72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px;
        }
        .vac-guide-card { border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }
        .vac-guide-header {
          color: white; padding: 14px 18px; font-weight: 700; font-size: .9rem;
          display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif;
        }
        .vac-guide-body {
          background: white; padding: 18px;
          display: flex; flex-direction: column; gap: 12px;
          font-family: 'Poppins', sans-serif;
        }
        .vac-guide-body p { font-size: .82rem; color: #475569; line-height: 1.6; }
        .vac-section-title {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .vac-section-bar { width: 4px; height: 22px; border-radius: 4px; background: #22d3ee; flex-shrink: 0; }
        .vac-section-title h2 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }

        @media (max-width: 900px) {
          .vac-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </DashboardShell>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="vac-section-title">
      <span className="vac-section-bar" />
      <h2>{title}</h2>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="vac-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function FilaVacuna({ vacuna }: { vacuna: VacunaConMascota }) {
  const estado = calcularEstadoVacuna(vacuna.proxima_aplicacion)

  return (
    <tr>
      <td><strong>{vacuna.nombre}</strong></td>
      <td>
        {vacuna.mascota ? (
          <>
            <span className="vac-patient-pill">
              <i className="fa-solid fa-paw" /> {vacuna.mascota.nombre}
            </span>
            <span style={{ color: '#64748b', fontSize: '.78rem', marginLeft: 6 }}>
              #{vacuna.mascota.id_mascota}
            </span>
          </>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        )}
      </td>
      <td style={{ color: '#64748b', fontSize: '.82rem' }}>{formatearFecha(vacuna.fecha_aplicacion)}</td>
      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          borderRadius: 999, fontSize: '.78rem', fontWeight: 600,
          background: estado === 'vencida' ? '#fef2f2' : estado === 'por-vencer' ? '#fffbeb' : estado === 'vigente' ? '#f0fdf4' : '#f1f5f9',
          color: estado === 'vencida' ? '#dc2626' : estado === 'por-vencer' ? '#d97706' : estado === 'vigente' ? '#16a34a' : '#64748b',
        }}>
          {formatearFecha(vacuna.proxima_aplicacion)}
        </span>
      </td>
    </tr>
  )
}
