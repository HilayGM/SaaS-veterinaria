'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useState, useTransition, type ReactNode } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import {
  actualizarRecetaAction,
  eliminarMascotaAction,
  registrarMascotaAction,
} from '@/app/actions/mascotas'
import type { MascotaConDueno, MascotaState, PerfilUsuario } from '@/app/actions/mascotas'

type Props = {
  perfil: PerfilUsuario
  mascotasIniciales: MascotaConDueno[]
}

const ESPECIES = ['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro']

function formatearFecha(fecha: string | null) {
  if (!fecha) return '—'
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function MascotasClient({ perfil, mascotasIniciales }: Props) {
  const router = useRouter()
  const [mascotasEliminadas, setMascotasEliminadas] = useState<Set<number>>(() => new Set())
  const [, startTransition] = useTransition()
  const [formKey, setFormKey] = useState(0)
  const [mascotaEditandoReceta, setMascotaEditandoReceta] = useState<MascotaConDueno | null>(null)
  const [busquedaMascota, setBusquedaMascota] = useState('')

  const mascotas = mascotasEliminadas.size === 0
    ? mascotasIniciales
    : mascotasIniciales.filter((mascota) => !mascotasEliminadas.has(mascota.id_mascota))

  const mascotasFiltradas = mascotas.filter((mascota) =>
    mascota.nombre.toLowerCase().includes(busquedaMascota.toLowerCase()),
  )

  const [state, formAction, pending] = useActionState<MascotaState, FormData>(
    async (previousState, formData) => {
      const result = await registrarMascotaAction(previousState, formData)
      if (result?.success) {
        setFormKey((key) => key + 1)
        router.refresh()
      }
      return result
    },
    null,
  )

  const resumen = [
    {
      value: mascotas.length,
      label: 'Pacientes registrados',
      icon: 'fa-solid fa-paw',
    },
    {
      value: mascotas.filter((mascota) => mascota.especie === 'Perro').length,
      label: 'Perros',
      icon: 'fa-solid fa-dog',
    },
    {
      value: mascotas.filter((mascota) => mascota.especie === 'Gato').length,
      label: 'Gatos',
      icon: 'fa-solid fa-cat',
    },
  ]

  return (
    <DashboardShell perfil={perfil}>
      <div className="module-page">
        <div className="module-container is-wide">
          <header className="module-header">
            <div className="module-header__identity">
              <span className="module-header__icon">
                <i className="fa-solid fa-paw" />
              </span>
              <div>
                <span className="module-eyebrow">Gestión de pacientes</span>
                <h1 className="module-title">Registro de Mascotas</h1>
                <p className="module-subtitle">
                  Crea el perfil clínico del paciente y vincula los datos de su propietario.
                </p>
              </div>
            </div>
          </header>

          <div className="module-overview" aria-label="Resumen de pacientes">
            {resumen.map((item) => (
              <div key={item.label} className="module-overview__item">
                <span className="module-overview__icon">
                  <i className={item.icon} />
                </span>
                <span className="module-overview__content">
                  <strong className="module-overview__value">{item.value}</strong>
                  <span className="module-overview__label">{item.label}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="module-workspace">
            <div className="module-workspace__body">
              <section className="module-workspace__section">
                <div className="module-workspace__header">
                  <div>
                    <span className="module-eyebrow">Nuevo ingreso</span>
                    <h2 className="module-workspace__title">Datos del paciente</h2>
                  </div>
                  <span className="module-workspace__step">Formulario clínico</span>
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
                      Mascota registrada correctamente.
                    </div>
                  )}

                  <div className="module-inline-note">
                    <i className="fa-solid fa-circle-info" />
                    <span>
                      Nombre, especie y propietario son obligatorios. La receta puede completarse
                      ahora o actualizarse después desde la lista.
                    </span>
                  </div>

                  <SectionTitle title="Información de la Mascota" />
                  <div className="module-form-grid">
                    <Field label="Nombre">
                      <input name="nombre" type="text" placeholder="Ej. Max" required disabled={pending} />
                    </Field>
                    <Field label="Especie">
                      <select name="especie" required disabled={pending} defaultValue="">
                        <option value="" disabled>Seleccione especie</option>
                        {ESPECIES.map((especie) => (
                          <option key={especie} value={especie}>{especie}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Raza">
                      <input name="raza" type="text" placeholder="Ej. Labrador" disabled={pending} />
                    </Field>
                    <Field label="Fecha de nacimiento">
                      <input name="fecha_nacimiento" type="date" disabled={pending} />
                    </Field>
                  </div>

                  <div className="module-section-spacer">
                    <SectionTitle title="Información del Propietario" />
                    <div className="module-form-grid">
                      <Field label="Nombre completo">
                        <input
                          name="nombre_dueno"
                          type="text"
                          placeholder="Nombre del propietario"
                          required
                          disabled={pending}
                        />
                      </Field>
                    </div>
                  </div>

                  <details className="module-disclosure module-section-spacer">
                    <summary>
                      <span>
                        <i className="fa-solid fa-prescription" />
                        Añadir receta médica inicial
                      </span>
                      <i className="fa-solid fa-chevron-down module-disclosure__chevron" />
                    </summary>
                    <div className="module-form-grid">
                      <Field label="Medicamento">
                        <input
                          name="medicamento"
                          type="text"
                          placeholder="Ej. Amoxicilina"
                          disabled={pending}
                        />
                      </Field>
                      <Field label="Dosis">
                        <input
                          name="dosis"
                          type="text"
                          placeholder="Ej. 1 tableta (500 mg)"
                          disabled={pending}
                        />
                      </Field>
                      <Field label="Frecuencia">
                        <input
                          name="frecuencia"
                          type="text"
                          placeholder="Ej. Cada 8 horas"
                          disabled={pending}
                        />
                      </Field>
                      <Field label="Duración">
                        <input
                          name="duracion"
                          type="text"
                          placeholder="Ej. 7 días"
                          disabled={pending}
                        />
                      </Field>
                    </div>
                  </details>

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
                          Guardar Paciente
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              <section className="module-workspace__section">
                <div className="module-workspace__header">
                  <div>
                    <span className="module-eyebrow">Directorio clínico</span>
                    <h2 className="module-workspace__title">Pacientes registrados</h2>
                  </div>
                  <span className="module-count">{mascotas.length}</span>
                </div>

                <div className="module-search">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="text"
                    value={busquedaMascota}
                    onChange={(event) => setBusquedaMascota(event.target.value)}
                    placeholder="Buscar mascota por nombre..."
                  />
                </div>

                {mascotas.length === 0 ? (
                  <EmptyState
                    icon="fa-solid fa-paw"
                    title="Aún no hay mascotas registradas"
                    description="Registra el primer paciente para comenzar su seguimiento clínico."
                  />
                ) : mascotasFiltradas.length === 0 ? (
                  <EmptyState
                    icon="fa-solid fa-magnifying-glass"
                    title="No se encontraron mascotas"
                    description="Intenta buscar con otro nombre."
                  />
                ) : (
                  <div className="module-table-wrap">
                    <table className="module-table">
                      <thead>
                        <tr>
                          <th>Paciente</th>
                          <th>Especie / Raza</th>
                          <th>Nacimiento</th>
                          <th>Propietario</th>
                          <th>Receta</th>
                          <th className="module-table__actions">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mascotasFiltradas.map((mascota) => (
                          <FilaMascota
                            key={mascota.id_mascota}
                            mascota={mascota}
                            onEliminar={() =>
                              startTransition(() =>
                                setMascotasEliminadas((previous) => {
                                  const next = new Set(previous)
                                  next.add(mascota.id_mascota)
                                  return next
                                }),
                              )
                            }
                            onEditarReceta={() => setMascotaEditandoReceta(mascota)}
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
      </div>

      {mascotaEditandoReceta && (
        <ModalReceta
          mascota={mascotaEditandoReceta}
          onClose={() => setMascotaEditandoReceta(null)}
          onSaved={() => {
            setMascotaEditandoReceta(null)
            router.refresh()
          }}
        />
      )}
    </DashboardShell>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="module-section-title">
      <h2>{title}</h2>
    </div>
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

function FilaMascota({
  mascota,
  onEliminar,
  onEditarReceta,
}: {
  mascota: MascotaConDueno
  onEliminar: () => void
  onEditarReceta: () => void
}) {
  const [, formActionEliminar, pendingEliminar] = useActionState<MascotaState, FormData>(
    async (previousState, formData) => {
      const result = await eliminarMascotaAction(previousState, formData)
      if (result?.success) onEliminar()
      return result
    },
    null,
  )

  return (
    <tr>
      <td>
        <div className="module-patient">
          <span className="module-patient__avatar">
            <i className="fa-solid fa-paw" />
          </span>
          <span className="module-patient__details">
            <strong>{mascota.nombre}</strong>
            <span>Paciente #{mascota.id_mascota}</span>
          </span>
        </div>
      </td>
      <td>
        <span className="module-pill">{mascota.especie}</span>
        {mascota.raza && <span> · {mascota.raza}</span>}
      </td>
      <td>{formatearFecha(mascota.fecha_nacimiento)}</td>
      <td>{mascota.dueno?.nombre ?? '—'}</td>
      <td>
        <button type="button" className="module-action is-success" onClick={onEditarReceta}>
          <i className="fa-solid fa-notes-medical" />
          Receta
        </button>
      </td>
      <td className="module-table__actions">
        <div className="module-action-group">
          <Link
            href={`/expedientes?idMascota=${mascota.id_mascota}`}
            className="module-action"
          >
            <i className="fa-solid fa-clock-rotate-left" />
            Historial
          </Link>
          <Link href={`/vacunas?idMascota=${mascota.id_mascota}`} className="module-action">
            <i className="fa-solid fa-syringe" />
            Vacunas
          </Link>
          <form
            action={formActionEliminar}
            onSubmit={(event) => {
              if (!confirm(`¿Eliminar a "${mascota.nombre}"?`)) event.preventDefault()
            }}
          >
            <input type="hidden" name="id_mascota" value={mascota.id_mascota} />
            <button
              type="submit"
              disabled={pendingEliminar}
              className="module-action is-danger"
              title="Eliminar paciente"
            >
              <i className="fa-solid fa-trash" />
            </button>
          </form>
        </div>
      </td>
    </tr>
  )
}

function ModalReceta({
  mascota,
  onClose,
  onSaved,
}: {
  mascota: MascotaConDueno
  onClose: () => void
  onSaved: () => void
}) {
  const [recetaState, formActionReceta, pendingReceta] = useActionState<MascotaState, FormData>(
    async (previousState, formData) => {
      const result = await actualizarRecetaAction(previousState, formData)
      if (result?.success) onSaved()
      return result
    },
    null,
  )

  return (
    <div className="module-modal-overlay">
      <div className="module-modal">
        <h2 className="module-modal__title">
          <i className="fa-solid fa-prescription" />
          Receta Médica
        </h2>
        <p className="module-modal__subtitle">
          Paciente: <strong>{mascota.nombre}</strong>
        </p>

        <form action={formActionReceta}>
          {recetaState?.error && (
            <div className="module-alert is-error">
              <i className="fa-solid fa-circle-exclamation" />
              {recetaState.error}
            </div>
          )}

          <input type="hidden" name="id_mascota" value={mascota.id_mascota} />

          <div className="module-stack">
            <Field label="Medicamento">
              <input
                name="medicamento"
                type="text"
                defaultValue={mascota.medicamento ?? ''}
                disabled={pendingReceta}
              />
            </Field>
            <div className="module-form-grid">
              <Field label="Dosis">
                <input
                  name="dosis"
                  type="text"
                  defaultValue={mascota.dosis ?? ''}
                  disabled={pendingReceta}
                />
              </Field>
              <Field label="Frecuencia">
                <input
                  name="frecuencia"
                  type="text"
                  defaultValue={mascota.frecuencia ?? ''}
                  disabled={pendingReceta}
                />
              </Field>
            </div>
            <Field label="Duración">
              <input
                name="duracion"
                type="text"
                defaultValue={mascota.duracion ?? ''}
                disabled={pendingReceta}
              />
            </Field>
          </div>

          <div className="module-form-actions">
            <button
              type="button"
              className="module-button is-secondary"
              onClick={onClose}
              disabled={pendingReceta}
            >
              Cancelar
            </button>
            <button type="submit" className="module-button is-primary" disabled={pendingReceta}>
              {pendingReceta ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
