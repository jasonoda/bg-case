import * as THREE from 'three';

import AES from 'crypto-js/aes';
import enc from 'crypto-js/enc-utf8';

export default class Engine{
    constructor(input, loader, scene, sounds, suitcase, utilities, ui, endScore){

        this.input = input;
        this.loader = loader;
        this.s = sounds;
        this.scene = scene;
        this.ui = ui;
        this.suitcase = suitcase;
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

        // document.getElementById("feedback").innerHTML = this.scene.action;

        if(this.action==="set up"){

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
                    
                    console.log("FAIL:");
                    console.log(e);

                }
            });

            //---end--------------------------------------------------------------------------------------------------------------

            this.scene.buildScene();
            
            this.count=0;
            this.action="build"
            
        }else if(this.action==="build"){

            this.loadOpacity=1;

            this.count+=this.dt;
            if(this.count>1){
                this.action="go";
            }
            
        }else if(this.action==="go"){

            this.loadOpacity-=this.dt;
            if(this.loadOpacity<0){
                this.loadOpacity=0;
            }

            document.getElementById("loadingImage").style.opacity = this.loadOpacity+""
            document.getElementById("loadingBack").style.opacity = this.loadOpacity+""

            this.scene.update();
            this.ui.update();

        }

    }

}