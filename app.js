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
dvr.lookup_channel("2.1");
var j = schedule.scheduleJob(rule, function() {
    tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
        myRootRef.update({
            "tvguide": result
        });
    });
});

myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
    // code to handle child data changes.
    var data = childSnapshot.val();
    var localref = childSnapshot.ref();
    if (data["commanded"] == "new") {
        localref.update({
            "commanded": "waiting"
        });
        console.log("New Schedule Added " + data["title"] + " @");

        var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
        console.log(date);
        var j = schedule.scheduleJob(date, function(ref, channel, length, title) {
            var filename = title;
            var info = dvr.lookup_channel(channel);

            console.log(new Date());
            ref.update({
                "state": "recording"
            });

            console.log("title " + title + " for " + length + "seconds");
            result = spawn('./record.sh', [filename, info[0], info[1], length]);

            result.stdout.on('data', function(data) {
                console.log(data);
            });

            result.on('close', function(code) {
                r.update({
                    "state": "waiting"
                });
            });

        }.bind(null, localref, data["channel"], data["length"], data["title"]));
    }
});

// Do something when app is closing
process.on('exit', dvr.cleanup());

process.stdin.resume(); //so the program will not close instantly

//catches ctrl+c event
process.on('SIGINT', dvr.cleanup());

//catches uncaught exceptions
process.on('uncaughtException', dvr.cleanup());
