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
      
      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerInfo,
        orderData,
        files: {
          zipFile: zipBase64
        }
      };

      // Spara i localStorage för admin portal
      const existingOrders = this.getOrders();
      existingOrders.push(order);
      localStorage.setItem('adminOrders', JSON.stringify(existingOrders));

      console.log('✅ Beställning sparad:', orderId);
      return orderId;

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
    if (!order || !order.files.zipFile) {
      throw new Error('ZIP-fil hittades inte');
    }

    try {
      // Konvertera base64 tillbaka till blob
      const response = await fetch(order.files.zipFile);
      const blob = await response.blob();

      // Ladda ner filen
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