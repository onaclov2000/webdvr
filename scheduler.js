

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
