/** @jsx React.DOM */ /*jslint browser: true */ /*globals React */

var nodeShape = {
  value: React.PropTypes.string,
  children: React.PropTypes.array,
  selected: React.PropTypes.bool,
};

var TerminalNode = React.createClass({displayName: "TerminalNode",
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  render: function() {
    return (
      React.createElement("div", {className: "terminal node " + (this.props.node.selected ? "selected" : "")}, 
        React.createElement("div", {className: "value-container", 
          onMouseDown: this.mouseDown, 
          onMouseEnter: this.mouseEnter, 
          onMouseUp: this.mouseUp}, 
          React.createElement("span", {className: "value"}, this.props.node.value)
        )
      )
    );
  },
  mouseDown: function() {
    this.props.ctrl.selectStartNode(this.props.node);
  },
  mouseEnter: function() {
    this.props.ctrl.hoverEndNode(this.props.node);
  },
  mouseUp: function() {
    this.props.ctrl.selectEndNode(this.props.node);
  },
});

var ParentNode = React.createClass({displayName: "ParentNode",
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  getInitialState: function() {
    return {
      editing: false,
    };
  },
  render: function() {
    var ctrl = this.props.ctrl;
    var cells = this.props.node.children.map(function(child) {
      return React.createElement(TreeSplitter, {node: child, ctrl: ctrl});
    });

    var value_element;
    if (this.state.editing || this.props.node.value === null || this.props.node.value === '') {
      value_element = (
        React.createElement("form", {className: "value-container", onSubmit: this.setValue, onDoubleClick: this.doubleClick}, 
          React.createElement("input", {className: "value", autoFocus: true, onBlur: this.setValue, ref: "value", defaultValue: this.props.node.value})
        )
      );
    }
    else {
      value_element = (
        React.createElement("div", {className: "value-container", onClick: this.setEditing}, 
          React.createElement("span", {className: "value"}, this.props.node.value)
        )
      );
    }

    return (
      React.createElement("div", {className: "node " + (this.props.node.selected ? "selected" : "")}, 
        value_element, 
        React.createElement("div", {className: "children"}, 
          cells
        )
      )
    );
  },
  setEditing: function(ev) {
    this.setState({editing: true});
  },
  setValue: function(ev) {
    ev.preventDefault();
    var input_value = this.refs.value.getDOMNode().value;
    this.setState({editing: false});
    if (input_value !== this.props.node.value) {
      this.props.ctrl.setNodeValue(this.props.node, input_value);
    }
  },
  doubleClick: function() {
    this.props.ctrl.collapseNode(this.props.node);
  },
});

/**
Inside a React.createClass component, the createClass acts like a class declaration,
and the custom fields you give it become properties on the instances of that class.
*/
var TreeSplitter = React.createClass({displayName: "TreeSplitter",
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  render: function() {
    if (this.props.node === undefined) {
      return React.createElement("i", null, "empty");
    }
    else if (this.props.node.children.length > 0) {
      return React.createElement(ParentNode, React.__spread({},  this.props));
    }
    else {
      return React.createElement(TerminalNode, React.__spread({},  this.props));
    }
  },
});
