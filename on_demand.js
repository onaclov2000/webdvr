var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var tuner = require('./tuner');
var tvguide = require('./tvguide');
var Queue = require('./fb_queue');
var disk = require('./disk');
var job_queue = new Queue('jobs');
var schedule_on_demand = function (data, localref, res) {
  
  localref.update({
      "commanded": "waiting"
  });
  delete data.commanded;
  var date = new Date(data.date);
  console.log("New Schedule Added " + data.title + " @");
  console.log(date);
  console.log("ON Demand Queued");
  disk.time(function (disk_time) {
      console.log("Disk Time: " + disk_time);
      if (job_queue.duration() + data.length / 60 < disk_time) {
          var channels = tuner.cached_channel();
          data.station = channels[data.channel][0];
          data.program = channels[data.channel][1];
          job_queue.add(data);
          res("success");
      }
  });
};


var start = function (res) {
    // Schedule Record Now. This should be a function?
    myRootRef.on('child_changed', function (childSnapshot) {
        // code to handle child data changes.
        var data = childSnapshot.val();
        var localref = childSnapshot.ref();
        if (data.commanded === "new") {
           console.log('child_changed on_demand triggered data seen: ');
           // Add some time to the end of the date
           data.endTime = data.date + (data.length * 1000);
           data.startTime = data.date;
           console.log(data);
           schedule_on_demand(data, localref, function (res) {
               console.log({schedule_on_demand : {result : res}});
           });
        }
    });
    res("success");
};


module.exports = {
    start: start
};