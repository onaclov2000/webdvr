var scheduler = require('./scheduler');
var tuner = require('./tuner');
var tvguide = require('./tvguide');

var start = function() {
    tuner.start(function(res) {
        console.log("Tuner Start..." + res);
        tvguide.start(function(res) {
            console.log("tvguide Start..." + res);
            scheduler.start(function(res) {
                console.log("Scheduler Start..." + res);
            }); // end scheduler
        }); // end tv guide

    }); // end tuner

}

module.exports = {
    start: start
}
