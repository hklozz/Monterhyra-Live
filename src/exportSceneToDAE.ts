// Utility to export a THREE.Scene as Collada (DAE) using three-stdlib
// Usage: exportSceneToDAE(scene, filename)
import { ColladaExporter } from 'three-stdlib';
import * as THREE from 'three';

export function exportSceneToDAE(scene: THREE.Scene, filename = 'monter.dae') {
  const exporter = new ColladaExporter();
  const result = exporter.parse(scene);
  const output = (result as { data: string }).data;
  const blob = new Blob([output], { type: 'model/vnd.collada+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
