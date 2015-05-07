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
                var scheduledDate = new Date(element.StartTime);
                var duration = (element.EndTime - element.StartTime);


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
