import React, { useState, useEffect } from 'react';
import { OrderManager } from './OrderManager';
import jsPDF from 'jspdf';

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
    tvs: any[];
    counters: any[];
    totalPrice: number;
    packlista?: any; // Detaljerad BeMatrix packlista
  };
  files: {
    zipFile: string; // base64 data URL
  };
  // Nya fält för personal och faktura
  staffInfo?: {
    kundansvarig: string;
    produktionsansvarig: string;
    crewByggnation: string[];
    crewRiv: string[];
  };
  invoiceInfo?: {
    invoiceAddress: string;
    orgNumber: string;
    referens: string;
    betalningsvillkor: string;
  };
}

const AdminPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loginError, setLoginError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);

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
        const parsedOrders = JSON.parse(savedOrders);
        console.log('Loaded orders:', parsedOrders);
        setOrders(parsedOrders);
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
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    }
  };

  const generateFollowupPDF = async (order: Order) => {
    try {
      const pdf = new jsPDF();
      
      // Skapa packlista-sida
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FÖLJESEDEL / PACKLISTA', 105, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Order: ${order.id}`, 15, 25);
      pdf.text(`Kund: ${order.customerInfo?.name || '-'}`, 15, 31);
      pdf.text(`Företag: ${order.customerInfo?.company || '-'}`, 15, 37);
      pdf.text(`Event:`, 15, 43);
      pdf.text(`Leveransadress:`, 15, 49);
      
      let y = 60;
      
      // Hjälpfunktion för att rita kategori-header
      const drawCategoryHeader = (title: string, color: [number, number, number]) => {
        pdf.setFillColor(...color);
        pdf.rect(15, y, 180, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 17, y + 5.5);
        pdf.setTextColor(0, 0, 0);
        y += 12; // Ökat från 10 till 12 för mer luft
      };
      
      // Hjälpfunktion för att rita item-rad
      const drawItemRow = (beskrivning: string, antal: string | number) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        // Beskrivning
        pdf.text(beskrivning, 20, y);
        
        // Antal/Storlek
        pdf.text(String(antal), 130, y, { align: 'right' });
        
        // Checkboxar
        pdf.rect(150, y - 3, 4, 4);  // Inst
        pdf.rect(165, y - 3, 4, 4);  // Lev
        pdf.rect(180, y - 3, 4, 4);  // Åter
        
        y += 5;
      };
      
      // Kolumn-headers för checkboxar
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Antal/Storlek', 130, 56, { align: 'right' });
      pdf.text('Inst.', 150, 56);
      pdf.text('Lev.', 165, 56);
      pdf.text('Åter', 180, 56);
      
      const packlista = order.orderData?.packlista?.totals || order.orderData?.packlista || {};
      
      // DEBUG: Visa vad som finns i ordern
      console.log('🔍 DEBUG - Order struktur:');
      console.log('📦 Packlista:', packlista);
      console.log('📺 TVs:', order.orderData?.tvs);
      console.log('🔲 Counters (diskar):', order.orderData?.counters);
      console.log('🪑 Furniture:', order.orderData?.furniture);
      console.log('🌿 Plants:', order.orderData?.plants);
      console.log('🎨 Graphic:', order.orderData);
      
      // Kategorisera alla items från packlistan (alla items finns redan i packlista.totals från floating packlist logic)
      const categorized: {
        tv: Array<[string, any]>;
        disk: Array<[string, any]>;
        moblerVaxter: Array<[string, any]>;
        teknik: Array<[string, any]>;
        tryck: Array<[string, any]>;
        bematrix: Array<[string, any]>;
        ovrigt: Array<[string, any]>;
      } = {
        tv: [],
        disk: [],
        moblerVaxter: [],
        teknik: [],
        tryck: [],
        bematrix: [],
        ovrigt: []
      };
      
      // Gå igenom alla items i packlistan och kategorisera
      Object.entries(packlista).forEach(([key, value]: [string, any]) => {
        // Hantera olika typer av värden (nummer, sträng, objekt)
        let quantity: number | string = 0;
        let displayValue: string | number = 0;
        
        if (typeof value === 'number') {
          quantity = value;
          displayValue = value;
        } else if (typeof value === 'string') {
          // För items som "Matta" som har strängvärden som "3×2 Röd matta"
          quantity = 1; // Anta 1 styck om det är en sträng
          displayValue = value;
        } else if (value && typeof value === 'object' && value.quantity) {
          quantity = value.quantity;
          displayValue = value.quantity;
        } else {
          return; // Hoppa över om inget giltigt värde
        }
        
        // Hoppa över om quantity är 0 eller negativt (men bara för numeriska värden)
        if (typeof quantity === 'number' && quantity <= 0) return;
        
        // TV & Skärmar - format: "TV 43"", "TV 55"" etc
        if (key.startsWith('TV ')) {
          categorized.tv.push([key, displayValue]);
        }
        // Disk - format: "disk innehylla", "Disk 1m", "Disk 1.5m", etc. OCH alla delar som hör till diskar
        else if (key.toLowerCase().includes('disk') || key.startsWith('Disk ') ||
                 key.startsWith('Bematrix ram') || key.startsWith('Barskiva') ||
                 key === 'Lister forex' || key === 'Corners' || key === 'M8pin' ||
                 key === 'Special connector' || key.startsWith('Grafik ')) {
          categorized.disk.push([key, displayValue]);
        }
        // Möbler & Växter - alla möbel- och växttyper från FURNITURE_TYPES och PLANT_TYPES
        else if (
          // Möbler
          key === 'Soffa' || key === 'Fåtölj' || key === 'Barbord' || key === 'Barstol' ||
          key === 'Pall' || key === 'Sidobord' || key === 'Klädhängare' ||
          key === 'Hyllplan' || key === 'Hyllbracket' ||
          // Växter
          key === 'Monstera' || key === 'Ficus' || key === 'Bambu' || key === 'Kaktus' ||
          key === 'Lavendel' || key === 'Palmlilja' || key === 'Rosmarin' ||
          key === 'Sansevieria' || key === 'Olivträd' || key === 'Dracaena' ||
          // Småsaker som också kan vara möbler/växter
          key === 'Blomma' || key === 'Espressomaskin' || key === 'Godiskål'
        ) {
          categorized.moblerVaxter.push([key, displayValue]);
        }
        // Teknik & Belysning
        else if (
          key === 'SAM-led' || key === 'Högtalare' || key === 'Högtalarstativ' ||
          key.includes('Högtalar')
        ) {
          categorized.teknik.push([key, displayValue]);
        }
        // Tryck & Grafik - Vepa, Forex, Hyrgrafik, Matta, Grafik
        else if (
          key.includes('Vepa') || 
          key.includes('Forex') || 
          key.includes('Hyrgrafik') ||
          key === 'Grafik' ||
          key.includes('grafik') ||
          key === 'Matta' ||
          key.startsWith('Grafik ')
        ) {
          categorized.tryck.push([key, displayValue]);
        }
        // BeMatrix - ramar och strukturdelar (men inte disk-delar eller counter-specifika delar)
        else if (
          (key.match(/^\d+\.\d+x\d+\.\d+$/) ||  // Format: 2.5x1.0, 3.0x1.0
           key.match(/^\d+x\d+$/) ||             // Format: 2x1, 3x3
           key.match(/^\d+\.\d+x\d+$/) ||        // Format: 2.5x1
           key.includes('corner') ||
           key.includes('_pin') ||
           key === 'connectors' ||
           key === 'baseplate') &&
          // Exkludera counter-specifika delar
          !key.startsWith('Bematrix ram') && !key.startsWith('Barskiva') &&
          key !== 'Lister forex' && key !== 'Corners' && key !== 'M8pin' &&
          key !== 'Special connector' && !key.startsWith('Grafik ')
        ) {
          categorized.bematrix.push([key, displayValue]);
        }
        // Övrigt - allt annat
        else {
          categorized.ovrigt.push([key, displayValue]);
        }
      });
      
      // ===== TV & SKÄRMAR =====
      if (categorized.tv.length > 0) {
        drawCategoryHeader('TV & Skärmar', [46, 125, 50]);
        categorized.tv.forEach(([key, quantity]) => {
          let displayName = key.replace('TV_', 'TV ').replace('inch', '"');
          drawItemRow(displayName, quantity);
        });
      }
      
      // ===== DISK =====
      if (categorized.disk.length > 0) {
        y += 2;
        drawCategoryHeader('Disk', [52, 73, 94]);
        categorized.disk.forEach(([key, quantity]) => {
          drawItemRow(key, quantity);
        });
      }
      
      // ===== MÖBLER & VÄXTER =====
      if (categorized.moblerVaxter.length > 0) {
        y += 2;
        drawCategoryHeader('Möbler & Växter', [39, 174, 96]);
        categorized.moblerVaxter.forEach(([key, quantity]) => {
          let displayName = key.charAt(0).toUpperCase() + key.slice(1);
          drawItemRow(displayName, quantity);
        });
      }
      
      // ===== TEKNIK & BELYSNING =====
      if (categorized.teknik.length > 0) {
        y += 2;
        drawCategoryHeader('Teknik & Belysning', [155, 89, 182]);
        categorized.teknik.forEach(([key, quantity]) => {
          drawItemRow(key, quantity);
        });
      }
      
      // ===== TRYCK & GRAFIK =====
      if (categorized.tryck.length > 0) {
        y += 2;
        drawCategoryHeader('Tryck & Grafik', [231, 76, 60]);
        categorized.tryck.forEach(([key, quantity]) => {
          drawItemRow(key, quantity);
        });
      }
      
      // ===== ÖVRIGT =====
      if (categorized.ovrigt.length > 0) {
        y += 2;
        drawCategoryHeader('Övrigt', [149, 165, 166]);
        categorized.ovrigt.forEach(([key, quantity]) => {
          let displayName = key.replace(/\./g, ',').replace(/_/g, ' ');
          drawItemRow(displayName, quantity);
        });
      }
      
      // ===== BEMATRIX =====
      if (categorized.bematrix.length > 0) {
        y += 2;
        drawCategoryHeader('BeMatrix', [230, 126, 34]);
        categorized.bematrix.forEach(([key, quantity]) => {
          let displayName = key.replace(/\./g, ',').replace(/_/g, ' ');
          
          // Specialformatering för vissa nycklar
          if (key === 'corner_90_4pin') displayName = 'Corner 90° 4-pin';
          else if (key === 't_5pin') displayName = 'T 5-pin';
          else if (key === 'm8_pin') displayName = 'M8 pin';
          else if (key === 'connectors') displayName = 'Connectors';
          else if (key === 'baseplate') displayName = 'Baseplate';
          
          drawItemRow(displayName, quantity);
        });
      }
      
      // ===== BM ACC (alltid samma lista) =====
      y += 2;
      drawCategoryHeader('BM Acc', [241, 196, 15]);
      
      const bmAccItems = [
        ['BM Acc väska', '1'],
        ['Montagehandskar', '2'],
        ['Vita handskar', '2'],
        ['Spännremmar', '10'],
        ['Gaffatejp Svart + vit', '1+1'],
        ['Issotejp Svart + grå', '1+1'],
        ['Rengöringsspray', '1'],
        ['Trasa', '1'],
        ['Buntband vita/svarta', '10/10'],
        ['Stege', '2'],
        ['Skruvlåda', '1'],
        ['Bult & mutterlåda', '1'],
        ['Kardborre Ho + Ha', '1+1'],
        ['Dubbelhäft smal', '1'],
        ['Dubbelhäft bred', '1'],
        ['Högtalare', '1'],
        ['Sopborste', '1'],
        ['Packtejp', '2'],
        ['Vitt spännband m.m', '1'],
        ['Sträckfilm', '1'],
        ['Dammsugare', '1'],
        ['Verktygsväska', '1'],
        ['Skruvdragare', '1'],
        ['Bitssats', '1']
      ];
      
      bmAccItems.forEach(([item, antal]) => {
        drawItemRow(item, antal);
      });
      
      // Anteckningar
      if (y < 240) {
        y += 5;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Anteckningar:', 15, y);
        y += 5;
        
        // Rita linjer för anteckningar
        for (let i = 0; i < 4; i++) {
          pdf.line(15, y, 195, y);
          y += 7;
        }
      }
      
      // Spara PDF
      pdf.save(`foljesedel-${order.id}.pdf`);
      console.log('Följesedel genererad!');
    } catch (error) {
      console.error('Fel vid generering av följesedel:', error);
      alert('Kunde inte generera följesedel. Se konsolen för detaljer.');
    }
  };

  const startEditing = (order: Order) => {
    const clonedOrder = JSON.parse(JSON.stringify(order));
    
    // Initiera staffInfo om det inte finns
    if (!clonedOrder.staffInfo) {
      // Räkna hur många crew som behövs baserat på prislistan
      const has3PersonCost = clonedOrder.orderData.packlista && 
        Object.keys(clonedOrder.orderData.packlista).some((key: string) => 
          key.toLowerCase().includes('3 personer') || 
          key.toLowerCase().includes('3personer') ||
          key.toLowerCase().includes('3-personer')
        );
      
      const crewCount = has3PersonCost ? 3 : 2;
      
      clonedOrder.staffInfo = {
        kundansvarig: '',
        produktionsansvarig: '',
        crewByggnation: Array(crewCount).fill(''),
        crewRiv: Array(crewCount).fill('')
      };
    }
    
    // Initiera invoiceInfo om det inte finns
    if (!clonedOrder.invoiceInfo) {
      clonedOrder.invoiceInfo = {
        invoiceAddress: clonedOrder.customerInfo.deliveryAddress || '',
        orgNumber: '',
        referens: '',
        betalningsvillkor: '30 dagar'
      };
    }
    
    setEditedOrder(clonedOrder);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedOrder(null);
    setIsEditing(false);
  };

  const saveEdits = () => {
    if (!editedOrder) return;
    
    const updatedOrders = orders.map(order => 
      order.id === editedOrder.id ? editedOrder : order
    );
    
    setOrders(updatedOrders);
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
    setSelectedOrder(editedOrder);
    setEditedOrder(null);
    setIsEditing(false);
    
    alert('Ändringar sparade!');
  };

  const updateEditedField = (section: 'customerInfo' | 'staffInfo' | 'invoiceInfo', field: string, value: string) => {
    if (!editedOrder) return;
    
    setEditedOrder({
      ...editedOrder,
      [section]: {
        ...editedOrder[section],
        [field]: value
      }
    });
  };

  const updateCrewMember = (section: 'crewByggnation' | 'crewRiv', index: number, value: string) => {
    if (!editedOrder || !editedOrder.staffInfo) return;
    
    const newCrew = [...editedOrder.staffInfo[section]];
    newCrew[index] = value;
    
    setEditedOrder({
      ...editedOrder,
      staffInfo: {
        ...editedOrder.staffInfo,
        [section]: newCrew
      }
    });
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
        maxWidth: selectedOrder ? '1400px' : '1200px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {selectedOrder && (
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsEditing(false);
                  setEditedOrder(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ← Tillbaka till lista
              </button>
            )}
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: '0 0 4px 0'
              }}>
                {selectedOrder ? `Beställning #${selectedOrder.id}` : 'Admin Portal'}
              </h1>
              <p style={{
                color: '#666',
                margin: 0,
                fontSize: '14px'
              }}>
                {selectedOrder ? `Skapad: ${formatDate(selectedOrder.timestamp)}` : `${orders.length} beställningar totalt`}
              </p>
            </div>
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

        {/* Overview List eller Detail View */}
        {!selectedOrder ? (
          /* Overview List */
          orders.length === 0 ? (
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
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              maxHeight: '70vh',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e0 #f7fafc'
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 180px 150px 180px',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: '#34495e',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}>
                <div>Order #</div>
                <div>Kund</div>
                <div>Eventdatum</div>
                <div>Totalpris</div>
                <div>Åtgärder</div>
              </div>

              {/* Table Rows */}
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr 180px 150px 180px',
                    gap: '16px',
                    padding: '20px',
                    borderBottom: '1px solid #ecf0f1',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>#{order.id}</div>
                  <div style={{ color: '#34495e' }}>
                    <div style={{ fontWeight: '600' }}>{order.customerInfo?.name || 'Okänd'}</div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{order.customerInfo?.company || '-'}</div>
                  </div>
                  <div style={{ color: '#34495e' }}>{order.customerInfo?.eventDate || '-'}</div>
                  <div style={{ fontWeight: '600', color: '#27ae60' }}>{formatPrice(order.orderData?.totalPrice || 0)}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      Visa detaljer →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Detail View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Action Buttons */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}>
              {!isEditing ? (
                <>
                  <button
                    onClick={() => startEditing(selectedOrder)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ✏️ Redigera
                  </button>
                  <button
                    onClick={() => downloadZip(selectedOrder.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    📦 Ladda ner tryckfiler
                  </button>
                  <button
                    onClick={() => generateFollowupPDF(selectedOrder)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    📋 Följesedel
                  </button>
                  <button
                    onClick={() => deleteOrder(selectedOrder.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: 'auto'
                    }}
                  >
                    🗑️ Ta bort
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveEdits}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ✅ Spara ändringar
                  </button>
                  <button
                    onClick={cancelEditing}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ❌ Avbryt
                  </button>
                </>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px'
            }}>
              {/* Kundinfo */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 16px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #3498db'
                }}>
                  👤 Kunduppgifter
                </h3>
                {isEditing && editedOrder ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Namn:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.name || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'name', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>E-post:</label>
                      <input
                        type="email"
                        value={editedOrder.customerInfo?.email || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'email', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Telefon:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.phone || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'phone', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Företag:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.company || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'company', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Leveransadress:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.deliveryAddress || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'deliveryAddress', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#34495e' }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Namn:</strong> {selectedOrder.customerInfo?.name || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>E-post:</strong> {selectedOrder.customerInfo?.email || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Telefon:</strong> {selectedOrder.customerInfo?.phone || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Företag:</strong> {selectedOrder.customerInfo?.company || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Leveransadress:</strong> {selectedOrder.customerInfo?.deliveryAddress || '-'}</p>
                  </div>
                )}
              </div>

              {/* Eventinfo */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 16px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #9b59b6'
                }}>
                  📅 Eventuppgifter
                </h3>
                {isEditing && editedOrder ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Eventdatum:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.eventDate || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'eventDate', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Eventtid:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.eventTime || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'eventTime', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Uppsättningstid:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.setupTime || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'setupTime', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Hämtningstid:</label>
                      <input
                        type="text"
                        value={editedOrder.customerInfo?.pickupTime || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'pickupTime', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Meddelande:</label>
                      <textarea
                        value={editedOrder.customerInfo?.message || ''}
                        onChange={(e) => updateEditedField('customerInfo', 'message', e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#34495e' }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Eventdatum:</strong> {selectedOrder.customerInfo?.eventDate || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Eventtid:</strong> {selectedOrder.customerInfo?.eventTime || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Uppsättningstid:</strong> {selectedOrder.customerInfo?.setupTime || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Hämtningstid:</strong> {selectedOrder.customerInfo?.pickupTime || '-'}</p>
                    {selectedOrder.customerInfo?.message && (
                      <p style={{ margin: '12px 0 0 0', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px', borderLeft: '3px solid #ffc107' }}>
                        <strong>Meddelande:</strong><br/>{selectedOrder.customerInfo.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Personal Info */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 16px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #e67e22'
                }}>
                  👥 Personaluppgifter
                </h3>
                {isEditing && editedOrder && editedOrder.staffInfo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Kundansvarig:</label>
                      <input
                        type="text"
                        value={editedOrder.staffInfo?.kundansvarig || ''}
                        onChange={(e) => updateEditedField('staffInfo', 'kundansvarig', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Namn på kundansvarig"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Produktionsansvarig:</label>
                      <input
                        type="text"
                        value={editedOrder.staffInfo?.produktionsansvarig || ''}
                        onChange={(e) => updateEditedField('staffInfo', 'produktionsansvarig', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Namn på produktionsansvarig"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Crew Byggnation ({editedOrder.staffInfo?.crewByggnation?.length || 0} personer):</label>
                      {(editedOrder.staffInfo?.crewByggnation || []).map((member, index) => (
                        <input
                          key={`bygg-${index}`}
                          type="text"
                          value={member || ''}
                          onChange={(e) => updateCrewMember('crewByggnation', index, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '6px' }}
                          placeholder={`Person ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>Crew Riv ({editedOrder.staffInfo?.crewRiv?.length || 0} personer):</label>
                      {(editedOrder.staffInfo?.crewRiv || []).map((member, index) => (
                        <input
                          key={`riv-${index}`}
                          type="text"
                          value={member || ''}
                          onChange={(e) => updateCrewMember('crewRiv', index, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '6px' }}
                          placeholder={`Person ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#34495e' }}>
                    {selectedOrder.staffInfo ? (
                      <>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Kundansvarig:</strong> {selectedOrder.staffInfo.kundansvarig || '-'}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Produktionsansvarig:</strong> {selectedOrder.staffInfo.produktionsansvarig || '-'}</p>
                        <p style={{ margin: '12px 0 8px 0', fontWeight: '600' }}>Crew Byggnation:</p>
                        {(selectedOrder.staffInfo.crewByggnation || []).map((member, index) => (
                          <p key={`bygg-${index}`} style={{ margin: '0 0 4px 16px' }}>• {member || '-'}</p>
                        ))}
                        <p style={{ margin: '12px 0 8px 0', fontWeight: '600' }}>Crew Riv:</p>
                        {(selectedOrder.staffInfo.crewRiv || []).map((member, index) => (
                          <p key={`riv-${index}`} style={{ margin: '0 0 4px 16px' }}>• {member || '-'}</p>
                        ))}
                      </>
                    ) : (
                      <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>Ingen personalinformation registrerad</p>
                    )}
                  </div>
                )}
              </div>

              {/* Faktura Info */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 16px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #16a085'
                }}>
                  💰 Fakturauppgifter
                </h3>
                {isEditing && editedOrder && editedOrder.invoiceInfo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Fakturaadress:</label>
                      <input
                        type="text"
                        value={editedOrder.invoiceInfo?.invoiceAddress || ''}
                        onChange={(e) => updateEditedField('invoiceInfo', 'invoiceAddress', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Fakturaadress"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Organisationsnummer:</label>
                      <input
                        type="text"
                        value={editedOrder.invoiceInfo?.orgNumber || ''}
                        onChange={(e) => updateEditedField('invoiceInfo', 'orgNumber', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="XXXXXX-XXXX"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Referens:</label>
                      <input
                        type="text"
                        value={editedOrder.invoiceInfo?.referens || ''}
                        onChange={(e) => updateEditedField('invoiceInfo', 'referens', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Referensperson eller nummer"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Betalningsvillkor:</label>
                      <input
                        type="text"
                        value={editedOrder.invoiceInfo?.betalningsvillkor || ''}
                        onChange={(e) => updateEditedField('invoiceInfo', 'betalningsvillkor', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Ex: 30 dagar"
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#34495e' }}>
                    {selectedOrder.invoiceInfo ? (
                      <>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Fakturaadress:</strong> {selectedOrder.invoiceInfo.invoiceAddress || '-'}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Org.nummer:</strong> {selectedOrder.invoiceInfo.orgNumber || '-'}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Referens:</strong> {selectedOrder.invoiceInfo.referens || '-'}</p>
                        <p style={{ margin: '0 0 8px 0' }}><strong>Betalningsvillkor:</strong> {selectedOrder.invoiceInfo.betalningsvillkor || '-'}</p>
                      </>
                    ) : (
                      <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>Ingen fakturainformation registrerad</p>
                    )}
                  </div>
                )}
              </div>

              {/* Packlista */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 16px 0',
                  paddingBottom: '12px',
                  borderBottom: '2px solid #9b59b6'
                }}>
                  � Komplett Packlista
                </h3>
                <div style={{ fontSize: '14px', color: '#34495e' }}>
                  {(() => {
                    const packlista = selectedOrder.orderData?.packlista?.totals || selectedOrder.orderData?.packlista || {};

                    // Kategorisera alla items (samma som i PDF)
                    const categorized: {
                      tv: Array<[string, any]>;
                      disk: Array<[string, any]>;
                      moblerVaxter: Array<[string, any]>;
                      teknik: Array<[string, any]>;
                      tryck: Array<[string, any]>;
                      bematrix: Array<[string, any]>;
                      ovrigt: Array<[string, any]>;
                    } = {
                      tv: [],
                      disk: [],
                      moblerVaxter: [],
                      teknik: [],
                      tryck: [],
                      bematrix: [],
                      ovrigt: []
                    };

                    // Gå igenom alla items i packlistan och kategorisera
                    Object.entries(packlista).forEach(([key, value]: [string, any]) => {
                      // Hantera olika typer av värden (nummer, sträng, objekt)
                      let quantity: number | string = 0;
                      let displayValue: string | number = 0;

                      if (typeof value === 'number') {
                        quantity = value;
                        displayValue = value;
                      } else if (typeof value === 'string') {
                        // För items som "Matta" som har strängvärden
                        quantity = 1;
                        displayValue = value;
                      } else if (value && typeof value === 'object' && value.quantity) {
                        quantity = value.quantity;
                        displayValue = value.quantity;
                      } else {
                        return; // Hoppa över om inget giltigt värde
                      }

                      // Hoppa över om quantity är 0 eller negativt (men bara för numeriska värden)
                      if (typeof quantity === 'number' && quantity <= 0) return;

                      // TV & Skärmar - format: "TV 43"", "TV 55"" etc
                      if (key.startsWith('TV ')) {
                        categorized.tv.push([key, displayValue]);
                      }
                      // Disk - format: "disk innehylla", "Disk 1m", "Disk 1.5m", etc. OCH alla delar som hör till diskar
                      else if (key.toLowerCase().includes('disk') || key.startsWith('Disk ') ||
                               key.startsWith('Bematrix ram') || key.startsWith('Barskiva') ||
                               key === 'Lister forex' || key === 'Corners' || key === 'M8pin' ||
                               key === 'Special connector' || key.startsWith('Grafik ')) {
                        categorized.disk.push([key, displayValue]);
                      }
                      // Möbler & Växter - alla möbel- och växttyper från FURNITURE_TYPES och PLANT_TYPES
                      else if (
                        // Möbler
                        key === 'Soffa' || key === 'Fåtölj' || key === 'Barbord' || key === 'Barstol' ||
                        key === 'Pall' || key === 'Sidobord' || key === 'Klädhängare' ||
                        key === 'Hyllplan' || key === 'Hyllbracket' ||
                        // Växter
                        key === 'Monstera' || key === 'Ficus' || key === 'Bambu' || key === 'Kaktus' ||
                        key === 'Lavendel' || key === 'Palmlilja' || key === 'Rosmarin' ||
                        key === 'Sansevieria' || key === 'Olivträd' || key === 'Dracaena' ||
                        // Småsaker som också kan vara möbler/växter
                        key === 'Blomma' || key === 'Espressomaskin' || key === 'Godiskål'
                      ) {
                        categorized.moblerVaxter.push([key, displayValue]);
                      }
                      // Teknik & Belysning
                      else if (
                        key === 'SAM-led' || key === 'Högtalare' || key === 'Högtalarstativ' ||
                        key.includes('Högtalar')
                      ) {
                        categorized.teknik.push([key, displayValue]);
                      }
                      // Tryck & Grafik - Vepa, Forex, Hyrgrafik, Matta, Grafik
                      else if (
                        key.includes('Vepa') ||
                        key.includes('Forex') ||
                        key.includes('Hyrgrafik') ||
                        key === 'Grafik' ||
                        key.includes('grafik') ||
                        key === 'Matta' ||
                        key.startsWith('Grafik ')
                      ) {
                        categorized.tryck.push([key, displayValue]);
                      }
                      // BeMatrix - ramar och strukturdelar (men inte disk-delar eller counter-specifika delar)
                      else if (
                        (key.match(/^\d+\.\d+x\d+\.\d+$/) ||  // Format: 2.5x1.0, 3.0x1.0
                         key.match(/^\d+x\d+$/) ||             // Format: 2x1, 3x3
                         key.match(/^\d+\.\d+x\d+$/) ||        // Format: 2.5x1
                         key.includes('corner') ||
                         key.includes('_pin') ||
                         key === 'connectors' ||
                         key === 'baseplate') &&
                        // Exkludera counter-specifika delar
                        !key.startsWith('Bematrix ram') && !key.startsWith('Barskiva') &&
                        key !== 'Lister forex' && key !== 'Corners' && key !== 'M8pin' &&
                        key !== 'Special connector' && !key.startsWith('Grafik ')
                      ) {
                        categorized.bematrix.push([key, displayValue]);
                      }
                      // Övrigt - allt annat
                      else {
                        categorized.ovrigt.push([key, displayValue]);
                      }
                    });

                    // Rendera kategorierna
                    const renderCategory = (title: string, items: Array<[string, any]>, color: string) => {
                      if (items.length === 0) return null;

                      return (
                        <div style={{ marginBottom: '20px' }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: color,
                            margin: '0 0 8px 0',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {title}
                          </h4>
                          <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: `1px solid ${color}20` }}>
                            {items.map(([key, value]) => (
                              <div key={key} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '4px 0',
                                borderBottom: '1px solid #f0f0f0'
                              }}>
                                <span style={{ fontWeight: '500' }}>{key}</span>
                                <span style={{
                                  backgroundColor: color,
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {typeof value === 'number' ? value : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {renderCategory('🏠 Matta & Golvläggning', categorized.tryck.filter(([key]) => key === 'Matta'), '#8e44ad')}
                        {renderCategory('🏢 Väggar & Föråd', categorized.tryck.filter(([key]) => key.includes('Vepa') || key.includes('Forex') || key.includes('Hyrgrafik') || key.includes('Förråd')), '#e67e22')}
                        {renderCategory('📺 TV & Skärmar', categorized.tv, '#2ecc71')}
                        {renderCategory('🍽️ Disk & Tillbehör', categorized.disk, '#3498db')}
                        {renderCategory('🪑 Möbler & Växter', categorized.moblerVaxter, '#9b59b6')}
                        {renderCategory('🔌 Teknik & Belysning', categorized.teknik, '#e74c3c')}
                        {renderCategory('🔧 BeMatrix Ramar', categorized.bematrix, '#f39c12')}
                        {renderCategory('📦 Övrigt', categorized.ovrigt, '#95a5a6')}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;