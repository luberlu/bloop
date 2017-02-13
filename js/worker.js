//  => Worker (maximize processes)

let scope = self;

// DrumKit contain differents sounds for kicks, snares..
// Could be possible to add sounds with upload feature

let DrumKit = {
    kicks: {
        "Kick01": {
            path: "default/kick/kick01.mp3",
            activated: false
        },
        "Kick02": {
            path: "default/kick/kick02.mp3",
            activated: true
        }
    },
    Snares: {
        "Snare01": {
            path:"default/snare/snare01.mp3",
            activated: false
        },
        "Snare02": {
            path: "default/snare/snare02.mp3",
            activated: true
        }
    },
    Hihats: {
        "Hi-hat01": {
            path: "default/hi-hat/hi-hat01.mp3",
            activated: true
        },
        "Hi-hat02": {
            path: "default/hi-hat/hi-hat02.mp3",
            activated: false
        }
    },
    Percs: {
        "Perc01": {
            path: "default/perc/perc01.mp3",
            activated: true
        },
        "Perc02": {
            path: "default/perc/perc02.mp3",
            activated: false
        }
    },
    FX: {
        "FX01": {
            path: "default/fx/fx01.mp3",
            activated: false
        },
        "FX02": {
            path: "default/fx/fx02.mp3",
            activated: true
        }
    }
};


// Instrument Class for all Instruments

class Inst {

    constructor(kitObj, name){
        this.kit = kitObj;
        this.name = name;
    }

    addSound(type, name, path){

        if(!this._AlreadyExist(type, name)) {
            this.kit[type][name] = {
                path: path
            };
            return true
        }

        else
            return "Oops! Change the name already exist"

    }

    _AlreadyExist(type, name){ let exist;

        (typeof this.kit[type][name] !== "undefined") ? exist = true : exist = false;

        return exist;
    }

}

// Drum Class to have more options

class Drum extends Inst {

    constructor(kitObj, name){
        super(kitObj, name);
    }

}


// Player Class

class Player{
    constructor(bpm, barsNbr, Inst){
        this.bpm = bpm;
        this.barsNbr = barsNbr;
        this.onPlay = null;
        this.bpmCount = 0;
        this.intervalPlayer = null;
        this.intervalBPM = null;
        this.inst = Inst;
        this.map = {};
        this._createMapping();
    }

    _createMapping(){

        for(let type in this.inst.kit){

            this.map[type] = {};

            for(let i = 1; i < this.barsNbr + 1; i++){
                this.map[type][i] = 0;
            }

        }

    }

    _playFunction(){

        // send to main.js informations to DOM
    }

    set SetBpm (bpm){

        if(bpm > 10 && bpm < 600) {
            this.bpm = bpm;
            this.onPlay = true;
        }
    }

    set onPlay (action){

        let that = this;

        if(typeof action !== null) {

            if(action == true) {

                if(typeof this.intervalPlayer !== null){
                    clearInterval(this.intervalPlayer);

                    this.bpmCount = 0;
                    clearInterval(this.intervalBPM);
                }

                this.intervalPlayer = setInterval(function(){
                    that._playFunction();
                }, 50);

                // 60,000 ms (1 minute) / Tempo (BPM) = Delay Time in ms for quarter-note beats

                this.intervalBPM = setInterval(function(){

                    that.bpmCounter();
                    scope.postMessage({bpmCount: that.bpmCount});

                }, (60000 / that.bpm));

            } else {
                clearInterval(this.intervalPlayer);

                this.bpmCount = 0;
                clearInterval(this.intervalBPM);
            }
        }
    }

    bpmCounter(){
        if(this.bpmCount == 16){
            this.bpmCount = 1;
        } else
            this.bpmCount++;
    }
}


// Init function

let init = function(bpm, barsNbr){

    let mydrum = new Drum(DrumKit, "Drum");
    myplayer = new Player(bpm, barsNbr, mydrum);

    postMessage({drum: mydrum.kit});

    let addSound = mydrum.addSound("FX", "FX03", "hdh.mp3");

    if(!addSound){
        alert(addSound);
    }

};


// Every call main message (Postmessage)

onmessage = function(e){

    let datas = e.data;

    if(typeof datas.init !== "undefined")
        init(datas.init.bpm, datas.init.barsNbr);

    if(typeof datas.play !== "undefined") {
        (datas.play == true) ? myplayer.onPlay = true : myplayer.onPlay = false;
    }

    if(typeof datas.bpm !== "undefined"){
        myplayer.SetBpm = datas.bpm;
    }

    if(typeof datas.instChange !== "undefined"){
        console.log(datas.instChange);
    }

};



// send datas to main.js

//postMessage();

