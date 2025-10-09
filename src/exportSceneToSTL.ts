// Exportera en THREE.Scene som STL (endast geometri, ingen färg)
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';

export function exportSceneToSTL(scene: THREE.Scene, filename = 'monter.stl') {
  // Samla alla mesh-objekt (även i grupper)
  const meshes: THREE.Mesh[] = [];
  scene.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) {
      meshes.push(obj as THREE.Mesh);
    }
  });
  // Skapa en temporär grupp med alla mesh-objekt
  const tempGroup = new THREE.Group();
  meshes.forEach(mesh => tempGroup.add(mesh.clone()));
  const exporter = new STLExporter();
  const stlString = exporter.parse(tempGroup);
  const blob = new Blob([stlString], { type: 'model/stl' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
