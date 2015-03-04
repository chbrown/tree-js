function indexOfFirstInequality<T>(xs: Array<T>, ys: Array<T>): number {
  for (var index = 0, length = Math.min(xs.length, ys.length); index < length; index++) {
    if (xs[index] !== ys[index]) {
      return index;
    }
  }
  return length;
}

function arraysEqual(xs: string[], ys: string[]): boolean {
  for (var i = 0, l = Math.max(xs.length, ys.length); i < l; i++) {
    if (xs[i] !== ys[i]) {
      return false;
    }
  }
  return true;
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
    children.forEach(child => { child.parent = this });
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
  Un-splice. Removes the called node, with the parent absorbing the children
  in the same place / order.
  */
  collapse(): void {
    if (!this.parent) throw new Error('Cannot collapse the root node');
    if (this.children.length === 0) throw new Error('Cannot collapse a terminal node');
    var parent = this.parent;
    var index = parent.children.indexOf(this);
    // fix the children's concept of parent
    this.children.forEach(child => {
      child.parent = parent;
    });
    var splice_args = <any[]>this.children.slice(0);
    splice_args.unshift(index, 1);
    // remove the current node from the parent's children, and replace it with
    // the current node's children.
    Array.prototype.splice.apply(parent.children, splice_args);
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

  clone(): TreeNode<T> {
    var children = this.children.map(child => child.clone());
    return new TreeNode<T>(this.value, children);
  }

  /** Need custom JSON-ifier to avoid circularity (.parent) problems */
  toJSON(): any {
    return {
      value: this.value,
      children: this.children,
    };
  }
  static fromJSON<T>(root: any): TreeNode<T> {
    var children = root.children.map(child => TreeNode.fromJSON(child));
    return new TreeNode(root.value, children);
  }

  toTuple(): any {
    var children = this.children.map(child => child.toTuple());
    return (children.length > 0) ? [this.value, children] : [this.value];
  }
  static fromTuple<T>(tuple: any): TreeNode<T> {
    var children = (tuple[1] || []).map(child => TreeNode.fromTuple<T>(child))
    return new TreeNode(tuple[0], children);
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

interface Rule {
  symbol: string;
  productions: string[][];
}

class Grammar {
  constructor(public rules: Rule[]) { }

  findErrors(node: TreeNode<string>): string[] {
    if (node === undefined) {
      return ['No tree was provided'];
    }
    // don't check terminals
    if (node.children.length === 0) {
      return [];
    }

    var errors = [];

    var node_symbol = node.value;
    var rule = this.rules.filter(rule => rule.symbol == node_symbol)[0];
    if (rule === undefined) {
      errors.push(`No rule exists for the value: ${node_symbol}`);
    }
    else {
      var node_production = node.children.map(child => child.value);
      var production = rule.productions.filter(production => arraysEqual(production, node_production))[0];
      if (production === undefined) {
        errors.push(`No such production rule exists: ${node_symbol} -> ${node_production.join(' ')}`);
      }
      // else {
      //   console.log(`Using rule: ${rule.symbol} -> ${node_production.join(' ')}`);
      // }
    }

    var childrens_errors = node.children.map(child => this.findErrors(child));
    // flatten
    var child_errors = Array.prototype.concat.apply([], childrens_errors);

    Array.prototype.push.apply(errors, child_errors);
    return errors;
  }

  static parseBNF(input: string): Grammar {
    var lines = input.trim().split(/\n/);
    var rules = lines
    .filter(line => line.indexOf('::=') > -1)
    .map(line => {
      var parts = line.split('::=');
      return {
        symbol: parts[0].trim(),
        productions: (parts[1] || '').trim().split('|').map(production => {
          return production.trim().split(/\s+/);
        }),
      }
    })
    return new Grammar(rules);
  }
}

class TreeController<T> {
  selection_start_node: TreeNode<T>;

  constructor(public tree: TreeNode<T>) {
    document.addEventListener('mouseup', (event) => {
      this.mouseup(event);
    });
  }

  selectStartNode(selection_start_node: TreeNode<T>) {
    this.selection_start_node = selection_start_node;
  }
  hoverEndNode(selection_end_node: TreeNode<T>) {
    if (this.selection_start_node) {
      // findBridge => { parent: TreeNode<T>; start: number; end: number; }
      var bridge = TreeNode.findBridge(this.selection_start_node, selection_end_node);
      var bridge_nodes = bridge.parent.children.slice(bridge.start, bridge.end + 1);
      this.tree.applyAll(node => { node['selected'] = false });
      bridge_nodes.forEach(node => { node['selected'] = true });

      this.sync();
    }
  }
  selectEndNode(selection_end_node: TreeNode<T>) {
    if (this.selection_start_node && selection_end_node) {
      var bridge = TreeNode.findBridge(this.selection_start_node, selection_end_node);
      bridge.parent.splice(bridge.start, bridge.end, null);
      // still need to deselect despite the css class; we don't want to end
      // up dragging a selection instead of starting a new selection each time
      document.getSelection().removeAllRanges();
    }

    this.selection_start_node = null;
    this.tree.applyAll(node => { node['selected'] = false; });
    this.sync();
  }

  mouseup(event) {
    setTimeout(() => { this.selectEndNode(null) }, 50);
  }

  collapseNode(node: TreeNode<T>): void {
    node.collapse();
    this.sync();
  }

  setNodeValue(node: TreeNode<T>, value: T): void {
    node.value = value;
    this.sync();
  }

  setTree(tree: TreeNode<T>): void {
    this.tree = tree;
    this.sync();
  }

  sync() {
    console.log('TreeController#sync: no-op');
  }
}
