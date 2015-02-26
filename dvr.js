
var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var spawn = require('child_process').spawn;
var ipRef = null;
var lookup_channel_data = {};
var current_channel = "";
var scheduled_jobs = [];
module.exports = {
    //   lookup_data : 
    initialize: function() {
        var self = this
        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (k in interfaces) {
            for (k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family == 'IPv4' && !address.internal) {
                    addresses.push(address.address)
                }
            }
        }

        myRootRef.child("channel_data").once('value', function(childSnapshot) {
            var aRef = new Firebase(FB_URL);

            if (childSnapshot.val() === null) {
                console.log("Gathering Tuner Scan Results");
                result = spawn('hdhomerun_config', ["103DA852", "scan", "/tuner0"]);
                var temp_data = "";
                result.stdout.on('data', function(data) {
                    temp_data += data;
                });
                result.on('close', function(code) {
                    console.log("Parsing scan results");
                    var scan_results = temp_data.split("\n");
                    for (var i = 0; i < scan_results.length; ++i) {
                        var channel = /us-bcast:(\d+)/.exec(scan_results[i]);
                        if (channel != null) {
                            current_channel = channel[1];
                        }
                        var program = /PROGRAM (\d+): (\d+.\d+)(.*)/.exec(scan_results[i]);
                        if (program != null) {
                            lookup_channel_data[program[2].replace('.', '-')] = [current_channel, program[1], program[3]];
                        }

                    }
                   aRef.update({
                        channel_data: lookup_channel_data
                    });
                    console.log("done loading channel info");
                });

            } else {
                lookup_channel_data = childSnapshot.val();
                console.log("Done Loading Channel Info");
            }

        });

        // Push my IP to firebase
        // Perhaps a common "devices" location would be handy
        // Need to consider if we have n dvr's load at this address
        ipRef = myRootRef.child("devices").push({
            "type": "local",
            "ip": addresses[0]
        });



        // first time let's make sure we have a legit listing
        if (!myRootRef.tvguide) {
            tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
                myRootRef.update({
                    "tvguide": result
                });
            tvguide.shows(result, "Big Bang Theory", function(_shows) {
        for (item in _shows){
           data = _shows[item];
           var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
           self.queue(date, data["program"], data["length"], data["title"], data["id"]);
           self.schedule(date, myRootRef, data["program"], data["length"], data["title"], data["id"]);
        }
            });


            });

        }

        console.log("Done Initializing");
    },
    tuner: function(date, duration){
         var return_val = 0; // always try to return 0 by default
         var number_of_tuners = 1; // really base 0, so 2 tuners should be determined at initialization, but for now this will work.
         if (scheduled_jobs != null)  {
         //1. Look through all scheduled tasks and look for a date that is during the date time + duration (overlapping).
         //1a. If none exists, then return 0
         //1b. If only one exists, check the tuner identifier, if it's 0 return 1
         //1b. If more than one exists, set fb/conflict list         
         for (var key in scheduled_jobs){            
            // If the scheduled job is before this job
            if (conflict(scheduled_jobs[key]["date"], scheduled_jobs[key]["length"], date, duration))
            {
               // total conflicts - 1 means we have had more conflicts than tuners and have to fail
               if (return_val == number_of_tuners - 1)
               {
                  //we can't recover
                  return -1;
               }
               else{
                  return_val++;
               }
            }
         }
      }
      return return_val;
    },
    schedule: function(date, ref_val, channel_val, length_val, title_val, id_val) {
        var self = this
        var tuner_index = self.tuner(date, length_val);
        //console.log("Schedule");
        if (tuner_index > -1){
           if (myRootRef != null){
              myRootRef.child("scheduled").push({"date" : date.getTime(), "channel" : channel_val, "length" : length_val, "title" : title_val, "tuner" : tuner_index});
           }
           else{
              console.log("myroot ref null");
           }
           scheduled_jobs.push({"date" : date.getTime(), "channel" : channel_val, "length" : length_val, "title" : title_val, "tuner" : tuner_index});
           var j = schedule.scheduleJob(date, function(ref, channel, length, title, id, tuner) {
              tvguide.get_name(id, function(result) {
                   var filename = result;
                   var info = self.lookup_channel(channel);
                   ref.update({
                       "state": "recording"
                   });
                   console.log("Recording title " + title + " for " + length / 60 + "minutes");
                   record = spawn('./record.sh', [filename, info[0], info[1], length, tuner]);

                   record.stdout.on('data', function(data) {
                      console.log(data.toString());
                   });

                   record.on('close', function(code) {
                      ref.update({
                         "state": "waiting"
                      });
                   });
               });
           }.bind(null, ref_val, channel_val, length_val, title_val, id_val, tuner_index));
       }
       else{
          // push to conflicts firebase location
          console.log("Too Many Conflicts");
       }
    },
    cleanup: function() {
        return function() {
            ipRef.remove(onComplete);
            myRootRef.child("scheduled").remove(onComplete);
        }
    },
    queue : function(date, channel_val, length_val, title_val, id_val) {
       if (myRootRef != null){
          //console.log("Queuing Show");
          myRootRef.child("jobs").push({"date" : date.getTime(), "channel" : channel_val, "length" : length_val, "title" : title_val, "id" : id_val});
       }
       else{
          console.log("myroot reff null");
       }
    },
    lookup_channel: function(program) {
        if (lookup_channel_data === null) {
            console.log("Lookup Channel Data Not Setup");
        }
        console.log("Lookup Data " + lookup_channel_data);
        return lookup_channel_data[program];
    }

}

/*
 * Shutting down stuff
 */
function onComplete() {
    process.exit();
}
function conflict(time1, duration1, time2, duration2){
   if ((time1 < time2) && (time2 < time1 + duration1)){
      return true;
   }
   if ((time2 < time1) && (time1 < time2 + duration2)){
      // so we've found a conflict
      return true;
   }
   if (time1 == time2){
      return true;
   }

   return false;
}
