// Bygg upp en THREE.Scene från orderData (förenklad, utbyggbar)
import * as THREE from 'three';


export function buildSceneFromOrderData(orderData: any): THREE.Scene {
  const scene = new THREE.Scene();

  // --- Golv och matta ---
  if (orderData.floorSize) {
    const { width, depth } = orderData.floorSize;
    // Golvplatta (vit/grå)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.05, depth),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
    );
    floor.position.y = -0.025;
    scene.add(floor);

    // Matta (om vald)
    if (orderData.carpetColor) {
      let mattaColor = orderData.carpetColor;
      // Hantera rutmönster (checkerboard)
      if (typeof mattaColor === 'string' && mattaColor.startsWith('checkerboard-')) {
        // Endast enkel svart/vit för export (DAE/STL har ej texturer)
        mattaColor = 0xcccccc;
      }
      const carpet = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.01, depth),
        new THREE.MeshStandardMaterial({ color: mattaColor })
      );
      carpet.position.y = 0.01;
      scene.add(carpet);
    }
  }

  // --- Väggar ---
  if (orderData.wallConfig) {
    const { width, depth, height, color: wallColor } = orderData.wallConfig;
    if (width && height) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, 0.1),
        new THREE.MeshStandardMaterial({ color: wallColor || 0xffffff })
      );
      wall.position.y = height / 2;
      wall.position.z = -depth / 2 + 0.05;
      scene.add(wall);
    }
  }

  // --- Möbler ---
  if (Array.isArray(orderData.furniture)) {
    orderData.furniture.forEach((item: any) => {
      let mesh: THREE.Mesh | null = null;
      let color = item.color || 0xcccccc;
      if (item.type === 'barbord') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 1.1, 16),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'barstol' || item.type === 'pall') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'soffa' || item.type === 'fatolj') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.7, 0.6),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'sidobord') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12),
          new THREE.MeshStandardMaterial({ color })
        );
      }
      if (mesh) {
        mesh.position.set(item.position?.x || 0, 0.35, item.position?.z || 0);
        scene.add(mesh);
      }
    });
  }

  // --- Växter ---
  if (Array.isArray(orderData.plants)) {
    orderData.plants.forEach((item: any) => {
      const potColor = item.potColor || 0x8B5A2B;
      const leafColor = item.leafColor || 0x228B22;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: potColor })
      );
      pot.position.set(item.position?.x || 0, 0.1, item.position?.z || 0);
      scene.add(pot);
      const plant = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.6, 10),
        new THREE.MeshStandardMaterial({ color: leafColor })
      );
      plant.position.set(item.position?.x || 0, 0.5, item.position?.z || 0);
      scene.add(plant);
    });
  }

  // --- Truss ---
  if (Array.isArray(orderData.truss)) {
    orderData.truss.forEach((item: any) => {
      const trussColor = item.color || 0xaaaaaa;
      if (item.type === 'front-straight') {
        const truss = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.2, 0.2),
          new THREE.MeshStandardMaterial({ color: trussColor })
        );
        truss.position.set(0, 2.5, 0);
        scene.add(truss);
      }
      // Fler truss-typer kan läggas till här
    });
  }

  // --- TV ---
  if (Array.isArray(orderData.tvs)) {
    orderData.tvs.forEach((item: any) => {
      const tvColor = item.color || 0x222244;
      if (item.width && item.height) {
        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(item.width, item.height, 0.05),
          new THREE.MeshStandardMaterial({ color: tvColor })
        );
        tv.position.set(item.position?.x || 0, 1.5, item.position?.z || 0);
        scene.add(tv);
      }
    });
  }

  // --- Diskar/counters ---
  if (Array.isArray(orderData.counters)) {
    orderData.counters.forEach((item: any) => {
      const counterColor = item.color || 0xffe4b5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.5),
        new THREE.MeshStandardMaterial({ color: counterColor })
      );
      mesh.position.set(item.position?.x || 0, 0.5, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Dekorationer ---
  if (Array.isArray(orderData.decorations)) {
    orderData.decorations.forEach((item: any) => {
      const decoColor = item.color || 0xff69b4;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 8),
        new THREE.MeshStandardMaterial({ color: decoColor })
      );
      mesh.position.set(item.position?.x || 0, 1, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Lampor och belysning ---
  if (Array.isArray(orderData.lights)) {
    orderData.lights.forEach((item: any) => {
      const lampColor = item.color || 0xffffcc;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshStandardMaterial({ color: lampColor, emissive: lampColor, emissiveIntensity: 0.7 })
      );
      mesh.position.set(item.position?.x || 0, item.position?.y || 2.5, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Ljus (ambient/directional) ---
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  console.log('Antal objekt i scenen:', scene.children.length);
  return scene;
}

