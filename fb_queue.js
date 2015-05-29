var CONFIG = require('./config');
var queue = require('./queue');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);

var add = function (obj) {
   var key = myRootRef.child("jobs").push(obj);
   obj.key = key.key();
  
      queue.add(obj, function(object){
         console.log("Current Date: " + new Date().getTime());
         // The timer has gone off, so we should remove the element from firebase
         myRootRef.child('job').child(object.key).remove();
      });   
};

module.exports = {
//   entire : entire,
   add : add
//   remove : remove,
//   element : element
}
