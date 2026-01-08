import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface MonterDimensions {
  width: number;
  depth: number;
  height: number;
}

interface ExhibitorDesignModeProps {
  monterSize: 'small' | 'medium' | 'large';
  monterDimensions: MonterDimensions;
  wallShape?: 'straight' | 'l' | 'u';
  onExit?: () => void;
}

// Konstanter
const COUNTER_TYPES = [
  { label: 'Ingen disk', width: 0, depth: 0, image: '/Models/counters/none.svg' },
  { label: '1m disk', width: 1, depth: 0.5, image: '/Models/counters/1m.svg' },
  { label: '1,5m disk', width: 1.5, depth: 0.5, image: '/Models/counters/1-5m.svg' },
  { label: '2m disk', width: 2, depth: 0.5, image: '/Models/counters/2m.svg' },
  { label: '2,5m disk', width: 2.5, depth: 0.5, image: '/Models/counters/2-5m.svg' },
  { label: '3m disk', width: 3, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '3,5m disk', width: 3.5, depth: 0.5, image: '/Models/counters/3m.svg' },
  { label: '4m disk', width: 4, depth: 0.5, image: '/Models/counters/3m.svg' },
];

const FURNITURE_TYPES = [
  { label: 'Barbord', width: 0.6, depth: 0.6, height: 1.1, color: '#FFFFFF', type: 'table', emoji: '🍸', image: '/Models/furniture/barbord.svg' },
  { label: 'Barstol', width: 0.4, depth: 0.4, height: 1.0, color: '#FFFFFF', type: 'chair', emoji: '🪑', image: '/Models/furniture/barstol.svg' },
  { label: 'Pall', width: 0.35, depth: 0.35, height: 0.45, color: '#4169E1', type: 'stool', emoji: '🛋️', image: '/Models/furniture/pall.svg' },
  { label: 'Soffa 2-sits', width: 1.4, depth: 0.8, height: 0.85, color: '#2F4F4F', type: 'sofa', emoji: '🛋️', image: '/Models/furniture/soffa.svg' },
];

const PLANT_TYPES = [
  { label: 'Ficus', width: 0.4, depth: 0.4, height: 1.8, color: '#228B22', leafColor: '#32CD32', type: 'tree', emoji: '🌿', image: '/Models/plants/Ficus.png' },
  { label: 'Monstera', width: 0.6, depth: 0.6, height: 1.2, color: '#2F4F2F', leafColor: '#228B22', type: 'broad', emoji: '🍃', image: '/Models/plants/monstera.svg' },
  { label: 'Bambu', width: 0.3, depth: 0.3, height: 2.0, color: '#556B2F', leafColor: '#9ACD32', type: 'bamboo', emoji: '🎋', image: '/Models/plants/bambu.svg' },
  { label: 'Palmlilja', width: 0.5, depth: 0.5, height: 1.5, color: '#8FBC8F', leafColor: '#90EE90', type: 'palm', emoji: '🌴', image: '/Models/plants/palmlilja.svg' },
];

