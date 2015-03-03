function indexOfFirstInequality(xs, ys) {
    for (var index = 0, length = Math.min(xs.length, ys.length); index < length; index++) {
        if (xs[index] !== ys[index]) {
            return index;
        }
    }
    return length;
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
    /** Need custom JSON-ifier to avoid circularity (.parent) problems */
    TreeNode.prototype.toJSON = function () {
        if (this.children.length > 0) {
            return [this.value, this.children];
        }
        else {
            return this.value;
        }
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
