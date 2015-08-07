/*jslint node: true */
"use strict";
var sort = require('./sort');
// Expectations.
// End time > start time
var entire = function (self) {
    return self.local_queue;
};
var add = function (self, obj, res) {
    var temp = new Date().getTime();
    if (obj.endTime > temp) {
        // push to local queue
        self.local_queue.push(obj);
        console.log(obj);
        console.log("Expires at:");
        console.log(new Date(obj.endTime));
        console.log("in");
        console.log((obj.endTime - temp) + 10);
        console.log("milliseconds");
        setTimeout(function (val) {
            var obj = "";
            var i = "";
            for (i = 0; i <= self.local_queue.length - 1; i += 1) {
                if (self.local_queue[i].endTime === val[0]) {
                    obj = self.local_queue[i];
                    self.local_queue.splice(i, 1);
                    val[1](obj);
                }
            }
        }, ((obj.endTime - temp)) + 10, [obj.endTime, res]);

        // Sort Queue by end time by default.
        self.local_queue.sort(sort.endTime);
        return self.local_queue;
    }
    return false;

};

var remove = function (self) {
    // remove last item
    self.local_queue.splice(self.local_queue.length - 1, 1);
    return self.local_queue;
};

var element = function (self) {
    // grab "head" of queue
    return self.local_queue[self.local_queue.length - 1];
};

var exists = function (self, id) {
    var item = "";
    for (item in self.local_queue) {
        console.log("Current ID: " + self.local_queue[item].id + " Looking for ID: " + id);
        if (self.local_queue[item].id === id) {
            console.log(new Date() + ": Duplicate Found");
            return true;
        }
    }
    console.log({queue : self.local_queue})
    return false;

};

var duration = function (self) {
    var total_duration = 0;
    var item = "";
    for (item in self.local_queue) {
        total_duration = total_duration + (self.local_queue[item].length / 60);
    }
    return total_duration; // in minutes
};

var Queue = function () {
    var self = this;
    self.local_queue = [];
    var methods = {
        entire: function () {
            return entire(self);
        },
        add: function (obj, res) {
            return add(self, obj, res);
        },
        remove: function () {
            return remove(self);
        },
        element: function () {
            return element(self);
        },
        exists: function (id) {
            return exists(self, id);
        },
        duration: function () {
            return duration(self);
        }
    };

    return methods;

};

module.exports = function () {
    return new Queue();
};