function Node(text) {
  this.text = text;
  this.children = [];
}
Node.prototype.addChild = function(node) {
  this.children.push(node);
};
Node.prototype.toString = function() {
  if (this.children.length) {
    var children_strings = this.children.map(function(node) { return node.toString(); });
    return "(" + this.text + " " + children_strings.join(' ') + ")";
  }
  return "(" + this.text + ")";
};
Node.prototype.layout = function(context) {
  var children_width = 0;
  this.children.forEach(function(child) {
    children_width += child.layout(context);
  });
  this.text_width = context.measureText(this.text).width;
  this.box_width = Math.max(children_width, this.text_width + 5);

  return this.box_width;
};
Node.prototype.recenter = function() {
  if (this.children.length) {
    var offset = 0, centers = [];
    this.children.map(function(child) {
      centers.push(child.recenter() + offset);
      offset += child.box_width;
    });
    this.center = (centers[0] + centers[centers.length - 1]) / 2;
    return this.center;
  }
  this.center = this.box_width / 2;
  return this.center;
};
Node.prototype.draw = function(context, height, offset_x, offset_y) {
      // current_center = this.box_width / 2,
      // text_offset_x = (this.box_width - this.text_width) / 2;
  // context.strokeRect(offset_x, offset_y, this.box_width, height);

  // draw text within bounds, centered
  // context.fillText(this.text, offset_x + text_offset_x, offset_y + 10);
  // draw lines to children, centered in current box
  // context.beginPath();
  // this.children.forEach(function(child) {
  //   current_center = (this.box_width / 2);
  //   var child_center = (child.box_width / 2);
  //   context.moveTo(offset_x + current_center, offset_y + 12);
  //   context.lineTo(offset_x + child_offset + child_center, offset_y + height);
  //   child_offset += child.box_width;
  // });
  // context.stroke();

  var self = this, child_offset = 0;
  context.fillText(this.text, offset_x + this.center - (this.text_width / 2), offset_y + 10);
  context.beginPath();
  this.children.forEach(function(child) {
    context.moveTo(offset_x + self.center, offset_y + 12);
    context.lineTo(offset_x + child_offset + child.center, offset_y + height);
    child_offset += child.box_width;
  });
  context.stroke();

  child_offset = 0;
  this.children.forEach(function(child) {
    child.draw(context, height, offset_x + child_offset, offset_y + height);
    child_offset += child.box_width;
  });
};
Node.prototype.level = function() {
  var depths = this.children.map(function(child) {
    return child.level() + 1;
  });
  depths.push(1);
  return Math.max.apply(null, depths);
};

function TexParser(tex) {
  this.tex = tex;
  this.i = 0;
}
TexParser.prototype.parse = function() {
  // parse reads through the underlying string, and returns a node representing the first [.X Y Z ] it comes to
  while (this.tex[this.i]) {
    if (this.tex[this.i] === '[') {
      return this.parseNode();
    }
    this.i++;
  }
};
TexParser.prototype.parseNode = function() {
  var node = new Node();
  // tex[i] == [
  this.i++;
  // read until and over the closing ]
  while (this.tex[this.i]) {
    if (this.tex[this.i] == '.') {
      this.i++;
      node.text = this.parseText();
      // tex[i] == whitespace
    }
    else if (this.tex[this.i] === '[') {
      node.addChild(this.parseNode());
    }
    else if (this.tex[this.i] === ']') {
      break;
    }
    else if (this.tex[this.i].match(/\S/)) {
      node.children.push(new Node(this.parseText()));
    }
    this.i++;
  }
  return node;
};


TexParser.prototype.parseText = function() {
  var name = '', depth = 0;
  while (this.tex[this.i]) {
    if (this.tex[this.i] === '{')
      depth++;
    else if (this.tex[this.i] === '}')
      depth--;
    else
      name += this.tex[this.i];
    this.i++;

    // keep going until we hit whitespace with a depth of = 0
    if (depth === 0 && this.tex[this.i].match(/\s/))
      break;
  }
  return name.replace(/\\\\/g, ' ').replace(/\\1/g, "'");
};
