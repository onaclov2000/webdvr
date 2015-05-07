var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var disk = require('./disk');



// Remove our scheduled recordings until we re-schedule
myRootRef.child("scheduled").remove(onComplete);


// Start Scheduling Jobs this is the *queue* manager, everything else is based on this guy's mad skills
myRootRef.child("jobs").on('child_changed', function(childSnapshot) {
    // Likely this will require revision, cause well I just did most of it in github's editor
    if (childSnapshot.val() != null) {
        for (var key in childSnapshot.val()) {
            var x = childSnapshot.val()[key];
            if (myRootRef != null) {
                
                var schedule = new Date(x["date"]).getTime();
                if (old(x["date"].getTime(), x["length"])){
                    myRootRef.child("jobs").child(key).remove();
                    //console.log("old Show");
                }
                else{
                    if duplicate(x["id"]){
                        myRootRef.child("jobs").child(key).remove();
                        //console.log("duplicate Show");
                    }
                    else
                    {
                       self.schedule(new Date(x["date"]), myRootRef, x["channel"], x["length"], x["title"], x["id"]);
                    }
                }
            } else {
                console.log("Ref is null");
            }
        }
        
    } else {
        console.log("No Outstanding Jobs Left To Schedule");
    }

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

// Here we get the tv guide result, then we find shows we want to queue for watching,
// You can queue any valid show, but the scheduler will remove shows that are duplicate ids
// Also this should be re-arranged, so whenever the recurring list changes we get the tv guide results.
// then we queue up the shows we want to watch
    myRootRef.child("recurring").on('child_changed', function(childSnapshot) {
        childSnapshot.forEach(function(dataSnapshot) {
            var key = dataSnapshot.val(); // key will be "fred"
            tvguide.find(tvguide.lineup(), key["search"], function(_shows) {
                for (item in _shows) {
                    data = _shows[item];
                    var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
                    self.queue(date, data["program"], data["length"], data["title"], data["id"]);
                }

            });

        });

    });
    
module.exports = {
start: function() {


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
        date = new Date(date).getTime();
        date = date - CONFIG.RECORD_PADDING.before * 1000; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
        length_val = length_val + CONFIG.RECORD_PADDING.before * 1000 + CONFIG.RECORD_PADDING.after * 1000;
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
},
// Scheduler file.
    cleanup: function() {
        return function() {
            ipRef.remove(onComplete);
            myRootRef.child("scheduled").remove(onComplete);
        }
    },
    // Scheduler file.
    old : function(date, length){
           var today = new Date().getTime();
           var job = date + length; //new Date(data["date"] + data["length"]);
           // Remove OLD Shows
           if (today > job){
              return true;
           }
    },
    

        


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
