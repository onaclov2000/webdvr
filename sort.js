var endTime = function(a, b) {
    if (a.endTime < b.endTime) {
        return -1;
    }
    if (a.endTime > b.endTime) {
        return 1;
    }
    return 0;
}

module.exports = {
   endTime : endTime
}
