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
/*
                        // Get drive mount point 
                        console.log(data[i].mountpoint);

                        // Get drive total space 
                        console.log(data[i].total);

                        // Get drive used space 
                        console.log(data[i].used);
*/
                        // Get drive available space
                        //console.log(data[i].available);
                        console.log(Math.floor(data[i].available.split(' ')[0] / 3.7));
                        result(Math.floor(data[i].available.split(' ')[0] / 3.7));
/*

                        // Get drive name
                        console.log(data[i].drive);

                        // Get drive used percentage
                        console.log(data[i].usedPer);

                        // Get drive free percentage
                        console.log(data[i].freePer);
*/
                        }
                    }



                }
            );
        }
    )
}

}
