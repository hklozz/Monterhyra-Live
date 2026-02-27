/*
 * Copyright © 2025 Klozz Holding AB. All rights reserved.
 * MONTERHYRA™ - Proprietary and Confidential
 * Event Admin Portal - För mässarrangörer att administrera sina utställare
 */

import React, { useState, useEffect } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Event, Exhibitor } from './ExhibitorManager';
import { OrderManager } from './OrderManager';
import type { Order } from './OrderManager';

interface EventAdminPortalProps {
  eventId: string;
  onClose: () => void;
}

interface EventStats {
  totalExhibitors: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedBooths: number;
  pendingBooths: number;
}

export default function EventAdminPortal({ eventId, onClose }: EventAdminPortalProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalExhibitors: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedBooths: 0,
    pendingBooths: 0
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exhibitors' | 'orders' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = () => {
    // Ladda event-data
    const eventData = ExhibitorManager.getEvent(eventId);
    setEvent(eventData || null);

    // Ladda utställare för detta event
    const eventExhibitors = ExhibitorManager.getExhibitorsByEvent(eventId);
    setExhibitors(eventExhibitors);

    // Ladda orders från utställare i detta event
    const allOrders = OrderManager.getOrders();
    const eventOrders = allOrders.filter(order => {
      // Matcha orders mot utställare baserat på email eller företagsnamn
      const exhibitorEmails = eventExhibitors.map(e => e.email.toLowerCase());
      const exhibitorCompanies = eventExhibitors.map(e => e.companyName.toLowerCase());
      
      const orderEmail = order.customerInfo?.email?.toLowerCase() || '';
      const orderCompany = order.customerInfo?.company?.toLowerCase() || '';
      
      return exhibitorEmails.includes(orderEmail) || 
             exhibitorCompanies.includes(orderCompany);
    });
    setOrders(eventOrders);

    // Beräkna statistik
    const totalRevenue = eventOrders.reduce((sum, order) => sum + (order.orderData?.totalPrice || 0), 0);
    const completedBooths = eventOrders.length;
    const pendingBooths = eventExhibitors.length - completedBooths;

    setStats({
      totalExhibitors: eventExhibitors.length,
      totalOrders: eventOrders.length,
      totalRevenue,
      averageOrderValue: eventOrders.length > 0 ? totalRevenue / eventOrders.length : 0,
      completedBooths,
      pendingBooths
    });
  };

  const exportToExcel = () => {
    // Skapa CSV-data
    const headers = ['Företag', 'Kontakt', 'Email', 'Telefon', 'Monterstorlek', 'Status', 'Pris (SEK)'];
    const rows = exhibitors.map(exhibitor => {
      const order = orders.find(o => 
        o.customerInfo?.email?.toLowerCase() === exhibitor.email.toLowerCase() ||
        o.customerInfo?.company?.toLowerCase() === exhibitor.companyName.toLowerCase()
      );
      
      return [
        exhibitor.companyName,
        exhibitor.contactPerson || exhibitor.name,
        exhibitor.email,
        exhibitor.phone || '-',
        `${exhibitor.monterDimensions.width}×${exhibitor.monterDimensions.depth}m`,
        order ? 'Beställt' : 'Väntar',
        order ? order.orderData?.totalPrice?.toLocaleString('sv-SE') : '-'
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event?.name || 'event'}_utställare_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredExhibitors = exhibitors.filter(exhibitor => {
    const search = searchTerm.toLowerCase();
    return (
      exhibitor.companyName.toLowerCase().includes(search) ||
      exhibitor.name.toLowerCase().includes(search) ||
      exhibitor.email.toLowerCase().includes(search) ||
      (exhibitor.contactPerson?.toLowerCase() || '').includes(search)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!event) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2>Event hittades inte</h2>
          <button onClick={onClose} style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Stäng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f5f7fa',
      zIndex: 10000,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🏢 {event.name}
            </h1>
            <p style={{
              margin: 0,
              opacity: 0.9,
              fontSize: '14px'
            }}>
              Event Admin Portal
              {event.startDate && ` • ${new Date(event.startDate).toLocaleDateString('sv-SE')}`}
              {event.location && ` • ${event.location}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕ Stäng
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: '76px',
        zIndex: 99
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          gap: '0'
        }}>
          {[
            { id: 'dashboard' as const, label: '📊 Dashboard', icon: '📊' },
            { id: 'exhibitors' as const, label: '👥 Utställare', icon: '👥' },
            { id: 'orders' as const, label: '📦 Beställningar', icon: '📦' },
            { id: 'settings' as const, label: '⚙️ Inställningar', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 24px',
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px'
      }}>
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <StatCard
                icon="👥"
                title="Totalt Utställare"
                value={stats.totalExhibitors.toString()}
                subtitle={`${stats.completedBooths} beställt • ${stats.pendingBooths} väntar`}
                color="#3498db"
              />
              <StatCard
                icon="📦"
                title="Beställningar"
                value={stats.totalOrders.toString()}
                subtitle={`${Math.round((stats.completedBooths / stats.totalExhibitors) * 100)}% conversion`}
                color="#2ecc71"
              />
              <StatCard
                icon="💰"
                title="Total Omsättning"
                value={formatCurrency(stats.totalRevenue)}
                subtitle={`Snitt: ${formatCurrency(stats.averageOrderValue)}`}
                color="#f39c12"
              />
              <StatCard
                icon="📈"
                title="Status"
                value={`${Math.round((stats.completedBooths / stats.totalExhibitors) * 100)}%`}
                subtitle="Monterdesigner klara"
                color="#9b59b6"
              />
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                📊 Senaste Aktivitet
              </h2>
              {orders.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                  Inga beställningar ännu
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {order.customerInfo?.company || 'Okänt företag'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {order.customerInfo?.name} • {new Date(order.timestamp).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#2ecc71',
                        fontSize: '18px'
                      }}>
                        {formatCurrency(order.orderData?.totalPrice || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exhibitors' && (
          <div>
            {/* Search and Actions */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Sök utställare..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={exportToExcel}
                style={{
                  padding: '12px 24px',
                  background: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                📥 Exportera CSV
              </button>
            </div>

            {/* Exhibitors Table */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    <th style={tableHeaderStyle}>Företag</th>
                    <th style={tableHeaderStyle}>Kontakt</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Telefon</th>
                    <th style={tableHeaderStyle}>Monterstorlek</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExhibitors.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#999'
                      }}>
                        {searchTerm ? 'Inga utställare matchar sökningen' : 'Inga utställare ännu'}
                      </td>
                    </tr>
                  ) : (
                    filteredExhibitors.map((exhibitor) => {
                      const hasOrder = orders.some(o => 
                        o.customerInfo?.email?.toLowerCase() === exhibitor.email.toLowerCase() ||
                        o.customerInfo?.company?.toLowerCase() === exhibitor.companyName.toLowerCase()
                      );
                      
                      return (
                        <tr key={exhibitor.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: '600' }}>{exhibitor.companyName}</div>
                          </td>
                          <td style={tableCellStyle}>{exhibitor.contactPerson || exhibitor.name}</td>
                          <td style={tableCellStyle}>
                            <a href={`mailto:${exhibitor.email}`} style={{ color: '#667eea' }}>
                              {exhibitor.email}
                            </a>
                          </td>
                          <td style={tableCellStyle}>{exhibitor.phone || '-'}</td>
                          <td style={tableCellStyle}>
                            {exhibitor.monterDimensions.width}×{exhibitor.monterDimensions.depth}m
                            <br />
                            <span style={{ fontSize: '12px', color: '#999' }}>
                              {exhibitor.monterDimensions.height}m höjd
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: hasOrder ? '#d4edda' : '#fff3cd',
                              color: hasOrder ? '#155724' : '#856404'
                            }}>
                              {hasOrder ? '✓ Beställt' : '⏳ Väntar'}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(exhibitor.inviteLink);
                                alert('Inbjudningslänk kopierad!');
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              📋 Kopiera länk
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              📦 Beställningar ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                Inga beställningar ännu
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      padding: '20px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>
                          {order.customerInfo?.company || 'Okänt företag'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {order.customerInfo?.name} • {order.customerInfo?.email}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                          Beställd: {new Date(order.timestamp).toLocaleDateString('sv-SE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '24px',
                        color: '#2ecc71'
                      }}>
                        {formatCurrency(order.orderData?.totalPrice || 0)}
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e0e0e0'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Eventdatum</div>
                        <div style={{ fontWeight: '600' }}>{order.customerInfo?.eventDate || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Leveransadress</div>
                        <div style={{ fontWeight: '600' }}>{order.customerInfo?.deliveryAddress || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Telefon</div>
                        <div style={{ fontWeight: '600' }}>{order.customerInfo?.phone || '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              ⚙️ Event-inställningar
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Eventnamn
                </label>
                <input
                  type="text"
                  value={event.name}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#f8f9fa'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Beskrivning
                </label>
                <textarea
                  value={event.description || ''}
                  disabled
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#f8f9fa',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    Startdatum
                  </label>
                  <input
                    type="text"
                    value={event.startDate ? new Date(event.startDate).toLocaleDateString('sv-SE') : '-'}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f8f9fa'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                    Slutdatum
                  </label>
                  <input
                    type="text"
                    value={event.endDate ? new Date(event.endDate).toLocaleDateString('sv-SE') : '-'}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f8f9fa'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                  Plats
                </label>
                <input
                  type="text"
                  value={event.location || '-'}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    background: '#f8f9fa'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, title, value, subtitle, color }: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '32px' }}>{icon}</div>
        <div style={{
          fontSize: '13px',
          color: '#666',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </div>
      </div>
      <div style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '13px',
        color: '#999'
      }}>
        {subtitle}
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '13px',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: '14px',
  color: '#2c3e50'
};
