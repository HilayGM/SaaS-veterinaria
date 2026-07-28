'use client'

import { useActionState, useState, useMemo } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import type { PerfilUsuario } from '@/app/actions/inventario'
import type { CitaConMascota, CitaState } from '@/app/actions/citas'
import { agendarCitaAction, cambiarEstadoCitaAction, getCitas } from '@/app/actions/citas'
import {
  Search, Plus, CheckCircle2, Clock, RotateCw,
  AlertCircle, CalendarDays, Check, X, MoreVertical
} from 'lucide-react'

type Mascota = { id_mascota: number; nombre: string; especie: string }

type Props = {
  perfil: PerfilUsuario
  initialCitas: CitaConMascota[]
  mascotas: Mascota[]
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
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
    async (prev, formData) => {
      const result = await agendarCitaAction(prev, formData)
      if (result?.success) {
        setMostrarForm(false)
        setFormKey(k => k + 1)
        // Refrescar lista
        const nuevas = await getCitas()
        setCitas(nuevas)
      }
      return result
    },
    null
  )

  const handleRefresh = async () => {
    setLoading(true)
    setActionError(null)
    const data = await getCitas()
    setCitas(data)
    setLoading(false)
  }

  const handleCambiarEstado = async (id_cita: number, nuevoEstado: 'Completada' | 'Cancelada') => {
    setLoadingId(id_cita)
    setActionError(null)
    setMenuId(null)
    const res = await cambiarEstadoCitaAction(id_cita, nuevoEstado)
    if (res.error) {
      setActionError(res.error)
    } else {
      setCitas(prev => prev.map(c => c.id_cita === id_cita ? { ...c, estado: nuevoEstado } : c))
    }
    setLoadingId(null)
  }

  const filtradas = useMemo(() => {
    if (!searchTerm) return citas
    const q = searchTerm.toLowerCase()
    return citas.filter(c =>
      c.mascota_nombre.toLowerCase().includes(q) ||
      c.propietario_nombre.toLowerCase().includes(q)
    )
  }, [citas, searchTerm])

  const stats = useMemo(() => ({
    total: citas.length,
    completadas: citas.filter(c => c.estado === 'Completada').length,
    pendientes: citas.filter(c => c.estado === 'Pendiente').length,
  }), [citas])

  return (
    <DashboardShell perfil={perfil}>
      <div className="citas-dashboard">
        <div className="citas-container">

          {/* Header */}
          <header className="dashboard-header">
            <div>
              <h1 className="page-title">Gestión de Citas</h1>
              <p className="page-subtitle">{stats.total} citas registradas · {stats.pendientes} pendientes</p>
            </div>
            <div className="header-actions">
              <button className="btn-primary" onClick={() => setMostrarForm(v => !v)}>
                <Plus size={18} /><span>Nueva Cita</span>
              </button>
              <button onClick={handleRefresh} disabled={loading} className="btn-secondary" title="Actualizar">
                <RotateCw size={18} className={loading ? 'icon-spin' : ''} />
              </button>
            </div>
          </header>

          {/* Error global */}
          {actionError && (
            <div className="error-alert">
              <AlertCircle size={20} /><span>{actionError}</span>
            </div>
          )}

          {/* Formulario nueva cita */}
          {mostrarForm && (
            <form key={formKey} action={altaAction} className="form-card">
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Agendar nueva cita
              </h3>

              {altaState?.error && (
                <div className="error-alert" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={18} /><span>{altaState.error}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="field">
                  <label>Mascota *</label>
                  <select name="id_mascota" required disabled={altaPending}>
                    <option value="">Seleccionar...</option>
                    {mascotas.map(m => (
                      <option key={m.id_mascota} value={m.id_mascota}>
                        {m.nombre} ({m.especie})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Fecha y hora *</label>
                  <input
                    name="fecha"
                    type="datetime-local"
                    required
                    disabled={altaPending}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-ghost" onClick={() => setMostrarForm(false)} disabled={altaPending}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={altaPending}>
                  {altaPending
                    ? <><RotateCw size={16} className="icon-spin" /> Guardando...</>
                    : <><Check size={16} /> Guardar cita</>}
                </button>
              </div>
            </form>
          )}

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: 'Total', value: stats.total, icon: <CalendarDays size={22} />, cls: 'icon-blue' },
              { label: 'Completadas', value: stats.completadas, icon: <CheckCircle2 size={22} />, cls: 'icon-green' },
              { label: 'Pendientes', value: stats.pendientes, icon: <Clock size={22} />, cls: 'icon-orange' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon-wrapper ${s.cls}`}>{s.icon}</div>
                <div className="stat-info">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="main-card">
            <div className="card-toolbar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar paciente o dueño..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="table-container">
              {filtradas.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays size={48} className="empty-icon" />
                  <h3>{citas.length === 0 ? 'No hay citas registradas aún.' : 'No hay resultados.'}</h3>
                  <p>{citas.length === 0 ? 'Agenda la primera cita con el botón "Nueva Cita".' : 'Prueba con otro término de búsqueda.'}</p>
                </div>
              ) : (
                <table className="citas-table">
                  <thead>
                    <tr>
                      <th>PACIENTE / DUEÑO</th>
                      <th>FECHA</th>
                      <th>HORA</th>
                      <th>ESTADO</th>
                      <th className="th-actions">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map(cita => {
                      const badgeMap: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
                        Pendiente:  { cls: 'badge-blue',   icon: <Clock size={14} />,       label: 'Pendiente' },
                        Completada: { cls: 'badge-green',  icon: <CheckCircle2 size={14} />, label: 'Completada' },
                        Cancelada:  { cls: 'badge-red',    icon: <X size={14} />,            label: 'Cancelada' },
                      }
                      const badge = badgeMap[cita.estado] ?? badgeMap['Pendiente']

                      return (
                        <tr key={cita.id_cita} className="table-row">
                          <td>
                            <div className="td-patient">
                              <div className="patient-avatar">
                                <i className="fa-solid fa-paw" />
                              </div>
                              <div className="patient-details">
                                <strong className="patient-name">{cita.mascota_nombre}</strong>
                                <span className="patient-sub">{cita.propietario_nombre}</span>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ fontSize: '0.9rem', color: '#334155' }}>{formatFecha(cita.fecha)}</span></td>
                          <td><strong style={{ fontSize: '0.95rem' }}>{formatHora(cita.fecha)}</strong></td>
                          <td>
                            <div className={`status-badge ${badge.cls}`}>
                              {badge.icon}<span>{badge.label}</span>
                            </div>
                          </td>
                          <td className="td-actions">
                            <div className="action-menu-container">
                              <button className="btn-more" onClick={() => setMenuId(menuId === cita.id_cita ? null : cita.id_cita)}>
                                {loadingId === cita.id_cita
                                  ? <RotateCw size={18} className="icon-spin" />
                                  : <MoreVertical size={18} />}
                              </button>
                              {menuId === cita.id_cita && cita.estado === 'Pendiente' && canEdit && (
                                <div className="dropdown-menu">
                                  <button className="dropdown-item text-green"
                                    onClick={() => handleCambiarEstado(cita.id_cita, 'Completada')}>
                                    <Check size={16} /> Completar
                                  </button>
                                  <button className="dropdown-item text-red"
                                    onClick={() => handleCambiarEstado(cita.id_cita, 'Cancelada')}>
                                    <X size={16} /> Cancelar
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
              )}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .citas-dashboard { min-height:100vh; background:#f8fafc; padding:40px 24px; font-family:'Poppins',sans-serif; }
        .citas-container { max-width:1100px; margin:0 auto; }
        .dashboard-header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px; margin-bottom:28px; }
        .page-title { font-size:1.8rem; font-weight:700; color:#0f172a; margin:0 0 4px; }
        .page-subtitle { font-size:0.9rem; color:#64748b; margin:0; }
        .header-actions { display:flex; gap:12px; align-items:center; }
        .btn-primary { display:flex; align-items:center; gap:8px; background:#001f73; color:#fff; border:none; padding:11px 20px; border-radius:12px; font-family:'Poppins',sans-serif; font-weight:600; font-size:0.9rem; cursor:pointer; transition:.2s; }
        .btn-primary:hover:not(:disabled) { background:#1e3a8a; transform:translateY(-1px); }
        .btn-primary:disabled { opacity:.65; cursor:not-allowed; }
        .btn-secondary { display:flex; align-items:center; justify-content:center; background:#fff; border:1px solid #e2e8f0; color:#64748b; padding:11px; border-radius:12px; cursor:pointer; transition:.2s; }
        .btn-secondary:hover:not(:disabled) { border-color:#94a3b8; color:#0f172a; }
        .btn-ghost { background:transparent; border:1.5px solid #e2e8f0; color:#64748b; padding:10px 16px; border-radius:10px; font-family:'Poppins',sans-serif; font-size:0.9rem; cursor:pointer; }
        .error-alert { display:flex; align-items:center; gap:10px; background:#fef2f2; border:1px solid #fca5a5; color:#dc2626; padding:14px 16px; border-radius:12px; font-size:0.875rem; margin-bottom:20px; }
        .form-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; padding:24px; margin-bottom:24px; }
        .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin-bottom:16px; }
        .field { display:flex; flex-direction:column; gap:6px; }
        .field label { font-size:0.8rem; font-weight:600; color:#374151; }
        .field input, .field select { padding:11px 14px; border:1.5px solid #e2e8f0; border-radius:10px; font-family:'Poppins',sans-serif; font-size:0.9rem; background:#f8fafc; outline:none; transition:border-color .2s; }
        .field input:focus, .field select:focus { border-color:#22d3ee; background:#fff; }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:20px; margin-bottom:28px; }
        .stat-card { background:#fff; border:1px solid #f1f5f9; border-radius:16px; padding:22px; display:flex; align-items:center; gap:18px; box-shadow:0 2px 12px rgba(0,0,0,.03); }
        .stat-icon-wrapper { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .icon-blue { background:#f1f0ff; color:#5542F6; }
        .icon-green { background:#dcfce7; color:#10b981; }
        .icon-orange { background:#fef3c7; color:#f59e0b; }
        .stat-info { display:flex; flex-direction:column; gap:3px; }
        .stat-label { font-size:0.78rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
        .stat-value { font-size:1.8rem; font-weight:700; color:#0f172a; line-height:1; }
        .main-card { background:#fff; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 2px 12px rgba(0,0,0,.03); overflow:hidden; }
        .card-toolbar { padding:18px 24px; border-bottom:1px solid #f1f5f9; }
        .search-box { position:relative; max-width:320px; }
        .search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#94a3b8; }
        .search-input { width:100%; padding:10px 14px 10px 38px; border:1px solid #e2e8f0; border-radius:10px; font-family:'Poppins',sans-serif; font-size:0.875rem; outline:none; }
        .search-input:focus { border-color:#001f73; }
        .table-container { overflow-x:auto; }
        .citas-table { width:100%; border-collapse:collapse; }
        .citas-table th { padding:14px 20px; font-size:0.72rem; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #f1f5f9; text-align:left; }
        .citas-table td { padding:18px 20px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .th-actions, .td-actions { text-align:right; }
        .table-row:hover { background:#f8fafc; }
        .td-patient { display:flex; align-items:center; gap:12px; }
        .patient-avatar { width:40px; height:40px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#94a3b8; }
        .patient-details { display:flex; flex-direction:column; gap:3px; }
        .patient-name { font-size:0.93rem; font-weight:600; color:#0f172a; }
        .patient-sub { font-size:0.78rem; color:#64748b; }
        .status-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:0.78rem; font-weight:600; }
        .badge-blue { background:#e0e7ff; color:#4338ca; }
        .badge-green { background:#dcfce7; color:#059669; }
        .badge-red { background:#fee2e2; color:#dc2626; }
        .action-menu-container { position:relative; display:inline-block; }
        .btn-more { background:transparent; border:none; color:#94a3b8; width:34px; height:34px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:.2s; }
        .btn-more:hover { background:#f1f5f9; color:#475569; }
        .dropdown-menu { position:absolute; right:0; top:100%; margin-top:4px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,.1); padding:6px; z-index:50; min-width:170px; display:flex; flex-direction:column; gap:3px; }
        .dropdown-item { display:flex; align-items:center; gap:8px; padding:9px 12px; border-radius:8px; background:transparent; border:none; font-size:0.875rem; font-family:'Poppins',sans-serif; font-weight:500; cursor:pointer; width:100%; text-align:left; transition:.15s; }
        .dropdown-item:hover:not(:disabled) { background:#f8fafc; }
        .dropdown-item:disabled { opacity:.5; cursor:not-allowed; }
        .text-green { color:#059669; }
        .text-red { color:#dc2626; }
        .icon-spin { animation:spin 1s linear infinite; }
        @keyframes spin { 100% { transform:rotate(360deg); } }
        .empty-state { padding:60px 20px; text-align:center; color:#64748b; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .empty-icon { color:#cbd5e1; }
        .empty-state h3 { color:#0f172a; font-size:1.1rem; margin:0; }
        .empty-state p { margin:0; font-size:0.875rem; }
      `}</style>
    </DashboardShell>
  )
}
