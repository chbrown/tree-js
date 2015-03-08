/*jslint browser: true */ /*globals _, angular, React, Textarea, pako, base64, unicode */
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
encoders are for going from the native object to a more compressed / obscure format
decoders translate the more compressed / obscure format back into the native object
*/
var coders = {
  flate: {
    /**
    flate.encode(input: string): string

    Compress a normal Javascript UTF16 string and encode the result as a base64 string.
    */
    encode: function(string) {
      if (string === undefined || string === '') return '';
      // encode the native javascript string to bytes
      var bytes = unicode.encodeString(string);
      // compress those bytes to other bytes
      var compressed_bytes = pako.deflate(bytes); // deflate means compress; compress means encode
      // encode those bytes as a base64 string so that we can store it more easily
      // TODO: avoid base64's odd characters: +, /, and =
      return base64.encodeBytes(compressed_bytes);
    },
    /**
    flate.decode(base64: string): string

    Decode and decompress a base64-encoded string into the original string.
    */
    decode: function(base64_string) {
      if (base64_string === undefined || base64_string === '') return '';
      // decode the base64 string back into its original bytes
      var compressed_bytes = base64.decodeString(base64_string);
      // decompress the bytes
      var bytes = pako.inflate(compressed_bytes); // inflate means decompress; decompress means decode
      // convert those bytes back into a string
      return unicode.decodeBytes(bytes);
    },
  },
  json: {
    encode: function(obj) {
      return JSON.stringify(obj);
    },
    decode: function(string) {
      return JSON.parse(string);
    },
  },
  // compose json and flate such that json happens on the outside
  jsonFlate: {
    encode: function(obj) {
      return coders.flate.encode(coders.json.encode(obj));
    },
    decode: function(string) {
      return coders.json.decode(coders.flate.decode(string));
    },
  },
  identity: {
    encode: function(id) {
      return id;
    },
    decode: function(id) {
      return id;
    },
  },
};

app.controller('checkerCtrl', function($scope, $timeout, $location, $localStorage) {
  $scope.$storage = $localStorage;

  $scope.state_variables = [{
    name: 'grammar',
    coder: coders.flate,
    include: true,
  }, {
    name: 'start',
    coder: coders.identity,
    include: true,
  }, {
    name: 'terminals',
    coder: coders.json,
    include: true,
  }, {
    name: 'tree',
    coder: coders.jsonFlate,
    include: true,
  }];

  var querystring = $location.search();
  $scope.state_variables.forEach(function(state_variable) {
    var value = querystring[state_variable.name];
    if (value) {
      $scope.$storage[state_variable.name] = state_variable.coder.decode(value);
      $location.search(state_variable.name, null);
    }
  });

  var placeholder_element = document.getElementById('placeholder');

  var current_tree = null;
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
  // and link it to Angular
  treeCtrl.sync = function() {
    current_tree = this.tree;
    this.render();
    $timeout(function() {
      $scope.$apply(function() {
        $localStorage.tree = current_tree.toJSON();
        $scope.check(current_tree);
        updateStateUrl();
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

  function updateStateUrl() {
    var params = {};
    $scope.state_variables.forEach(function(state_variable) {
      if (state_variable.include) {
        var value = $scope.$storage[state_variable.name];
        params[state_variable.name] = state_variable.coder.encode(value);
      }
    });
    $scope.state_url = serializeQuerystring(params);
  }

  $scope.$watch('state_variables', updateStateUrl, true);
});
