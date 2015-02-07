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
