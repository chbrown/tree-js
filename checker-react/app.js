/*jslint browser: true */ /*globals _, angular, React, Textarea, TreeNode */
var app = angular.module('app', [
  'ngStorage',
]);

var log = console.log.bind(console);
Error.stackTraceLimit = 50;

app.directive('enhance', function() {
  return {
    restrict: 'A',
    link: function(scope, el, attrs) {
      Textarea.enhance(el[0]);
    },
  };
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
    // log('checkerCtrl:reloading [.%s %o]', start, tokens);
    var tree = new TreeNode(start, children);
    $scope.tree = tree;
  };

  $scope.reload();

  $scope.$watch('tree', function() {
    // log('tree changed:', $scope.tree);
  });

  $scope.check = function() {
    log('checking tree:', $scope.tree);
  };
});


app.directive('reactSplitter', function() {
  return {
    restrict: 'E',
    scope: {
      tree: '=',
    },
    link: function(scope, el, attrs) {
      var tree = scope.tree;

      var startNode;
      tree.selectStartNode = function(node) {
        startNode = node;
      };
      tree.hoverEndNode = function(node) {
        if (startNode) {
          // findBridge => { parent: TreeNode<T>; start: number; end: number; }
          var bridge = TreeNode.findBridge(startNode, node);
          var bridge_nodes = bridge.parent.children.slice(bridge.start, bridge.end + 1);
          tree.applyAll(function(node) {
            node.selected = false;
          });
          bridge_nodes.forEach(function(node) {
            node.selected = true;
          });
          render();
        }
      };
      tree.selectEndNode = function(node) {
        if (startNode) {
          var bridge = TreeNode.findBridge(startNode, node);
          scope.$apply(function() {
            bridge.parent.splice(bridge.start, bridge.end, "NEW");
          });
          // still need to deselect despite the css class; we don't want to end
          // up dragging a selection instead of starting a new selection each time
          document.getSelection().removeAllRanges();
        }
      };
      document.addEventListener('mouseup', function() {
        if (startNode) {
          setTimeout(function() {
            startNode = null;
            tree.applyAll(function(node) {
              node.selected = false;
            });
            render();
          }, 50);
        }
      });

      var root = React.createElement(TreeSplitter, {node: tree, tree: tree});
      function render() {
        React.render(root, el[0]);
      };
      render();
    }
  };
});