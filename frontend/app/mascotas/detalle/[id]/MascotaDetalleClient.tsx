'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/app/components/DashboardShell'
import type { PerfilUsuario } from '@/app/actions/inventario'
import type { MascotaDetalle, Expediente, Vacuna } from '@/app/actions/detalle-mascota'

type Props = {
  perfil: PerfilUsuario
  mascota: MascotaDetalle
  expedientes: Expediente[]
  vacunas: Vacuna[]
}

const s = {
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    fontFamily: "'Poppins', sans-serif",
    animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    borderRadius: '24px',
    padding: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    color: 'white',
    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  headerDeco: {
    position: 'absolute' as const,
    top: -50,
    right: -50,
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0) 70%)',
    borderRadius: '50%',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '20px',
    transition: 'color 0.2s',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    zIndex: 1,
  },
  petIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #22d3ee 0%, #0284c7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    color: 'white',
    boxShadow: '0 8px 16px rgba(2, 132, 199, 0.4)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#cbd5e1',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  tab: {
    padding: '12px 24px',
    borderRadius: '14px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tabActive: {
    background: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
  },
  tabInactive: {
    background: 'transparent',
    color: '#64748b',
  },
  card: {
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    padding: '32px',
    animation: 'fadeIn 0.4s ease-out',
  },
  emptyState: {
    padding: '60px 24px',
    textAlign: 'center' as const,
    color: '#94a3b8',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  timelineItem: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '24px',
    padding: '24px',
    background: '#f8fafc',
    borderRadius: '16px',
    borderLeft: '4px solid #22d3ee',
  },
  timelineDate: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#475569',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  timelineTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  timelineText: {
    fontSize: '0.95rem',
    color: '#475569',
    margin: 0,
    lineHeight: 1.6,
  },
  gridInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  infoBox: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '16px',
  },
  infoLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  infoValue: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#0f172a',
  },
}

export default function MascotaDetalleClient({ perfil, mascota, expedientes, vacunas }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'expediente' | 'vacunas'>('info')

  const formatFecha = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  }

  return (
    <DashboardShell perfil={perfil}>
      <div style={s.container}>
        <Link href="/mascotas" style={s.backBtn} className="back-link">
          <i className="fa-solid fa-arrow-left" /> Volver a Pacientes
        </Link>

        {/* HEADER */}
        <div style={s.header}>
          <div style={s.headerDeco} />
          <div style={s.titleWrapper}>
            <div style={s.petIcon}>
              <i className="fa-solid fa-dog" />
            </div>
            <div>
              <h1 style={s.title}>{mascota.nombre}</h1>
              <p style={s.subtitle}>
                <span><i className="fa-solid fa-paw" style={{color: '#22d3ee'}}/> {mascota.especie} {mascota.raza ? `- ${mascota.raza}` : ''}</span>
                <span><i className="fa-solid fa-user" style={{color: '#22d3ee'}}/> Propietario: {mascota.dueno?.nombre || 'No asignado'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={s.tabsContainer}>
          <button 
            style={{ ...s.tab, ...(activeTab === 'info' ? s.tabActive : s.tabInactive) }}
            onClick={() => setActiveTab('info')}
            className="tab-btn"
          >
            <i className="fa-solid fa-circle-info" /> Información General
          </button>
          <button 
            style={{ ...s.tab, ...(activeTab === 'expediente' ? s.tabActive : s.tabInactive) }}
            onClick={() => setActiveTab('expediente')}
            className="tab-btn"
          >
            <i className="fa-solid fa-file-medical" /> Expediente Médico
          </button>
          <button 
            style={{ ...s.tab, ...(activeTab === 'vacunas' ? s.tabActive : s.tabInactive) }}
            onClick={() => setActiveTab('vacunas')}
            className="tab-btn"
          >
            <i className="fa-solid fa-syringe" /> Vacunas
          </button>
        </div>

        {/* CONTENT */}
        <div style={s.card}>
          {activeTab === 'info' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '24px' }}>Detalles del Paciente</h2>
              <div style={s.gridInfo}>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Fecha de Nacimiento</div>
                  <div style={s.infoValue}>{mascota.fecha_nacimiento ? formatFecha(mascota.fecha_nacimiento) : 'Desconocida'}</div>
                </div>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Teléfono Propietario</div>
                  <div style={s.infoValue}>{mascota.dueno?.telefono || 'No registrado'}</div>
                </div>
                <div style={s.infoBox}>
                  <div style={s.infoLabel}>Correo Propietario</div>
                  <div style={s.infoValue}>{mascota.dueno?.correo || 'No registrado'}</div>
                </div>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '40px 0 24px 0' }}>Receta Médica Activa</h2>
              <div style={{...s.gridInfo, background: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0'}}>
                <div>
                  <div style={{...s.infoLabel, color: '#16a34a'}}>Medicamento</div>
                  <div style={s.infoValue}>{mascota.medicamento || 'Ninguno'}</div>
                </div>
                <div>
                  <div style={{...s.infoLabel, color: '#16a34a'}}>Dosis</div>
                  <div style={s.infoValue}>{mascota.dosis || '—'}</div>
                </div>
                <div>
                  <div style={{...s.infoLabel, color: '#16a34a'}}>Frecuencia</div>
                  <div style={s.infoValue}>{mascota.frecuencia || '—'}</div>
                </div>
                <div>
                  <div style={{...s.infoLabel, color: '#16a34a'}}>Duración</div>
                  <div style={s.infoValue}>{mascota.duracion || '—'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expediente' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Historial Clínico</h2>
                <button style={{ background: '#22d3ee', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-plus" /> Nueva Consulta
                </button>
              </div>

              {expedientes.length > 0 ? (
                <div style={s.timeline}>
                  {expedientes.map(exp => (
                    <div key={exp.id_expediente} style={s.timelineItem}>
                      <div style={s.timelineDate}>{formatFecha(exp.fecha_consulta)}</div>
                      <div style={s.timelineContent}>
                        <h3 style={s.timelineTitle}>Diagnóstico: {exp.diagnostico}</h3>
                        {exp.tratamiento && (
                          <p style={s.timelineText}><strong>Tratamiento:</strong> {exp.tratamiento}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={s.emptyState}>
                  <i className="fa-solid fa-file-medical" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', margin: 0 }}>Sin registros médicos</h3>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Este paciente no tiene historial clínico registrado aún.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vacunas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Cartilla de Vacunación</h2>
                <button style={{ background: '#22d3ee', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-plus" /> Registrar Vacuna
                </button>
              </div>

              {vacunas.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>Vacuna</th>
                      <th style={{ padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>Fecha de Aplicación</th>
                      <th style={{ padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem' }}>Próxima Dosis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacunas.map(vac => (
                      <tr key={vac.id_vacuna}>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, color: '#0f172a' }}>{vac.nombre}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{formatFecha(vac.fecha_aplicacion)}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>
                          {vac.proxima_aplicacion ? formatFecha(vac.proxima_aplicacion) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={s.emptyState}>
                  <i className="fa-solid fa-syringe" style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#475569', margin: 0 }}>Sin vacunas registradas</h3>
                  <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Este paciente no tiene historial de vacunación.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .back-link:hover { color: #0f172a !important; }
        .tab-btn:hover:not([style*="background: #ffffff"]) {
          color: #0f172a !important;
          background: rgba(255,255,255,0.5) !important;
        }
      `}</style>
    </DashboardShell>
  )
}
