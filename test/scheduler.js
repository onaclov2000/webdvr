//var scheduler = require('../scheduler');

//scheduler.create_scheduled_recording('19-1','2040', 'The Big Bang Theory', '18617061', 0,'S4.E7.The_Big_Bang_Theory.The_Apology_Insufficiency');


var CONFIG = require('../config')

var date = new Date().getTime();
console.log(new Date());
date = date - CONFIG.RECORD_PADDING.before; // Confirm that I need to multiply by 1000, but I'm pretty sure I do
var lengthVal = 3600 + CONFIG.RECORD_PADDING.before + CONFIG.RECORD_PADDING.after;

console.log(new Date(date));
console.log(new Date(date + lengthVal));

console.log("jobs");
console.log(new Date(1433255400000));
console.log(new Date(1433257200000));
console.log(new Date(1433313000000));
console.log(new Date(1433314800000));
console.log(new Date(1433291400000));
console.log(new Date(1433293200000));
console.log(new Date(1433296800000));
console.log(new Date(1433341800000));
console.log(new Date(1433343600000));
console.log(new Date(1433428200000));
console.log(new Date(1433430000000));