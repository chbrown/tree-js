

class MouseState {
  down: boolean = false;

  constructor(target: Node = document) {
    target.addEventListener('mousedown', () => {
      this.down = true;
    });
    target.addEventListener('mouseup', () => {
      this.down = false;
    });
  }

  get up(): boolean {
    return !this.down;
  }
}

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
  __children: TreeNode<T>[];
  el: Element;

  constructor(public value: T = null,
              children: TreeNode<T>[] = []) {
    this.children = children;
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

  get children(): TreeNode<T>[] {
    return this.__children;
  }

  set children(children: TreeNode<T>[]) {
    // extend children with parent links
    for (var i = 0, child; (child = children[i]); i++) {
      child.parent = this;
    }
    this.__children = children;
  }

  /**
  Return all nodes between two sibling nodes, inclusive.

  Returns an empty list if they are not siblings.
  */
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

class QtreeNode {
  text_width: number;
  box_width: number;
  center: number;

  constructor(public value: string = '',
              public children: QtreeNode[] = []) { }

  layout(context: CanvasRenderingContext2D): number {
    var children_width = 0;
    this.children.forEach(child => {
      children_width += child.layout(context);
    });
    this.text_width = context.measureText(this.value).width;
    this.box_width = Math.max(children_width, this.text_width + 5);

    return this.box_width;
  }
  recenter(): number {
    if (this.children.length) {
      var offset = 0;
      var centers = [];
      this.children.map(child => {
        centers.push(child.recenter() + offset);
        offset += child.box_width;
      });
      this.center = (centers[0] + centers[centers.length - 1]) / 2;
      return this.center;
    }
    this.center = this.box_width / 2;
    return this.center;
  }
  draw(context: CanvasRenderingContext2D, height: number, offset_x: number, offset_y: number): void {
    var child_offset = 0;
    context.fillText(this.value, offset_x + this.center - (this.text_width / 2), offset_y + 10);
    context.beginPath();
    this.children.forEach(child => {
      context.moveTo(offset_x + this.center, offset_y + 12);
      context.lineTo(offset_x + child_offset + child.center, offset_y + height);
      child_offset += child.box_width;
    });
    context.stroke();

    child_offset = 0;
    this.children.forEach(child => {
      child.draw(context, height, offset_x + child_offset, offset_y + height);
      child_offset += child.box_width;
    });
  }

  level(): number {
    var depths = this.children.map(child => {
      return child.level() + 1;
    });
    depths.push(1);
    return Math.max.apply(null, depths);
  }

  static parse(tex): QtreeNode {
    var parser = new QtreeParser(tex);
    return parser.parseNode();
  }
}

class QtreeParser {
  i: number = 0;
  constructor(public tex: string) {
    // find the starting point of the outermost tree
    this.i = this.tex.indexOf('[');
  }

  /** read through the underlying string input, and return a node representing
  the first [.X Y Z ] structure we come to.
  */
  parseNode(): QtreeNode {
    var node = new QtreeNode();
    // tex[i] == [
    this.i++;
    // read until and over the closing ]
    while (this.tex[this.i]) {
      if (this.tex[this.i] == '.') {
        this.i++;
        node.value = this.parseString();
        // tex[i] == whitespace
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
  }

  parseString(): string {
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
  }
}
