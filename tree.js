var MouseState = (function () {
    function MouseState(target) {
        var _this = this;
        if (target === void 0) { target = document; }
        this.down = false;
        target.addEventListener('mousedown', function () {
            _this.down = true;
        });
        target.addEventListener('mouseup', function () {
            _this.down = false;
        });
    }
    Object.defineProperty(MouseState.prototype, "up", {
        get: function () {
            return !this.down;
        },
        enumerable: true,
        configurable: true
    });
    return MouseState;
})();
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
    Object.defineProperty(TreeNode.prototype, "children", {
        get: function () {
            return this.__children;
        },
        set: function (children) {
            for (var i = 0, child; (child = children[i]); i++) {
                child.parent = this;
            }
            this.__children = children;
        },
        enumerable: true,
        configurable: true
    });
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
var QtreeNode = (function () {
    function QtreeNode(value, children) {
        if (value === void 0) { value = ''; }
        if (children === void 0) { children = []; }
        this.value = value;
        this.children = children;
    }
    QtreeNode.prototype.layout = function (context) {
        var children_width = 0;
        this.children.forEach(function (child) {
            children_width += child.layout(context);
        });
        this.text_width = context.measureText(this.value).width;
        this.box_width = Math.max(children_width, this.text_width + 5);
        return this.box_width;
    };
    QtreeNode.prototype.recenter = function () {
        if (this.children.length) {
            var offset = 0;
            var centers = [];
            this.children.map(function (child) {
                centers.push(child.recenter() + offset);
                offset += child.box_width;
            });
            this.center = (centers[0] + centers[centers.length - 1]) / 2;
            return this.center;
        }
        this.center = this.box_width / 2;
        return this.center;
    };
    QtreeNode.prototype.draw = function (context, height, offset_x, offset_y) {
        var _this = this;
        var child_offset = 0;
        context.fillText(this.value, offset_x + this.center - (this.text_width / 2), offset_y + 10);
        context.beginPath();
        this.children.forEach(function (child) {
            context.moveTo(offset_x + _this.center, offset_y + 12);
            context.lineTo(offset_x + child_offset + child.center, offset_y + height);
            child_offset += child.box_width;
        });
        context.stroke();
        child_offset = 0;
        this.children.forEach(function (child) {
            child.draw(context, height, offset_x + child_offset, offset_y + height);
            child_offset += child.box_width;
        });
    };
    QtreeNode.prototype.level = function () {
        var depths = this.children.map(function (child) {
            return child.level() + 1;
        });
        depths.push(1);
        return Math.max.apply(null, depths);
    };
    QtreeNode.parse = function (tex) {
        var parser = new QtreeParser(tex);
        return parser.parseNode();
    };
    return QtreeNode;
})();
var QtreeParser = (function () {
    function QtreeParser(tex) {
        this.tex = tex;
        this.i = 0;
        // find the starting point of the outermost tree
        this.i = this.tex.indexOf('[');
    }
    /** read through the underlying string input, and return a node representing
    the first [.X Y Z ] structure we come to.
    */
    QtreeParser.prototype.parseNode = function () {
        var node = new QtreeNode();
        // tex[i] == [
        this.i++;
        while (this.tex[this.i]) {
            if (this.tex[this.i] == '.') {
                this.i++;
                node.value = this.parseString();
            }
            else if (this.tex[this.i] === '[') {
                node.children.push(this.parseNode());
            }
            else if (this.tex[this.i] === ']') {
                break;
            }
            else if (this.tex[this.i].match(/\S/)) {
                node.children.push(new QtreeNode(this.parseString()));
            }
            this.i++;
        }
        return node;
    };
    QtreeParser.prototype.parseString = function () {
        var name = '';
        var depth = 0;
        while (this.tex[this.i]) {
            if (this.tex[this.i] === '{') {
                depth++;
            }
            else if (this.tex[this.i] === '}') {
                depth--;
            }
            else {
                name += this.tex[this.i];
            }
            this.i++;
            // keep going until we hit whitespace with a depth of = 0
            if (depth === 0 && this.tex[this.i].match(/\s/)) {
                break;
            }
        }
        return name.replace(/\\\\/g, ' ').replace(/\\1/g, "'");
    };
    return QtreeParser;
})();
