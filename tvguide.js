// will be a "module" eventually, but this code grabs the json stream
var http = require("http");
var sanitize = require("sanitize-filename")

module.exports = {
    get: function(date, length, callback) {
        var start = date;
        console.log("Retrieving Channel Data from TV Guide");
        var options = {
            host: 'mobilelistings.tvguide.com',
            port: 80,
            path: '/Listingsweb/ws/rest/schedules/20385.268435456/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullName%2CNumber%2CSourceId&ScheduleFields=ProgramId%2CEndTime%2CStartTime%2CTitle%2CAiringAttrib%2CCatId&formattype=json&disableChannels=music%2Cppv%2C24hr&inclchTypeMask=16'
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
    },
    // Need to remove duplicates
    shows: function(entire_listing, show, callback) {
        var res = [];
        console.log(show);
        for (key in entire_listing){
           // grab the index.
           for (item in entire_listing[key]["ProgramSchedules"]){  
                if (entire_listing[key]["ProgramSchedules"][item]["Title"].indexOf(show) > -1){
		        startTime = entire_listing[key]["ProgramSchedules"][item]["StartTime"];
		        endTime = entire_listing[key]["ProgramSchedules"][item]["EndTime"];
		        var scheduledDate = new Date((startTime - 120) * 1000);
		        // always record 2 minutes before and 2 minutes after approx
		        var duration = (endTime - startTime) + 240;
		        res.push({
		            // Firebase Workaround for not allowed to have .'s in paths
		            program: entire_listing[key]["Channel"]["Number"].replace('.', '-'),
		            day: scheduledDate.getDate(),
		            month: scheduledDate.getMonth(),
		            year: scheduledDate.getFullYear(),
		            hh: scheduledDate.getHours(),
		            mm: scheduledDate.getMinutes(),
		            length: duration,
		            id: entire_listing[key]["ProgramSchedules"][item]["ProgramId"],
		            title: entire_listing[key]["ProgramSchedules"][item]["Title"]
		        });
                }
           }
        } 
        callback(res);
    },

    //        http://mobilelistings.tvguide.com/Listingsweb/ws/rest/airings/20385.268435456/start/1422793800/duration/20160/search?search=Big%20Bang%20Theory&formattype=json
    search: function(program_name, callback) {
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
    },
    get_name: function(id, callback) {
        //          http://mapi.tvguide.com/listings/details?program=

        var options = {
            host: 'mapi.tvguide.com',
            port: 80,
            path: '/listings/details?program=' + id
        };

        http.get(options, function(res) {
            var str = "";
            res.on('data', function(chunk) {
                str += chunk;
            });

            res.on('end', function() {
                var result = JSON.parse(str);
                if (result["program"] != null) {
                    if (result["program"]["season"] != null && result["program"]["episode"] != null && result["program"]["episode_title"] != null) {
                        callback(sanitize("S" + result["program"]["season"] + ".E" + result["program"]["episode"] + "." + result["program"]["title"] + "." + result["program"]["episode_title"]).replace(/ /g, "_"));
                        return;
                    }
                    if (result["program"]["episode_title"] != null) {
                        callback(sanitize(result["program"]["episode_title"]).replace(/ /g, "_"));
                        return;
                    } else {
                        callback(sanitize(result["program"]["title"]).replace(/ /g, "_"));
                        return;
                    }
                }
            });
        });
    }
}
