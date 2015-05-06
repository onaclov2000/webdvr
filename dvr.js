var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var myRootRef = new Firebase(FB_URL);
var os = require('os')
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var disk = require('./disk');
var spawn = require('child_process').spawn;
var ipRef = null;
var lookup_channel_data = {};
var current_channel = "";
var scheduled_jobs = [];
var unique_jobs = [];
module.exports = {
    //   lookup_data : 
    start: function() {
        
// Should be a dvr function this is crazy long
        myRootRef.child("channel_data").once('value', function(childSnapshot) {
            var aRef = new Firebase(FB_URL);

            if (childSnapshot.val() === null) {
                console.log("Gathering Tuner Scan Results");
                // TODO, The TUNER should be found programmatically.
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

        
// This I am not sure where it should remain, but should be in a 'disk manager' probably
                   disk.time(function(res){
                      myRootRef.update({
                         "time_remaining": res
                      });
                   });         
      // this is where we are scheduling recurring stuff again...this is crazy. TOO MUCH I TELL YOU.
      // first time let's make sure we have a legit listing
        

        console.log("Done Initializing");
    },
    // The scheduler should have a "conflict resolution"
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
    // A DVR "has a" Tuner, so this should be in a "tuner" file, it should return all the tuners available
    get_tuners: function() {
        myRootRef.child("tuner_info").once('value', function(childSnapshot) {
            var aRef = new Firebase(FB_URL);

            if (childSnapshot.val() === null) {
                result = spawn('hdhomerun_config', ["discover"]);
                var temp_data = "";
                result.stdout.on('data', function(data) {
                    temp_data += data;
                });
                result.on('close', function(code) {
                    console.log(temp_data);
                    aRef.update({
                        tuner_info: temp_data
                    });
                });
         }
     });
},
 // In a scheduler file.
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

                   disk.time(function(res){
                      ref.update({
                         "time_remaining": res - (length / 3600)
                      });
                   });

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
    // Scheduler file.
    cleanup: function() {
        return function() {
            ipRef.remove(onComplete);
            myRootRef.child("scheduled").remove(onComplete);
        }
    },
    // Scheduler file.
    cleanup_jobs : function(){
     myRootRef.child('jobs').once('value', function(snapshot){
         
         snapshot.forEach(function(res){
           var data = res.val();
           var today = new Date().getTime();
           var job = data["date"] + data["length"]; //new Date(data["date"] + data["length"]);
           // Remove OLD Shows
           if (today > job){
              console.log("Removing Job" + data["title"] + "@" + new Date(data["date"]));
              myRootRef.child(res.key()).remove();
           }

      });
    });
    },
    // scheduler file
    queue : function(date, channel_val, length_val, title_val, id_val) {
       if (myRootRef != null){
          //console.log("Queuing Show");  
          if (unique_jobs.indexOf(id_val) == -1){
             unique_jobs.push(id_val);          
             // dont push if we see a duplicate entry
          myRootRef.child("jobs").push({"date" : date.getTime(), "channel" : channel_val, "length" : length_val, "title" : title_val, "id" : id_val});
          }
       }
       else{
          console.log("myroot ref null");
       }
    },
    //remains, rename to "channel" probably, so we can lookup a channel via the program
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

// Scheduler file.
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
