var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var spawn = require('child_process').spawn;
var ipRef = null;
var lookup_channel_data = {};
var current_channel = "";
module.exports = {
    //   lookup_data :
    initialize: function() {
        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (k in interfaces) {
            for (k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family == 'IPv4' && !address.internal) {
                    addresses.push(address.address)
                }
            }
        }



        myRootRef.child("channel_data").once('value', function(childSnapshot) {
            console.log(childSnapshot.val());
            var aRef = new Firebase(FB_URL);
            console.log(aRef.toString());

            //   aRef.update({channel_data : lookup_channel_data});


            if (childSnapshot.val() === null) {
                console.log("Gathering Tuner Scan Results");
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
                            //console.log(current_channel);
                        }
                        var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(scan_results[i]);
                        if (program != null) {
                            lookup_channel_data[program[2].replace('.', '-')] = [current_channel, program[1], program[3]];
                            //console.log(program[2]);
                        }

                    }
                    console.log(lookup_channel_data);
                    aRef.update({
                        channel_data: lookup_channel_data
                    });
                    console.log("done loading channel info");
                });

            } else {
                lookup_channel_data = childSnapshot.val()
            }
        });
        // Push my IP to firebase
        // Perhaps a common "devices" location would be handy
        // Need to consider if we have n dvr's load at this address
        ipRef = myRootRef.child("devices").push({
            "type": "local",
            "ip": addresses[0]
        });



        // first time let's make sure we have a legit listing
        if (!myRootRef.tvguide) {
            tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
                myRootRef.update({
                    "tvguide": result
                });
            });

        }

        console.log("Done");
    },
    tuner: function(date, duration) {
        return 0;
    },
    schedule: function(date, ref_val, channel_val, length_val, title_val, id_val) {
        var self = this
        var tuner_index = self.tuner(date, length_val);
        var j = schedule.scheduleJob(date, function(ref, channel, length, title, id, tuner) {
            tvguide.get_name(id, function(result) {
                var filename = result;
                var info = self.lookup_channel(channel);
                ref.update({
                    "state": "recording"
                });
                console.log("Recording title " + title + " for " + length / 60 + "minutes");
                record = spawn('./record.sh', [filename, info[0], info[1], length, tuner]);

                record.stdout.on('data', function(data) {
                    console.log(data.toString());
                });

                record.on('close', function(code) {
                    ref.update({
                        "state": "waiting"
                    });
                });
            });
        }.bind(null, ref_val, channel_val, length_val, title_val, id_val, tuner_index));
        console.log(j);
    },
    cleanup: function() {
        return function() {
            ipRef.remove(onComplete);
        }
    },
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
