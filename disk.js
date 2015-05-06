var njds = require('nodejs-disks');
module.exports = {
    //   lookup_data : 
    time : function(result){
       njds.drives(
        function (err, drives) {
            njds.drivesDetail(
                drives,
                function (err, data) {
                    for(var i = 0; i<data.length; i++)
                    {
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
