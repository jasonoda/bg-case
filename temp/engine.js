import * as THREE from 'three';

import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';

export default class Engine{
    constructor(input, loader, scene, sounds, utilities, ui, endScore){

        this.input = input;
        this.loader = loader;
        this.s = sounds;
        this.scene = scene;
        this.ui = ui;
        this.u = utilities;
        this.endScore = endScore;

        this.mobile = false;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ) || window.innerWidth<600) {
            this.mobile = true;
        }

        var testUA = navigator.userAgent;

        if(testUA.toLowerCase().indexOf("android") > -1){
            this.mobile = true;
        }

        this.action = "set up";
        this.count = 0;

        

    }

    start(){

    }

    update(){

        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);

        //---deltatime--------------------------------------------------------------------------------------------------------------

        var currentTime = new Date().getTime();
        this.dt = (currentTime - this.lastTime) / 1000;
        if (this.dt > 1) {
            this.dt = 0;
        }
        this.lastTime = currentTime;

        document.getElementById("feedback").innerHTML = this.scene.action;

        // console.log(this.action);

        if(this.action==="set up"){

            //---3D SET UP----------------------------------------------------------------------------------------------------------------

            //---scene parts--------------------------------------------------------------------------------------------------------------

            this.scene3D = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(30,window.innerWidth/window.innerHeight,.1, 740);
            this.scene3D.fog = new THREE.Fog(0x000000, 0, 330*1.6);

            this.mainCont = new THREE.Group();
            this.scene3D.add(this.mainCont);

            //---carmera rig--------------------------------------------------------------------------------------------------------------

            this.camContX = new THREE.Group();
            this.camContY = new THREE.Group();
            this.scene3D.add(this.camContX);
            this.scene3D.add(this.camContY);

            this.camContY.add(this.camContX)
            this.camContX.add(this.camera);

            //-----------------------

            this.camera.position.z = 4;
            this.camera.position.y = 0;

            // this.camContY.rotation.y = this.u.ca(45)
            this.camContX.rotation.x = this.u.ca(-90)
            // this.camContX.rotation.x = this.u.ca(-45)

            //---webgl--------------------------------------------------------------------------------------------------------------

            this.renderer = new THREE.WebGLRenderer({antialias:true, powerPreference: "high-performance", alpha: true})

            this.renderer.setSize(window.innerWidth,window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMapSoft = true;

            this.renderer.shadowCameraNear = 3;
            this.renderer.shadowCameraFar = this.camera.far;
            this.renderer.shadowCameraFov = 50;

            this.renderer.shadowMapBias = 0.0039;
            this.renderer.shadowMapDarkness = 0.5;
            this.renderer.shadowMapWidth = 2048;
            this.renderer.shadowMapHeight = 2048;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

            this.renderer.domElement.style.position="absolute"
            this.renderer.domElement.style.zIndex="2";
            // this.renderer.domElement.style.border="2px solid red";

            //---end--------------------------------------------------------------------------------------------------------------

            this.serverData = null;
            
            window.addEventListener('message', event => {
                try {
                    const message = JSON.parse(event.data);
                    if (message?.type) {
                        const _0x87c0da = 'V{vTnzr'._0x6cc90a(13);
                        if (message.type === _0x87c0da) {
                            // Case CG_API.InitGame
                            // Decrypt the data
                            const bytes  = AES.decrypt(message.data, 'DrErDE?F:nEsF:AA=A:EEDB:>C?nAABA@r>E'._0x6cc90a(13));
                            this.serverData = JSON.parse(bytes.toString(enc));
                            console.log("LOAD CRYPTO")
                        }
                    }
                } catch (e) {
                    // Ignore exception - not a message for us and couldn't JSON parse it
                    console.log("FAIL:");
                    console.log(e);
                }
            });

            //---end--------------------------------------------------------------------------------------------------------------

            this.action="load images";

        }else if(this.action==="load images"){

            // load 2d images

            this.ui.load();

            this.action="wait for images";

        }else if(this.action==="wait for images"){

            // wait for 2d images

            console.log(this.ui.isLoaded_UI)

            if(this.ui.isLoaded_UI===true){
                this.action="load 3d";
            }

        }else if(this.action==="load 3d"){

            // load 3d assets

            this.loader.load();
            this.action="loading 3d";

        }else if(this.action==="loading 3d"){

            // wait for 3d assets

            // console.log(this.loader.isLoaded_3DTEXTURES+" / "+this.loader.isLoaded_3D)

            if(this.loader.isLoaded_3DTEXTURES===true && this.loader.isLoaded_3D===true && this.loader.isLoaded_CUBE===true){
                this.action="wait before build";
            }

        }else if(this.action==="wait before build"){

            // wait before build

            this.count+=this.dt;
            if(this.count>.1){
                this.count=0;
                this.action="build"
            }

        }else if(this.action==="build"){

            // build everything here

            // add 3d dom element to page

            document.body.appendChild(this.renderer.domElement);
            this.renderer.domElement.style.pointerEvents="none";

            // call builds

            this.scene.buildScene();
            // this.ui.setUp2();

            // add resizer

            window.addEventListener("resize", () => {
                this.resize3D();
            })

            // end

            this.loadBack=1;
            this.loadWords=1;

            this.count=0;
            this.action="wait";

        }else if(this.action==="wait"){

            // fade out loading graphic

            this.loadWords-=this.dt;
            document.getElementById("loadingImage").style.opacity = this.loadWords+""

            document.getElementById("splashImage").src = "./src/images/splashImage.png"

            // loop

            this.ui.update();
            this.scene.update();

            // end

            this.count+=this.dt;
            if(this.count>1){
                this.count=0;
                this.action="go"
            }

        }else if(this.action==="go"){

            // fade out loading cover

            // this.loadBack-=this.dt;
            // if(this.loadBack.opacity<0){
            //     this.loadBack.opacity=0;
            // }
            // document.getElementById("loadingBack").style.opacity = this.loadBack+""

            // loops

            this.scene.update();
            this.ui.update();
            this.render();

        }

    }

    render(){
        
        //---renderer--------------------------------------------------------------------------------------------------------------

        this.renderer.render(this.scene3D, this.camera);

    }

    resize3D(){

        console.log("resize")
    
        var width = window.innerWidth;
        var height = window.innerHeight;

        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight;
    
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize( width, height );
    
    }

}