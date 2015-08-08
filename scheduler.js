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
    console.log("Recording title " + job.title + " for " + job.length / 60 + " minutes");
    console.log(new Date());
    console.log(job.channel);
    var record = spawn('./record.sh', [job.name, job.station, job.program, job.length, job.tuner_index]);
    var temp_data = "";
    record.stdout.on('data', function (data) {
        temp_data += data;
    });

    record.on('close', function (code) {
        console.log({create_scheduled_recording: {code : code, temp_data : temp_data}});
    });
};

var scheduled = function (job) {
    console.log({orig_date : job.date});
    job.date = new Date(job.date).getTime();
    console.log({new_date_obj : job.date});
    job.date = (job.date - (CONFIG.RECORD_PADDING.before * 1000)) / 1000; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
    console.log({final_date : new Date(job.date)});
    console.log({orig_length :job.length});
    var before = CONFIG.RECORD_PADDING.before;
    var after = CONFIG.RECORD_PADDING.after;
    job.length = job.length + before + after;
    console.log({final_length : job.length});
    job.tuner_index = tuner.get(job.date, job.length, schedule_queue.entire());
    job.endTime = job.date + (job.length);
    console.log({end_time : job.endTime});
    // If the returned tuner index is -1 then well we don't have an available tuner.
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
                    scheduled(childSnapshot.val());
                }

            });

            // we want to capture all the existing jobs, and convert them to new jobs
            var existing_jobs = childSnapshot.val();
            var existing_job = "";
            var obj = "";
            for (existing_job in existing_jobs) {
                console.log(existing_jobs[existing_job]);
                obj = "";
                obj = existing_jobs[existing_job];
                   // add and get a new key (managed inside fb_queue for new element)
                tvguide.name(obj.id, function (job, result) {
                      job.name = result;
                      job_queue.add(job);
                      // remove old key (this way we don't have duplicates)
                      myRootRef.child("jobs").child(job.key).remove();
                }.bind(null, obj));
            }
            
            console.log("Recurring Manager Started");
            // Start Recurring monitor, this is the repeated *search* manager
            recurring.start(function () {
                console.log("Recurring Manager Start Function Called");
                res("Success");
            }); // On Demand
            // Start On Demand monitor
            console.log("On Demand Manager Started");
            on_demand.start(function () {
                console.log("On Demand Start Function Called");
                res("Success");
            }); // On Demand
        });
    }); // Schedule Removed
};

module.exports = {
    start: start,
    scheduled : scheduled
};
