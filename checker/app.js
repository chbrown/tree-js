/*jslint browser: true */ /*globals _, angular, React, Textarea, compress, decompress */
/*globals TreeNode, TreeSplitter, TreeController, Grammar */
var app = angular.module('app', [
  'ngStorage',
]);

var log = console.log.bind(console);
Error.stackTraceLimit = 50;

function serializeQuerystring(query) {
  var pairs = [];
  for (var key in query) {
    var value = query[key];
    if (value) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
  }
  return (pairs.length > 0) ? ('?' + pairs.join('&')) : '';
}

app.config(function($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false,
  });
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

/**
Decompress / parse a value based on an array of filter names.
*/
function applyFilters(value, filters) {
  for (var i = 0, filter; (filter = filters[i]); i++) {
    if (filter == 'flate') {
      try {
        value = decompress(value);
      }
      catch (exc) {
        console.error('Could not decompress flate value "%s"', value);
      }
    }
    else if (filter == 'json') {
      try {
        value = JSON.parse(value);
      }
      catch (exc) {
        console.error('Could not parse JSON value "%s"', value);
      }
    }
    else {
      console.error('No application available for filter "%s"', filter);
    }
  }
  return value;
}

app.controller('checkerCtrl', function($scope, $timeout, $location, $localStorage) {
  $scope.$storage = $localStorage;

  var querystring = $location.search();
  for (var key_specifier in querystring) {
    // If a key has the suffix "~flate", it will be decompressed.
    // If a key has the suffix "~json", it will be JSON.parse'd.
    // If a key has the suffix "~flate-json", it will be decompressed and then JSON.parse'd.
    var key_parts = key_specifier.split('~');
    var key = key_parts[0];
    var value = applyFilters(querystring[key_specifier], (key_parts[1] || '').split('-'));

    $scope.$storage[key] = value;
    $location.search(key_specifier, null);
  }

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
    // log('TreeController#sync: in-scope', JSON.stringify(tree.toTuple()));
    this.render();
    $timeout(function() {
      $scope.$apply(function() {
        $scope.treeChanged(tree); //.clone();
      });
    });
  };

  var initial_tree = new TreeNode(null);
  try {
    initial_tree = TreeNode.fromJSON($localStorage.tree);
  }
  catch (exc) {
    console.error('could not recover tree from $localStorage; initializing with empty tree', exc);
  }
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
    if (tree.children.length === 0 && tree.value === null) {
      $scope.errors = null;
    }
    else {
      $scope.errors = grammar.findErrors(tree);
    }
  };

  $scope.treeChanged = function(tree) {
    $localStorage.tree = tree.toJSON();
    $scope.check(tree);
    var params = {
      'grammar~flate': compress($scope.$storage.grammar),
      start: $scope.$storage.start,
      'terminals~json': JSON.stringify($scope.$storage.terminals),
      'tree~flate-json': compress(JSON.stringify(tree)),
    };
    $scope.state_url = serializeQuerystring(params);
  };
});
