'use client'

import { useActionState, useState, useTransition, type ReactNode } from 'react'
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
  proximaAplicacion: string | null,
): 'vigente' | 'por-vencer' | 'vencida' | 'sin-fecha' {
  if (!proximaAplicacion) return 'sin-fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaProxima = new Date(`${proximaAplicacion}T00:00:00`)
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
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function VacunasClient({ perfil, vacunasIniciales }: Props) {
  const router = useRouter()
  const vacunas = vacunasIniciales
  const [, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [busquedaVacuna, setBusquedaVacuna] = useState('')
  const [fechaAplicacion, setFechaAplicacion] = useState(getFechaActual())

  const vacunasFiltradas = vacunas.filter((vacuna) => {
    const query = busquedaVacuna.toLowerCase()
    return (
      vacuna.nombre.toLowerCase().includes(query) ||
      (vacuna.mascota?.nombre.toLowerCase().includes(query) ?? false)
    )
  })

  const [state, formAction, pending] = useActionState<VacunaState, FormData>(
    async (previousState, formData) => {
      const result = await registrarVacunaAction(previousState, formData)
      if (result?.success) {
        setFormKey((key) => key + 1)
        setFechaAplicacion(getFechaActual())
        startTransition(() => router.refresh())
      }
      return result
    },
    null,
  )

  const resumen = [
    {
      value: vacunas.length,
      label: 'Vacunas registradas',
      icon: 'fa-solid fa-syringe',
    },
    {
      value: vacunas.filter((vacuna) => vacuna.proxima_aplicacion).length,
      label: 'Con próxima aplicación',
      icon: 'fa-solid fa-calendar-check',
    },
    {
      value: new Set(vacunas.map((vacuna) => vacuna.id_mascota).filter(Boolean)).size,
      label: 'Pacientes vacunados',
      icon: 'fa-solid fa-paw',
    },
  ]

  return (
    <DashboardShell perfil={perfil}>
      <div className="module-page">
        <div className="module-container is-wide">
          <header className="module-header">
            <div className="module-header__identity">
              <span className="module-header__icon">
                <i className="fa-solid fa-syringe" />
              </span>
              <div>
                <span className="module-eyebrow">Seguimiento preventivo</span>
                <h1 className="module-title">Registro de Vacunas</h1>
                <p className="module-subtitle">
                  Registra las vacunas aplicadas y consulta el historial de cada paciente.
                </p>
              </div>
            </div>
          </header>

          <section className="module-overview" aria-label="Resumen de vacunación">
            {resumen.map((item) => (
              <div key={item.label} className="module-overview__item">
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
            <section className="module-workspace__section" aria-labelledby="nueva-vacuna-title">
              <div className="module-workspace__header">
                <div>
                  <h2 id="nueva-vacuna-title" className="module-workspace__title">
                    <i className="fa-solid fa-plus" aria-hidden="true" />
                    Nueva aplicación
                  </h2>
                  <p className="module-subtitle">
                    Captura los datos esenciales para actualizar el esquema del paciente.
                  </p>
                </div>
              </div>

              <form key={formKey} action={formAction}>
                {state?.error && (
                  <div className="module-alert is-error">
                    <i className="fa-solid fa-circle-exclamation" />
                    {state.error}
                  </div>
                )}
                {state?.success && (
                  <div className="module-alert is-success">
                    <i className="fa-solid fa-circle-check" />
                    Vacuna registrada correctamente.
                  </div>
                )}

                <div className="module-inline-note">
                  <i className="fa-solid fa-circle-info" aria-hidden="true" />
                  <span>
                    Nombre e ID de mascota son obligatorios. La próxima aplicación debe ser
                    posterior a la fecha aplicada.
                  </span>
                </div>

                <div className="module-form-grid">
                  <Field label="Nombre de la vacuna">
                    <input
                      name="nombre"
                      type="text"
                      placeholder="Ej. Rabia"
                      required
                      disabled={pending}
                    />
                  </Field>
                  <Field label="ID de mascota">
                    <input
                      name="id_mascota"
                      type="number"
                      min={1}
                      placeholder="Ej. 12"
                      required
                      disabled={pending}
                    />
                  </Field>
                  <Field label="Fecha de aplicación">
                    <input
                      name="fecha_aplicacion"
                      type="date"
                      value={fechaAplicacion}
                      onChange={(event) => setFechaAplicacion(event.target.value)}
                      disabled={pending}
                    />
                  </Field>
                  <Field label="Próxima aplicación">
                    <input
                      name="proxima_aplicacion"
                      type="date"
                      min={fechaAplicacion}
                      disabled={pending}
                    />
                  </Field>
                </div>

                <div className="module-form-actions">
                  <button type="submit" className="module-button is-primary" disabled={pending}>
                    {pending ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk" />
                        Guardar Vacuna
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section className="module-workspace__section" aria-labelledby="historial-vacunas-title">
              <div className="module-workspace__header">
                <div>
                  <h2 id="historial-vacunas-title" className="module-workspace__title">
                    <i className="fa-solid fa-clock-rotate-left" aria-hidden="true" />
                    Historial de vacunas
                    <span className="module-count">{vacunas.length}</span>
                  </h2>
                  <p className="module-subtitle">
                    Consulta aplicaciones anteriores y próximas fechas de seguimiento.
                  </p>
                </div>
                <div className="module-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    value={busquedaVacuna}
                    onChange={(event) => setBusquedaVacuna(event.target.value)}
                    placeholder="Buscar vacuna o paciente..."
                    aria-label="Buscar vacuna o paciente"
                  />
                </div>
              </div>

              {vacunas.length === 0 ? (
                <EmptyState
                  icon="fa-solid fa-syringe"
                  title="Aún no hay vacunas registradas"
                  description="Las nuevas aplicaciones aparecerán aquí junto con su próxima fecha."
                />
              ) : vacunasFiltradas.length === 0 ? (
                <EmptyState
                  icon="fa-solid fa-magnifying-glass"
                  title="No se encontraron vacunas"
                  description="Intenta escribir otro nombre de vacuna o paciente."
                />
              ) : (
                <div className="module-table-wrap">
                  <table className="module-table">
                    <thead>
                      <tr>
                        <th>Vacuna</th>
                        <th>Paciente</th>
                        <th>Aplicación</th>
                        <th>Próxima aplicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacunasFiltradas.map((vacuna) => (
                        <FilaVacuna key={vacuna.id_vacuna} vacuna={vacuna} />
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="module-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="module-empty">
      <i className={icon} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function FilaVacuna({ vacuna }: { vacuna: VacunaConMascota }) {
  const estado = calcularEstadoVacuna(vacuna.proxima_aplicacion)
  const estadoClass = {
    vencida: 'is-danger',
    'por-vencer': 'is-warning',
    vigente: 'is-success',
    'sin-fecha': 'is-neutral',
  }[estado]

  return (
    <tr>
      <td><strong>{vacuna.nombre}</strong></td>
      <td>
        {vacuna.mascota ? (
          <div className="module-patient">
            <span className="module-patient__avatar">
              <i className="fa-solid fa-paw" />
            </span>
            <span className="module-patient__details">
              <strong>{vacuna.mascota.nombre}</strong>
              <span>Paciente #{vacuna.mascota.id_mascota}</span>
            </span>
          </div>
        ) : (
          <span className="module-pill is-neutral">Sin paciente</span>
        )}
      </td>
      <td>{formatearFecha(vacuna.fecha_aplicacion)}</td>
      <td>
        <span className={`module-pill ${estadoClass}`}>
          {estado === 'vencida' && <i className="fa-solid fa-circle-exclamation" />}
          {estado === 'por-vencer' && <i className="fa-solid fa-clock" />}
          {estado === 'vigente' && <i className="fa-solid fa-circle-check" />}
          {formatearFecha(vacuna.proxima_aplicacion)}
        </span>
      </td>
    </tr>
  )
}
