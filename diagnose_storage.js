const fs = require('fs');
const path = require('path');

// Simulera localStorage
const localStorage = {
  getItem: (key) => {
    try {
      const data = fs.readFileSync(path.join(process.cwd(), 'localStorage_backup.json'), 'utf8');
      const parsed = JSON.parse(data);
      return parsed[key] || null;
    } catch (e) {
      return null;
    }
  }
};

// Kolla adminOrders
const adminOrders = localStorage.getItem('adminOrders');
if (adminOrders) {
  const orders = JSON.parse(adminOrders);
  console.log('Total orders:', orders.length);

  const printFiles = orders.filter(o => o.printOnly === true);
  console.log('Print files:', printFiles.length);

  const realOrders = orders.filter(o => !o.printOnly && !(o.customerInfo?.name?.startsWith('Auto-saved:')));
  console.log('Real orders:', realOrders.length);

  if (printFiles.length > 0) {
    console.log('Print file IDs:', printFiles.map(p => p.id));
    printFiles.forEach(p => {
      console.log(`Print file ${p.id}: has zipFile: ${!!p.files?.zipFile}, storedInIDB: ${p.files?.storedInIDB}`);
    });
  }
} else {
  console.log('No adminOrders in localStorage');
}