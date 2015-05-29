var filter = require('./filter');
var local_queue = [];

// Expectations. 
// End time > start time


var entire = function(){
   return local_queue;
}

var add = function (obj, res) {
    var temp = new Date().getTime();
    if (obj.endTime > temp)
    {
       // push to local queue
       local_queue.push(obj);

       // expire the queue element (aka remove at predetermined time)
       setTimeout(function(val){
          var obj;
          console.log('Timeout value' + val[0]);
          for (i=0; i <= local_queue.length - 1; i++)
          {
             if (local_queue[i].endTime == val[0]){
                obj = local_queue[i];
                local_queue.splice(i,1);
                console.log("this it?");
                val[1](obj);           
             }
          }
       },
       (obj.endTime - obj.startTime) + 10,
       [obj.endTime, res])

    // Sort Queue by end time by default.
    local_queue.sort(filter.endTime);
    }
    else{
       res(obj);
    }
    return local_queue;
};

var remove = function(){
   // remove last item
   local_queue.splice(local_queue.length-1, 1);
   return local_queue;
}

var element = function(){
   // grab "head" of queue
   return local_queue[local_queue.length-1];
}


module.exports = {
   entire : entire,
   add : add,
   remove : remove,
   element : element
}
