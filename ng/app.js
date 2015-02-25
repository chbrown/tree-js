/*jslint browser: true */ /*globals angular, TexParser */
var app = angular.module('app', [
  'ngStorage',
]);

function undent(string) {
  var indent = 100;
  var lines = string.split(/\n/g);
  lines.forEach(function(line) {
    var whitespace = line.match(/^(\s+)\S/);
    if (whitespace) {
      indent = Math.min(whitespace[1].length, indent);
    }
  });
  return lines.map(function(line) {
    return line.slice(indent);
  }).join('\n');
}

app.directive('qtree', function() {
  return {
    restrict: 'A',
    scope: {
      qtree: '=',
      width: '=',
      height: '=',
    },
    link: function(scope, el, attrs) {
      var canvas = el[0];
      var ctx = canvas.getContext('2d');

      var height = 50;
      function redraw() {
        var root = new TexParser(scope.qtree).parse();
        root.layout(ctx);
        root.recenter();

        scope.width = canvas.width = root.box_width + 20;
        scope.height = canvas.height = (root.level() * height) + 20;

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
  }, function(err) {
    console.error(err);
  });
});
