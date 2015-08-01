/*jslint node: true */
"use strict";
var njds = require('nodejs-disks');
module.exports = {
    //   lookup_data :
    time: function (result) {
        njds.drives(
            function (err, drives) {
                console.log(err);
                njds.drivesDetail(
                    drives,
                    function (err, data) {
                        var i;
                        console.log(err);
                        // sometimes we get nothing?
                        try {
                            for (i = 0; i < data.length; i += 1) {
                                if (data[i].drive.indexOf('/dev/sda1') > -1) {
                                    result(Math.floor(data[i].available.split(' ')[0] / 3.7 * 60));
                                }
                            }
                        } catch (e) {
                            console.log(e); //error in the above string(in this case,yes)!
                            result(1000); // domt [prevent recording]
                        }




                    }
                );
            }
        );
    }

};