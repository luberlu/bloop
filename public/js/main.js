$(function() {

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
    let soundsRef = storageRef.child('sounds');


    let newUser;

    // Create a worker

    let myworker = new Worker("js/worker.js");

    // Configuration

    let bpm = 120;
    let barsNbr = 16;

    // Init Call to Worker

    myworker.postMessage({
        init: {
            bpm: bpm,
            barsNbr: barsNbr
        }
    });

    myworker.onmessage = function (event) {
        let datas = event.data;

        if (typeof datas.drum !== "undefined") {

            if(datas.added == false) {
                handlebarsStepsbar();
                handlebarstrackBar(datas.drum);
            } else {
                handlebarstrackBar(datas.drum, 1);
            }

        }

        if (typeof datas.bpmCount !== "undefined") {

            displayBpm(datas.bpmWhat, datas.bpmCount)
        }

        if (typeof datas.sound !== "undefined") {
            playSound(datas.sound);
        }

        // If new audio Upload

        if (typeof datas.newAudio !== "undefined") {

            if (typeof sounds.sources[datas.newAudio.kindOfInst.toLowerCase()] == "undefined") {
                sounds.sources[datas.newAudio.kindOfInst.toLowerCase()] = datas.newAudio;

                // firebase storage call for url

                soundsRef.child(datas.newAudio.link).getDownloadURL().then(function (url) {
                    sounds.audioObjects[datas.newAudio.kindOfInst.toLowerCase()] = new Audio(url);
                });
            }
        }

        // Init defaultSounds in html5

        if (typeof datas.defaultSounds !== "undefined") {

            for (let objects in datas.defaultSounds) {

                for (let kindOfObj in datas.defaultSounds[objects]) {

                    if (typeof sounds.sources[kindOfObj.toLowerCase()] == "undefined") {
                        sounds.sources[kindOfObj.toLowerCase()] = datas.defaultSounds[objects];

                        // firebase storage call for url

                        soundsRef.child(datas.defaultSounds[objects][kindOfObj].path).getDownloadURL().then(function (url) {
                            sounds.audioObjects[kindOfObj.toLowerCase()] = new Audio(url);
                            sounds.audioObjects[kindOfObj.toLowerCase()].volume = datas.defaultSounds[objects][kindOfObj].volume;
                        });
                    }

                }

            }

        }

        // CreateSound for list loops

        if (typeof datas.SoundsLoop !== "undefined") {

            for (let objects in datas.SoundsLoop) {

                for (let kindOfObj in datas.SoundsLoop[objects]) {

                    if (typeof sounds.sources[kindOfObj.toLowerCase()] == "undefined") {
                        sounds.sources[kindOfObj.toLowerCase()] = datas.SoundsLoop[objects];

                        // firebase storage call for url

                        soundsRef.child(datas.SoundsLoop[objects][kindOfObj].path).getDownloadURL().then(function (url) {
                            sounds.audioObjects[kindOfObj.toLowerCase()] = new Audio(url);
                            sounds.audioObjects[kindOfObj.toLowerCase()].volume = datas.SoundsLoop[objects][kindOfObj].volume;
                        });
                    }

                }

            }

        }


        if (typeof datas.loopToSave !== "undefined") {

            newUser.mapInObject = datas.loopToSave;
            newUser.setMap();

            displayMachine(false);
        }

        if(typeof datas.volume !== "undefined"){
            sounds.audioObjects[datas.volume.inst.toLowerCase()].volume = datas.volume.volume;
        }
    };

    // all sounds Array to new Audio Obj

    let sounds = {
        sources: [],
        audioObjects: []
    };


    // Play sound html5

    var playSound = function (link) {

        if(typeof sounds.audioObjects[link.toLowerCase()].currentTime !== "undefined") {
            sounds.audioObjects[link.toLowerCase()].currentTime = 0;
            sounds.audioObjects[link.toLowerCase()].play();
        }
    };

    // DOM

    // variables

    let playbtn = $("#play");
    let stopbtn = $("#stop");
    let bpmInput = $("#bpm");
    let nameInput = $("#nameLoop");
    let widthStep = (1 / barsNbr) * 100;

    // DOM Functions


    let displayBpm = function (what, BpmCounter) {

        if (what == "myloop") {

            $(".steps").removeClass("on");
            $("#step_" + (BpmCounter - 1)).addClass("on");

        } else {
            $('#all_loops .ON .progress-bar span').removeClass('on');
            $('#all_loops .ON .progress-bar #' + (BpmCounter - 2)).addClass("on");
        }

    };

    // Interactions (clicks, keyboard..)

    playbtn.click(function () {
        myworker.postMessage({play: true});
    });

    stopbtn.click(function () {
        myworker.postMessage({play: false});
    });

    bpmInput.on("change paste keyup", function () {
        bpm = $(this).val();
        myworker.postMessage({bpm: bpm});
    });

    nameInput.on("change paste keyup", function () {
        name = $(this).val();
        myworker.postMessage({nameLoop: name});
    });



    $("#createUser, #createUser-masthead, #createUser-top").click(function () {
        createUser();
    });

    $("#saveMap").click(function () {
        myworker.postMessage({saveAction: true});
        myworker.postMessage({play: false});
    });

    $(".navbar-header").click(function(){
        displayMachine(false);
    });

    let afterCreateObjDom = function () {

        $('#playerMachine :input').change(function (e) {

            myworker.postMessage({
                instChange: {
                    id: (e.target.id).toLowerCase(),
                    state: (this.checked) ? 1 : 0
                }
            });

        });

        $(".dial").knob({
            'change' : function (v) {
                let value = (v/100);
                let what = this.$.attr('id').split("_")[1];

                myworker.postMessage({volume: {
                    inst: what,
                    volume: value
                }});

            }
        });


    };

    function displayCreate() {
        $(".create-own").show();
    }

    let afterListLoad = function () {

        displayCreate();

        $(".play-loop").off().on("click", function (e) {

            e.preventDefault();
            e.stopPropagation();

            let idLoop = ($(this).attr("id")).split("-")[1];

            if ($(this).hasClass("OFF")) {

                myworker.postMessage({playloop: true, loopDatas: loops[idLoop]});

                $(".play-loop, .list-loop").removeClass("ON").addClass("OFF");

                $(this).closest(".list-loop").removeClass("OFF").addClass("ON");
                $(this).removeClass("OFF").addClass("ON");

            } else {
                myworker.postMessage({playloop: false});

                $(".play-loop, .list-loop").removeClass("ON").addClass("OFF");

                $(this).closest(".list-loop").removeClass("ON").addClass("OFF");
                $(this).removeClass("ON").addClass("OFF");
            }
        });
    };


    let displayMachine = function (action) {

        if (action) {

            $(".create-own").hide();
            $("#machineSection").slideDown();
            $(".jumbotron").hide();

        } else if (!action) {

            $(".create-own").show();
            $("#machineSection").slideUp();
            $(".jumbotron").show();

        }

    };

    // User Class

    class User {

        constructor(uid, token, user) {
            this.uid = uid;
            this.token = token;
            this.name = user.displayName;
            this.photo = user.photoURL;
            this.userInfos = user;
            this.id_loop = 0;
            this.currentIdLoopDatabase = null;
            this.maps = [];
            this._checkIfAlreadyExist();
        }

        set mapInObject(kit) {
            this.maps.push(kit);
        }

        _checkIfAlreadyExist() {

            let that = this;

            database.child("users/" + this.uid).once("value", function (snap) {
                let exists = (snap.val() !== null);

                if (!exists) {
                    that._createUserToDatabase();
                } else {
                    if (typeof snap.val().loops !== "undefined")
                        that.currentIdLoopDatabase = snap.val().loops.length;
                }

            });

        }

        setMap() {

            let id_push;

            if (this.currentIdLoopDatabase !== null) {
                id_push = this.currentIdLoopDatabase;
                this.currentIdLoopDatabase++;
            } else {
                id_push = this.id_loop;
            }

            database.child("users/" + this.uid + "/loops/" + id_push).set({
                nameOfLoop: this.maps[this.id_loop].name,
                kit: this.maps[this.id_loop]
            });

            database.child("loops/").push({
                uid: this.uid,
                username: this.name,
                userimg: this.photo,
                id_loop: id_push,
                nameOfLoop: this.maps[this.id_loop].name,
                kit: this.maps[this.id_loop]
            });

            this.id_loop++;

        }

        _createUserToDatabase() {

            database.child("users/" + this.uid).set({
                email: this.userInfos.email,
                token: this.token
            });

        }

        _remove_file_extension(name, extensions) {
            var my_extensions = extensions || ["wav","WAV","AIF","aif","mp3","ogg","aac","AAC","OGG"];
            var reg_string = "\.(" + my_extensions.join("|") + ")$";
            var my_reg = new RegExp( reg_string, "i" );
            name = name.replace(my_reg, '');

            return name;
        }

        uploadSounds(files, length){

            let that = this;

            // Let's push to database

            for (let i = 0; i < length; i++) {

                let name = String(files[i].name);
                let nameWithoutExtension = that._remove_file_extension(name)
                    .toLowerCase().replace(/#/, ' ').replace(/\s/g,'');

                soundsRef.child('users/' + that.uid + "/" + nameWithoutExtension + '.wav').put(files[i]).then(function(){

                    myworker.postMessage({newSound: {
                        name: nameWithoutExtension,
                        path: 'users/' + that.uid + "/" + nameWithoutExtension + '.wav',
                    }})

                });

            }

        }
    }

    // A transformer avec handlebars

    let changeButtonCreate = function () {

        $("#createUser").remove();
        $(".create-own .inside-col").append("<button class='button-app' id='createBeat'>Lets Go Again!</button>");

        clickFunctions();

    };

    let clickFunctions = function() {

        $("#createBeat, #makeSound").click(function () {
            displayMachine(true);
        });

    };


    // Firebase functions (auth, database etc..)


    var createUser = function () {

        let provider = new firebase.auth.GoogleAuthProvider();

        firebase.auth().signInWithPopup(provider).then(function (result) {

            let token = result.credential.accessToken;
            let user = result.user;
            let uid = result.user.uid;

            newUser = new User(uid, token, user);

            displayMachine(true);
            changeButtonCreate();
            handlebarsConnect(newUser);

            letUploads();


        }).catch(function (error) {
            var errorMessage = error.message;
            console.log(errorMessage);
        });


    };

    let appendloop = $("#append-loop").html();
    let trackbar = $("#track-bar").html();
    let connexionBlock = $("#connect-user").html();
    let connexionBlockMast = $("#connect-user-master").html();
    let stepsBarBlock = $("#steps-bar").html();

    let loopsBlock = $("#all_loops");

    // All loops here

    let loops = [];

    // Database on_child_added

    let incrementLoop = 0;

    database.child("loops/").limitToLast(7).on("child_added", function (snap) {
        let datas = snap.val();
        loops.push(datas);

        datas.idLoop = incrementLoop++;
        handlebarsUpdateList(datas);
    });




    // ------  HANDLEBARS  ------------------

    // Handlebars Bars Helper

    Handlebars.registerHelper('bar', function (n, block) {

        let nbr = n.barsNbr;
        let name = (typeof n.name !== "undefined") ? n.name : "null";

        let accum = '';
        for (let i = 1; i < (nbr + 1); ++i)
            accum += block.fn({i: i, nbr: nbr, name: name});
        return accum;

    });

    // Handlebars Steps Helper

    Handlebars.registerHelper('step', function (n, block) {

        let nbr = n.barsNbr;

        let accum = '';
        for (let i = 1; i < (nbr + 1); ++i)
            accum += block.fn({i: i, nbr: nbr, widthStep: widthStep});
        return accum;

    });


    // Handlebars Home Loop List

    let handlebarsUpdateList = function (loop) {

        let template = Handlebars.compile(appendloop);
        let theCompiledHtml = template(loop);

        if (loopsBlock.find(".row .list-loop").length == 7) {
            loopsBlock.find(".row .list-loop").last().remove();
        }

        loopsBlock.find(".row").prepend(theCompiledHtml);

        afterListLoad();

    };

    let handlebarsStepsbar = function(){

        let context = {
            infos: {
                barsNbr: barsNbr
            }
        };


        let template = Handlebars.compile(stepsBarBlock);
        let theCompiledHtml = template(context);

        $("#bar").prepend(theCompiledHtml);

        afterCreateObjDom();

    };

    // Handlebars Track Drum Machine

    let handlebarstrackBar = function(obj, add){

        let drumMachine = $("#playerMachine");

        // init

        if(typeof add == "undefined") {

            for (let inst in obj) {
                if (obj.hasOwnProperty(inst)) {

                    let context = {
                        name: inst,
                        infos: {
                            barsNbr: barsNbr,
                            name: inst
                        }

                    };

                    let template = Handlebars.compile(trackbar);
                    let theCompiledHtml = template(context);

                    drumMachine.append(theCompiledHtml);

                }
            }

        } else {

            // add Sounds

            let context = {
                name: obj.name,
                infos: {
                    barsNbr: barsNbr,
                    name: obj.name
                }

            };

            let template = Handlebars.compile(trackbar);
            let theCompiledHtml = template(context);

            drumMachine.append(theCompiledHtml);

        }

        afterCreateObjDom();

    };


    // Handlebars Connect block

    let handlebarsConnect = function (user){

        let template = Handlebars.compile(connexionBlock);
        let template2 = Handlebars.compile(connexionBlockMast);

        let connectBlock = {
            connected: true,
            name: user.name,
            img: user.photo
        };

        let theCompiledHtml = template(connectBlock);
        let theCompiledHtmlMast = template2(connectBlock);

        $('#connexion').html(theCompiledHtml);
        $('.google-connect').html(theCompiledHtmlMast);

        clickFunctions();

    };


    // Upload new sounds to the drum machine

    let letUploads = function () {

        $("#newSound").change(function (inputFile) {

            let files = inputFile.target.files;
            let length = inputFile.target.files.length;

            newUser.uploadSounds(files, length);

        });

    };



});
