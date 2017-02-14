$(function(){

    // Imagined by Luberlu
    // 2017

    // init Firebase

    let config = {
        apiKey: "AIzaSyAUNsxtZkmEgVd2aEGTNn0KYTkxrIDqDoU",
        authDomain: "my-firebase-f02fa.firebaseapp.com",
        databaseURL: "https://my-firebase-f02fa.firebaseio.com",
        storageBucket: "my-firebase-f02fa.appspot.com",
        messagingSenderId: "912536062883"
    };

    firebase.initializeApp(config);

    let database = firebase.database().ref("bloop");
    let storage = firebase.storage();
    let storageRef = storage.ref();
    let soundsRef = storageRef.child('sounds/default');


    // Create a worker

    let myworker = new Worker("js/worker.js");

    // Configuration

    let bpm = 120;
    let barsNbr = 16;

    // Init Call to Worker

    myworker.postMessage({init: {
        bpm: bpm,
        barsNbr: barsNbr
    }});

    myworker.onmessage = function(event) {
        let datas = event.data;

        if(typeof datas.drum !== "undefined"){
            createDrum(datas.drum);
            //createSounds(datas.drum);
        }

        if(typeof datas.bpmCount !== "undefined"){
            displayBpm(datas.bpmCount)
        }

        if(typeof datas.sound !== "undefined"){
            playSound(datas.sound);
        }

        // If new audio Upload

        if(typeof datas.newAudio !== "undefined"){

            if(typeof sounds.sources[datas.newAudio.kindOfInst.toLowerCase()] == "undefined") {
                sounds.sources[datas.newAudio.kindOfInst.toLowerCase()] = datas.newAudio;

                // firebase storage call for url

                soundsRef.child(datas.newAudio.link).getDownloadURL().then(function(url) {
                    sounds.audioObjects[datas.newAudio.kindOfInst.toLowerCase()] = new Audio(url);
                });
            }
        }

        // Init defaultSounds in html5

        if(typeof datas.defaultSounds !== "undefined"){

            for(let objects in datas.defaultSounds){

                for(let kindOfObj in datas.defaultSounds[objects]) {

                    if (typeof sounds.sources[kindOfObj.toLowerCase()] == "undefined") {
                        sounds.sources[kindOfObj.toLowerCase()] = datas.defaultSounds[objects];

                        // firebase storage call for url

                        soundsRef.child(datas.defaultSounds[objects][kindOfObj].path).getDownloadURL().then(function (url) {
                            sounds.audioObjects[kindOfObj.toLowerCase()] = new Audio(url);
                        });
                    }

                }

            }

        }

        if(typeof datas.loopToSave !== "undefined"){
            newUser.mapInObject = datas.loopToSave;
            newUser.setMap(1);
        }
    };

    // all sounds Array to new Audio Obj

    let sounds = {
        sources: [],
        audioObjects: []
    };


    // Play sound html5

    var playSound = function(link){
        sounds.audioObjects[link.toLowerCase()].play();
    };

    // DOM

    // variables

    let drummachine = $("#machine");
    let playbtn = $("#play");
    let stopbtn = $("#stop");
    let bpmInput = $("#bpm");


    // DOM Functions

    let createDrum = function(obj){

        let player = $("#playerMachine");

        let widthStep = (1/barsNbr) * 100;

        for(let inst in obj){
            player.append("<fieldset id='"+ inst + "'><label>" + inst + "</label></fieldset>");

            // bar structure

            let constructBar = function(label, nbr){

                return '<label style="width:'+
                    widthStep +'%; height:100%">' +

                    '<input type="checkbox" name="'+ label +'" id="' + label + '_' + nbr + '" value="' + nbr + '" /><span>' +
                    label + nbr  + '</span>' +
                    '</label>';
            };

            let i = 1;
            while(i < (barsNbr + 1)){
                $("fieldset#" + inst).append(constructBar(inst, i));
                i++;
            }
        }

        let i = 0;

        while(i < barsNbr){

            $("#bar").append("<div class='steps' id='step_" + (i + 1) + "' " +
                "style='width:" + widthStep + "%'></div>");
            i++;
        }

        afterCreateObjDom();


    };

    let displayBpm = function(BpmCounter){

        $(".steps").removeClass("on");
        $("#step_" + (BpmCounter - 1)).addClass("on");
    };

    // Interactions (clicks, keyboard..)

    playbtn.click(function(){
        myworker.postMessage({play: true});
    });

    stopbtn.click(function(){
        myworker.postMessage({play: false});
    });

    bpmInput.on("change paste keyup", function(){
        bpm = $(this).val();
        myworker.postMessage({bpm: bpm});
    });

    $("#createUser").click(function(){
        createUser();
    });

    $("#saveMap").click(function(){
        myworker.postMessage({saveAction: true});
    });


    let afterCreateObjDom = function() {

        $('#playerMachine :input').change(function (e) {

            myworker.postMessage({instChange: {
                id: (e.target.id).toLowerCase(),
                state: (this.checked) ? 1 : 0
            }});

        });

    };

    let afterListLoad = function(){

        $("#createUser").click(function(){
            createUser();
            $(".create-own").hide();
        });
    };

    // User Class

    class User {

        constructor(uid, token, user){
            this.uid = uid;
            this.token = token;
            this.userInfos = user;
            this.maps = [];
            this._checkIfAlreadyExist();
        }

        set mapInObject(kit){
            this.maps.push(kit);
        }

        _checkIfAlreadyExist(){

            let that = this;

            database.child("users/" + this.uid).once("value", function(snap){
                let exists = (snap.val() !== null);

                if(!exists){
                    that._createUserToDatabase();
                } else {
                    console.log("User already exist");
                }

            });

        }

        setMap(id){

            database.child("users/" + this.uid + "/loops/" + id).set({
                nameOfLoop: "Dubstep sa mère",
                kit: this.maps
            });

            database.child("loops/").push({
                uid: this.uid,
                id_loop: id,
                nameOfLoop: "Dubstep sa mère",
                kit: this.maps
            });

        }

        _createUserToDatabase(){

            database.child("users/" + this.uid).set({
                email: this.userInfos.email,
                token: this.token
            });
        }
    }

    // Firebase functions (auth, database etc..)


    var createUser = function(){

        let provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider).then(function(result) {

            let token = result.credential.accessToken;
            let user = result.user;
            let uid = result.user.uid;

            newUser = new User(uid, token, user);
            console.log(newUser);

        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;

            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;

            console.log(errorMessage);

        });


    };

    let looplist = $("#loops-list").html();
    let appendloop = $("#append-loop").html();
    let loops;

    // Database onload

    database.child("loops/").on("value", function(snap){

        if(typeof loops == "undefined") {
            loops = snap.val();
            handlebarsList();
        }

    });

    // Database on_child_added

    database.child("loops/").on("child_added", function(snap){
        handlebarsUpdateList(snap.val());
    });


    // Handlebars

    let handlebarsList = function(){
        console.log(loops);
        let template = Handlebars.compile(looplist);
        let theCompiledHtml = template(loops);
        $('#all_loops').html(theCompiledHtml);
        afterListLoad();
    };

    let handlebarsUpdateList = function(loop){
        let template = Handlebars.compile(appendloop);
        let theCompiledHtml = template(loop);
        $('#all_loops .row').append(theCompiledHtml);
    };


});
