/* http://www.cleancss.com/javascript-beautify/ */
/*jslint node: true */
//"use strict";
var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var schedule = require('node-schedule');
var tuner = require('./tuner');
var tvguide = require('./tvguide');
var on_demand = require('./on_demand');
var recurring = require('./recurring');
var Queue = require('./fb_queue');
var job_queue = new Queue('jobs');
var schedule_queue = new Queue('scheduled');
var spawn = require('child_process').spawn;
var job_list = [];
var scheduled_jobs = [];


/*
var duplicate = function (id) {

    if (job_list.indexOf(id) > -1) {
        console.log("duplicate " + job_list);
        return true;
    }
    job_list.push(id);
    return false;

};
*/
/*
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
*/
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
            recurring.start(function () {
                res("Success");
            }); // On Demand
            // Start On Demand monitor
            console.log("On Demand Manager Started");
            on_demand.start(function () {
                res("Success");
            }); // On Demand
        });
    }); // Schedule Removed



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