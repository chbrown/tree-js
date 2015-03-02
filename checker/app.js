/*jslint browser: true */ /*globals angular, Textarea, QtreeNode, TreeNode, MouseState */
var app = angular.module('app', [
  'ngStorage',
]);

var log = console.log.bind(console);

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
          // parent.render(); // since the elements above don't need to be re-rendered?
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

  $scope.$watch('tree', function() {
    log('tree changed:', $scope.tree);
  });

  $scope.check = function() {
    log('checking tree:', $scope.tree);
  };
});
