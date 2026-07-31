'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useMemo, useState, useTransition } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import {
  agregarProductoAction,
  ajustarStockAction,
  eliminarProductoAction,
} from '@/app/actions/inventario'
import type {
  InventarioState,
  PerfilUsuario,
  ProductoInventario,
} from '@/app/actions/inventario'

type Props = {
  perfil: PerfilUsuario
  productosIniciales: ProductoInventario[]
}

const DIAS_ALERTA_CADUCIDAD = 30

function estadoCaducidad(fecha: string | null): 'sin-fecha' | 'vencido' | 'por-vencer' | 'ok' {
  if (!fecha) return 'sin-fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaCaducidad = new Date(`${fecha}T00:00:00`)
  const diferencia = Math.floor((fechaCaducidad.getTime() - hoy.getTime()) / 86_400_000)
  if (diferencia < 0) return 'vencido'
  if (diferencia <= DIAS_ALERTA_CADUCIDAD) return 'por-vencer'
  return 'ok'
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return 'Sin fecha'
  const [year, month, day] = fecha.split('-')
  return `${day}/${month}/${year}`
}

export default function InventarioClient({ perfil, productosIniciales }: Props) {
  const router = useRouter()
  const [productosLocales, setProductosLocales] = useState<Record<number, ProductoInventario | null>>({})
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormAlta, setMostrarFormAlta] = useState(false)
  const [, startTransition] = useTransition()

  const [altaState, altaFormAction, altaPending] = useActionState<InventarioState, FormData>(
    async (previousState, formData) => {
      const result = await agregarProductoAction(previousState, formData)
      if (result?.success) {
        setMostrarFormAlta(false)
        startTransition(() => router.refresh())
      }
      return result
    },
    null,
  )

  const productos = useMemo(
    () =>
      productosIniciales
        .map((producto) =>
          Object.prototype.hasOwnProperty.call(productosLocales, producto.id_producto)
            ? productosLocales[producto.id_producto]
            : producto,
        )
        .filter((producto): producto is ProductoInventario => producto !== null),
    [productosIniciales, productosLocales],
  )

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()
    if (!query) return productos
    return productos.filter((producto) => producto.nombre.toLowerCase().includes(query))
  }, [productos, busqueda])

  const vencidos = productos.filter(
    (producto) => estadoCaducidad(producto.fecha_caducidad) === 'vencido',
  ).length
  const porVencer = productos.filter(
    (producto) => estadoCaducidad(producto.fecha_caducidad) === 'por-vencer',
  ).length
  const resumen = [
    {
      value: productos.length,
      label: 'Productos registrados',
      icon: 'fa-solid fa-pills',
      variant: '',
    },
    {
      value: porVencer,
      label: `Por caducar (≤ ${DIAS_ALERTA_CADUCIDAD} días)`,
      icon: 'fa-solid fa-triangle-exclamation',
      variant: 'is-warning',
    },
    {
      value: vencidos,
      label: 'Productos caducados',
      icon: 'fa-solid fa-skull-crossbones',
      variant: 'is-danger',
    },
  ]

  return (
    <DashboardShell perfil={perfil}>
      <div className="module-page">
        <div className="module-container is-wide">
          <header className="module-header">
            <div className="module-header__identity">
              <span className="module-header__icon">
                <i className="fa-solid fa-boxes-stacked" />
              </span>
              <div>
                <span className="module-eyebrow">Existencias y caducidad</span>
                <h1 className="module-title">Control de Inventario</h1>
                <p className="module-subtitle">
                  Supervisa el stock y anticipa las fechas de caducidad de los medicamentos.
                </p>
              </div>
            </div>
            <div className="module-header__actions">
              <button
                type="button"
                className="module-button is-primary"
                onClick={() => setMostrarFormAlta((visible) => !visible)}
              >
                <i className={`fa-solid ${mostrarFormAlta ? 'fa-xmark' : 'fa-plus'}`} />
                {mostrarFormAlta ? 'Cerrar formulario' : 'Agregar producto'}
              </button>
            </div>
          </header>

          <section className="module-overview" aria-label="Resumen de inventario">
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
            {mostrarFormAlta && (
              <section
                className="module-workspace__section"
                aria-labelledby="nuevo-producto-title"
              >
                <div className="module-workspace__header">
                  <div>
                    <h2 id="nuevo-producto-title" className="module-workspace__title">
                      <i className="fa-solid fa-capsules" aria-hidden="true" />
                      Nuevo producto
                    </h2>
                    <p className="module-subtitle">
                      Registra el medicamento, sus existencias y la fecha de caducidad.
                    </p>
                  </div>
                </div>

                <form action={altaFormAction}>
                  {altaState?.error && (
                    <div className="module-alert is-error">
                      <i className="fa-solid fa-circle-exclamation" />
                      {altaState.error}
                    </div>
                  )}

                  <div className="module-inline-note">
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>
                      El nombre y la cantidad son obligatorios. Agrega una fecha para recibir
                      alertas de caducidad.
                    </span>
                  </div>

                  <div className="module-form-grid is-three">
                    <div className="module-field">
                      <label htmlFor="nombre">Nombre del medicamento *</label>
                      <input
                        id="nombre"
                        name="nombre"
                        type="text"
                        required
                        placeholder="Ej. Amoxicilina 250 mg"
                        disabled={altaPending}
                      />
                    </div>
                    <div className="module-field">
                      <label htmlFor="cantidad">Cantidad en stock *</label>
                      <input
                        id="cantidad"
                        name="cantidad"
                        type="number"
                        min={0}
                        required
                        defaultValue={0}
                        disabled={altaPending}
                      />
                    </div>
                    <div className="module-field">
                      <label htmlFor="fecha_caducidad">Fecha de caducidad</label>
                      <input
                        id="fecha_caducidad"
                        name="fecha_caducidad"
                        type="date"
                        disabled={altaPending}
                      />
                    </div>
                  </div>

                  <div className="module-form-actions">
                    <button
                      type="button"
                      className="module-button is-secondary"
                      onClick={() => setMostrarFormAlta(false)}
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
                          Guardar producto
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section
              className="module-workspace__section"
              aria-labelledby="inventario-productos-title"
            >
              <div className="module-workspace__header">
                <div>
                  <h2 id="inventario-productos-title" className="module-workspace__title">
                    <i className="fa-solid fa-boxes-stacked" aria-hidden="true" />
                    Inventario de medicamentos
                    <span className="module-count">{productos.length}</span>
                  </h2>
                  <p className="module-subtitle">
                    Consulta existencias, ajusta el stock y revisa las fechas de caducidad.
                  </p>
                </div>
                <div className="module-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar medicamento..."
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    aria-label="Buscar medicamento"
                  />
                </div>
              </div>

              {productosFiltrados.length === 0 ? (
                <div className="module-empty">
                  <i className="fa-solid fa-box-open" />
                  <h3>
                    {productos.length === 0
                      ? 'Aún no hay productos en el inventario'
                      : 'No se encontraron productos'}
                  </h3>
                  <p>
                    {productos.length === 0
                      ? 'Agrega el primer medicamento para comenzar a controlar sus existencias.'
                      : 'Prueba con otro nombre de medicamento.'}
                  </p>
                </div>
              ) : (
                <div className="module-table-wrap">
                  <table className="module-table">
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        <th>Cantidad en stock</th>
                        <th>Fecha de caducidad</th>
                        <th className="module-table__actions">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((producto) => (
                        <FilaProducto
                          key={producto.id_producto}
                          producto={producto}
                          onChange={(actualizado) => {
                            startTransition(() => {
                              setProductosLocales((previous) => ({
                                ...previous,
                                [producto.id_producto]: actualizado,
                              }))
                            })
                          }}
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

function FilaProducto({
  producto,
  onChange,
}: {
  producto: ProductoInventario
  onChange: (actualizado: ProductoInventario | null) => void
}) {
  const [stockState, stockFormAction, stockPending] = useActionState<InventarioState, FormData>(
    async (previousState, formData) => {
      const result = await ajustarStockAction(previousState, formData)
      if (result?.success) {
        const deltaStock = Number.parseInt(formData.get('delta') as string)
        onChange({ ...producto, cantidad: producto.cantidad + deltaStock })
      }
      return result
    },
    null,
  )
  const [, eliminarFormAction, eliminarPending] = useActionState<InventarioState, FormData>(
    async (previousState, formData) => {
      const result = await eliminarProductoAction(previousState, formData)
      if (result?.success) onChange(null)
      return result
    },
    null,
  )
  const [delta, setDelta] = useState(1)
  const estado = estadoCaducidad(producto.fecha_caducidad)
  const pasoSeguro = Math.max(1, delta || 1)

  const estadoClass = {
    vencido: 'is-danger',
    'por-vencer': 'is-warning',
    ok: 'is-success',
    'sin-fecha': 'is-neutral',
  }[estado]

  return (
    <tr>
      <td>
        <div className="module-patient">
          <span className="module-patient__avatar">
            <i className="fa-solid fa-pills" />
          </span>
          <span className="module-patient__details">
            <strong>{producto.nombre}</strong>
            <span>Producto #{producto.id_producto}</span>
          </span>
        </div>
      </td>
      <td>
        <div className="module-stock">
          <form action={stockFormAction}>
            <input type="hidden" name="id_producto" value={producto.id_producto} />
            <input type="hidden" name="delta" value={-pasoSeguro} />
            <button
              type="submit"
              disabled={stockPending || producto.cantidad <= 0}
              title="Restar stock"
              className="module-stock__button"
            >
              <i className="fa-solid fa-minus" />
            </button>
          </form>
          <span className="module-stock__value">{producto.cantidad}</span>
          <form action={stockFormAction}>
            <input type="hidden" name="id_producto" value={producto.id_producto} />
            <input type="hidden" name="delta" value={pasoSeguro} />
            <button
              type="submit"
              disabled={stockPending}
              title="Agregar stock"
              className="module-stock__button"
            >
              <i className="fa-solid fa-plus" />
            </button>
          </form>
          <input
            type="number"
            min={1}
            value={delta}
            onChange={(event) => setDelta(Number.parseInt(event.target.value) || 1)}
            className="module-stock-input"
            aria-label="Cantidad a ajustar"
          />
        </div>
        {stockState?.error && (
          <small className="module-field-error">{stockState.error}</small>
        )}
      </td>
      <td>
        <span className={`module-pill ${estadoClass}`}>
          {estado === 'vencido' && <i className="fa-solid fa-skull-crossbones" />}
          {estado === 'por-vencer' && <i className="fa-solid fa-triangle-exclamation" />}
          {estado === 'ok' && <i className="fa-solid fa-circle-check" />}
          {formatearFecha(producto.fecha_caducidad)}
        </span>
      </td>
      <td className="module-table__actions">
        <form
          action={eliminarFormAction}
          onSubmit={(event) => {
            if (!confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) {
              event.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id_producto" value={producto.id_producto} />
          <button
            type="submit"
            disabled={eliminarPending}
            title="Eliminar producto"
            className="module-action is-danger"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </form>
      </td>
    </tr>
  )
}
