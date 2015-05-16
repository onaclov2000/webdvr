module.exports = {
   FB_URL : 'https://onaclovtech-home.firebaseio.com/dvr/', // full path to your Firebase URL, other config items will also fall into this in the future.
   UPDATE_FREQUENCY : {hour : 11, minute : 59, duration : 1500}, //Default is 12 hour updates, with 25 hr duration
   ANTENNA : 20385.268435456, // EXPLAIN HOW TO GET THIS INFO, THIS IS YOUR LOCATION.
   RECORD_PADDING : {before : 120, after : 120} // padding to record 2 minutes before and 2 minutes after
}
