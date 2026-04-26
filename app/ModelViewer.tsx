"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";

type GLTFResult = {
  scene: THREE.Group;
  materials: Record<string, THREE.Material>;
};

function HouseModel({
  modelPath,
  terrace,
  facade,
  terraceCladding,
  windowColor,
  windowType,
  exteriorDoor,
  mansard,
  floorCladding,
  staircase,
  interiorWall,
  roofType,
  roofColor,
  bathroomWalls,
  bathroom,
}: {
  modelPath: string;
  terrace: string;
  facade: string;
  terraceCladding: string;
  windowColor: string;
  windowType: string;
  exteriorDoor: string;
  mansard: string;
  floorCladding: string;
  staircase: string;
  interiorWall: string;
  roofType: string;
  roofColor: string;
  bathroomWalls: string;
  bathroom: string;
}) {
  const { scene, materials } = useGLTF(modelPath) as unknown as GLTFResult;

  useEffect(() => {
    // CANOPY
    const canopyBase = scene.getObjectByName("terrace_70_base");
const canopyTop = scene.getObjectByName("terrace_70_top");
const canopyTopSheet = scene.getObjectByName("terrace_70_top_sheet");
const canopyTopTile = scene.getObjectByName("terrace_70_top_tile");

const terraceSpruce = scene.getObjectByName("terrace_spruce");
const terraceWpc = scene.getObjectByName("terrace_wpc");
const terraceTropical = scene.getObjectByName("terrace_tropical");

if (canopyBase) canopyBase.visible = false;
if (canopyTop) canopyTop.visible = false;
if (canopyTopSheet) canopyTopSheet.visible = false;
if (canopyTopTile) canopyTopTile.visible = false;

if (terraceSpruce) terraceSpruce.visible = false;
if (terraceWpc) terraceWpc.visible = false;
if (terraceTropical) terraceTropical.visible = false;

if (terrace === "70") {
  if (canopyBase) canopyBase.visible = true;
  if (canopyTop) canopyTop.visible = true;

  if (roofType === "sheet") {
    if (canopyTopSheet) canopyTopSheet.visible = true;
  }

  if (roofType === "tile") {
    if (canopyTopTile) canopyTopTile.visible = true;
  }

  if (terraceCladding === "spruce" && terraceSpruce) terraceSpruce.visible = true;
  if (terraceCladding === "wpc" && terraceWpc) terraceWpc.visible = true;
  if (terraceCladding === "tropical" && terraceTropical) terraceTropical.visible = true;
}

    // FACADE MATERIALS
    const woodMaterial = materials["facade_wood"];
    const plasterMaterial =
      materials["facade_plaster"] || materials["facade_white"];
    const larchMaterial = materials["facade_larch"];

    let selectedFacadeMaterial: THREE.Material | undefined;

    if (facade === "wood") selectedFacadeMaterial = woodMaterial;
    if (facade === "plaster") selectedFacadeMaterial = plasterMaterial;
    if (facade === "larch") selectedFacadeMaterial = larchMaterial;

    const applyMaterialToObject = (objectName: string, material?: THREE.Material) => {
      const object = scene.getObjectByName(objectName);

      if (object && material) {
        object.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            if (Array.isArray(obj.material)) {
              obj.material = obj.material.map(() => material as THREE.Material);
            } else {
              obj.material = material as THREE.Material;
            }
          }
        });
      }
    };

    applyMaterialToObject("wall_facade", selectedFacadeMaterial);
    applyMaterialToObject("terrace_70_base", selectedFacadeMaterial);

    // WINDOW TYPE - ONLY GF CHANGES
    const gfWindowNames = [
      "GF_fixed_windows",
      "GF_1_4_door",
      "GF_1_4_sliding_door",
      "GF_1_2_sliding_door",
    ];

    gfWindowNames.forEach((name) => {
      const obj = scene.getObjectByName(name);
      if (obj) obj.visible = false;
    });

    if (windowType === "fixed") {
      const obj = scene.getObjectByName("GF_fixed_windows");
      if (obj) obj.visible = true;
    }

    if (windowType === "door_quarter") {
      const obj = scene.getObjectByName("GF_1_4_door");
      if (obj) obj.visible = true;
    }

    if (windowType === "sliding_quarter") {
      const obj = scene.getObjectByName("GF_1_4_sliding_door");
      if (obj) obj.visible = true;
    }

    if (windowType === "sliding_half") {
      const obj = scene.getObjectByName("GF_1_2_sliding_door");
      if (obj) obj.visible = true;
    }

    // WINDOW COLOR
    const applyWindowColor = (objectName: string) => {
      const object = scene.getObjectByName(objectName);
      if (!object) return;

      object.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (Array.isArray(obj.material)) return;

          const mat = obj.material as THREE.MeshStandardMaterial;

          if (windowColor === "anthracite" || windowColor === "mixed") {
            mat.color.set("#19303e");
          } else {
            mat.color.set("#ffffff");
          }
        }
      });
    };

    applyWindowColor("GF_fixed_windows");
    applyWindowColor("GF_1_4_door");
    applyWindowColor("GF_1_4_sliding_door");
    applyWindowColor("GF_1_2_sliding_door");
    applyWindowColor("1F_front_window");

    // EXTERIOR DOOR
    const normalDoor = scene.getObjectByName("GF_door_normal");
    const balconyDoor = scene.getObjectByName("GF_door_balcony");

    if (normalDoor) normalDoor.visible = false;
    if (balconyDoor) balconyDoor.visible = false;

    if (exteriorDoor === "normal") {
      if (normalDoor) normalDoor.visible = true;
    }

    if (exteriorDoor === "balcony") {
      if (balconyDoor) balconyDoor.visible = true;
    }

    // MANSARD
    const mansardBase = scene.getObjectByName("mansard_base");
    const mansardBaseTop = scene.getObjectByName("mansard_base_top");
    const mansardFull = scene.getObjectByName("mansard_full");
    const mansardFullTop = scene.getObjectByName("mansard_full_top");

    if (mansardBase) mansardBase.visible = false;
    if (mansardBaseTop) mansardBaseTop.visible = false;
    if (mansardFull) mansardFull.visible = false;
    if (mansardFullTop) mansardFullTop.visible = false;

    if (mansard === "half") {
      if (mansardBase) mansardBase.visible = true;
      if (mansardBaseTop) mansardBaseTop.visible = true;
    }

    if (mansard === "full") {
      if (mansardBase) mansardBase.visible = true;
      if (mansardBaseTop) mansardBaseTop.visible = true;
      if (mansardFull) mansardFull.visible = true;
      if (mansardFullTop) mansardFullTop.visible = true;
    }

    // FLOOR CLADDING
    const floorBasicMaterial = materials["floor_basic"];
    const floorVinylMaterial = materials["floor_vinyl"];

    let selectedFloorMaterial: THREE.Material | undefined;

    if (floorCladding === "laminate") selectedFloorMaterial = floorBasicMaterial;
    if (floorCladding === "vinyl") selectedFloorMaterial = floorVinylMaterial;

    applyMaterialToObject("GF_floor", selectedFloorMaterial);
    applyMaterialToObject("mansard_base_top", selectedFloorMaterial);
    applyMaterialToObject("mansard_full_top", selectedFloorMaterial);

    // STAIRCASE
    const stairsBasic = scene.getObjectByName("stairs_basic");
    const stairsHi = scene.getObjectByName("stairs_hi");

    if (stairsBasic) stairsBasic.visible = false;
    if (stairsHi) stairsHi.visible = false;

    if (staircase === "basic") {
      if (stairsBasic) stairsBasic.visible = true;
    }

    if (staircase === "hi") {
      if (stairsHi) stairsHi.visible = true;
    }

    // INTERIOR WALL MATERIAL
    const plywoodMaterial = materials["plywood"];
    const claddingMaterial = materials["facade_white"];

    let selectedInteriorMaterial: THREE.Material | undefined;

    if (interiorWall === "plywood") selectedInteriorMaterial = plywoodMaterial;
    if (interiorWall === "cladding") selectedInteriorMaterial = claddingMaterial;

    applyMaterialToObject("interior_wall", selectedInteriorMaterial);

    // ROOF TYPE
    const roofSheet = scene.getObjectByName("roof_sheet");
    const roofTile = scene.getObjectByName("roof_tile");

    if (roofSheet) roofSheet.visible = false;
    if (roofTile) roofTile.visible = false;

    if (roofType === "sheet") {
      if (roofSheet) roofSheet.visible = true;
    }

    if (roofType === "tile") {
      if (roofTile) roofTile.visible = true;
    }

    // ROOF COLOR
    const applyRoofColor = (objectName: string) => {
      const object = scene.getObjectByName(objectName);
      if (!object) return;

      object.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (Array.isArray(obj.material)) return;

          const mat = obj.material as THREE.MeshStandardMaterial;

          if (roofColor === "anthracite") mat.color.set("#19303e");
          if (roofColor === "black") mat.color.set("#111111");
          if (roofColor === "white") mat.color.set("#ffffff");
          if (roofColor === "brown") mat.color.set("#6b4a2f");
        }
      });
    };

    applyRoofColor("roof_sheet");
    applyRoofColor("roof_tile");
    applyRoofColor("terrace_70_top_sheet");
    applyRoofColor("terrace_70_top_tile");

     // BATHROOM WALLS
    const bathroomWallObject = scene.getObjectByName("bath_interior");
    const bathWhiteMaterial = materials["PVC_white"];
    const bathGrayMaterial = materials["PVC_gray"];

    let selectedBathroomWallMaterial: THREE.Material | undefined;

    if (bathroomWalls === "white") selectedBathroomWallMaterial = bathWhiteMaterial;
    if (bathroomWalls === "gray") selectedBathroomWallMaterial = bathGrayMaterial;

    if (bathroomWallObject && selectedBathroomWallMaterial) {
      bathroomWallObject.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map(
              () => selectedBathroomWallMaterial as THREE.Material
            );
          } else {
            obj.material = selectedBathroomWallMaterial as THREE.Material;
          }
        }
      });
    }
    // BATHROOM EQUIPMENT
    const bathBasic = scene.getObjectByName("bath_basic");
    const bathLux = scene.getObjectByName("bath_lux");

    if (bathBasic) bathBasic.visible = false;
    if (bathLux) bathLux.visible = false;

    if (bathroom === "basic") {
      if (bathBasic) bathBasic.visible = true;
    }

    if (bathroom === "lux") {
      if (bathLux) bathLux.visible = true;
    }
    // GLASS FIX
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const meshMaterials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];

        meshMaterials.forEach((mat) => {
          if (mat.name.toLowerCase().includes("glass")) {
            mat.transparent = true;
            mat.opacity = 0.4;

            if ("roughness" in mat) mat.roughness = 0.1;
            if ("metalness" in mat) mat.metalness = 0;

            mat.depthWrite = false;
          }
        });
      }
    });
  }, [
    terrace,
    facade,
    terraceCladding,
    windowColor,
    windowType,
    exteriorDoor,
    mansard,
    floorCladding,
    staircase,
    interiorWall,
    roofType,
    roofColor,
    scene,
    materials,
    bathroomWalls,
    bathroom,
  ]);

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, -1.5, 0.8]}
      rotation={[0, -0.1, 0]}
    />
  );
}

