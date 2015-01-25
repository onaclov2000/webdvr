var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
var tvguide = require('./tvguide');

var ipRef = null;

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
    }
}

/*
 * Shutting down stuff
 */
function onComplete() {
    process.exit();
}
