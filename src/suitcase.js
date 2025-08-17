import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import suitcaseModelUrl from './models/suitcase.glb';
import { gsap } from 'gsap';

/**
 * SUITCASE ANIMATION SYSTEM - GSAP Implementation
 * 
 * ANIMATION STRUCTURE:
 * 
 * REVEAL ANIMATION (1 second total):
 * - Phase 1 (0.0s - 0.2s): Container fades in
 * - Phase 2 (0.1s - 0.6s): Lid opens + ELIMINATED text dramatic entrance
 *   * Lid rotates from 0° to 90° (0.1s - 0.6s)
 *   * ELIMINATED text: opacity 0→1, translateY 80→0, scale 0.3→2.0→1.0 (0.1s - 0.6s)
 * - Phase 3 (0.4s - 0.8s): Bottom text slides down
 * 
 * HIDE ANIMATION (0.5 seconds total):
 * - Phase 1 (0.0s - 0.5s): All elements fade out
 * - Phase 2 (0.0s - 0.5s): Text elements move while fading
 *   * ELIMINATED text: moves down 80px
 *   * Bottom text: moves up 20px
 * 
 * CONTINUOUS ANIMATION:
 * - ELIMINATED text color pulses between white and golden yellow (#FFD700)
 * 
 * CONTROLS:
 * - Press 'V' key to trigger reveal animation
 * - Press 'V' key again to trigger hide animation
 * 
 * EASING: power2.out for reveal, power2.in for hide
 */

