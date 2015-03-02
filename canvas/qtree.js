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
