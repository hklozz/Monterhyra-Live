import JSZip from 'jszip';

// OrderManager.ts - Hanterar beställningar i admin-portalen

export interface CustomerInfo {
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
}

export interface OrderData {
  floorSize: any;
  wallConfig: any;
  furniture: any[];
  plants: any[];
  decorations: any[];
  storages: any[];
  totalPrice: number;
  packlista?: any; // Detaljerad BeMatrix packlista med alla ramar, diskar, corners osv.
}

export interface Order {
  id: string;
  timestamp: string;
  customerInfo: CustomerInfo;
  orderData: OrderData;
  files: {
    zipFile: string; // base64 data URL
    storedInIDB?: boolean; // if true, actual blob stored in IndexedDB under order id
  };
}

export class OrderManager {
  private static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4);
    return `${timestamp}-${random}`;
  }

  static async saveOrder(
    customerInfo: CustomerInfo,
    orderData: OrderData,
    pdfFiles: {
      mainPDF?: Blob;
      wallPDFs: { name: string; blob: Blob }[];
      storagePDFs: { name: string; blob: Blob }[];
    }
  ): Promise<string> {
    const orderId = this.generateOrderId();
    
    try {
      // Skapa ZIP-fil med alla PDFer
      const zipBlob = await this.createZipFile(pdfFiles);
  const zipBase64 = await this.blobToBase64(zipBlob);

  // Kontrollera ungefärlig storlek av base64-strängen (bytes). base64 ökar storlek ~33%.
  const approxBytes = Math.ceil((zipBase64.length * 3) / 4);
  const MAX_LOCALSTORAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB - konservativ gräns

      
      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo,
        orderData,
        files: {
          zipFile: zipBase64
        }
      };

      // Om ZIP:en är för stor för reliable localStorage-spara, fallback: trigga nedladdning av ZIP
      // och spara endast metadata i localStorage så admin ser beställningen.
      try {
        if (approxBytes > MAX_LOCALSTORAGE_BYTES) {
          console.warn('OrderManager: ZIP verkar stor (≈' + Math.round(approxBytes / 1024) + 'KB). Storer i IndexedDB och sparar metadata i admin.');
          try {
            await this.saveBlobToIDB(orderId, zipBlob);
            // markera ordern så admin vet att filen finns i IDB
            order.files.zipFile = '';
            order.files.storedInIDB = true;
            const existing = this.getOrders();
            existing.push(order);
            localStorage.setItem('adminOrders', JSON.stringify(existing));
            console.log('OrderManager: ZIP lagrad i IndexedDB under nyckel', orderId);
            return orderId;
          } catch (idbErr) {
            console.error('OrderManager: Failed to store ZIP in IndexedDB, falling back to direct download', idbErr);
            // Fallback: trigger download so user still gets file
            try {
              const url = URL.createObjectURL(zipBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Beställning_${orderId}.zip`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              console.log('OrderManager: Fallback ZIP download triggered');
            } catch (dlErr) {
              console.error('OrderManager: Failed to trigger fallback download', dlErr);
            }

            // Save metadata-only so the order appears in admin
            const metaOnly: Order = { ...order, files: { zipFile: '', storedInIDB: false } };
            const existing = this.getOrders();
            existing.push(metaOnly);
            localStorage.setItem('adminOrders', JSON.stringify(existing));
            return orderId;
          }
        }

        // Normal save path
        const existingOrders = this.getOrders();
        existingOrders.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
        console.log('✅ Beställning sparad:', orderId);
        return orderId;
      } catch (storageErr) {
        console.error('OrderManager: Failed to save order:', storageErr);
        throw storageErr;
      }

    } catch (error) {
      console.error('❌ Fel vid sparning av beställning:', error);
      throw new Error('Kunde inte spara beställning');
    }
  }

  private static async createZipFile(pdfFiles: {
    mainPDF?: Blob;
    wallPDFs: { name: string; blob: Blob }[];
    storagePDFs: { name: string; blob: Blob }[];
  }): Promise<Blob> {
    const zip = new JSZip();

    // SKIPPA huvud-PDF (för stor) - bara tryckfiler
    // if (pdfFiles.mainPDF) {
    //   zip.file('Huvudritning.pdf', pdfFiles.mainPDF);
    // }

    // Lägg till vägg-PDFer (FOREX tryckfiler)
    if (pdfFiles.wallPDFs.length > 0) {
      const wallFolder = zip.folder('FOREX_Väggdesigner');
      pdfFiles.wallPDFs.forEach((wallPDF) => {
        wallFolder?.file(`${wallPDF.name}.pdf`, wallPDF.blob);
      });
    }

    // Lägg till förråds-PDFer (FOREX tryckfiler)
    if (pdfFiles.storagePDFs.length > 0) {
      const storageFolder = zip.folder('FOREX_Förrådsdesigner');
      pdfFiles.storagePDFs.forEach((storagePDF) => {
        storageFolder?.file(`${storagePDF.name}.pdf`, storagePDF.blob);
      });
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  static getOrders(): Order[] {
    try {
      const savedOrders = localStorage.getItem('adminOrders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    } catch (error) {
      console.error('Fel vid laddning av beställningar:', error);
      return [];
    }
  }

  static getOrder(orderId: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find(order => order.id === orderId);
  }

  static deleteOrder(orderId: string): boolean {
    try {
      const orders = this.getOrders();
      const filteredOrders = orders.filter(order => order.id !== orderId);
      localStorage.setItem('adminOrders', JSON.stringify(filteredOrders));
      return true;
    } catch (error) {
      console.error('Fel vid borttagning av beställning:', error);
      return false;
    }
  }

  static async downloadZip(orderId: string): Promise<void> {
    const order = this.getOrder(orderId);
    if (!order) throw new Error('ZIP-fil hittades inte');

    try {
      let blob: Blob | null = null;
      if (order.files.storedInIDB) {
        // Hämta från IndexedDB
        blob = await this.getBlobFromIDB(orderId);
        if (!blob) throw new Error('Filen finns inte i IndexedDB');
      } else if (order.files.zipFile) {
        const response = await fetch(order.files.zipFile);
        blob = await response.blob();
      } else {
        throw new Error('ZIP-fil hittades inte');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Beställning_${orderId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fel vid nedladdning av ZIP-fil:', error);
      throw error;
    }
  }

  // ---------- IndexedDB helpers ----------
  private static openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('MonterhyraOrders', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('zips')) {
          db.createObjectStore('zips');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private static async saveBlobToIDB(key: string, blob: Blob): Promise<void> {
    const db = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('zips', 'readwrite');
      const store = tx.objectStore('zips');
      const req = store.put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private static async getBlobFromIDB(key: string): Promise<Blob | null> {
    const db = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('zips', 'readonly');
      const store = tx.objectStore('zips');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  // Fäst en ZIP-blob som användaren laddat upp manuellt till en order
  static async attachZipBlob(orderId: string, blob: Blob): Promise<void> {
    const order = this.getOrder(orderId);
    if (!order) throw new Error('Order inte hittad');
    try {
      await this.saveBlobToIDB(orderId, blob);
      // markera metadata
      const orders = this.getOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx >= 0) {
        orders[idx].files.zipFile = '';
        orders[idx].files.storedInIDB = true;
        localStorage.setItem('adminOrders', JSON.stringify(orders));
      }
      console.log('OrderManager: Manually attached ZIP saved in IDB for', orderId);
    } catch (err) {
      console.error('OrderManager: Failed to attach ZIP to order', err);
      throw err;
    }
  }

  static generateOrderSummary(order: Order): string {
    const { customerInfo, orderData } = order;
    
    return `
BESTÄLLNINGSSAMMANFATTNING
Beställningsnummer: ${order.id}
Datum: ${new Date(order.timestamp).toLocaleString('sv-SE')}

KUNDUPPGIFTER:
Namn: ${customerInfo.name}
E-post: ${customerInfo.email}
Telefon: ${customerInfo.phone}
Företag: ${customerInfo.company}
Leveransadress: ${customerInfo.deliveryAddress}

EVENTUPPGIFTER:
Eventdatum: ${customerInfo.eventDate}
Eventtid: ${customerInfo.eventTime}
Uppsättningstid: ${customerInfo.setupTime}
Hämtningstid: ${customerInfo.pickupTime}
${customerInfo.message ? `Meddelande: ${customerInfo.message}` : ''}

BESTÄLLNINGSDETALJER:
Möbler: ${orderData.furniture.length} st
Växter: ${orderData.plants.length} st
Förråd: ${orderData.storages.length} st
Totalpris: ${new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(orderData.totalPrice)}

FILER:
Alla tryckfiler och designer finns tillgängliga i admin-portalen.
Kontakta oss för att få tillgång till filerna.

Med vänliga hälsningar,
Monterhyra Team
    `.trim();
  }
}