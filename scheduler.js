var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var tvguide = require('./tvguide');
var schedule = require('node-schedule');
var tuner = require('./tuner');
var job_list = [];
var scheduled_jobs = [];
var _recurring = [];

var start = function(res) {
    // Remove our scheduled recordings until we re-schedule
    myRootRef.child("scheduled").remove(function() {
        console.log("Scheduled Removed");
        // Start Jobs monitor, this is the *queue* manager
        console.log("Queue Manager Started");
        myRootRef.child("jobs").on('child_added', function(childSnapshot) {
//            console.log("jobs" + childSnapshot.val());
            if (childSnapshot.val() != null) {
                //console.log("New Job");
                schedule_queue(childSnapshot.val(), childSnapshot.key(), function() {}); // Jobs FB
            }

        });
            console.log("Recurring Manager Started");
            // Start Recurring monitor, this is the repeated *search* manager
            recurring(function(result) {


            }); // Recurring

        console.log("On Demand Manager Started");
        // Start On Demand monitor
        on_demand(function() {
            res("Success");
        }); // On Demand

    }); // Schedule Removed


    myRootRef.child("tvguide").on('child_changed', function(childSnapshot, previousChanged) {
            for (element in _recurring){       
            console.log(element);
            tvguide.lineup(CONFIG.UPDATE_FREQUENCY.duration, function(results){
               
               tvguide.find(results, _recurring[element], function(_shows) {
                  console.log("SHOWS" + _shows);
                  add_queue(_shows);
               });
            });
           }
    });



}


var schedule_queue = function(jobs, key, res) {

        //console.log("Schedule_QUEUE" + jobs[key]);
        var date = new Date(jobs["date"]).getTime();
        if (old(date, jobs["length"]) || duplicate(jobs["id"])) {
            console.log("Removing" + jobs["title"]);
            myRootRef.child("jobs").child(key).remove();
        } else {
            tvguide.name(jobs["id"], function(result) {
                console.log("Scheduled" + jobs["title"]);
                scheduled(new Date(jobs["date"]), myRootRef, jobs["channel"], jobs["length"], jobs["title"], jobs["id"], result);
                res("Success");
            });
        }
    
}

var on_demand = function(res) {
    // Schedule Record Now. This should be a function? 
    myRootRef.on('child_changed', function(childSnapshot, prevChildName) {
        // code to handle child data changes.
        var data = childSnapshot.val();
        var localref = childSnapshot.ref();
        schedule_on_demand(data, localref, function(res) {

        });
    });

}

var schedule_on_demand = function(data, localref, res) {
    if (data["commanded"] == "new") {
        console.log("See New");
        localref.update({
            "commanded": "waiting"
        });
        var date = new Date(data["date"]);

        console.log("New Schedule Added " + data["title"] + " @");
        console.log(date);
        // queue in this case means we need to make sure we keep track of all our recordings
        // I'm open to new names but this will be sufficient for now
        console.log("ON Demand Queued");
        queue(data["date"], data["program"], data["length"], data["title"], data["id"]);
        // Scheduling only occurs and is controlled by the "job scheduler"
    }


}
var scheduled = function(date, ref_val, channel_val, length_val, title_val, id_val, name) {

    date = new Date(date).getTime();
    date = date - CONFIG.RECORD_PADDING.before * 1000; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
    length_val = length_val + CONFIG.RECORD_PADDING.before * 1000 + CONFIG.RECORD_PADDING.after * 1000;
    var tuner_index = tuner.conflict(date, length_val, scheduled_jobs);
    //console.log("Schedule");
    if (tuner_index > -1) {
        myRootRef.child("scheduled").push({
            "date": date,
            "channel": channel_val,
            "length": length_val,
            "title": title_val,
            "id" : id_val,
            "tuner": tuner_index,
            "name" : name
        });
        scheduled_jobs.push({
            "date": date,
            "channel": channel_val,
            "length": length_val,
            "title": title_val,
            "id" : id_val,
            "tuner": tuner_index,
            "name" : name
        });
//        console.log(date);
        var j = schedule.scheduleJob(new Date(date), function(ref, channel, length, title, id, tuner_i, filename) {
           console.log("Create Scheduled Recording");
            create_scheduled_recording(ref, channel, length, title, id, tuner_i, filename);
        }.bind(null, ref_val, channel_val, length_val, title_val, id_val, tuner_index, name));
    } else {
        // push to conflicts firebase location
        console.log("Too Many Conflicts");
    }
}

var create_scheduled_recording = function(ref, channel, length, title, id, tuner_index, filename) {
    tuner.channel(function(channels){
       console.log("Recording title " + title + " for " + length / 60 + "minutes");
       console.log(channel);
       console.log(channels[channel]);
       record = spawn('./record.sh', [filename, channels[channel][0], channels[channel][1], length, tuner]);
    var temp_data = "";
    record.stdout.on('data', function(data) {
      temp_data += data;
     });

     result.on('close', function(code) {
        disk.time(function(res) {
           ref.update({
               "time_remaining": res
           });
        });
   });
    });
    
}

// scheduler file
var queue = function(date, channel_val, length_val, title_val, id_val) {
    console.log("Queued " + title_val);
    myRootRef.child("jobs").push({
        "date": date,
        "channel": channel_val,
        "length": length_val,
        "title": title_val,
        "id": id_val
    });
};

var recurring = function(res) {
    myRootRef.child("recurring").on('value', function(childSnapshot) {
        console.log("Recurring");
        childSnapshot.forEach(function(dataSnapshot) {
            var key = dataSnapshot.val();

            if (_recurring.indexOf(key["search"]) == -1){
               _recurring.push(key["search"]);   
            }
            tvguide.lineup(CONFIG.UPDATE_FREQUENCY.duration, function(results){
            console.log("Show " + key["search"]);            
            tvguide.find(results, key["search"], function(_shows) {
               console.log('Recurring Add Queue');
               
               add_queue(_shows);
            });
            });
        });
        res("SUCCESS");
    });

}
var add_queue = function(shws) {
    
     for (item in shws) {
        console.log(shws[item]);
        data = shws[item];
        var date = "";
        var program = "";
        if (data["date"] != null){
        date = data["date"];
        program = data["channel"];
        }else{
         date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);
         program = data["program"];
        }
        console.log("add_queue");
        queue(date, program, data["length"], data["title"], data["id"]);
    }

}


var duplicate = function(id) {

    if (job_list.indexOf(id) > -1) {
//        console.log("duplicate " + id);
        return true;
    }
    job_list.push(id);
    return false;

}
var old = function(date, length) {
    var today = new Date().getTime();
    var job = date + length;
    // Remove OLD Shows
    if (today > job) {
//        console.log("old");
        return true;
    }
    return false;
}

// Scheduler file.
function conflict(time1, duration1, time2, duration2) {
    if ((time1 < time2) && (time2 < time1 + duration1)) {
        return true;
    }
    if ((time2 < time1) && (time1 < time2 + duration2)) {
        // so we've found a conflict
        return true;
    }
    if (time1 == time2) {
        return true;
    }

    return false;
}

module.exports = {
    start: start
}
