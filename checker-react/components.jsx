/** @jsx React.DOM */ /*jslint browser: true */ /*globals React */

/**
Inside a React.createClass component, the createClass acts like a class declaration,
and the custom fields you give it become properties on the instances of that class.
*/
var TreeSplitter = React.createClass({
  getInitialState: function() {
    return {
      editingParentValue: false,
    };
  },
  render: function() {
    var tree = this.props.tree;
    var node = this.props.node;
    var className = this.props.node.selected ? 'selected' : '';
    if (node.children.length > 0) {
      var cells = node.children.map(function(child) {
        return <td><TreeSplitter node={child} tree={tree} /></td>;
      });

      var parent_value;
      if (this.state.editingParentValue || this.props.node.value === '') {
        parent_value = (
          <form onSubmit={this.setParentValue}>
            <input className="parent-node-value" autoFocus onBlur={this.setParentValue}
              ref="parentValue" defaultValue={node.value} />
          </form>
        );
      }
      else {
        parent_value = (
          <span className="parent-node-value">{node.value}</span>
        );
      }

      return (
        <table className={className}>
          <tr>
            <th className="parent-node" colSpan={cells.length} onClick={this.editValue} onDoubleClick={this.doubleClick}>
              {parent_value}
            </th>
          </tr>
          <tr>
            {cells}
          </tr>
        </table>
      );
    }
    else {
      return (
        <span className={'terminal-node ' + className}
          onMouseDown={this.mouseDown}
          onMouseEnter={this.mouseEnter}
          onMouseUp={this.mouseUp}>
          {node.value}
        </span>
      );
    }
  },
  setParentValue: function(ev) {
    ev.preventDefault();
    var input = this.refs.parentValue.getDOMNode();
    this.setState({editingParentValue: false});
    if (input.value !== this.props.node.value) {
      this.props.tree.setNodeValue(this.props.node, input.value);
    }
  },
  editValue: function() {
    this.setState({editingParentValue: true});
  },
  doubleClick: function() {
    this.props.tree.collapseNode(this.props.node);
  },
  mouseDown: function() {
    this.props.tree.selectStartNode(this.props.node);
  },
  mouseEnter: function() {
    this.props.tree.hoverEndNode(this.props.node);
  },
  mouseUp: function() {
    this.props.tree.selectEndNode(this.props.node);
  },
  captionClick: function() {
    console.log('TreeSplitter.captionClick', event);
  }
});

// bootstrap here so that we are sure the React components are availabe in the Angular controllers.
angular.element(document).ready(function() {
  angular.bootstrap(document, ['app']);
});
