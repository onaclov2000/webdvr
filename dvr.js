var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
var tvguide = require('./tvguide');
var spawn = require('child_process').spawn;
var ipRef = null;
var lookup_channel_data = {};

module.exports = {
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




        result = spawn('hdhomerun_config', ["103DA852", "scan", "/tuner0"]);
        var current_program = null;


        result.stdout.on('data', function(data) {
            var channel = /us-bcast:(\d+)/.exec(data.toString());
            if (channel != null) {
                current_channel = channel[1];
            }
            var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(data.toString());
            if (program != null) {
                lookup_channel_data[program[2]] = [current_channel, program[1], program[3]];
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
                console.log(result[0].Channel);
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
        return lookup_channel_data[program];
    }

}

/*
 * Shutting down stuff
 */
function onComplete() {
    process.exit();
}
