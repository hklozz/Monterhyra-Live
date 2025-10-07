import React, { useState, useEffect } from 'react';
import { OrderManager } from './OrderManager';

interface Order {
  id: string;
  timestamp: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
    deliveryAddress: string;
    eventDate: string;
    eventTime: string;
    setupTime: string;
    pickupTime: string;
    message: string;
  };
  orderData: {
    floorSize: any;
    wallConfig: any;
    furniture: any[];
    plants: any[];
    decorations: any[];
    storages: any[];
    totalPrice: number;
  };
  files: {
    zipFile: string; // base64 data URL
  };
}

const AdminPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Kolla om admin redan är inloggad
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'monterhyra2024') {
      setIsLoggedIn(true);
      loadOrders();
    }
  }, []);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem('adminOrders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (error) {
        console.error('Fel vid laddning av beställningar:', error);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'monterhyra2024') {
      setIsLoggedIn(true);
      setLoginError('');
      localStorage.setItem('adminSession', 'monterhyra2024');
      loadOrders();
    } else {
      setLoginError('Felaktigt lösenord');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    localStorage.removeItem('adminSession');
  };

  const downloadZip = async (orderId: string) => {
    try {
      await OrderManager.downloadZip(orderId);
    } catch (error) {
      console.error('Fel vid nedladdning:', error);
      alert('Kunde inte ladda ner ZIP-fil');
    }
  };

  const deleteOrder = (orderId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna beställning?')) {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('sv-SE');
  };

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2c3e50',
              margin: '0 0 8px 0'
            }}>Admin Portal</h1>
            <p style={{
              color: '#666',
              margin: 0
            }}>Monterhyra Beställningar</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                Lösenord:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="Ange admin lösenord"
                required
              />
            </div>

            {loginError && (
              <div style={{
                color: '#e74c3c',
                fontSize: '14px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logga in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2c3e50',
              margin: '0 0 4px 0'
            }}>Admin Portal</h1>
            <p style={{
              color: '#666',
              margin: 0,
              fontSize: '14px'
            }}>
              {orders.length} beställningar totalt
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logga ut
          </button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <p style={{
              color: '#666',
              fontSize: '18px',
              margin: 0
            }}>
              Inga beställningar ännu
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#2c3e50',
                      margin: '0 0 4px 0'
                    }}>
                      Beställning #{order.id}
                    </h3>
                    <p style={{
                      color: '#666',
                      fontSize: '14px',
                      margin: 0
                    }}>
                      {formatDate(order.timestamp)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => downloadZip(order.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Ladda ner ZIP
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Ta bort
                    </button>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Kundinfo */}
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: '0 0 12px 0'
                    }}>
                      Kunduppgifter
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <p><strong>Namn:</strong> {order.customerInfo.name}</p>
                      <p><strong>E-post:</strong> {order.customerInfo.email}</p>
                      <p><strong>Telefon:</strong> {order.customerInfo.phone}</p>
                      <p><strong>Företag:</strong> {order.customerInfo.company}</p>
                      <p><strong>Leveransadress:</strong> {order.customerInfo.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Eventinfo */}
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: '0 0 12px 0'
                    }}>
                      Eventuppgifter
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <p><strong>Eventdatum:</strong> {order.customerInfo.eventDate}</p>
                      <p><strong>Eventtid:</strong> {order.customerInfo.eventTime}</p>
                      <p><strong>Uppsättningstid:</strong> {order.customerInfo.setupTime}</p>
                      <p><strong>Hämtningstid:</strong> {order.customerInfo.pickupTime}</p>
                      {order.customerInfo.message && (
                        <p><strong>Meddelande:</strong> {order.customerInfo.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Beställningsinfo */}
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: '0 0 12px 0'
                    }}>
                      Beställningsdetaljer
                    </h4>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <p><strong>Totalpris:</strong> {formatPrice(order.orderData.totalPrice)}</p>
                      <p><strong>Möbler:</strong> {order.orderData.furniture.length} st</p>
                      <p><strong>Växter:</strong> {order.orderData.plants.length} st</p>
                      <p><strong>Förråd:</strong> {order.orderData.storages.length} st</p>
                      <p><strong>ZIP-fil:</strong> {order.files.zipFile ? 'Tillgänglig' : 'Saknas'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;