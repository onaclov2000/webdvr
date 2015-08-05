/*jslint node: true */
"use strict";
var CONFIG = require('./config');
var Queue = require('./queue');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var disk = require('./disk');

var add = function (self, obj) {
    if (self.queue.exists(obj.id) === false) {
        var key = myRootRef.child(self.child).push(obj);
        obj.key = key.key();
        self.queue.add(obj, function (self, object) {
            // The timer has gone off, so we should remove the element from firebase
            console.log("fb_queue.add: removing: " + object.title + "name: " + object.name + " id:" + object.id);
            console.log(new Date(obj.endTime));
            // update the disk space... I mean... the darn thing should be done recording.
            disk.time(function (res) {
                console.log("fb_queue.add: updated time remaining, because why not");
                myRootRef.update({
                    "time_remaining": res / 60
                });
            });

            myRootRef.child(self.child).child(object.key).remove();
        }.bind(null, self));
    }
};

var entire = function (self) {
    return self.queue.entire();

};

var duration = function (self) {
    var duration_length = self.queue.duration();
    console.log("fb_queue.duration: Duration in minutes: " + duration_length);
    return duration_length;
};

var Fb_queue = function (child) {
    var self = this;
    self.child = child;
    self.queue = new Queue();
    var methods = {
        add: function (obj) {
            return add(self, obj);
        },
        entire: function () {
            return entire(self);
        },
        duration: function () {
            return duration(self);
        }
    };
    return methods;

};

module.exports = function (child) {
    return new Fb_queue(child);
};