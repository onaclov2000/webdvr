/*jslint node: true */
"use strict";
// will be a "module" eventually, but this code grabs the json stream
// This module should ONLY gather raw data from tvguide, and preferrably cache it to about 30 minutes. If you want to translate the data we should have a "filter" file/function that does that.
var http = require("http");
var sanitize = require("sanitize-filename");
var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var filter = require('./filter');
var tuner = require('./tuner');
var local_cache_lineup = [];

var get = function (date, length, callback) {
        var start = date;
        var a;
        var options = {
            host: 'mobilelistings.tvguide.com',
            port: 80,
            path: '/Listingsweb/ws/rest/schedules/' + CONFIG.ANTENNA + '/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullName%2CNumber%2CSourceId&ScheduleFields=ProgramId%2CEndTime%2CStartTime%2CTitle%2CAiringAttrib%2CCatId&formattype=json&disableChannels=music%2Cppv%2C24hr&inclchTypeMask=16'
        };

        http.get(options, function (res) {
            var str = "";
            res.on('data', function (chunk) {
                str += chunk;
            });
            res.on('end', function () {
                try {
                    a = JSON.parse(str);
                } catch (e) {
                    console.log(str); //error in the above string(in this case,yes)!
                    a = [];
                }
                callback(a);

            });
        });
    };
    
var lineup = function (duration, refresh, res) {
    if (refresh === true) {
        get(Math.floor(new Date().getTime()) / 1000, duration, function (result) {
            var chan = tuner.cached_channel();
            var temp1 = filter.channels(chan, result);
            var temp2 = filter.shows(temp1);
            myRootRef.update({
                "tvguide": temp2
            });
            console.log('refreshed cache');
            local_cache_lineup = temp2;
            res(temp2);
        });
    } else {
        console.log("returned cache");
        res(local_cache_lineup);
    }
};

var start = function (ret) {
    setInterval(function () {
        lineup(CONFIG.UPDATE_FREQUENCY.duration, true, function (res) {
            console.log("Updated Lineup");
        });
    }, CONFIG.UPDATE_FREQUENCY.interval);
    lineup(CONFIG.UPDATE_FREQUENCY.duration, true, function (res) {
        console.log("Updated Lineup");
        ret("Success");
    });

};


/*
var provider = function(zip, callback){


        var options = {
            host: 'mobilelistings.tvguide.com',
            port: 80,
            path: '/Listingsweb/ws/rest/serviceproviders/zipcode/' + zip + '?formattype=json'
        };
        http.get(options, function(res) {
            var str = "";
            res.on('data', function(chunk) {
                str += chunk;
            });
            res.on('end', function() {
               var temp = JSON.parse(str);
               for (element in temp)
               {
                 if temp[element].indexOf("broadcast") > -1){
                    console.log(temp[element]);
                 }
               }
               callback();
            });
        });
}

*/
var cached_lineup = function () {
    return local_cache_lineup;
};

    // Need to remove duplicates
var find = function (entire_listing, show) {
    var res = [];
    console.log("Searching for show" + show);
    for (var key in entire_listing) {
        // grab the index.
        for (var item in entire_listing[key]["ProgramSchedules"]) {
            if (entire_listing[key]["ProgramSchedules"][item]["Title"].indexOf(show) > -1) {
                console.log(entire_listing[key]["ProgramSchedules"][item]["Title"]);
                var startTime = entire_listing[key]["ProgramSchedules"][item]["StartTime"];
                var endTime = entire_listing[key]["ProgramSchedules"][item]["EndTime"];
                res.push({
                    // Firebase Workaround for not allowed to have .'s in paths
                    channel: entire_listing[key]["Channel"]["Number"].replace('.', '-'),
                    date: startTime,
                    length: (endTime - startTime),
                    startTime: startTime,
                    endTime: endTime,
                    id: entire_listing[key]["ProgramSchedules"][item]["ProgramId"],
                    title: entire_listing[key]["ProgramSchedules"][item]["Title"]
                });
            }
        }
    }
    return res;
};

//        http://mobilelistings.tvguide.com/Listingsweb/ws/rest/airings/20385.268435456/start/1422793800/duration/20160/search?search=Big%20Bang%20Theory&formattype=json
var search = function (program_name, callback) {
    var options = {
        host: 'mobilelistings.tvguide.com',
        port: 80,
        path: '/Listingsweb/ws/rest/airings/20385.268435456/start/1422793800/duration/20160/search?search=' + program_name
    };

    http.get(options, function (res) {
        var str = "";
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('end', function () {
            var result = JSON.parse(str);
            callback(result);
        });
    });
};
var name = function (id, res) {
    //          http://mapi.tvguide.com/listings/details?program=

    var options = {
        host: 'mapi.tvguide.com',
        port: 80,
        path: '/listings/details?program=' + id
    };

    http.get(options, function (result) {
        var str = "";
        result.on('data', function (chunk) {
            str += chunk;
        });

        result.on('end', function () {
            var result = JSON.parse(str);
            console.log({program : result["program"]});
            sanatize_name(result["program"], function (locresult) {
                console.log(locresult);
                res(locresult);
            });

        });
    });
};

var sanatize_name = function (program, res) {
    if (program != null) {
        if (program["season"] != null && program["episode"] != null && program["episode_title"] != null) {
            res(sanitize("S" + program["season"] + ".E" + program["episode"] + "." + program["title"] + "." + program["episode_title"]).replace(/ /g, "_"));
            return;
        }
        if (program["episode_title"] != null) {
            res(sanitize(program["episode_title"]).replace(/ /g, "_"));
            return;
        } else {
            res(sanitize(program["title"]).replace(/ /g, "_") + "." + new Date().getTime());
            return;
        }
    }
};

// prints all the data in a lineup, previously the program schedules was just an array of objects when printed.
var print = function() {
  for (element in cached_lineup){
    console.log(cached_lineup[element].Channel);
    for (show in cached_lineup[element].ProgramSchedules){
       console.log(cached_lineup[element].ProgramSchedules[show]);
    }
  }
}

module.exports = {
    start: start,
    lineup: lineup,
    find: find,
    name: name,
    cached_lineup: cached_lineup,
    print : print,
    get: get
}