/**
Create a new DOM Element with the given tag, attributes, and childNodes.
If childNodes are not already DOM Node objects, each item in childNodes
will be stringified and inserted as a text Node.

If childNodes is a NodeList or something other than an Array, this will break.
*/
function El(tagName, children) {
    if (children === void 0) { children = []; }
    var element = document.createElement(tagName);
    for (var i = 0, child; (child = children[i]); i++) {
        // automatically convert plain strings to text nodes
        if (!(child instanceof Node)) {
            child = document.createTextNode(String(child));
        }
        element.appendChild(child);
    }
    return element;
}
;
/**

Constructor:

    function TreeNode(value, children) {
      this.value = (value === undefined) ? null : value;
      this.children = (children === undefined) ? [] : children;
    }

*/
var TreeNode = (function () {
    function TreeNode(value, children) {
        if (value === void 0) { value = null; }
        if (children === void 0) { children = []; }
        this.value = value;
        this.children = children;
    }
    Object.defineProperty(TreeNode.prototype, "children", {
        get: function () {
            return this.__children;
        },
        set: function (children) {
            var _this = this;
            // extend children with parent links
            children.forEach(function (child) {
                child.parent = _this;
            });
            this.__children = children;
        },
        enumerable: true,
        configurable: true
    });
    /**
    Redraw the entire tree, discarding any existing elements.
    */
    TreeNode.prototype.render = function () {
        if (this.children.length > 0) {
            this.el = El('table', [
                El('caption', [String(this.value)]),
                El('tr', this.children.map(function (child) {
                    child.render();
                    return El('td', [child.el]);
                })),
            ]);
        }
        else {
            this.el = El('span', [String(this.value)]);
        }
    };
    /**
    Find the tree node represented by a DOM Node.
  
    Returns null if there are no matches.
    */
    TreeNode.prototype.find = function (target) {
        if (target === this.el) {
            return this;
        }
        for (var i = 0, child; (child = this.children[i]); i++) {
            var result = child.find(target);
            if (result)
                return result;
        }
        return null;
    };
    /**
    Return all nodes between two sibling nodes, inclusive.
  
    Returns an empty list if they are not siblings.
    */
    TreeNode.prototype.toJSON = function () {
        if (this.children.length > 0) {
            return [this.value, this.children];
        }
        else {
            return this.value;
        }
    };
    TreeNode.prototype.toString = function () {
        if (this.children.length) {
            var children_strings = this.children.map(function (node) {
                return node.toString();
            });
            return "(" + this.value + " " + children_strings.join(' ') + ")";
        }
        return "(" + this.value + ")";
    };
    return TreeNode;
})();