export class Suitcase {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.suitcaseModel = null;
        this.animationId = null;
        this.lidObject = null;
        this.lidTime = 0;
        this.animationState = 'hidden'; // hidden, showing, visible, hiding
        this.revealTime = 0;
        this.hideTime = 0;
        this.pricesignMaterial = null;
        this.priceTextures = {};
        this.queuedTextureValue = null;
        this.isProcessingTexture = false;
        this.lastTickSecond = 0;
    }

    setUp(engine) {
        //console.log('Setting up Suitcase 3D scene...');
        this.e = engine;
        this.container = document.getElementById('suitcase3DContainer');
        
        if (!this.container) {
            //console.error('Could not find suitcase3DContainer element');
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
            this.setupKeyboardControls();
            this.setupContinuousAnimations();
            
            // Add a button to show/hide the 3D scene
            // this.addToggleButton();
            //console.log('Suitcase 3D scene setup complete');
        } catch (error) {
            //console.error('Error setting up Suitcase 3D scene:', error);
        }
    }

    initScene() {
        //console.log('Initializing scene...');
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent background
        //console.log('Scene created:', this.scene);
    }

    initCamera() {
        //console.log('Initializing camera...');
        this.camera = new THREE.PerspectiveCamera(
            45, // Field of view (reduced from 75 to reduce foreshortening)
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
        this.camera.position.z = 3.8; // Moved further back to prevent cutoff
        this.camera.position.y = .7;
        
        // Set initial camera rig rotations
        this.camContX.rotation.x = this.e.u.ca(-5); // -90 degrees in radians
        this.camContY.rotation.y = this.e.u.ca(180);
        
        //console.log('Camera rig created:', this.camera);
    }

    initRenderer() {
        //console.log('Initializing renderer...');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setSize(350, 350);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x000000, 0);
        
        // Create a new div to contain the canvas and text
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.style.position = 'relative';
        this.canvasContainer.style.width = '350px';
        this.canvasContainer.style.height = '350px';
        this.canvasContainer.style.display = 'flex';
        this.canvasContainer.style.flexDirection = 'column';
        this.canvasContainer.style.alignItems = 'center';
        this.canvasContainer.style.justifyContent = 'space-between';
        this.canvasContainer.style.backgroundColor = 'transparent';
        this.canvasContainer.style.background = 'none';
        this.canvasContainer.style.backdropFilter = 'none';
        this.canvasContainer.style.webkitBackdropFilter = 'none';
        this.canvasContainer.style.pointerEvents = 'none';
        
        // Create the "ELIMINATED" text
        this.eliminatedText = document.createElement('div');
        this.eliminatedText.textContent = 'ELIMINATED';
        this.eliminatedText.style.color = 'white';
        this.eliminatedText.style.fontSize = '22px';
        this.eliminatedText.style.fontWeight = 'bold';
        this.eliminatedText.style.textAlign = 'center';
        this.eliminatedText.style.marginTop = '10px';
        this.eliminatedText.style.zIndex = '1000001';
        this.eliminatedText.style.fontFamily = 'Montserrat, sans-serif';
        this.eliminatedText.style.opacity = '0';
        // this.eliminatedText.style.letterSpacing = '1px';
        this.eliminatedText.style.transform = 'translateY(80px)';
        this.eliminatedText.style.textShadow = '0 0 6px #FFFFFF';
        this.eliminatedText.style.pointerEvents = 'none';
        
        // Create the "click any key to continue" text
        this.continueText = document.createElement('div');
        this.continueText.textContent = 'TAP TO CONTINUE';
        this.continueText.style.color = 'white';
        this.continueText.style.fontSize = '14px';
        this.continueText.style.textAlign = 'center';
        this.continueText.style.marginBottom = '10px';
        this.continueText.style.zIndex = '1000001';
        this.continueText.style.letterSpacing = '1px';
        this.continueText.style.fontFamily = 'Montserrat, sans-serif';
        this.continueText.style.opacity = '0';
        this.continueText.style.transform = 'translateY(20px)';
        
        // Make sure the canvas is visible
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.margin = '0 auto';
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.zIndex = '1000000';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.backgroundColor = 'transparent';
        this.renderer.domElement.style.background = 'none';
        this.renderer.domElement.style.backdropFilter = 'none';
        this.renderer.domElement.style.webkitBackdropFilter = 'none';
        this.renderer.domElement.style.pointerEvents = 'none';
        
        
        //console.log('Renderer created, appending to container...');
        
        // Clear the container first
        this.container.innerHTML = '';
        
        // Add text elements and canvas to the canvas container
        this.canvasContainer.appendChild(this.eliminatedText);
        this.canvasContainer.appendChild(this.renderer.domElement);
        this.canvasContainer.appendChild(this.continueText);
        
        // Add the canvas container to the main container
        this.container.appendChild(this.canvasContainer);
        
        // Create material control sliders
        this.createMaterialControls();
        
        // Create particle effects container
        this.createParticleContainer();
        
        // Add click/tap event listener to hide suitcase
        this.setupClickToHide();
        
        // Set initial positions with GSAP
        gsap.set(this.container, { opacity: 0 });
        gsap.set(this.eliminatedText, { opacity: 0, translateY: 80 });
        gsap.set(this.continueText, { opacity: 0, translateY: -20 });
        
        // Make sure the container is visible
        this.container.style.display = 'block';
        this.container.style.visibility = 'visible';
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '9999';
        this.container.style.pointerEvents = 'none';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'transparent';
        this.container.style.background = 'none';
        
        // Pre-load price textures
        this.preloadPriceTextures();
        
        //console.log('Renderer setup complete');
        //console.log('Canvas element:', this.renderer.domElement);
        //console.log('Canvas dimensions:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
        //console.log('Canvas style:', this.renderer.domElement.style.cssText);
        //console.log('Container:', this.container);
        //console.log('Container dimensions:', this.container.offsetWidth, 'x', this.container.offsetHeight);
    }

    initLights() {
        //console.log('Initializing lights...');
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
        const pointLight = new THREE.PointLight(0xffffff, 4.5);
        pointLight.position.set(0, .5, -1);
        this.scene.add(pointLight);
        
        // Debug box to show point light position
        const debugGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const debugMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        this.debugBox = new THREE.Mesh(debugGeometry, debugMaterial);
        this.debugBox.position.copy(pointLight.position);
        // this.scene.add(this.debugBox);

        // Add a bright fill light from the front
        // const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
        // fillLight.position.set(0, 0, 10);
        // this.scene.add(fillLight);

        // Add a bright top light
        const topLight = new THREE.DirectionalLight(0xffffff, 2.0);
        topLight.position.set(0, 10, 0);
        this.scene.add(topLight);

                // Load cube texture for environment mapping
        this.loadCubeTexture();
        
        //console.log('Bright lights added to scene');
    }

    loadSuitcaseModel() {
        //console.log('Loading suitcase model...');
        
        try {
            const loader = new GLTFLoader();
            //console.log('GLTFLoader created:', loader);
            
            loader.load(
                suitcaseModelUrl,
                (gltf) => {
                    //console.log('Model loaded successfully:', gltf);
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
                    //console.log('Suitcase model centered and added to scene');
                },
                (progress) => {
                    //console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    //console.error('Error loading suitcase model:', error);
                    //console.log('Creating fallback suitcase...');
                    // Create a fallback cube if model fails to load
                    this.createFallbackSuitcase();
                }
            );
        } catch (error) {
            //console.error('Error creating GLTFLoader:', error);
            //console.log('Creating fallback suitcase due to loader error...');
            this.createFallbackSuitcase();
                }
    }
    
    findLidObject() {
        //console.log('Searching for lid object...');
        
        // Look for objects with names that might indicate they're the lid
        const possibleLidNames = ['lid', 'top', 'cover', 'cap', 'door'];
        
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh) {
                const name = child.name.toLowerCase();
                //console.log('Found mesh:', name);
                
                // Check if this mesh might be the lid
                if (possibleLidNames.some(lidName => name.includes(lidName))) {
                    this.lidObject = child;
                    //console.log('Found lid object:', child.name);
                    return;
                }
                
                // If no specific name found, try to identify by position (lid is usually on top)
                if (child.position.y > 0.5) {
                    this.lidObject = child;
                    //console.log('Found lid object by position:', child.name, 'at y:', child.position.y);
                    return;
                }
            } else if (child.isGroup || child.isObject3D) {
                // Check if this container might be the lid
                const name = child.name.toLowerCase();
                //console.log('Found container:', name);
                
                if (possibleLidNames.some(lidName => name.includes(lidName))) {
                    this.lidObject = child;
                    //console.log('Found lid container:', child.name);
                    return;
                }
                
                // If no specific name found, try to identify by position (lid is usually on top)
                if (child.position.y > 0.5) {
                    this.lidObject = child;
                    //console.log('Found lid container by position:', child.name, 'at y:', child.position.y);
                    return;
                }
            }
        });
        
        if (this.lidObject) {
            //console.log('Lid object found and ready for animation');
            // Store original rotation for reset
            this.lidOriginalRotation = this.lidObject.rotation.x;
            // Ensure lid starts closed
            this.lidObject.rotation.x = 0;
            
            // Find the pricesign material within the lid container
            this.findPricesignMaterial();
        } else {
            //console.log('No lid object found, creating a fallback lid');
            this.createFallbackLid();
        }
    }
    
    // Find the pricesign material within the lid container
    findPricesignMaterial() {
        if (!this.lidObject) return;
        
        //console.log('🔍 Searching for pricesign material in lid container...');
        
        this.lidObject.traverse((child) => {
            if (child.isMesh && child.material) {
                //console.log('🔍 Found mesh in lid:', child.name, 'Material:', child.material);
                
                // Check if this mesh has a pricesign material
                if (Array.isArray(child.material)) {
                    child.material.forEach((material, index) => {
                        if (material.name && material.name.toLowerCase().includes('pricesign')) {
                            this.pricesignMaterial = material;
                            //console.log('✅ Found pricesign material in array at index:', index);
                        }
                    });
                } else {
                    if (child.material.name && child.material.name.toLowerCase().includes('pricesign')) {
                        this.pricesignMaterial = child.material;
                        //console.log('✅ Found pricesign material:', child.material.name);
                    }
                }
            }
        });
        
        if (this.pricesignMaterial) {
            //console.log('✅ Pricesign material ready:', this.pricesignMaterial.name);
            
            // Check if we have a queued texture to assign
            if (this.queuedTextureValue !== null) {
                //console.log("🔄 Processing queued texture assignment for value:", this.queuedTextureValue);
                this.assignPriceTexture(this.queuedTextureValue);
            }
        } else {
            //console.log('❌ No pricesign material found in lid container');
        }
    }
    
    createFallbackLid() {
        //console.log('Creating fallback lid...');
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
        
        //console.log('Fallback lid created and added to scene');
    }
    
    createFallbackSuitcase() {
        //console.log('Creating fallback suitcase...');
        const geometry = new THREE.BoxGeometry(2, 1, 1);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.suitcaseModel = new THREE.Mesh(geometry, material);
        
        // Center the fallback suitcase perfectly
        this.suitcaseModel.position.set(0, 0, 0);
        
        this.suitcaseModel.castShadow = true;
        this.suitcaseModel.receiveShadow = true;
        this.scene.add(this.suitcaseModel);
        //console.log('Fallback suitcase centered and added to scene');
    }

    setupKeyboardControls() {
        // Add keyboard event listener
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'v') {
                if (this.animationState === 'hidden') {
                    // Start showing animation
                    this.animationState = 'showing';
                    this.runRevealAnimation();
                } else if (this.animationState === 'visible') {
                    // Start hiding animation
                    this.animationState = 'hiding';
                    this.runHideAnimation();
                }
            }
        });
    }

    show(action){
        if (action === 'show') {
            this.animationState = 'showing';
            this.runRevealAnimation();
        } else if (action === 'hide') {
            this.animationState = 'hiding';
            this.runHideAnimation();
        }
    }
    
    // Setup click/tap to hide functionality
    setupClickToHide() {
        document.addEventListener('click', (event) => {
            if (this.animationState === 'visible') {
                //console.log("hide")
                this.show('hide');
                
                // Reset scene action so player can click another case
                this.e.scene.action = "choose";
            }
        });
        
        // Also listen for touch events on mobile
        document.addEventListener('touchend', (event) => {
            if (this.animationState === 'visible') {
                this.show('hide');
                
                this.e.scene.action = "choose";
            }
        });
    }
    

    

    

    

    

    

    

    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Only render when the container is visible (opacity > 0)
        if (this.container && this.container.style.opacity !== '0') {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    runRevealAnimation() {
        if (!this.lidObject) return;
        
        // Ensure lid starts closed
        this.lidObject.rotation.x = 0;
        
        // Reset text scale to normal size
        gsap.set(this.eliminatedText, { scale: 1.0 });
        
        // Clear any existing animations
        gsap.killTweensOf([this.container, this.eliminatedText, this.continueText]);
        

        
        // ===== REVEAL ANIMATION TIMELINE =====
        const tl = gsap.timeline({
            onComplete: () => {
                this.animationState = 'visible';
                this.animationComplete = true;
                // CSS animation starts automatically when element becomes visible
            }
        });
        
        // PHASE 1: Container fade in + Camera zoom + tempBlocker fade (0.0s - 0.15s)
        tl.to(this.container, {
            opacity: 1,
            duration: 0.15,
            ease: "power2.out"
        });
        
        // Fade tempBlocker to 95% opacity and enable pointer events
        tl.to('#tempBlocker', {
            opacity: 0.95,
            duration: 0.15,
            ease: "power2.out",
            onUpdate: function() {
                const tempBlocker = document.getElementById('tempBlocker');
                if (tempBlocker) {
                    tempBlocker.style.pointerEvents = 'auto';
                }
            }
        }, 0);
        
        // Camera zoom: start far, move closer
        tl.to(this.camera.position, {
            z: 3.1, // Move closer (adjusted for new starting position)
            duration: 0.45,
            ease: "power2.out"
        }, 0); // Start immediately

        // PHASE 2: Lid opening + ELIMINATED text entrance (0.075s - 0.45s)
        tl.to(this.lidObject.rotation, {
            x: Math.PI / 2, // 90 degrees
            duration: 0.375,
            ease: "power2.out",
            onComplete: () => {
                // Trigger particle effects when lid opens
                
                // Play case opening sound based on value
                
            }
        }, 0.075); // Start at 0.075s

        this.createParticleEffects();
        
        // ELIMINATED text: dramatic entrance with scale effect
        tl.to(this.eliminatedText, {
            opacity: 1,
            translateY: 0,
            scale: 1.8, // Scale from small to large size
            duration: 0.375,
            ease: "power2.out"
        }, 0.075); // Start at 0.075s
        
        // PHASE 3: Bottom text slides down (0.3s - 0.6s)
        tl.to(this.continueText, {
            opacity: 1,
            translateY: 0,
            duration: 0.3,
            ease: "power2.out"
        }, 0.075); // Start at 0.075s
        
        // Store timeline reference for potential interruption
        this.currentTimeline = tl;
    }
    
    runHideAnimation() {
        // Clear any existing animations
        gsap.killTweensOf([this.container, this.eliminatedText, this.continueText]);
        
        // ===== HIDE ANIMATION TIMELINE =====
        const tl = gsap.timeline({
            onComplete: () => {
                this.animationState = 'hidden';
                // Reset lid to closed position
                if (this.lidObject) {
                    this.lidObject.rotation.x = 0;
                }
                // Reset camera to original position
                this.camera.position.z = 3.8;
                // CSS animation stops automatically when element is hidden
                document.getElementById('tempBlocker').style.pointerEvents = 'none';
            }
        });
        
        // PHASE 1: Fade out container, text elements, and tempBlocker (0.0s - 0.3s)
        tl.to([this.container, this.eliminatedText, this.continueText], {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in"
        });
        
        // Fade out tempBlocker completely and disable pointer events
        tl.to('#tempBlocker', {
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onUpdate: function() {
                const tempBlocker = document.getElementById('tempBlocker');
                if (tempBlocker) {
                    // tempBlocker.style.pointerEvents = 'none';
                }
            }
        }, 0);
        
        // PHASE 2: Move text elements while fading out
        tl.to(this.eliminatedText, {
            translateY: 80, // Move down
            duration: 0.3,
            ease: "power2.in"
        }, 0); // Start immediately
        
        tl.to(this.continueText, {
            translateY: -20, // Move up
            duration: 0.3,
            ease: "power2.in"
        }, 0); // Start immediately
        
        // Store timeline reference
        this.currentTimeline = tl;
    }
    
    // Set up continuous color animation for ELIMINATED text
    setupContinuousAnimations() {
        // Add CSS keyframe animation directly to the element
        this.eliminatedText.style.animation = 'colorPulse 1.5s ease-in-out infinite';
        
        // Create the keyframes dynamically
        const style = document.createElement('style');
        style.textContent = `
            @keyframes colorPulse {
                0% {
                    color: #FFFFFF;
                    text-shadow: 0 0 4px #FFFFFF;
                }
                50% {
                    color: #FFD700;
                    text-shadow: 0 0 4px #FFD700;
                }
                100% {
                    color: #FFFFFF;
                    text-shadow: 0 0 4px #FFFFFF;
                }
            }
        `;
        document.head.appendChild(style);
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
            //console.log('Lid reset to original position');
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
    
    // Create material control sliders for metalness and roughness
    createMaterialControls() {
        // Create control panel container
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            color: white;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            z-index: 1000002;
            pointer-events: auto;
            min-width: 200px;
            display: none;
        `;
        
        // Metalness slider
        const metalnessContainer = document.createElement('div');
        metalnessContainer.style.marginBottom = '15px';
        
        const metalnessLabel = document.createElement('label');
        metalnessLabel.textContent = 'Metalness: ';
        metalnessLabel.style.display = 'block';
        metalnessLabel.style.marginBottom = '5px';
        
        const metalnessSlider = document.createElement('input');
        metalnessSlider.type = 'range';
        metalnessSlider.min = '0';
        metalnessSlider.max = '1';
        metalnessSlider.step = '0.01';
        metalnessSlider.value = '0.5';
        metalnessSlider.style.width = '100%';
        
        const metalnessValue = document.createElement('span');
        metalnessValue.textContent = '0.5';
        metalnessValue.style.marginLeft = '10px';
        
        metalnessSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            metalnessValue.textContent = value.toFixed(2);
            this.updateMaterialProperties('metalness', value);
        });
        
        metalnessContainer.appendChild(metalnessLabel);
        metalnessContainer.appendChild(metalnessSlider);
        metalnessContainer.appendChild(metalnessValue);
        
        // Roughness slider
        const roughnessContainer = document.createElement('div');
        
        const roughnessLabel = document.createElement('label');
        roughnessLabel.textContent = 'Roughness: ';
        roughnessLabel.style.display = 'block';
        roughnessLabel.style.marginBottom = '5px';
        
        const roughnessSlider = document.createElement('input');
        roughnessSlider.type = 'range';
        roughnessSlider.min = '0';
        roughnessSlider.max = '1';
        roughnessSlider.step = '0.01';
        roughnessSlider.value = '0.5';
        roughnessSlider.style.width = '100%';
        
        const roughnessValue = document.createElement('span');
        roughnessValue.textContent = '0.5';
        roughnessValue.style.marginLeft = '10px';
        
        roughnessSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            roughnessValue.textContent = value.toFixed(2);
            this.updateMaterialProperties('roughness', value);
        });
        
        roughnessContainer.appendChild(roughnessLabel);
        roughnessContainer.appendChild(roughnessSlider);
        roughnessContainer.appendChild(roughnessValue);
        
        // Environment Map Intensity slider
        const envMapContainer = document.createElement('div');
        
        const envMapLabel = document.createElement('label');
        envMapLabel.textContent = 'Reflection Intensity: ';
        envMapLabel.style.display = 'block';
        envMapLabel.style.marginBottom = '5px';
        
        const envMapSlider = document.createElement('input');
        envMapSlider.type = 'range';
        envMapSlider.min = '0';
        envMapSlider.max = '2';
        envMapSlider.step = '0.1';
        envMapSlider.value = '1.0';
        envMapSlider.style.width = '100%';
        
        const envMapValue = document.createElement('span');
        envMapValue.textContent = '1.0';
        envMapValue.style.marginLeft = '10px';
        
        envMapSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            envMapValue.textContent = value.toFixed(1);
            this.updateEnvironmentMapIntensity(value);
        });
        
        envMapContainer.appendChild(envMapLabel);
        envMapContainer.appendChild(envMapSlider);
        envMapContainer.appendChild(envMapValue);
        
        // Add to control panel
        controlPanel.appendChild(metalnessContainer);
        controlPanel.appendChild(roughnessContainer);
        controlPanel.appendChild(envMapContainer);
        
        // Add control panel to canvas container
        this.canvasContainer.appendChild(controlPanel);
    }
    
    // Create particle effects container for 2D effects
    createParticleContainer() {
        this.particleContainer = document.createElement('div');
        this.particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000001;
            overflow: hidden;
        `;
        
        this.canvasContainer.appendChild(this.particleContainer);
    }
    
    // Load cube texture for environment mapping
    loadCubeTexture() {
        const loader = new THREE.CubeTextureLoader();
        loader.name = "skyboxLoaderName";
        
        this.reflectionTexture = loader.load([
            './src/images/ref/pos-x.png',
            './src/images/ref/neg-x.png',
            './src/images/ref/pos-y.png',
            './src/images/neg-y.png',
            './src/images/ref/pos-z.png',
            './src/images/ref/neg-z.png',
        ], () => {
            //console.log('Cube texture loaded successfully');
            this.applyEnvironmentMap();
        }, undefined, (error) => {
            //console.error('Error loading cube texture:', error);
        });
    }
    
    // Pre-load all price textures
    preloadPriceTextures() {

        console.log("Pre-loading price textures");

        this.priceTextures = {};
        const textureLoader = new THREE.TextureLoader();
        
        // Dynamically discover price textures by trying common patterns
        this.discoverPriceTextures(textureLoader);
    }
    
    // Discover and load all available price textures
    discoverPriceTextures(textureLoader) {

        console.log("Discovering price textures");
        // Common price patterns to try
        const pricePatterns = [
            // Small increments
            1,5,10,25,50, 100, 500,
            // Larger increments
            1000, 2500, 5000, 7500, 10000, 20000, 25000,
            // High value increments
             50000, 75000, 100000, 300000, 500000, 750000, 1000000
        ];
        
        let loadedCount = 0;
        let totalAttempts = pricePatterns.length;
        
        pricePatterns.forEach(price => {
            const texturePath = `./src/images/p${price}.png`;
            
            textureLoader.load(texturePath, (texture) => {
                this.priceTextures[price] = texture;
                loadedCount++;
                //console.log(`✅ Price texture loaded: p${price}.png`);
                
                if (loadedCount === Object.keys(this.priceTextures).length) {
                    //console.log(`🎯 Total price textures loaded: ${loadedCount}`);
                    
                    // Check if we have a queued texture to assign now that textures are loaded
                    if (this.queuedTextureValue !== null && this.pricesignMaterial) {
                        //console.log("🔄 Processing queued texture assignment after texture load for value:", this.queuedTextureValue);
                        this.assignPriceTexture(this.queuedTextureValue);
                    }
                }
            }, undefined, (error) => {
                // Silently skip missing textures - this is expected
                totalAttempts--;
                if (totalAttempts === 0) {
                    //console.log(`🎯 Price texture discovery complete. Loaded: ${Object.keys(this.priceTextures).length} textures`);
                }
            });
        });
    }
    
    // Apply environment map to all suitcase materials
    applyEnvironmentMap() {
        if (!this.suitcaseModel || !this.reflectionTexture) return;
        
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    // Handle multiple materials
                    child.material.forEach(material => {
                        if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                            material.envMap = this.reflectionTexture;
                            material.envMapIntensity = 1.0;
                            material.needsUpdate = true;
                        }
                    });
                } else {
                    // Handle single material
                    if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material.envMap = this.reflectionTexture;
                        child.material.envMapIntensity = 1.0;
                        child.material.needsUpdate = true;
                    }
                }
            } else if (child.isGroup || child.isObject3D) {
                // Handle container objects (like the lid container)
                child.traverse((subChild) => {
                    if (subChild.isMesh && subChild.material) {
                        if (Array.isArray(subChild.material)) {
                            // Handle multiple materials
                            subChild.material.forEach(material => {
                                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                                    material.envMap = this.reflectionTexture;
                                    material.envMapIntensity = 1.0;
                                    material.needsUpdate = true;
                                }
                            });
                        } else {
                            // Handle single material
                            if (subChild.material.isMeshStandardMaterial || subChild.material.isMeshPhysicalMaterial) {
                                subChild.material.envMap = this.reflectionTexture;
                                subChild.material.envMapIntensity = 1.0;
                                subChild.material.needsUpdate = true;
                            }
                        }
                    }
                });
            }
        });
        
        //console.log('Environment map applied to suitcase materials');
    }
    
    // Update environment map intensity for all suitcase materials
    updateEnvironmentMapIntensity(intensity) {
        if (!this.suitcaseModel) return;
        
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    // Handle multiple materials
                    child.material.forEach(material => {
                        if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                            material.envMapIntensity = intensity;
                            material.needsUpdate = true;
                        }
                    });
                } else {
                    // Handle single material
                    if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material.envMapIntensity = intensity;
                        child.material.needsUpdate = true;
                    }
                }
            } else if (child.isGroup || child.isObject3D) {
                // Handle container objects (like the lid container)
                child.traverse((subChild) => {
                    if (subChild.isMesh && subChild.material) {
                        if (Array.isArray(subChild.material)) {
                            // Handle multiple materials
                            subChild.material.forEach(material => {
                                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                                    material.envMapIntensity = intensity;
                                    material.needsUpdate = true;
                                }
                            });
                        } else {
                            // Handle single material
                            if (subChild.material.isMeshStandardMaterial || subChild.material.isMeshPhysicalMaterial) {
                                subChild.material.envMapIntensity = intensity;
                                subChild.material.needsUpdate = true;
                            }
                        }
                    }
                });
            }
        });
    }
    
    // Update material properties for all suitcase materials
    updateMaterialProperties(property, value) {
        if (!this.suitcaseModel) return;
        
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    // Handle multiple materials
                    child.material.forEach(material => {
                        if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                            material[property] = value;
                            material.needsUpdate = true;
                        }
                    });
                } else {
                    // Handle single material
                    if (child.material.isMeshStandardMaterial || child.material.isMeshPhysicalMaterial) {
                        child.material[property] = value;
                        child.material.needsUpdate = true;
                    }
                }
            } else if (child.isGroup || child.isObject3D) {
                // Handle container objects (like the lid container)
                child.traverse((subChild) => {
                    if (subChild.isMesh && subChild.material) {
                        if (Array.isArray(subChild.material)) {
                            // Handle multiple materials
                            subChild.material.forEach(material => {
                                if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                                    material[property] = value;
                                    material.needsUpdate = true;
                                }
                            });
                        } else {
                            // Handle single material
                            if (subChild.material.isMeshStandardMaterial || subChild.material.isMeshPhysicalMaterial) {
                                child.material[property] = value;
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                });
            }
        });
    }
    
    // Create magical particle effects when case opens
    createParticleEffects() {
        // Clear any existing particles
        this.particleContainer.innerHTML = '';
        
        // Create sparkles
        this.createSparkles();
        
        // Create confetti
        // this.createConfetti();
        
        // Create magical swirls
        // this.createMagicalSwirls();
        
        // Create floating orbs
        // this.createFloatingOrbs();
    }
    
    // Create sparkle particles
    createSparkles() {
        for (let i = 0; i < 30; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #FFD700;
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 8px #ffffff, 0 0 16px #ffffff;
            `;
            
            // Random starting position around the center
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const startX = 175 + Math.cos(angle) * distance;
            const startY = 175 + Math.sin(angle) * distance;
            
            sparkle.style.left = startX + 'px';
            sparkle.style.top = startY + 'px';
            
            this.particleContainer.appendChild(sparkle);
            
            // Animate sparkle
            gsap.fromTo(sparkle, 
                { 
                    scale: 0, 
                    opacity: 1,
                    rotation: 0
                },
                {
                    scale: 1.5,
                    opacity: 0,
                    rotation: 360,
                    duration: 1.5 + Math.random() * 1,
                    ease: "power2.out",
                    onComplete: () => sparkle.remove()
                }
            );
            
            // Random movement
            gsap.to(sparkle, {
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                duration: 1.5 + Math.random() * 1,
                ease: "power2.out"
            });
        }
    }
    
    // Create confetti particles
    createConfetti() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                transform-origin: center;
            `;
            
            // Random starting position
            const startX = 150 + Math.random() * 50;
            const startY = 150 + Math.random() * 50;
            
            confetti.style.left = startX + 'px';
            confetti.style.top = startY + 'px';
            
            this.particleContainer.appendChild(confetti);
            
            // Animate confetti
            gsap.fromTo(confetti, 
                { 
                    scale: 0, 
                    opacity: 1,
                    rotation: 0
                },
                {
                    scale: 1,
                    opacity: 0,
                    rotation: 720 + Math.random() * 360,
                    duration: 2 + Math.random() * 1,
                    ease: "power2.out",
                    onComplete: () => confetti.remove()
                }
            );
            
            // Random movement with gravity effect
            gsap.to(confetti, {
                x: (Math.random() - 0.5) * 300,
                y: 200 + Math.random() * 100,
                duration: 2 + Math.random() * 1,
                ease: "power2.in"
            });
        }
    }
    
    // Create magical swirl particles
    createMagicalSwirls() {
        for (let i = 0; i < 20; i++) {
            const swirl = document.createElement('div');
            swirl.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: linear-gradient(45deg, #FFD700, #FFA500, #FF69B4);
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 12px #FFD700;
            `;
            
            // Spiral starting position
            const angle = (i / 20) * Math.PI * 4;
            const radius = 30 + (i % 3) * 20;
            const startX = 175 + Math.cos(angle) * radius;
            const startY = 175 + Math.sin(angle) * radius;
            
            swirl.style.left = startX + 'px';
            swirl.style.top = startY + 'px';
            
            this.particleContainer.appendChild(swirl);
            
            // Animate swirl
            gsap.fromTo(swirl, 
                { 
                    scale: 0, 
                    opacity: 1,
                    rotation: 0
                },
                {
                    scale: 1.2,
                    opacity: 0,
                    rotation: 360,
                    duration: 1.8 + Math.random() * 0.5,
                    ease: "power2.out",
                    onComplete: () => swirl.remove()
                }
            );
            
            // Spiral outward movement
            gsap.to(swirl, {
                x: Math.cos(angle) * 150,
                y: Math.sin(angle) * 150,
                duration: 1.8 + Math.random() * 0.5,
                ease: "power2.out"
            });
        }
    }
    
    // Create floating orb particles
    createFloatingOrbs() {
        for (let i = 0; i < 15; i++) {
            const orb = document.createElement('div');
            orb.style.cssText = `
                position: absolute;
                width: 12px;
                height: 12px;
                background: radial-gradient(circle, #FFD700, #FFA500);
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 20px #FFD700, inset 0 0 10px #FFA500;
            `;
            
            // Random starting position
            const startX = 160 + Math.random() * 30;
            const startY = 160 + Math.random() * 30;
            
            orb.style.left = startX + 'px';
            orb.style.top = startY + 'px';
            
            this.particleContainer.appendChild(orb);
            
            // Animate orb
            gsap.fromTo(orb, 
                { 
                    scale: 0, 
                    opacity: 1
                },
                {
                    scale: 1.5,
                    opacity: 0,
                    duration: 2.5 + Math.random() * 1,
                    ease: "power2.out",
                    onComplete: () => orb.remove()
                }
            );
            
            // Floating movement
            gsap.to(orb, {
                y: -100 - Math.random() * 100,
                x: (Math.random() - 0.5) * 100,
                duration: 2.5 + Math.random() * 1,
                ease: "power2.in"
            });
        }
    }
    
    // Assign random price texture to the pricesign mesh
    assignRandomPriceTexture() {
        if (!this.suitcaseModel || !this.priceTextures) return;
        
        // Find the pricesign mesh in the model
        let pricesignMesh = null;
        this.suitcaseModel.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes('pricesign')) {
                pricesignMesh = child;
            }
        });
        
        if (pricesignMesh && pricesignMesh.material) {
            // Get random price from available textures
            const availablePrices = Object.keys(this.priceTextures);
            if (availablePrices.length > 0) {
                const randomPrice = availablePrices[Math.floor(Math.random() * availablePrices.length)];
                const selectedTexture = this.priceTextures[randomPrice];
                
                // Apply texture to the material
                if (Array.isArray(pricesignMesh.material)) {
                    // Handle multiple materials
                    pricesignMesh.material.forEach(material => {
                        if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                            material.map = selectedTexture;
                            material.needsUpdate = true;
                        }
                    });
                } else {
                    // Handle single material
                    if (pricesignMesh.material.isMeshStandardMaterial || pricesignMesh.material.isMeshPhysicalMaterial) {
                        pricesignMesh.material.map = selectedTexture;
                        pricesignMesh.material.needsUpdate = true;
                    }
                }
                
                //console.log(`Assigned price texture: p${randomPrice}.png to pricesign`);
            }
        } else {
            //console.log('Pricesign mesh not found in suitcase model');
        }
    }
    
        // Assign specific price texture to the pricesign material based on value parameter
    assignPriceTexture(value) {
        console.log("🎯 assignPriceTexture called with value:", value);

        // Add to queue if we're already processing a texture
        if (this.isProcessingTexture) {
            console.log("⏳ Texture processing in progress, queuing value:", value);
            this.queuedTextureValue = value;
            return;
        }

        // Queue the texture assignment if we're not ready yet
        if (!this.priceTextures || !this.pricesignMaterial) {
            console.log("⏳ Queuing texture assignment - not ready yet");
            this.queuedTextureValue = value;
            return;
        }

        // Process the texture assignment
        this.processTextureAssignment(value);
    }

    // Process texture assignment with proper state management
    processTextureAssignment(value) {
        // console.log("🔄 Processing texture assignment for value:", value);
        this.isProcessingTexture = true;
        //console.log("🔄 Processing texture assignment for value:", value);

        // Check if we have the texture for this specific value
        if (this.priceTextures[value]) {
            const selectedTexture = this.priceTextures[value];
            
            // Ensure the texture is fully loaded
            if (!selectedTexture.image || !selectedTexture.image.complete) {
                //console.log("⏳ Texture not fully loaded yet, queuing assignment");
                this.queuedTextureValue = value;
                this.isProcessingTexture = false;
                return;
            }
            
            // Flip the texture on Y axis to fix upside-down numbers
            selectedTexture.flipY = false;
            
            // Apply texture directly to the material
            this.pricesignMaterial.map = selectedTexture;
            this.pricesignMaterial.needsUpdate = true;
            
            // console.log(`✅ Successfully assigned price texture: p${value}.png to pricesign material (flipped Y)`);
        } else {
            // console.log(`❌ Price texture not found for value: ${value}`);
        }

        // Mark as complete and process any queued texture
        this.isProcessingTexture = false;
        
        // if (this.queuedTextureValue !== null) {
        //     const nextValue = this.queuedTextureValue;
        //     this.queuedTextureValue = null;
        //     //console.log("🔄 Processing queued texture:", nextValue);
        //     // Use setTimeout to prevent stack overflow
        //     setTimeout(() => this.processTextureAssignment(nextValue), 10);
        // }
    }
    

    
    // Play game end sound based on final amount
    playGameEndSound(finalAmount) {
        if (!this.e || !this.e.s) return;
        
        if (finalAmount < 100000) {
            this.e.s.p("lose");
        } else {
            this.e.s.p("wincase");
        }
        
        //console.log(`🎵 Played game end sound for amount: ${finalAmount}`);
    }
    
    // Play clue sound
    playClueSound() {
        if (!this.e || !this.e.s) return;
        
        this.e.s.p("clue");
        //console.log("🎵 Played clue sound");
    }
    
    // Play action button sounds
    playActionButtonSound(buttonNumber, hasOpenedMoreThan7Cases = false) {
        if (!this.e || !this.e.s) return;
        
        switch (buttonNumber) {
            case 1:
                if (hasOpenedMoreThan7Cases) {
                    this.e.s.p("bingnice");
                }
                break;
            case 2:
                this.e.s.p("bingnice");
                break;
            case 3:
                this.e.s.p("bingnice");
                break;
        }
        
        //console.log(`🎵 Played action button ${buttonNumber} sound`);
    }
}