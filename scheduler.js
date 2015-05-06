

start: function() {
// This should be moved to a scheduler
var rule = new schedule.RecurrenceRule();
rule.hour = 11;
rule.minute = 59;
var j = schedule.scheduleJob(rule, function() {
    // I picked 25 hours as my rotation, this way I get enough coverage each night at midnight, to cover into the next morning a hair.
    tvguide.get(Math.floor((new Date).getTime() / 1000), 1500, function(result) {
        myRootRef.update({
            "tvguide": result
        });

}

// This should be moved to a 'scheduler', in theory we run through the jobs once, then when the snapshot changes we can re-assess whether we should schedule another.
myRootRef.child("jobs").once('child_changed', function(childSnapshot) {
// This needs to be re-worked
/*
if (childSnapshot.val() != null){
for (var key in childSnapshot.val()){
var x = childSnapshot.val()[key];
if (myRootRef != null){
var Today = new Date().getTime();
var schedule = new Date(x["date"]).getTime();
if (schedule + (x["length"] * 1000) > Today){
dvr.schedule(new Date(x["date"]), myRootRef, x["channel"], x["length"], x["title"], x["id"]);
}
else{
myRootRef.child("jobs").child(key).remove();
console.log("old Show");
}
}
else{
console.log("Ref is null");
}
}
dvr.cleanup_jobs();
}
else{
console.log("No Outstanding Jobs Left To Schedule");
}
*/
});

// Wondering if there should be a firebase function or something where all these "once's" reside.
myRootRef.child("recurring").once('value', function(childSnapshot) {
childSnapshot.forEach(function(dataSnapshot) {
var key = dataSnapshot.val(); // key will be "fred"
            tvguide.shows(result, key["search"], function(_shows) {
            console.log("Doing Recurring Search");
        for (item in _shows){
           data = _shows[item];
           var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
           dvr.queue(date, data["program"], data["length"], data["title"], data["id"]);
           // Scheduling should only occur in one place, not 20 places here. We can *queue* something, but not schedule over and over
           //dvr.schedule(date, myRootRef, data["program"], data["length"], data["title"], data["id"]);
        }
});
});
            });
    });
});


// Schedule Record Now. This should be a function? 
myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
    // code to handle child data changes.
    var data = childSnapshot.val();
    var localref = childSnapshot.ref();
    if (data["commanded"] == "new") {
        localref.update({
            "commanded": "waiting"
        });
        var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);

        console.log("New Schedule Added " + data["title"] + " @");
        console.log(date);
        // queue in this case means we need to make sure we keep track of all our recordings
        // I'm open to new names but this will be sufficient for now
        dvr.queue(date, data["program"], data["length"], data["title"], data["id"]);
        // Scheduling only occurs and is controlled by the "job scheduler"
        
    }
});


if (!myRootRef.tvguide) {
            tvguide.get(Math.floor((new Date).getTime() / 1000), 1440, function(result) {
                myRootRef.update({
                    "tvguide": result
                });
myRootRef.child("recurring").once('value', function(childSnapshot) {
childSnapshot.forEach(function(dataSnapshot) {
var key = dataSnapshot.val(); // key will be "fred"
            tvguide.shows(result, key["search"], function(_shows) {
        for (item in _shows){
           data = _shows[item];
           var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
           self.queue(date, data["program"], data["length"], data["title"], data["id"]);
           self.schedule(date, myRootRef, data["program"], data["length"], data["title"], data["id"]);
        }
            });
});
});
            });

        }
        
        
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
