// will be a "module" eventually, but this code grabs the json stream

var http = require("http");

var length = 1440; // minutes in a day
var start = Math.floor((new Date).getTime()/1000); ;
console.log(start);
var options = {
  host: 'mobilelistings.tvguide.com',
  port: 80,
  path: '/Listingsweb/ws/rest/schedules/20385.268435456/start/' + start + '/duration/' + length + '?ChannelFields=Name%2CFullN$
};

http.get(options, function(res) {
  console.log("Got response: " + res.statusCode);
  //console.log(res);
  var str = "";
res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
               str += chunk;
         });
