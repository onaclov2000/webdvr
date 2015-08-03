/*jslint node: true */
//"use strict";
var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var spawn = require('child_process').spawn;
//var hdhomerun_config = "./test/hdhomerun_config.sh";
var hdhomerun_config = "hdhomerun_config";
var pkg_name = "";
var pkg_count = -1;
var pkg_channel = {};

var name = function (return_value) {
    if (pkg_name === "") {
        // Spawn and get this info in the future.
        var result = spawn(hdhomerun_config, ["discover"]);
        var temp_data = "";
        result.stdout.on('data', function (data) {
            temp_data += data;
        });
        result.on('close', function (code) {
            var scan_results = temp_data.split(" ");
            pkg_name = scan_results[2];
            console.log({name : {code : code}});
            return_value(scan_results[2]);
        });
    } else {
        return_value(pkg_name);
    }
};

// 0 based count
var count = function (return_value) {
    if (pkg_count === -1) {
        name(function (local_name) {
            console.log(local_name);
            var result = spawn(hdhomerun_config, [local_name, "get", "/sys/debug/"]);
            var temp_data = "";
            var res = "";
            var i;
            var tuner_count;
            result.stdout.on('data', function (data) {
                temp_data += data;
            });
            result.on('close', function (code) {
                var scan_results = temp_data.split("\n");
                for (i = 0; i < scan_results.length; i += 1) {
                    tuner_count = "";
                    tuner_count = /^t(\d+): pt=(\d+) cal=/.exec(scan_results[i]);
                    if (tuner_count != null) {
                        pkg_count = tuner_count[1];
                        res = tuner_count[1];
                    }
                }
                console.log({count : {code : code}});
                return_value(res);
            });
        });
    } else {
        return_value(pkg_count);
    }
};

var cached_channel = function () {
    return pkg_channel;
};

var channel = function (return_value) {
    if (Object.keys(pkg_channel).length === 0) {
        myRootRef.child("channel_data").once('value', function (childSnapshot) {
            var i;
            if (childSnapshot.val() === null || childSnapshot.val() === "") {
                console.log("Made it to Inside of Channel");
                name(function (local_name) {
                    // The TUNER should be found programmatically.
                    console.log("Made it to Name Inside of Channel");
                    var result = spawn(hdhomerun_config, [local_name, "scan", "/tuner0"]);
                    var temp_data = "";
                    result.stdout.on('data', function (data) {
                        temp_data += data;
                    });
                    result.on('close', function (code) {
                        console.log("Parsing scan results");
                        var scan_results = temp_data.split("\n");
                        console.log(scan_results);
                        var current_channel = "";
                        for (i = 0; i < scan_results.length; i += 1) {
                            var xchannel = /us-bcast:(\d+)/.exec(scan_results[i]);
                            if (xchannel != null) {
                                current_channel = xchannel[1];
                                console.log(current_channel);
                            }
                            var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(scan_results[i]);
                            console.log(scan_results[i]);
                            if (program != null) {
                                console.log("Program is not null!");
                                console.log(program);
                                pkg_channel[program[2].replace('.', '-')] = [current_channel, program[1], program[3]];
                                console.log(pkg_channel);
                            }
                        }
                        console.log("Finished Getting Channels");
                        console.log(pkg_channel);
                        if (Object.keys(pkg_channel).length !== 0){
                           myRootRef.update({
                               channel_data: pkg_channel
                           });
                        }
                        return_value(pkg_channel);
                    });
                });
            } else {
                pkg_channel = childSnapshot.val();
                return_value(pkg_channel);
            }
        });
    } else {
        return_value(pkg_channel);
    }
};

var tune = function (tuner_index, tune_channel, tune_program) {
    //hdhomerun_config 103DA852 set /tuner$5/channel auto:$2
    //hdhomerun_config 103DA852 set /tuner$5/program $3
    name(function (local_name) {
        result = spawn(hdhomerun_config, [local_name, "set", "/tuner" + tuner_index + "/channel auto:" + tune_channel]);
        var temp_data = "";
        result.stdout.on('data', function (data) {
            temp_data += data;
        });
        result.on('close', function (code) {
            var scan_results = temp_data.split("\n");
            // figure out if we changed channels
            var progtemp_data = "";

            progresult = spawn(hdhomerun_config, [local_name, "set", "/tuner" + tuner_index + "/program " + tune_channel]);
            progresult.stdout.on('data', function (data) {
                progtemp_data += data;
            });
            progresult.on('close', function (code) {
                // figure out if we changed channels
            });
        });
    });

};


// The scheduler should have a "conflict resolution"
var conflict = function (date, duration, scheduled_jobs) {
    var return_val = 0; // always try to return 0 by default
    var number_of_tuners = 1; // really base 0, so 2 tuners should be determined at initialization, but for now this will work.
    if (scheduled_jobs != null) {
        //1. Look through all scheduled tasks and look for a date that is during the date time + duration (overlapping).
        //1a. If none exists, then return 0
        //1b. If only one exists, check the tuner identifier, if it's 0 return 1
        //1b. If more than one exists, set fb/conflict list
        for (var key in scheduled_jobs) {
            // If the scheduled job is before this job
            if (conflict(scheduled_jobs[key]["date"], scheduled_jobs[key]["length"], date, duration)) {
                // total conflicts - 1 means we have had more conflicts than tuners and have to fail
                if (return_val == number_of_tuners - 1) {
                    //we can't recover
                    return -1;
                } else {
                    return_val++;
                }
            }
        }
    }
    return return_val;
};


var start = function (result) {
    name(function (res) {
        count(function (res) {
            channel(function (res) {
                result("success");
            }); // end channel
        }); // end count

    }); // end name
};

module.exports = {
    name: name,
    count: count,
    channel: channel,
    tune: tune,
    start: start,
    cached_channel: cached_channel,
    conflict: conflict
};