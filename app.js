var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var os = require('os')
var spawn = require('child_process').spawn;
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var myRootRef = new Firebase(FB_URL);
var dvr = require('./dvr')

dvr.initialize();

var rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 59;
var j = schedule.scheduleJob(rule, function() {
    tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
        myRootRef.update({
            "tvguide": result
        });
    });
});

myRootRef.child("jobs").once('value', function(childSnapshot) {
     if (childSnapshot.val() != null){
        // console.log("YAY we have data");
        // console.log(childSnapshot.val());
         for (var key in childSnapshot.val()){
          // console.log(key);
           var x = childSnapshot.val()[key];
          // console.log(x);
           if (myRootRef != null){
              console.log(new Date(x["date"]));
              var Today = new Date().getTime();
              var schedule = new Date(x["date"]).getTime();
            //  console.log(Today);
             // console.log(schedule);
              if (schedule + (x["length"] * 1000) > Today){
//                 console.log(new Date(x["date"]));
  //               console.log(x["channel"]);
    //             console.log(x["length"]);
      //           console.log(x["title"]);
                 dvr.schedule(new Date(x["date"]), myRootRef, x["channel"], x["length"], x["title"], x["id"]);
              }
              else{
                 myRootRef.child("jobs").child(key).remove();
                 console.log("old Show");
              }

           }
           else{
              console.log("Ref is null");
          }
        }
     }
     else{
       console.log(childSnapshot.val());
     }
     
});

myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
    // code to handle child data changes.
    var data = childSnapshot.val();
    var localref = childSnapshot.ref();
    if (data["commanded"] == "new") {
        localref.update({
            "commanded": "waiting"
        });
        var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);

        console.log("New Schedule Added " + data["title"] + " @");
        console.log(date);
        // queue in this case means we need to make sure we keep track of all our recordings
        // I'm open to new names but this will be sufficient for now
        dvr.queue(date, data["program"], data["length"], data["title"], data["id"]);
        dvr.schedule(date, localref, data["program"], data["length"], data["title"], data["id"]);

    }
});

// Do something when app is closing
process.on('exit', dvr.cleanup());

process.stdin.resume(); //so the program will not close instantly

//catches ctrl+c event
process.on('SIGINT', dvr.cleanup());

//catches uncaught exceptions
process.on('uncaughtException', dvr.cleanup());
