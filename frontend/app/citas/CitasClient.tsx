'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/app/components/DashboardShell'
import {
  getMascotasParaCita,
  registrarCitaAction,
  type CitaState,
  type MascotaParaCita,
  type CitaConMascota,
} from '@/app/actions/citas'
import type { PerfilUsuario } from '@/app/actions/inventario'

type Props = {
  perfil: PerfilUsuario
  mascotasIniciales: MascotaParaCita[]
  citasIniciales: CitaConMascota[]
}

function getDatetimeLocalMin() {
  const now = new Date()
  now.setSeconds(0, 0)
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatFecha(fecha: string) {
  const fechaObj = new Date(fecha)
  if (Number.isNaN(fechaObj.getTime())) return fecha

  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const horaFormateada = fechaObj.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${fechaFormateada} ${horaFormateada}`
}

export default function CitasClient({ perfil, mascotasIniciales, citasIniciales }: Props) {
  const router = useRouter()
  const [formKey, setFormKey] = useState(0)
  const [fechaInicial] = useState(getDatetimeLocalMin)
  const [, startTransition] = useTransition()

  const [state, formAction, pending] = useActionState<CitaState, FormData>(
    async (prev, formData) => {
      const result = await registrarCitaAction(prev, formData)
      if (result?.success) {
        setFormKey(key => key + 1)
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
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Agendar Cita
          </h1>
          <p style={{ color: '#64748b', fontSize: '.9rem' }}>
            Programa una nueva cita seleccionando la mascota, fecha y hora.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="cit-card">
              <form key={formKey} action={formAction}>
                {state?.error && (
                  <div className="mas-alert mas-alert-error">
                    <i className="fa-solid fa-circle-exclamation" /> {state.error}
                  </div>
                )}
                {state?.success && (
                  <div className="mas-alert mas-alert-success">
                    <i className="fa-solid fa-circle-check" /> Cita agendada correctamente.
                  </div>
                )}

                <div style={{ padding: '20px', color: '#475569' }}>
                  <p style={{ marginBottom: 8, fontWeight: 600 }}>Formulario de cita</p>
                  <p style={{ fontSize: '.85rem', color: '#64748b' }}>
                    Selecciona la mascota y la fecha/hora de la cita.
                  </p>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Mascota
                    </label>
                    <select
                      name="id_mascota"
                      required
                      disabled={pending}
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Seleccione mascota
                      </option>
                      {mascotasIniciales.map(mascota => (
                        <option key={mascota.id_mascota} value={mascota.id_mascota}>
                          {mascota.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: '.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Fecha y hora
                    </label>
                    <input
                      name="fecha"
                      type="datetime-local"
                      min={fechaInicial}
                      defaultValue={fechaInicial}
                      required
                      disabled={pending}
                      style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, padding: '0 20px 20px' }}>
                  <button type="submit" className="mas-btn-primary" disabled={pending}>
                    {pending ? (
                      <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</>
                    ) : (
                      <><i className="fa-solid fa-floppy-disk" /> Guardar cita</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="cit-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>
                Citas agendadas
              </h3>

              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Mascota</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasIniciales.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                          No hay citas agendadas aún.
                        </td>
                      </tr>
                    ) : (
                      citasIniciales.map(cita => (
                                <tr key={cita.id_cita}>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                            {cita.mascota?.nombre ?? '—'}
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                            {formatFecha(cita.fecha)}
                          </td>
                          <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                            {cita.estado}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="cit-guide-card">
              <div className="cit-guide-header" style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)', color: '#fff', padding: '12px 16px', borderRadius: '10px 10px 0 0' }}>
                <i className="fa-solid fa-calendar-check" /> Instrucciones
              </div>
              <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px' }}>
                <p style={{ fontSize: '.88rem', color: '#475569', marginBottom: 12 }}>
                  Completa el formulario para agendar una cita y el sistema la mostrará en la lista.
                </p>
                <p style={{ fontSize: '.8rem', color: '#64748b' }}>
                  Solo se utilizarán mascotas registradas en esta clínica.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <style>{`
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
      `}</style>
    </DashboardShell>
  )
}
