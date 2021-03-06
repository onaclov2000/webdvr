/*jslint node: true */
"use strict";
var endTime = function (a, b) {
    if (a.endTime < b.endTime) {
        return -1;
    }
    if (a.endTime > b.endTime) {
        return 1;
    }
    return 0;
};

var startTime = function (a, b) {
    if (a.startTime < b.startTime) {
        return -1;
    }
    if (a.startTime > b.startTime) {
        return 1;
    }
    return 0;
};

var channels = function (tuner_channels, tvguide_channels) {
    var chan = "";
    for (chan in tvguide_channels) {
        if (!tuner_channels[tvguide_channels[chan].Channel.Number.replace('.', '-')]) {
            tvguide_channels.splice(chan, 1);
        }
    }
    return tvguide_channels;
};


var shows = function (tvguide_channels) {
    var res = tvguide_channels;
    var chan = "";
    var epi = "";
    var temp = "";
    for (chan in res) {
        for (epi in res[chan].ProgramSchedules) {
            //console.log(res[chan].ProgramSchedules[epi].Title);
            temp = "";
            temp = res[chan].ProgramSchedules[epi].Title.replace(/[^\x20-\x7E]+/g, '');
            if (temp.indexOf("Paid") !== -1) {
                res[chan].ProgramSchedules.splice(epi, 1);
            }
        }
    }
    return res;
};


module.exports = {
    endTime: endTime,
    startTime: startTime,
    channels: channels,
    shows: shows
};