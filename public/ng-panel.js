    
    var rosterList = angular.module("myPanel", []);
    
    rosterList.controller("myCtrl", function($scope) {
      //$scope.userlist = [];
      //$scope.data = [];
      
      var socket = io.connect();
      
      $scope.challengeList = [];
      $scope.messages = [];
      $scope.roster = [];
      $scope.name = '';
      $scope.text = '';

      socket.on('connect', function () {
        $scope.setName();
        $("#status").html("connected");
      });
      
      
      
      socket.on('fighting', function () {
        $scope.setName();
        $("#fight").html("fighting" + "!");
      });
      
      socket.on('notfighting', function (name) {
        $scope.setName();
        $("#fight").html("not fighting");
      });

      socket.on('message', function (msg) {
        $scope.messages.push(msg);
        $scope.$apply();
      });

      socket.on('roster', function (names) {
        $scope.roster = names;
        $scope.$apply();
      });
      
      socket.on('challenges', function (outstandingChallenges) {
        $scope.challengeList = outstandingChallenges;
        $scope.$apply();
      });

      $scope.send = function send() {
        console.log('Sending message:', $scope.text);
        socket.emit('message', $scope.text);
        $scope.text = '';
      };

      $scope.setName = function setName() {
        socket.emit('identify', $scope.name);
      };
      
      
      //These are standard events for a disconnection... I haven't seen them yet
      socket.on('disconnect', function(){
        $("#status").html("not connected");
      });
      
      //some stackoverflow comment convinced me to include this too.
      socket.on('disconnected', function(){
        $("#status").html("not connected");
      });
      
    });
    /*
    var app = angular.module("myApp", []);
    app.controller("myCtrl", function($scope) {
      $scope.firstName = "John";
      $scope.lastName = "Doe";
      
    });
    put this part in html if needed
      <div ng-app="myApp" ng-controller="myCtrl">
      {{ firstName + " " + lastName }}
      </div>
    */

        


    $(document).ready(function(){
      $("button").click(function(event){
        alert($(event.currentTarget).attr("data-index"));
      });
      
    });
