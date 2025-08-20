import * as THREE from 'three';
import * as CANNON from "cannon-es";
import cannonDebugger from "cannon-es-debugger";
import gsap from "gsap";
import CryptoJS from 'crypto-js';

export class Scene {

    // This is MESSAGE_FACTORY (I am obfuscating the name)
    _0x8db29a(name, data) {
        return JSON.stringify({
        type: name,
        data: data,
        });
    }

    setUp(e) {
        this.e = e;

        console.log("startme")
  
        /**
        * Obfuscate a plaintext string with a simple rotation algorithm similar to
        * the rot13 cipher.
        * @param  {[type]} key rotation index between 0 and n
        * @param  {Number} n   maximum char that will be affected by the algorithm
        * @return {[type]}     obfuscated string
        */
        String.prototype._0x083c9db = function(key, n = 126) {
        // return String itself if the given parameters are invalid
        if (!(typeof(key) === 'number' && key % 1 === 0)
            || !(typeof(key) === 'number' && key % 1 === 0)) {
            return this.toString();
        }

        var chars = this.toString().split('');

        for (var i = 0; i < chars.length; i++) {
            var c = chars[i].charCodeAt(0);

            if (c <= n) {
            chars[i] = String.fromCharCode((chars[i].charCodeAt(0) + key) % n);
            }
        }

        return chars.join('');
        };

        /**
        * De-obfuscate an obfuscated string with the method above.
        * @param  {[type]} key rotation index between 0 and n
        * @param  {Number} n   same number that was used for obfuscation
        * @return {[type]}     plaintext string
        */
        String.prototype._0xd7a82c = function(key, n = 126) {
        // return String itself if the given parameters are invalid
        if (!(typeof(key) === 'number' && key % 1 === 0)
            || !(typeof(key) === 'number' && key % 1 === 0)) {
            return this.toString();
        }

        return this.toString()._0x083c9db(n - key);
        };

    }

    buildScene() {
        this.mainCont = new THREE.Group();
        this.e.scene3D.add(this.mainCont);
        
        // Set default difficulty
        this.difficulty = 'hard'; // Default to hard (60 pairs)

        this.dl_shad = new THREE.DirectionalLight(0xffffff, 2);
        this.dl_shad.position.x = 12 * 3;
        this.dl_shad.position.z = -26 * 3;
        this.dl_shad.position.y = 26 * 3;
        this.mainCont.add(this.dl_shad);

        this.dl_shad.castShadow = true;

        this.dl_shad.shadow.mapSize.width = 4096;
        this.dl_shad.shadow.mapSize.height = 4096;

        this.e.sSize = 11;
        this.dl_shad.shadow.camera.near = 0.1;
        this.dl_shad.shadow.camera.far = 180;
        this.dl_shad.shadow.camera.left = -this.e.sSize;
        this.dl_shad.shadow.camera.right = this.e.sSize;
        this.dl_shad.shadow.camera.top = this.e.sSize;
        this.dl_shad.shadow.camera.bottom = -this.e.sSize;
        this.dl_shad.shadow.radius = 2;

        this.ambLight = new THREE.AmbientLight(0xffffff, 1.75);
        this.mainCont.add(this.ambLight);

        // ----------------------------------------------------------------------

        // world

        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);

        this.cannonDebug = cannonDebugger(this.e.scene3D, this.world, {
            color: 0xff0000,
        });

        // floor

        const floorMaterial = new CANNON.Material("backboardMaterial");
        floorMaterial.restitution = 0.8;
        floorMaterial.friction = 0;

        this.floorShape = new CANNON.Plane();
        this.floorBody = new CANNON.Body({ mass: 0,shape: this.floorShape,material: floorMaterial,});
        this.floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(this.floorBody);

        // roof

        this.roofShape = new CANNON.Box(new CANNON.Vec3(5 / 2, 0.1, 10 / 2));
        this.roofBody = new CANNON.Body({ mass: 0,position: new CANNON.Vec3(0, 20, 0)});
        this.roofBody.addShape(this.roofShape);
        this.world.addBody(this.roofBody);

        this.geometry = new THREE.PlaneGeometry(8, 16);
        this.material = new THREE.MeshStandardMaterial({ color: 0x333333, map: this.e.background });
        this.floorPlane = new THREE.Mesh(this.geometry, this.material);
        this.mainCont.add(this.floorPlane);
        this.floorPlane.rotation.x = this.e.u.ca(-90);

        this.floorPlane.receiveShadow=true;

        // walls

        this.boxShape = new CANNON.Box(new CANNON.Vec3(.1, 15, 5));
        this.boxBody = new CANNON.Body({
            mass: 0,
            shape: this.boxShape,
            position: new CANNON.Vec3(2.5, 0, 0)
        });
        // this.world.addBody(this.boxBody);
        this.boxBody.bType = "wall";

        this.boxShape = new CANNON.Box(new CANNON.Vec3(.1, 15, 5));
        this.boxBody = new CANNON.Body({
            mass: 0,
            shape: this.boxShape,
            position: new CANNON.Vec3(-2.5, 0, 0)
        });
        // this.world.addBody(this.boxBody);
        this.boxBody.bType = "wall";

        this.boxShape = new CANNON.Box(new CANNON.Vec3(2.5, 15, .1));
        this.boxBody = new CANNON.Body({
            mass: 0,
            shape: this.boxShape,
            position: new CANNON.Vec3(0, 0, 5)
        });
        // this.world.addBody(this.boxBody);
        this.boxBody.bType = "wall";

        this.boxShape = new CANNON.Box(new CANNON.Vec3(2.5, 15, .1));
        this.boxBody = new CANNON.Body({
            mass: 0,
            shape: this.boxShape,
            position: new CANNON.Vec3(0, 0, -5)
        });

        // this.world.addBody(this.boxBody);
        this.boxBody.bType = "wall";

        // bottom parts

        // this.geometry = new THREE.BoxGeometry(1.2, .1, 1.2);
        // this.material = new THREE.MeshStandardMaterial({ color: 0x666666 });

        // this.matcher1 = new THREE.Mesh(this.geometry, this.material);

        this.matcher1 = this.e.ped.clone();
        this.matcher1.position.x = -.65;
        this.matcher1.position.y = -.1;
        this.matcher1.position.z = 4.25;
        this.mainCont.add(this.matcher1);
        this.matcher1.receiveShadow=true;
        this.matcher1.scale.x = this.matcher1.scale.z = .6;

