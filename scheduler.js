var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var tvguide = require('./tvguide');
var schedule = require('node-schedule');
var job_list = [];
var scheduled_jobs = [];
var start = function(res) {
    // Remove our scheduled recordings until we re-schedule
    myRootRef.child("scheduled").remove(function() {
        console.log("Scheduled Removed");
        // Start Jobs monitor, this is the *queue* manager
        console.log("Queue Manager Started");
        myRootRef.child("jobs").on('value', function(childSnapshot) {
            if (childSnapshot.val() != null) {
                console.log("New Job");
                schedule_queue(childSnapshot.val(), function() {}); // Jobs FB
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

}

var schedule_queue = function(jobs, res) {
    for (var key in jobs) {
        var x = jobs[key];
        console.log(jobs[key]["date"]);
        var date = new Date(jobs[key]["date"]).getTime();
        if (old(date, jobs[key]["length"]) || duplicate(jobs[key]["id"])) {
            //console.log("Removing" + key);
            myRootRef.child("jobs").child(key).remove();
        } else {
            tvguide.name(jobs[key]["id"], function(result) {
                scheduled(new Date(jobs[key]["date"]), myRootRef, jobs[key]["channel"], jobs[key]["length"], jobs[key]["title"], jobs[key]["id"], result);
                res("Success");
            });
        }
    }
    jobs_list = [];
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
        localref.update({
            "commanded": "waiting"
        });
        var date = new Date(data["year"], data["month"], data["day"], data["hh"], data["mm"], 0);

        console.log("New Schedule Added " + data["title"] + " @");
        console.log(date);
        // queue in this case means we need to make sure we keep track of all our recordings
        // I'm open to new names but this will be sufficient for now
        queue(date, data["program"], data["length"], data["title"], data["id"]);
        // Scheduling only occurs and is controlled by the "job scheduler"
    }


}
var scheduled = function(date, ref_val, channel_val, length_val, title_val, id_val, name) {

    date = new Date(date).getTime();
    date = date - CONFIG.RECORD_PADDING.before * 1000; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
    length_val = length_val + CONFIG.RECORD_PADDING.before * 1000 + CONFIG.RECORD_PADDING.after * 1000;
    var tuner_index = tuner(date, length_val);
    //console.log("Schedule");
    if (tuner_index > -1) {
        myRootRef.child("scheduled").push({
            "date": date,
            "channel": channel_val,
            "length": length_val,
            "title": title_val,
            "tuner": tuner_index
        });
        scheduled_jobs.push({
            "date": date,
            "channel": channel_val,
            "length": length_val,
            "title": title_val,
            "tuner": tuner_index
        });
        var j = schedule.scheduleJob(date, function(ref, channel, length, title, id, tuner, filename) {
            create_scheduled_recording(ref, channel, length, title, id, tuner, filename);
        }.bind(null, ref_val, channel_val, length_val, title_val, id_val, tuner_index, name));
    } else {
        // push to conflicts firebase location
        console.log("Too Many Conflicts");
    }
}

var create_scheduled_recording = function(ref, channel, length, title, id, tuner, filename) {
    var info = tuner.channel(channel);
    console.log("Recording title " + title + " for " + length / 60 + "minutes");
    record = spawn('./record.sh', [filename, info[0], info[1], length, tuner]);

    disk.time(function(res) {
        ref.update({
            "time_remaining": res - (length / 3600)
        });
    });

}

// scheduler file
var queue = function(date, channel_val, length_val, title_val, id_val) {
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
            tvguide.lineup(CONFIG.UPDATE_FREQUENCY.duration, function(results){
            tvguide.find(results, key["search"], function(_shows) {
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
        queue(date, program, data["length"], data["title"], data["id"]);
    }

}

// The scheduler should have a "conflict resolution"
var tuner = function(date, duration) {
    var return_val = 0; // always try to return 0 by default
    var number_of_tuners = 1; // really base 0, so 2 tuners should be determined at initialization, but for now this will work.
    if (scheduled_jobs != null) {
        //1. Look through all scheduled tasks and look for a date that is during the date time + duration (overlapping).
        //1a. If none exists, then return 0
        //1b. If only one exists, check the tuner identifier, if it's 0 return 1
        //1b. If more than one exists, set fb/conflict list         
        for (var key in scheduled_jobs) {
            // If the scheduled job is before this job
            if (conflict(scheduled_jobs[key]["date"], scheduled_jobs[key]["length"], date, duration)) {
                // total conflicts - 1 means we have had more conflicts than tuners and have to fail
                if (return_val == number_of_tuners - 1) {
                    //we can't recover
                    return -1;
                } else {
                    return_val++;
                }
            }
        }
    }
    return return_val;
}

var duplicate = function(id) {
    console.log(job_list);
    console.log(id);
    if (job_list.indexOf(id) > -1) {
        console.log("duplicate");
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
        console.log("old");
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
