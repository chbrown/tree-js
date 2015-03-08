/** @jsx React.DOM */ /*jslint browser: true */ /*globals React */

var nodeShape = {
  value: React.PropTypes.string,
  children: React.PropTypes.array,
  selected: React.PropTypes.bool,
};

var TerminalNode = React.createClass({
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return (nextProps.node !== this.props.node) || (nextState !== this.state);
  },
  render: function() {
    return (
      <div className={"terminal node " + (this.props.node.selected ? "selected" : "")}>
        <div className="value-container"
          onMouseDown={this.mouseDown}
          onMouseOver={this.hover}
          onMouseUp={this.mouseUp}>
          <span className="value">{this.props.node.value}</span>
        </div>
      </div>
    );
  },
  mouseDown: function() {
    this.props.ctrl.setStartNode(this.props.node);
  },
  hover: function() {
    this.props.ctrl.hoverEndNode(this.props.node);
  },
  mouseUp: function() {
    this.props.ctrl.selectEndNode(this.props.node);
  },
});

var ParentNode = React.createClass({
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  getInitialState: function() {
    return {
      mouse_down: false,
      editing: false,
    };
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return (nextProps.node !== this.props.node) || (nextState !== this.state);
  },
  render: function() {
    var ctrl = this.props.ctrl;
    var cells = this.props.node.children.map(function(child) {
      return <TreeSplitter node={child} ctrl={ctrl} />;
    });

    var value_element;
    if (this.state.editing || this.props.node.value === null || this.props.node.value === '') {
      // the form should not handle onMouseDown={this.mouseDown},
      // which would make double clicking impossible (since the first click would splice in a new node)
      value_element = (
        <form className="value-container"
          onSubmit={this.setValue}
          onDoubleClick={this.collapse}
          onMouseOver={this.hover}
          onMouseUp={this.mouseUp}>
          <input className="value" autoFocus onBlur={this.setValue} ref="value" defaultValue={this.props.node.value} />
        </form>
      );
    }
    else {
      value_element = (
        <div className="value-container"
          onMouseDown={this.mouseDown}
          onMouseOver={this.hover}
          onMouseLeave={this.mouseLeave}
          onMouseUp={this.mouseUp}>
          <span className="value">{this.props.node.value}</span>
        </div>
      );
    }

    return (
      <div className={"node " + (this.props.node.selected ? "selected" : "")}>
        {value_element}
        <div className="children">
          {cells}
        </div>
      </div>
    );
  },
  setValue: function(ev) {
    ev.preventDefault();
    var input_value = this.refs.value.getDOMNode().value;
    this.setState({editing: false});
    if (input_value !== this.props.node.value) {
      this.props.ctrl.setNodeValue(this.props.node, input_value);
    }
  },
  mouseDown: function() {
    // on mouseDown, we have to decide whether to start a selection or edit this node
    // if we mouseDown and then mouseLeave, it's a selection.
    // if we mouseDown and then mouseUp, we edit this node.
    this.setState({mouse_down: true});
  },
  hover: function() {
    this.props.ctrl.hoverEndNode(this.props.node);
  },
  mouseLeave: function() {
    if (this.state.mouse_down) {
      this.setState({mouse_down: false});
      this.props.ctrl.setStartNode(this.props.node);
    }
  },
  mouseUp: function() {
    if (this.state.mouse_down) {
      this.setState({mouse_down: false, editing: true});
    }
    this.props.ctrl.selectEndNode(this.props.node);
  },
  collapse: function() {
    this.setState({editing: false});
    this.props.ctrl.collapseNode(this.props.node);
  },
});

/**
Inside a React.createClass component, the createClass acts like a class declaration,
and the custom fields you give it become properties on the instances of that class.
*/
var TreeSplitter = React.createClass({
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    return (nextProps.node !== this.props.node) || (nextState !== this.state);
  },
  render: function() {
    if (this.props.node === undefined) {
      return <i>empty</i>;
    }
    else if (this.props.node.children.length > 0) {
      return <ParentNode {...this.props} />;
    }
    else {
      return <TerminalNode {...this.props} />;
    }
  },
});
