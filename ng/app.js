/*jslint browser: true */ /*globals angular, Textarea, QtreeNode, TreeNode, MouseState */
var app = angular.module('app', [
  'ngStorage',
]);

var log = console.log.bind(console);
Error.stackTraceLimit = 50;

function containingElement(node) {
  if (node.nodeType === document.TEXT_NODE) {
    return node.parentNode;
  }
  return node;
}

app.directive('splitter', function() {
  return {
    restrict: 'A',
    scope: {
      tree: '=',
    },
    link: function(scope, el, attrs) {

      document.addEventListener('mouseup', function(ev) {
        var selection = document.getSelection();
        var anchor_element = containingElement(selection.anchorNode);
        var focus_element = containingElement(selection.focusNode);

        // if (anchor_element && focus_element && !selection.isCollapsed) {}

        var anchor = scope.tree.find(anchor_element);
        var focus = scope.tree.find(focus_element);

        if (anchor === null) {
          log('Could not find selection anchor in tree', anchor_element);
          return;
        }
        if (focus === null) {
          log('Could not find selection focus in tree', focus_element);
          return;
        }

        // check if they are siblings
        var parent = anchor.parent;
        if (parent !== focus.parent) {
          log('Can not combine nodes that are not siblings', anchor, focus);
          return;
        }

        log('splitting', anchor, focus);

        var anchor_index = parent.children.indexOf(anchor);
        var focus_index = parent.children.indexOf(focus);

        var start = Math.min(anchor_index, focus_index);
        var end = Math.max(anchor_index, focus_index);

        // if the anchor and focus nodes point to/inside a range of contiguous
        // sibling nodes, remove them from the parent, create a new node that
        // includes them, and replace their position within the parent with
        // that new node.
        var new_split = new TreeNode('NEW');
        // this splice catches all the nodes between the anchor and focus nodes, inclusive.
        new_split.children = parent.children.splice(start, (end - start) + 1, new_split);

        scope.$apply(function() {
          // parent.render();
          render();
        });
      });

      function render() {
        el.empty();
        if (scope.tree !== undefined) {
          window.tree = scope.tree;
          scope.tree.render();
          el.append(scope.tree.el);
        }
      }

      scope.$watch('tree', render);
    }
  };
});

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

app.controller('indexCtrl', function($scope, $http, $localStorage) {
  $scope.$storage = $localStorage.$default({level_height: 40});

  $http.get('examples/syntax-1.json').then(function(res) {
    $scope.examples = res.data;
    $localStorage.$default({qtree: res.data[0].qtree});
  }, function(err) {
    console.error(err);
  });
});

app.controller('assignmentCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage;
});

app.controller('checkerCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage;

  $scope.reload = function() {
    var tokens = $scope.$storage.input.split(/\s+/);
    var children = tokens.map(function(token) {
      return new TreeNode(token);
    });
    var start = $scope.$storage.start;
    log('reloading [.%s %o]', start, tokens);
    $scope.tree = new TreeNode(start, children);
  };

  $scope.reload();

  // $scope.$watch('tree', function() {
  //   log('tree changed:', $scope.tree);
  // });

  $scope.check = function() {
    log('checking tree:', $scope.tree);
  };
});
