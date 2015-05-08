// will be a "module" eventually, but this code grabs the json stream
// This module should ONLY gather raw data from tvguide, and preferrably cache it to about 30 minutes. If you want to translate the data we should have a "filter" file/function that does that.
var http = require("http");
var sanitize = require("sanitize-filename");
var CONFIG = require('./config');
var schedule = require('node-schedule');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);

var start = function(res) {
    var rule = new schedule.RecurrenceRule();
    rule.hour = CONFIG.UPDATE_FREQUENCY.hour;
    rule.minute = CONFIG.UPDATE_FREQUENCY.minute;
    var j = schedule.scheduleJob(rule, function() {
        lineup(CONFIG.UPDATE_FREQUENCY.duration, function(res) {
           res("Success");
        });
    });
    res("Success");
}


var lineup = function(duration, res) {
    get(Math.floor((new Date).getTime() / 1000), duration, function(result) {
        myRootRef.update({
            "tvguide": result
        });
        res(result);
    });

    
}


var get = function(date, length, callback) {
        var start = date;

        var options = {
            host: 'mobilelistings.tvguide.com',
            port: 80,
            path: '/Listingsweb/ws/rest/schedules/' + CONFIG.ANTENNA + '/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullName%2CNumber%2CSourceId&ScheduleFields=ProgramId%2CEndTime%2CStartTime%2CTitle%2CAiringAttrib%2CCatId&formattype=json&disableChannels=music%2Cppv%2C24hr&inclchTypeMask=16'
        };

        http.get(options, function(res) {
            var str = "";
            res.on('data', function(chunk) {
                str += chunk;
            });
            res.on('end', function() {
                callback(JSON.parse(str));

            });
        });
    }
    // Need to remove duplicates
var find = function(entire_listing, show, callback) {
    var res = [];
    console.log(show);
    for (key in entire_listing) {
        // grab the index.
        for (item in entire_listing[key]["ProgramSchedules"]) {
            if (entire_listing[key]["ProgramSchedules"][item]["Title"].indexOf(show) > -1) {
                startTime = entire_listing[key]["ProgramSchedules"][item]["StartTime"];
                endTime = entire_listing[key]["ProgramSchedules"][item]["EndTime"];
                var scheduledDate = new Date((startTime - 120) * 1000);
                // always record 2 minutes before and 2 minutes after approx
                var duration = (endTime - startTime) + 240;
                res.push({
                    // Firebase Workaround for not allowed to have .'s in paths
                    channel: entire_listing[key]["Channel"]["Number"].replace('.', '-'),
                    date : scheduledDate.getTime(),
                    length: duration,
                    id: entire_listing[key]["ProgramSchedules"][item]["ProgramId"],
                    title: entire_listing[key]["ProgramSchedules"][item]["Title"]
                });
            }
        }
    }
    callback(res);
}

//        http://mobilelistings.tvguide.com/Listingsweb/ws/rest/airings/20385.268435456/start/1422793800/duration/20160/search?search=Big%20Bang%20Theory&formattype=json
var search = function(program_name, callback) {
    var options = {
        host: 'mobilelistings.tvguide.com',
        port: 80,
        path: '/Listingsweb/ws/rest/airings/20385.268435456/start/1422793800/duration/20160/search?search=' + program_name
    };

    http.get(options, function(res) {
        var str = "";
        res.on('data', function(chunk) {
            str += chunk;
        });
        res.on('end', function() {
            var result = JSON.parse(str);
            callback(result);
        });
    });
}
var name = function(id, res) {
    //          http://mapi.tvguide.com/listings/details?program=

    var options = {
        host: 'mapi.tvguide.com',
        port: 80,
        path: '/listings/details?program=' + id
    };

    http.get(options, function(result) {
        var str = "";
        result.on('data', function(chunk) {
            str += chunk;
        });

        result.on('end', function() {
            var result = JSON.parse(str);
            sanatize_name(result["program"], function(locresult) {
               console.log(locresult); 
               res(locresult);
            });

        });
    });
}

var sanatize_name = function(program, res) {
    if (program != null) {
        if (program["season"] != null && program["episode"] != null && program["episode_title"] != null) {
            res(sanitize("S" + program["season"] + ".E" + program["episode"] + "." + program["title"] + "." + program["episode_title"]).replace(/ /g, "_"));
            return;
        }
        if (program["episode_title"] != null) {
            res(sanitize(program["episode_title"]).replace(/ /g, "_"));
            return;
        } else {
            res(sanitize(program["title"]).replace(/ /g, "_"));
            return;
        }
    }
}

module.exports = {
    start: start,
    lineup: lineup,
    find: find,
    name: name
}
