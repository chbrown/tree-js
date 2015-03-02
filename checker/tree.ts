/**
Create a new DOM Element with the given tag, attributes, and childNodes.
If childNodes are not already DOM Node objects, each item in childNodes
will be stringified and inserted as a text Node.

If childNodes is a NodeList or something other than an Array, this will break.
*/
function El(tagName: string, children: Array<string | Node> = []) {
  var element = document.createElement(tagName);
  for (var i = 0, child; (child = children[i]); i++) {
    // automatically convert plain strings to text nodes
    if (!(child instanceof Node)) {
      child = document.createTextNode(String(child));
    }
    element.appendChild(child);
  }
  return element;
};

/**

Constructor:

    function TreeNode(value, children) {
      this.value = (value === undefined) ? null : value;
      this.children = (children === undefined) ? [] : children;
    }

*/
class TreeNode<T> {
  el: Element;
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
  Redraw the entire tree, discarding any existing elements.
  */
  render() {
    if (this.children.length > 0) {
      this.el = El('table', [
        // create the parent caption
        El('caption', [String(this.value)]),
        // create the children cells
        El('tr',
          this.children.map(function(child) {
            child.render();
            return El('td', [child.el]);
          })
        ),
      ]);
    }
    else {
      this.el = El('span', [String(this.value)]);
    }
  }

  /**
  Find the tree node represented by a DOM Node.

  Returns null if there are no matches.
  */
  find(target): TreeNode<T> {
    if (target === this.el) {
      return this;
    }
    for (var i = 0, child; (child = this.children[i]); i++) {
      var result = child.find(target);
      if (result) return result;
    }
    return null;
  }

  toJSON(): any {
    if (this.children.length > 0) {
      return [this.value, this.children];
    }
    else {
      return this.value;
    }
  }

  toString(): string {
    if (this.children.length) {
      var children_strings = this.children.map(node => {
        return node.toString();
      });
      return "(" + this.value + " " + children_strings.join(' ') + ")";
    }
    return "(" + this.value + ")";
  }
}
