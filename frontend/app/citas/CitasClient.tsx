'use client'

import { useActionState, useMemo, useState } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import type { PerfilUsuario } from '@/app/actions/inventario'
import type { CitaConMascota, CitaState } from '@/app/actions/citas'
import {
  agendarCitaAction,
  cambiarEstadoCitaAction,
  getCitas,
} from '@/app/actions/citas'

type Mascota = {
  id_mascota: number
  nombre: string
  especie: string
}

type Props = {
  perfil: PerfilUsuario
  initialCitas: CitaConMascota[]
  mascotas: Mascota[]
}

function formatFecha(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function CitasClient({ perfil, initialCitas, mascotas }: Props) {
  const [citas, setCitas] = useState<CitaConMascota[]>(initialCitas)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [menuId, setMenuId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const canEdit = perfil.rol === 'Veterinario' || perfil.rol === 'Administrador'

  const [altaState, altaAction, altaPending] = useActionState<CitaState, FormData>(
    async (previousState, formData) => {
      const result = await agendarCitaAction(previousState, formData)
      if (result?.success) {
        setMostrarForm(false)
        setFormKey((key) => key + 1)
        setCitas(await getCitas())
      }
      return result
    },
    null,
  )

  const handleRefresh = async () => {
    setLoading(true)
    setActionError(null)
    setCitas(await getCitas())
    setLoading(false)
  }

  const handleCambiarEstado = async (
    idCita: number,
    nuevoEstado: 'Completada' | 'Cancelada',
  ) => {
    setLoadingId(idCita)
    setActionError(null)
    setMenuId(null)
    const result = await cambiarEstadoCitaAction(idCita, nuevoEstado)

    if (result.error) {
      setActionError(result.error)
    } else {
      setCitas((previous) =>
        previous.map((cita) =>
          cita.id_cita === idCita ? { ...cita, estado: nuevoEstado } : cita,
        ),
      )
    }
    setLoadingId(null)
  }

  const citasFiltradas = useMemo(() => {
    if (!searchTerm) return citas
    const query = searchTerm.toLowerCase()
    return citas.filter(
      (cita) =>
        cita.mascota_nombre.toLowerCase().includes(query) ||
        cita.propietario_nombre.toLowerCase().includes(query),
    )
  }, [citas, searchTerm])

  const stats = useMemo(
    () => ({
      total: citas.length,
      completadas: citas.filter((cita) => cita.estado === 'Completada').length,
      pendientes: citas.filter((cita) => cita.estado === 'Pendiente').length,
    }),
    [citas],
  )

  const resumen = [
    {
      icon: 'fa-solid fa-calendar-days',
      value: stats.total,
      label: 'Total de citas',
      variant: '',
    },
    {
      icon: 'fa-solid fa-circle-check',
      value: stats.completadas,
      label: 'Citas completadas',
      variant: 'is-success',
    },
    {
      icon: 'fa-solid fa-clock',
      value: stats.pendientes,
      label: 'Citas pendientes',
      variant: 'is-warning',
    },
  ]

  return (
    <DashboardShell perfil={perfil}>
      <div className="module-page">
        <div className="module-container is-wide">
          <header className="module-header">
            <div className="module-header__identity">
              <span className="module-header__icon">
                <i className="fa-solid fa-calendar-check" />
              </span>
              <div>
                <span className="module-eyebrow">Agenda clínica</span>
                <h1 className="module-title">Gestión de Citas</h1>
                <p className="module-subtitle">
                  {stats.total} citas registradas · {stats.pendientes} pendientes
                </p>
              </div>
            </div>
            <div className="module-header__actions">
              <button
                type="button"
                className="module-button is-primary"
                onClick={() => setMostrarForm((visible) => !visible)}
              >
                <i className={`fa-solid ${mostrarForm ? 'fa-xmark' : 'fa-plus'}`} />
                {mostrarForm ? 'Cerrar formulario' : 'Nueva Cita'}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="module-button is-secondary is-icon"
                title="Actualizar citas"
              >
                <i className={`fa-solid fa-rotate${loading ? ' module-spin' : ''}`} />
              </button>
            </div>
          </header>

          {actionError && (
            <div className="module-alert is-error">
              <i className="fa-solid fa-circle-exclamation" />
              {actionError}
            </div>
          )}

          <section className="module-overview" aria-label="Resumen de citas">
            {resumen.map((item) => (
              <div
                key={item.label}
                className={`module-overview__item ${item.variant}`.trim()}
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
                className="module-workspace__section"
                aria-labelledby="nueva-cita-title"
              >
                <div className="module-workspace__header">
                  <div>
                    <h2 id="nueva-cita-title" className="module-workspace__title">
                      <i className="fa-solid fa-calendar-plus" aria-hidden="true" />
                      Agendar nueva cita
                    </h2>
                    <p className="module-subtitle">
                      Selecciona al paciente y reserva un espacio en la agenda clínica.
                    </p>
                  </div>
                  <span className="module-workspace__step">Nueva reservación</span>
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
                      El paciente y la fecha son obligatorios. Solo puedes agendar horarios
                      futuros.
                    </span>
                  </div>

                  <div className="module-form-grid">
                    <div className="module-field">
                      <label htmlFor="cita-mascota">Mascota *</label>
                      <select
                        id="cita-mascota"
                        name="id_mascota"
                        required
                        disabled={altaPending}
                        defaultValue=""
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {mascotas.map((mascota) => (
                          <option key={mascota.id_mascota} value={mascota.id_mascota}>
                            {mascota.nombre} ({mascota.especie})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="module-field">
                      <label htmlFor="cita-fecha">Fecha y hora *</label>
                      <input
                        id="cita-fecha"
                        name="fecha"
                        type="datetime-local"
                        required
                        disabled={altaPending}
                        min={new Date().toISOString().slice(0, 16)}
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
                          <i className="fa-solid fa-rotate module-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check" />
                          Guardar cita
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section
              className="module-workspace__section"
              aria-labelledby="historial-citas-title"
            >
              <div className="module-workspace__header">
                <div>
                  <h2 id="historial-citas-title" className="module-workspace__title">
                    <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
                    Historial de citas
                    <span className="module-count">{citas.length}</span>
                  </h2>
                  <p className="module-subtitle">
                    Consulta la agenda y actualiza el estado de cada atención.
                  </p>
                </div>
                <div className="module-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar paciente o propietario..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label="Buscar paciente o propietario"
                  />
                </div>
              </div>

              {citasFiltradas.length === 0 ? (
                <div className="module-empty">
                  <i className="fa-solid fa-calendar-days" />
                  <h3>{citas.length === 0 ? 'No hay citas registradas' : 'No hay resultados'}</h3>
                  <p>
                    {citas.length === 0
                      ? 'Agenda la primera cita para comenzar a organizar la atención clínica.'
                      : 'Prueba con otro paciente o propietario.'}
                  </p>
                </div>
              ) : (
                <div className="module-table-wrap">
                  <table className="module-table">
                    <thead>
                      <tr>
                        <th>Paciente / Propietario</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                        <th className="module-table__actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasFiltradas.map((cita) => {
                        const estado = {
                          Pendiente: {
                            className: 'is-info',
                            icon: 'fa-solid fa-clock',
                            label: 'Pendiente',
                          },
                          Completada: {
                            className: 'is-success',
                            icon: 'fa-solid fa-circle-check',
                            label: 'Completada',
                          },
                          Cancelada: {
                            className: 'is-danger',
                            icon: 'fa-solid fa-circle-xmark',
                            label: 'Cancelada',
                          },
                        }[cita.estado] ?? {
                          className: 'is-info',
                          icon: 'fa-solid fa-clock',
                          label: 'Pendiente',
                        }

                        return (
                          <tr key={cita.id_cita}>
                            <td>
                              <div className="module-patient">
                                <span className="module-patient__avatar">
                                  <i className="fa-solid fa-paw" />
                                </span>
                                <span className="module-patient__details">
                                  <strong>{cita.mascota_nombre}</strong>
                                  <span>{cita.propietario_nombre}</span>
                                </span>
                              </div>
                            </td>
                            <td>{formatFecha(cita.fecha)}</td>
                            <td><strong>{formatHora(cita.fecha)}</strong></td>
                            <td>
                              <span className={`module-pill ${estado.className}`}>
                                <i className={estado.icon} />
                                {estado.label}
                              </span>
                            </td>
                            <td className="module-table__actions">
                              <div className="module-menu">
                                <button
                                  type="button"
                                  className="module-menu__button"
                                  onClick={() =>
                                    setMenuId(menuId === cita.id_cita ? null : cita.id_cita)
                                  }
                                  title="Acciones de la cita"
                                >
                                  <i
                                    className={
                                      loadingId === cita.id_cita
                                        ? 'fa-solid fa-rotate module-spin'
                                        : 'fa-solid fa-ellipsis-vertical'
                                    }
                                  />
                                </button>

                                {menuId === cita.id_cita &&
                                  cita.estado === 'Pendiente' &&
                                  canEdit && (
                                    <div className="module-menu__dropdown">
                                      <button
                                        type="button"
                                        className="module-menu__item is-success"
                                        onClick={() =>
                                          handleCambiarEstado(cita.id_cita, 'Completada')
                                        }
                                      >
                                        <i className="fa-solid fa-check" />
                                        Completar
                                      </button>
                                      <button
                                        type="button"
                                        className="module-menu__item is-danger"
                                        onClick={() =>
                                          handleCambiarEstado(cita.id_cita, 'Cancelada')
                                        }
                                      >
                                        <i className="fa-solid fa-xmark" />
                                        Cancelar
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
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
