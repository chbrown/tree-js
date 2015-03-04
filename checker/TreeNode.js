function indexOfFirstInequality(xs, ys) {
    for (var index = 0, length = Math.min(xs.length, ys.length); index < length; index++) {
        if (xs[index] !== ys[index]) {
            return index;
        }
    }
    return length;
}
function arraysEqual(xs, ys) {
    for (var i = 0, l = Math.max(xs.length, ys.length); i < l; i++) {
        if (xs[i] !== ys[i]) {
            return false;
        }
    }
    return true;
}
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
    Apply a function to each node in the whole tree (at least, the whole tree
    at or below this node), beginning at this node, depth-first.
    */
    TreeNode.prototype.applyAll = function (func) {
        func(this);
        this.children.forEach(function (child) {
            child.applyAll(func);
        });
    };
    /**
    Split off a sequence of sibling nodes into their own subtree.
  
      -- A.splice(2, 3, 'G')
          A             A
      / / | \ \      / /  \ \
      B C D E F      B G  E F
                      / \
                     C   D
  
    */
    TreeNode.prototype.splice = function (start, end, value) {
        var new_node = new TreeNode(value);
        // this splice catches all the nodes between the anchor and focus nodes, inclusive.
        new_node.children = this.children.splice(start, (end - start) + 1, new_node);
        new_node.parent = this;
    };
    /**
    Un-splice. Removes the called node, with the parent absorbing the children
    in the same place / order.
    */
    TreeNode.prototype.collapse = function () {
        if (!this.parent)
            throw new Error('Cannot collapse the root node');
        if (this.children.length === 0)
            throw new Error('Cannot collapse a terminal node');
        var parent = this.parent;
        var index = parent.children.indexOf(this);
        // fix the children's concept of parent
        this.children.forEach(function (child) {
            child.parent = parent;
        });
        var splice_args = this.children.slice(0);
        splice_args.unshift(index, 1);
        // remove the current node from the parent's children, and replace it with
        // the current node's children.
        Array.prototype.splice.apply(parent.children, splice_args);
    };
    /**
    Return a list of parents of this node, from oldest to youngest,
    ending with the calling node.
    */
    TreeNode.prototype.lineage = function () {
        var node = this;
        var parents = [node];
        while ((node = node.parent)) {
            parents.unshift(node);
        }
        return parents;
    };
    TreeNode.prototype.clone = function () {
        var children = this.children.map(function (child) { return child.clone(); });
        return new TreeNode(this.value, children);
    };
    /** Need custom JSON-ifier to avoid circularity (.parent) problems */
    TreeNode.prototype.toJSON = function () {
        return {
            value: this.value,
            children: this.children.map(function (child) { return child.toJSON(); })
        };
    };
    TreeNode.fromJSON = function (root) {
        var children = root.children.map(function (child) { return TreeNode.fromJSON(child); });
        return new TreeNode(root.value, children);
    };
    TreeNode.prototype.toTuple = function () {
        var children = this.children.map(function (child) { return child.toTuple(); });
        return (children.length > 0) ? [this.value, children] : [this.value];
    };
    TreeNode.fromTuple = function (tuple) {
        var children = (tuple[1] || []).map(function (child) { return TreeNode.fromTuple(child); });
        return new TreeNode(tuple[0], children);
    };
    TreeNode.findFirstCommonAncestor = function (a, b) {
        // get the two lines of ancestry
        var a_lineage = a.lineage();
        var b_lineage = b.lineage();
        // if they come from the same tree, at least a_lineage[0] == b_lineage[0]
        // (the root node), but let's not assume
        // the lineage is not going to converge lower down if it doesn't match higher up.
        var index_fca = indexOfFirstInequality(a_lineage, b_lineage) - 1;
        if (index_fca === -1) {
            throw new Error('Nodes in distinct trees have no common ancestor');
        }
        return a_lineage[index_fca];
    };
    TreeNode.findBridge = function (a, b) {
        var a_lineage = a.lineage();
        var b_lineage = b.lineage();
        // a_lineage.length might not == b_lineage.length
        // a_lineage[0] should == b_lineage[0] (should == the root node)
        // index_fca :: index_of_first_common_ancestor
        // we don't want to consider the nodes themselves, so we slice up to the last element
        var index_fca = indexOfFirstInequality(a_lineage.slice(0, -1), b_lineage.slice(0, -1)) - 1;
        if (index_fca === -1) {
            throw new Error('Nodes in distinct trees are not bridgeable');
        }
        // now a_lineage[index_fca] === b_lineage[index_fca] == their first common ancestor.
        var common_ancestor = a_lineage[index_fca];
        var a_divergent_parent = a_lineage[index_fca + 1];
        var a_index = common_ancestor.children.indexOf(a_divergent_parent);
        var b_divergent_parent = b_lineage[index_fca + 1];
        var b_index = common_ancestor.children.indexOf(b_divergent_parent);
        return {
            parent: common_ancestor,
            start: Math.min(a_index, b_index),
            end: Math.max(a_index, b_index),
        };
    };
    return TreeNode;
})();
var Grammar = (function () {
    function Grammar(rules) {
        this.rules = rules;
    }
    Grammar.prototype.findErrors = function (node) {
        var _this = this;
        if (node === undefined) {
            return ['No tree was provided'];
        }
        // don't check terminals
        if (node.children.length === 0) {
            return [];
        }
        var errors = [];
        var node_symbol = node.value;
        var rule = this.rules.filter(function (rule) { return rule.symbol == node_symbol; })[0];
        if (rule === undefined) {
            errors.push("No rule exists for the value: " + node_symbol);
        }
        else {
            var node_production = node.children.map(function (child) { return child.value; });
            var production = rule.productions.filter(function (production) { return arraysEqual(production, node_production); })[0];
            if (production === undefined) {
                errors.push("No such production rule exists: " + node_symbol + " -> " + node_production.join(' '));
            }
        }
        var childrens_errors = node.children.map(function (child) { return _this.findErrors(child); });
        // flatten
        var child_errors = Array.prototype.concat.apply([], childrens_errors);
        Array.prototype.push.apply(errors, child_errors);
        return errors;
    };
    Grammar.parseBNF = function (input) {
        if (input === void 0) { input = ''; }
        var lines = input.trim().split(/\n/);
        var rules = lines.filter(function (line) { return line.indexOf('::=') > -1; }).map(function (line) {
            var parts = line.split('::=');
            return {
                symbol: parts[0].trim(),
                productions: (parts[1] || '').trim().split('|').map(function (production) {
                    return production.trim().split(/\s+/);
                }),
            };
        });
        return new Grammar(rules);
    };
    return Grammar;
})();
var TreeController = (function () {
    function TreeController(tree) {
        var _this = this;
        this.tree = tree;
        document.addEventListener('mouseup', function (event) {
            _this.mouseup(event);
        });
    }
    TreeController.prototype.selectStartNode = function (selection_start_node) {
        this.selection_start_node = selection_start_node;
    };
    TreeController.prototype.hoverEndNode = function (selection_end_node) {
        if (this.selection_start_node) {
            // findBridge => { parent: TreeNode<T>; start: number; end: number; }
            var bridge = TreeNode.findBridge(this.selection_start_node, selection_end_node);
            var bridge_nodes = bridge.parent.children.slice(bridge.start, bridge.end + 1);
            this.tree.applyAll(function (node) {
                node['selected'] = false;
            });
            bridge_nodes.forEach(function (node) {
                node['selected'] = true;
            });
            this.sync();
        }
    };
    TreeController.prototype.selectEndNode = function (selection_end_node) {
        // if no start node was ever selected, there is no active selection, so we don't need to do anything
        if (this.selection_start_node) {
            // we only split the tree if an end node was selected
            if (selection_end_node) {
                var bridge = TreeNode.findBridge(this.selection_start_node, selection_end_node);
                bridge.parent.splice(bridge.start, bridge.end, null);
            }
            // still need to deselect despite the css ::selection style; we don't want
            // to end up dragging a selection instead of starting a new one each time
            document.getSelection().removeAllRanges();
            // if the mouse let up elsewhere, and we had been selecting a bridge, we
            // still need to deselect the whole tree.
            this.selection_start_node = null;
            this.tree.applyAll(function (node) {
                node['selected'] = false;
            });
            this.sync();
        }
    };
    TreeController.prototype.mouseup = function (event) {
        var _this = this;
        // document.mouseup gets called before the react component's mouseup event
        // reaches the controller, but we want that method (selectEndNode) to be
        // processed first.
        setTimeout(function () {
            _this.selectEndNode(null);
        }, 50);
    };
    TreeController.prototype.collapseNode = function (node) {
        node.collapse();
        this.sync();
    };
    TreeController.prototype.setNodeValue = function (node, value) {
        node.value = value;
        this.sync();
    };
    TreeController.prototype.setTree = function (tree) {
        this.tree = tree;
        this.sync();
    };
    TreeController.prototype.sync = function () {
        console.log('TreeController#sync: no-op');
    };
    return TreeController;
})();
