'use client'

import { useActionState, useState, useTransition } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import {
  registrarMascotaAction,
  eliminarMascotaAction,
} from '@/app/actions/mascotas'
import type { MascotaState, MascotaConDueno, PerfilUsuario } from '@/app/actions/mascotas'

type Props = {
  perfil: PerfilUsuario
  mascotasIniciales: MascotaConDueno[]
}

const ESPECIES = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro']

function formatearFecha(fecha: string | null) {
  if (!fecha) return '—'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function MascotasClient({ perfil, mascotasIniciales }: Props) {
  const [mascotas, setMascotas] = useState(mascotasIniciales)
  const [, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)

  const [state, formAction, pending] = useActionState<MascotaState, FormData>(
    async (prev, formData) => {
      const result = await registrarMascotaAction(prev, formData)
      if (result?.success) setFormKey(k => k + 1)
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
            Registro de Mascota
          </h1>
          <p style={{ color: '#64748b', fontSize: '.9rem' }}>
            Ingresa los datos del nuevo paciente en el sistema.
          </p>
        </div>

        {/* Grid: formulario + guía */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

          {/* ── COLUMNA IZQUIERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Formulario */}
            <div className="mas-card">
              <form key={formKey} action={formAction}>

                {state?.error && (
                  <div className="mas-alert mas-alert-error">
                    <i className="fa-solid fa-circle-exclamation" /> {state.error}
                  </div>
                )}
                {state?.success && (
                  <div className="mas-alert mas-alert-success">
                    <i className="fa-solid fa-circle-check" /> Mascota registrada correctamente.
                  </div>
                )}

                <input type="hidden" name="id_clinica" value={perfil.id_clinica ?? ''} />

                <SectionTitle title="Información de la Mascota" />
                <div className="mas-form-grid">
                  <Field label="NOMBRE">
                    <input name="nombre" type="text" placeholder="Ej. Max" required disabled={pending} />
                  </Field>
                  <Field label="ESPECIE">
                    <select name="especie" required disabled={pending} defaultValue="">
                      <option value="" disabled>Seleccione especie</option>
                      {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </Field>
                  <Field label="RAZA">
                    <input name="raza" type="text" placeholder="Ej. Labrador" disabled={pending} />
                  </Field>
                  <Field label="FECHA DE NACIMIENTO">
                    <input name="fecha_nacimiento" type="date" disabled={pending} />
                  </Field>
                </div>

                <div style={{ marginTop: 24 }}>
                  <SectionTitle title="Información del Propietario" />
                  <Field label="NOMBRE COMPLETO">
                    <input name="nombre_dueno" type="text" placeholder="Nombre del dueño" required disabled={pending} />
                  </Field>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="submit" className="mas-btn-primary" disabled={pending}>
                    {pending
                      ? <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</>
                      : <><i className="fa-solid fa-floppy-disk" /> Guardar Paciente</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabla de pacientes */}
            <div className="mas-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-list" />
                Pacientes registrados
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  {mascotas.length}
                </span>
              </h3>

              {mascotas.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-paw" style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }} />
                  <p style={{ fontSize: '.88rem' }}>Aún no hay mascotas registradas en esta clínica.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <table className="mas-table">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Especie / Raza</th>
                        <th>Nacimiento</th>
                        <th>Propietario</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mascotas.map(m => (
                        <FilaMascota
                          key={m.id_mascota}
                          mascota={m}
                          onEliminar={() =>
                            startTransition(() =>
                              setMascotas(prev => prev.filter(x => x.id_mascota !== m.id_mascota))
                            )
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── GUÍA DE REGISTRO ── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="mas-guide-card">
              <div className="mas-guide-header" style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
                <i className="fa-solid fa-circle-info" /> Guía de Registro
              </div>
              <div className="mas-guide-body">
                <p>Asegúrate de registrar correctamente la fecha de nacimiento. El sistema calculará automáticamente la edad del paciente para el expediente médico.</p>
                <p>Los campos <strong>Nombre</strong>, <strong>Especie</strong> y <strong>Propietario</strong> son obligatorios. Si desconoces la raza exacta, puedes indicar &ldquo;Mestizo&rdquo; o &ldquo;Cruza&rdquo;.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#0891b2', fontSize: '.8rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginTop: 2 }} />
                  Los datos se guardan de forma segura con aislamiento por clínica.
                </div>
              </div>
            </div>

            <div className="mas-guide-card">
              <div className="mas-guide-header" style={{ background: 'linear-gradient(135deg,#010b2f,#001f73)' }}>
                <i className="fa-solid fa-chart-pie" /> Resumen
              </div>
              <div className="mas-guide-body">
                {[
                  { val: mascotas.length, label: 'Pacientes en esta clínica' },
                  { val: mascotas.filter(m => m.especie === 'Perro').length, label: 'Perros' },
                  { val: mascotas.filter(m => m.especie === 'Gato').length,  label: 'Gatos'  },
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
        .mas-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 28px;
          font-family: 'Poppins', sans-serif;
        }
        .mas-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .mas-field { display: flex; flex-direction: column; gap: 6px; }
        .mas-field label { font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: #64748b; }
        .mas-field input, .mas-field select {
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
        .mas-field input:focus, .mas-field select:focus { border-color: #22d3ee; background: #fff; }
        .mas-field input:disabled, .mas-field select:disabled { opacity: .6; }
        .mas-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #22d3ee; color: #0c1526;
          border: none; padding: 13px 28px; border-radius: 12px;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: .9rem;
          cursor: pointer;
        }
        .mas-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .mas-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-radius: 10px; font-size: .85rem; margin-bottom: 20px;
        }
        .mas-alert-error  { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
        .mas-alert-success { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; }
        .mas-table { width: 100%; border-collapse: collapse; font-size: .85rem; font-family: 'Poppins', sans-serif; }
        .mas-table th {
          padding: 12px 16px; text-align: left; background: #f8fafc;
          color: #64748b; font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .mas-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
        .mas-table tr:last-child td { border-bottom: none; }
        .mas-especie-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(34,211,238,.1); color: #0891b2;
          font-size: .72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px;
        }
        .mas-guide-card { border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }
        .mas-guide-header {
          color: white; padding: 14px 18px; font-weight: 700; font-size: .9rem;
          display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif;
        }
        .mas-guide-body {
          background: white; padding: 18px;
          display: flex; flex-direction: column; gap: 12px;
          font-family: 'Poppins', sans-serif;
        }
        .mas-guide-body p { font-size: .82rem; color: #475569; line-height: 1.6; }
        .mas-section-title {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .mas-section-bar { width: 4px; height: 22px; border-radius: 4px; background: #22d3ee; flex-shrink: 0; }
        .mas-section-title h2 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }
        @media (max-width: 900px) {
          .mas-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </DashboardShell>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mas-section-title">
      <span className="mas-section-bar" />
      <h2>{title}</h2>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mas-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function FilaMascota({ mascota, onEliminar }: { mascota: MascotaConDueno; onEliminar: () => void }) {
  const [, formAction, pending] = useActionState<MascotaState, FormData>(
    async (prev, formData) => {
      const result = await eliminarMascotaAction(prev, formData)
      if (result?.success) onEliminar()
      return result
    },
    null
  )

  return (
    <tr>
      <td><strong>{mascota.nombre}</strong></td>
      <td>
        <span className="mas-especie-pill">
          <i className="fa-solid fa-paw" /> {mascota.especie}
        </span>
        {mascota.raza && <span style={{ color: '#64748b', fontSize: '.78rem', marginLeft: 6 }}>{mascota.raza}</span>}
      </td>
      <td style={{ color: '#64748b', fontSize: '.82rem' }}>{formatearFecha(mascota.fecha_nacimiento)}</td>
      <td style={{ fontSize: '.85rem' }}>{mascota.dueno?.nombre ?? '—'}</td>
      <td>
        <form action={formAction} onSubmit={e => { if (!confirm(`¿Eliminar a "${mascota.nombre}"?`)) e.preventDefault() }}>
          <input type="hidden" name="id_mascota" value={mascota.id_mascota} />
          <button type="submit" disabled={pending} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: 4 }}>
            <i className="fa-solid fa-trash" />
          </button>
        </form>
      </td>
    </tr>
  )
}
