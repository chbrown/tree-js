/*jslint browser: true */ /*globals _, angular, React, Textarea, TreeNode, TreeSplitter, TreeController, Grammar */
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
  $scope.$storage = $localStorage.$default({
    grammar: '',
    input: '',
    start: 'S',
  });

  var placeholder_element = document.getElementById('placeholder');

  var treeCtrl = new TreeController();
  // extend the TreeController with React-awareness
  treeCtrl.render = function() {
    var props = {ctrl: this, node: this.tree};
    if (this.react_component === undefined) {
      this.react_component = React.render(React.createElement(TreeSplitter, props), placeholder_element);
    }
    else {
      this.react_component.setProps(props);
    }
  };
  treeCtrl.sync = function() {
    var tree = this.tree;
    log('TreeController#sync: in-scope: %o', tree.toTuple());
    this.render();
    setTimeout(function() {
      $scope.$apply(function() {
        $localStorage.tree = tree.toTuple(); //.clone();
        $scope.check(tree);
      });
    }, 10);
  };

  var initial_tree = new TreeNode(null);
  try {
    initial_tree = TreeNode.fromTuple($localStorage.tree);
  }
  catch (exc) {
    console.error('could not recover tree from $localStorage; initializing with empty tree', exc);
  }
  log('initial tree', initial_tree);
  treeCtrl.setTree(initial_tree);

  $scope.setTreeFromStartAndTerminals = function(start, terminals) {
    var children = terminals.map(function(terminal) {
      return new TreeNode(terminal);
    });
    var tree = new TreeNode(start, children);
    treeCtrl.setTree(tree);
  };

  $scope.check = function(tree) {
    var grammar = Grammar.parseBNF($scope.$storage.grammar);
    $scope.errors = grammar.findErrors(tree);
  };
});
