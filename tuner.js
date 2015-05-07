 module.exports = {
// Put tuner related items here.
name : function(){
   //hdhomerun device 103DA852 found at 169.254.52.210
  // Spawn and get this info in the future.
  return "103DA852";

},

// 0 based count
count : function(){
   //hdhomerun_config 103DA852 get /sys/debug
   // Returns a t0 and t1, perhaps this would work?
  // Spawn and get this info in the future.
  return 1;
  // IF NO TUNER
  //return -1;
}
}
