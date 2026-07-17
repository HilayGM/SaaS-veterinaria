'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardShell from '@/app/components/DashboardShell'
import { registrarExpedienteAction } from '@/app/actions/expedientes'
import type { ExpedienteConMascota, ExpedienteState, MascotaExpediente, PerfilUsuario } from '@/app/actions/expedientes'
import type { ProductoInventario } from '@/app/actions/inventario'

type Props = {
  perfil: PerfilUsuario
  expedientesIniciales: ExpedienteConMascota[]
  mascotas: MascotaExpediente[]
  productosInventario: ProductoInventario[]
}

type InsumoFormRow = {
  id: string
}

function getFechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return '---'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function ExpedientesClient({ perfil, expedientesIniciales, mascotas, productosInventario }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idMascotaParam = searchParams.get('idMascota')
  const idMascota = idMascotaParam ? Number(idMascotaParam) : null
  const usandoFiltroMascota = idMascotaParam !== null && !Number.isNaN(idMascota)
  const expedientes = usandoFiltroMascota
    ? expedientesIniciales.filter(expediente => expediente.id_mascota === idMascota)
    : expedientesIniciales
  const [, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [busquedaExpediente, setBusquedaExpediente] = useState('')
  const [fechaConsulta, setFechaConsulta] = useState(getFechaActual())
  const [insumos, setInsumos] = useState<InsumoFormRow[]>([])

  const expedientesFiltrados = expedientes.filter(e => {
    const q = busquedaExpediente.toLowerCase()
    return (
      e.diagnostico.toLowerCase().includes(q) ||
      (e.tratamiento?.toLowerCase().includes(q) ?? false) ||
      (e.mascota?.nombre.toLowerCase().includes(q) ?? false)
    )
  })

  const [state, formAction, pending] = useActionState<ExpedienteState, FormData>(
    async (prev, formData) => {
      const result = await registrarExpedienteAction(prev, formData)
      if (result?.success) {
        setFormKey(k => k + 1)
        setFechaConsulta(getFechaActual())
        setInsumos([])
        startTransition(() => {
          router.refresh()
        })
      }
      return result
    },
    null
  )

  function agregarInsumo() {
    setInsumos(filas => [...filas, { id: `${Date.now()}-${filas.length}` }])
  }

  function eliminarInsumo(id: string) {
    setInsumos(filas => filas.filter(fila => fila.id !== id))
  }

  return (
    <DashboardShell perfil={perfil}>
      <div style={{ padding: '36px 40px 60px', minWidth: 0 }}>

        {/* Encabezado */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Registro de Expedientes
          </h1>
          <p style={{ color: '#64748b', fontSize: '.9rem' }}>
            Registra diagnosticos y tratamientos para mantener el historial clinico de cada paciente.
          </p>
        </div>

        {/* Grid: formulario + guia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>

          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Formulario */}
            <div className="exp-card">
              <form key={formKey} action={formAction}>

                {state?.error && (
                  <div className="exp-alert exp-alert-error">
                    <i className="fa-solid fa-circle-exclamation" /> {state.error}
                  </div>
                )}
                {state?.success && (
                  <div className="exp-alert exp-alert-success">
                    <i className="fa-solid fa-circle-check" /> Expediente registrado correctamente.
                  </div>
                )}

                <SectionTitle title="Informacion del Expediente" />
                <div className="exp-form-grid">
                  <Field label="MASCOTA">
                    <select name="id_mascota" required disabled={pending || mascotas.length === 0} defaultValue="">
                      <option value="" disabled>Selecciona una mascota</option>
                      {mascotas.map(m => (
                        <option key={m.id_mascota} value={m.id_mascota}>
                          {m.nombre} - {m.especie}{m.raza ? ` (${m.raza})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="FECHA DE CONSULTA">
                    <input
                      name="fecha_consulta"
                      type="date"
                      value={fechaConsulta}
                      onChange={e => setFechaConsulta(e.target.value)}
                      disabled={pending}
                    />
                  </Field>
                  <Field label="DIAGNOSTICO">
                    <input name="diagnostico" type="text" placeholder="Ej. Dermatitis alergica" required disabled={pending} />
                  </Field>
                  <Field label="TRATAMIENTO">
                    <input name="tratamiento" type="text" placeholder="Ej. Antihistaminico por 7 dias" disabled={pending} />
                  </Field>
                </div>

                <div className="exp-insumos-section">
                  <div className="exp-insumos-title-row">
                    <SectionTitle title="Insumos utilizados" />
                    <button
                      type="button"
                      className="exp-btn-secondary"
                      onClick={agregarInsumo}
                      disabled={pending || productosInventario.length === 0}
                    >
                      <i className="fa-solid fa-plus" /> Agregar insumo
                    </button>
                  </div>

                  {productosInventario.length === 0 ? (
                    <p className="exp-insumos-empty">No hay productos disponibles en inventario.</p>
                  ) : insumos.length === 0 ? (
                    <p className="exp-insumos-empty">Agrega los productos utilizados durante la consulta si corresponde.</p>
                  ) : (
                    <div className="exp-insumos-list">
                      {insumos.map((insumo, index) => (
                        <div key={insumo.id} className="exp-insumo-row">
                          <Field label={`PRODUCTO ${index + 1}`}>
                            <select name="id_producto_insumo" required disabled={pending} defaultValue="">
                              <option value="" disabled>Selecciona un producto</option>
                              {productosInventario.map(producto => (
                                <option key={producto.id_producto} value={producto.id_producto}>
                                  {producto.nombre} - stock {producto.cantidad}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="CANTIDAD">
                            <input
                              name="cantidad_usada_insumo"
                              type="number"
                              min={1}
                              step={1}
                              required
                              defaultValue={1}
                              disabled={pending}
                            />
                          </Field>
                          <button
                            type="button"
                            className="exp-btn-remove"
                            onClick={() => eliminarInsumo(insumo.id)}
                            disabled={pending}
                            title="Eliminar insumo"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="submit" className="exp-btn-primary" disabled={pending || mascotas.length === 0}>
                    {pending
                      ? <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</>
                      : <><i className="fa-solid fa-floppy-disk" /> Guardar Expediente</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Tabla de expedientes */}
            <div className="exp-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-notes-medical" />
                Expedientes registrados
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                  {expedientes.length}
                </span>
              </h3>

              <div className="exp-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  value={busquedaExpediente}
                  onChange={e => setBusquedaExpediente(e.target.value)}
                  placeholder="Buscar diagnostico o paciente..."
                />
              </div>

              {expedientes.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="fa-solid fa-notes-medical" style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }} />
                  <p style={{ fontSize: '.88rem' }}>
                    {usandoFiltroMascota
                      ? 'Esta mascota aún no tiene expedientes registrados.'
                      : 'Aun no hay expedientes registrados en esta clinica.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  {expedientesFiltrados.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', background: '#fff' }}>
                      <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '1.8rem', display: 'block', marginBottom: 10 }} />
                      <p style={{ fontSize: '.88rem', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>
                        No se encontraron expedientes con ese criterio.
                      </p>
                      <p style={{ fontSize: '.8rem' }}>Intenta escribir otro diagnostico, tratamiento o paciente.</p>
                    </div>
                  ) : (
                    <table className="exp-table">
                      <thead>
                        <tr>
                          <th>Diagnostico</th>
                          <th>Paciente</th>
                          <th>Tratamiento</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expedientesFiltrados.map(e => (
                          <FilaExpediente key={e.id_expediente} expediente={e} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guia de registro */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="exp-guide-card">
              <div className="exp-guide-header" style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
                <i className="fa-solid fa-circle-info" /> Guia de Registro
              </div>
              <div className="exp-guide-body">
                <p>Selecciona la mascota atendida y registra el diagnostico de la consulta.</p>
                <p>Los campos <strong>Mascota</strong> y <strong>Diagnostico</strong> son obligatorios.</p>
                <p>La fecha se completa automaticamente con el dia actual.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#0891b2', fontSize: '.8rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginTop: 2 }} />
                  El servidor valida que la mascota pertenezca a tu clinica.
                </div>
              </div>
            </div>

            <div className="exp-guide-card">
              <div className="exp-guide-header" style={{ background: 'linear-gradient(135deg,#010b2f,#001f73)' }}>
                <i className="fa-solid fa-chart-pie" /> Resumen
              </div>
              <div className="exp-guide-body">
                {[
                  { val: expedientes.length, label: 'Expedientes registrados' },
                  { val: new Set(expedientes.map(e => e.id_mascota).filter(Boolean)).size, label: 'Pacientes con historial' },
                  { val: mascotas.length, label: 'Mascotas disponibles' },
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
        .exp-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 28px;
          font-family: 'Poppins', sans-serif;
        }
        .exp-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .exp-field { display: flex; flex-direction: column; gap: 6px; }
        .exp-field label { font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: #64748b; }
        .exp-field input, .exp-field select {
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
        .exp-field input:focus, .exp-field select:focus { border-color: #22d3ee; background: #fff; }
        .exp-field input:disabled, .exp-field select:disabled { opacity: .6; }
        .exp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #22d3ee; color: #0c1526;
          border: none; padding: 13px 28px; border-radius: 12px;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: .9rem;
          cursor: pointer;
        }
        .exp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .exp-btn-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #f8fafc; color: #0f172a;
          border: 1.5px solid #e2e8f0; padding: 10px 16px; border-radius: 10px;
          font-family: 'Poppins', sans-serif; font-weight: 700; font-size: .82rem;
          cursor: pointer; white-space: nowrap;
        }
        .exp-btn-secondary:disabled { opacity: .6; cursor: not-allowed; }
        .exp-insumos-section {
          margin-top: 26px; padding-top: 24px; border-top: 1px solid #f1f5f9;
        }
        .exp-insumos-title-row {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 4px;
        }
        .exp-insumos-empty {
          font-size: .82rem; color: #64748b; background: #f8fafc;
          border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 14px;
        }
        .exp-insumos-list { display: flex; flex-direction: column; gap: 12px; }
        .exp-insumo-row {
          display: grid; grid-template-columns: minmax(220px, 1fr) 140px 38px;
          gap: 12px; align-items: end;
        }
        .exp-btn-remove {
          width: 38px; height: 42px; border: 1.5px solid #fee2e2; border-radius: 10px;
          background: #fef2f2; color: #dc2626; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .exp-btn-remove:disabled { opacity: .6; cursor: not-allowed; }
        .exp-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px; border-radius: 10px; font-size: .85rem; margin-bottom: 20px;
        }
        .exp-alert-error  { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }
        .exp-alert-success { background: #f0fdf4; border: 1px solid #86efac; color: #16a34a; }
        .exp-search {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; margin-bottom: 16px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; color: #94a3b8;
        }
        .exp-search:focus-within { border-color: #22d3ee; background: #fff; }
        .exp-search input {
          border: none; outline: none; background: transparent;
          width: 100%; font-family: 'Poppins', sans-serif;
          font-size: .88rem; color: #0f172a;
        }
        .exp-search input::placeholder { color: #94a3b8; }
        .exp-table { width: 100%; border-collapse: collapse; font-size: .85rem; font-family: 'Poppins', sans-serif; }
        .exp-table th {
          padding: 12px 16px; text-align: left; background: #f8fafc;
          color: #64748b; font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .exp-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
        .exp-table tr:last-child td { border-bottom: none; }
        .exp-patient-pill {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(34,211,238,.1); color: #0891b2;
          font-size: .72rem; font-weight: 600; padding: 3px 9px; border-radius: 99px;
        }
        .exp-guide-card { border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }
        .exp-guide-header {
          color: white; padding: 14px 18px; font-weight: 700; font-size: .9rem;
          display: flex; align-items: center; gap: 8px; font-family: 'Poppins', sans-serif;
        }
        .exp-guide-body {
          background: white; padding: 18px;
          display: flex; flex-direction: column; gap: 12px;
          font-family: 'Poppins', sans-serif;
        }
        .exp-guide-body p { font-size: .82rem; color: #475569; line-height: 1.6; }
        .exp-section-title {
          display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
        }
        .exp-section-bar { width: 4px; height: 22px; border-radius: 4px; background: #22d3ee; flex-shrink: 0; }
        .exp-section-title h2 { font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0; }

        @media (max-width: 900px) {
          .exp-form-grid { grid-template-columns: 1fr; }
          .exp-insumos-title-row { flex-direction: column; align-items: stretch; }
          .exp-insumo-row { grid-template-columns: 1fr; }
          .exp-btn-remove { width: 100%; }
        }
      `}</style>
    </DashboardShell>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="exp-section-title">
      <span className="exp-section-bar" />
      <h2>{title}</h2>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="exp-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function FilaExpediente({ expediente }: { expediente: ExpedienteConMascota }) {
  return (
    <tr>
      <td><strong>{expediente.diagnostico}</strong></td>
      <td>
        {expediente.mascota ? (
          <>
            <span className="exp-patient-pill">
              <i className="fa-solid fa-paw" /> {expediente.mascota.nombre}
            </span>
            <span style={{ color: '#64748b', fontSize: '.78rem', marginLeft: 6 }}>
              #{expediente.mascota.id_mascota}
            </span>
          </>
        ) : (
          <span style={{ color: '#94a3b8' }}>---</span>
        )}
      </td>
      <td style={{ color: '#64748b', fontSize: '.82rem' }}>{expediente.tratamiento ?? '---'}</td>
      <td style={{ color: '#64748b', fontSize: '.82rem' }}>{formatearFecha(expediente.fecha_consulta)}</td>
    </tr>
  )
}
