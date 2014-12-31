var FB_URL = '';
var Firebase = require('firebase');
var os = require('os')
var myRootRef = new Firebase(FB_URL);

var interfaces = os.networkInterfaces();
var addresses = [];
for (k in interfaces) {
    for (k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family == 'IPv4' && !address.internal) {
            addresses.push(address.address)
        }
    }
}

// Push my IP to firebase
// Perhaps a common "devices" location would be handy
var ipRef = myRootRef.push({
    "type": "local",
    "ip": addresses[0]
});


myRootRef.on('child_changed', function(childSnapshot, prevChildNa$
   // code to handle child data changes.
   var data = childSnapshot.val();
   var localref = childSnapshot.ref();
   console.log("new data");
   console.log(data);
   if (data["commanded"] == "new") {
      console.log("New Schedule Added");
      var schedule = require('node-schedule');
      var date = new Date(data["year"], data["month"], data["day"$

      var j = schedule.scheduleJob(date, function(){
                 console.log('The world is going to end today.');
      });

      localref.update({"commanded" : "waiting"});
  }
});

/*
 * Shutting down stuff
 */
function onComplete(){
   process.exit();
}
function delete_fb_entries (){
   return function () {
          ipRef.remove(onComplete);
         }
}

//do something when app is closing
process.on('exit', delete_fb_entries());

process.stdin.resume(); //so the program will not close instantly

//catches ctrl+c event
process.on('SIGINT', delete_fb_entries());

//catches uncaught exceptions
process.on('uncaughtException', delete_fb_entries());
