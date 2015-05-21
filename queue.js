//
// Is this something we should be passing in? rather than keep re-defining it
var CONFIG = require('./config');
var Firebase = require('firebase');
var myRootRef = new Firebase(CONFIG.FB_URL);
var local_queue = [];



// scheduler file
// Should I make this a single item add?
var add_item = function (obj) {
    local_queue.push(obj);
    myRootRef.child("jobs").push({
        "date": date,
        "channel": channel_val,
        "length": length_val,
        "title": title_val,
        "id": id_val
    });
};

var add_list = function (shws) {
    var item, data, date, program = "";
    for (item in shws) {
        console.log(shws[item]);
        data = shws[item];
        if (data.date !== null) {
            date = data.date;
            program = data.channel;
        } else {
            date = new Date(data.year, data.month, data.day, data.hh, data.mm, 0);
            program = data.program;
        }
        console.log("add_queue");
        add_item(date, program, data.length, data.title, data.id);
    }

};

var endTime = function (a,b) {
  if (a.date + a.length < b.date + b.length) {
     return -1;
  }
  if (a.date + a.length > b.date + b.length) {  
    return 1;
  }
  return 0;
}
var startTime = function (a,b) {
  if (a.date < b.date)
    return -1;
  if (a.date > b.date)
    return 1;
  return 0;
}


var remove_item = function (key, res) {
   // Remove object based on key
   for( i=local_queue.length-1; i>=0; i--) {
    if( local_queue[i].key == key) {
       local_queue.splice(i,1);
    }
   }
   myRootRef.child("jobs").child(key).remove(function(error){
      console.log(error);
      res (local_queue);
   });
   
};



var remove_all = function (key, res) {
   // Remove object based on key
   for( i=local_queue.length-1; i>=0; i--) {
      myRootRef.child("jobs").child(local_queue[i].key).remove(function(error){
      
      });
      local_queue.splice(i,1);
   }
   res (local_queue);
   
};


var initialize = function(res){
   var temp_obj = {};
   myRootRef.child("jobs").once('value', function(childSnapshot) {
      childSnapshot.forEach(function(item){
         temp_obj = item.val();
         temp_obj.key = item.key();
         local_queue.push(temp_obj);
      });
      res(local_queue);    
   });

}
module.exports = {
    add_item : add_item,
    add_list : add_list,
    initialize : initialize,
    endTime : endTime,
    startTime : startTime,
    remove_item : remove_item
}
