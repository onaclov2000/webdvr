var CONFIG = require('./config');
var q = require('./queue');
//var queue = new q();
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var disk = require('./disk');
var add = function (self, obj, res) {
   

/* // Debugging stuff.
   console.log("fb_queue");

   console.log(obj);
   console.log("fb_queue_end");
*/
   console.log(self.child);
   if (self.queue.exists(obj.id) === false){
   var key = myRootRef.child(self.child).push(obj);
   obj.key = key.key();
      self.queue.add(obj, function(self, object){
            // The timer has gone off, so we should remove the element from firebase
           console.log("removing" + object.title);
           console.log(new Date(obj.endTime));
           // update the disk space... I mean... the darn thing should be done recording.
           disk.time(function(res) {
               console.log("updated time remaining, because why not");
               myRootRef.update({
                  "time_remaining": res/ 60
              });
            });
            
            myRootRef.child(self.child).child(object.key).remove();
         }.bind(null, self));
      }

    
};

var entire = function(self){
  //console.log(self);
  return self.queue.entire();
  
}
var duration = function(self)
{
   var duration_length = self.queue.duration();
   console.log("Duration in minutes: " + duration_length);
   return duration_length;
};

var fb_queue = function(child) {
    var self = this;
    self.child = child;
    self.queue = new q();
    var methods = {
        add: function(obj, res){return add(self, obj, res);},
        entire: function(){return entire(self);},
        duration : function(){return duration(self);}
    };

    return methods;

}
module.exports = function(child) {
    return new fb_queue(child);
}
