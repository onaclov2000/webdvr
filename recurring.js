var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var disk = require('./disk');
var tuner = require('./tuner');
var tvguide = require('./tvguide');
var Queue = require('./fb_queue');
var job_queue = new Queue('jobs');
var recurring = [];
var child_changed_occurances = 0;
// Recurring has been simplified, and "cache" functions for a few of these are now in use.
// Are they the right solution? I think so, for example, the "channel" from the tuner will only be setup the first time you start the device application
// the first time we run "recurring" the lineup has been retrieved, the next time we only update when the tvguide FB data changes, which implies
// that the data is static once again, no point in doing anything.
var schedule = function () {
    console.log("Time to find any recurring shows and add them to our job queue.");
    var channel = tuner.cached_channel();
    //console.log("Cached Channels");
    //console.log(channel);
    var lineup = tvguide.cached_lineup();
    //console.log("Cached Lineup");
    //console.log(lineup);
    // get the disk time
    disk.time(function (disk_time) {
        var element;
        var shows;
        var show;
        for (element in recurring) {
            console.log(recurring[element]);
            shows = tvguide.find(lineup, recurring[element]);
            console.log("SHOWS");
            console.log(shows);

            for (show in shows) {
                console.log(show);
                console.log(shows[show]);
                console.log(channel);
                console.log(channel[shows[show].channel]);
                shows[show].station = channel[shows[show].channel][0];
                shows[show].program = channel[shows[show].channel][1];
                console.log("Disk Time: " + disk_time);
                console.log(shows[show]);
                if (job_queue.duration() + shows[show].length / 60 < disk_time) {
                    job_queue.add(shows[show]);
                }
            }

        }
    });
    return "Success";
};

var start = function(result){
  //I'm not sure if this will work "correctly" but basically go get all the recurring elements, then go through them with the existing lineups etc.
  myRootRef.child("recurring").on('value', function (childSnapshot) {
    console.log("Initialize Recurring List");
    childSnapshot.forEach(function (dataSnapshot) {
        var key = dataSnapshot.val();
        // replace with for loopsearch
        if (recurring.indexOf(key.search) === -1) {
            recurring.push(key.search);
        }
    });
    schedule();
  });
  
  myRootRef.child("tvguide").on('child_changed', function () {
    console.log('TV Guide has changed, checking for recurring programs to record.');
    child_changed_occurances = child_changed_occurances + 1;
    console.log("This has been called: " + child_changed_occurances);
    schedule();
  });
  result("Success");
};
            
module.exports = {
    start: start
};