angular.module('myApp', ['firebase'])
.controller("MyCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var ref = new Firebase('');
    var sync = $firebase(ref);

    // if ref points to a data collection
    $scope.list = sync.$asArray();
    $scope.addSet = true;
    $scope.addSchedule = false;
    // if ref points to a single record
    $scope.rec = sync.$asObject();
    $scope.schedule = function (){
       var oldDateObj = new Date();
       var newDateObj = new Date(oldDateObj.getTime() + 30*60000);
       sync.$update("status", { channel : $scope.selectedStation.channel, 
                                program : $scope.selectedStation.program, 
                                day     : newDateObj.getDate(), 
                                month   : newDateObj.getMonth(), 
                                year    : newDateObj.getFullYear(), 
                                hh      : newDateObj.getHours(), 
                                mm : newDateObj.getMinutes() });
      $scope.addSet = false;
      $scope.addSchedule = true;
    };

$scope.scheduled = function (){
       sync.$update("status", { commanded : 'new'});
       $scope.addSet = true;
       $scope.addSchedule = false;
    };
  }
]);
