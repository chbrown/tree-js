/*jslint browser: true */ /*globals angular, Textarea, TexParser */
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
    },
    link: function(scope, el, attrs) {
      var canvas = el[0];
      var ctx = canvas.getContext('2d');

      var height = 50;
      function redraw() {
        var root = new TexParser(scope.qtree).parse();
        root.layout(ctx);
        root.recenter();

        canvas.width = root.box_width + 20;
        canvas.height = (root.level() * height) + 20;

        // $(this).height(Math.max($(window).height() - 10, canvas.height));
        // webkitRequestAnimationFrame(draw);

        // clear the canvas by setting the width
        // canvas.width = canvas.width;

        ctx.save();
        // ctx.fillStyle = 'white';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.translate(10, 10);
        ctx.strokeStyle = '#222';
        ctx.fillStyle = '#222';

        root.draw(ctx, height, 0, 0);
        ctx.restore();
      }

      scope.$watch('qtree', redraw);
    }
  };
});

app.controller('indexCtrl', function($scope, $http, $localStorage) {
  $scope.$storage = $localStorage;

  $http.get('examples/syntax-1.json').then(function(res) {
    $scope.examples = res.data;
    $localStorage.$default({qtree: res.data[0].qtree});
  }, function(err) {
    console.error(err);
  });
});
