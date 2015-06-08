var sort = require('./sort');
// Expectations.
// End time > start time
var entire = function(self) {
    return self.local_queue;
}
var add = function(self, obj, res) {
            var temp = new Date().getTime();
            if (obj.endTime > temp) {
                // push to local queue
                self.local_queue.push(obj);
                // expire the queue element (aka remove at predetermined time)
                /* // Debugging Stuff
                console.log("timeout");
                console.log(new Date(temp));
                console.log(new Date(obj.endTime));
                console.log((obj.endTime - obj.startTime));
                */
				setTimeout(function(val) {
                        var obj;
                        for (i = 0; i <= self.local_queue.length - 1; i++) {
                            if (self.local_queue[i].endTime == val[0]) {
                                obj = self.local_queue[i];
                                self.local_queue.splice(i, 1);
                                val[1](obj);
                            }
                        }
                    }, ((obj.endTime - obj.startTime)) + 10, [obj.endTime, res])
					
                    // Sort Queue by end time by default.
                self.local_queue.sort(sort.endTime);
                return self.local_queue;
            } else {
                return false;
            }

        };
var remove = function(self) {
    // remove last item
    self.local_queue.splice(self.local_queue.length - 1, 1);
    return self.local_queue;
}
var element = function(self) {
    // grab "head" of queue
    return self.local_queue[self.local_queue.length - 1];
}

var exists = function(self, id) {
  for (item in self.local_queue){
    if (self.local_queue[item].id === id)
       return true;
  }
  return false;
  
}
var queue = function() {
    var self = this;
    self.local_queue = [];
    var methods = {
        entire: function(){return entire(self)},
        add: function(obj, res){return add(self, obj, res)},
        remove: function(){return remove(self)},
        element: function(){return element(self)},
        exists: function(id){return exists(self, id)}
    };

    return methods;

}
module.exports = function() {
    return new queue();
}
