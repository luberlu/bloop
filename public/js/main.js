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

            if(datas.added == false)
                createDrum(datas.drum);
            else
                addSound(datas.drum);

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
    };

    // all sounds Array to new Audio Obj

    let sounds = {
        sources: [],
        audioObjects: []
    };


    // Play sound html5

    var playSound = function (link) {
        sounds.audioObjects[link.toLowerCase()].play();
    };

    // DOM

    // variables

    let playbtn = $("#play");
    let stopbtn = $("#stop");
    let bpmInput = $("#bpm");
    let nameInput = $("#nameLoop");
    let widthStep = (1 / barsNbr) * 100;

    // DOM Functions

    let constructBar = function (label, nbr) {

        return '<label style="width:' +
            widthStep + '%; height:100%">' +

            '<input type="checkbox" name="' + label + '" id="' + label + '_' + nbr + '" value="' + nbr + '" /><span>' +
            label + nbr + '</span>' +
            '</label>';
    };

    let createDrum = function (obj) {

        let player = $("#playerMachine");

        for (let inst in obj) {
            player.append("<fieldset id='" + inst + "'><label>" + inst + "</label></fieldset>");

            // bar structure

            let i = 1;
            while (i < (barsNbr + 1)) {
                $("fieldset#" + inst).append(constructBar(inst, i));
                i++;
            }
        }

        let i = 0;

        while (i < barsNbr) {

            $("#bar").append("<div class='steps' id='step_" + (i + 1) + "' " +
                "style='width:" + widthStep + "%'></div>");
            i++;
        }

        afterCreateObjDom();


    };

    let addSound = function (obj){

        let player = $("#playerMachine");

        for (let inst in obj) {
            player.append("<fieldset id='" + inst + "'><label>" + inst + "</label></fieldset>");

            let i = 1;
            while (i < (barsNbr + 1)) {
                $("fieldset#" + inst).append(constructBar(inst, i));
                i++;
            }

        }

    };

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

    $("#createUser, #createUser-masthead").click(function () {
        createUser();
    });

    $("#saveMap").click(function () {
        myworker.postMessage({saveAction: true});
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

                $(".list-loop").removeClass("ON").addClass("OFF");
                $(".play-loop").removeClass("ON").addClass("OFF");

                $(this).closest(".list-loop").removeClass("OFF").addClass("ON");
                $(this).removeClass("OFF").addClass("ON");

            } else {
                myworker.postMessage({playloop: false});

                $(".list-loop").removeClass("ON").addClass("OFF");
                $(".play-loop").removeClass("ON").addClass("OFF");

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

            // Let's push to database

            for (let i = 0; i < length; i++) {

                let name = String(files[i].name);
                let nameWithoutExtension = this._remove_file_extension(name).toLowerCase().replace(/\s/g,'');

                soundsRef.child('users/' + this.uid + "/" + nameWithoutExtension + '.wav').put(files[i]);
                myworker.postMessage({newSound: {
                    name: nameWithoutExtension,
                    path: 'users/' + this.uid + "/" + nameWithoutExtension + '.wav',
                }})
            }

        }
    }

    let changeButtonCreate = function () {
        $("#createUser").remove();
        $(".create-own .inside-col").append("<button id='createBeat'>Lets Go Again!</button>");

        $("#createBeat").click(function () {
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

            letUploads();


        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;

            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;

            console.log(errorMessage);

        });


    };

    let appendloop = $("#append-loop").html();
    let loops = [];

    // Database on_child_added

    let incrementLoop = 0;

    database.child("loops/").limitToLast(7).on("child_added", function (snap) {
        let datas = snap.val();
        loops.push(datas);

        datas.idLoop = incrementLoop++;
        handlebarsUpdateList(datas);
    });


    // Handlebars

    let handlebarsUpdateList = function (loop) {
        let template = Handlebars.compile(appendloop);
        let theCompiledHtml = template(loop);

        if ($('#all_loops .row .list-loop').length == 7) {
            $('#all_loops .row .list-loop').last().remove();
        }

        $('#all_loops .row').prepend(theCompiledHtml);
        afterListLoad();
    };

    // Handlebars Bar Helper

    Handlebars.registerHelper('bar', function (n, block) {
        let accum = '';
        for (var i = 0; i < n; ++i)
            accum += block.fn({i: i, n: n});
        return accum;
    });


    // Upload new sounds to the drum machine

    let letUploads = function () {

        $("#newSound").change(function (inputFile) {

            let files = inputFile.target.files;
            let length = inputFile.target.files.length;

            newUser.uploadSounds(files, length);

        });

    }


});