        this.matcher1.traverse((object) => {

            if ( object.isMesh ){
                this.matcherMat1 = new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.e.ped1 });
                object.material = this.matcherMat1;
            }

        });

        this.matcher2 = this.e.ped.clone();
        this.matcher2.position.x = .65;
        this.matcher2.position.y = -.1;
        this.matcher2.position.z = 4.25;
        this.mainCont.add(this.matcher2);
        this.matcher2.receiveShadow=true;
        this.matcher2.scale.x = this.matcher2.scale.z = .6;
        
        this.matcher2.traverse((object) => {

            if ( object.isMesh ){
                this.matcherMat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.e.ped2 });
                object.material = this.matcherMat2;
            }

        });


        // objects

        this.matchObs = [];
        this.lockHeight = .2;

        this.addItemWithCollider = (item3D, position = new THREE.Vector3(0, 1, 0)) => {
            const itemGroup = item3D.clone(true);
            // Ensure the name is preserved from the original item
            itemGroup.name = item3D.name;
            this.is = 5;
            itemGroup.scale.set(this.is, this.is, this.is);
            this.mainCont.add(itemGroup);
            itemGroup.position.copy(position);
        
            const bbox = new THREE.Box3().setFromObject(itemGroup);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            bbox.getSize(size);
            bbox.getCenter(center);

            const helperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            const helperMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            const helper = new THREE.Mesh(helperGeometry, helperMaterial);
            helper.name = "boxHelper";
            // this.mainCont.add(helper);
            itemGroup.boxHelper = helper;


            // const helperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            // const helperMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            // const helper = new THREE.Mesh(helperGeometry, helperMaterial);
            // helper.position.copy(center);
            // helper.name = "boxHelper";
            // this.mainCont.add(helper);

        
            const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
            const boxShape = new CANNON.Box(halfExtents);
        
            const body = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(position.x, position.y, position.z),
                shape: boxShape
            });
        
            body.linearDamping = 0.5;
            body.angularDamping = 0.9;
            
            // Initialize with zero velocity
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
        
            this.world.addBody(body);
            itemGroup.cannonBody = body;
        
            // 👉 ADD VISIBLE THREE.JS BOX COLLIDER (helper)
            // const helperGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
            // const helperMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            // const helper = new THREE.Mesh(helperGeometry, helperMaterial);
            // helper.position.copy(center);
            // helper.name = "boxHelper";
            // this.mainCont.add(helper);
        
            return itemGroup;
        };
                
        // Items will be loaded after camera positioning is complete
        
        // vars

        this.dragging = false;
        this.selectedObject = null;
        this.mouseOffset = new THREE.Vector3(0, 0, 0);
        this.dragPlane = new THREE.Plane(); // Plane for dragging
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.startVars();

        // this.score=0;
        // this.matches=0;
        // this.time=120;
        this.time=120;
        
        this.partTime=0;

        this.lockHeight =.2;

        this.bonusPerc=0;
        this.streak=1;
        this.longestStreak=1;

        this.matchLock1 = undefined;
        this.matchLock2 = undefined;

        this.tutorialFirstMatchMade = false;

        this.action = "zoom fixer"

        this.showFirstTarget=true; 
        this.showFirstTargetTime=15; 

        // listeners

        window.addEventListener('keydown', (event) => {
            if (event.key === 'f' || event.key === 'F') {
                this.applyRandomPhysics();
            }
        });

        // window.addEventListener('click', (event) => {
        //     if(this.action==="start"){
        //         this.action="start game"
        //     }
        // });

        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));

        window.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        window.addEventListener('touchend', this.onTouchEnd.bind(this));

        this.upperLeftDiv = document.getElementById("upperLeftDiv");
        this.upperRightDiv = document.getElementById("upperRightDiv");

        // Add difficulty button listeners
        this.setupDifficultyButtons();
        
        // Add tutorial continue button listeners
        this.setupTutorialButtons();

        this.scoreBase=0;
        this.scoreTargetBonus=0;
        this.scoreBonus=0;

        this.regularMatches=0;
        this.targetMatches=0;
        
        // Initialize fader to be fully opaque during camera setup
        const fader = document.getElementById("fader");
        if (fader) {
            // fader.style.opacity = "1";
        }
        
        // Setup target object display system
        this.setupTargetDisplay();
        
        // Setup progress bar auto-trigger
        // Progress bar auto-trigger removed - now handled by endScore.js
        
    }

    setupDifficultyButtons() {

        const tutorialBtn = document.getElementById("tutorialBut");
        const playBtn = document.getElementById("playButton");

        if (tutorialBtn) {
            
            tutorialBtn.addEventListener('click', () => {
                this.setDifficulty('tutorial');

                if (this.difficulty === 'tutorial') {
                    this.action = "tutorial_start";
                }else{
                    this.action="start game";
                }
                
            });
            tutorialBtn.addEventListener('touchstart', (e) => {

                e.preventDefault();

                this.setDifficulty('tutorial');
                if (this.difficulty === 'tutorial') {
                    this.action = "tutorial_start";
                }else{
                    this.action="start game";
                }

            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.setDifficulty('hard');
                this.action="start game";
            });
            playBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setDifficulty('hard');
                this.action="start game";
            });
        }
    }

    setDifficulty(difficulty) {
       
        if (this.action !== "start") return;
        
        this.difficulty = difficulty;

        if (this.difficulty !== "hard") {
            this.unloadItems();
            this.loadItems();
        }

    }

    unloadItems() {
        
        if (this.matchObs) {
            this.matchObs.forEach(matchOb => {
                if (matchOb.threeCube) {
                    this.mainCont.remove(matchOb.threeCube);
                    if (matchOb.boxBody) {
                        this.world.removeBody(matchOb.boxBody);
                    }
                }
            });
            this.matchObs = [];
        }
    }

    loadItems() {
        
        let numberOfPairs;
        switch (this.difficulty) {
            case 'tutorial':
                numberOfPairs = 5;
                break;
            case 'easy':
                numberOfPairs = 30;
                break;
            case 'hard':
                numberOfPairs = 52;
                break;
            default:
                numberOfPairs = 52;
        }

        this.numberOfPairs = numberOfPairs;
        console.log(`Loading ${numberOfPairs} pairs for ${this.difficulty} difficulty`);

        // Clone and shuffle the items array
        const shuffledItems = [...this.e.itemObjects];
        this.shuffleArray(shuffledItems);

        // Pick unique items up to numberOfPairs
        const selectedItems = shuffledItems.slice(0, this.numberOfPairs);

        // Track which objects are actually used in this game
        this.gameObjects = selectedItems;

        // Calculate viewport limits for spawning (camera is now ready)
        const viewportLimits = this.calculateViewportLimits();
        
        console.log("Viewport limits for spawning:", viewportLimits);

        for (let i = 0; i < selectedItems.length; i++) {
            for (let j = 0; j < 2; j++) {
                const matchOb = {};
                // Use a smaller spawn area in the middle of the viewport
                const spawnWidth = (viewportLimits.right - viewportLimits.left) * 0.6; // Use 60% of the available width
                const spawnCenter = (viewportLimits.right + viewportLimits.left) / 2;
                
                // Validate spawn parameters
                let x;
                if (isNaN(spawnWidth) || isNaN(spawnCenter) || spawnWidth <= 0) {
                    console.log("Invalid spawn parameters, using fallback");
                    x = Math.random() * 4 - 2; // Fallback to fixed range
                } else {
                    x = (Math.random() - 0.5) * spawnWidth + spawnCenter;
                }
                const y = Math.random() * 14 + 2; // Random Y height between 2 and 10
                // Use viewport-based Z limits for spawning
                const z = Math.random() * (viewportLimits.top - viewportLimits.bottom) + viewportLimits.bottom;
                const object = this.addItemWithCollider(selectedItems[i], new THREE.Vector3(x, y, z));
                matchOb.boxBody = object.cannonBody;
                matchOb.threeCube = object;
                matchOb.threeCube.cannonBody = matchOb.boxBody;
                matchOb.threeCube.parentOb = matchOb;
                matchOb.threeCube.castShadow = true;
                matchOb.threeCube.receiveShadow = true;
                matchOb.sn = i;
                matchOb.isLocked = 0;
                this.matchObs.push(matchOb);
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    applyRandomPhysics() {

        for (let i = 0; i < this.matchObs.length; i++) {
            this.matchOb = this.matchObs[i];

            const randomForce = new CANNON.Vec3(
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50
            );

            this.matchOb.boxBody.applyForce(randomForce, this.matchOb.boxBody.position);
        }

    }

    threeCopy(cannonShape, cannonBody, color = 0x333333) {

        const scale = cannonShape.halfExtents;
        const width = scale.x * 2;
        const height = scale.y * 2;
        const depth = scale.z * 2;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color: color });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.copy(cannonBody.position);

        this.mainCont.add(cube);

        return cube;

    }

    // applyPhysicsPush() {
    //     const thresholdZ = Math.min(this.matcher1.position.z, this.matcher2.position.z);
    
    //     this.matchObs.forEach(matchOb => {
            
    //         if (matchOb.boxBody.position.z > 3.5 && matchOb.isLocked===0) {
    //             const force = new CANNON.Vec3(0, 0, -50);
    //             matchOb.boxBody.applyForce(force, matchOb.boxBody.position);
    //             matchOb.boxBody.angularVelocity.set(0, 0, 0);
    //         }
    //     });
    // }

    update() {

        if(this.action==="zoom fixer"){

            this.gl = 5.3;

           // Identify four points near the edges of the play area
            const wallPoints = [
                new THREE.Vector3(-this.gl/2, 0, 0), // left
                new THREE.Vector3(this.gl/2, 0, 0),  // right
                new THREE.Vector3(0, 0, -this.gl),   // bottom
                new THREE.Vector3(0, 0, this.gl),    // top
            ];

            let allVisible = true;
            for (let i = 0; i < wallPoints.length; i++) {
                const worldPos = wallPoints[i].clone();
                const screenPos = this.e.u.vectorToScreenPos({ getWorldPosition: (target) => target.copy(worldPos) }, this.e.camera);
                
                if (
                    screenPos.x < 0 || screenPos.x > window.innerWidth ||
                    screenPos.y < 0 || screenPos.y > window.innerHeight
                ) {
                    allVisible = false;
                    break;
                }
            }

            if (!allVisible) {
                this.e.camera.position.z += 0.2;
            } else {
                // Camera positioning complete - now spawn objects with correct viewport bounds
                this.loadItems();
                
                // Fade in the UI
                // const fader = document.getElementById("fader");
                // if (fader) {
                    // fader.style.opacity = "1";
                    // gsap.to(fader, { opacity: 0, duration: 1, ease: "linear" });
                // }
                document.getElementById("loadingBack").style.opacity = "1";
                gsap.to(document.getElementById("loadingBack"), { opacity: 0, duration: 1, delay: 1, ease: "linear" });
                
                this.action = "start";
            }

            
        }else if(this.action==="start"){

            this.setupDifficultyButtons();

        }else if(this.action==="zoom fixer"){


        }else if(this.action==="start game"){

            this.e.s.p("start");

            this.levelStartTime = performance.now();

            if (typeof CryptoJS !== 'undefined') {
                console.log("crypto ok")
            }else{
                console.log("crypto not found")
            }
            
            document.getElementById("startMenu").style.display = "none"
            
            // Fade out the splash gradient overlay
            const gradientOverlay = document.getElementById("splashGradientOverlay");
            if (gradientOverlay) {
                gsap.to(gradientOverlay, { opacity: 0, duration: 0.5, ease: "power2.out" });
            }
            
            // Start countdown
            this.startCountdown();

        }else if(this.action==="countdown"){

            // Countdown is handled in the startCountdown method
            // This state prevents game interaction during countdown

        }else if(this.action==="tutorial_start"){

            this.e.s.p("start");

            this.levelStartTime = performance.now();

            console.log("tutorial start2")
            
            document.getElementById("startMenu").style.display = "none"
            
            // Fade out the splash gradient overlay
            const gradientOverlay = document.getElementById("splashGradientOverlay");
            if (gradientOverlay) {
                gsap.to(gradientOverlay, { opacity: 0, duration: 0.5, ease: "power2.out" });
            }
            
            // Show first tutorial instruction
            document.getElementById("tutorialDiv1").style.display = "block";
            
            // Pause the game - don't allow dragging
            this.action="tutorial_paused";

        }else if(this.action==="tutorial_paused"){

            // Game is paused, only update physics and rendering
            // No timer countdown, no dragging allowed

        }else if(this.action==="tutorial_playing"){

            // Tutorial is active but game is playing normally
            // Check for first match to show second instruction
            
            // Update timer and score like normal game
            this.partTime+=this.e.dt;
            if(this.partTime>15){

                this.breadCrumb()
                this.partTime=0;

                this.part+=1;

            }

            if(this.bonusPerc>0){

                this.streak2=this.streak;

                if(this.streak>5){
                    this.streak2=5;
                }

                this.bonusPerc-=(this.streak2*5)*this.e.dt;
            }
    
            if(this.bonusPerc<=0 && this.streak!==1){
                this.bonusPerc=0;
                this.streak=1;
                this.e.s.p("cancelDrum")
                this.showStreakBrokenAnimation();
            }
    
            document.getElementById("bonusText2").innerHTML="x"+this.streak;
            document.getElementById("innerBar").style.width=this.bonusPerc+"%";
    
            this.time-=this.e.dt;

            const currentSecond = Math.floor(this.time);

            if (currentSecond <= 20 && currentSecond > 0 && currentSecond !== this.lastTickSecond) {
                this.lastTickSecond = currentSecond;
                this.e.s.p("tick");
            }

            if(this.time<=0){

                if(this.selectedObject!==null){

                    this.selectedObject.cannonBody.wakeUp();
                    this.selectedObject.cannonBody.velocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.sleep();
                    this.selectedObject = null;
    
                }
                
                gsap.killTweensOf(document.getElementById("fader"));
                document.getElementById("fader").style.opacity = .7;
                gsap.to(document.getElementById("fader"), { opacity: 0, duration: 1, ease: "linear"});

                this.e.s.p("finish");

                document.getElementById("upperLeftDiv").style.opacity=0;
                document.getElementById("upperRightDiv").style.opacity=0;

                // Create final score overlay using endScore.js
                const statsArray = [
                    ["Regular Matches", this.regularMatches || 0],
                    ["Multiplier Bonus", this.scoreBonus || 0],
                    ["Megamatches", this.targetMatches || 0],
                    ["Megamatch Bonus", this.scoreTargetBonus || 0],
                    ["Time Left Bonus", this.timeLeftBonus || 0],
                    ["Longest Streak", this.longestStreak || 1]
                ];
                
                this.e.s.p("achievement1");
                this.e.endScore.createFinalScoreOverlay(this.score, statsArray);
                
                this.breadCrumb("validate");
                
                this.action="over"
            }

            this.upperLeftDiv.innerHTML = Math.round(this.score);
            this.upperRightDiv.innerHTML = this.formatTime(this.time);
            // Removed matches display

            //------------------------------------------------------------------------------------------------------
            //------------------------------------------------------------------------------------------------------
            //------------------------------------------------------------------------------------------------------
            //------------------------------------------------------------------------------------------------------
            //------------------------------------------------------------------------------------------------------

        }else if(this.action==="set target pause"){

            gsap.killTweensOf(document.getElementById("fader"));
            document.getElementById("fader").style.opacity = .5;
            gsap.to(document.getElementById("fader"), { opacity: 0, duration: .5, ease: "linear"});

            document.getElementById("pauseOverlay").style.display="flex";
            document.getElementById("faderBlack").style.opacity=.8;
            document.getElementById("pauseItemName").innerHTML=this.targetObject.name.replace(/[_-]/g, ' ');
            
            // Add flashing animation to subtitle
            const pauseSubtitle = document.getElementById("pauseSubtitle");
            if (pauseSubtitle) {
                pauseSubtitle.classList.add("flash-animation");
            }

            if(this.showFirstTarget===true){
                // this.showFirstTarget=false;
                this.e.s.p("firstMega");
                this.count=4;
            }else{
                this.count=2.25;
            }

            this.action="target pause"

        }else if(this.action==="target pause"){

            document.getElementById("pauseResume").innerHTML="RESUME IN "+Math.ceil(this.count);

            this.count-=this.e.dt;

            if(this.count<=0){

                //add +5 second overlay here
                if(this.targetMatches<10){
                    
                    if(this.showFirstTarget===true){
                        this.showFirstTarget=false;
                    }else{
                        this.showTimeBonusAnimation();
                    }

                }

                document.getElementById("pauseOverlay").style.display="none";
                document.getElementById("faderBlack").style.opacity=0;
                
                // Remove flashing animation
                const pauseSubtitle = document.getElementById("pauseSubtitle");
                if (pauseSubtitle) {
                    pauseSubtitle.classList.remove("flash-animation");
                }
                
                this.action="game";

            }

        }else if(this.action==="game"){

            this.showFirstTargetTime-=this.e.dt;
            
            if(this.showFirstTarget===true && this.showFirstTargetTime<=0){

                this.selectNewTargetObject();

            } 
             
            this.partTime+=this.e.dt;
            if(this.partTime>15){

                this.breadCrumb()
                this.partTime=0;

                this.part+=1;

            }

            if(this.bonusPerc>0){

                this.streak2=this.streak;

                if(this.streak>5){
                    this.streak2=5;
                }

                this.bonusPerc-=(this.streak2*5)*this.e.dt;
            }
    
            if(this.bonusPerc<=0 && this.streak!==1){
                this.bonusPerc=0;
                this.streak=1;
                this.e.s.p("loseStreak")
                this.showStreakBrokenAnimation();
            }
    
            document.getElementById("bonusText2").innerHTML="x"+this.streak;
            document.getElementById("innerBar").style.width=this.bonusPerc+"%";
    
            this.time-=this.e.dt;

            const currentSecond = Math.floor(this.time);

            if (currentSecond <= 20 && currentSecond > 0 && currentSecond !== this.lastTickSecond) {
                this.lastTickSecond = currentSecond;
                this.e.s.p("tick");
            }

            if(this.time<=0){

                if(this.selectedObject!==null){

                    this.selectedObject.cannonBody.wakeUp();
                    this.selectedObject.cannonBody.velocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.sleep();
                    this.selectedObject = null;
    
                }
                
                gsap.killTweensOf(document.getElementById("fader"));
                document.getElementById("fader").style.opacity = .7;
                gsap.to(document.getElementById("fader"), { opacity: 0, duration: 1, ease: "linear"});

                this.e.s.p("finish");

                document.getElementById("upperLeftDiv").style.opacity=0;
                document.getElementById("upperRightDiv").style.opacity=0;

                // Display time bonus if all items were matched
                if (this.timeLeftBonus && this.secondsLeft) {
                    // Add time bonus to total score
                    this.score += this.timeLeftBonus;
                }

                // Create final score overlay using endScore.js
                const statsArray = [
                    ["Regular Matches", this.regularMatches || 0],
                    ["Multiplier Bonus", this.scoreBonus || 0],
                    ["Megamatches", this.targetMatches || 0],
                    ["Megamatch Bonus", this.scoreTargetBonus || 0],
                    ["Time Left Bonus", this.timeLeftBonus || 0],
                    ["Longest Streak", this.longestStreak || 1]
                ];
                
                this.e.endScore.createFinalScoreOverlay(this.score, statsArray);
                
                this.breadCrumb("validate");
                
                this.action="over"
            }

            

            this.upperLeftDiv.innerHTML = Math.round(this.score);
            this.upperRightDiv.innerHTML = this.formatTime(this.time);
            // Removed matches display

        }

        if(this.matchLock1===undefined){
            this.ml1 = "x";
        }else{
            this.ml1 = this.matchLock1.sn;
        }
        
        if(this.matchLock2===undefined){
            this.ml2 = "x";
        }else{
            this.ml2 = this.matchLock2.sn;
        }
        
        // document.getElementById("feedback").innerHTML = this.ml1 + " / " + this.ml2;

        this.world.step(1 / 60);

        // Calculate viewport-based bounds for physics
        const viewportLimits = this.calculateViewportLimits();
        const bounds = { 
            x: Math.abs(viewportLimits.right), // Use the larger of left/right for symmetric bounds
            z: Math.abs(viewportLimits.top) // Use viewport-based top limit
        };

        for (let i = 0; i < this.matchObs.length; i++) {
            const mo = this.matchObs[i];
            if (!mo.boxBody) continue;

            const p = mo.boxBody.position;

            // Clamp to viewport-based bounds
            p.x = Math.max(viewportLimits.left, Math.min(viewportLimits.right, p.x));
            p.z = Math.max(viewportLimits.bottom, Math.min(viewportLimits.top, p.z));

            // Limit excessive velocity
            mo.boxBody.velocity.x = THREE.MathUtils.clamp(mo.boxBody.velocity.x, -5, 5);
            mo.boxBody.velocity.z = THREE.MathUtils.clamp(mo.boxBody.velocity.z, -5, 5);
        }

        // for (var i = 0; i < this.matchObs.length; i++) {
        for (var i = 0; i < this.matchObs.length; i++) {
            this.matchOb = this.matchObs[i];

            if(this.matchOb.boxBody!==undefined){

                            // make box fly up if too low

            if (this.matchOb.boxBody.position.z > 3.25 && this.matchOb.isLocked===0) {
                const force = new CANNON.Vec3(0, 0, -150);
                this.matchOb.boxBody.applyForce(force, this.matchOb.boxBody.position);
                this.matchOb.boxBody.angularVelocity.set(0, 0, 0);
            }

            // Reset objects that fall through floor or go above ceiling
            if (this.matchOb.boxBody.position.y < -5 || this.matchOb.boxBody.position.y > 25) {
                console.log(`Resetting object ${this.matchOb.threeCube.name} from Y position ${this.matchOb.boxBody.position.y}`);
                
                // Reset to safe position
                this.matchOb.boxBody.position.y = 10;
                this.matchOb.boxBody.position.x = (Math.random() - 0.5) * 4; // Random X position
                this.matchOb.boxBody.position.z = (Math.random() - 0.5) * 4; // Random Z position
                
                // Reset velocity
                this.matchOb.boxBody.velocity.set(0, 0, 0);
                this.matchOb.boxBody.angularVelocity.set(0, 0, 0);
            }

                // make the cube go to the box
                
                if (this.matchOb.boxBody) {
                    this.matchOb.threeCube.position.copy(this.matchOb.boxBody.position);
                    this.matchOb.threeCube.quaternion.copy(this.matchOb.boxBody.quaternion);
                    if (this.matchOb.threeCube.boxHelper) {
                        this.matchOb.threeCube.boxHelper.position.copy(this.matchOb.boxBody.position);
                        this.matchOb.threeCube.boxHelper.quaternion.copy(this.matchOb.boxBody.quaternion);
                    }
                }

                // lock set

                if(this.matchOb.isLocked!==0){

                    this.matchOb.boxBody.velocity.set(0, 0, 0);
                    this.matchOb.boxBody.angularVelocity.set(0, 0, 0);

                    if(this.matchOb.isLocked===1){
                        this.matchOb.boxBody.position.x = this.matcher1.position.x;
                        this.matchOb.boxBody.position.y = this.lockHeight;
                        this.matchOb.boxBody.position.z = this.matcher1.position.z;
                    }else if(this.matchOb.isLocked===2){
                        this.matchOb.boxBody.position.x = this.matcher2.position.x;
                        this.matchOb.boxBody.position.y = this.lockHeight;
                        this.matchOb.boxBody.position.z = this.matcher2.position.z;
                    }

                    this.matchOb.boxBody.quaternion.set(0, 0, 0, 1);

                }

                // removal

                if(this.matchOb.removeMe===true){

                    this.matchOb.removeMeTime-=this.e.dt;

                    if(this.matchOb.removeMeTime<=0){

                        this.matchOb.boxBody.position.z=100;

                        this.world.removeBody(this.matchOb.boxBody);
                        this.matchOb.boxBody=undefined;
    
                    }

                }

                // actions

                if(this.matchOb.action==="moving"){

                    this.matchOb.count+=this.e.dt;
                    if(this.matchOb.count>.25){

                        if (this.matchOb.target === 1){

                            this.matchOb.isLocked = 1;
                            this.matchLock1 = this.matchOb;

                        }else if (this.matchOb.target === 2){

                            this.matchOb.isLocked = 2;
                            this.matchLock2 = this.matchOb;

                        }

                        this.matchOb.count=0;
                        this.matchOb.action="";

                    }

                }

                // restrain

                // if(this.matchOb.boxBody.position.x>2.1){
                //     this.matchOb.boxBody.position.x=2.1;
                // }
    
            }

        }

        if (this.dragging && this.selectedObject) {

            this.raycaster.setFromCamera(this.mouse, this.e.camera);
            const intersectPoint = new THREE.Vector3();

            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
                this.selectedObject.cannonBody.position.copy(intersectPoint.add(this.mouseOffset));
                this.selectedObject.position.copy(this.selectedObject.cannonBody.position);
            }

        }

        if(this.matchLock1!==undefined && this.matchLock2!==undefined){

            if(this.matchLock1.sn === this.matchLock2.sn){

                this.matchLock1.isLocked=5;
                this.matchLock2.isLocked=5;

                gsap.to(this.matchLock1.threeCube.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.out"});
                gsap.to(this.matchLock2.threeCube.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.out"});

                this.matchLock1.removeMe=true;
                this.matchLock2.removeMe=true;

                this.matchLock1.removeMeTime=.6;
                this.matchLock2.removeMeTime=.6;

                this.e.s.p("match");

                this.bonusPerc=100;
                this.streak+=1;
                
                // Update longest streak if current streak is higher
                if (this.streak > this.longestStreak) {
                    this.longestStreak = this.streak;
                }
                
                document.getElementById("fader").style.opacity = .2;
                gsap.to(document.getElementById("fader"), { opacity: 0, duration: 0.3, ease: "linear"});

                this.matches+=1;
                
                this.matchedObjects.add(this.matchLock1.threeCube.name);

                if (this.matchLock1 && this.matchLock2 && this.matchLock1.threeCube && this.matchLock2.threeCube) {
                    
                    if (this.targetObject && (this.matchLock1.threeCube.name === this.targetObject.name || this.matchLock2.threeCube.name === this.targetObject.name)) {
                        
                        this.scoreAdd = 200*this.streak;

                        this.scoreTargetBonus+=200*(this.streak-1);
                        this.targetMatches+=1;
                        
                        // Add 5 seconds to the time
                        if(this.targetMatches<10){
                            this.time += 5;
                        }
                        
                        this.e.s.p("bonus1");

                        this.selectNewTargetObject();
                        targetDiv.textContent = `MEGA: ${this.targetObject.name.replace(/[_-]/g, ' ')}`;
                        
                    } else {

                        this.scoreBase+=100;
                        this.scoreBonus+=100*(this.streak-1);
                        this.regularMatches+=1;

                        this.scoreAdd = 100*this.streak; // Normal points

                    }

                } else {

                    this.scoreBase+=100;
                    this.scoreBonus+=100*(this.streak-1);
                    this.regularMatches+=1;

                    this.scoreAdd = 100*this.streak; // Normal points

                }
                
                this.score+=this.scoreAdd;
                this.levelScore+=this.scoreAdd;
                this.gameScores.push(this.scoreAdd);

                // Check for tutorial first match
                if (this.action === "tutorial_playing" && !this.tutorialFirstMatchMade) {
                    this.tutorialFirstMatchMade = true;
                    this.action = "tutorial_paused";
                    const tutorialDiv2 = document.getElementById("tutorialDiv2");
                    if (tutorialDiv2) {
                        tutorialDiv2.style.display = "block";
                    }
                }

                this.matchLock1=undefined;
                this.matchLock2=undefined;

                // Check if all items are matched
                this.checkAllItemsMatched();

            }

        }

    }

    setupTutorialButtons() {
        const tutorialContinue1 = document.getElementById("tutorialContinue1");
        const tutorialContinue2 = document.getElementById("tutorialContinue2");
        const instructionsBut = document.getElementById("instructionsButton");
        const closeInstructionsButton = document.getElementById("closeInstructionsButton");

        if (tutorialContinue1) {
            tutorialContinue1.addEventListener('click', () => {
                this.continueTutorial1();
            });
            tutorialContinue1.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.continueTutorial1();
            });
        }
        if (tutorialContinue2) {
            tutorialContinue2.addEventListener('click', () => {
                this.continueTutorial2();
            });
            tutorialContinue2.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.continueTutorial2();
            });
        }
        if (instructionsBut) {
            instructionsBut.addEventListener('click', () => {
                this.e.s.p("click");
                this.showInstructions();
            });
            instructionsBut.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.e.s.p("click");
                this.showInstructions();
            });
        }
        if (closeInstructionsButton) {
            closeInstructionsButton.addEventListener('click', () => {
                this.e.s.p("click");
                this.hideInstructions();
            });
            closeInstructionsButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.e.s.p("click");
                this.hideInstructions();
            });
        }
    }

    continueTutorial1() {
        const tutorialDiv1 = document.getElementById("tutorialDiv1");
        if (tutorialDiv1) {
            tutorialDiv1.style.display = "none";
        }
        this.action = "tutorial_playing";
    }

    continueTutorial2() {
        const tutorialDiv2 = document.getElementById("tutorialDiv2");
        if (tutorialDiv2) {
            tutorialDiv2.style.display = "none";
        }
        this.action = "game";
    }

    showInstructions() {
        const instructionsOverlay = document.getElementById("instructionsOverlay");
        if (instructionsOverlay) {
            instructionsOverlay.style.display = "flex";
        }
    }

    hideInstructions() {
        const instructionsOverlay = document.getElementById("instructionsOverlay");
        if (instructionsOverlay) {
            instructionsOverlay.style.display = "none";
        }
    }

    checkAllItemsMatched() {
        // Count how many items are still in the game (not removed)
        let activeItems = 0;
        for (let i = 0; i < this.matchObs.length; i++) {
            const matchOb = this.matchObs[i];
            if (matchOb.boxBody && !matchOb.removeMe) {
                activeItems++;
            }
        }
        
        // If no active items remain, all items have been matched
        if (activeItems === 0) {
            console.log("All items matched! Ending game...");
            
            // Calculate time bonus
            const secondsLeft = Math.floor(this.time);
            const timeBonus = secondsLeft * 300;
            
            // Store time bonus for final display
            this.timeLeftBonus = timeBonus;
            this.secondsLeft = secondsLeft;
            
            console.log(`Time bonus: ${secondsLeft} seconds × 300 = ${timeBonus} points`);
            
            this.time = 0; // Set timer to 0 to trigger game end
        }
    }

    formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
            seconds = 0;
        }
    
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const paddedSecs = secs < 10 ? '0' + secs : secs;
    
        return `${minutes}:${paddedSecs}`;
    }

    onTouchStart(event) {

        // console.log("start")
        event.preventDefault();  // Prevent default touch behavior (like zoom)
        
        // Handle start game action
        // if(this.action==="start"){
        //     this.action="start game"
        //     return;
        // }
        
        if (event.touches.length === 1) { // Single touch
            this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            this.onMouseDown(event);
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.touches.length === 1) { // Single touch
            this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            this.onMouseMove(event);
        }
    }
    
    onTouchEnd(event) {
        event.preventDefault();
        event.stopPropagation();
        this.onMouseUp(event);
    }

    calculateViewportLimits() {
        try {
            // Create a plane at the same Y level as the dragged object
            const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            
            // Calculate screen edges in world coordinates
            const leftScreenPos = new THREE.Vector3(-1, 0, 0); // Left edge of screen
            const rightScreenPos = new THREE.Vector3(1, 0, 0); // Right edge of screen
            const topScreenPos = new THREE.Vector3(0, 1, 0); // Top edge of screen
            const bottomScreenPos = new THREE.Vector3(0, -1, 0); // Bottom edge of screen
            
            // Convert screen coordinates to world coordinates using raycaster
            const leftRaycaster = new THREE.Raycaster();
            const rightRaycaster = new THREE.Raycaster();
            const topRaycaster = new THREE.Raycaster();
            const bottomRaycaster = new THREE.Raycaster();
            
            leftRaycaster.setFromCamera(leftScreenPos, this.e.camera);
            rightRaycaster.setFromCamera(rightScreenPos, this.e.camera);
            topRaycaster.setFromCamera(topScreenPos, this.e.camera);
            bottomRaycaster.setFromCamera(bottomScreenPos, this.e.camera);
            
            const leftIntersectPoint = new THREE.Vector3();
            const rightIntersectPoint = new THREE.Vector3();
            const topIntersectPoint = new THREE.Vector3();
            const bottomIntersectPoint = new THREE.Vector3();
            
            // Intersect with the drag plane to get world coordinates
            const leftIntersects = leftRaycaster.ray.intersectPlane(dragPlane, leftIntersectPoint);
            const rightIntersects = rightRaycaster.ray.intersectPlane(dragPlane, rightIntersectPoint);
            const topIntersects = topRaycaster.ray.intersectPlane(dragPlane, topIntersectPoint);
            const bottomIntersects = bottomRaycaster.ray.intersectPlane(dragPlane, bottomIntersectPoint);
            
            // Check if intersections are valid
            if (!leftIntersects || !rightIntersects || !topIntersects || !bottomIntersects) {
                console.log("Viewport calculation failed, using fallback values");
                return {
                    left: -2.4,
                    right: 2.4,
                    top: 4.5,
                    bottom: -4.5
                };
            }
            
            // Add some padding to prevent objects from touching the screen edges
            const padding = 0.8; // Increased padding to bring in left and right limits
            
                    return {
            left: leftIntersectPoint.x + padding,
            right: rightIntersectPoint.x - padding,
            top: -topIntersectPoint.z + padding , // Extra padding for top
            bottom: -bottomIntersectPoint.z - padding+2
        };
        } catch (error) {
            console.log("Viewport calculation error:", error, "using fallback values");
            return {
                left: -2.4,
                right: 2.4,
                top: 4.5,
                bottom: -4.5
            };
        }
    }



    onMouseMove(event) {

        if(this.e.mobile===false){
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        if(this.selectedObject!==null && this.selectedObject!==undefined){

            // Calculate viewport-based limits
            const viewportLimits = this.calculateViewportLimits();

            if(this.selectedObject.parentOb.boxBody.position.x > viewportLimits.right){
                
                this.selectedObject.parentOb.boxBody.position.x = viewportLimits.right;

                const force = new CANNON.Vec3(-50, 0, 0);
                this.selectedObject.cannonBody.applyForce(force, this.selectedObject.cannonBody.position);
                this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);

            }else if(this.selectedObject.parentOb.boxBody.position.x < viewportLimits.left){
                
                this.selectedObject.parentOb.boxBody.position.x = viewportLimits.left;

                const force = new CANNON.Vec3(50, 0, 0);
                this.selectedObject.cannonBody.applyForce(force, this.selectedObject.cannonBody.position);
                this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);

            }else if(this.selectedObject.parentOb.boxBody.position.z > viewportLimits.top){
                
                this.selectedObject.parentOb.boxBody.position.z = viewportLimits.top;

                const force = new CANNON.Vec3(0, 0, -50);
                this.selectedObject.cannonBody.applyForce(force, this.selectedObject.cannonBody.position);
                this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);

            }else  if(this.selectedObject.parentOb.boxBody.position.z < viewportLimits.bottom){
                
                this.selectedObject.parentOb.boxBody.position.z = viewportLimits.bottom;

                const force = new CANNON.Vec3(0, 0, -50);
                this.selectedObject.cannonBody.applyForce(force, this.selectedObject.cannonBody.position);
                this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);

            }

        }

    }

    onMouseDown(event) {

        if(this.e.mobile===false){
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        this.raycaster.setFromCamera(this.mouse, this.e.camera);
        const intersects = this.raycaster.intersectObjects(this.matchObs.map(matchOb => matchOb.threeCube));

        if (intersects.length > 0 && (this.action==="game" || this.action==="tutorial_playing")) {

            this.e.s.p("pickup");
                
            this.selectedObject = intersects[0].object;
            this.dragging = true;

            const worldIntersectPoint = intersects[0].point.clone();
            this.mouseOffset.subVectors(this.selectedObject.position, worldIntersectPoint);

            this.dragPlane.setFromNormalAndCoplanarPoint(
                this.e.camera.getWorldDirection(new THREE.Vector3()),
                this.selectedObject.position
            );

            this.startPosition = this.selectedObject.position.clone();
            this.startTime = performance.now();
            
            // Check if selectedObject has cannonBody before accessing it
            if (this.selectedObject && this.selectedObject.cannonBody) {
                this.selectedObject.cannonBody.velocity.set(0, 0, 0); 
                this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);
                this.selectedObject.cannonBody.sleep(); 
            }

            if (this.selectedObject && this.selectedObject.parentOb) {
                this.selectedObject.parentOb.isLocked = 0;
            }

            if(this.matchLock1===this.selectedObject.parentOb){
                this.matchLock1=undefined;
            }

            if(this.matchLock2===this.selectedObject.parentOb){
                this.matchLock2=undefined;
            }

        }

    }

    onMouseUp() {

        if (this.selectedObject) {
            
            this.raycaster.setFromCamera(this.mouse, this.e.camera);
            const matcher1Intersection = this.raycaster.intersectObject(this.matcher1);
            const matcher2Intersection = this.raycaster.intersectObject(this.matcher2);
    
            if (matcher1Intersection.length > 0 || matcher2Intersection.length > 0) {
                this.e.s.p("place");
            
                // Decide which matcher was hit
                const isMatcher1 = matcher1Intersection.length > 0;
                const targetPosition = isMatcher1 ? this.matcher1.position : this.matcher2.position;
                const currentLock = isMatcher1 ? this.matchLock1 : this.matchLock2;
            
                // If something is already locked in, eject it upward
                if (currentLock !== undefined) {
                    currentLock.isLocked = 0;
                    currentLock.boxBody.wakeUp();
                    currentLock.boxBody.velocity.set(0, 25, 0); // 🚀 shoot upward
                    currentLock.boxBody.angularVelocity.set(5, 5, 0); // add spin
                    if (isMatcher1) this.matchLock1 = undefined;
                    else this.matchLock2 = undefined;
                }
            
                // Lock in new object
                if (this.selectedObject && this.selectedObject.parentOb) {
                    this.selectedObject.parentOb.isLocked = 4;
                }
                if (this.selectedObject && this.selectedObject.cannonBody) {
                    this.selectedObject.cannonBody.wakeUp();
                    this.selectedObject.cannonBody.velocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.angularVelocity.set(0, 0, 0);
                    this.selectedObject.cannonBody.sleep();
                }
            
                if (this.selectedObject && this.selectedObject.cannonBody) {
                    gsap.to(this.selectedObject.cannonBody.position, {
                        x: targetPosition.x,
                        y: this.lockHeight,
                        z: targetPosition.z,
                        duration: 0.25,
                        ease: "power2.out",
                    });
                }
            
                if (this.selectedObject && this.selectedObject.parentOb) {
                    this.selectedObject.parentOb.action = "moving";
                    this.selectedObject.parentOb.count = 0;
                    this.selectedObject.parentOb.target = isMatcher1 ? 1 : 2;
                }
            
                if (this.selectedObject) {
                    gsap.to(this.selectedObject.rotation, {
                        x: 0,
                        y: 0,
                        z: 0,
                        duration: 0.25,
                        ease: "power2.out",
                        onUpdate: () => {
                            if (this.selectedObject !== null && this.selectedObject.cannonBody) {
                                const currentRotation = this.selectedObject.rotation;
                                const euler = new THREE.Euler(currentRotation.x, currentRotation.y, currentRotation.z);
                                const quaternion = new THREE.Quaternion().setFromEuler(euler);
                                this.selectedObject.cannonBody.quaternion.copy(quaternion);
                            }
                        },
                    });
                }
            
                this.selectedObject = null;
                this.dragging = false;
            }else{

                if (this.selectedObject && this.selectedObject.cannonBody) {
                    this.selectedObject.cannonBody.wakeUp();
                }
                this.dragging = false;
                this.selectedObject = null;

            }
        }
    }

    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------
    //----------------------------------------------------------------------------------------------------------------------------------------------

    startVars(){

        this.score=0;
        this.part=0;
        this.matches=0;
        this.gameScores=[];

        // Target object tracking for bonus points
        this.targetObject = null;
        this.matchedObjects = new Set();
        this.availableObjects = [];

        // this.currentLevel=1;

        // this.score=0;
        // this.life=100;

        // this.totalCoinPoints=0;
        // this.totalPushPoints=0;
        // this.totalRightPoints=0;
        // this.totalLifeBonus=0;

        // this.totalWrongPoints=0;
        // this.totalPenaltyPoints=0;

        this.levelStartTime = null;
        this.levelElapsedTime = 0;

        this.resetBreadCrumbTempData();

    }

    resetBreadCrumbTempData(){

        //reset every level

        this.levelScore=0;
        this.levelStartTime = performance.now();

        // Reset target object tracking
        // this.matchedObjects.clear();
        // this.availableObjects = [];
        // Initialize target object after variables are set up
       

        // this.levelCoinPoints=0;
        // this.levelPushPoints=0;
        // this.levelRightPoints=0;
        // this.levelLifeBonus=0;

        // this.levelWrongPoints=0;
        // this.levelPenaltyPoints=0;

        // this.levelCoinHits = [];

        // this.score=0;
        // this.part=0;

    }

    selectNewTargetObject() {

        this.action="set target pause"

        if (!this.matchedObjects) {
            this.matchedObjects = new Set();
        }
        
        // Initialize target selection counter if not exists
        if (!this.targetSelectionCount) {
            this.targetSelectionCount = 0;
        }
        
        // Define the first 3 target objects
        const firstThreeTargets = ["Globe", "Bus", "Aeroplane", "Hot Air Baloon", "Taxi", "Fire Hydrant", "Chicken", "Lawn Mower", "Wagon", "Boom Box", "Wine Bottle"];
        
        // For the first 3 selections, use the predefined list
        if (this.targetSelectionCount < 3) {
            // Get available unmatched objects from the predefined list
            const availableFromPredefined = firstThreeTargets.filter(targetName => {
                const gameObj = this.gameObjects.find(obj => obj.name === targetName);
                return gameObj && !this.matchedObjects.has(targetName);
            });
            
            console.log(`Selection ${this.targetSelectionCount + 1}: Available from predefined list:`, availableFromPredefined);
            console.log("Matched objects:", Array.from(this.matchedObjects));
            
            if (availableFromPredefined.length > 0) {
                // Select from available predefined objects
                const targetName = availableFromPredefined[0]; // Take the first available
                this.targetObject = this.gameObjects.find(obj => obj.name === targetName);
                console.log(`Selected from predefined list: "${this.targetObject.name}"`);
            } else {
                // No predefined objects available, fall back to normal random selection
                console.log("No predefined objects available, using random selection");
                
                if (!this.gameObjects || this.gameObjects.length === 0) {
                    console.log("No game objects available for target selection");
                    return;
                }
                
                // Get all available objects that haven't been matched yet
                this.availableObjects = this.gameObjects.filter((item) => {
                    return !this.matchedObjects.has(item.name);
                });
                
                if (this.availableObjects.length === 0) {
                    this.matchedObjects.clear();
                    this.availableObjects = this.gameObjects;
                }
                
                if (this.availableObjects.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.availableObjects.length);
                    this.targetObject = this.availableObjects[randomIndex];
                    console.log(`Selected random object: "${this.targetObject.name}"`);
                }
            }
        } else {
            // After first 3, use normal random selection
            if (!this.gameObjects || this.gameObjects.length === 0) {
                console.log("No game objects available for target selection");
                return;
            }
            
            // Get all available objects that haven't been matched yet and are in the game
            this.availableObjects = this.gameObjects.filter((item) => {
                return !this.matchedObjects.has(item.name);
            });

            console.log("Available objects after filtering:", this.availableObjects.length);
            console.log("Available object names:", this.availableObjects.map(obj => obj.name));
            console.log("Matched objects:", Array.from(this.matchedObjects));
            
            // If no available objects, reset matched objects and try again
            if (this.availableObjects.length === 0) {
                this.matchedObjects.clear();
                this.availableObjects = this.gameObjects;
            }

            // Select a random available object
            if (this.availableObjects.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.availableObjects.length);
                this.targetObject = this.availableObjects[randomIndex];
            }
        }
        
        // Increment the selection counter
        this.targetSelectionCount++;
        
        // Check if we have a valid target object
        if (this.targetObject) {
            // Update the UI to show the target object name
            const targetDiv = document.getElementById("targetDiv");
            if (targetDiv) {
                targetDiv.textContent = `MEGA: ${this.targetObject.name.replace(/[_-]/g, ' ')}`;
                // Add a subtle animation when target changes
                targetDiv.style.opacity = "1";
                targetDiv.style.transform = "translateX(-50%) scale(1.1)";
                setTimeout(() => {
                    targetDiv.style.transform = "translateX(-50%) scale(1)";
                }, 200);
            }
            
            // Display the target object in the separate canvas
            this.displayTargetObject(this.targetObject);
        } else {
            // No more target objects available
            console.log("No more target objects available");
            
            // Hide the target div
            const targetDiv = document.getElementById("targetDiv");
            if (targetDiv) {
                targetDiv.style.opacity = "0";
            }
            
            // Don't show pause overlay - just continue the game
            this.action = "game";
            return;
        }
    }

    breadCrumb(type){

        console.log("---------BREADCRUMB----------------------------------------------------------");

        if (typeof CryptoJS !== 'undefined') {

        this.levelElapsedTime = (performance.now() - this.levelStartTime) / 1000;
        console.log("Level duration (in seconds):", this.levelElapsedTime);

        const breadCrumbPayload = {

            // levelScore: this.levelCoinPoints + this.levelPushPoints + this.levelRightPoints + this.levelWrongPoints + this.levelPenaltyPoints,

            // level: this.currentLevel,
            // life: this.life,

            // levelCoinPoints: this.levelCoinPoints,
            // levelPushPoints: this.levelPushPoints,
            // levelRightPoints: this.levelRightPoints,
            // levelWrongPoints: this.levelWrongPoints,
            // levelPenaltyPoints: this.levelPenaltyPoints,

            // levelCoinHits: this.levelCoinHits,

            currentScore: this.score,
            levelScore: this.levelScore,
            levelTime: this.levelElapsedTime,
            matches: this.matches,
            part: this.part,
            gameScores: this.gameScores,
            clientTimestamp: Date.now()

        }

        if (type==="validate") {

            //---------------------------------------------------------------------------------------------------------------------
            //----END GAME VALIDATE------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------

            // this.score = this.totalCoinPoints + this.totalPushPoints + this.totalRightPoints + this.totalLifeBonus + this.totalWrongPoints + this.totalPenaltyPoints;
            // this.scoreNoLifeBonus = this.totalCoinPoints + this.totalPushPoints + this.totalRightPoints + this.totalWrongPoints + this.totalPenaltyPoints;

            const finalPayload = {

                score: this.score,
                matches: this.matches,
                gameScores: this.gameScores,
                // scoreNoLifeBonus: this.scoreNoLifeBonus,

                // level: this.currentLevel,
                // life: this.life,
            
                // totalCoinPoints: this.totalCoinPoints,
                // totalPushPoints: this.totalPushPoints,
                // totalRightPoints: this.totalRightPoints,
                // totalLifeBonus: this.totalLifeBonus,

                // totalWrongPoints: this.totalWrongPoints,
                // totalPenaltyPoints: this.totalPenaltyPoints,

                metadata: {
                    breadcrumb: breadCrumbPayload,
                }

            };

            try {

                var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(finalPayload), 'DrErDE?F:nEsF:AA=A:EEDB:>C?nAABA@r>E'._0xd7a82c(13)).toString();
                const message = JSON.stringify({ type: 'Sv{ny`p|r'._0xd7a82c(13), data: ciphertext });
                if (window.parent) {
                    window.parent.postMessage(message, "*")
                } else {
                    console.log(`no parent`);
                }

                } catch {

                console.log('Not configured properly');

            }

            this.breadCrumbDone = true;

        } else {

            //---------------------------------------------------------------------------------------------------------------------
            //----BREAD CRUMB------------------------------------------------------------------------------------------------------
            //---------------------------------------------------------------------------------------------------------------------

            // Simply send the breadcrumb (game is in progress) as a breadcrumb message
            
            try {

            var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(breadCrumbPayload), 'DrErDE?F:nEsF:AA=A:EEDB:>C?nAABA@r>E'._0xd7a82c(13)).toString();
            var message = JSON.stringify({type: 'OrnqPzo'._0xd7a82c(13), data: ciphertext});
            if (window.parent) {
                window.parent.postMessage(message, "*");
            } else {
                console.log('no parent');
            }

            } catch {

            console.log('Not configured properly');

            }

        }

        } else {

            console.log('CryptoJS is not defined');

        }

        //---------------------------------------------------------------------------------------------------------------------
        //---------------------------------------------------------------------------------------------------------------------
        //---------------------------------------------------------------------------------------------------------------------

        this.resetBreadCrumbTempData();

    }

    showStreakBrokenAnimation() {
        const streakText = document.getElementById("streakBrokenText");
        
        // Reset any existing animations
        gsap.killTweensOf(streakText);
        
        // Set initial state - big and visible
        streakText.style.opacity = "1";
        streakText.style.fontSize = "120pt";
        streakText.style.transform = "translate(-50%, -50%) scale(1.5)";
        
        // Animate: scale down over 0.5 seconds, then fade out quickly
        gsap.to(streakText, {
            fontSize: "45pt",
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                // After scaling down, fade out quickly
                gsap.to(streakText, {
                    opacity: 0,
                    duration: 0.2,
                    ease: "power2.in"
                });
            }
        });
    }

    showTimeBonusAnimation() {
        const timeText = document.getElementById("timeBonusText");
        
        // Reset any existing animations
        gsap.killTweensOf(timeText);
        
        // Set initial state - big and visible
        timeText.style.opacity = "1";
        timeText.style.fontSize = "120pt";
        timeText.style.transform = "translate(-50%, -50%) scale(1.5)";
        
        // Animate: scale down over 0.3 seconds, then fade out quickly
        gsap.to(timeText, {
            fontSize: "45pt",
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => {
                // After scaling down, fade out quickly
                gsap.to(timeText, {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power2.in"
                });
            }
        });
    }

    // ============================================================================
    // TARGET OBJECT DISPLAY SYSTEM
    // ============================================================================

    setupTargetDisplay() {
        // Create a separate Three.js scene for target object display
        this.targetScene = new THREE.Scene();
        this.targetCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000); // Square aspect ratio
        this.targetRenderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById("targetCanvas"),
            alpha: true,
            antialias: true
        });
        
        // Set renderer size
        this.targetRenderer.setSize(200, 200); // Fixed size for the display
        
        // Setup lighting for target scene
        const targetAmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.targetScene.add(targetAmbientLight);
        
        const targetDirectionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
        targetDirectionalLight.position.set(0, 3, 0);
        this.targetScene.add(targetDirectionalLight);
        
        // Position camera for good view of objects
        var cd = .8;
        this.targetCamera.position.set(cd, cd, cd);
        this.targetCamera.lookAt(0, 0, 0);
        
        // Start the render loop
        this.renderTargetDisplay();
    }

    renderTargetDisplay() {
        if (this.targetRenderer && this.targetScene && this.targetCamera) {
            // Rotate the target object if it exists
            if (this.currentTargetDisplay) {
                this.currentTargetDisplay.rotation.y += 0.01; // Slow rotation
            }
            
            this.targetRenderer.render(this.targetScene, this.targetCamera);
        }
        requestAnimationFrame(() => this.renderTargetDisplay());
    }

    displayTargetObject(targetObject) {
        // Clear previous target object
        this.clearTargetDisplay();
        
        if (!targetObject) return;
        
        // Clone the target object
        const targetClone = targetObject.clone(true);
        
        // Calculate bounds of the object
        const bbox = new THREE.Box3().setFromObject(targetClone);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bbox.getSize(size);
        bbox.getCenter(center);
        
        // Find the largest dimension to scale consistently
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        // Scale to fit within a consistent size (e.g., 1 unit)
        const targetSize = 1.0;
        const scale = targetSize / maxDimension;
        
        // Apply uniform scaling
        targetClone.scale.set(scale, scale, scale);
        
        // Recalculate bounds after scaling
        const scaledBbox = new THREE.Box3().setFromObject(targetClone);
        const scaledCenter = new THREE.Vector3();
        scaledBbox.getCenter(scaledCenter);
        
        // Position it so the center of the bounds is at (0,0,0)
        targetClone.position.sub(scaledCenter);
        
        // Add to target scene
        this.targetScene.add(targetClone);
        
        // Store reference for cleanup
        this.currentTargetDisplay = targetClone;
    }

    clearTargetDisplay() {
        if (this.currentTargetDisplay) {
            this.targetScene.remove(this.currentTargetDisplay);
            this.currentTargetDisplay = null;
        }
    }

    // ============================================================================
    // END TARGET OBJECT DISPLAY SYSTEM
    // ============================================================================
    
    // Progress bar animation moved to endScore.js
    
    // Progress bar functionality moved to endScore.js
    
    startCountdown() {
        this.action = "countdown";
        const countdownText = document.getElementById("countdownText");
        
        // Show "3" and play first beep
        countdownText.textContent = "3";
        countdownText.style.opacity = "1";
        this.e.s.p("startBeep1");
        
        setTimeout(() => {
            // Show "2" and play first beep
            countdownText.textContent = "2";
            this.e.s.p("startBeep1");
        }, 1000);
        
        setTimeout(() => {
            // Show "1" and play first beep
            countdownText.textContent = "1";
            this.e.s.p("startBeep1");
        }, 2000);
        
        setTimeout(() => {
            // Show "GO!" and play second beep
            countdownText.textContent = "GO!";
            this.e.s.p("startBeep2");
            
            // Fade out "GO!" immediately
            gsap.to(countdownText, { 
                opacity: 0, 
                duration: 1, 
                ease: "power2.out" 
            });
        }, 3000);
        
        setTimeout(() => {
            // Hide countdown and start game
            countdownText.style.opacity = "0";
            this.action = "game";
        }, 4000);
    }
    
}