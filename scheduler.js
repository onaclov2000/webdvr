var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var tvguide = require('./tvguide');
var schedule = require('node-schedule');
var tuner = require('./tuner');
var queue = require('./fb_queue');
var job_queue = new queue('jobs');
var schedule_queue = new queue('scheduled');
var spawn = require('child_process').spawn;
var disk = require('./disk');
var job_list = [];
var scheduled_jobs = [];
var _recurring = [];


var duplicate = function(id) {

    if (job_list.indexOf(id) > -1) {
        console.log("duplicate " + job_list);
        return true;
    }
    job_list.push(id);
    return false;

};
var old = function(date, length) {
    var today = new Date().getTime();
    
    var job = parseInt(date) + parseInt(length)*1000;
    console.log(date);
    // Remove OLD Shows
    if (today > job) {
        console.log('old');
        console.log(today);
        console.log(job);
        return true;
    }
    return false;
};


var add_to_schedule_queue = function(jobs, key, res) {
        tvguide.name(jobs.id, function(result) {
            console.log("Scheduled: " + jobs.title + " " + new Date(jobs.date));
            //console.log(jobs);
            jobs.name = result;
            scheduled(myRootRef, jobs);
            res("Success");
        });

}


var start = function(res) {
    // Remove our scheduled recordings until we re-schedule
    myRootRef.child("scheduled").remove(function() {
        console.log("Scheduled Removed");
        // Start Jobs monitor, this is the *queue* manager
        console.log("Queue Manager Started");
        myRootRef.child("jobs").on('child_added', function(childSnapshot) {
            console.log('jobs_child_added');
            console.log(childSnapshot.val());
            if (childSnapshot.val() !== null) {
                //console.log("New Job");
                add_to_schedule_queue(childSnapshot.val(), childSnapshot.key(), function() {}); // Jobs FB
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
        for (element in _recurring) {
            console.log(_recurring[element]);
            tvguide.lineup(CONFIG.UPDATE_FREQUENCY.duration, false, function(results) {

                tvguide.find(results, _recurring[element], function(_shows) {
                    console.log("SHOWS");
                    for (show in _shows){
                       tuner.channel(function(result){
                          console.log(result[_shows[show].channel]);
                          if (result[_shows[show].channel]){
                            disk.time(function(disk_time){
                              console.log("Disk Time: " + disk_time);
                              console.log(_shows[show]);
                               if (job_queue.duration() + _shows[show].length/60 < disk_time){
                                 job_queue.add(_shows[show]);
                               }
                             });
                          }
                       });
                    }
                });
            });
        }
    });
}



var on_demand = function(res) {
    // Schedule Record Now. This should be a function?
    myRootRef.child('status').on('child_changed', function(childSnapshot, prevChildName) {
        console.log('child_changed');
        console.log('on_demand');
        // code to handle child data changes.
        var data = childSnapshot.val();
        var localref = childSnapshot.ref();
        delete data.commanded;
        data.endTime = data.date + (data.length * 1000);
        data.startTime = data.date;
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
        console.log("ON Demand Queued");
        disk.time(function(disk_time){
            console.log("Disk Time: " + disk_time);
             if (job_queue.duration() + data.length/60 < disk_time){
               job_queue.add(data);
             }
           });
          
    }


}
var scheduled = function(ref_val, job) {
    job.date = new Date(job.date).getTime();
    job.date = job.date - CONFIG.RECORD_PADDING.before; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
    job.length = job.length + CONFIG.RECORD_PADDING.before + CONFIG.RECORD_PADDING.after;
    console.log(schedule_queue);
    job.tuner_index = tuner.conflict(job.date, job.length, schedule_queue.entire());
    job.endTime = job.date + (job.length);
    /* //Debug Stuff
    console.log("Finding End Time");
    console.log(new Date(job.date));
    console.log(new Date(job.endTime));
    */
    if (job.tuner_index > -1) {
        schedule_queue.add(job);

        var j = schedule.scheduleJob(new Date(job.date), function(locjob) {
            console.log("Create Scheduled Recording");
            create_scheduled_recording(locjob);
        }.bind(null,job));
    } else {
        // push to conflicts firebase location
        console.log("Too Many Conflicts");
    }
}

var create_scheduled_recording = function(job) {
    tuner.channel(function(channels) {
        console.log("Recording title " + job.title + " for " + job.length / 6000 + " minutes");
        console.log(job.channel);
        console.log(channels[job.channel]);
        record = spawn('./record.sh', [job.name, channels[job.channel][0], channels[job.channel][1], job.length, job.tuner_index]);
        var temp_data = "";
        record.on('data', function(data) {
            temp_data += data;
        });

        record.on('close', function(code) {
            console.log(temp_data);
            
        });
    });
}



var recurring = function(res) {
    myRootRef.child("recurring").on('value', function(childSnapshot) {
        console.log("Recurring");
        childSnapshot.forEach(function(dataSnapshot) {
            var key = dataSnapshot.val();

            if (_recurring.indexOf(key.search) == -1) {
                _recurring.push(key.search);
            }
            tvguide.lineup(CONFIG.UPDATE_FREQUENCY.duration, false, function(results) {
                console.log("Show " + key.search);
                tvguide.find(results, key.search, function(_shows) {
                    console.log('Recurring Add Queue');
                    for (var show in _shows){
                       tuner.channel(function(result){
                          //console.log(result[_shows[show].channel]);
                          if (result[_shows[show].channel]){
                             disk.time(function(disk_time){
                              console.log("Disk Time: " + disk_time);
                               if (job_queue.duration() + _shows[show].length/60 < disk_time){
                                 job_queue.add(_shows[show]);
                               }
                             });
                          }
                       });
                    }
                });
            });
        });
        res("SUCCESS");
    });

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
    start: start,
    create_scheduled_recording : create_scheduled_recording
}
