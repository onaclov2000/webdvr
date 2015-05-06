var FB_URL = require('./config').FB_URL;
var Firebase = require('firebase');
var os = require('os')
var spawn = require('child_process').spawn;
var schedule = require('node-schedule');
var tvguide = require('./tvguide');
var myRootRef = new Firebase(FB_URL);
var dvr = require('./dvr')


dvr.start(); // is a "start" even necessary?


// Do something when app is closing
process.on('exit', dvr.cleanup());

process.stdin.resume(); //so the program will not close instantly

//catches ctrl+c event
process.on('SIGINT', dvr.cleanup());

//catches uncaught exceptions
// Here's where I'm torn. I need to call dvr.cleanup as well, not sure if this will work 
// if I add it.
//process.on('uncaughtException', dvr.cleanup_error(err));
process.on('uncaughtException', function(err) {
  console.error(err.stack);
  dvr.cleanup();
});
