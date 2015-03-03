/** @jsx React.DOM */ /*jslint browser: true */ /*globals React */

/**
Inside a React.createClass component, the createClass acts like a class declaration,
and the custom fields you give it become properties on the instances of that class.
*/
var TreeSplitter = React.createClass({
  render: function() {
    var tree = this.props.tree;
    var node = this.props.node;
    var className = this.props.node.selected ? 'selected' : '';
    if (node.children.length > 0) {
      var cells = node.children.map(function(child) {
        return <td><TreeSplitter node={child} tree={tree} /></td>;
      });
      return (
        <table className={className}>
          <tr>
            <th className="parent" colSpan={cells.length} onClick={this.captionClick}>{node.value}</th>
          </tr>
          <tr>
            {cells}
          </tr>
        </table>
      );
    }
    else {
      return (
        <span className={className}
          onMouseDown={this.mouseDown}
          onMouseEnter={this.mouseEnter}
          onMouseUp={this.mouseUp}>
          {node.value}
        </span>
      );
    }
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
