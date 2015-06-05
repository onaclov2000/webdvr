var CONFIG = require('./config');
var q = require('./queue');
var queue = new q();
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var add = function (self, obj) {
   
   var key = myRootRef.child(self.child).push(obj);
   obj.key = key.key();
   console.log("fb_queue");
  console.log(self.child);
   console.log(obj);
      console.log("fb_queue_end");
      queue.add(obj, function(self, object){
         // The timer has gone off, so we should remove the element from firebase
        console.log("removing" + object.title);
         myRootRef.child(self.child).child(object.key).remove();
      }.bind(null, self));
};


var fb_queue = function(child) {
    var self = this;
    self.child = child;
    var methods = {
//        entire: function(){return entire(self)},
        add: function(obj, res){return add(self, obj, res)},
//        remove: function(){return remove(self)},
//        element: function(){return element(self)}
        getkey : self.child
    };

    return methods;

}
module.exports = function(child) {
    return new fb_queue(child);
}
