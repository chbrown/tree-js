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
  render: function() {
    return (
      <div className={"terminal node " + (this.props.node.selected ? "selected" : "")}>
        <div className="value-container"
          onMouseDown={this.mouseDown}
          onMouseEnter={this.mouseEnter}
          onMouseUp={this.mouseUp}>
          <span className="value">{this.props.node.value}</span>
        </div>
      </div>
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

var ParentNode = React.createClass({
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
      return <TreeSplitter node={child} ctrl={ctrl} />;
    });

    var value_element;
    if (this.state.editing || this.props.node.value === null || this.props.node.value == 'X') {
      value_element = (
        <form className="value-container" onSubmit={this.setValue} onDoubleClick={this.doubleClick}>
          <input className="value" autoFocus onBlur={this.setValue} ref="value" defaultValue={this.props.node.value} />
        </form>
      );
    }
    else {
      value_element = (
        <div className="value-container" onClick={this.setEditing}>
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
var TreeSplitter = React.createClass({
  propTypes: {
    node: React.PropTypes.shape(nodeShape),
    ctrl: React.PropTypes.object,
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

// bootstrap here so that we are sure the React components are availabe in the Angular controllers.
angular.element(document).ready(function() {
  angular.bootstrap(document, ['app']);
});
