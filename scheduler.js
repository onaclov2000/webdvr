

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
