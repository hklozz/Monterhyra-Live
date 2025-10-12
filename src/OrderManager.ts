  /**
   * Spara en enskild PDF-tryckfil till adminpanelen (tryckfiler-listan).
   * Varje PDF sparas som en egen "order" med printOnly=true och filen som base64.
   */
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
  images?: string[]; // Tre base64-bilder (JPEG/PNG) från beställning
}

export interface Order {
  id: string;
  timestamp: string;
  customerInfo: CustomerInfo;
  orderData: OrderData;
  files: {
    zipFile: string; // base64 data URL
    objFile?: string; // base64 data URL for OBJ file
    storedInIDB?: boolean; // if true, actual blob stored in IndexedDB under order id
  };
  printOnly?: boolean; // om true: endast tryckfiler, ingen kund/orderinfo behövs
}

export class OrderManager {

  /**
   * Spara en enskild PDF-tryckfil till adminpanelen (tryckfiler-listan).
   * Varje PDF sparas som en egen "order" med printOnly=true och filen som base64.
   */
  static async savePrintPDF(label: string, pdfBlob: Blob): Promise<string> {
    const orderId = this.generateOrderId();
    try {
      const approxBytes = pdfBlob.size;
      const MAX_LOCALSTORAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB

      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo: {
          name: `Auto-saved: ${label}`,
          email: '',
          phone: '',
          company: '',
          deliveryAddress: '',
          eventDate: '',
          eventTime: '',
          setupTime: '',
          pickupTime: '',
          message: ''
        },
        orderData: {
          floorSize: null,
          wallConfig: null,
          furniture: [],
          plants: [],
          decorations: [],
          storages: [],
          totalPrice: 0
        },
        files: {
          zipFile: ''
        },
        printOnly: true
      };

      // Försök alltid spara base64 i localStorage för admin-panelen
      let pdfBase64 = '';
      try {
        pdfBase64 = await this.blobToBase64(pdfBlob);
        order.files.zipFile = `data:application/pdf;base64,${pdfBase64.replace(/^data:application\/pdf;base64,/, '')}`;
        order.files.storedInIDB = false;
        // Om filen är stor, spara även i IDB för backup
        if (approxBytes > MAX_LOCALSTORAGE_BYTES) {
          try {
            await this.saveBlobToIDB(orderId, pdfBlob);
            order.files.storedInIDB = true;
            // Men behåll zipFile = base64 för adminpanelen
            console.log('OrderManager: PDF lagrad i IDB och base64 i localStorage', orderId);
          } catch (idbErr) {
            console.error('OrderManager: Failed to store PDF in IDB', idbErr);
          }
        }
        const existingOrders = this.getOrders();
        existingOrders.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
        console.log('OrderManager: PDF sparad i admin som base64', orderId);
        return orderId;
      } catch (storageErr) {
        // Om base64-sparande misslyckas, spara endast i IDB och visa placeholder
        console.error('OrderManager: Failed to save PDF as base64 in localStorage', storageErr);
        console.error('PDF label:', label);
        console.error('PDF blob:', pdfBlob);
        try {
          await this.saveBlobToIDB(orderId, pdfBlob);
          order.files.zipFile = '';
          order.files.storedInIDB = true;
        } catch (idbErr) {
          console.error('OrderManager: Failed to store PDF in IDB as fallback', idbErr);
        }
        const existing = this.getOrders();
        existing.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existing));
        return orderId;
      }
    } catch (err) {
      console.error('OrderManager: Failed to save PDF', err);
      throw err;
    }
  }
  // Extra loggning för blobToBase64
  private static async blobToBase64(blob: Blob): Promise<string> {
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader result is empty or not a string'));
          }
        };
        reader.onerror = (e) => {
          console.error('blobToBase64: FileReader error', e);
          reject(e);
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('blobToBase64: Exception thrown', err);
      throw err;
    }
  }

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
      const approxBytes = zipBlob.size;
      const MAX_LOCALSTORAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB - konservativ gräns

      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo,
        orderData,
        files: {
          zipFile: ''
        }
      };

      // Försök spara blob i IndexedDB för stora filer (rekommenderat)
      if (approxBytes > MAX_LOCALSTORAGE_BYTES) {
        try {
          await this.saveBlobToIDB(orderId, zipBlob);
          order.files.zipFile = '';
          order.files.storedInIDB = true;
          const existing = this.getOrders();
          existing.push(order);
          localStorage.setItem('adminOrders', JSON.stringify(existing));
          console.log('OrderManager: ZIP lagrad i IndexedDB under nyckel', orderId);
          return orderId;
        } catch (idbErr) {
          console.error('OrderManager: Failed to store ZIP in IndexedDB', idbErr);
          // fall through to attempt base64/localStorage path as fallback
        }
      }

      // För mindre filer: konvertera till base64 och spara i localStorage
      try {
        const zipBase64 = await this.blobToBase64(zipBlob);
        order.files.zipFile = zipBase64;
        order.files.storedInIDB = false;
        const existingOrders = this.getOrders();
        existingOrders.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
        console.log('✅ Beställning sparad:', orderId);
        return orderId;
      } catch (storageErr) {
        console.error('OrderManager: Failed to save order as base64 in localStorage', storageErr);
        // Final fallback: trigger download so user still gets file and save metadata-only
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

        const metaOnly: Order = { ...order, files: { zipFile: '', storedInIDB: false } };
        const existing = this.getOrders();
        existing.push(metaOnly);
        localStorage.setItem('adminOrders', JSON.stringify(existing));
        return orderId;
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

  static async downloadOBJ(orderId: string): Promise<void> {
    const order = this.getOrder(orderId);
    if (!order) throw new Error('OBJ-fil hittades inte');

    try {
      let blob: Blob | null = null;
      if (order.files.storedInIDB) {
        // Hämta från IndexedDB
        blob = await this.getBlobFromIDB(`${orderId}_obj`);
        if (!blob) throw new Error('OBJ-filen finns inte i IndexedDB');
      } else if (order.files.objFile) {
        const response = await fetch(order.files.objFile);
        blob = await response.blob();
      } else {
        throw new Error('OBJ-fil hittades inte');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `3D-modell_${orderId}.obj`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Fel vid nedladdning av OBJ-fil:', error);
      throw error;
    }
  }

  /**
   * Save generated print files (PDFs) from the editor into the admin orders store.
   * This creates a ZIP from the provided PDFs and stores it similarly to saveOrder
   * so admins can download the files later.
   *
   * label: short textual label describing the print batch (e.g. 'VEPA export')
   * pdfFiles: same shape as used by saveOrder.createZipFile
   */
  static async savePrintFiles(
    label: string,
    pdfFiles: {
      mainPDF?: Blob;
      wallPDFs: { name: string; blob: Blob }[];
      storagePDFs: { name: string; blob: Blob }[];
    }
  ): Promise<string> {
    const orderId = this.generateOrderId();

    try {
      const zipBlob = await this.createZipFile(pdfFiles);
      const approxBytes = zipBlob.size;
      const MAX_LOCALSTORAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB

      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo: {
          name: `Auto-saved: ${label}`,
          email: '',
          phone: '',
          company: '',
          deliveryAddress: '',
          eventDate: '',
          eventTime: '',
          setupTime: '',
          pickupTime: '',
          message: ''
        },
        orderData: {
          floorSize: null,
          wallConfig: null,
          furniture: [],
          plants: [],
          decorations: [],
          storages: [],
          totalPrice: 0
        },
        files: {
          zipFile: ''
        }
      };

      // Försök spara blob i IndexedDB för stora filer
      if (approxBytes > MAX_LOCALSTORAGE_BYTES) {
        try {
          await this.saveBlobToIDB(orderId, zipBlob);
          order.files.zipFile = '';
          order.files.storedInIDB = true;
          const existing = this.getOrders();
          existing.push(order);
          localStorage.setItem('adminOrders', JSON.stringify(existing));
          console.log('OrderManager: Print ZIP lagrad i IndexedDB under nyckel', orderId);
          return orderId;
        } catch (idbErr) {
          console.error('OrderManager: Failed to store print ZIP in IDB', idbErr);
          // fall through to attempt base64/localStorage path as fallback
        }
      }

      // För mindre filer: konvertera till base64 och spara i localStorage
      try {
        const zipBase64 = await this.blobToBase64(zipBlob);
        order.files.zipFile = zipBase64;
        order.files.storedInIDB = false;
        const existingOrders = this.getOrders();
        existingOrders.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
        console.log('OrderManager: Print files sparade i admin:', orderId);
        return orderId;
      } catch (storageErr) {
        console.error('OrderManager: Failed to save print files as base64 in localStorage', storageErr);
        // Fallback: metadata-only
        const metaOnly: Order = { ...order, files: { zipFile: '', storedInIDB: false } };
        const existing = this.getOrders();
        existing.push(metaOnly);
        localStorage.setItem('adminOrders', JSON.stringify(existing));
        return orderId;
      }

    } catch (error) {
      console.error('Fel vid sparning av tryckfiler:', error);
      throw new Error('Kunde inte spara tryckfiler');
    }
  }

  /**
   * Save an exact ZIP Blob (from editor) into admin orders. This ensures the
   * same ZIP that the user downloads is what admins can later download.
   */
  static async saveZipBlob(label: string, zipBlob: Blob, opts?: { printOnly?: boolean }): Promise<string> {
    const orderId = this.generateOrderId();
    try {
      const approxBytes = zipBlob.size;
      const MAX_LOCALSTORAGE_BYTES = 3.5 * 1024 * 1024; // 3.5 MB

      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo: {
          name: opts?.printOnly ? `Auto-saved: ${label}` : `Auto-saved: ${label}`,
          email: '',
          phone: '',
          company: '',
          deliveryAddress: '',
          eventDate: '',
          eventTime: '',
          setupTime: '',
          pickupTime: '',
          message: ''
        },
        orderData: {
          floorSize: null,
          wallConfig: null,
          furniture: [],
          plants: [],
          decorations: [],
          storages: [],
          totalPrice: 0
        },
        files: {
          zipFile: ''
        }
      };
      if (opts?.printOnly) {
        // minimal metadata - keep customerInfo/orderData empty but mark printOnly
        order.printOnly = true;
      }

      // Försök IndexedDB först för stora filer
      if (approxBytes > MAX_LOCALSTORAGE_BYTES) {
        try {
          await this.saveBlobToIDB(orderId, zipBlob);
          order.files.zipFile = '';
          order.files.storedInIDB = true;
          const existing = this.getOrders();
          existing.push(order);
          localStorage.setItem('adminOrders', JSON.stringify(existing));
          console.log('OrderManager: ZIPBlob lagrad i IDB under nyckel', orderId);
          return orderId;
        } catch (idbErr) {
          console.error('OrderManager: Failed to store ZIP blob in IDB', idbErr);
          // fall through to try base64 path
        }
      }

      // Fallback: konvertera till base64 och spara i localStorage
      try {
        const zipBase64 = await this.blobToBase64(zipBlob);
        order.files.zipFile = zipBase64;
        order.files.storedInIDB = false;
        const existingOrders = this.getOrders();
        existingOrders.push(order);
        localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
        console.log('OrderManager: ZIPBlob sparad i admin som base64', orderId);
        return orderId;
      } catch (storageErr) {
        console.error('OrderManager: Failed to save ZIP as base64 in localStorage', storageErr);
        const metaOnly: Order = { ...order, files: { zipFile: '', storedInIDB: false } };
        const existing = this.getOrders();
        existing.push(metaOnly);
        localStorage.setItem('adminOrders', JSON.stringify(existing));
        return orderId;
      }
    } catch (err) {
      console.error('OrderManager: Failed to save ZIP blob', err);
      throw err;
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

  public static async getBlobFromIDB(key: string): Promise<Blob | null> {
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