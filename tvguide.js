// will be a "module" eventually, but this code grabs the json stream
var http = require("http");


module.exports = {
    get: function(date, length, callback) {
        var start = date;
        console.log(start);
        var options = {
            host: 'mobilelistings.tvguide.com',
            port: 80,
            path: '/Listingsweb/ws/rest/schedules/20385.268435456/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullName%2CNumber%2CSourceId&ScheduleFields=ProgramId%2CEndTime%2CStartTime%2CTitle%2CAiringAttrib%2CCatId&formattype=json&disableChannels=music%2Cppv%2C24hr&inclchTypeMask=16'
        };

        http.get(options, function(res) {
            var str = "";
            res.on('data', function(chunk) {
                //console.log('BODY: ' + chunk);
                str += chunk;
            });
            res.on('end', function() {
                callback(JSON.parse(str));

            });
        });
    },
    get_name: function(id, callback) {
        //          http://mapi.tvguide.com/listings/details?program=
        //         console.log(id);
        var options = {
            host: 'mapi.tvguide.com',
            port: 80,
            path: '/listings/details?program=' + id
        };

        http.get(options, function(res) {
            var str = "";
            res.on('data', function(chunk) {
                //console.log('BODY: ' + chunk);
                str += chunk;
            });
            res.on('end', function() {
                var result = JSON.parse(str);
                //        console.log(result);
                if (result["program"] != null) {
                    callback("S" + result["program"]["season"] + ".E" + result["program"]["episode"] + "." + result["program"]["episode_title"].replace(/[^a-z0-9]/gi, '_').toLowerCase());
                }
            });
        });
    }

}
