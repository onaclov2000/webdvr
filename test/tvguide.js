var tvguide = require('../tvguide');


tvguide.lineup(1500, function(chan){
   console.log("Filtered Lineup");
   print_tvguide(chan);


});

    tvguide.get(Math.floor((new Date).getTime() / 1000), 1500, function(result) {
      console.log("Unfiltered Lineup");  
      print_tvguide(result);
        });



var print_tvguide = function(channels){
for (channel in channels){
      console.log(channels[channel].Channel);
      for (episode in channels[channel].ProgramSchedules){
         console.log(channels[channel].ProgramSchedules[episode]);
         console.log(escape(channels[channel].ProgramSchedules[episode].Title));
      }
   }

}
