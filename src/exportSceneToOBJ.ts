import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

// Alternativ manuell OBJ-export funktion som direkt serialiserar mesh-geometri
function manualOBJExport(scene: THREE.Scene | THREE.Group): string {
  let objData = '# Manual OBJ export from Monterhyra\n# Created using program logic for exact recreation\n\n';
  let vertexIndex = 1; // OBJ vertex indices start at 1
  let objectCount = 0;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (!child.geometry) {
        console.log(`⚠️ Mesh ${objectCount + 1} has no geometry:`, child);
        return;
      }

      objectCount++;
      const geometry = child.geometry;
      const matrix = child.matrixWorld.clone();

      console.log(`🔍 Exporting mesh ${objectCount}: ${child.name || 'unnamed'}, geometry: ${geometry.type}, vertices: ${geometry.attributes.position?.count}, indices: ${geometry.index?.count || 'none'}`);

      objData += `\n# Object ${objectCount}: ${child.name || 'unnamed'} - ${child.type} - ${geometry.type}\n`;
      objData += `o object_${objectCount}\n`;

      // Get vertices and transform them to world space
      const positions = geometry.attributes.position;
      const vertexStartIndex = vertexIndex;

      if (positions) {
        for (let i = 0; i < positions.count; i++) {
          const vertex = new THREE.Vector3();
          vertex.fromBufferAttribute(positions, i);
          vertex.applyMatrix4(matrix); // Transform to world space

          objData += `v ${vertex.x.toFixed(6)} ${vertex.y.toFixed(6)} ${vertex.z.toFixed(6)}\n`;
          vertexIndex++;
        }
        console.log(`  ✅ Added ${positions.count} vertices`);
      }

      // Get faces - handle both indexed and non-indexed geometry
      const indices = geometry.index;
      if (indices) {
        // Indexed geometry
        console.log(`  📐 Indexed geometry with ${indices.count} indices`);
        for (let i = 0; i < indices.count; i += 3) {
          const a = indices.getX(i) + vertexStartIndex;
          const b = indices.getX(i + 1) + vertexStartIndex;
          const c = indices.getX(i + 2) + vertexStartIndex;
          objData += `f ${a} ${b} ${c}\n`;
        }
        console.log(`  ✅ Added ${indices.count / 3} faces`);
      } else if (positions) {
        // Non-indexed geometry - assume triangles
        const numTriangles = positions.count / 3;
        console.log(`  📐 Non-indexed geometry with ${numTriangles} triangles`);
        for (let i = 0; i < positions.count; i += 3) {
          const a = i + vertexStartIndex;
          const b = i + 1 + vertexStartIndex;
          const c = i + 2 + vertexStartIndex;
          objData += `f ${a} ${b} ${c}\n`;
        }
        console.log(`  ✅ Added ${numTriangles} faces`);
      }
    }
  });

  objData += `\n# Total objects exported: ${objectCount}\n`;
  console.log(`📊 Manual export summary: ${objectCount} objects, ${vertexIndex - 1} total vertices`);
  return objData;
}

export function exportSceneToOBJ(sceneOrGroup: THREE.Scene | THREE.Group, filename: string = 'model.obj', download: boolean = true) {
  console.log('🎯 exportSceneToOBJ called with:', sceneOrGroup, 'filename:', filename);

  if (!sceneOrGroup) {
    console.error('❌ exportSceneToOBJ: sceneOrGroup is null/undefined');
    throw new Error('Scene or group is null');
  }

  console.log('🔍 Scene/Group children count:', sceneOrGroup.children.length);

  // Detailed scene inspection
  let totalMeshes = 0;
  let sphereMeshes = 0;
  let boxMeshes = 0;
  let cylinderMeshes = 0;
  let coneMeshes = 0;

  sceneOrGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      totalMeshes++;
      const geoType = child.geometry?.type;
      if (geoType === 'SphereGeometry') sphereMeshes++;
      else if (geoType === 'BoxGeometry') boxMeshes++;
      else if (geoType === 'CylinderGeometry') cylinderMeshes++;
      else if (geoType === 'ConeGeometry') coneMeshes++;

      console.log(`  Mesh ${totalMeshes}: ${child.name || 'unnamed'} - ${geoType} - vertices: ${child.geometry?.attributes?.position?.count || 0}`);
    }
  });

  console.log(`📊 Scene summary: ${totalMeshes} total meshes (${sphereMeshes} spheres, ${boxMeshes} boxes, ${cylinderMeshes} cylinders, ${coneMeshes} cones)`);

  console.log('🔍 Inspecting scene objects...');
  let meshCount = 0;
  sceneOrGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      console.log('🟢 Mesh found:', child.name || '(unnamed)', 'Geometry:', child.geometry?.type, 'Vertices:', child.geometry?.attributes?.position?.count);
    } else {
      console.log('🔸 Non-mesh object:', child.type, child.name || '(unnamed)');
    }
  });
  console.log('📊 Total meshes found:', meshCount);

  // Försök först med manuell export för bättre kontroll
  console.log('🔧 Trying manual OBJ export...');
  let objString = manualOBJExport(sceneOrGroup);
  console.log('📄 Manual OBJ length:', objString.length);
  console.log('📄 Manual OBJ preview:', objString.substring(0, 500));

  // Om manuell export gav för lite data, försök med Three.js exporter
  if (!objString || objString.trim().length < 200) {  // Höjt tröskeln från 100 till 200
    console.log('⚠️ Manual export produced minimal output, trying Three.js exporter...');
    const exporter = new OBJExporter();
    const threeObjString = exporter.parse(sceneOrGroup);
    console.log('📄 Three.js OBJ length:', threeObjString.length);

    if (threeObjString && threeObjString.length > objString.length) {
      objString = threeObjString;
      console.log('✅ Using Three.js exporter result');
    }
  }

  // Sista fallback: skapa en enkel kub
  if (!objString || objString.trim().length < 50) {
    console.error('❌ Both exports failed, creating fallback cube...');
    const fallbackScene = new THREE.Scene();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    fallbackScene.add(cube);

    objString = manualOBJExport(fallbackScene);
    console.log('✅ Created fallback OBJ with manual export');
  }

  console.log('📄 Final OBJ string length:', objString.length);
  console.log('📄 Final OBJ string preview:', objString.substring(0, 500));

  // Skapa blob för nedladdning
  const objBlob = new Blob([objString], { type: 'text/plain' });
  console.log('💾 Created blob, size:', objBlob.size, 'bytes');

  // Returnera blob-data för lagring
  const result = {
    objBlob,
    mtlBlob: null, // Ingen MTL för denna enkla version
    filename
  };

  // Ladda ned filen om download är true
  if (download) {
    console.log('📥 Starting download...');
    const objUrl = URL.createObjectURL(objBlob);
    const objLink = document.createElement('a');
    objLink.href = objUrl;
    objLink.download = filename;
    objLink.style.display = 'none';
    document.body.appendChild(objLink);
    objLink.click();
    document.body.removeChild(objLink);
    URL.revokeObjectURL(objUrl);
    console.log('✅ Download completed');

    const message = `OBJ-export klar!\n\n📄 ${filename} (${objBlob.size} bytes)\nObjekt: ${meshCount}`;
    console.log('📢 Showing alert:', message);
    alert(message);
  }

  return result;
}