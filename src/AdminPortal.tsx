import React, { useState } from 'react';
import * as THREE from 'three';
import { buildSceneFromOrderData } from './buildSceneFromOrderData';
import { exportSceneToGLTF, exportSceneToThreeJSON } from './exportSceneToGLTF';
import { OrderManager } from './OrderManager';
import { ExhibitorService } from './services/ExhibitorService';
import jsPDF from 'jspdf';

  // Rensa alla tryckfiler/ordrar
  const clearAllPrintFiles = () => {
    if (window.confirm('Är du säker på att du vill rensa ALLA tryckfiler? Detta går inte att ångra.')) {
      localStorage.removeItem('adminOrders');
  // setOrders is not defined here, remove or define if needed
    }
  };
  // Hämta PDF från IndexedDB och ladda ner
  const downloadPDFfromIDB = async (orderId: string) => {
    try {
      // @ts-ignore: OrderManager har metoden men TS kanske inte vet
      const blob = await OrderManager.getBlobFromIDB(orderId);
      if (!blob) {
        alert('Kunde inte hitta PDF i IndexedDB!');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tryckfil_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      alert('Fel vid hämtning av PDF från IndexedDB!');
      console.error('downloadPDFfromIDB error:', err);
    }
  };
// ...existing imports at the top of the file...

interface Order {
  id: string;
  timestamp: string;
  namn?: string; // Valfritt namn på order eller tryckfil
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
    images?: string[]; // Tre base64-bilder (JPEG/PNG) från beställning
  };
  files: {
    zipFile: string; // base64 data URL
    objFile?: string; // base64 data URL for OBJ file
    storedInIDB?: boolean;
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
  checklist?: Array<{ text: string; completed: boolean }>;
  printOnly?: boolean;
}

const AdminPortal: React.FC<{ 
  onOpenExhibitorAdmin?: () => void;
  onOpenEventAdmin?: (eventId: string) => void;
}> = ({ onOpenEventAdmin }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  // Filtrera ut autosparade tryckfiler från orderlistan
  const realOrders = orders.filter(order => {
    // Dölj om printOnly är true eller kundnamnet börjar med 'Auto-saved:'
    return !order.printOnly && !(order.customerInfo?.name?.startsWith('Auto-saved:'));
  });
  // Logga alla ordrar till konsolen för felsökning
  React.useEffect(() => {
    console.log('Alla ordrar i adminpanelen:', orders);
  }, [orders]);
  const [loginError, setLoginError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  
  // Supabase Events state
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventPassword, setNewEventPassword] = useState('');
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Ladda alla events när EventCreator öppnas
  React.useEffect(() => {
    if (showEventCreator) {
      loadAllEvents();
    }
  }, [showEventCreator]);

  const loadAllEvents = async () => {
    try {
      const events = await ExhibitorService.getAllEvents();
      setAllEvents(events);
    } catch (error) {
      console.error('Kunde inte ladda events:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Är du säker på att du vill ta bort eventet "${eventName}"?\n\nDetta tar även bort alla utställare och deras data. Detta går INTE att ångra!`)) {
      return;
    }
    
    try {
      console.log('🗑️ Raderar event:', eventId);
      await ExhibitorService.deleteEvent(eventId);
      console.log('✅ Event raderat, laddar om lista...');
      
      if (createdEvent?.id === eventId) {
        setCreatedEvent(null);
      }
      
      // Ladda om eventlistan
      const events = await ExhibitorService.getAllEvents();
      console.log('📋 Nya eventlistan:', events);
      setAllEvents(events);
      
      alert('✅ Event borttaget!');
    } catch (error: any) {
      console.error('❌ Fel vid borttagning:', error);
      alert('Fel vid borttagning: ' + error.message);
    }
  };

  const handleCreateSupabaseEvent = async () => {
    if (!newEventName.trim()) {
      alert('Ange eventnamn');
      return;
    }
    
    try {
      const event = await ExhibitorService.createEvent(
        newEventName,
        undefined,
        {
          password: newEventPassword || undefined
        }
      );
      
      setCreatedEvent(event);
      loadAllEvents(); // Uppdatera listan
      alert(`✅ Event skapat!\n\nEvent-ID: ${event.id}\nLösenord: ${event.password}\n\nDu kan nu öppna EventAdminPortal`);
      setNewEventName('');
      setNewEventPassword('');
    } catch (error: any) {
      alert('Fel: ' + error.message);
    }
  };

  // Generera och ladda ner en ny PDF för ordern (med bilder, pris, packlista, villkor)
  const generateOrderPDF = async () => {
    if (!selectedOrder) {
      alert('Ingen order vald!');
      return;
    }
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      // Om sparade bilder finns, använd dem
      let addedImage = false;
      const images = selectedOrder.orderData?.images;
      if (images && Array.isArray(images) && images.length > 0) {
        images.slice(0, 3).forEach((img, idx) => {
          try {
            pdf.addImage(img, 'JPEG', 15, 15, 180, 100);
            if (idx < 2) pdf.addPage();
            addedImage = true;
          } catch (e) {
            // skip if error
          }
        });
      }
      // Fallback: försök hämta canvas-bilder om inga sparade bilder finns
      if (!addedImage) {
        const canvases = document.querySelectorAll('canvas');
        for (let i = 0; i < canvases.length && i < 3; i++) {
          try {
            const imgData = canvases[i].toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 15, 15, 180, 100);
            if (i < 2) pdf.addPage();
            addedImage = true;
          } catch (e) {
            // skip if error
          }
        }
      }
      if (!addedImage) {
        // Lägg till en tom sida om inga bilder hittades
        pdf.setFontSize(18);
        pdf.text('Montervy saknas', 105, 60, { align: 'center' });
      }
      // (Orderinformation, packlista och villkor tas bort enligt önskemål)
      // Ladda ner PDF
      pdf.save(`monteroffert-${selectedOrder.id}.pdf`);
    } catch (err) {
      alert('Fel vid generering av PDF!');
      console.error('generateOrderPDF error:', err);
    }
  };

  // Checklist state and functions
  const DEFAULT_CHECKLIST_ITEMS = [
    'Offert OK?',
    '3D ritning',
    'Ritning OK?',
    'Monternummer?',
    'Datum BYGG & RIV?',
    'Original deadline',
    'Order grafik',
    'Order matta',
    'Order teknik',
    'Personal BYGG & RIV?',
    'Boka lastning / lossning mässan',
    'Frakter & Bokning b-bil i kalender',
    'Följesedel',
    'Adresslappar - Frakt & Retur',
    'Packa',
    'Kunds material - Vad göra?',
    'Fotografering jobb',
    'Tillbaka på lager'
  ];

  const getChecklistForOrder = (order: Order) => {
    if (!order.checklist) {
      order.checklist = DEFAULT_CHECKLIST_ITEMS.map(item => ({ text: item, completed: false }));
    }
    return order.checklist;
  };

  const toggleChecklistItem = (order: Order, index: number) => {
    const checklist = getChecklistForOrder(order);
    checklist[index].completed = !checklist[index].completed;
    setSelectedOrder({ ...selectedOrder! });

    // Spara ändringen till localStorage
    const updatedOrders = orders.map(o =>
      o.id === order.id ? { ...o, checklist: [...checklist] } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
  };

  const addChecklistItem = (order: Order, text: string) => {
    if (!text.trim()) return;
    const checklist = getChecklistForOrder(order);
    checklist.push({ text: text.trim(), completed: false });
    setSelectedOrder({ ...selectedOrder! });

    // Spara ändringen till localStorage
    const updatedOrders = orders.map(o =>
      o.id === order.id ? { ...o, checklist: [...checklist] } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
  };

  // Inline edit state for checklist items
  const [editingChecklistIndex, setEditingChecklistIndex] = useState<number | null>(null);
  const [editingChecklistValue, setEditingChecklistValue] = useState('');

  const startEditChecklistItem = (index: number, currentText: string) => {
    setEditingChecklistIndex(index);
    setEditingChecklistValue(currentText);
  };

  const commitEditChecklistItem = (order: Order) => {
    if (editingChecklistIndex === null) return;
    const checklist = getChecklistForOrder(order);
    checklist[editingChecklistIndex].text = editingChecklistValue.trim() || checklist[editingChecklistIndex].text;
    setEditingChecklistIndex(null);
    setEditingChecklistValue('');
    setSelectedOrder({ ...selectedOrder! });

    // Spara ändringen till localStorage
    const updatedOrders = orders.map(o =>
      o.id === order.id ? { ...o, checklist: [...checklist] } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
  };

  const cancelEditChecklistItem = () => {
    setEditingChecklistIndex(null);
    setEditingChecklistValue('');
  };

  // If not used, consider removing or exporting
  // @ts-ignore - Unused function kept for future use
  const _renderChecklist = (order: Order) => {
    const checklist = getChecklistForOrder(order);
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {checklist.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            {editingChecklistIndex === index ? (
              <>
                <input
                  type="text"
                  value={editingChecklistValue}
                  onChange={(e) => setEditingChecklistValue(e.target.value)}
                  style={{ flex: 1, marginRight: '8px' }}
                />
                <button onClick={() => commitEditChecklistItem(order)}>✔</button>
                <button onClick={cancelEditChecklistItem}>✖</button>
              </>
            ) : (
              <>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(order, index)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ flex: 1 }}>{item.text}</span>
                <button onClick={() => startEditChecklistItem(index, item.text)} style={{ marginLeft: '8px' }}>Redigera</button>
              </>
            )}
          </li>
        ))}
      </ul>
    );
  };

  // Kolla om admin redan är inloggad
  React.useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'monterhyra2026') {
      setIsLoggedIn(true);
      loadOrders();
    }
  }, []);

  const loadOrders = () => {
    const savedOrders = localStorage.getItem('adminOrders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
        // Logga direkt efter setOrders
        setTimeout(() => {
          console.log('Loaded orders (efter setOrders):', parsedOrders);
        }, 0);
      } catch (error) {
        console.error('Fel vid laddning av beställningar:', error);
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'monterhyra2026') {
      setIsLoggedIn(true);
      setLoginError('');
      localStorage.setItem('adminSession', 'monterhyra2026');
      loadOrders();
    } else {
      setLoginError('Felaktigt lösenord');
    }
  };

  // If not used, consider removing or exporting
  // @ts-ignore - Unused function kept for future use
  const _handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    localStorage.removeItem('adminSession');
  };

  // If not used, consider removing or exporting
  // @ts-ignore - Unused function kept for future use
  const _downloadZip = async (orderId: string) => {
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

  const createTrelloCard = async (order: Order) => {
    if (!order) {
      alert('Ingen order vald!');
      return;
    }

    const projectName = `Monterhyra Order #${order.id} - ${order.customerInfo?.company || order.customerInfo?.name || 'Okänd kund'}`;

    try {
      const response = await fetch('http://localhost:4000/api/trello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          desc: `Beställning från ${order.customerInfo?.name || 'Okänd'} (${order.customerInfo?.company || ''})\nEventdatum: ${order.customerInfo?.eventDate || 'Ej angivet'}\nTotalpris: ${order.orderData?.totalPrice?.toLocaleString('sv-SE') || 0} kr`,
          due: order.customerInfo?.eventDate ? new Date(order.customerInfo.eventDate).toISOString() : null
        })
      });

      if (response.ok) {
        alert('Order skickad till Trello!');
      } else {
        const errorText = await response.text();
        alert('Fel vid skapande av Trello-kort: ' + errorText);
      }
    } catch (error) {
      alert('Tekniskt fel vid Trello-anrop: ' + error);
    }
  };

  const downloadGLTF = async (orderId: string) => {
    try {
      const order = OrderManager.getOrder(orderId);
      if (!order) {
        throw new Error('Beställning hittades inte');
      }

      console.log('🚀 Genererar 3D-scen för GLTF-export...', order.orderData);

      const scene = buildSceneFromOrderData(order.orderData);

      console.log('📊 Scen skapad för GLTF, antal objekt:', scene.children.length);

      // Räkna meshes
      let meshCount = 0;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) meshCount++;
      });
      console.log('📊 Meshes i scenen:', meshCount);

      if (meshCount === 0) {
        throw new Error('Inga 3D-objekt att exportera. Kontrollera att beställningen innehåller möbler, förråd eller andra element.');
      }

      console.log('📤 Exporterar till GLTF/GLB...');
      const filename = `3D-modell_${orderId}`;
      await exportSceneToGLTF(scene, filename, true); // true = GLB format

    } catch (error) {
      console.error('Fel vid GLTF-nedladdning:', error);
      alert('Kunde inte ladda ner GLTF-fil: ' + (error as Error).message);
    }
  };

  const downloadThreeJSON = async (orderId: string) => {
    try {
      const order = OrderManager.getOrder(orderId);
      if (!order) {
        throw new Error('Beställning hittades inte');
      }

      console.log('🚀 Genererar 3D-scen för Three.js JSON-export...', order.orderData);

      const scene = buildSceneFromOrderData(order.orderData);

      console.log('📊 Scen skapad för JSON, antal objekt:', scene.children.length);

      // Räkna meshes
      let meshCount = 0;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) meshCount++;
      });
      console.log('📊 Meshes i scenen:', meshCount);

      if (meshCount === 0) {
        throw new Error('Inga 3D-objekt att exportera. Kontrollera att beställningen innehåller möbler, förråd eller andra element.');
      }

      console.log('📤 Exporterar till Three.js JSON...');
      const filename = `3D-modell_${orderId}`;
      await exportSceneToThreeJSON(scene, filename);

    } catch (error) {
      console.error('Fel vid Three.js JSON-nedladdning:', error);
      alert('Kunde inte ladda ner Three.js JSON-fil: ' + (error as Error).message);
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

  // @ts-ignore - Unused function kept for future use
  const _formatPrice = (price: number) => {
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
          {/* Left 50% - Beställningar button */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            paddingRight: '10px'
          }}>
            <button
              onClick={() => {
                setSelectedOrder(null);
                setIsEditing(false);
                setEditedOrder(null);
                setShowEventCreator(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              📋 Beställningar
            </button>
          </div>
          
          {/* Right - Supabase Events button */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            paddingLeft: '10px'
          }}>
            <button
              onClick={() => {
                setSelectedOrder(null);
                setShowEventCreator(true);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              🗄️ Supabase Events
            </button>
          </div>
        </div>

        {/* Supabase Event Creator */}
        {showEventCreator && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', color: '#2c3e50' }}>
              🗄️ Skapa Supabase Event
            </h2>
            
            <div style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Eventnamn *
                </label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Elmia 2026"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Lösenord (valfritt - auto-genereras om tomt)
                </label>
                <input
                  type="text"
                  value={newEventPassword}
                  onChange={(e) => setNewEventPassword(e.target.value)}
                  placeholder="Lämna tom för auto-genererat"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <button
                onClick={handleCreateSupabaseEvent}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  marginRight: '12px'
                }}
              >
                ✓ Skapa Event
              </button>
              
              {createdEvent && (
                <>
                  <button
                    onClick={() => onOpenEventAdmin?.(createdEvent.id)}
                    style={{
                      padding: '14px 28px',
                      background: '#2ecc71',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}
                  >
                    🏢 Öppna EventAdminPortal
                  </button>
                  
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    background: '#f0fdf4',
                    border: '2px solid #22c55e',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#166534' }}>
                      ✅ Event skapat!
                    </h3>
                    <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '13px' }}>
                      <strong>Event-ID:</strong> {createdEvent.id}
                    </p>
                    <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '13px' }}>
                      <strong>Namn:</strong> {createdEvent.name}
                    </p>
                    <p style={{ margin: '8px 0', fontFamily: 'monospace', fontSize: '13px' }}>
                      <strong>Lösenord:</strong> <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '4px' }}>{createdEvent.password}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Lista över alla events */}
            {allEvents.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
                  📋 Alla Events ({allEvents.length})
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {allEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                          {event.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          ID: {event.id} • Skapad: {new Date(event.createdAt).toLocaleDateString('sv-SE')}
                        </div>
                        {event.description && (
                          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                            {event.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onOpenEventAdmin?.(event.id)}
                          style={{
                            padding: '10px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                        >
                          Öppna →
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          style={{
                            padding: '10px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                          }}
                          title="Ta bort event"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order details header */}
        {selectedOrder && !showEventCreator && (
          <div style={{
            backgroundColor: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              <div>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  margin: '0 0 4px 0'
                }}>
                  Beställning #{selectedOrder.id}
                </h1>
                <p style={{
                  color: '#666',
                  margin: 0,
                  fontSize: '14px'
                }}>
                  Skapad: {formatDate(selectedOrder.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overview List eller Detail View */}
        {!selectedOrder ? (
          <>
            {/* Overview List */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(44,62,80,0.07)',
              padding: '24px',
              marginBottom: '32px',
              maxWidth: 900,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#34495e', marginBottom: 16, letterSpacing: '0.5px' }}>
                Beställningar
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Order #</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Kund</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Eventdatum</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Totalpris</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Lagring</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', background: '#34495e', color: 'white', fontWeight: 700 }}>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {realOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', padding: '16px' }}>
                        Inga ordrar ännu.
                      </td>
                    </tr>
                  ) : (
                    realOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontWeight: 600, color: '#2c3e50', padding: '10px 8px' }}>#{order.id}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <input
                            type="text"
                            value={order.namn || order.customerInfo?.name || ''}
                            onChange={e => {
                              const updatedOrders = orders.map(o => o.id === order.id ? { ...o, namn: e.target.value } : o);
                              setOrders(updatedOrders);
                              localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
                            }}
                            style={{ width: '100%', minWidth: 0, padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                            placeholder="Namn på order"
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>{order.customerInfo?.eventDate || '-'}</td>
                        <td style={{ color: '#27ae60', fontWeight: 600, padding: '10px 8px' }}>{order.orderData?.totalPrice ? order.orderData.totalPrice.toLocaleString('sv-SE') + ' kr' : '0 kr'}</td>
                        <td style={{ padding: '10px 8px' }}>
                          {order.files?.storedInIDB ? (
                            <span style={{ color: '#e67e22', fontSize: '12px', fontWeight: 600 }}>
                              🗄️ IDB
                            </span>
                          ) : order.files?.zipFile ? (
                            <span style={{ color: '#27ae60', fontSize: '12px', fontWeight: 600 }}>
                              💾 localStorage
                            </span>
                          ) : (
                            <span style={{ color: '#95a5a6', fontSize: '12px', fontWeight: 600 }}>
                              📄 Endast metadata
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <button
                            style={{
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 18px',
                              fontWeight: 600,
                              fontSize: '15px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedOrder(order)}
                          >
                            Visa detaljer →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Tryckfiler-ruta */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              marginTop: '0',
              padding: '24px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#e74c3c',
                  margin: 0,
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🖨️ Tryckfiler
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={loadOrders}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: 0
                    }}
                    title="Ladda om listan med tryckfiler"
                  >
                    Uppdatera
                  </button>
                  <button
                    onClick={clearAllPrintFiles}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                    title="Rensa alla tryckfiler (ordrar)"
                  >
                    Rensa alla tryckfiler
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔍 Diagnostiserar localStorage...');
                      // @ts-ignore - OrderManager har metoden
                      if (typeof OrderManager.diagnoseStorage === 'function') {
                        OrderManager.diagnoseStorage();
                        alert('Diagnostik körd! Kolla konsolen (F12) för detaljer.');
                      } else {
                        console.error('diagnoseStorage-metoden finns inte');
                        alert('Diagnostik-funktionen är inte tillgänglig.');
                      }
                    }}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}
                    title="Diagnostisera localStorage-problem"
                  >
                    🔍 Diagnostisera
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '15px', color: '#34495e', marginBottom: '12px' }}>
                Här visas alla PDF-tryckfiler som är kopplade till ordrar. Klicka för att ladda ner.
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {(() => {
                  // Hämta alla riktiga order-id:n
                  const realOrderIds = new Set(realOrders.map(o => o.id));
                  return orders.filter(order => {
                    // Visa tryckfiler om deras id INTE finns bland riktiga ordrar
                    const f = order.files;
                    const isPrintFile = order.printOnly === true && !realOrderIds.has(order.id);
                    return isPrintFile && (f && ((f.zipFile && f.zipFile.startsWith('data:application/pdf')) || (!f.zipFile && f.storedInIDB)));
                  });
                })().length === 0 ? (
                  <div style={{ color: '#aaa', fontStyle: 'italic' }}>Inga tryckfiler uppladdade ännu.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(() => {
                      const realOrderIds = new Set(realOrders.map(o => o.id));
                      return orders.filter(order => {
                        const f = order.files;
                        const isPrintFile = order.printOnly === true && !realOrderIds.has(order.id);
                        return isPrintFile && (f && ((f.zipFile && f.zipFile.startsWith('data:application/pdf')) || (!f.zipFile && f.storedInIDB)));
                      }).map(order => {
                        const f = order.files;
                        const hasPDF = f.zipFile && f.zipFile.startsWith('data:application/pdf');
                        return (
                          <li key={order.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '10px',
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: '8px'
                          }}>
                            <span style={{ fontWeight: 600, color: '#2c3e50', minWidth: 80 }}>#{order.id}</span>
                            <input
                              type="text"
                              value={order.namn || order.customerInfo?.name || ''}
                              onChange={e => {
                                const updatedOrders = orders.map(o => o.id === order.id ? { ...o, namn: e.target.value } : o);
                                setOrders(updatedOrders);
                                localStorage.setItem('adminOrders', JSON.stringify(updatedOrders));
                              }}
                              style={{ flex: 1, minWidth: 0, padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                              placeholder="Namn på tryckfil/order"
                            />
                            {hasPDF ? (
                              <a
                                href={f.zipFile}
                                download={`Tryckfil_${order.id}.pdf`}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  textDecoration: 'none'
                                }}
                              >
                                Ladda ner PDF
                              </a>
                            ) : (
                              <>
                                <span style={{ color: '#e67e22', fontWeight: 500, marginRight: 8 }}>
                                  PDF endast i IDB (för stor för localStorage)
                                </span>
                                <button
                                  style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#e67e22',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                  }}
                                  onClick={() => downloadPDFfromIDB(order.id)}
                                >
                                  Ladda ner från IDB
                                </button>
                              </>
                            )}
                          </li>
                        );
                      });
                    })()}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Detail View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', maxHeight: '200vh', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', paddingRight: '12px' }}>
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
                    onClick={generateOrderPDF}
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
                    � Ladda ner monter
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
                      fontWeight: '600',
                      marginRight: '8px'
                    }}
                  >
                    📋 Följesedel
                  </button>
                  <button
                    onClick={() => alert('Ny knapp-action!')}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginRight: '8px'
                    }}
                  >
                    ➕ Ny knapp
                  </button>
                  <button
                    onClick={() => createTrelloCard(selectedOrder)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#0079bf',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    ➕ Skicka till Trello
                  </button>
                  <button
                    onClick={() => downloadGLTF(selectedOrder.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#8e44ad',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}
                  >
                    🚀 Ladda ner 3D-modell (GLB)
                  </button>
                  <button
                    onClick={() => downloadThreeJSON(selectedOrder.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#16a085',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}
                  >
                    📄 Ladda ner Three.js JSON
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
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Ordernamn:</label>
                      <input
                        type="text"
                        value={editedOrder.namn || ''}
                        onChange={e => setEditedOrder({ ...editedOrder, namn: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                        placeholder="Valfritt namn på ordern eller tryckfilen"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>Namn (kund):</label>
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
                    <p style={{ margin: '0 0 8px 0' }}><strong>Ordernamn:</strong> {selectedOrder.namn || '-'}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Namn (kund):</strong> {selectedOrder.customerInfo?.name || '-'}</p>
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


              {/* Monterbilder från beställning */}
              {selectedOrder.orderData?.images && Array.isArray(selectedOrder.orderData.images) && selectedOrder.orderData.images.length > 1 && (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '6px',
                  marginBottom: '24px',
                  marginTop: '24px',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: '0 0 16px 0',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #2980b9'
                  }}>
                    🖼️ Monterbild (framifrån)
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 1px 4px rgba(44,62,80,0.08)', padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <img src={selectedOrder.orderData.images[1]} alt="Montervy framifrån" style={{ width: 220, height: 140, objectFit: 'contain', borderRadius: 4, marginBottom: 6, background: '#eee' }} />
                      <span style={{ fontSize: 13, color: '#888' }}>Framifrån</span>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Packlista - DOLD */}
              {false && (
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
                  {selectedOrder?.orderData && (() => {
                    const order = selectedOrder;
                    if (!order) return null;
                    const packlista = order!.orderData!.packlista?.totals
                      || order!.orderData!.packlista
                      || {};

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
              )}
            </div>

            {/* Checklist Section */}
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
                ✅ Projektchecklista
              </h3>
              {selectedOrder && (() => {
                const checklist = getChecklistForOrder(selectedOrder);
                const completedCount = checklist.filter(item => item.completed).length;
                return (
                  <div>
                    <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                      {completedCount} / {checklist.length} uppgifter klara
                    </div>
                    <div style={{ marginBottom: '16px', overflowY: 'scroll', maxHeight: '100vh', padding: '10px' }}>
                      {checklist.map((item, index) => (
                        <label key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 0',
                          borderBottom: '1px solid #ecf0f1'
                        }}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(selectedOrder, index)}
                            style={{ margin: 0 }}
                          />

                          {editingChecklistIndex === index ? (
                            <input
                              autoFocus
                              value={editingChecklistValue}
                              onChange={(e) => setEditingChecklistValue(e.target.value)}
                              onBlur={() => commitEditChecklistItem(selectedOrder)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEditChecklistItem(selectedOrder);
                                if (e.key === 'Escape') cancelEditChecklistItem();
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            />
                          ) : (
                            <span
                              onDoubleClick={() => startEditChecklistItem(index, item.text)}
                              style={{
                                textDecoration: item.completed ? 'line-through' : 'none',
                                color: item.completed ? '#95a5a6' : '#2c3e50',
                                flex: 1,
                                cursor: 'text'
                              }}
                            >
                              {item.text}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="new-checklist-item"
                        type="text"
                        placeholder="Lägg till en uppgift..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('new-checklist-item') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            addChecklistItem(selectedOrder, input.value);
                            input.value = '';
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Lägg till
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminPortal;