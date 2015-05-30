var filter = require('../filter');
var tvguide = require('../tvguide');
var tuner = require('../tuner');

/* This test doesn't really work because lineup has a refernce in it, and well other things, but when it was missing the filter and hte myref (commented out it works)
tuner.channel(function(chan){
   tvguide.lineup('1500', function(line){
      console.log(filter.channels(chan,line));
   });


});
*/

var obj = [{Channel : {program : "blah"}, ProgramSchedules : [{Title: "Paid Programming"},{Title : "BIg Bang THeory"}]}, {Channel : {program : "blah"}, ProgramSchedules : [{Title: "Paid Programming"},{Title : "The Office"}]}];
res = filter.shows(obj);
console.log(res[0]);
