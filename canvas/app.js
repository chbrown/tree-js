/*jslint browser: true */ /*globals angular, Textarea, QtreeNode */
var app = angular.module('app', [
  'ngStorage',
]);

app.directive('enhance', function() {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      Textarea.enhance(el[0]);
    },
  };
});

app.directive('qtree', function() {
  return {
    restrict: 'A',
    scope: {
      qtree: '=',
      height: '=',
    },
    link: function(scope, el, attrs) {
      var canvas = el[0];
      var ctx = canvas.getContext('2d');

      function redraw() {
        var root = QtreeNode.parse(scope.qtree);
        root.layout(ctx);
        root.recenter();

        canvas.width = root.box_width + 20;
        canvas.height = (root.level() * scope.height) + 20;

        ctx.save();
        ctx.strokeStyle = '#222';
        ctx.fillStyle = '#222';

        root.draw(ctx, scope.height, 0, 0);
        ctx.restore();
      }

      scope.$watchGroup(['qtree', 'height'], redraw);
    }
  };
});

app.controller('canvasCtrl', function($scope, $http, $localStorage) {
  $scope.$storage = $localStorage.$default({level_height: 40});

  $http.get('../examples/syntax-1.json').then(function(res) {
    $scope.examples = res.data;
    $localStorage.$default({qtree: res.data[0].qtree});
  }, function(err) {
    console.error(err);
  });
});
