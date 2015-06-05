var CONFIG = require('./config');
var queue = require('./queue');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var child = "jobs";
var add = function (obj) {
   var key = myRootRef.child(child).push(obj);
   obj.key = key.key();
  
      queue.add(obj, function(object){
         // The timer has gone off, so we should remove the element from firebase
        console.log("removing" + object.title);
         myRootRef.child('job').child(object.key).remove();
      });
};


var queue = function(child){
   this.entire  = entire;
   this.add     = add;
   this.remove  = remove;
   this.element = element;
   this.child = child;

};
module.exports = function(n){
   return new queue(n);
//   entire  : entire,
//   add     : add,
//   remove  : remove,
//   element : element
}


module.exports = {
//   entire : entire,
   add : add
//   remove : remove,
//   element : element
}
