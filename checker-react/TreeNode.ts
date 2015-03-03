function indexOfFirstInequality<T>(xs: Array<T>, ys: Array<T>): number {
  for (var index = 0, length = Math.min(xs.length, ys.length); index < length; index++) {
    if (xs[index] !== ys[index]) {
      return index;
    }
  }
  return length;
}

class TreeNode<T> {
  __children: TreeNode<T>[];
  parent: TreeNode<T>;

  constructor(public value: T = null,
              children: TreeNode<T>[] = []) {
    this.children = children;
  }

  get children(): TreeNode<T>[] {
    return this.__children;
  }

  set children(children: TreeNode<T>[]) {
    // extend children with parent links
    children.forEach(child => {
      child.parent = this;
    });
    this.__children = children;
  }

  /**
  Apply a function to each node in the whole tree (at least, the whole tree
  at or below this node), beginning at this node, depth-first.
  */
  applyAll(func: (tree: TreeNode<T>) => void): void {
    func(this);
    this.children.forEach(child => {
      child.applyAll(func);
    });
  }

  /**
  Split off a sequence of sibling nodes into their own subtree.

    -- A.splice(2, 3, 'G')
        A             A
    / / | \ \      / /  \ \
    B C D E F      B G  E F
                    / \
                   C   D

  */
  splice(start: number, end: number, value: T): void {
    var new_node = new TreeNode(value);
    // this splice catches all the nodes between the anchor and focus nodes, inclusive.
    new_node.children = this.children.splice(start, (end - start) + 1, new_node);
    new_node.parent = this;
  }

  /**
  Return a list of parents of this node, from oldest to youngest,
  ending with the calling node.
  */
  lineage(): TreeNode<T>[] {
    var node = this;
    var parents = [node];
    while ((node = node.parent)) {
      parents.unshift(node);
    }
    return parents;
  }

  /** Need custom JSON-ifier to avoid circularity (.parent) problems */
  toJSON(): any {
    if (this.children.length > 0) {
      return [this.value, this.children];
    }
    else {
      return this.value;
    }
  }

  static findFirstCommonAncestor<T>(a: TreeNode<T>, b: TreeNode<T>): TreeNode<T> {
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
  }

  static findBridge<T>(a: TreeNode<T>, b: TreeNode<T>) {
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
  }

}
