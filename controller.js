app.controller("MyCtrl", ["$scope", "$firebase",
  function($scope, $firebase) {
    var ref = new Firebase(URL);
    var sync = $firebase(ref);

    // if ref points to a data collection
    $scope.list = sync.$asArray();

    // if ref points to a single record
    $scope.rec = sync.$asObject();
  }
]);
