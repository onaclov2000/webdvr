/* http://www.cleancss.com/javascript-beautify/ */
/*jslint node: true */
//"use strict";
var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var tvguide = require('./tvguide');
var schedule = require('node-schedule');
var tuner = require('./tuner');
var Queue = require('./fb_queue');
var job_queue = new Queue('jobs');
var schedule_queue = new Queue('scheduled');
var spawn = require('child_process').spawn;
var disk = require('./disk');
var job_list = [];
var scheduled_jobs = [];
var recurring = [];


var duplicate = function (id) {

    if (job_list.indexOf(id) > -1) {
        console.log("duplicate " + job_list);
        return true;
    }
    job_list.push(id);
    return false;

};
var old = function (date, length) {
    var today = new Date().getTime();

    var job = parseInt(date, 10) + parseInt(length, 10) * 1000;
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

var create_scheduled_recording = function (job) {
    console.log("Recording title " + job.title + " for " + job.length / 6000 + " minutes");
    console.log(job.channel);
    var record = spawn('./record.sh', [job.name, job.station, job.program, job.length, job.tuner_index]);
    var temp_data = "";
    record.on('data', function (data) {
        temp_data += data;
    });

    record.on('close', function (code) {
        console.log({create_scheduled_recording: {code : code, temp_data : temp_data}});
    });
};

var scheduled = function (job) {
    job.date = new Date(job.date).getTime();
    job.date = job.date - CONFIG.RECORD_PADDING.before; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
    job.length = job.length + CONFIG.RECORD_PADDING.before + CONFIG.RECORD_PADDING.after;
    console.log(schedule_queue);
    job.tuner_index = tuner.conflict(job.date, job.length, schedule_queue.entire());
    job.endTime = job.date + (job.length);
    if (job.tuner_index > -1) {
        schedule_queue.add(job);

        schedule.scheduleJob(new Date(job.date), function (locjob) {
            console.log("Create Scheduled Recording");
            create_scheduled_recording(locjob);
        }.bind(null, job));
    } else {
        // push to conflicts firebase location
        console.log("Too Many Conflicts");
    }
};

// we used to pass in the key, but I'm not sure why anymore
var add_to_schedule_queue = function (jobs) {
    tvguide.name(jobs.id, function (result) {
        console.log("Scheduled: " + jobs.title + " " + new Date(jobs.date));
        //console.log(jobs);
        jobs.name = result;
        scheduled(jobs);
    });

};

var schedule_on_demand = function (data, localref, res) {
    if (data.commanded === "new") {
        console.log("See New");
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

    }


};


var on_demand = function (res) {
    // Schedule Record Now. This should be a function?
    myRootRef.on('child_changed', function (childSnapshot) {
        console.log('child_changed');
        console.log('on_demand');
        // code to handle child data changes.
        var data = childSnapshot.val();
        var localref = childSnapshot.ref();

        data.endTime = data.date + (data.length * 1000);
        data.startTime = data.date;
        console.log(data);
        schedule_on_demand(data, localref, function (res) {
            console.log({schedule_on_demand : {result : res}});
        });
        res("success");
    });

};

var start = function (res) {
    // Remove our scheduled recordings until we re-schedule
    myRootRef.child("scheduled").remove(function () {
        myRootRef.child("jobs").once('value', function (childSnapshot) {
            // Start Jobs monitor, this is the *queue* manager
            console.log("Queue Manager Started");
            myRootRef.child("jobs").on('child_added', function (childSnapshot) {
                console.log('jobs_child_added');
                console.log(childSnapshot.val());
                if (childSnapshot.val() !== null) {
                    //console.log("New Job");
                    add_to_schedule_queue(childSnapshot.val()); // Jobs FB
                }

            });

            var existing_jobs = childSnapshot.val();
            var existing_job = "";
            var obj = "";
            for (existing_job in existing_jobs) {
                console.log(existing_jobs[existing_job]);
                obj = "";
                obj = existing_jobs[existing_job];
                // add and get a new key (managed inside fb_queue for new element)
                job_queue.add(obj);
                // remove old key (this way we don't have duplicates)
                myRootRef.child("jobs").child(obj.key).remove();
            }


            console.log("Recurring Manager Started");
            // Start Recurring monitor, this is the repeated *search* manager

            //I'm not sure if this will work "correctly" but basically go get all the recurring elements, then go through them with the existing lineups etc.
            myRootRef.child("recurring").on('value', function (childSnapshot) {
                console.log("Initialize Recurring List");
                childSnapshot.forEach(function (dataSnapshot) {
                    var key = dataSnapshot.val();
                    // replace with for loopsearch
                    if (recurring.indexOf(key.search) === -1) {
                        recurring.push(key.search);
                    }
                });
                schedule_recurring();
            });


            // Start On Demand monitor
            console.log("On Demand Manager Started");
            on_demand(function () {
                res("Success");
            }); // On Demand
        });
    }); // Schedule Removed


    myRootRef.child("tvguide").on('child_changed', function () {
        console.log('TV Guide has changed, checking for recurring programs to record.');
        schedule_recurring();
    });
};

// Recurring has been simplified, and "cache" functions for a few of these are now in use.
// Are they the right solution? I think so, for example, the "channel" from the tuner will only be setup the first time you start the device application
// the first time we run "recurring" the lineup has been retrieved, the next time we only update when the tvguide FB data changes, which implies
// that the data is static once again, no point in doing anything.
var recurring = function () {
    console.log("Time to find any recurring shows and add them to our job queue.");
    var channel = tuner.cached_channel();
    console.log("Cached Channels");
    console.log(channel);
    var lineup = tvguide.cached_lineup();
    console.log("Cached Lineup");
    console.log(lineup);
    disk.time(function (disk_time) {
        var element;
        var shows;
        var show;
        for (element in recurring) {
            console.log(recurring[element]);
            shows = tvguide.find(lineup, recurring[element]);
            console.log("SHOWS");
            console.log(shows);

            for (show in shows) {
                console.log(show);
                console.log(channel[shows[show].channel]);
                shows[show].station = channel[shows[show].channel][0];
                shows[show].program = channel[shows[show].channel][1];
                console.log("Disk Time: " + disk_time);
                console.log(shows[show]);
                if (job_queue.duration() + shows[show].length / 60 < disk_time) {
                    job_queue.add(shows[show]);
                }
            }

        }
    });
    return "Success";
};




// Scheduler file.
function conflict(time1, duration1, time2, duration2) {
    if ((time1 < time2) && (time2 < time1 + duration1)) {
        return true;
    }
    if ((time2 < time1) && (time1 < time2 + duration2)) {
        // so we've found a conflict
        return true;
    }
    if (time1 === time2) {
        return true;
    }

    return false;
}

module.exports = {
    start: start,
    create_scheduled_recording: create_scheduled_recording
};