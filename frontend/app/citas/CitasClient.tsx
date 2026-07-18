'use client'

import { useState, useMemo } from 'react'
import DashboardShell from '@/app/components/DashboardShell'
import type { PerfilUsuario } from '@/app/actions/inventario'
import type { CitaHoy } from '@/app/actions/citas'
import { getCitasHoy, cambiarEstadoCitaAction } from '@/app/actions/citas'
import { Search, Plus, CheckCircle2, Clock, Filter, MoreVertical, Check, X, RotateCw, AlertCircle, CalendarDays } from 'lucide-react'

type Props = {
  perfil: PerfilUsuario
  initialCitas: CitaHoy[]
}

export default function CitasClient({ perfil, initialCitas }: Props) {
  const [citas, setCitas] = useState<CitaHoy[]>(initialCitas)
  const [loading, setLoading] = useState(false)
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null)

  const canEdit = perfil.rol === 'Veterinario' || perfil.rol === 'Administrador'

  const handleRefresh = async () => {
    setLoading(true)
    setActionError(null)
    const data = await getCitasHoy()
    setCitas(data)
    setLoading(false)
  }

  const handleCambiarEstado = async (id_cita: number, nuevoEstado: 'Completada' | 'Cancelada') => {
    setLoadingActionId(id_cita)
    setActionError(null)
    setActiveMenuId(null) // Close menu

    const res = await cambiarEstadoCitaAction(id_cita, nuevoEstado)
    
    if (res.error) {
      setActionError(res.error)
      setLoadingActionId(null)
      return
    }

    setCitas(prev => prev.map(c => 
      c.id_cita === id_cita ? { ...c, estado: nuevoEstado } : c
    ))
    
    setLoadingActionId(null)
  }

  const formatHora = (fechaIso: string) => {
    return new Date(fechaIso).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const filteredCitas = useMemo(() => {
    if (!searchTerm) return citas
    const lower = searchTerm.toLowerCase()
    return citas.filter(c => 
      c.mascota_nombre?.toLowerCase().includes(lower) || 
      c.propietario_nombre?.toLowerCase().includes(lower)
    )
  }, [citas, searchTerm])

  const stats = useMemo(() => {
    const total = citas.length
    const completadas = citas.filter(c => c.estado === 'Completada').length
    const pendientes = citas.filter(c => c.estado === 'Pendiente').length
    return { total, completadas, pendientes }
  }, [citas])

  // Identificar la "siguiente" cita activa (primera pendiente del día)
  const nextPendingCita = useMemo(() => {
    return citas.find(c => c.estado === 'Pendiente')
  }, [citas])

  const toggleMenu = (id: number) => {
    if (activeMenuId === id) setActiveMenuId(null)
    else setActiveMenuId(id)
  }

  return (
    <DashboardShell perfil={perfil}>
      <div className="citas-dashboard">
        <div className="citas-container">
          
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-text">
              <h1 className="page-title">Gestión de Citas</h1>
              <p className="page-subtitle">Tienes {stats.total} citas programadas para hoy.</p>
            </div>
            <div className="header-actions">
              <button className="btn-primary bg-blue text-white">
                <Plus size={18} />
                <span>Nueva Cita</span>
              </button>
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="btn-secondary"
                title="Sincronizar"
              >
                <RotateCw size={18} className={loading ? 'icon-spin' : ''} />
              </button>
            </div>
          </header>

          {actionError && (
             <div className="error-alert">
                <AlertCircle size={20} />
                <span>{actionError}</span>
             </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper icon-blue">
                <CalendarDays size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Hoy</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper icon-green">
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Completadas</span>
                <span className="stat-value">{stats.completadas}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper icon-orange">
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Pendientes</span>
                <span className="stat-value">{stats.pendientes}</span>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="main-card">
            
            {/* Toolbar */}
            <div className="card-toolbar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar paciente o dueño..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button className="btn-filter">
                <Filter size={16} />
                <span>Filtros</span>
              </button>
            </div>

            {/* Table */}
            <div className="table-container">
              {filteredCitas.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays size={48} className="empty-icon" />
                  <h3>No hay resultados</h3>
                  <p>No se encontraron citas con esos criterios.</p>
                </div>
              ) : (
                <table className="citas-table">
                  <thead>
                    <tr>
                      <th>PACIENTE</th>
                      <th>MOTIVO / PROPIETARIO</th>
                      <th>HORARIO</th>
                      <th>ESTADO</th>
                      <th className="th-actions">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCitas.map((cita) => {
                      const isNext = cita.id_cita === nextPendingCita?.id_cita && cita.estado === 'Pendiente'
                      
                      let badgeClass = 'badge-blue'
                      let badgeIcon = <Clock size={14} />
                      let badgeText = 'Pendiente'
                      
                      if (cita.estado === 'Completada') {
                        badgeClass = 'badge-green'
                        badgeIcon = <CheckCircle2 size={14} />
                        badgeText = 'Completada'
                      } else if (cita.estado === 'Cancelada') {
                        badgeClass = 'badge-red'
                        badgeIcon = <X size={14} />
                        badgeText = 'Cancelada'
                      } else if (isNext) {
                        badgeClass = 'badge-blue'
                        badgeIcon = <Clock size={14} />
                        badgeText = 'En curso'
                      }

                      return (
                        <tr key={cita.id_cita} className="table-row">
                          <td>
                            <div className="td-patient">
                              <div className="patient-avatar">
                                <i className="fa-solid fa-paw"></i>
                              </div>
                              <div className="patient-details">
                                <strong className="patient-name">{cita.mascota_nombre}</strong>
                                <span className="patient-sub">ID: {cita.id_cita} · {cita.propietario_nombre || 'Sin dueño'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="td-reason">
                              <strong className="reason-text">Cita General</strong>
                              <span className="reason-sub">Dr. Asignado</span>
                            </div>
                          </td>
                          <td>
                            <div className="td-time">
                              <strong className="time-text">{formatHora(cita.fecha)}</strong>
                              <span className="time-sub">Hoy</span>
                            </div>
                          </td>
                          <td>
                            <div className={`status-badge ${badgeClass}`}>
                              {badgeIcon}
                              <span>{badgeText}</span>
                            </div>
                          </td>
                          <td className="td-actions">
                            <div className="action-menu-container">
                              <button 
                                className="btn-more"
                                onClick={() => toggleMenu(cita.id_cita)}
                              >
                                {loadingActionId === cita.id_cita ? (
                                  <RotateCw size={18} className="icon-spin text-gray-400" />
                                ) : (
                                  <MoreVertical size={18} />
                                )}
                              </button>
                              
                              {activeMenuId === cita.id_cita && cita.estado === 'Pendiente' && (
                                <div className="dropdown-menu">
                                  <button 
                                    className="dropdown-item text-green"
                                    onClick={() => handleCambiarEstado(cita.id_cita, 'Completada')}
                                    disabled={!canEdit}
                                  >
                                    <Check size={16} /> Completar Cita
                                  </button>
                                  <button 
                                    className="dropdown-item text-red"
                                    onClick={() => handleCambiarEstado(cita.id_cita, 'Cancelada')}
                                    disabled={!canEdit}
                                  >
                                    <X size={16} /> Cancelar Cita
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
        /* Reset and Fonts */
        .citas-dashboard {
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 40px 24px;
          animation: fadeInUp 0.5s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .citas-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Header */
        .dashboard-header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (min-width: 768px) {
          .dashboard-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .page-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
        }
        .page-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #22D3EE; /* Color basado en tu imagen */
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(85, 66, 246, 0.2);
        }
        .btn-primary:hover {
          background-color: #4634d9;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(85, 66, 246, 0.3);
        }
        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover:not(:disabled) {
          color: #0f172a;
          border-color: #cbd5e1;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (min-width: 768px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .stat-card {
          background-color: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          transition: transform 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
        }
        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-blue { background-color: #f1f0ff; color: #5542F6; }
        .icon-green { background-color: #dcfce7; color: #10b981; }
        .icon-orange { background-color: #fef3c7; color: #f59e0b; }
        
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        /* Main Card */
        .main-card {
          background-color: #ffffff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          overflow: hidden;
        }

        /* Toolbar */
        .card-toolbar {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        @media (min-width: 640px) {
          .card-toolbar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .search-box {
          position: relative;
          width: 100%;
          max-width: 320px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .search-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9rem;
          color: #334155;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .search-input:focus {
          border-color: #5542F6;
          box-shadow: 0 0 0 3px rgba(85, 66, 246, 0.1);
        }
        .btn-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-filter:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        /* Table */
        .table-container {
          width: 100%;
          overflow-x: auto;
        }
        .citas-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .citas-table th {
          padding: 16px 24px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9;
        }
        .citas-table td {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .th-actions { text-align: right; }
        .td-actions { text-align: right; }
        
        .table-row {
          transition: background-color 0.2s;
        }
        .table-row:hover {
          background-color: #f8fafc;
        }

        /* Cells */
        .td-patient { display: flex; align-items: center; gap: 14px; }
        .patient-avatar {
          width: 42px; height: 42px; border-radius: 12px; background-color: #f1f5f9;
          display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 1.2rem;
        }
        .patient-details, .td-reason, .td-time { display: flex; flex-direction: column; gap: 4px; }
        .patient-name, .reason-text, .time-text { font-size: 0.95rem; font-weight: 600; color: #0f172a; }
        .patient-sub, .reason-sub, .time-sub { font-size: 0.8rem; color: #64748b; }

        /* Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .badge-green { background-color: #dcfce7; color: #059669; }
        .badge-blue { background-color: #e0e7ff; color: #4338ca; }
        .badge-yellow { background-color: #fef3c7; color: #d97706; }
        .badge-red { background-color: #fee2e2; color: #dc2626; }

        /* Action Menu */
        .action-menu-container {
          position: relative;
          display: inline-block;
        }
        .btn-more {
          background: transparent;
          border: none;
          color: #94a3b8;
          width: 36px; height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .btn-more:hover {
          background-color: #f1f5f9;
          color: #475569;
        }
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 8px;
          z-index: 10;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: scaleIn 0.2s ease-out;
          transform-origin: top right;
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          font-size: 0.9rem;
          font-family: inherit;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
          width: 100%;
        }
        .dropdown-item:hover:not(:disabled) {
          background-color: #f8fafc;
        }
        .dropdown-item:disabled { opacity: 0.5; cursor: not-allowed; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }

        .icon-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .error-alert { margin-bottom: 24px; padding: 16px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; display: flex; align-items: center; gap: 12px; color: #dc2626; font-size: 0.9rem; font-weight: 500; }
        .empty-state { padding: 60px 20px; text-align: center; color: #64748b; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon { color: #cbd5e1; }
        .empty-state h3 { color: #0f172a; font-size: 1.2rem; margin: 0; }
      `}</style>
    </DashboardShell>
  )
}
