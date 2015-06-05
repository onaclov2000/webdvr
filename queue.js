var filter = require('./filter');

// Expectations.
// End time > start time


var entire = function(){
   return locClass.local_queue;
}

var add = function (obj, res) {
    var temp = new Date().getTime();
    if (obj.endTime > temp)
    {
       // push to local queue
       locClass.local_queue.push(obj);
       
       // expire the queue element (aka remove at predetermined time)
       setTimeout(function(val){
          var obj;
          var callback = val[1];
          var endTime = val[0];
          var q = local_queue;
          for (i=0; i <= q - 1; i++)
          {
            console.log("here");
             if (q[i].endTime == endTime){
                obj = q[i];
                q.splice(i,1);
                callback(obj);
             }
          }
       },
       (obj.endTime - obj.startTime) + 10,
       [obj.endTime, res])

    // Sort Queue by end time by default.
    locClass.local_queue.sort(filter.endTime);
    }
    else{
       res(obj);
    }
    return locClass.local_queue;
};

var remove = function(){
   // remove last item
   locClass.local_queue.splice(locClass.local_queue.length-1, 1);
   return locClass.local_queue;
}

var element = function(){
   // grab "head" of queue
   return locClass.local_queue[locClass.local_queue.length-1];
}

var queue = function() {
   var locClass = {
        entire  : entire,
        add     : add,
        remove  : remove,
        element : element,
        local_queue : []
   }
   return locClass;

};
module.exports = function() {
     return queue();
//   entire  : entire,
//   add     : add,
//   remove  : remove,
//   element : element
}
