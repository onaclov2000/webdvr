angular.module('myApp', ['firebase'])
.controller("MyCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var ref = new Firebase('');
    var sync = $firebase(ref);

    // if ref points to a data collection
    $scope.list = sync.$asArray();
    $scope.addSet = true;
    $scope.addSchedule = false;
    $scope.times = [1,2,3,4,5,6,7,8,9,10,11,12];
    $scope.am_pms = {0 : 'am',
                    12 : 'pm'};
    $scope.half_hours = {0 : '00',
                        30 : '30'};
    // if ref points to a single record
    $scope.rec = sync.$asObject();
    $scope.schedule = function (){
       var newDateObj = new Date();
       if ($scope.selectedAmPm == 'pm'){
       $scope.selectedTime += 12;
       }

       sync.$update("status", { channel : $scope.selectedStation.channel, 
                                program : $scope.selectedStation.program, 
                                day     : newDateObj.getDate(), 
                                month   : newDateObj.getMonth(), 
                                year    : newDateObj.getFullYear(), 
                                hh      : $scope.selectedTime, 
                                mm : $scope.selectedHalfHour });

      $scope.addSet = false;
      $scope.addSchedule = true;
    };

$scope.scheduled = function (){
       if ($scope.selectedStation && $scope.selectedTime && $scope.selectedHalfHour && $scope.selectedAmPm){
          sync.$update("status", { commanded : 'new'});
          $scope.addSet = true;
          $scope.addSchedule = false;
          $scope.selectedStation = "";
          $scope.selectedTime = "";
          $scope.selectedHalfHour = "";
          $scope.selectedAmPm = "";
      }
     // $scope. = "";
     // $scope. = "";
     // $scope. = ""; 
    };
  }
]);
