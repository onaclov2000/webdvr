var njds = require('nodejs-disks');
module.exports = {
    //   lookup_data : 
    time : function (result){
       njds.drives(
            function (err, drives) {
            njds.drivesDetail(
                drives,
                function (err, data) {
                    for(var i = 0; i<data.length; i++)
                    {
                        
                            // perhaps update the reference to firebase whenever the value changes? but only return the value to the scheduler, 
                   //disk.time(function(res){
                   //   myRootRef.update({
                   //      "time_remaining": res
                   //   });
                  // });         
                        if (data[i].drive.indexOf('/dev/sda1') > -1){
   //                        console.log(Math.floor(data[i].available.split(' ')[0] / 3.7));
                           result(Math.floor(data[i].available.split(' ')[0] / 3.7));
                        }
                    }



                }
            );
        }
    )
}

}
