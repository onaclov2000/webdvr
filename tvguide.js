// will be a "module" eventually, but this code grabs the json stream
var http = require("http");


module.exports = {
        get: function(date, length) {
                //var length = 1440; // minutes in a day
                //var start = Math.floor((new Date).getTime() / 1000);;
                var start =
                console.log(start);
                var options = {
                    host: 'mobilelistings.tvguide.com',
                    port: 80,
                    path: '/Listingsweb/ws/rest/schedules/20385.268435456/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullName%2CNumber%2CSourceId&ScheduleFields=ProgramId%2CEndTime%2CStartTime%2CTitle%2CAiringAttrib%2CCatId&formattype=json&disableChannels=music%2Cppv%2C24hr&inclchTypeMask=16'
                };

                http.get(options, function(res) {
                        console.log("Got response: " + res.statusCode);
                        //console.log(res);
                        var str = "";
                        res.on('data', function(chunk) {
                            //console.log('BODY: ' + chunk);
                            str += chunk;
                        });
                    }
                }
