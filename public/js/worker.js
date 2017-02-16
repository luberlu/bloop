//  => Worker (maximize processes)

let scope = self;

let mydrum;
let map;
let drumloop;
let playerloop;

// DrumKit contain differents sounds for kicks, snares..
// Could be possible to add sounds with upload feature

let DrumKit = {
    kicks: {
        "Kick01": {
            path: "default/kick/kick01.wav",
            activated: false
        },
        "Kick02": {
            path: "default/kick/kick02.wav",
            activated: true
        }
    },
    snares: {
        "Snare01": {
            path:"default/snare/snare01.wav",
            activated: false
        },
        "Snare02": {
            path: "default/snare/snare02.wav",
            activated: true
        }
    },
    hihats: {
        "Hi-hat01": {
            path: "default/hi-hat/hi-hat01.wav",
            activated: true
        },
        "Hi-hat02": {
            path: "default/hi-hat/hi-hat02.wav",
            activated: false
        }
    },
    percs: {
        "Perc01": {
            path: "default/perc/perc01.wav",
            activated: true
        },
        "Perc02": {
            path: "default/perc/perc02.wav",
            activated: false
        }
    },
    fx: {
        "FX01": {
            path: "default/fx/fx01.wav",
            activated: false
        },
        "FX02": {
            path: "default/fx/fx02.wav",
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


    addSoundToKit(sound){

        this.kit[sound.name] = [];
        this.kit[sound.name][sound.name] = {
            path: sound.path,
            activated: true
        };

        return this.kit[sound.name];

    }

    returnAllSounds(){
        return this.kit;
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
    constructor(bpm, barsNbr, Inst, loop){
        this.name = "Loop Random";
        this.bpm = bpm;
        this.barsNbr = barsNbr;
        this.onPlay = null;
        this.bpmCount = 1;
        this.intervalPlayer = null;
        this.intervalBPM = null;
        this.inst = Inst;
        this.map = {};

        if(typeof loop == "undefined") {
            this._createMapping();
            this.type = "myloop";
        } else {
            this._createMappingWithMapLoop(loop);
            this.type = "loopOnList";
        }

    }

    _createMapping(){

        for (let type in this.inst.kit) {
            this.map[type] = {};

            for (let i = 1; i < this.barsNbr + 1; i++) {
                this.map[type][i] = 0;
            }
        }

    }

    addToMapping(add){
        for (let i = 1; i < this.barsNbr + 1; i++) {
            this.map[add][i] = 0;
        }
    }

    _createMappingWithMapLoop(loop){
        this.map = loop;
    }

    changeMap(obj){
        let type = (obj.id).split("_")[0];
        let barNbr = (obj.id).split("_")[1];
        this.map[type][barNbr] = obj.state;
    }

    _returnLinkActivatedInKit(type){

        for(let typeInst in this.inst.kit){
            if(typeInst == type){
                for(let kindOfInst in this.inst.kit[typeInst]){

                    for(let activation in this.inst.kit[typeInst][kindOfInst]) {

                        let link = this.inst.kit[typeInst][kindOfInst]["path"];

                        if (activation == "activated") {

                            if (this.inst.kit[typeInst][kindOfInst][activation] == true) {


                                postMessage({ newAudio : {
                                    typeInst: typeInst,
                                    kindOfInst: kindOfInst,
                                    link: link
                                }});

                                return kindOfInst;

                            }
                        }

                    }
                }
            }
        }
    }

    _playFunction(){
        let bpmCount = this.bpmCount;

        for(let type in this.map){

            for(let typedatas in this.map[type]){

                if(typedatas == bpmCount) {

                    if (this.map[type][typedatas] == 1) {
                        postMessage({sound: this._returnLinkActivatedInKit(type)});
                    }

                }
            }
        }
    }

    set SetBpm (bpm){

        if(bpm > 10 && bpm < 600) {
            this.bpm = bpm;
            this.onPlay = true;
        }
    }

    set SetName (name){
        this.name = name;
    }

    set onPlay (action){

        let that = this;

        if(typeof action !== null) {

            if(action == true) {

                if(typeof this.intervalPlayer !== null){

                    this.bpmCount = 1;
                    clearInterval(this.intervalBPM);
                }


                // 60,000 ms (1 minute) / Tempo (BPM) = Delay Time in ms for quarter-note beats

                this.intervalBPM = setInterval(function(){

                    that._playFunction();
                    that.bpmCounter();

                    scope.postMessage({bpmCount: that.bpmCount, bpmWhat: that.type});

                }, (60000 / that.bpm));

            } else {
                clearInterval(this.intervalPlayer);

                this.bpmCount = 0;
                clearInterval(this.intervalBPM);
            }
        }
    }

    bpmCounter(){
        if(this.bpmCount == this.barsNbr){
            this.bpmCount = 1;
        } else
            this.bpmCount++;
    }
}


// Init function

let init = function(bpm, barsNbr){

    mydrum = new Drum(DrumKit, "Drum");
    myplayer = new Player(bpm, barsNbr, mydrum);

    postMessage({drum: mydrum.kit, added: false});
    postMessage({defaultSounds: mydrum.returnAllSounds()});

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

    if(typeof datas.nameLoop !== "undefined"){
        myplayer.SetName = datas.nameLoop;
    }

    if(typeof datas.instChange !== "undefined"){
        myplayer.changeMap(datas.instChange);
    }

    if(typeof datas.saveAction !== "undefined"){
        postMessage({loopToSave: myplayer});
    }

    if(typeof datas.newSound !== "undefined"){
        let newAddedObj = mydrum.addSoundToKit(datas.newSound);

        console.log(newAddedObj);

        //myplayer.addToMapping(newAddedObj.name);
        postMessage({defaultSounds: mydrum.returnAllSounds()});
        postMessage({drum: newAddedObj, added: true});
    }


    // Play loops list

    if(typeof datas.playloop !== "undefined"){
        if(datas.playloop == true){

            if(typeof playerloop !== "undefined")
                playerloop.onPlay = false;

            map = datas.loopDatas.kit.map;

            drumloop = new Drum(datas.loopDatas.kit.inst.kit,
                                    datas.loopDatas.kit.inst.name);

            playerloop = new Player(datas.loopDatas.kit.bpm,
                                        datas.loopDatas.kit.barsNbr,
                                        drumloop, map);

            postMessage({SoundsLoop: drumloop.returnAllSounds()});

            playerloop.onPlay = true;

        } else if (datas.playloop == false){
            playerloop.onPlay = false;
        }
    }

};



// send datas to main.js

//postMessage();

