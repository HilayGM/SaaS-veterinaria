'use client'

import { useActionState, useMemo, useState, useTransition, type CSSProperties } from 'react'
import {
  agregarProductoAction,
  ajustarStockAction,
  eliminarProductoAction,
} from '@/app/actions/inventario'
import type { InventarioState, PerfilUsuario, ProductoInventario } from '@/app/actions/inventario'
import { logoutAction } from '@/app/actions/auth'

type Props = {
  perfil: PerfilUsuario
  productosIniciales: ProductoInventario[]
}

// Días de margen para marcar un producto como "por caducar"
const DIAS_ALERTA_CADUCIDAD = 30

function estadoCaducidad(fecha: string | null): 'sin-fecha' | 'vencido' | 'por-vencer' | 'ok' {
  if (!fecha) return 'sin-fecha'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaCad = new Date(fecha + 'T00:00:00')
  const diffDias = Math.floor((fechaCad.getTime() - hoy.getTime()) / 86_400_000)
  if (diffDias < 0) return 'vencido'
  if (diffDias <= DIAS_ALERTA_CADUCIDAD) return 'por-vencer'
  return 'ok'
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return '— Sin fecha —'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function InventarioClient({ perfil, productosIniciales }: Props) {
  // Mantenemos copia local optimista; revalidatePath del server action
  // refresca el server component padre, pero esto evita parpadeos.
  const [productos, setProductos] = useState(productosIniciales)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarFormAlta, setMostrarFormAlta] = useState(false)
  const [, startTransition] = useTransition()

  const [altaState, altaFormAction, altaPending] = useActionState<InventarioState, FormData>(
    agregarProductoAction,
    null
  )

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return productos
    return productos.filter(p => p.nombre.toLowerCase().includes(q))
  }, [productos, busqueda])

  const vencidos = productos.filter(p => estadoCaducidad(p.fecha_caducidad) === 'vencido').length
  const porVencer = productos.filter(p => estadoCaducidad(p.fecha_caducidad) === 'por-vencer').length

  // Sincroniza estado local cuando el formulario de alta termina con éxito.
  // (El server ya revalidó la ruta; aquí solo limpiamos la UI del form.)
  if (altaState?.success && mostrarFormAlta) {
    setMostrarFormAlta(false)
  }

  return (
    <div className="inv-page">
      {/* ── HEADER ── */}
      <header className="inv-header">
        <div className="inv-header-left">
          <div className="inv-logo">
            <i className="fa-solid fa-heart-pulse" />
            <span>PetCare <strong>Intelligence</strong></span>
          </div>
          {perfil.nombre_clinica && (
            <span className="inv-clinica-pill">
              <i className="fa-solid fa-hospital" /> {perfil.nombre_clinica}
            </span>
          )}
        </div>

        <div className="inv-header-right">
          <div className="inv-user">
            <span className="inv-user-name">{perfil.nombre}</span>
            <span className="inv-user-rol">{perfil.rol}</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="inv-logout-btn" title="Cerrar sesión">
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </form>
        </div>
      </header>

      <main className="inv-main">
        <div className="inv-title-row">
          <div>
            <h1>Inventario de medicamentos</h1>
            <p>Controla el stock y las fechas de caducidad de tu clínica.</p>
          </div>
          <button
            type="button"
            className="inv-btn-primary"
            onClick={() => setMostrarFormAlta(v => !v)}
          >
            <i className="fa-solid fa-plus" /> Agregar producto
          </button>
        </div>

        {/* ── TARJETAS RESUMEN ── */}
        <div className="inv-stats">
          <div className="inv-stat-card">
            <i className="fa-solid fa-pills" />
            <div>
              <strong>{productos.length}</strong>
              <span>Productos registrados</span>
            </div>
          </div>
          <div className="inv-stat-card inv-stat-warn">
            <i className="fa-solid fa-triangle-exclamation" />
            <div>
              <strong>{porVencer}</strong>
              <span>Por caducar (≤ {DIAS_ALERTA_CADUCIDAD} días)</span>
            </div>
          </div>
          <div className="inv-stat-card inv-stat-danger">
            <i className="fa-solid fa-skull-crossbones" />
            <div>
              <strong>{vencidos}</strong>
              <span>Caducados</span>
            </div>
          </div>
        </div>

        {/* ── FORM ALTA DE PRODUCTO ── */}
        {mostrarFormAlta && (
          <form action={altaFormAction} className="inv-form-card">
            <h3>Nuevo producto</h3>

            {altaState?.error && (
              <div className="inv-alert inv-alert-error">
                <i className="fa-solid fa-circle-exclamation" /> {altaState.error}
              </div>
            )}

            <input type="hidden" name="id_clinica" value={perfil.id_clinica ?? ''} />

            <div className="inv-form-grid">
              <div className="inv-field">
                <label htmlFor="nombre">Nombre del medicamento *</label>
                <input id="nombre" name="nombre" type="text" required placeholder="Ej. Amoxicilina 250mg" disabled={altaPending} />
              </div>
              <div className="inv-field">
                <label htmlFor="cantidad">Cantidad en stock *</label>
                <input id="cantidad" name="cantidad" type="number" min={0} required defaultValue={0} disabled={altaPending} />
              </div>
              <div className="inv-field">
                <label htmlFor="fecha_caducidad">Fecha de caducidad</label>
                <input id="fecha_caducidad" name="fecha_caducidad" type="date" disabled={altaPending} />
              </div>
            </div>

            <div className="inv-form-actions">
              <button type="button" className="inv-btn-ghost" onClick={() => setMostrarFormAlta(false)} disabled={altaPending}>
                Cancelar
              </button>
              <button type="submit" className="inv-btn-primary" disabled={altaPending}>
                {altaPending ? (
                  <><i className="fa-solid fa-circle-notch fa-spin" /> Guardando...</>
                ) : (
                  <><i className="fa-solid fa-floppy-disk" /> Guardar producto</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── BUSCADOR ── */}
        <div className="inv-search">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Buscar medicamento..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* ── TABLA ── */}
        <div className="inv-table-wrap">
          {productosFiltrados.length === 0 ? (
            <div className="inv-empty">
              <i className="fa-solid fa-box-open" />
              <p>{productos.length === 0 ? 'Aún no hay productos en el inventario.' : 'No se encontraron productos con ese nombre.'}</p>
            </div>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Cantidad en stock</th>
                  <th>Fecha de caducidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(p => (
                  <FilaProducto
                    key={p.id_producto}
                    producto={p}
                    onChange={(actualizado) => {
                      startTransition(() => {
                        setProductos(prev =>
                          actualizado === null
                            ? prev.filter(x => x.id_producto !== p.id_producto)
                            : prev.map(x => (x.id_producto === p.id_producto ? actualizado : x))
                        )
                      })
                    }}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');

        .inv-page {
          min-height: 100vh;
          background: #f4f7fb;
          font-family: 'Poppins', sans-serif;
        }

        .inv-header {
          background: linear-gradient(135deg, #010b2f 10%, #001f73 100%);
          padding: 16px 6%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .inv-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .inv-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.25rem;
          color: white;
          font-weight: 600;
        }
        .inv-logo i { color: #22d3ee; font-size: 1.4rem; }
        .inv-logo strong { color: #22d3ee; }
        .inv-clinica-pill {
          background: rgba(34,211,238,.15);
          border: 1px solid rgba(34,211,238,.4);
          color: #67e8f9;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: .82rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .inv-header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .inv-user {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.25;
        }
        .inv-user-name { color: white; font-weight: 600; font-size: .9rem; }
        .inv-user-rol { color: #93c5fd; font-size: .75rem; }
        .inv-logout-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(255,255,255,.08);
          color: white;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: .2s;
        }
        .inv-logout-btn:hover { background: rgba(239,68,68,.25); border-color: #ef4444; }

        .inv-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 6% 80px;
        }

        .inv-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }
        .inv-title-row h1 { font-size: 1.6rem; color: #0f172a; margin-bottom: 4px; }
        .inv-title-row p { color: #64748b; font-size: .9rem; }

        .inv-btn-primary {
          background: #001f73;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: .9rem;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: .2s;
          white-space: nowrap;
        }
        .inv-btn-primary:hover:not(:disabled) { background: #1e3a8a; transform: translateY(-1px); }
        .inv-btn-primary:disabled { opacity: .65; cursor: not-allowed; }

        .inv-btn-ghost {
          background: transparent;
          border: 1.5px solid #e2e8f0;
          color: #64748b;
          padding: 12px 18px;
          border-radius: 12px;
          font-family: 'Poppins', sans-serif;
          font-weight: 500;
          font-size: .9rem;
          cursor: pointer;
          transition: .2s;
        }
        .inv-btn-ghost:hover:not(:disabled) { border-color: #94a3b8; color: #0f172a; }

        .inv-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .inv-stat-card {
          background: white;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #e2e8f0;
        }
        .inv-stat-card i { font-size: 1.6rem; color: #001f73; }
        .inv-stat-card strong { display: block; font-size: 1.3rem; color: #0f172a; }
        .inv-stat-card span { font-size: .78rem; color: #64748b; }
        .inv-stat-warn i { color: #f59e0b; }
        .inv-stat-danger i { color: #ef4444; }

        .inv-form-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
        }
        .inv-form-card h3 { color: #0f172a; margin-bottom: 16px; font-size: 1.05rem; }
        .inv-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        .inv-field { display: flex; flex-direction: column; gap: 6px; }
        .inv-field label { font-size: .8rem; font-weight: 600; color: #374151; }
        .inv-field input {
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-family: 'Poppins', sans-serif;
          font-size: .9rem;
          background: #f8fafc;
          outline: none;
          transition: border-color .2s;
        }
        .inv-field input:focus { border-color: #22d3ee; background: #fff; }
        .inv-form-actions { display: flex; justify-content: flex-end; gap: 10px; }

        .inv-alert {
          padding: 12px 14px;
          border-radius: 10px;
          font-size: .85rem;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }
        .inv-alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; }

        .inv-search {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          max-width: 360px;
        }
        .inv-search i { color: #94a3b8; }
        .inv-search input {
          border: none; outline: none; font-family: 'Poppins', sans-serif;
          font-size: .9rem; width: 100%; background: transparent;
        }

        .inv-table-wrap {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table th {
          text-align: left;
          padding: 14px 18px;
          background: #f8fafc;
          color: #64748b;
          font-size: .78rem;
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 1px solid #e2e8f0;
        }
        .inv-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          font-size: .9rem;
          color: #0f172a;
          vertical-align: middle;
        }
        .inv-table tr:last-child td { border-bottom: none; }

        .inv-empty {
          padding: 60px 20px;
          text-align: center;
          color: #94a3b8;
        }
        .inv-empty i { font-size: 2.4rem; margin-bottom: 12px; display: block; }

        @media (max-width: 700px) {
          .inv-table thead { display: none; }
          .inv-table, .inv-table tbody, .inv-table tr, .inv-table td { display: block; width: 100%; }
          .inv-table tr { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; }
          .inv-table td { padding: 4px 0; border: none; }
        }
      `}</style>
    </div>
  )
}

// ── FILA INDIVIDUAL (maneja sus propios estados de ajuste/borrado) ─────────
function FilaProducto({
  producto,
  onChange,
}: {
  producto: ProductoInventario
  onChange: (actualizado: ProductoInventario | null) => void
}) {
  const [stockState, stockFormAction, stockPending] = useActionState<InventarioState, FormData>(
    async (prev, formData) => {
      const result = await ajustarStockAction(prev, formData)
      if (result?.success) {
        const delta = parseInt(formData.get('delta') as string)
        onChange({ ...producto, cantidad: producto.cantidad + delta })
      }
      return result
    },
    null
  )
  const [, eliminarFormAction, eliminarPending] = useActionState<InventarioState, FormData>(
    async (prev, formData) => {
      const result = await eliminarProductoAction(prev, formData)
      if (result?.success) {
        onChange(null)
      }
      return result
    },
    null
  )
  const [delta, setDelta] = useState(1)

  const estado = estadoCaducidad(producto.fecha_caducidad)
  const pasoSeguro = Math.max(1, delta || 1)

  return (
    <tr>
      <td>
        <strong>{producto.nombre}</strong>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <form action={stockFormAction}>
            <input type="hidden" name="id_producto" value={producto.id_producto} />
            <input type="hidden" name="cantidad_actual" value={producto.cantidad} />
            <input type="hidden" name="delta" value={-pasoSeguro} />
            <button
              type="submit"
              disabled={stockPending || producto.cantidad <= 0}
              title="Restar stock"
              style={btnStockStyle}
            >
              <i className="fa-solid fa-minus" />
            </button>
          </form>

          <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>
            {producto.cantidad}
          </span>

          <form action={stockFormAction}>
            <input type="hidden" name="id_producto" value={producto.id_producto} />
            <input type="hidden" name="cantidad_actual" value={producto.cantidad} />
            <input type="hidden" name="delta" value={pasoSeguro} />
            <button
              type="submit"
              disabled={stockPending}
              title="Agregar stock"
              style={btnStockStyle}
            >
              <i className="fa-solid fa-plus" />
            </button>
          </form>

          <input
            type="number"
            min={1}
            value={delta}
            onChange={e => setDelta(parseInt(e.target.value) || 1)}
            style={{ width: 50, padding: '4px 6px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: '.8rem' }}
            title="Cantidad a sumar/restar"
          />
        </div>
        {stockState?.error && (
          <div style={{ color: '#dc2626', fontSize: '.75rem', marginTop: 4 }}>
            {stockState.error}
          </div>
        )}
      </td>
      <td>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: '.78rem',
            fontWeight: 600,
            background:
              estado === 'vencido' ? '#fef2f2' : estado === 'por-vencer' ? '#fffbeb' : '#f0fdf4',
            color:
              estado === 'vencido' ? '#dc2626' : estado === 'por-vencer' ? '#d97706' : '#16a34a',
          }}
        >
          {estado === 'vencido' && <i className="fa-solid fa-skull-crossbones" />}
          {estado === 'por-vencer' && <i className="fa-solid fa-triangle-exclamation" />}
          {formatearFecha(producto.fecha_caducidad)}
        </span>
      </td>
      <td>
        <form
          action={eliminarFormAction}
          onSubmit={(e) => {
            if (!confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="id_producto" value={producto.id_producto} />
          <button
            type="submit"
            disabled={eliminarPending}
            title="Eliminar producto"
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 6,
            }}
          >
            <i className="fa-solid fa-trash" />
          </button>
        </form>
      </td>
    </tr>
  )
}

const btnStockStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 7,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#001f73',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '.7rem',
}
