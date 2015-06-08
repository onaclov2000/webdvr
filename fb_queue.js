var CONFIG = require('./config');
var q = require('./queue');
var queue = new q();
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var disk = require('./disk');
var add = function (self, obj) {
   
   var key = myRootRef.child(self.child).push(obj);
   obj.key = key.key();
/* // Debugging stuff.
   console.log("fb_queue");
   console.log(self.child);
   console.log(obj);
   console.log("fb_queue_end");
*/
   if (queue.exists(obj.id) === false){
      console.log(obj.id);
      queue.add(obj, function(self, object){
            // The timer has gone off, so we should remove the element from firebase
           console.log("removing" + object.title);
           // update the disk space... I mean... the darn thing should be done recording.
           
           disk.time(function(res) {
               console.log("updated time remaining, because why not");
               myRootRef.update({
                  "time_remaining": res
              });
            });
            
            myRootRef.child(self.child).child(object.key).remove();
         }.bind(null, self));
      }

    
};


var fb_queue = function(child) {
    var self = this;
    self.child = child;
    var methods = {
        add: function(obj, res){return add(self, obj, res)},
    };

    return methods;

}
module.exports = function(child) {
    return new fb_queue(child);
}
