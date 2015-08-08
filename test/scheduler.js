var scheduler = require('../scheduler');

//scheduler.create_scheduled_recording('19-1','2040', 'The Big Bang Theory', '18617061', 0,'S4.E7.The_Big_Bang_Theory.The_Apology_Insufficiency');


var CONFIG = require('../config')

var date = new Date().getTime();
console.log(new Date());
var lengthVal = 3600;

console.log(new Date(date));
console.log(new Date(date + lengthVal));


var x = {
  "channel" : "19-1",
  "date" : date,
  "endTime" : date + lengthVal,
  "id" : 23964529,
  "length" : lengthVal,
  "name" : "S7.E21.The_Big_Bang_Theory.The_Anything_Can_Happen_Recurrence",
  "program" : "3",
  "startTime" : date,
  "station" : "29",
  "title" : "The Big Bang Theory"
}
console.log(x);
console.log(new Date(1439012941823));
scheduler.scheduled(x);