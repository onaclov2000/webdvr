var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
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




        console.log("Gathering Tuner Scan Results");
        result = spawn('hdhomerun_config', ["103DA852", "scan", "/tuner0"]);


        var temp_data = "";
        result.stdout.on('data', function(data) {
            temp_data += data;
            //   var channel = /us-bcast:(\d+)/.exec(data.toString());
            //   if (channel != null){
            //      console.log(channel[1]);
            //   }
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
                    lookup_channel_data[program[2]] = [current_channel, program[1], program[3]];
                    //console.log(program[2]);
                }

            }
            console.log(lookup_channel_data);
            console.log("done loading channel info");
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
        //console.log("Lookup Data " + lookup_channel_data);
        return lookup_channel_data[program];
    }

}

/*
 * Shutting down stuff
 */
function onComplete() {
    process.exit();
}
