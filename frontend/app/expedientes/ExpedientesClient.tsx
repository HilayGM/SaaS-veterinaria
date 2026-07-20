'use client'

import { useActionState, useState, useMemo } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import { registrarExpedienteAction, eliminarExpedienteAction } from '@/app/actions/expedientes'
import type { ExpedienteState, ExpedienteConMascota, PerfilUsuario } from '@/app/actions/expedientes'

type Mascota = { id_mascota: number; nombre: string; especie: string }

type Props = {
  perfil: PerfilUsuario
  expedientesIniciales: ExpedienteConMascota[]
  mascotas: Mascota[]
}

function formatearFecha(fecha: string) {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function ExpedientesClient({ perfil, expedientesIniciales, mascotas }: Props) {
  const [expedientes, setExpedientes] = useState(expedientesIniciales)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [formKey, setFormKey] = useState(0)

  const [altaState, altaAction, altaPending] = useActionState<ExpedienteState, FormData>(
    async (prev, formData) => {
      const result = await registrarExpedienteAction(prev, formData)
      if (result?.success) {
        setMostrarForm(false)
        setFormKey(k => k + 1)
        // Recargar expedientes desde el servidor no es necesario en dev
        // revalidatePath se encarga al navegar
      }
      return result
    },
    null
  )

  const expedientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return expedientes
    return expedientes.filter(e =>
      e.diagnostico.toLowerCase().includes(q) ||
      e.mascota?.nombre.toLowerCase().includes(q)
    )
  }, [expedientes, busqueda])

  const esAdmin = perfil.rol === 'Administrador'

  return (
    <DashboardShell perfil={perfil}>
      <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Poppins', sans-serif" }}>

        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              <i className="fa-solid fa-notes-medical" style={{ color: '#22d3ee', marginRight: '10px' }} />
              Expedientes Médicos
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Historial clínico de los pacientes de tu clínica
            </p>
          </div>
          <button
            onClick={() => setMostrarForm(v => !v)}
            style={{ background: '#001f73', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-plus" /> Nueva Consulta
          </button>
        </div>

        {/* Formulario de alta */}
        {mostrarForm && (
          <form key={formKey} action={altaAction} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ color: '#0f172a', margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700 }}>
              <i className="fa-solid fa-file-medical" style={{ color: '#22d3ee', marginRight: '8px' }} />
              Registrar nueva consulta
            </h3>

            {altaState?.error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-circle-exclamation" /> {altaState.error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Paciente *</label>
                <select name="id_mascota" required disabled={altaPending}
                  style={{ padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', background: '#f8fafc', outline: 'none' }}>
                  <option value="">Seleccionar mascota...</option>
                  {mascotas.map(m => (
                    <option key={m.id_mascota} value={m.id_mascota}>{m.nombre} ({m.especie})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Diagnóstico *</label>
                <input name="diagnostico" type="text" required placeholder="Ej. Gastroenteritis leve" disabled={altaPending}
                  style={{ padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', background: '#f8fafc', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Tratamiento</label>
                <input name="tratamiento" type="text" placeholder="Ej. Amoxicilina 250mg cada 8h" disabled={altaPending}
                  style={{ padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', background: '#f8fafc', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setMostrarForm(false)} disabled={altaPending}
                style={{ background: 'transparent', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '10px 18px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontWeight: 500, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={altaPending}
                style={{ background: '#001f73', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontFamily: "'Poppins', sans-serif", fontWeight: 600, cursor: altaPending ? 'not-allowed' : 'pointer', opacity: altaPending ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {altaPending ? <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</> : <><i className="fa-solid fa-floppy-disk" /> Guardar consulta</>}
              </button>
            </div>
          </form>
        )}

        {/* Buscador */}
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', maxWidth: '360px' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: '#94a3b8' }} />
          <input type="text" placeholder="Buscar por diagnóstico o mascota..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ border: 'none', outline: 'none', fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', width: '100%', background: 'transparent' }} />
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {expedientesFiltrados.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <i className="fa-solid fa-notes-medical" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }} />
              <p style={{ margin: 0 }}>{expedientes.length === 0 ? 'Aún no hay expedientes registrados.' : 'No se encontraron resultados.'}</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Fecha', 'Paciente', 'Diagnóstico', 'Tratamiento', ...(esAdmin ? [''] : [])].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 18px', background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e2e8f0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expedientesFiltrados.map(exp => (
                  <FilaExpediente
                    key={exp.id_expediente}
                    exp={exp}
                    esAdmin={esAdmin}
                    onEliminar={() => setExpedientes(prev => prev.filter(e => e.id_expediente !== exp.id_expediente))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function FilaExpediente({ exp, esAdmin, onEliminar }: {
  exp: ExpedienteConMascota
  esAdmin: boolean
  onEliminar: () => void
}) {
  const [elimState, elimAction, elimPending] = useActionState<ExpedienteState, FormData>(
    async (prev, formData) => {
      const result = await eliminarExpedienteAction(prev, formData)
      if (result?.success) onEliminar()
      return result
    },
    null
  )

  const tdStyle = { padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#0f172a', verticalAlign: 'middle' as const }

  return (
    <tr style={{ transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}>
      <td style={{ ...tdStyle, whiteSpace: 'nowrap' as const }}>{formatearFecha(exp.fecha_consulta)}</td>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-paw" style={{ color: '#22d3ee', fontSize: '0.8rem' }} />
          <strong>{exp.mascota?.nombre ?? '—'}</strong>
          {exp.mascota && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>({exp.mascota.especie})</span>}
        </div>
      </td>
      <td style={tdStyle}>{exp.diagnostico}</td>
      <td style={{ ...tdStyle, color: '#475569' }}>{exp.tratamiento ?? '—'}</td>
      {esAdmin && (
        <td style={{ ...tdStyle, textAlign: 'right' as const }}>
          <form action={elimAction}
            onSubmit={e => { if (!confirm(`¿Eliminar el expediente del ${formatearFecha(exp.fecha_consulta)}?`)) e.preventDefault() }}>
            <input type="hidden" name="id_expediente" value={exp.id_expediente} />
            <button type="submit" disabled={elimPending} title="Eliminar expediente"
              style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.95rem', padding: '6px' }}>
              <i className="fa-solid fa-trash" />
            </button>
          </form>
          {elimState?.error && (
            <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>{elimState.error}</div>
          )}
        </td>
      )}
    </tr>
  )
}