function CameraControls({
  viewMode,
}: {
  viewMode: "exterior" | "interior"| "bathroom";
}) {
  const controlsRef = useRef<any>(null);

 useEffect(() => {
  if (!controlsRef.current) return;

  const controls = controlsRef.current;
  const camera = controls.object;

  if (viewMode === "bathroom") {
    camera.position.set(-1.5, 0.8, 0);
    controls.target.set(-2, 0.1, -0.7);
    controls.minDistance = 0.8;
    controls.maxDistance = 0.8;
    camera.fov = 65;
  } else if (viewMode === "interior") {
    camera.position.set(1.5, 0.8, 1.5);
    controls.target.set(0, 0.8, 1);
    controls.minDistance = 1;
    controls.maxDistance = 1.7;
    camera.fov = 60;
  } else {
    camera.position.set(10, 3, 8);
    controls.target.set(0, 0.5, 0);
    controls.minDistance = 4;
    controls.maxDistance = 15;
    camera.fov = 45;
  }

  camera.updateProjectionMatrix();
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.update();
}, [viewMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
}

export default function ModelViewer({
  modelPath,
  terrace,
  facade,
  terraceCladding,
  windowColor,
  windowType,
  exteriorDoor,
  viewMode,
  mansard,
  floorCladding,
  staircase,
  interiorWall,
  roofType,
  roofColor,
  bathroomWalls,
  bathroom,
}: {
  modelPath: string;
  terrace: string;
  facade: string;
  terraceCladding: string;
  windowColor: string;
  windowType: string;
  exteriorDoor: string;
  viewMode: "exterior" | "interior" | "bathroom";
  mansard: string;
  floorCladding: string;
  staircase: string;
  interiorWall: string;
  roofType: string;
  roofColor: string;
  bathroomWalls: string;
  bathroom: string;
}) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [10, 3, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Environment preset="city" />

        <HouseModel
          modelPath={modelPath}
          terrace={terrace}
          facade={facade}
          terraceCladding={terraceCladding}
          windowColor={windowColor}
          windowType={windowType}
          exteriorDoor={exteriorDoor}
          mansard={mansard}
          floorCladding={floorCladding}
          staircase={staircase}
          interiorWall={interiorWall}
          roofType={roofType}
          roofColor={roofColor}
          bathroomWalls={bathroomWalls}
          bathroom={bathroom}
        />
        <CameraControls viewMode={viewMode} />
      </Canvas>
    </div>
  );
}