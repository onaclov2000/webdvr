var filter = require('./filter');
var local_queue = [];

// Expectations. 
// End time > start time


var entire = function(){
   return local_queue;
}

var add = function (obj) {
    // push to local queue
    local_queue.push(obj);

    // expire the queue element (aka remove at predetermined time)
    setTimeout(function(val){
       for (i=0; i < local_queue.length - 1; i++)
       {
          if (local_queue[i].endTime == val){
             local_queue.splice(i,1);
          }
       }
    },
    (obj.endTime - obj.startTime) + 10,
    [obj.endTime])

    // Sort Queue by end time by default.
    local_queue.sort(filter.endTime);
    return local_queue;
};

var remove = function(){
   // remove last item
   local_queue.splice(local_queue.length-1, 1);
   return local_queue;
}

var element = function(){
   return local_queue[local_queue.length-1];
}


module.exports = {
   entire : entire,
   add : add,
   remove : remove,
   element : element
}
