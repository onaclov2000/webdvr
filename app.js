var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var os = require('os')
var spawn = require('child_process').spawn;
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var myRootRef = new Firebase(FB_URL);
var dvr = require('./dvr')


// Initialize the DVR, wait until the channels are all found first too.
dvr.initialize();

var rule = new schedule.RecurrenceRule();
rule.hour = 23;
rule.minute = 59;
// Schedule an update of the fb data for midnight each day.
var j = schedule.scheduleJob(rule, function() {
    tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
        myRootRef.update({
            "tvguide": result
        });
    });
});
// Keep on top of changes with FB
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
        var j = schedule.scheduleJob(date, function(ref, channel, length, title, id) {
            tvguide.get_name(id, function(result) {
                var filename = result;
                // console.log("channel" + channel);
                var info = dvr.lookup_channel(channel);
                // console.log(new Date());
                ref.update({
                    "state": "recording"
                });

                console.log("Recording title " + title + " for " + length / 60 + "minutes");
                record = spawn('./record.sh', [filename, info[0], info[1], length, 0]);

                record.stdout.on('data', function(data) {
                    console.log(data.toString());
                });

                record.on('close', function(code) {
                    ref.update({
                        "state": "waiting"
                    });
                });
            }); 
        // Binding is a really handy way to keep data around that could change in the future
        }.bind(null, localref, data["program"], data["length"], data["title"], data["id"]));
    }
});

// Do something when app is closing
process.on('exit', dvr.cleanup());

process.stdin.resume(); //so the program will not close instantly

//catches ctrl+c event
process.on('SIGINT', dvr.cleanup());

//catches uncaught exceptions
process.on('uncaughtException', dvr.cleanup());