// Möbel-komponent
function Furniture({ furnitureConfig, position, rotation }: { 
  furnitureConfig: any, 
  position: [number, number, number],
  rotation: number
}) {
  const baseHeight = 0.065;

  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      {furnitureConfig.type === 'table' && (
        <>
          <mesh position={[0, baseHeight + furnitureConfig.height/2 - 0.025, 0]}>
            <cylinderGeometry args={[0.03, 0.05, furnitureConfig.height - 0.05, 8]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.025, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2, furnitureConfig.width/2, 0.05, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          <mesh position={[0, baseHeight + 0.3, 0]}>
            <torusGeometry args={[furnitureConfig.width/3, 0.02, 8, 16]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
        </>
      )}

      {furnitureConfig.type === 'chair' && (
        <>
          <mesh position={[0, baseHeight + 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 0.64, 8]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, baseHeight + 0.65, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.5, furnitureConfig.width/2.5, 0.05, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
          <mesh position={[0, baseHeight + 0.85, furnitureConfig.width/4]} rotation={[Math.PI/12, 0, 0]}>
            <boxGeometry args={[furnitureConfig.width/2, 0.3, 0.03]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.7} />
          </mesh>
          <mesh position={[0, baseHeight + 0.25, 0]}>
            <torusGeometry args={[furnitureConfig.width/3, 0.015, 8, 16]} />
            <meshStandardMaterial color="#C0C0C0" roughness={0.2} metalness={0.8} />
          </mesh>
        </>
      )}

      {furnitureConfig.type === 'stool' && (
        <>
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.05, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.2, furnitureConfig.width/2.5, 0.1, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.15, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/2.5, furnitureConfig.width/3, 0.1, 16]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.4} />
          </mesh>
          <mesh position={[0, baseHeight + furnitureConfig.height/2 - 0.1, 0]}>
            <cylinderGeometry args={[furnitureConfig.width/3, furnitureConfig.width/3.2, furnitureConfig.height - 0.25, 12]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.6} />
          </mesh>
        </>
      )}

      {furnitureConfig.type === 'sofa' && (
        <>
          <mesh position={[0, baseHeight + 0.2, 0]}>
            <boxGeometry args={[furnitureConfig.width, 0.15, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, baseHeight + 0.45, furnitureConfig.depth/2 - 0.08]}>
            <boxGeometry args={[furnitureConfig.width, 0.5, 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[furnitureConfig.width/2 - 0.08, baseHeight + 0.35, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[-furnitureConfig.width/2 + 0.08, baseHeight + 0.35, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {furnitureConfig.type === 'armchair' && (
        <>
          <mesh position={[0, baseHeight + 0.25, 0]}>
            <boxGeometry args={[furnitureConfig.width - 0.15, 0.15, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, baseHeight + 0.5, furnitureConfig.depth/2 - 0.08]} rotation={[-Math.PI/15, 0, 0]}>
            <boxGeometry args={[furnitureConfig.width - 0.15, 0.5, 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[furnitureConfig.width/2 - 0.08, baseHeight + 0.4, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
          <mesh position={[-furnitureConfig.width/2 + 0.08, baseHeight + 0.4, 0]}>
            <boxGeometry args={[0.15, 0.3, furnitureConfig.depth - 0.15]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {furnitureConfig.type === 'side_table' && (
        <>
          <mesh position={[0, baseHeight + furnitureConfig.height - 0.03, 0]}>
            <boxGeometry args={[furnitureConfig.width, 0.06, furnitureConfig.depth]} />
            <meshStandardMaterial color={furnitureConfig.color} roughness={0.3} />
          </mesh>
          {[-1, 1].map(x => (
            [-1, 1].map(z => (
              <mesh 
                key={`${x}-${z}`}
                position={[
                  x * (furnitureConfig.width/2 - 0.03),
                  baseHeight + furnitureConfig.height/2 - 0.03,
                  z * (furnitureConfig.depth/2 - 0.03)
                ]}
              >
                <boxGeometry args={[0.05, furnitureConfig.height - 0.06, 0.05]} />
                <meshStandardMaterial color={furnitureConfig.color} roughness={0.8} />
              </mesh>
            ))
          ))}
        </>
      )}
    </group>
  );
}

function Plant({ plantConfig, position, rotation }: { 
  plantConfig: any, 
  position: [number, number, number],
  rotation: number
}) {
  const potHeight = 0.3;
  const potRadius = plantConfig.width / 2 - 0.05;

  return (
    <group position={position} rotation={[0, rotation * Math.PI / 180, 0]}>
      <mesh position={[0, potHeight/2, 0]}>
        <cylinderGeometry args={[potRadius, potRadius * 0.8, potHeight, 12]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      
      <mesh position={[0, potHeight - 0.02, 0]}>
        <cylinderGeometry args={[potRadius * 0.95, potRadius * 0.95, 0.04, 12]} />
        <meshStandardMaterial color="#654321" roughness={1.0} />
      </mesh>
      
      {plantConfig.type === 'tree' && (
        <>
          <mesh position={[0, potHeight + plantConfig.height/3, 0]}>
            <cylinderGeometry args={[0.02, 0.04, plantConfig.height/2, 8]} />
            <meshStandardMaterial color={plantConfig.color} roughness={0.9} />
          </mesh>
          <mesh position={[0, potHeight + plantConfig.height * 0.75, 0]}>
            <sphereGeometry args={[plantConfig.width/3, 12, 8]} />
            <meshStandardMaterial color={plantConfig.leafColor} roughness={0.6} />
          </mesh>
          <mesh position={[plantConfig.width/4, potHeight + plantConfig.height * 0.65, plantConfig.width/4]}>
            <sphereGeometry args={[plantConfig.width/4, 8, 6]} />
            <meshStandardMaterial color={plantConfig.leafColor} roughness={0.6} />
          </mesh>
        </>
      )}
      
      {plantConfig.type === 'broad' && (
        <>
          {[0, 1, 2, 3, 4].map(i => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI * 2 / 5) * plantConfig.width/3,
                potHeight + 0.2 + i * 0.15,
                Math.sin(i * Math.PI * 2 / 5) * plantConfig.width/3
              ]}
              rotation={[Math.PI/4, i * Math.PI * 2 / 5, 0]}
            >
              <planeGeometry args={[0.3, 0.4]} />
              <meshStandardMaterial color={plantConfig.leafColor} side={THREE.DoubleSide} roughness={0.5} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function Counter({ counterConfig, position, rotation }: { 
  counterConfig: any, 
  position: [number, number, number],
  rotation: number
}) {
  const dimensions = {
    width: counterConfig.width,
    length: 0.6,
    height: 1
  };
  
  return (
    <group 
      position={position}
      rotation={[0, (rotation || 0) * Math.PI / 180, 0]}
    >
      <mesh position={[0, dimensions.height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.length]} />
        <meshStandardMaterial 
          color="#1a2332" 
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, dimensions.height + 0.02, 0]}>
        <boxGeometry args={[dimensions.width, 0.04, dimensions.length]} />
        <meshStandardMaterial 
          color="#4a5568" 
          roughness={0.05}
          metalness={0.95}
        />
      </mesh>
    </group>
  );
}

function SceneContent({ 
  monterDimensions,
  wallShape,
  counters,
  furniture,
  plants,
  // showLighting parameter available for future use
}: any) {
  const { width, depth, height } = monterDimensions;

  return (
    <group>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[0, height + 2, 0]}
        target-position={[0, 0, 0]}
        intensity={60}
        angle={Math.PI / 2.5}
        penumbra={0.5}
        distance={15}
        castShadow
      />

      {/* Floor */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Walls */}
      {(wallShape === 'straight' || wallShape === 'l' || wallShape === 'u') && (
        <mesh position={[0, height / 2, -depth / 2]} castShadow receiveShadow>
          <boxGeometry args={[width, height, 0.15]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {(wallShape === 'l' || wallShape === 'u') && (
        <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.15, height, depth]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {wallShape === 'u' && (
        <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.15, height, depth]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} metalness={0.1} />
        </mesh>
      )}

      {/* Counters */}
      {counters.map((counter: any) => (
        <Counter 
          key={`counter-${counter.id}`}
          counterConfig={COUNTER_TYPES[counter.type]}
          position={[counter.position.x, 0, counter.position.z]}
          rotation={counter.rotation}
        />
      ))}

      {/* Furniture */}
      {furniture.map((item: any) => (
        <Furniture 
          key={`furniture-${item.id}`}
          furnitureConfig={FURNITURE_TYPES[item.type]}
          position={[item.position.x, 0, item.position.z]}
          rotation={item.rotation}
        />
      ))}

      {/* Plants */}
      {plants.map((plant: any) => (
        <Plant
          key={`plant-${plant.id}`}
          plantConfig={PLANT_TYPES[plant.type]}
          position={[plant.position.x, 0, plant.position.z]}
          rotation={plant.rotation}
        />
      ))}

      <Grid args={[width * 2, depth * 2]} cellSize={0.5} cellColor="#6f6f6f" sectionSize={1} sectionColor="#9f9f9f" fadeDistance={30} fadeStrength={0.1} infiniteGrid />
    </group>
  );
}

export default function ExhibitorDesignMode({
  monterDimensions,
  wallShape = 'straight',
  onExit,
}: ExhibitorDesignModeProps) {
  const [counters, setCounters] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [nextCounterId, setNextCounterId] = useState(1);
  const [selectedCounterType, setSelectedCounterType] = useState(1);

  const [furniture, setFurniture] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [nextFurnitureId, setNextFurnitureId] = useState(1);
  const [selectedFurnitureType, setSelectedFurnitureType] = useState(0);

  const [plants, setPlants] = useState<Array<{id: number, type: number, position: {x: number, z: number}, rotation: number}>>([]);
  const [nextPlantId, setNextPlantId] = useState(1);
  const [selectedPlantType, setSelectedPlantType] = useState(0);

  const [selectedWallShape] = useState(wallShape);
  const [showLighting, setShowLighting] = useState(false);

  const addCounter = () => {
    setCounters([...counters, {
      id: nextCounterId,
      type: selectedCounterType,
      position: { x: Math.random() * (monterDimensions.width - 1) - monterDimensions.width/2 + 0.5, z: Math.random() * (monterDimensions.depth - 1) - monterDimensions.depth/2 + 0.5 },
      rotation: 0
    }]);
    setNextCounterId(nextCounterId + 1);
  };

  const addFurniture = () => {
    setFurniture([...furniture, {
      id: nextFurnitureId,
      type: selectedFurnitureType,
      position: { x: Math.random() * (monterDimensions.width - 1) - monterDimensions.width/2 + 0.5, z: Math.random() * (monterDimensions.depth - 1) - monterDimensions.depth/2 + 0.5 },
      rotation: 0
    }]);
    setNextFurnitureId(nextFurnitureId + 1);
  };

  const addPlant = () => {
    setPlants([...plants, {
      id: nextPlantId,
      type: selectedPlantType,
      position: { x: Math.random() * (monterDimensions.width - 1) - monterDimensions.width/2 + 0.5, z: Math.random() * (monterDimensions.depth - 1) - monterDimensions.depth/2 + 0.5 },
      rotation: 0
    }]);
    setNextPlantId(nextPlantId + 1);
  };

  const removeCounter = (id: number) => {
    setCounters(counters.filter(c => c.id !== id));
  };

  const removeFurniture = (id: number) => {
    setFurniture(furniture.filter(f => f.id !== id));
  };

  const removePlant = (id: number) => {
    setPlants(plants.filter(p => p.id !== id));
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: '#f0f0f0',
    }}>
      {/* Left Panel - Din nya snygga design */}
      <div style={{
        width: '340px',
        height: '100vh',
        padding: '24px',
        background: 'linear-gradient(135deg, #f8fbff 0%, #e8f4fd 100%)',
        borderRight: '2px solid #e1e8ed',
        boxShadow: '8px 0 32px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: '-24px',
          background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
          margin: '-24px -24px 0 -24px',
          padding: '20px 24px',
          borderRadius: '0 0 12px 12px',
          zIndex: 10
        }}>
          <h2 style={{
            fontWeight: 700,
            fontSize: '20px',
            margin: 0,
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🏗️ Monterval</span>
            <button
              onClick={() => onExit?.()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✕
            </button>
          </h2>
        </div>

        {/* Diskar */}
        <div>
          <label style={{fontWeight: 600, fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block'}}>
            �� Diskar ({counters.length})
          </label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px'}}>
            {COUNTER_TYPES.slice(1, 4).map((counter, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCounterType(idx + 1)}
                style={{
                  padding: '8px 6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: selectedCounterType === idx + 1 ? '#3498db' : 'white',
                  color: selectedCounterType === idx + 1 ? 'white' : '#333',
                  border: '2px solid #e1e8ed',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {counter.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <button
            onClick={addCounter}
            style={{
              width: '100%',
              padding: '10px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + Lägg till disk
          </button>
          {counters.map(counter => (
            <div key={counter.id} style={{fontSize: '11px', marginTop: '6px', padding: '6px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>{COUNTER_TYPES[counter.type].label}</span>
              <button onClick={() => removeCounter(counter.id)} style={{background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px'}}>✕</button>
            </div>
          ))}
        </div>

        {/* Möbler */}
        <div>
          <label style={{fontWeight: 600, fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block'}}>
            🪑 Möbler ({furniture.length})
          </label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px'}}>
            {FURNITURE_TYPES.slice(0, 4).map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFurnitureType(idx)}
                style={{
                  padding: '8px 6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: selectedFurnitureType === idx ? '#27ae60' : 'white',
                  color: selectedFurnitureType === idx ? 'white' : '#333',
                  border: '2px solid #e1e8ed',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {item.label.split(' ')[0]}
              </button>
            ))}
          </div>
          <button
            onClick={addFurniture}
            style={{
              width: '100%',
              padding: '10px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + Lägg till möbel
          </button>
          {furniture.map(item => (
            <div key={item.id} style={{fontSize: '11px', marginTop: '6px', padding: '6px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>{FURNITURE_TYPES[item.type].label}</span>
              <button onClick={() => removeFurniture(item.id)} style={{background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px'}}>✕</button>
            </div>
          ))}
        </div>

        {/* Växter */}
        <div>
          <label style={{fontWeight: 600, fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block'}}>
            🌿 Växter ({plants.length})
          </label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px'}}>
            {PLANT_TYPES.slice(0, 4).map((plant, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPlantType(idx)}
                style={{
                  padding: '8px 6px',
                  fontSize: '11px',
                  fontWeight: '500',
                  background: selectedPlantType === idx ? '#e67e22' : 'white',
                  color: selectedPlantType === idx ? 'white' : '#333',
                  border: '2px solid #e1e8ed',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {plant.label}
              </button>
            ))}
          </div>
          <button
            onClick={addPlant}
            style={{
              width: '100%',
              padding: '10px',
              background: '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + Lägg till växt
          </button>
          {plants.map(plant => (
            <div key={plant.id} style={{fontSize: '11px', marginTop: '6px', padding: '6px', background: '#f0f0f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>{PLANT_TYPES[plant.type].label}</span>
              <button onClick={() => removePlant(plant.id)} style={{background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px'}}>✕</button>
            </div>
          ))}
        </div>

        {/* Inställningar */}
        <div>
          <label style={{fontWeight: 600, fontSize: '14px', color: '#2c3e50', marginBottom: '8px', display: 'block'}}>
            ⚙️ Inställningar
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f0f0f0', borderRadius: '6px', cursor: 'pointer'}}>
            <input 
              type="checkbox" 
              checked={showLighting}
              onChange={(e) => setShowLighting(e.target.checked)}
              style={{accentColor: '#3498db', cursor: 'pointer'}}
            />
            <span style={{fontSize: '13px', fontWeight: '500'}}>💡 SAM-LED</span>
          </label>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        background: '#f8f9fa'
      }}>
        <Canvas
          camera={{
            position: [monterDimensions.width, monterDimensions.depth * 1.5, monterDimensions.depth * 1.5],
            fov: 50
          }}
          style={{width: '100%', height: '100%'}}
        >
          <SceneContent 
            monterDimensions={monterDimensions}
            wallShape={selectedWallShape}
            counters={counters}
            furniture={furniture}
            plants={plants}
            showLighting={showLighting}
          />
          <OrbitControls 
            autoRotate
            autoRotateSpeed={2}
            enableZoom
            enablePan
          />
        </Canvas>

        {/* Info Badge */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '500',
          maxWidth: '300px',
          lineHeight: '1.4'
        }}>
          💡 <strong>Tips:</strong> Använd sidopanelen för att lägga till och ta bort element.
        </div>
      </div>
    </div>
  );
}
