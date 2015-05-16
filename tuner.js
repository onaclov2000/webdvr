var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var spawn = require('child_process').spawn;
//var hdhomerun_config = "./test/hdhomerun_config.sh";
var hdhomerun_config = "hdhomerun_config";
var _name = "";
var _count = -1;
var _channel = "";

var start = function(result) {
    name(function(res) {
        count(function(res) {
            channel(function(res) {
                result("success");
            }); // end channel
        }); // end count

    }); // end name
}
var name = function(return_value) {
    if (_name === "") {
        // Spawn and get this info in the future.
        var result = spawn(hdhomerun_config, ["discover"]);
        var temp_data = "";
        result.stdout.on('data', function(data) {
            temp_data += data;
        });
        result.on('close', function(code) {
            var scan_results = temp_data.split(" ");
            _name = scan_results[2];
            return_value(scan_results[2]);
        });
    } else {
        return_value(_name);
    }
}

// 0 based count
var count = function(return_value) {
    if (_count == -1) {
        name(function(local_name) {
            var result = spawn(hdhomerun_config, [local_name, "get", "/sys/debug/"]);
            var temp_data = "";
            var res = "";
            result.stdout.on('data', function(data) {
                temp_data += data;
            });
            result.on('close', function(code) {
                var scan_results = temp_data.split("\n");

                for (var i = 0; i < scan_results.length; ++i) {
                    var tuner_count = /^t(\d+): pt=(\d+) cal=/.exec(scan_results[i]);
                    if (tuner_count != null) {
                        _count = tuner_count[1];
                        res = tuner_count[1];
                    }
                }
                return_value(res);
            });
        });
    } else {
        return_value(_count);
    }
}
var channel = function(return_value) {
    if (_channel == "") {
        myRootRef.child("channel_data").once('value', function(childSnapshot) {
            var aRef = new Firebase(CONFIG.FB_URL);
            if (childSnapshot.val() === null) {
                name(function(local_name) {
                    // TODO, The TUNER should be found programmatically.
                    result = spawn(hdhomerun_config, [local_name, "scan", "/tuner0"]);
                    var temp_data = "";
                    result.stdout.on('data', function(data) {
                        temp_data += data;
                    });
                    result.on('close', function(code) {
                        console.log("Parsing scan results");
                        var scan_results = temp_data.split("\n");
                        for (var i = 0; i < scan_results.length; ++i) {
                            var xchannel = /us-bcast:(\d+)/.exec(scan_results[i]);
                            if (xchannel != null) {
                                current_channel = xchannel[1];
                            }
                            var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(scan_results[i]);
                            if (program != null) {
                                _channel[program[2].replace('.', '-')] = [current_channel, program[1], program[3]];
                            }
                        }
                        aRef.update({
                            channel_data: _channel
                        });
                        return_value(_channel);
                    });
                });
            } else {
                _channel = childSnapshot.val();
                return_value(_channel);
            }
        });
    } else {
        return_value(_channel);
    }
}

var tune = function(tuner_index, tune_channel, tune_program) {
    //hdhomerun_config 103DA852 set /tuner$5/channel auto:$2
    //hdhomerun_config 103DA852 set /tuner$5/program $3
    name(function(local_name) {
        result = spawn(hdhomerun_config, [local_name, "set", "/tuner" + tuner_index + "/channel auto:" + tune_channel]);
        var temp_data = "";
        result.stdout.on('data', function(data) {
            temp_data += data;
        });
        result.on('close', function(code) {
            var scan_results = temp_data.split("\n");
            // figure out if we changed channels
            var progtemp_data = "";

            progresult = spawn(hdhomerun_config, [local_name, "set", "/tuner" + tuner_index + "/program " + tune_channel]);
            progresult.stdout.on('data', function(data) {
                progtemp_data += data;
            });
            progresult.on('close', function(code) {
                // figure out if we changed channels
            });
        });
    });

}

module.exports = {
    name: name,
    count: count,
    channel: channel,
    tune: tune,
    start: start
}
