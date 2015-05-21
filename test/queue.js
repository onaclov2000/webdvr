var queue = require('../queue');
var count = 1;
var show = [];
var startTime_val = new Date().getTime()
var endTime_val_1 = startTime_val + 3000 * 1000;

// 0 element
if (queue.element() == null){
  console.log("Pass test " + count);
  count = count + 1; 
}
else
{
   console.log("Fail test " + count);
   count = count + 1;
}
// First Element Queue Value
queue.add({startTime : startTime_val, channel : "channel", endTime : endTime_val_1, title : "title", id : "id"});
if (queue.element().endTime == endTime_val_1){
  console.log("Pass test " + count);
  count = count + 1;
}
else
{
   console.log("Fail test " + count);
   count = count + 1;
}

var endTime_val_2 = startTime_val + 3600 * 1000;
var endTime_val_3 = startTime_val + 10 * 1000;
queue.add({startTime : startTime_val, channel : "channel", endTime : endTime_val_2, title : "title", id : "id"});
queue.add({startTime : startTime_val, channel : "channel", endTime : endTime_val_3, title : "title", id : "id"});

if (queue.element().endTime == endTime_val_2){
   console.log("Pass test " + count);
   count = count + 1;
   
}
else
{
   console.log("Fail test " + count);
   count = count + 1;
   console.log(queue.entire());
   console.log(queue.element().endTime - queue.element().startTime);
}
if (queue.entire()[0].endTime == endTime_val_3){
   console.log("Pass test " + count);
   count = count + 1;
   
}
else
{
   console.log("Fail test " + count);
   count = count + 1;
   console.log(queue.entire());
   console.log(queue.element().endTime - queue.element().startTime);
}


setTimeout(function(result){
   if (queue.entire()[0].endTime == endTime_val_1)
   {
      console.log("Pass");
      console.log(queue.entire());
   }
   else{
     console.log("Fail");
     console.log(queue.entire());
   }

},
15 * 1000
);
