/*
 * Copyright © 2025 Klozz Holding AB. All rights reserved.
 * MONTERHYRA™ - Proprietary and Confidential
 * Event Admin Portal - För mässarrangörer att administrera sina utställare
 */

import React, { useState, useEffect } from 'react';
import { ExhibitorService } from './services/ExhibitorService';
import type { Event, Exhibitor } from './services/ExhibitorService';
import { OrderService } from './services/OrderService';
import type { Order } from './services/OrderService';

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
  
  // Login state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Check if already authenticated for this event in this session
    const sessionAuth = sessionStorage.getItem(`event_auth_${eventId}`);
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
      loadEventData();
    }
  }, [eventId]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEventData();
    }
  }, [eventId, isAuthenticated]);

  const handleLogin = async () => {
    try {
      const eventData = await ExhibitorService.getEvent(eventId);
      if (!eventData) {
        setLoginError('Event hittades inte');
        return;
      }

      // Tillåt både event-specifikt lösenord och master-lösenord
      const validPassword = passwordInput === eventData.password || passwordInput === 'monterhyra2026';
      
      if (validPassword) {
        setIsAuthenticated(true);
        sessionStorage.setItem(`event_auth_${eventId}`, 'true');
        setLoginError('');
        loadEventData();
      } else {
        setLoginError('Felaktigt lösenord');
        setPasswordInput('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Ett fel uppstod vid inloggning');
    }
  };

  const loadEventData = async () => {
    try {
      // Ladda event-data från Supabase
      const eventData = await ExhibitorService.getEvent(eventId);
      setEvent(eventData || null);

      // Ladda utställare för detta event
      const eventExhibitors = await ExhibitorService.getExhibitorsByEvent(eventId);
      setExhibitors(eventExhibitors);

      // Ladda orders från utställare i detta event
      const exhibitorIds = eventExhibitors.map(e => e.id);
      const allOrders = await OrderService.getAllOrders();
      
      // Filtrera orders som tillhör detta events utställare
      const eventOrders = allOrders.filter(order => 
        order.exhibitorId && exhibitorIds.includes(order.exhibitorId)
      );
      setOrders(eventOrders);

      // Beräkna statistik
      const totalRevenue = eventOrders.reduce((sum, order) => {
        const price = order.pricingData?.totalPrice || order.boothData?.totalPrice || 0;
        return sum + price;
      }, 0);
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

      // Real-time prenumeration på nya orders
      const unsubscribe = OrderService.subscribeToOrders((newOrder) => {
        if (newOrder.exhibitorId && exhibitorIds.includes(newOrder.exhibitorId)) {
          console.log('✅ Ny order mottagen i real-time!', newOrder.orderNumber);
          loadEventData(); // Reload data when new order arrives
        }
      });

      // Cleanup subscription on unmount
      return unsubscribe;
    } catch (error) {
      console.error('Error loading event data:', error);
    }
  };

  const exportToExcel = () => {
    // Skapa CSV-data
    const headers = ['Företag', 'Kontakt', 'Email', 'Telefon', 'Status', 'Ordernummer', 'Pris (SEK)'];
    const rows = exhibitors.map(exhibitor => {
      const order = orders.find(o => o.exhibitorId === exhibitor.id);
      const price = order ? (order.pricingData?.totalPrice || order.boothData?.totalPrice || 0) : 0;
      
      return [
        exhibitor.company || '-',
        exhibitor.name,
        exhibitor.email,
        exhibitor.phone || '-',
        order ? 'Beställt' : 'Väntar',
        order ? order.orderNumber : '-',
        price > 0 ? price.toLocaleString('sv-SE') : '-'
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
      (exhibitor.company || '').toLowerCase().includes(search) ||
      exhibitor.name.toLowerCase().includes(search) ||
      exhibitor.email.toLowerCase().includes(search)
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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              🏢
            </div>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              color: '#2c3e50'
            }}>
              Event Admin Portal
            </h2>
            <p style={{
              margin: 0,
              color: '#666',
              fontSize: '14px'
            }}>
              Logga in för att administrera ditt event
            </p>
          </div>
          
          <div style={{
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'block',
              fontWeight: '600',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#2c3e50'
            }}>
              Lösenord
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Ange ditt event-lösenord"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                border: loginError ? '2px solid #e74c3c' : '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {loginError && (
              <div style={{
                marginTop: '8px',
                color: '#e74c3c',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                ⚠️ {loginError}
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            🔓 Logga in
          </button>
          
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: '#f5f5f5',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Avbryt
          </button>
        </div>
      </div>
    );
  }

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
                          {order.customerCompany || order.customerName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('sv-SE')}
                        </div>
                      </div>
                      <div style={{
                        fontWeight: 'bold',
                        color: '#2ecc71',
                        fontSize: '18px'
                      }}>
                        {formatCurrency(order.pricingData?.totalPrice || order.boothData?.totalPrice || 0)}
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
                      const hasOrder = orders.some(o => o.exhibitorId === exhibitor.id);
                      const exhibitorOrder = orders.find(o => o.exhibitorId === exhibitor.id);
                      
                      return (
                        <tr key={exhibitor.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: '600' }}>{exhibitor.company || exhibitor.name}</div>
                          </td>
                          <td style={tableCellStyle}>{exhibitor.name}</td>
                          <td style={tableCellStyle}>
                            <a href={`mailto:${exhibitor.email}`} style={{ color: '#667eea' }}>
                              {exhibitor.email}
                            </a>
                          </td>
                          <td style={tableCellStyle}>{exhibitor.phone || '-'}</td>
                          <td style={tableCellStyle}>
                            {exhibitorOrder ? (
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                  {exhibitorOrder.orderNumber}
                                </div>
                                <div style={{ fontSize: '12px', color: '#999' }}>
                                  {formatCurrency(exhibitorOrder.pricingData?.totalPrice || exhibitorOrder.boothData?.totalPrice || 0)}
                                </div>
                              </div>
                            ) : '-'}
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
                                const inviteUrl = `https://monterhyra-live.vercel.app/app.html?exhibitor=${exhibitor.id}`;
                                navigator.clipboard.writeText(inviteUrl);
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
                          {order.customerCompany || order.customerName}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {order.customerName} • {order.customerEmail}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                          Ordernummer: {order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('sv-SE', {
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
                        {formatCurrency(order.pricingData?.totalPrice || order.boothData?.totalPrice || 0)}
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
                        <div style={{ fontWeight: '600' }}>{order.pricingData?.eventDate || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Leveransadress</div>
                        <div style={{ fontWeight: '600' }}>{order.pricingData?.deliveryAddress || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Telefon</div>
                        <div style={{ fontWeight: '600' }}>{order.customerPhone || '-'}</div>
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
