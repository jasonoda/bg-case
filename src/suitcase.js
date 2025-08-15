import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import suitcaseModelUrl from './models/suitcase.glb';

export class Suitcase {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.suitcaseModel = null;
        this.animationId = null;
        this.lidObject = null;
        this.lidTime = 0;
    }

    setUp(engine) {
        console.log('Setting up Suitcase 3D scene...');
        this.e = engine;
        this.container = document.getElementById('suitcase3DContainer');
        
        if (!this.container) {
            console.error('Could not find suitcase3DContainer element');
            return;
        }
        
        try {
            this.initScene();
            this.initCamera();
            this.initRenderer();
            this.initLights();
            this.loadSuitcaseModel();
            this.animate();
            this.handleResize();
            
            // Add a button to show/hide the 3D scene
            // this.addToggleButton();
            console.log('Suitcase 3D scene setup complete');
        } catch (error) {
            console.error('Error setting up Suitcase 3D scene:', error);
        }
    }

    initScene() {
        console.log('Initializing scene...');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Black background
        console.log('Scene created:', this.scene);
    }

    initCamera() {
        console.log('Initializing camera...');
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            350 / 350, // Aspect ratio (350x350 canvas)
            0.1, // Near plane
            1000 // Far plane
        );
        
        // Create camera rig system similar to temp/engine.js
        this.camContX = new THREE.Group();
        this.camContY = new THREE.Group();
        this.scene.add(this.camContY);
        this.camContY.add(this.camContX);
        this.camContX.add(this.camera);
        
        // Position camera in the rig
        this.camera.position.z = 2.5;
        this.camera.position.y = .5;
        
        // Set initial camera rig rotations
        this.camContX.rotation.x = this.e.u.ca(-25); // -90 degrees in radians
        this.camContY.rotation.y = this.e.u.ca(180);
        
        console.log('Camera rig created:', this.camera);
    }

    initRenderer() {
        console.log('Initializing renderer...');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: false 
        });
        this.renderer.setSize(350, 350);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Make sure the canvas is visible
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.margin = '0 auto';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.zIndex = '1000000';
        
        console.log('Renderer created, appending to container...');
        
        // Clear the container first
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        
        // Make sure the container is visible
        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
        this.container.style.opacity = '1';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '999999';
        this.container.style.pointerEvents = 'auto';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        
        console.log('Renderer setup complete');
        console.log('Canvas element:', this.renderer.domElement);
        console.log('Canvas dimensions:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
        console.log('Canvas style:', this.renderer.domElement.style.cssText);
        console.log('Container:', this.container);
        console.log('Container dimensions:', this.container.offsetWidth, 'x', this.container.offsetHeight);
    }

    initLights() {
        console.log('Initializing lights...');
        // Much brighter ambient light for overall illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        // Bright directional light for shadows and highlights
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Bright point light for additional illumination
        const pointLight = new THREE.PointLight(0xffffff, 1.5);
        pointLight.position.set(-5, 5, 5);
        this.scene.add(pointLight);

        // Add a bright fill light from the front
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
        fillLight.position.set(0, 0, 10);
        this.scene.add(fillLight);

        // Add a bright top light
        const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
        topLight.position.set(0, 10, 0);
        this.scene.add(topLight);

        console.log('Bright lights added to scene');
    }

    loadSuitcaseModel() {
        console.log('Loading suitcase model...');
        
        try {
            const loader = new GLTFLoader();
            console.log('GLTFLoader created:', loader);
            
            loader.load(
                suitcaseModelUrl,
                (gltf) => {
                    console.log('Model loaded successfully:', gltf);
                    this.suitcaseModel = gltf.scene;
                    
                    // Enable shadows for the model and find the lid
                    this.suitcaseModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Find the lid object
                    this.findLidObject();

                    // Center and scale the model
                    const box = new THREE.Box3().setFromObject(this.suitcaseModel);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    
                    // Center the model perfectly
                    this.suitcaseModel.position.sub(center);
                    
                    // Scale to size 2
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2.0 / maxDim;
                    this.suitcaseModel.scale.setScalar(scale);
                    
                    // Ensure it's at the exact center of the scene
                    this.suitcaseModel.position.set(0, 0, 0);
                    
                    this.scene.add(this.suitcaseModel);
                    console.log('Suitcase model centered and added to scene');
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error('Error loading suitcase model:', error);
                    console.log('Creating fallback suitcase...');
                    // Create a fallback cube if model fails to load
                    this.createFallbackSuitcase();
                }
            );
        } catch (error) {
            console.error('Error creating GLTFLoader:', error);
            console.log('Creating fallback suitcase due to loader error...');
            this.createFallbackSuitcase();
                }
    }
    
    findLidObject() {
        console.log('Searching for lid object...');
        
        // Look for objects with names that might indicate they're the lid
        const possibleLidNames = ['lid', 'top', 'cover', 'cap', 'door'];
        
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh) {
                const name = child.name.toLowerCase();
                console.log('Found mesh:', name);
                
                // Check if this mesh might be the lid
                if (possibleLidNames.some(lidName => name.includes(lidName))) {
                    this.lidObject = child;
                    console.log('Found lid object:', child.name);
                    return;
                }
                
                // If no specific name found, try to identify by position (lid is usually on top)
                if (child.position.y > 0.5) {
                    this.lidObject = child;
                    console.log('Found lid object by position:', child.name, 'at y:', child.position.y);
                    return;
                }
            }
        });
        
        if (this.lidObject) {
            console.log('Lid object found and ready for animation');
            // Store original rotation for reset
            this.lidOriginalRotation = this.lidObject.rotation.x;
        } else {
            console.log('No lid object found, creating a fallback lid');
            this.createFallbackLid();
        }
    }
    
    createFallbackLid() {
        console.log('Creating fallback lid...');
        // Create a simple lid geometry
        const lidGeometry = new THREE.BoxGeometry(2, 0.1, 1);
        const lidMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        this.lidObject = new THREE.Mesh(lidGeometry, lidMaterial);
        
        // Position the lid on top of the suitcase
        this.lidObject.position.set(0, 0.55, 0);
        this.lidObject.castShadow = true;
        this.lidObject.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.lidObject);
        this.lidOriginalRotation = 0;
        
        console.log('Fallback lid created and added to scene');
    }
    
    createFallbackSuitcase() {
        console.log('Creating fallback suitcase...');
        const geometry = new THREE.BoxGeometry(2, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.suitcaseModel = new THREE.Mesh(geometry, material);
        
        // Center the fallback suitcase perfectly
        this.suitcaseModel.position.set(0, 0, 0);
        
        this.suitcaseModel.castShadow = true;
        this.suitcaseModel.receiveShadow = true;
        this.scene.add(this.suitcaseModel);
        console.log('Fallback suitcase centered and added to scene');
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Animate the lid if we have it
        if (this.lidObject) {
            this.animateLid();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    animateLid() {
        if (!this.lidObject) return;
        
        // Update lid animation
        this.lidTime += 0.02; // Animation speed
        
        // Create a yoyo effect with 90-degree rotation
        const progress = (Math.sin(this.lidTime) + 1) / 2; // 0 to 1
        const rotation = progress * Math.PI / 2; // 0 to 90 degrees (π/2 radians)
        
        this.lidObject.rotation.x = rotation;
    }

    handleResize() {
        window.addEventListener('resize', () => {
            // Keep the canvas at 350x350
            this.renderer.setSize(350, 350);
            this.camera.aspect = 350 / 350;
            this.camera.updateProjectionMatrix();
        });
    }

    update() {
        // Additional update logic can go here
    }
    
    // Camera rig control methods
    rotateCameraX(angle) {
        if (this.camContX) {
            this.camContX.rotation.x += angle;
        }
    }
    
    rotateCameraY(angle) {
        if (this.camContY) {
            this.camContY.rotation.y += angle;
        }
    }
    
    setCameraRotationX(angle) {
        if (this.camContX) {
            this.camContX.rotation.x = angle;
        }
    }
    
    setCameraRotationY(angle) {
        if (this.camContY) {
            this.camContY.rotation.y = angle;
        }
    }

    
    resetLid() {
        if (this.lidObject && this.lidOriginalRotation !== undefined) {
            this.lidObject.rotation.x = this.lidOriginalRotation;
            this.lidTime = 0;
            console.log('Lid reset to original position');
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}