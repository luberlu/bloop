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

        let database = firebase.database().ref("xmusic");


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
        }

        if(typeof datas.bpmCount !== "undefined"){
            displayBpm(datas.bpmCount)
        }
    };

    // DOM

    // variables

    let drummachine = $("#machine");
    let playbtn = $("#play");
    let stopbtn = $("#stop");
    let bpmInput = $("#bpm");


    // DOM Functions

    let createDrum = function(obj){

        drummachine.append("<form id='playerMachine'></form>");
        let player = $("#playerMachine");

        for(let inst in obj){
            player.append("<fieldset id='"+ inst + "'><label>" + inst + "</label></fieldset>");

            // bar structure

            let constructBar = function(label, nbr){

                return '<label>' +
                       '<input type="checkbox" name="'+ label +'" id="kick" value="' + nbr + '" /><span>' +
                        label + (nbr + 1) + '</span>' +
                       '</label>';
            };

            let i = 0;
            while(i < barsNbr){
                $("fieldset#" + inst).append(constructBar(inst, i));
                i++;
            }
        }

        let i = 0;
        let widthStep = (1/barsNbr) * 100;

        while(i < barsNbr){

            $("#bar").append("<div class='steps' id='step_" + (i + 1) + "' " +
                "style='width:" + widthStep + "%'></div>");
            i++;
        }

    };

    let displayBpm = function(BpmCounter){

        $(".steps").removeClass("on");
        $("#step_" + BpmCounter).addClass("on");
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

    $('#playerMachine').change(function(){

        console.log($(this));

    });


});
