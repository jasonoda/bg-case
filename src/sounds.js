import { Howl } from 'howler';
export class Sounds {

    setUp(e) {

        this.e=e;
        this.soundArray = ["click1", "brightClick", "coin", "stinger", "tick",
            "open_bad", "open_good", "open_million", "openClick", "lose", "wincase", "clue", "bingnice", 
        ];
        this.loadedSounds = [];

        for(var i=0; i<this.soundArray.length; i++){
            this.loadSounds(this.soundArray[i]);
        }
        
    }

    loadSounds(url){

        var theSound = new Howl({
            src: ['src/sounds/'+url+".mp3"]
        });

        theSound.on('load', (event) => {
            theSound.name=url;
            this.loadedSounds.push(theSound);
            // console.log("SOUND: "+url+" - "+this.loadedSounds.length+" / "+this.soundArray.length);
        });

    }

    p(type){

        // console.log('SOUND PLAY called with type:', type);
        // console.log('Total loaded sounds:', this.loadedSounds.length);
        // console.log('Looking for sound named:', type);

        // if(this.e.soundOn===true){
            for(var i=0; i<this.loadedSounds.length; i++){

                // console.log('Checking sound', i, ':', this.loadedSounds[i].name);

                if(this.loadedSounds[i].name===type){
                    // console.log('MATCH FOUND! Playing sound:', type);
                    this.loadedSounds[i].play();
                    return; // Exit after playing
                }
                
            }
            console.log('No sound found with name:', type);
        // }

    }
}