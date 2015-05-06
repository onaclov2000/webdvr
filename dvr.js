var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);

var scheduler = require('./scheduler');

var spawn = require('child_process').spawn;
var ipRef = null;
var lookup_channel_data = {};
var current_channel = "";
var scheduled_jobs = [];
var unique_jobs = [];
module.exports = {
    //   lookup_data : 
    start: function() {
        self.channels();
        scheduler.start();

        console.log("Done Initializing");
    },
    channels : function(){
        // Should be a dvr function this is crazy long
        myRootRef.child("channel_data").once('value', function(childSnapshot) {
            var aRef = new Firebase(FB_URL);

            if (childSnapshot.val() === null) {
                console.log("Gathering Tuner Scan Results");
                // TODO, The TUNER should be found programmatically.
                result = spawn('hdhomerun_config', ["103DA852", "scan", "/tuner0"]);
                var temp_data = "";
                result.stdout.on('data', function(data) {
                    temp_data += data;
                });
                result.on('close', function(code) {
                    console.log("Parsing scan results");
                    var scan_results = temp_data.split("\n");
                    for (var i = 0; i < scan_results.length; ++i) {
                        var channel = /us-bcast:(\d+)/.exec(scan_results[i]);
                        if (channel != null) {
                            current_channel = channel[1];
                        }
                        var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(scan_results[i]);
                        if (program != null) {
                            lookup_channel_data[program[2].replace('.', '-')] = [current_channel, program[1], program[3]];
                        }

                    }
                   aRef.update({
                        channel_data: lookup_channel_data
                    });
                    console.log("done loading channel info");
                });

            } else {
                lookup_channel_data = childSnapshot.val();
                console.log("Done Loading Channel Info");
            }

        });
    }
    }
    // A DVR "has a" Tuner, so this should be in a "tuner" file, it should return all the tuners available
    get_tuners: function() {
        myRootRef.child("tuner_info").once('value', function(childSnapshot) {
            var aRef = new Firebase(FB_URL);

            if (childSnapshot.val() === null) {
                result = spawn('hdhomerun_config', ["discover"]);
                var temp_data = "";
                result.stdout.on('data', function(data) {
                    temp_data += data;
                });
                result.on('close', function(code) {
                    console.log(temp_data);
                    aRef.update({
                        tuner_info: temp_data
                    });
                });
         }
     });
},

    
    
    //remains, rename to "channel" probably, so we can lookup a channel via the program
    lookup_channel: function(program) {
        if (lookup_channel_data === null) {
            console.log("Lookup Channel Data Not Setup");
        }
        console.log("Lookup Data " + lookup_channel_data);
        return lookup_channel_data[program];
    }

}

/*
 * Shutting down stuff
 */
function onComplete() {
    process.exit();
}


