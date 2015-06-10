var q = require('../fb_queue');
var jobs_queue = new q('jobs');
var schedule_queue = new q('schedule');
var count = 1;
var show = [];
var startTime_val = new Date().getTime()
var endTime_val_1 = startTime_val + 30 * 1000;

// 0 element
//if (queue.element() == null){
//  console.log("Pass test " + count);
//  count = count + 1;
//}
//else
//{
//   console.log("Fail test " + count);
//   count = count + 1;
//}
// First Element Queue Value
jobs_queue.add({startTime : startTime_val, channel : "channel", endTime : endTime_val_1, title : "title", id : "id"});
schedule_queue.add({startTime : startTime_val+100, channel : "channel", endTime : endTime_val_1, title : "title", id : "id2"});

console.log("jobs_queue");
console.log(jobs_queue.entire());

console.log("schedule_queue");
console.log(schedule_queue.entire());