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
    function TreeNode(value, children, selected, start) {
        if (value === void 0) { value = null; }
        if (children === void 0) { children = []; }
        if (selected === void 0) { selected = false; }
        if (start === void 0) { start = false; }
        this.value = value;
        this.children = children;
        this.selected = selected;
        this.start = start;
        Object.freeze(this);
    }
    TreeNode.prototype.clone = function () {
        var children = this.children.map(function (child) { return child.clone(); });
        return new TreeNode(this.value, children);
    };
    TreeNode.fromJSON = function (root) {
        var children = root.children.map(function (child) { return TreeNode.fromJSON(child); });
        return new TreeNode(root.value, children);
    };
    /**
    Split off a sequence of sibling nodes into their own subtree.
  
         Tree.splice(A, 1, 2, 'G')
  
       Tree           Tree
       / \            / \
    ...   A        ...   A
        / | \ \        /  \ \
        C D E F        C  G F
                         / \
                        D   E
  
    This method does not mutate the calling node.
    */
    TreeNode.prototype.splice = function (parent, start, end, value) {
        var children;
        if (this === parent) {
            var new_node_children = this.children.slice(start, end + 1);
            var new_node = new TreeNode(value, new_node_children);
            children = this.children.splice(0);
            // splice catches all the nodes between the anchor and focus nodes, inclusive.
            children.splice(start, (end - start) + 1, new_node);
        }
        else {
            children = this.children.map(function (child) { return child.splice(parent, start, end, value); });
        }
        return new TreeNode(this.value, children, this.selected, this.start);
    };
    /**
    Un-splice: Returns a copy of this node downward, where the specified `node`
    has been collapsed out.
  
    Collapsing `node` replaces `node` (as far as its parent is concerned) with the
    children of `node`, in the same place / order.
  
    This method does not mutate the calling node.
    */
    TreeNode.prototype.collapse = function (node) {
        if (this === node)
            throw new Error('Cannot collapse the root node');
        var children;
        var index = this.children.indexOf(node);
        if (index > -1) {
            // if the node is one of `this`'s children
            // if (node.children.length === 0) throw new Error('Cannot collapse a terminal node');
            children = this.children.slice(0);
            // node.children are the orphans needing to be adopted
            var splice_args = node.children;
            splice_args.unshift(index, 1);
            // remove the current node from the parent's children, and replace it with
            // the current node's children.
            Array.prototype.splice.apply(children, splice_args);
        }
        else {
            // otherwise, the node is not any of this one's immediate children, keep looking
            children = this.children.map(function (child) { return child.collapse(node); });
        }
        return new TreeNode(this.value, children, this.selected, this.start);
    };
    TreeNode.prototype.setNodeValue = function (node, value) {
        // otherwise, the node that's getting a new value is elsewhere in the tree
        var children = this.children.map(function (child) { return child.setNodeValue(node, value); });
        var value = (this === node) ? value : this.value;
        return new TreeNode(value, children, this.selected, this.start);
    };
    TreeNode.prototype.selectNodes = function (nodes) {
        var children = this.children.map(function (child) { return child.selectNodes(nodes); });
        var selected = nodes.indexOf(this) > -1;
        return new TreeNode(this.value, children, selected, this.start);
    };
    TreeNode.prototype.setStartNode = function (node) {
        var children = this.children.map(function (child) { return child.setStartNode(node); });
        var start = this === node;
        return new TreeNode(this.value, children, this.selected, start);
    };
    TreeNode.prototype.resetSelection = function () {
        var children = this.children.map(function (child) { return child.resetSelection(); });
        return new TreeNode(this.value, children, false, false);
    };
    TreeNode.prototype.contains = function (node) {
        if (this === node) {
            return true;
        }
        for (var i = 0, child; (child = this.children[i]); i++) {
            if (child.contains(node)) {
                return true;
            }
        }
        return false;
    };
    TreeNode.prototype.containsStart = function () {
        if (this.start) {
            return true;
        }
        for (var i = 0, child; (child = this.children[i]); i++) {
            if (child.containsStart()) {
                return true;
            }
        }
        return false;
    };
    /**
    Search for the given node, and return the path from `this` node to it, if it
    can be found. Return undefined if it cannot be found.
    */
    TreeNode.prototype.pathToNode = function (node) {
        if (this === node) {
            return [this];
        }
        for (var i = 0, child; (child = this.children[i]); i++) {
            var result = child.pathToNode(node);
            if (result !== undefined) {
                result.unshift(this);
                return result;
            }
        }
    };
    /**
  
    */
    TreeNode.prototype.pathToStartNode = function () {
        if (this.start) {
            return [this];
        }
        for (var i = 0, child; (child = this.children[i]); i++) {
            var result = child.pathToStartNode();
            if (result !== undefined) {
                result.unshift(this);
                return result;
            }
        }
    };
    /**
    Find the bridge between two nodes that might
    */
    TreeNode.prototype.bridgeFromStart = function (to) {
        var a_lineage = this.pathToStartNode();
        var b_lineage = this.pathToNode(to);
        if (a_lineage === undefined || b_lineage === undefined) {
            return;
        }
        if (a_lineage.length == 1 || b_lineage.length == 1) {
            throw new Error('Cannot bridge to or from the root node');
        }
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
            var node_production = node.children.map(function (child) { return String(child.value); });
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
    TreeController.prototype.setStartNode = function (selection_start_node) {
        var tree = this.tree.setStartNode(selection_start_node);
        this.setTree(tree);
    };
    TreeController.prototype.hoverEndNode = function (selection_end_node) {
        var active_selection = this.tree.containsStart();
        if (active_selection) {
            var bridge = this.tree.bridgeFromStart(selection_end_node);
            if (bridge) {
                // bridge: { parent: TreeNode<T>; start: number; end: number; }
                var bridge_nodes = bridge.parent.children.slice(bridge.start, bridge.end + 1);
                var tree = this.tree.selectNodes(bridge_nodes);
                this.setTree(tree);
            }
        }
    };
    TreeController.prototype.selectEndNode = function (selection_end_node) {
        // selection_end_node will be null if the user mouse-up'ed outside the tree
        var active_selection = this.tree.containsStart();
        // if there is no active selection (no start node was ever selected), we don't need to do anything at all
        if (active_selection) {
            var tree = this.tree;
            if (selection_end_node) {
                // bridge should not come out undefined, but maybe we should check?
                var bridge = tree.bridgeFromStart(selection_end_node);
                // we only split the tree if an end node has been selected
                tree = tree.splice(bridge.parent, bridge.start, bridge.end, null);
                // still need to deselect despite the css ::selection style; we don't want
                // to end up dragging a selection instead of starting a new one each time
                document.getSelection().removeAllRanges();
            }
            // if there was an active selection, we need to deselect the whole tree
            // regardless whether the selection was completed or not
            tree = tree.resetSelection();
            this.setTree(tree);
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
        this.setTree(this.tree.collapse(node));
    };
    TreeController.prototype.setNodeValue = function (node, value) {
        this.setTree(this.tree.setNodeValue(node, value));
    };
    TreeController.prototype.setTree = function (tree) {
        // this should be the only method that sets this.tree (besides the constructor)
        this.tree = tree;
        this.sync();
    };
    TreeController.prototype.sync = function () {
        console.log('TreeController#sync: no-op');
    };
    return TreeController;
})();
