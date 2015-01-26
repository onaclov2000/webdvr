angular.module('myApp', ['firebase'])
    .controller("MyCtrl", ["$scope", "$firebase",
        function($scope, $firebase) {
            var ref = new Firebase('');
            var sync = $firebase(ref);

            // if ref points to a data collection
            $scope.list = sync.$asArray();
            $scope.addSet = true;
            $scope.addSchedule = false;
            $scope.times = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            $scope.times2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
            $scope.am_pms = {
                0: 'am',
                12: 'pm'
            };
            $scope.half_hours = {
                0: '00',
                30: '30'
            };
            // if ref points to a single record
            $scope.rec = sync.$asObject();
            $scope.schedule = function() {
                var newDateObj = new Date();
                if ($scope.selectedAmPm == 'pm') {
                    $scope.selectedTime += 12;
                }
                length = ($scope.selectedLengthHour * 60 * 60) + ($scope.selectedHalfHour * 60);
                $scope.temp = sync.$update("status", {
                    channel: $scope.selectedStation.channel,
                    program: $scope.selectedStation.program,
                    day: newDateObj.getDate(),
                    month: newDateObj.getMonth(),
                    year: newDateObj.getFullYear(),
                    hh: $scope.selectedTime,
                    mm: $scope.selectedHalfHour,
                    length: length
                }).then(function(ref) {
                    //ref.key();   // bar
                    console.log("Done");
                    $scope.done = true;
                }, function(error) {
                    console.log("Error:", error);
                });
                $scope.addSet = false;
                $scope.addSchedule = true;
            };

            $scope.record = function(element, parent) {
                // always record 2 minutes before and 2 minutes after approx
                var duration = (element.EndTime - element.StartTime) + 240;
                // always start recording about 2 minutes before   
                var scheduledDate = new Date((element.StartTime - 120) * 1000);
                console.log(scheduledDate);
                console.log(parent);

                // this should send the good stuff
                sync.$update("status", {
                    commanded: 'new',
                    program: parent,
                    day: scheduledDate.getDate(),
                    month: scheduledDate.getMonth(),
                    year: scheduledDate.getFullYear(),
                    hh: scheduledDate.getHours(),
                    mm: scheduledDate.getMinutes(),
                    length: duration,
                    id: element.ProgramId,
                    title: element.Title
                });


            };

            $scope.scheduled = function() {
                if ($scope.selectedStation && $scope.selectedTime && $scope.selectedHalfHour && $scope.selectedAmPm) {
                    sync.$update("status", {
                        commanded: 'new'
                    });
                    $scope.addSet = true;
                    $scope.addSchedule = false;
                    $scope.selectedStation = "";
                    $scope.selectedTime = "";
                    $scope.selectedHalfHour = "";
                    $scope.selectedAmPm = "";
                    $scope.selectedLengthHour = "";
                    $scope.selectedHalfHour = "";
                }
                // $scope. = "";
                // $scope. = "";
                // $scope. = ""; 
            };
        }
    ]);
