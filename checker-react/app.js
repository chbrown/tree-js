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

  try {
    $scope.tree = TreeNode.deserialize(localStorage.tree);
  }
  catch (exc) {
    console.error('could not deserialize tree from localStorage', exc);
  }

  $scope.reload = function() {
    var tokens = $scope.$storage.input.split(/\s+/);
    var children = tokens.map(function(token) {
      return new TreeNode(token);
    });
    var start = $scope.$storage.start;
    $scope.tree = new TreeNode(start, children);
  };

  $scope.sync = function(tree) {
    localStorage.tree = tree.serialize();
  };

  $scope.check = function() {
    log('checking tree:', $scope.tree);
  };
});


app.directive('reactSplitter', function() {
  return {
    restrict: 'E',
    scope: {
      tree: '=',
      sync: '&',
    },
    link: function(scope, el, attrs) {
      var startNode;

      var handler = {};
      handler.selectStartNode = function(node) {
        startNode = node;
      };
      handler.hoverEndNode = function(node) {
        if (startNode) {
          // findBridge => { parent: TreeNode<T>; start: number; end: number; }
          var bridge = TreeNode.findBridge(startNode, node);
          var bridge_nodes = bridge.parent.children.slice(bridge.start, bridge.end + 1);
          scope.tree.applyAll(function(node) {
            node.selected = false;
          });
          bridge_nodes.forEach(function(node) {
            node.selected = true;
          });
          render();
        }
      };
      handler.selectEndNode = function(node) {
        if (startNode) {
          var bridge = TreeNode.findBridge(startNode, node);
          scope.$apply(function() {
            bridge.parent.splice(bridge.start, bridge.end, '');
          });
          sync();
          // still need to deselect despite the css class; we don't want to end
          // up dragging a selection instead of starting a new selection each time
          document.getSelection().removeAllRanges();
        }
      };

      handler.mouseup = function() {
        if (startNode) {
          setTimeout(function() {
            startNode = null;
            scope.tree.applyAll(function(node) {
              node.selected = false;
            });
            render();
          }, 50);
        }
      };

      handler.collapseNode = function(node) {
        scope.$apply(function() {
          node.collapse();
          render();
          sync();
        });
      };

      handler.setNodeValue = function(node, value) {
        scope.$apply(function() {
          node.value = value;
          render();
          sync();
        });
      };

      document.addEventListener('mouseup', handler.mouseup);

      function render() {
        React.render(scope.root, el[0]);
      }

      function sync() {
        scope.sync({tree: scope.tree});
      }

      scope.$watch('tree', function() {
        scope.root = React.createElement(TreeSplitter, {node: scope.tree, tree: handler});
        React.render(scope.root, el[0]);
      });
    }
  };
});
