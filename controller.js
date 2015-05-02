angular.module('myApp', ['firebase'])
    .controller("MyCtrl", ["$scope", "$firebase",
        function($scope, $firebase) {
            var ref = new Firebase('');
            var regexref = new Firebase('/recurring');
            var sync = $firebase(ref);
            var resync = $firebase(regexref);

            // if ref points to a data collection
            $scope.list = sync.$asArray();

            // if ref points to a single record
            $scope.rec = sync.$asObject();

            $scope.addRecurring = function(show){
                resync.$push({'search': show});

            };

            $scope.record = function(element, parent) {
                // always start recording about 2 minutes before   
                var scheduledDate = new Date((element.StartTime - 120) * 1000);
                // always record 2 minutes before and 2 minutes after approx
                var duration = (element.EndTime - element.StartTime) + 240;


                // this should send the good stuff
                sync.$update("status", {
                    commanded: 'new',
                    program: parent.replace('.','-'),
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

        }
    ]);
