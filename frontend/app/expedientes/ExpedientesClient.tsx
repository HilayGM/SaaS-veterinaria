'use client'

import { useActionState, useMemo, useState } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import { eliminarExpedienteAction, registrarExpedienteAction } from '@/app/actions/expedientes'
import type {
  ExpedienteConMascota,
  ExpedienteState,
  PerfilUsuario,
} from '@/app/actions/expedientes'

type Mascota = {
  id_mascota: number
  nombre: string
  especie: string
}

type Props = {
  perfil: PerfilUsuario
  expedientesIniciales: ExpedienteConMascota[]
  mascotas: Mascota[]
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function ExpedientesClient({
  perfil,
  expedientesIniciales,
  mascotas,
}: Props) {
  const [expedientes, setExpedientes] = useState(expedientesIniciales)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [formKey, setFormKey] = useState(0)

  const [altaState, altaAction, altaPending] = useActionState<ExpedienteState, FormData>(
    async (previousState, formData) => {
      const result = await registrarExpedienteAction(previousState, formData)
      if (result?.success) {
        setMostrarForm(false)
        setFormKey((key) => key + 1)
      }
      return result
    },
    null,
  )

  const expedientesFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()
    if (!query) return expedientes
    return expedientes.filter(
      (expediente) =>
        expediente.diagnostico.toLowerCase().includes(query) ||
        expediente.mascota?.nombre.toLowerCase().includes(query),
    )
  }, [expedientes, busqueda])

  const esAdmin = perfil.rol === 'Administrador'
  const resumen = [
    {
      value: expedientes.length,
      label: 'Consultas registradas',
      icon: 'fa-solid fa-notes-medical',
      tone: '',
    },
    {
      value: new Set(
        expedientes
          .map((expediente) => expediente.id_mascota)
          .filter((id): id is number => id !== null),
      ).size,
      label: 'Pacientes atendidos',
      icon: 'fa-solid fa-paw',
      tone: 'is-info',
    },
    {
      value: expedientes.filter((expediente) => expediente.tratamiento?.trim()).length,
      label: 'Con tratamiento indicado',
      icon: 'fa-solid fa-prescription-bottle-medical',
      tone: 'is-success',
    },
  ]

  return (
    <DashboardShell perfil={perfil}>
      <div className="module-page">
        <div className="module-container is-wide">
          <header className="module-header">
            <div className="module-header__identity">
              <span className="module-header__icon">
                <i className="fa-solid fa-notes-medical" />
              </span>
              <div>
                <span className="module-eyebrow">Historial clínico</span>
                <h1 className="module-title">Expedientes Médicos</h1>
                <p className="module-subtitle">
                  Consulta diagnósticos y tratamientos anteriores de cada paciente.
                </p>
              </div>
            </div>
            <div className="module-header__actions">
              <button
                type="button"
                className="module-button is-primary"
                onClick={() => setMostrarForm((visible) => !visible)}
                aria-expanded={mostrarForm}
                aria-controls="nuevo-expediente"
              >
                <i className={`fa-solid ${mostrarForm ? 'fa-xmark' : 'fa-plus'}`} />
                {mostrarForm ? 'Cerrar formulario' : 'Nueva Consulta'}
              </button>
            </div>
          </header>

          <section className="module-overview" aria-label="Resumen de expedientes">
            {resumen.map((item) => (
              <div
                key={item.label}
                className={`module-overview__item${item.tone ? ` ${item.tone}` : ''}`}
              >
                <span className="module-overview__icon" aria-hidden="true">
                  <i className={item.icon} />
                </span>
                <span className="module-overview__content">
                  <strong className="module-overview__value">{item.value}</strong>
                  <span className="module-overview__label">{item.label}</span>
                </span>
              </div>
            ))}
          </section>

          <div className="module-workspace">
            {mostrarForm && (
              <section
                id="nuevo-expediente"
                className="module-workspace__section"
                aria-labelledby="nuevo-expediente-title"
              >
                <div className="module-workspace__header">
                  <div>
                    <h2 id="nuevo-expediente-title" className="module-workspace__title">
                      <i className="fa-solid fa-file-medical" aria-hidden="true" />
                      Registrar nueva consulta
                    </h2>
                    <p className="module-subtitle">
                      Documenta el diagnóstico y las indicaciones clínicas del paciente.
                    </p>
                  </div>
                  <span className="module-workspace__step">Nuevo registro</span>
                </div>

                <form key={formKey} action={altaAction}>
                  {altaState?.error && (
                    <div className="module-alert is-error">
                      <i className="fa-solid fa-circle-exclamation" />
                      {altaState.error}
                    </div>
                  )}

                  <div className="module-inline-note">
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>
                      Paciente y diagnóstico son obligatorios. El tratamiento puede registrarse
                      ahora o quedar pendiente según la valoración médica.
                    </span>
                  </div>

                  <div className="module-form-grid is-three">
                    <div className="module-field">
                      <label htmlFor="expediente-mascota">Paciente *</label>
                      <select
                        id="expediente-mascota"
                        name="id_mascota"
                        required
                        disabled={altaPending}
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar mascota...</option>
                        {mascotas.map((mascota) => (
                          <option key={mascota.id_mascota} value={mascota.id_mascota}>
                            {mascota.nombre} ({mascota.especie})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="module-field">
                      <label htmlFor="diagnostico">Diagnóstico *</label>
                      <input
                        id="diagnostico"
                        name="diagnostico"
                        type="text"
                        required
                        placeholder="Ej. Gastroenteritis leve"
                        disabled={altaPending}
                      />
                    </div>

                    <div className="module-field">
                      <label htmlFor="tratamiento">Tratamiento</label>
                      <input
                        id="tratamiento"
                        name="tratamiento"
                        type="text"
                        placeholder="Ej. Amoxicilina 250 mg cada 8 h"
                        disabled={altaPending}
                      />
                    </div>
                  </div>

                  <div className="module-form-actions">
                    <button
                      type="button"
                      className="module-button is-secondary"
                      onClick={() => setMostrarForm(false)}
                      disabled={altaPending}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="module-button is-primary"
                      disabled={altaPending}
                    >
                      {altaPending ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-floppy-disk" />
                          Guardar consulta
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section
              className="module-workspace__section"
              aria-labelledby="historial-expedientes-title"
            >
              <div className="module-workspace__header">
                <div>
                  <h2 id="historial-expedientes-title" className="module-workspace__title">
                    <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
                    Historial clínico
                    <span className="module-count">{expedientes.length}</span>
                  </h2>
                  <p className="module-subtitle">
                    Consulta diagnósticos, tratamientos y pacientes atendidos.
                  </p>
                </div>
                <div className="module-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar por diagnóstico o mascota..."
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    aria-label="Buscar por diagnóstico o mascota"
                  />
                </div>
              </div>

              {expedientesFiltrados.length === 0 ? (
                <div className="module-empty">
                  <i className="fa-solid fa-notes-medical" />
                  <h3>
                    {expedientes.length === 0
                      ? 'Aún no hay expedientes registrados'
                      : 'No se encontraron resultados'}
                  </h3>
                  <p>
                    {expedientes.length === 0
                      ? 'Registra la primera consulta para construir el historial del paciente.'
                      : 'Prueba con otro diagnóstico o nombre de mascota.'}
                  </p>
                </div>
              ) : (
                <div className="module-table-wrap">
                  <table className="module-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>Diagnóstico</th>
                        <th>Tratamiento</th>
                        {esAdmin && <th className="module-table__actions">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {expedientesFiltrados.map((expediente) => (
                        <FilaExpediente
                          key={expediente.id_expediente}
                          expediente={expediente}
                          esAdmin={esAdmin}
                          onEliminar={() =>
                            setExpedientes((previous) =>
                              previous.filter(
                                (item) => item.id_expediente !== expediente.id_expediente,
                              ),
                            )
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function FilaExpediente({
  expediente,
  esAdmin,
  onEliminar,
}: {
  expediente: ExpedienteConMascota
  esAdmin: boolean
  onEliminar: () => void
}) {
  const [eliminarState, eliminarAction, eliminarPending] = useActionState<
    ExpedienteState,
    FormData
  >(
    async (previousState, formData) => {
      const result = await eliminarExpedienteAction(previousState, formData)
      if (result?.success) onEliminar()
      return result
    },
    null,
  )

  return (
    <tr>
      <td>{formatearFecha(expediente.fecha_consulta)}</td>
      <td>
        <div className="module-patient">
          <span className="module-patient__avatar">
            <i className="fa-solid fa-paw" />
          </span>
          <span className="module-patient__details">
            <strong>{expediente.mascota?.nombre ?? 'Sin paciente'}</strong>
            <span>{expediente.mascota?.especie ?? 'Sin especie'}</span>
          </span>
        </div>
      </td>
      <td><strong>{expediente.diagnostico}</strong></td>
      <td>{expediente.tratamiento ?? '—'}</td>
      {esAdmin && (
        <td className="module-table__actions">
          <form
            action={eliminarAction}
            onSubmit={(event) => {
              if (
                !confirm(
                  `¿Eliminar el expediente del ${formatearFecha(expediente.fecha_consulta)}?`,
                )
              ) {
                event.preventDefault()
              }
            }}
          >
            <input
              type="hidden"
              name="id_expediente"
              value={expediente.id_expediente}
            />
            <button
              type="submit"
              disabled={eliminarPending}
              className="module-action is-danger"
              title="Eliminar expediente"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </form>
          {eliminarState?.error && (
            <small className="module-field-error">{eliminarState.error}</small>
          )}
        </td>
      )}
    </tr>
  )
}
