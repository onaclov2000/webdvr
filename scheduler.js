

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
