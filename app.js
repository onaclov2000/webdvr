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
    // I picked 25 hours as my rotation, this way I get enough coverage each night at midnight, to cover into the next morning a hair.
    tvguide.get(Math.floor((new Date).getTime() / 1000), 1500, function(result) {
        myRootRef.update({
            "tvguide": result
        });
        // I'm thinking here we queue a list of series.
        // And possibly schedule it
            
        data = tvguide.shows(result, "Big Bang Theory", function(_shows) {
        for (item in _shows){
           data = _shows[item];
           var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
           self.queue(date, data["program"], data["length"], data["title"], data["id"]);
           self.schedule(date, myRootRef, data["program"], data["length"], data["title"], data["id"]);
        }
            });
    });
});

myRootRef.child("jobs").once('value', function(childSnapshot) {
     if (childSnapshot.val() != null){
         for (var key in childSnapshot.val()){
           var x = childSnapshot.val()[key];
           if (myRootRef != null){
              var Today = new Date().getTime();
              var schedule = new Date(x["date"]).getTime();
              if (schedule + (x["length"] * 1000) > Today){
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
       console.log("No Outstanding Jobs Left To Schedule");
     }
     
});

// add loop to schedule when starting up.

// When we see that a commanded record has taken place we should do something about it
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
// Here's where I'm torn. I need to call dvr.cleanup as well, not sure if this will work 
// if I add it.
//process.on('uncaughtException', dvr.cleanup_error(err));
process.on('uncaughtException', function(err) {
  console.error(err.stack);
  dvr.cleanup();
});
