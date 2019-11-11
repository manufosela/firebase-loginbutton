/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = o => {
  return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = window.customElements !== undefined && window.customElements.polyfillWrapFlushCallback !== undefined;
/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */

const removeNodes = (container, startNode, endNode = null) => {
  let node = startNode;

  while (node !== endNode) {
    const n = node.nextSibling;
    container.removeChild(node);
    node = n;
  }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */

const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */

const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */

const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */

class Template {
  constructor(result, element) {
    this.parts = [];
    this.element = element;
    let index = -1;
    let partIndex = 0;
    const nodesToRemove = [];

    const _prepareTemplate = template => {
      const content = template.content; // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null

      const walker = document.createTreeWalker(content, 133
      /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
      , null, false); // Keeps track of the last index associated with a part. We try to delete
      // unnecessary nodes, but we never want to associate two different parts
      // to the same index. They must have a constant node between.

      let lastPartIndex = 0;

      while (walker.nextNode()) {
        index++;
        const node = walker.currentNode;

        if (node.nodeType === 1
        /* Node.ELEMENT_NODE */
        ) {
            if (node.hasAttributes()) {
              const attributes = node.attributes; // Per
              // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
              // attributes are not guaranteed to be returned in document order.
              // In particular, Edge/IE can return them out of order, so we cannot
              // assume a correspondance between part index and attribute index.

              let count = 0;

              for (let i = 0; i < attributes.length; i++) {
                if (attributes[i].value.indexOf(marker) >= 0) {
                  count++;
                }
              }

              while (count-- > 0) {
                // Get the template literal section leading up to the first
                // expression in this attribute
                const stringForPart = result.strings[partIndex]; // Find the attribute name

                const name = lastAttributeNameRegex.exec(stringForPart)[2]; // Find the corresponding attribute
                // All bound attributes have had a suffix added in
                // TemplateResult#getHTML to opt out of special attribute
                // handling. To look up the attribute value we also need to add
                // the suffix.

                const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                const attributeValue = node.getAttribute(attributeLookupName);
                const strings = attributeValue.split(markerRegex);
                this.parts.push({
                  type: 'attribute',
                  index,
                  name,
                  strings
                });
                node.removeAttribute(attributeLookupName);
                partIndex += strings.length - 1;
              }
            }

            if (node.tagName === 'TEMPLATE') {
              _prepareTemplate(node);
            }
          } else if (node.nodeType === 3
        /* Node.TEXT_NODE */
        ) {
            const data = node.data;

            if (data.indexOf(marker) >= 0) {
              const parent = node.parentNode;
              const strings = data.split(markerRegex);
              const lastIndex = strings.length - 1; // Generate a new text node for each literal section
              // These nodes are also used as the markers for node parts

              for (let i = 0; i < lastIndex; i++) {
                parent.insertBefore(strings[i] === '' ? createMarker() : document.createTextNode(strings[i]), node);
                this.parts.push({
                  type: 'node',
                  index: ++index
                });
              } // If there's no text, we must insert a comment to mark our place.
              // Else, we can trust it will stick around after cloning.


              if (strings[lastIndex] === '') {
                parent.insertBefore(createMarker(), node);
                nodesToRemove.push(node);
              } else {
                node.data = strings[lastIndex];
              } // We have a part for each match found


              partIndex += lastIndex;
            }
          } else if (node.nodeType === 8
        /* Node.COMMENT_NODE */
        ) {
            if (node.data === marker) {
              const parent = node.parentNode; // Add a new marker node to be the startNode of the Part if any of
              // the following are true:
              //  * We don't have a previousSibling
              //  * The previousSibling is already the start of a previous part

              if (node.previousSibling === null || index === lastPartIndex) {
                index++;
                parent.insertBefore(createMarker(), node);
              }

              lastPartIndex = index;
              this.parts.push({
                type: 'node',
                index
              }); // If we don't have a nextSibling, keep this node so we have an end.
              // Else, we can remove it to save future costs.

              if (node.nextSibling === null) {
                node.data = '';
              } else {
                nodesToRemove.push(node);
                index--;
              }

              partIndex++;
            } else {
              let i = -1;

              while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                // Comment node has a binding marker inside, make an inactive part
                // The binding won't work, but subsequent bindings will
                // TODO (justinfagnani): consider whether it's even worth it to
                // make bindings in comments work
                this.parts.push({
                  type: 'node',
                  index: -1
                });
              }
            }
          }
      }
    };

    _prepareTemplate(element); // Remove text binding nodes after the walk to not disturb the TreeWalker


    for (const n of nodesToRemove) {
      n.parentNode.removeChild(n);
    }
  }

}
const isTemplatePartActive = part => part.index !== -1; // Allows `document.createComment('')` to be renamed for a
// small manual size-savings.

const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */

const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */

class TemplateInstance {
  constructor(template, processor, options) {
    this._parts = [];
    this.template = template;
    this.processor = processor;
    this.options = options;
  }

  update(values) {
    let i = 0;

    for (const part of this._parts) {
      if (part !== undefined) {
        part.setValue(values[i]);
      }

      i++;
    }

    for (const part of this._parts) {
      if (part !== undefined) {
        part.commit();
      }
    }
  }

  _clone() {
    // When using the Custom Elements polyfill, clone the node, rather than
    // importing it, to keep the fragment in the template's document. This
    // leaves the fragment inert so custom elements won't upgrade and
    // potentially modify their contents by creating a polyfilled ShadowRoot
    // while we traverse the tree.
    const fragment = isCEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);
    const parts = this.template.parts;
    let partIndex = 0;
    let nodeIndex = 0;

    const _prepareInstance = fragment => {
      // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
      // null
      const walker = document.createTreeWalker(fragment, 133
      /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
      , null, false);
      let node = walker.nextNode(); // Loop through all the nodes and parts of a template

      while (partIndex < parts.length && node !== null) {
        const part = parts[partIndex]; // Consecutive Parts may have the same node index, in the case of
        // multiple bound attributes on an element. So each iteration we either
        // increment the nodeIndex, if we aren't on a node with a part, or the
        // partIndex if we are. By not incrementing the nodeIndex when we find a
        // part, we allow for the next part to be associated with the current
        // node if neccessasry.

        if (!isTemplatePartActive(part)) {
          this._parts.push(undefined);

          partIndex++;
        } else if (nodeIndex === part.index) {
          if (part.type === 'node') {
            const part = this.processor.handleTextExpression(this.options);
            part.insertAfterNode(node.previousSibling);

            this._parts.push(part);
          } else {
            this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
          }

          partIndex++;
        } else {
          nodeIndex++;

          if (node.nodeName === 'TEMPLATE') {
            _prepareInstance(node.content);
          }

          node = walker.nextNode();
        }
      }
    };

    _prepareInstance(fragment);

    if (isCEPolyfill) {
      document.adoptNode(fragment);
      customElements.upgrade(fragment);
    }

    return fragment;
  }

}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */

class TemplateResult {
  constructor(strings, values, type, processor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
  }
  /**
   * Returns a string of HTML used to create a `<template>` element.
   */


  getHTML() {
    const endIndex = this.strings.length - 1;
    let html = '';

    for (let i = 0; i < endIndex; i++) {
      const s = this.strings[i]; // This exec() call does two things:
      // 1) Appends a suffix to the bound attribute name to opt out of special
      // attribute value parsing that IE11 and Edge do, like for style and
      // many SVG attributes. The Template class also appends the same suffix
      // when looking up attributes to create Parts.
      // 2) Adds an unquoted-attribute-safe marker for the first expression in
      // an attribute. Subsequent attribute expressions will use node markers,
      // and this is safe since attributes with multiple expressions are
      // guaranteed to be quoted.

      const match = lastAttributeNameRegex.exec(s);

      if (match) {
        // We're starting a new bound attribute.
        // Add the safe attribute suffix, and use unquoted-attribute-safe
        // marker.
        html += s.substr(0, match.index) + match[1] + match[2] + boundAttributeSuffix + match[3] + marker;
      } else {
        // We're either in a bound node, or trailing bound attribute.
        // Either way, nodeMarker is safe to use.
        html += s + nodeMarker;
      }
    }

    return html + this.strings[endIndex];
  }

  getTemplateElement() {
    const template = document.createElement('template');
    template.innerHTML = this.getHTML();
    return template;
  }

}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = value => {
  return value === null || !(typeof value === 'object' || typeof value === 'function');
};
/**
 * Sets attribute values for AttributeParts, so that the value is only set once
 * even if there are multiple parts for an attribute.
 */

class AttributeCommitter {
  constructor(element, name, strings) {
    this.dirty = true;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];

    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart();
    }
  }
  /**
   * Creates a single part. Override this to create a differnt type of part.
   */


  _createPart() {
    return new AttributePart(this);
  }

  _getValue() {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = this.parts[i];

      if (part !== undefined) {
        const v = part.value;

        if (v != null && (Array.isArray(v) || // tslint:disable-next-line:no-any
        typeof v !== 'string' && v[Symbol.iterator])) {
          for (const t of v) {
            text += typeof t === 'string' ? t : String(t);
          }
        } else {
          text += typeof v === 'string' ? v : String(v);
        }
      }
    }

    text += strings[l];
    return text;
  }

  commit() {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue());
    }
  }

}
class AttributePart {
  constructor(comitter) {
    this.value = undefined;
    this.committer = comitter;
  }

  setValue(value) {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      this.value = value; // If the value is a not a directive, dirty the committer so that it'll
      // call setAttribute. If the value is a directive, it'll dirty the
      // committer if it calls setValue().

      if (!isDirective(value)) {
        this.committer.dirty = true;
      }
    }
  }

  commit() {
    while (isDirective(this.value)) {
      const directive = this.value;
      this.value = noChange;
      directive(this);
    }

    if (this.value === noChange) {
      return;
    }

    this.committer.commit();
  }

}
class NodePart {
  constructor(options) {
    this.value = undefined;
    this._pendingValue = undefined;
    this.options = options;
  }
  /**
   * Inserts this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  appendInto(container) {
    this.startNode = container.appendChild(createMarker());
    this.endNode = container.appendChild(createMarker());
  }
  /**
   * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
   * its next sibling must be static, unchanging nodes such as those that appear
   * in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  insertAfterNode(ref) {
    this.startNode = ref;
    this.endNode = ref.nextSibling;
  }
  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  appendIntoPart(part) {
    part._insert(this.startNode = createMarker());

    part._insert(this.endNode = createMarker());
  }
  /**
   * Appends this part after `ref`
   *
   * This part must be empty, as its contents are not automatically moved.
   */


  insertAfterPart(ref) {
    ref._insert(this.startNode = createMarker());

    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }

  setValue(value) {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }

    const value = this._pendingValue;

    if (value === noChange) {
      return;
    }

    if (isPrimitive(value)) {
      if (value !== this.value) {
        this._commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this._commitTemplateResult(value);
    } else if (value instanceof Node) {
      this._commitNode(value);
    } else if (Array.isArray(value) || // tslint:disable-next-line:no-any
    value[Symbol.iterator]) {
      this._commitIterable(value);
    } else if (value === nothing) {
      this.value = nothing;
      this.clear();
    } else {
      // Fallback, will render the string representation
      this._commitText(value);
    }
  }

  _insert(node) {
    this.endNode.parentNode.insertBefore(node, this.endNode);
  }

  _commitNode(value) {
    if (this.value === value) {
      return;
    }

    this.clear();

    this._insert(value);

    this.value = value;
  }

  _commitText(value) {
    const node = this.startNode.nextSibling;
    value = value == null ? '' : value;

    if (node === this.endNode.previousSibling && node.nodeType === 3
    /* Node.TEXT_NODE */
    ) {
        // If we only have a single text node between the markers, we can just
        // set its value, rather than replacing it.
        // TODO(justinfagnani): Can we just check if this.value is primitive?
        node.data = value;
      } else {
      this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
    }

    this.value = value;
  }

  _commitTemplateResult(value) {
    const template = this.options.templateFactory(value);

    if (this.value instanceof TemplateInstance && this.value.template === template) {
      this.value.update(value.values);
    } else {
      // Make sure we propagate the template processor from the TemplateResult
      // so that we use its syntax extension, etc. The template factory comes
      // from the render function options so that it can control template
      // caching and preprocessing.
      const instance = new TemplateInstance(template, value.processor, this.options);

      const fragment = instance._clone();

      instance.update(value.values);

      this._commitNode(fragment);

      this.value = instance;
    }
  }

  _commitIterable(value) {
    // For an Iterable, we create a new InstancePart per item, then set its
    // value to the item. This is a little bit of overhead for every item in
    // an Iterable, but it lets us recurse easily and efficiently update Arrays
    // of TemplateResults that will be commonly returned from expressions like:
    // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
    // If _value is an array, then the previous render was of an
    // iterable and _value will contain the NodeParts from the previous
    // render. If _value is not an array, clear this part and make a new
    // array for NodeParts.
    if (!Array.isArray(this.value)) {
      this.value = [];
      this.clear();
    } // Lets us keep track of how many items we stamped so we can clear leftover
    // items from a previous render


    const itemParts = this.value;
    let partIndex = 0;
    let itemPart;

    for (const item of value) {
      // Try to reuse an existing part
      itemPart = itemParts[partIndex]; // If no existing part, create a new one

      if (itemPart === undefined) {
        itemPart = new NodePart(this.options);
        itemParts.push(itemPart);

        if (partIndex === 0) {
          itemPart.appendIntoPart(this);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }

      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }

    if (partIndex < itemParts.length) {
      // Truncate the parts array so _value reflects the current state
      itemParts.length = partIndex;
      this.clear(itemPart && itemPart.endNode);
    }
  }

  clear(startNode = this.startNode) {
    removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
  }

}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */

class BooleanAttributePart {
  constructor(element, name, strings) {
    this.value = undefined;
    this._pendingValue = undefined;

    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error('Boolean attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value) {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }

    if (this._pendingValue === noChange) {
      return;
    }

    const value = !!this._pendingValue;

    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '');
      } else {
        this.element.removeAttribute(this.name);
      }
    }

    this.value = value;
    this._pendingValue = noChange;
  }

}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */

class PropertyCommitter extends AttributeCommitter {
  constructor(element, name, strings) {
    super(element, name, strings);
    this.single = strings.length === 2 && strings[0] === '' && strings[1] === '';
  }

  _createPart() {
    return new PropertyPart(this);
  }

  _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }

    return super._getValue();
  }

  commit() {
    if (this.dirty) {
      this.dirty = false; // tslint:disable-next-line:no-any

      this.element[this.name] = this._getValue();
    }
  }

}
class PropertyPart extends AttributePart {} // Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.

let eventOptionsSupported = false;

try {
  const options = {
    get capture() {
      eventOptionsSupported = true;
      return false;
    }

  }; // tslint:disable-next-line:no-any

  window.addEventListener('test', options, options); // tslint:disable-next-line:no-any

  window.removeEventListener('test', options, options);
} catch (_e) {}

class EventPart {
  constructor(element, eventName, eventContext) {
    this.value = undefined;
    this._pendingValue = undefined;
    this.element = element;
    this.eventName = eventName;
    this.eventContext = eventContext;

    this._boundHandleEvent = e => this.handleEvent(e);
  }

  setValue(value) {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }

    if (this._pendingValue === noChange) {
      return;
    }

    const newListener = this._pendingValue;
    const oldListener = this.value;
    const shouldRemoveListener = newListener == null || oldListener != null && (newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive);
    const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);

    if (shouldRemoveListener) {
      this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
    }

    if (shouldAddListener) {
      this._options = getOptions(newListener);
      this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
    }

    this.value = newListener;
    this._pendingValue = noChange;
  }

  handleEvent(event) {
    if (typeof this.value === 'function') {
      this.value.call(this.eventContext || this.element, event);
    } else {
      this.value.handleEvent(event);
    }
  }

} // We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.

const getOptions = o => o && (eventOptionsSupported ? {
  capture: o.capture,
  passive: o.passive,
  once: o.once
} : o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */

class DefaultTemplateProcessor {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(element, name, strings, options) {
    const prefix = name[0];

    if (prefix === '.') {
      const comitter = new PropertyCommitter(element, name.slice(1), strings);
      return comitter.parts;
    }

    if (prefix === '@') {
      return [new EventPart(element, name.slice(1), options.eventContext)];
    }

    if (prefix === '?') {
      return [new BooleanAttributePart(element, name.slice(1), strings)];
    }

    const comitter = new AttributeCommitter(element, name, strings);
    return comitter.parts;
  }
  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */


  handleTextExpression(options) {
    return new NodePart(options);
  }

}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */

function templateFactory(result) {
  let templateCache = templateCaches.get(result.type);

  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map()
    };
    templateCaches.set(result.type, templateCache);
  }

  let template = templateCache.stringsArray.get(result.strings);

  if (template !== undefined) {
    return template;
  } // If the TemplateStringsArray is new, generate a key from the strings
  // This key is shared between all templates with identical content


  const key = result.strings.join(marker); // Check if we already have a Template for this key

  template = templateCache.keyString.get(key);

  if (template === undefined) {
    // If we have not seen this key before, create a new Template
    template = new Template(result, result.getTemplateElement()); // Cache the Template for this key

    templateCache.keyString.set(key, template);
  } // Cache all future queries for this TemplateStringsArray


  templateCache.stringsArray.set(result.strings, template);
  return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result a TemplateResult created by evaluating a template tag like
 *     `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */

const render = (result, container, options) => {
  let part = parts.get(container);

  if (part === undefined) {
    removeNodes(container, container.firstChild);
    parts.set(container, part = new NodePart(Object.assign({
      templateFactory
    }, options)));
    part.appendInto(container);
  }

  part.setValue(result);
  part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time

(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */

const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const walkerNodeFilter = 133
/* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */
;
/**
 * Removes the list of nodes from a Template safely. In addition to removing
 * nodes from the Template, the Template part indices are updated to match
 * the mutated Template DOM.
 *
 * As the template is walked the removal state is tracked and
 * part indices are adjusted as needed.
 *
 * div
 *   div#1 (remove) <-- start removing (removing node is div#1)
 *     div
 *       div#2 (remove)  <-- continue removing (removing node is still div#1)
 *         div
 * div <-- stop removing since previous sibling is the removing node (div#1,
 * removed 4 nodes)
 */

function removeNodesFromTemplate(template, nodesToRemove) {
  const {
    element: {
      content
    },
    parts
  } = template;
  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts);
  let part = parts[partIndex];
  let nodeIndex = -1;
  let removeCount = 0;
  const nodesToRemoveInTemplate = [];
  let currentRemovingNode = null;

  while (walker.nextNode()) {
    nodeIndex++;
    const node = walker.currentNode; // End removal if stepped past the removing node

    if (node.previousSibling === currentRemovingNode) {
      currentRemovingNode = null;
    } // A node to remove was found in the template


    if (nodesToRemove.has(node)) {
      nodesToRemoveInTemplate.push(node); // Track node we're removing

      if (currentRemovingNode === null) {
        currentRemovingNode = node;
      }
    } // When removing, increment count by which to adjust subsequent part indices


    if (currentRemovingNode !== null) {
      removeCount++;
    }

    while (part !== undefined && part.index === nodeIndex) {
      // If part is in a removed node deactivate it by setting index to -1 or
      // adjust the index as needed.
      part.index = currentRemovingNode !== null ? -1 : part.index - removeCount; // go to the next active part.

      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
      part = parts[partIndex];
    }
  }

  nodesToRemoveInTemplate.forEach(n => n.parentNode.removeChild(n));
}

const countNodes = node => {
  let count = node.nodeType === 11
  /* Node.DOCUMENT_FRAGMENT_NODE */
  ? 0 : 1;
  const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);

  while (walker.nextNode()) {
    count++;
  }

  return count;
};

const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
  for (let i = startIndex + 1; i < parts.length; i++) {
    const part = parts[i];

    if (isTemplatePartActive(part)) {
      return i;
    }
  }

  return -1;
};
/**
 * Inserts the given node into the Template, optionally before the given
 * refNode. In addition to inserting the node into the Template, the Template
 * part indices are updated to match the mutated Template DOM.
 */


function insertNodeIntoTemplate(template, node, refNode = null) {
  const {
    element: {
      content
    },
    parts
  } = template; // If there's no refNode, then put node at end of template.
  // No part indices need to be shifted in this case.

  if (refNode === null || refNode === undefined) {
    content.appendChild(node);
    return;
  }

  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts);
  let insertCount = 0;
  let walkerIndex = -1;

  while (walker.nextNode()) {
    walkerIndex++;
    const walkerNode = walker.currentNode;

    if (walkerNode === refNode) {
      insertCount = countNodes(node);
      refNode.parentNode.insertBefore(node, refNode);
    }

    while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
      // If we've inserted the node, simply adjust all subsequent parts
      if (insertCount > 0) {
        while (partIndex !== -1) {
          parts[partIndex].index += insertCount;
          partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
        }

        return;
      }

      partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
    }
  }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;

let compatibleShadyCSSVersion = true;

if (typeof window.ShadyCSS === 'undefined') {
  compatibleShadyCSSVersion = false;
} else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
  console.warn(`Incompatible ShadyCSS version detected.` + `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and` + `@webcomponents/shadycss@1.3.1.`);
  compatibleShadyCSSVersion = false;
}
/**
 * Template factory which scopes template DOM using ShadyCSS.
 * @param scopeName {string}
 */


const shadyTemplateFactory = scopeName => result => {
  const cacheKey = getTemplateCacheKey(result.type, scopeName);
  let templateCache = templateCaches.get(cacheKey);

  if (templateCache === undefined) {
    templateCache = {
      stringsArray: new WeakMap(),
      keyString: new Map()
    };
    templateCaches.set(cacheKey, templateCache);
  }

  let template = templateCache.stringsArray.get(result.strings);

  if (template !== undefined) {
    return template;
  }

  const key = result.strings.join(marker);
  template = templateCache.keyString.get(key);

  if (template === undefined) {
    const element = result.getTemplateElement();

    if (compatibleShadyCSSVersion) {
      window.ShadyCSS.prepareTemplateDom(element, scopeName);
    }

    template = new Template(result, element);
    templateCache.keyString.set(key, template);
  }

  templateCache.stringsArray.set(result.strings, template);
  return template;
};

const TEMPLATE_TYPES = ['html', 'svg'];
/**
 * Removes all style elements from Templates for the given scopeName.
 */

const removeStylesFromLitTemplates = scopeName => {
  TEMPLATE_TYPES.forEach(type => {
    const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));

    if (templates !== undefined) {
      templates.keyString.forEach(template => {
        const {
          element: {
            content
          }
        } = template; // IE 11 doesn't support the iterable param Set constructor

        const styles = new Set();
        Array.from(content.querySelectorAll('style')).forEach(s => {
          styles.add(s);
        });
        removeNodesFromTemplate(template, styles);
      });
    }
  });
};

const shadyRenderSet = new Set();
/**
 * For the given scope name, ensures that ShadyCSS style scoping is performed.
 * This is done just once per scope name so the fragment and template cannot
 * be modified.
 * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
 * to be scoped and appended to the document
 * (2) removes style elements from all lit-html Templates for this scope name.
 *
 * Note, <style> elements can only be placed into templates for the
 * initial rendering of the scope. If <style> elements are included in templates
 * dynamically rendered to the scope (after the first scope render), they will
 * not be scoped and the <style> will be left in the template and rendered
 * output.
 */

const prepareTemplateStyles = (renderedDOM, template, scopeName) => {
  shadyRenderSet.add(scopeName); // Move styles out of rendered DOM and store.

  const styles = renderedDOM.querySelectorAll('style'); // If there are no styles, skip unnecessary work

  if (styles.length === 0) {
    // Ensure prepareTemplateStyles is called to support adding
    // styles via `prepareAdoptedCssText` since that requires that
    // `prepareTemplateStyles` is called.
    window.ShadyCSS.prepareTemplateStyles(template.element, scopeName);
    return;
  }

  const condensedStyle = document.createElement('style'); // Collect styles into a single style. This helps us make sure ShadyCSS
  // manipulations will not prevent us from being able to fix up template
  // part indices.
  // NOTE: collecting styles is inefficient for browsers but ShadyCSS
  // currently does this anyway. When it does not, this should be changed.

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    style.parentNode.removeChild(style);
    condensedStyle.textContent += style.textContent;
  } // Remove styles from nested templates in this scope.


  removeStylesFromLitTemplates(scopeName); // And then put the condensed style into the "root" template passed in as
  // `template`.

  insertNodeIntoTemplate(template, condensedStyle, template.element.content.firstChild); // Note, it's important that ShadyCSS gets the template that `lit-html`
  // will actually render so that it can update the style inside when
  // needed (e.g. @apply native Shadow DOM case).

  window.ShadyCSS.prepareTemplateStyles(template.element, scopeName);

  if (window.ShadyCSS.nativeShadow) {
    // When in native Shadow DOM, re-add styling to rendered content using
    // the style ShadyCSS produced.
    const style = template.element.content.querySelector('style');
    renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
  } else {
    // When not in native Shadow DOM, at this point ShadyCSS will have
    // removed the style from the lit template and parts will be broken as a
    // result. To fix this, we put back the style node ShadyCSS removed
    // and then tell lit to remove that node from the template.
    // NOTE, ShadyCSS creates its own style so we can safely add/remove
    // `condensedStyle` here.
    template.element.content.insertBefore(condensedStyle, template.element.content.firstChild);
    const removes = new Set();
    removes.add(condensedStyle);
    removeNodesFromTemplate(template, removes);
  }
};
/**
 * Extension to the standard `render` method which supports rendering
 * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
 * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
 * or when the webcomponentsjs
 * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
 *
 * Adds a `scopeName` option which is used to scope element DOM and stylesheets
 * when native ShadowDOM is unavailable. The `scopeName` will be added to
 * the class attribute of all rendered DOM. In addition, any style elements will
 * be automatically re-written with this `scopeName` selector and moved out
 * of the rendered DOM and into the document `<head>`.
 *
 * It is common to use this render method in conjunction with a custom element
 * which renders a shadowRoot. When this is done, typically the element's
 * `localName` should be used as the `scopeName`.
 *
 * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
 * custom properties (needed only on older browsers like IE11) and a shim for
 * a deprecated feature called `@apply` that supports applying a set of css
 * custom properties to a given location.
 *
 * Usage considerations:
 *
 * * Part values in `<style>` elements are only applied the first time a given
 * `scopeName` renders. Subsequent changes to parts in style elements will have
 * no effect. Because of this, parts in style elements should only be used for
 * values that will never change, for example parts that set scope-wide theme
 * values or parts which render shared style elements.
 *
 * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
 * custom element's `constructor` is not supported. Instead rendering should
 * either done asynchronously, for example at microtask timing (for example
 * `Promise.resolve()`), or be deferred until the first time the element's
 * `connectedCallback` runs.
 *
 * Usage considerations when using shimmed custom properties or `@apply`:
 *
 * * Whenever any dynamic changes are made which affect
 * css custom properties, `ShadyCSS.styleElement(element)` must be called
 * to update the element. There are two cases when this is needed:
 * (1) the element is connected to a new parent, (2) a class is added to the
 * element that causes it to match different custom properties.
 * To address the first case when rendering a custom element, `styleElement`
 * should be called in the element's `connectedCallback`.
 *
 * * Shimmed custom properties may only be defined either for an entire
 * shadowRoot (for example, in a `:host` rule) or via a rule that directly
 * matches an element with a shadowRoot. In other words, instead of flowing from
 * parent to child as do native css custom properties, shimmed custom properties
 * flow only from shadowRoots to nested shadowRoots.
 *
 * * When using `@apply` mixing css shorthand property names with
 * non-shorthand names (for example `border` and `border-width`) is not
 * supported.
 */


const render$1 = (result, container, options) => {
  const scopeName = options.scopeName;
  const hasRendered = parts.has(container);
  const needsScoping = container instanceof ShadowRoot && compatibleShadyCSSVersion && result instanceof TemplateResult; // Handle first render to a scope specially...

  const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName); // On first scope render, render into a fragment; this cannot be a single
  // fragment that is reused since nested renders can occur synchronously.

  const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
  render(result, renderContainer, Object.assign({
    templateFactory: shadyTemplateFactory(scopeName)
  }, options)); // When performing first scope render,
  // (1) We've rendered into a fragment so that there's a chance to
  // `prepareTemplateStyles` before sub-elements hit the DOM
  // (which might cause them to render based on a common pattern of
  // rendering in a custom element's `connectedCallback`);
  // (2) Scope the template with ShadyCSS one time only for this scope.
  // (3) Render the fragment into the container and make sure the
  // container knows its `part` is the one we just rendered. This ensures
  // DOM will be re-used on subsequent renders.

  if (firstScopeRender) {
    const part = parts.get(renderContainer);
    parts.delete(renderContainer);

    if (part.value instanceof TemplateInstance) {
      prepareTemplateStyles(renderContainer, part.value.template, scopeName);
    }

    removeNodes(container, container.firstChild);
    container.appendChild(renderContainer);
    parts.set(container, part);
  } // After elements have hit the DOM, update styling if this is the
  // initial render to this container.
  // This is needed whenever dynamic changes are made so it would be
  // safest to do every render; however, this would regress performance
  // so we leave it up to the user to call `ShadyCSSS.styleElement`
  // for dynamic changes.


  if (!hasRendered && needsScoping) {
    window.ShadyCSS.styleElement(container.host);
  }
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
window.JSCompiler_renameProperty = (prop, _obj) => prop;

const defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value ? '' : null;

      case Object:
      case Array:
        // if the value is `null` or `undefined` pass this through
        // to allow removing/no change behavior.
        return value == null ? value : JSON.stringify(value);
    }

    return value;
  },

  fromAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value !== null;

      case Number:
        return value === null ? null : Number(value);

      case Object:
      case Array:
        return JSON.parse(value);
    }

    return value;
  }

};
/**
 * Change function that returns true if `value` is different from `oldValue`.
 * This method is used as the default for a property's `hasChanged` function.
 */

const notEqual = (value, old) => {
  // This ensures (old==NaN, value==NaN) always returns false
  return old !== value && (old === old || value === value);
};
const defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
const microtaskPromise = Promise.resolve(true);
const STATE_HAS_UPDATED = 1;
const STATE_UPDATE_REQUESTED = 1 << 2;
const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
const STATE_HAS_CONNECTED = 1 << 5;
/**
 * Base element class which manages element properties and attributes. When
 * properties change, the `update` method is asynchronously called. This method
 * should be supplied by subclassers to render updates as desired.
 */

class UpdatingElement extends HTMLElement {
  constructor() {
    super();
    this._updateState = 0;
    this._instanceProperties = undefined;
    this._updatePromise = microtaskPromise;
    this._hasConnectedResolver = undefined;
    /**
     * Map with keys for any properties that have changed since the last
     * update cycle with previous values.
     */

    this._changedProperties = new Map();
    /**
     * Map with keys of properties that should be reflected when updated.
     */

    this._reflectingProperties = undefined;
    this.initialize();
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   */


  static get observedAttributes() {
    // note: piggy backing on this to ensure we're finalized.
    this.finalize();
    const attributes = []; // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays

    this._classProperties.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v);

      if (attr !== undefined) {
        this._attributeToPropertyMap.set(attr, p);

        attributes.push(attr);
      }
    });

    return attributes;
  }
  /**
   * Ensures the private `_classProperties` property metadata is created.
   * In addition to `finalize` this is also called in `createProperty` to
   * ensure the `@property` decorator can add property metadata.
   */

  /** @nocollapse */


  static _ensureClassProperties() {
    // ensure private storage for property declarations.
    if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
      this._classProperties = new Map(); // NOTE: Workaround IE11 not supporting Map constructor argument.

      const superProperties = Object.getPrototypeOf(this)._classProperties;

      if (superProperties !== undefined) {
        superProperties.forEach((v, k) => this._classProperties.set(k, v));
      }
    }
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist.
   * The property setter calls the property's `hasChanged` property option
   * or uses a strict identity check to determine whether or not to request
   * an update.
   * @nocollapse
   */


  static createProperty(name, options = defaultPropertyDeclaration) {
    // Note, since this can be called by the `@property` decorator which
    // is called before `finalize`, we ensure storage exists for property
    // metadata.
    this._ensureClassProperties();

    this._classProperties.set(name, options); // Do not generate an accessor if the prototype already has one, since
    // it would be lost otherwise and that would never be the user's intention;
    // Instead, we expect users to call `requestUpdate` themselves from
    // user-defined accessors. Note that if the super has an accessor we will
    // still overwrite it


    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return;
    }

    const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
    Object.defineProperty(this.prototype, name, {
      // tslint:disable-next-line:no-any no symbol in index
      get() {
        return this[key];
      },

      set(value) {
        // tslint:disable-next-line:no-any no symbol in index
        const oldValue = this[name]; // tslint:disable-next-line:no-any no symbol in index

        this[key] = value;

        this._requestUpdate(name, oldValue);
      },

      configurable: true,
      enumerable: true
    });
  }
  /**
   * Creates property accessors for registered properties and ensures
   * any superclasses are also finalized.
   * @nocollapse
   */


  static finalize() {
    if (this.hasOwnProperty(JSCompiler_renameProperty('finalized', this)) && this.finalized) {
      return;
    } // finalize any superclasses


    const superCtor = Object.getPrototypeOf(this);

    if (typeof superCtor.finalize === 'function') {
      superCtor.finalize();
    }

    this.finalized = true;

    this._ensureClassProperties(); // initialize Map populated in observedAttributes


    this._attributeToPropertyMap = new Map(); // make any properties
    // Note, only process "own" properties since this element will inherit
    // any properties defined on the superClass, and finalization ensures
    // the entire prototype chain is finalized.

    if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
      const props = this.properties; // support symbols in properties (IE11 does not support this)

      const propKeys = [...Object.getOwnPropertyNames(props), ...(typeof Object.getOwnPropertySymbols === 'function' ? Object.getOwnPropertySymbols(props) : [])]; // This for/of is ok because propKeys is an array

      for (const p of propKeys) {
        // note, use of `any` is due to TypeSript lack of support for symbol in
        // index types
        // tslint:disable-next-line:no-any no symbol in index
        this.createProperty(p, props[p]);
      }
    }
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */


  static _attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? undefined : typeof attribute === 'string' ? attribute : typeof name === 'string' ? name.toLowerCase() : undefined;
  }
  /**
   * Returns true if a property should request an update.
   * Called when a property value is set and uses the `hasChanged`
   * option for the property if present or a strict identity check.
   * @nocollapse
   */


  static _valueHasChanged(value, old, hasChanged = notEqual) {
    return hasChanged(value, old);
  }
  /**
   * Returns the property value for the given attribute value.
   * Called via the `attributeChangedCallback` and uses the property's
   * `converter` or `converter.fromAttribute` property option.
   * @nocollapse
   */


  static _propertyValueFromAttribute(value, options) {
    const type = options.type;
    const converter = options.converter || defaultConverter;
    const fromAttribute = typeof converter === 'function' ? converter : converter.fromAttribute;
    return fromAttribute ? fromAttribute(value, type) : value;
  }
  /**
   * Returns the attribute value for the given property value. If this
   * returns undefined, the property will *not* be reflected to an attribute.
   * If this returns null, the attribute will be removed, otherwise the
   * attribute will be set to the value.
   * This uses the property's `reflect` and `type.toAttribute` property options.
   * @nocollapse
   */


  static _propertyValueToAttribute(value, options) {
    if (options.reflect === undefined) {
      return;
    }

    const type = options.type;
    const converter = options.converter;
    const toAttribute = converter && converter.toAttribute || defaultConverter.toAttribute;
    return toAttribute(value, type);
  }
  /**
   * Performs element initialization. By default captures any pre-set values for
   * registered properties.
   */


  initialize() {
    this._saveInstanceProperties(); // ensures first update will be caught by an early access of `updateComplete`


    this._requestUpdate();
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */


  _saveInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    this.constructor._classProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        const value = this[p];
        delete this[p];

        if (!this._instanceProperties) {
          this._instanceProperties = new Map();
        }

        this._instanceProperties.set(p, value);
      }
    });
  }
  /**
   * Applies previously saved instance properties.
   */


  _applyInstanceProperties() {
    // Use forEach so this works even if for/of loops are compiled to for loops
    // expecting arrays
    // tslint:disable-next-line:no-any
    this._instanceProperties.forEach((v, p) => this[p] = v);

    this._instanceProperties = undefined;
  }

  connectedCallback() {
    this._updateState = this._updateState | STATE_HAS_CONNECTED; // Ensure first connection completes an update. Updates cannot complete before
    // connection and if one is pending connection the `_hasConnectionResolver`
    // will exist. If so, resolve it to complete the update, otherwise
    // requestUpdate.

    if (this._hasConnectedResolver) {
      this._hasConnectedResolver();

      this._hasConnectedResolver = undefined;
    }
  }
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */


  disconnectedCallback() {}
  /**
   * Synchronizes property values when attributes change.
   */


  attributeChangedCallback(name, old, value) {
    if (old !== value) {
      this._attributeToProperty(name, value);
    }
  }

  _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    const ctor = this.constructor;

    const attr = ctor._attributeNameForProperty(name, options);

    if (attr !== undefined) {
      const attrValue = ctor._propertyValueToAttribute(value, options); // an undefined value does not change the attribute.


      if (attrValue === undefined) {
        return;
      } // Track if the property is being reflected to avoid
      // setting the property again via `attributeChangedCallback`. Note:
      // 1. this takes advantage of the fact that the callback is synchronous.
      // 2. will behave incorrectly if multiple attributes are in the reaction
      // stack at time of calling. However, since we process attributes
      // in `update` this should not be possible (or an extreme corner case
      // that we'd like to discover).
      // mark state reflecting


      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;

      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      } // mark state not reflecting


      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
    }
  }

  _attributeToProperty(name, value) {
    // Use tracking info to avoid deserializing attribute value if it was
    // just set from a property setter.
    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
      return;
    }

    const ctor = this.constructor;

    const propName = ctor._attributeToPropertyMap.get(name);

    if (propName !== undefined) {
      const options = ctor._classProperties.get(propName) || defaultPropertyDeclaration; // mark state reflecting

      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
      this[propName] = // tslint:disable-next-line:no-any
      ctor._propertyValueFromAttribute(value, options); // mark state not reflecting

      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
    }
  }
  /**
   * This private version of `requestUpdate` does not access or return the
   * `updateComplete` promise. This promise can be overridden and is therefore
   * not free to access.
   */


  _requestUpdate(name, oldValue) {
    let shouldRequestUpdate = true; // If we have a property key, perform property update steps.

    if (name !== undefined) {
      const ctor = this.constructor;
      const options = ctor._classProperties.get(name) || defaultPropertyDeclaration;

      if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
        if (!this._changedProperties.has(name)) {
          this._changedProperties.set(name, oldValue);
        } // Add to reflecting properties set.
        // Note, it's important that every change has a chance to add the
        // property to `_reflectingProperties`. This ensures setting
        // attribute + property reflects correctly.


        if (options.reflect === true && !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
          if (this._reflectingProperties === undefined) {
            this._reflectingProperties = new Map();
          }

          this._reflectingProperties.set(name, options);
        }
      } else {
        // Abort the request if the property should not be considered changed.
        shouldRequestUpdate = false;
      }
    }

    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
      this._enqueueUpdate();
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should
   * be called when an element should update based on some state not triggered
   * by setting a property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored. Returns the `updateComplete` Promise which is resolved
   * when the update completes.
   *
   * @param name {PropertyKey} (optional) name of requesting property
   * @param oldValue {any} (optional) old value of requesting property
   * @returns {Promise} A Promise that is resolved when the update completes.
   */


  requestUpdate(name, oldValue) {
    this._requestUpdate(name, oldValue);

    return this.updateComplete;
  }
  /**
   * Sets up the element to asynchronously update.
   */


  async _enqueueUpdate() {
    // Mark state updating...
    this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
    let resolve;
    let reject;
    const previousUpdatePromise = this._updatePromise;
    this._updatePromise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    try {
      // Ensure any previous update has resolved before updating.
      // This `await` also ensures that property changes are batched.
      await previousUpdatePromise;
    } catch (e) {} // Ignore any previous errors. We only care that the previous cycle is
    // done. Any error should have been handled in the previous update.
    // Make sure the element has connected before updating.


    if (!this._hasConnected) {
      await new Promise(res => this._hasConnectedResolver = res);
    }

    try {
      const result = this.performUpdate(); // If `performUpdate` returns a Promise, we await it. This is done to
      // enable coordinating updates with a scheduler. Note, the result is
      // checked to avoid delaying an additional microtask unless we need to.

      if (result != null) {
        await result;
      }
    } catch (e) {
      reject(e);
    }

    resolve(!this._hasRequestedUpdate);
  }

  get _hasConnected() {
    return this._updateState & STATE_HAS_CONNECTED;
  }

  get _hasRequestedUpdate() {
    return this._updateState & STATE_UPDATE_REQUESTED;
  }

  get hasUpdated() {
    return this._updateState & STATE_HAS_UPDATED;
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * You can override this method to change the timing of updates. If this
   * method is overridden, `super.performUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```
   * protected async performUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.performUpdate();
   * }
   * ```
   */


  performUpdate() {
    // Mixin instance properties once, if they exist.
    if (this._instanceProperties) {
      this._applyInstanceProperties();
    }

    let shouldUpdate = false;
    const changedProperties = this._changedProperties;

    try {
      shouldUpdate = this.shouldUpdate(changedProperties);

      if (shouldUpdate) {
        this.update(changedProperties);
      }
    } catch (e) {
      // Prevent `firstUpdated` and `updated` from running when there's an
      // update exception.
      shouldUpdate = false;
      throw e;
    } finally {
      // Ensure element can accept additional updates after an exception.
      this._markUpdated();
    }

    if (shouldUpdate) {
      if (!(this._updateState & STATE_HAS_UPDATED)) {
        this._updateState = this._updateState | STATE_HAS_UPDATED;
        this.firstUpdated(changedProperties);
      }

      this.updated(changedProperties);
    }
  }

  _markUpdated() {
    this._changedProperties = new Map();
    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update. This getter can be implemented to
   * await additional state. For example, it is sometimes useful to await a
   * rendered element before fulfilling this Promise. To do this, first await
   * `super.updateComplete` then any subsequent state.
   *
   * @returns {Promise} The Promise returns a boolean that indicates if the
   * update resolved without triggering another update.
   */


  get updateComplete() {
    return this._updatePromise;
  }
  /**
   * Controls whether or not `update` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  shouldUpdate(_changedProperties) {
    return true;
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  update(_changedProperties) {
    if (this._reflectingProperties !== undefined && this._reflectingProperties.size > 0) {
      // Use forEach so this works even if for/of loops are compiled to for
      // loops expecting arrays
      this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));

      this._reflectingProperties = undefined;
    }
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  updated(_changedProperties) {}
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * * @param _changedProperties Map of changed properties with old values
   */


  firstUpdated(_changedProperties) {}

}
/**
 * Marks class as having finished creating properties.
 */

UpdatingElement.finalized = true;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
@license
Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
const supportsAdoptingStyleSheets = 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype;
const constructionToken = Symbol();
class CSSResult {
  constructor(cssText, safeToken) {
    if (safeToken !== constructionToken) {
      throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
    }

    this.cssText = cssText;
  } // Note, this is a getter so that it's lazy. In practice, this means
  // stylesheets are not created until the first element instance is made.


  get styleSheet() {
    if (this._styleSheet === undefined) {
      // Note, if `adoptedStyleSheets` is supported then we assume CSSStyleSheet
      // is constructable.
      if (supportsAdoptingStyleSheets) {
        this._styleSheet = new CSSStyleSheet();

        this._styleSheet.replaceSync(this.cssText);
      } else {
        this._styleSheet = null;
      }
    }

    return this._styleSheet;
  }

  toString() {
    return this.cssText;
  }

}

const textFromCSSResult = value => {
  if (value instanceof CSSResult) {
    return value.cssText;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
  }
};
/**
 * Template tag which which can be used with LitElement's `style` property to
 * set element styles. For security reasons, only literal string values may be
 * used. To incorporate non-literal values `unsafeCSS` may be used inside a
 * template string part.
 */


const css = (strings, ...values) => {
  const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, constructionToken);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time

(window['litElementVersions'] || (window['litElementVersions'] = [])).push('2.0.1');
/**
 * Minimal implementation of Array.prototype.flat
 * @param arr the array to flatten
 * @param result the accumlated result
 */

function arrayFlat(styles, result = []) {
  for (let i = 0, length = styles.length; i < length; i++) {
    const value = styles[i];

    if (Array.isArray(value)) {
      arrayFlat(value, result);
    } else {
      result.push(value);
    }
  }

  return result;
}
/** Deeply flattens styles array. Uses native flat if available. */


const flattenStyles = styles => styles.flat ? styles.flat(Infinity) : arrayFlat(styles);

class LitElement extends UpdatingElement {
  /** @nocollapse */
  static finalize() {
    super.finalize(); // Prepare styling that is stamped at first render time. Styling
    // is built from user provided `styles` or is inherited from the superclass.

    this._styles = this.hasOwnProperty(JSCompiler_renameProperty('styles', this)) ? this._getUniqueStyles() : this._styles || [];
  }
  /** @nocollapse */


  static _getUniqueStyles() {
    // Take care not to call `this.styles` multiple times since this generates
    // new CSSResults each time.
    // TODO(sorvell): Since we do not cache CSSResults by input, any
    // shared styles will generate new stylesheet objects, which is wasteful.
    // This should be addressed when a browser ships constructable
    // stylesheets.
    const userStyles = this.styles;
    const styles = [];

    if (Array.isArray(userStyles)) {
      const flatStyles = flattenStyles(userStyles); // As a performance optimization to avoid duplicated styling that can
      // occur especially when composing via subclassing, de-duplicate styles
      // preserving the last item in the list. The last item is kept to
      // try to preserve cascade order with the assumption that it's most
      // important that last added styles override previous styles.

      const styleSet = flatStyles.reduceRight((set, s) => {
        set.add(s); // on IE set.add does not return the set.

        return set;
      }, new Set()); // Array.from does not work on Set in IE

      styleSet.forEach(v => styles.unshift(v));
    } else if (userStyles) {
      styles.push(userStyles);
    }

    return styles;
  }
  /**
   * Performs element initialization. By default this calls `createRenderRoot`
   * to create the element `renderRoot` node and captures any pre-set values for
   * registered properties.
   */


  initialize() {
    super.initialize();
    this.renderRoot = this.createRenderRoot(); // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
    // element's getRootNode(). While this could be done, we're choosing not to
    // support this now since it would require different logic around de-duping.

    if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
      this.adoptStyles();
    }
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   * @returns {Element|DocumentFragment} Returns a node into which to render.
   */


  createRenderRoot() {
    return this.attachShadow({
      mode: 'open'
    });
  }
  /**
   * Applies styling to the element shadowRoot using the `static get styles`
   * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is polyfilled,
   * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
   * is available but `adoptedStyleSheets` is not, styles are appended to the
   * end of the `shadowRoot` to [mimic spec
   * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */


  adoptStyles() {
    const styles = this.constructor._styles;

    if (styles.length === 0) {
      return;
    } // There are three separate cases here based on Shadow DOM support.
    // (1) shadowRoot polyfilled: use ShadyCSS
    // (2) shadowRoot.adoptedStyleSheets available: use it.
    // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
    // rendering


    if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map(s => s.cssText), this.localName);
    } else if (supportsAdoptingStyleSheets) {
      this.renderRoot.adoptedStyleSheets = styles.map(s => s.styleSheet);
    } else {
      // This must be done after rendering so the actual style insertion is done
      // in `update`.
      this._needsShimAdoptedStyleSheets = true;
    }
  }

  connectedCallback() {
    super.connectedCallback(); // Note, first update/render handles styleElement so we only call this if
    // connected after first update.

    if (this.hasUpdated && window.ShadyCSS !== undefined) {
      window.ShadyCSS.styleElement(this);
    }
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * * @param _changedProperties Map of changed properties with old values
   */


  update(changedProperties) {
    super.update(changedProperties);
    const templateResult = this.render();

    if (templateResult instanceof TemplateResult) {
      this.constructor.render(templateResult, this.renderRoot, {
        scopeName: this.localName,
        eventContext: this
      });
    } // When native Shadow DOM is used but adoptedStyles are not supported,
    // insert styling after rendering to ensure adoptedStyles have highest
    // priority.


    if (this._needsShimAdoptedStyleSheets) {
      this._needsShimAdoptedStyleSheets = false;

      this.constructor._styles.forEach(s => {
        const style = document.createElement('style');
        style.textContent = s.cssText;
        this.renderRoot.appendChild(style);
      });
    }
  }
  /**
   * Invoked on each update to perform rendering tasks. This method must return
   * a lit-html TemplateResult. Setting properties inside this method will *not*
   * trigger the element to update.
   */


  render() {}

}
/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 */

LitElement.finalized = true;
/**
 * Render method used to render the lit-html TemplateResult to the element's
 * DOM.
 * @param {TemplateResult} Template to render.
 * @param {Element|DocumentFragment} Node into which to render.
 * @param {String} Element name.
 * @nocollapse
 */

LitElement.render = render$1;

!function (e, t) {
  "object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = e || self).firebase = t();
}(undefined, function () {

  var r = function (e, t) {
    return (r = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (e, t) {
      e.__proto__ = t;
    } || function (e, t) {
      for (var r in t) t.hasOwnProperty(r) && (e[r] = t[r]);
    })(e, t);
  };

  var n = function () {
    return (n = Object.assign || function (e) {
      for (var t, r = 1, n = arguments.length; r < n; r++) for (var o in t = arguments[r]) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);

      return e;
    }).apply(this, arguments);
  };

  function d(e, t) {
    if (!(t instanceof Object)) return t;

    switch (t.constructor) {
      case Date:
        return new Date(t.getTime());

      case Object:
        void 0 === e && (e = {});
        break;

      case Array:
        e = [];
        break;

      default:
        return t;
    }

    for (var r in t) t.hasOwnProperty(r) && (e[r] = d(e[r], t[r]));

    return e;
  }

  var e,
      t,
      o,
      f = (o = Error, r(e = a, t = o), void (e.prototype = null === t ? Object.create(t) : (i.prototype = t.prototype, new i())), a);

  function i() {
    this.constructor = e;
  }

  function a(e, t) {
    var r = o.call(this, t) || this;
    return r.code = e, r.name = "FirebaseError", Object.setPrototypeOf(r, a.prototype), Error.captureStackTrace && Error.captureStackTrace(r, s.prototype.create), r;
  }

  var s = (c.prototype.create = function (e) {
    for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];

    for (var n = t[0] || {}, o = this.service + "/" + e, i = this.errors[e], a = i ? function (e, n) {
      return e.replace(h, function (e, t) {
        var r = n[t];
        return null != r ? r.toString() : "<" + t + "?>";
      });
    }(i, n) : "Error", s = this.serviceName + ": " + a + " (" + o + ").", c = new f(o, s), p = 0, l = Object.keys(n); p < l.length; p++) {
      var u = l[p];
      "_" !== u.slice(-1) && (u in c && console.warn('Overwriting FirebaseError base field "' + u + '" can cause unexpected behavior.'), c[u] = n[u]);
    }

    return c;
  }, c);

  function c(e, t, r) {
    this.service = e, this.serviceName = t, this.errors = r;
  }

  var h = /\{\$([^}]+)}/g;

  function v(e, t) {
    return Object.prototype.hasOwnProperty.call(e, t);
  }

  function p(e, t) {
    var r = new b(e, t);
    return r.subscribe.bind(r);
  }

  var l,
      u,
      b = (y.prototype.next = function (t) {
    this.forEachObserver(function (e) {
      e.next(t);
    });
  }, y.prototype.error = function (t) {
    this.forEachObserver(function (e) {
      e.error(t);
    }), this.close(t);
  }, y.prototype.complete = function () {
    this.forEachObserver(function (e) {
      e.complete();
    }), this.close();
  }, y.prototype.subscribe = function (e, t, r) {
    var n,
        o = this;
    if (void 0 === e && void 0 === t && void 0 === r) throw new Error("Missing Observer.");
    void 0 === (n = function (e, t) {
      if ("object" != typeof e || null === e) return !1;

      for (var r = 0, n = t; r < n.length; r++) {
        var o = n[r];
        if (o in e && "function" == typeof e[o]) return !0;
      }

      return !1;
    }(e, ["next", "error", "complete"]) ? e : {
      next: e,
      error: t,
      complete: r
    }).next && (n.next = g), void 0 === n.error && (n.error = g), void 0 === n.complete && (n.complete = g);
    var i = this.unsubscribeOne.bind(this, this.observers.length);
    return this.finalized && this.task.then(function () {
      try {
        o.finalError ? n.error(o.finalError) : n.complete();
      } catch (e) {}
    }), this.observers.push(n), i;
  }, y.prototype.unsubscribeOne = function (e) {
    void 0 !== this.observers && void 0 !== this.observers[e] && (delete this.observers[e], this.observerCount -= 1, 0 === this.observerCount && void 0 !== this.onNoObservers && this.onNoObservers(this));
  }, y.prototype.forEachObserver = function (e) {
    if (!this.finalized) for (var t = 0; t < this.observers.length; t++) this.sendOne(t, e);
  }, y.prototype.sendOne = function (e, t) {
    var r = this;
    this.task.then(function () {
      if (void 0 !== r.observers && void 0 !== r.observers[e]) try {
        t(r.observers[e]);
      } catch (e) {
        "undefined" != typeof console && console.error && console.error(e);
      }
    });
  }, y.prototype.close = function (e) {
    var t = this;
    this.finalized || (this.finalized = !0, void 0 !== e && (this.finalError = e), this.task.then(function () {
      t.observers = void 0, t.onNoObservers = void 0;
    }));
  }, y);

  function y(e, t) {
    var r = this;
    this.observers = [], this.unsubscribes = [], this.observerCount = 0, this.task = Promise.resolve(), this.finalized = !1, this.onNoObservers = t, this.task.then(function () {
      e(r);
    }).catch(function (e) {
      r.error(e);
    });
  }

  function g() {}

  (u = l = l || {})[u.DEBUG = 0] = "DEBUG", u[u.VERBOSE = 1] = "VERBOSE", u[u.INFO = 2] = "INFO", u[u.WARN = 3] = "WARN", u[u.ERROR = 4] = "ERROR", u[u.SILENT = 5] = "SILENT";

  function m(e, t) {
    for (var r = [], n = 2; n < arguments.length; n++) r[n - 2] = arguments[n];

    if (!(t < e.logLevel)) {
      var o = new Date().toISOString();

      switch (t) {
        case l.DEBUG:
        case l.VERBOSE:
          console.log.apply(console, ["[" + o + "]  " + e.name + ":"].concat(r));
          break;

        case l.INFO:
          console.info.apply(console, ["[" + o + "]  " + e.name + ":"].concat(r));
          break;

        case l.WARN:
          console.warn.apply(console, ["[" + o + "]  " + e.name + ":"].concat(r));
          break;

        case l.ERROR:
          console.error.apply(console, ["[" + o + "]  " + e.name + ":"].concat(r));
          break;

        default:
          throw new Error("Attempted to log a message with an invalid logType (value: " + t + ")");
      }
    }
  }

  var _,
      E = l.INFO,
      N = (Object.defineProperty(O.prototype, "logLevel", {
    get: function () {
      return this._logLevel;
    },
    set: function (e) {
      if (!(e in l)) throw new TypeError("Invalid value assigned to `logLevel`");
      this._logLevel = e;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(O.prototype, "logHandler", {
    get: function () {
      return this._logHandler;
    },
    set: function (e) {
      if ("function" != typeof e) throw new TypeError("Value assigned to `logHandler` must be a function");
      this._logHandler = e;
    },
    enumerable: !0,
    configurable: !0
  }), O.prototype.debug = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    this._logHandler.apply(this, [this, l.DEBUG].concat(e));
  }, O.prototype.log = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    this._logHandler.apply(this, [this, l.VERBOSE].concat(e));
  }, O.prototype.info = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    this._logHandler.apply(this, [this, l.INFO].concat(e));
  }, O.prototype.warn = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    this._logHandler.apply(this, [this, l.WARN].concat(e));
  }, O.prototype.error = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    this._logHandler.apply(this, [this, l.ERROR].concat(e));
  }, O);

  function O(e) {
    this.name = e, this._logLevel = E, this._logHandler = m;
  }

  var w = ((_ = {})["no-app"] = "No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()", _["bad-app-name"] = "Illegal App name: '{$appName}", _["duplicate-app"] = "Firebase App named '{$appName}' already exists", _["app-deleted"] = "Firebase App named '{$appName}' already deleted", _["duplicate-service"] = "Firebase service named '{$appName}' already registered", _["invalid-app-argument"] = "firebase.{$appName}() takes either no argument or a Firebase App instance.", _),
      A = new s("app", "Firebase", w),
      k = "[DEFAULT]",
      R = [],
      I = (Object.defineProperty(T.prototype, "automaticDataCollectionEnabled", {
    get: function () {
      return this.checkDestroyed_(), this.automaticDataCollectionEnabled_;
    },
    set: function (e) {
      this.checkDestroyed_(), this.automaticDataCollectionEnabled_ = e;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(T.prototype, "name", {
    get: function () {
      return this.checkDestroyed_(), this.name_;
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(T.prototype, "options", {
    get: function () {
      return this.checkDestroyed_(), this.options_;
    },
    enumerable: !0,
    configurable: !0
  }), T.prototype.delete = function () {
    var s = this;
    return new Promise(function (e) {
      s.checkDestroyed_(), e();
    }).then(function () {
      s.firebase_.INTERNAL.removeApp(s.name_);

      for (var e = [], t = 0, r = Object.keys(s.services_); t < r.length; t++) for (var n = r[t], o = 0, i = Object.keys(s.services_[n]); o < i.length; o++) {
        var a = i[o];
        e.push(s.services_[n][a]);
      }

      return Promise.all(e.filter(function (e) {
        return "INTERNAL" in e;
      }).map(function (e) {
        return e.INTERNAL.delete();
      }));
    }).then(function () {
      s.isDeleted_ = !0, s.services_ = {};
    });
  }, T.prototype._getService = function (e, t) {
    if (void 0 === t && (t = k), this.checkDestroyed_(), this.services_[e] || (this.services_[e] = {}), !this.services_[e][t]) {
      var r = t !== k ? t : void 0,
          n = this.firebase_.INTERNAL.factories[e](this, this.extendApp.bind(this), r);
      this.services_[e][t] = n;
    }

    return this.services_[e][t];
  }, T.prototype._removeServiceInstance = function (e, t) {
    void 0 === t && (t = k), this.services_[e] && this.services_[e][t] && delete this.services_[e][t];
  }, T.prototype.extendApp = function (e) {
    var t = this;
    d(this, e), e.INTERNAL && e.INTERNAL.addAuthTokenListener && (R.forEach(function (e) {
      t.INTERNAL.addAuthTokenListener(e);
    }), R = []);
  }, T.prototype.checkDestroyed_ = function () {
    if (this.isDeleted_) throw A.create("app-deleted", {
      appName: this.name_
    });
  }, T);

  function T(e, t, r) {
    this.firebase_ = r, this.isDeleted_ = !1, this.services_ = {}, this.name_ = t.name, this.automaticDataCollectionEnabled_ = t.automaticDataCollectionEnabled || !1, this.options_ = function (e) {
      return d(void 0, e);
    }(e), this.INTERNAL = {
      getUid: function () {
        return null;
      },
      getToken: function () {
        return Promise.resolve(null);
      },
      addAuthTokenListener: function (e) {
        R.push(e), setTimeout(function () {
          return e(null);
        }, 0);
      },
      removeAuthTokenListener: function (t) {
        R = R.filter(function (e) {
          return e !== t;
        });
      }
    };
  }

  I.prototype.name && I.prototype.options || I.prototype.delete || console.log("dc");
  var j = "6.3.4";
  var F = new N("@firebase/app");

  if ("object" == typeof self && self.self === self && void 0 !== self.firebase) {
    F.warn("\n    Warning: Firebase is already defined in the global scope. Please make sure\n    Firebase library is only loaded once.\n  ");
    var D = self.firebase.SDK_VERSION;
    D && 0 <= D.indexOf("LITE") && F.warn("\n    Warning: You are trying to load Firebase while using Firebase Performance standalone script.\n    You should load Firebase Performance with this instance of Firebase to avoid loading duplicate code.\n    ");
  }

  var L = function e() {
    var t = function (a) {
      var i = {},
          s = {},
          c = {},
          p = {
        __esModule: !0,
        initializeApp: function (e, t) {
          void 0 === t && (t = {}), "object" == typeof t && null !== t || (t = {
            name: t
          });
          var r = t;
          void 0 === r.name && (r.name = k);
          var n = r.name;
          if ("string" != typeof n || !n) throw A.create("bad-app-name", {
            appName: String(n)
          });
          if (v(i, n)) throw A.create("duplicate-app", {
            appName: n
          });
          var o = new a(e, r, p);
          return f(i[n] = o, "create"), o;
        },
        app: l,
        apps: null,
        SDK_VERSION: j,
        INTERNAL: {
          registerService: function (r, e, t, n, o) {
            if (void 0 === o && (o = !1), s[r]) throw A.create("duplicate-service", {
              appName: r
            });

            function i(e) {
              if (void 0 === e && (e = l()), "function" != typeof e[r]) throw A.create("invalid-app-argument", {
                appName: r
              });
              return e[r]();
            }

            return s[r] = e, n && (c[r] = n, u().forEach(function (e) {
              n("create", e);
            })), void 0 !== t && d(i, t), p[r] = i, a.prototype[r] = function () {
              for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

              return this._getService.bind(this, r).apply(this, o ? e : []);
            }, i;
          },
          removeApp: function (e) {
            f(i[e], "delete"), delete i[e];
          },
          factories: s,
          useAsService: h
        }
      };

      function l(e) {
        if (!v(i, e = e || k)) throw A.create("no-app", {
          appName: e
        });
        return i[e];
      }

      function u() {
        return Object.keys(i).map(function (e) {
          return i[e];
        });
      }

      function f(e, t) {
        for (var r = 0, n = Object.keys(s); r < n.length; r++) {
          var o = h(0, n[r]);
          if (null === o) return;
          c[o] && c[o](t, e);
        }
      }

      function h(e, t) {
        return "serverAuth" === t ? null : t;
      }

      return p.default = p, Object.defineProperty(p, "apps", {
        get: u
      }), l.App = a, p;
    }(I);

    return t.INTERNAL = n({}, t.INTERNAL, {
      createFirebaseNamespace: e,
      extendNamespace: function (e) {
        d(t, e);
      },
      createSubscribe: p,
      ErrorFactory: s,
      deepExtend: d
    }), t;
  }(),
      S = L.initializeApp;

  return L.initializeApp = function () {
    for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];

    return function () {
      try {
        return "[object process]" === Object.prototype.toString.call(global.process);
      } catch (e) {
        return !1;
      }
    }() && F.warn('\n      Warning: This is a browser-targeted Firebase bundle but it appears it is being\n      run in a Node environment.  If running in a Node environment, make sure you\n      are using the bundle specified by the "main" field in package.json.\n      \n      If you are using Webpack, you can specify "main" as the first item in\n      "resolve.mainFields":\n      https://webpack.js.org/configuration/resolve/#resolvemainfields\n      \n      If using Rollup, use the rollup-plugin-node-resolve plugin and specify "main"\n      as the first item in "mainFields", e.g. [\'main\', \'module\'].\n      https://github.com/rollup/rollup-plugin-node-resolve\n      '), S.apply(void 0, e);
  }, L;
});

!function (t, e) {
  "object" == typeof exports && "undefined" != typeof module ? e(require("@firebase/app")) : "function" == typeof define && define.amd ? define(["@firebase/app"], e) : e((t = t || self).firebase);
}(undefined, function ($h) {

  try {
    (function () {
      $h = $h && $h.hasOwnProperty("default") ? $h.default : $h, function () {
        var t,
            o = "function" == typeof Object.defineProperties ? Object.defineProperty : function (t, e, n) {
          t != Array.prototype && t != Object.prototype && (t[e] = n.value);
        },
            a = "undefined" != typeof window && window === this ? this : "undefined" != typeof global && null != global ? global : this;

        function c(t) {
          var e = "undefined" != typeof Symbol && Symbol.iterator && t[Symbol.iterator];
          return e ? e.call(t) : {
            next: function (t) {
              var e = 0;
              return function () {
                return e < t.length ? {
                  done: !1,
                  value: t[e++]
                } : {
                  done: !0
                };
              };
            }(t)
          };
        }

        !function (t, e) {
          if (e) {
            var n = a;
            t = t.split(".");

            for (var i = 0; i < t.length - 1; i++) {
              var r = t[i];
              r in n || (n[r] = {}), n = n[r];
            }

            (e = e(i = n[t = t[t.length - 1]])) != i && null != e && o(n, t, {
              configurable: !0,
              writable: !0,
              value: e
            });
          }
        }("Promise", function (t) {
          function s(t) {
            this.b = 0, this.c = void 0, this.a = [];
            var e = this.f();

            try {
              t(e.resolve, e.reject);
            } catch (t) {
              e.reject(t);
            }
          }

          function e() {
            this.a = null;
          }

          function u(e) {
            return e instanceof s ? e : new s(function (t) {
              t(e);
            });
          }

          if (t) return t;

          e.prototype.b = function (t) {
            if (null == this.a) {
              this.a = [];
              var e = this;
              this.c(function () {
                e.g();
              });
            }

            this.a.push(t);
          };

          var n = a.setTimeout;
          e.prototype.c = function (t) {
            n(t, 0);
          }, e.prototype.g = function () {
            for (; this.a && this.a.length;) {
              var t = this.a;
              this.a = [];

              for (var e = 0; e < t.length; ++e) {
                var n = t[e];
                t[e] = null;

                try {
                  n();
                } catch (t) {
                  this.f(t);
                }
              }
            }

            this.a = null;
          }, e.prototype.f = function (t) {
            this.c(function () {
              throw t;
            });
          }, s.prototype.f = function () {
            function t(e) {
              return function (t) {
                i || (i = !0, e.call(n, t));
              };
            }

            var n = this,
                i = !1;
            return {
              resolve: t(this.o),
              reject: t(this.g)
            };
          }, s.prototype.o = function (t) {
            if (t === this) this.g(new TypeError("A Promise cannot resolve to itself"));else if (t instanceof s) this.u(t);else {
              t: switch (typeof t) {
                case "object":
                  var e = null != t;
                  break t;

                case "function":
                  e = !0;
                  break t;

                default:
                  e = !1;
              }

              e ? this.l(t) : this.h(t);
            }
          }, s.prototype.l = function (t) {
            var e = void 0;

            try {
              e = t.then;
            } catch (t) {
              return void this.g(t);
            }

            "function" == typeof e ? this.v(e, t) : this.h(t);
          }, s.prototype.g = function (t) {
            this.i(2, t);
          }, s.prototype.h = function (t) {
            this.i(1, t);
          }, s.prototype.i = function (t, e) {
            if (0 != this.b) throw Error("Cannot settle(" + t + ", " + e + "): Promise already settled in state" + this.b);
            this.b = t, this.c = e, this.m();
          }, s.prototype.m = function () {
            if (null != this.a) {
              for (var t = 0; t < this.a.length; ++t) r.b(this.a[t]);

              this.a = null;
            }
          };
          var r = new e();
          return s.prototype.u = function (t) {
            var e = this.f();
            t.Ja(e.resolve, e.reject);
          }, s.prototype.v = function (t, e) {
            var n = this.f();

            try {
              t.call(e, n.resolve, n.reject);
            } catch (t) {
              n.reject(t);
            }
          }, s.prototype.then = function (t, e) {
            function n(e, t) {
              return "function" == typeof e ? function (t) {
                try {
                  i(e(t));
                } catch (t) {
                  r(t);
                }
              } : t;
            }

            var i,
                r,
                o = new s(function (t, e) {
              i = t, r = e;
            });
            return this.Ja(n(t, i), n(e, r)), o;
          }, s.prototype.catch = function (t) {
            return this.then(void 0, t);
          }, s.prototype.Ja = function (t, e) {
            function n() {
              switch (i.b) {
                case 1:
                  t(i.c);
                  break;

                case 2:
                  e(i.c);
                  break;

                default:
                  throw Error("Unexpected state: " + i.b);
              }
            }

            var i = this;
            null == this.a ? r.b(n) : this.a.push(n);
          }, s.resolve = u, s.reject = function (n) {
            return new s(function (t, e) {
              e(n);
            });
          }, s.race = function (r) {
            return new s(function (t, e) {
              for (var n = c(r), i = n.next(); !i.done; i = n.next()) u(i.value).Ja(t, e);
            });
          }, s.all = function (t) {
            var o = c(t),
                a = o.next();
            return a.done ? u([]) : new s(function (n, t) {
              function e(e) {
                return function (t) {
                  i[e] = t, 0 == --r && n(i);
                };
              }

              for (var i = [], r = 0; i.push(void 0), r++, u(a.value).Ja(e(i.length - 1), t), !(a = o.next()).done;);
            });
          }, s;
        });
        var u = u || {},
            h = this || self;

        function f(t) {
          return "string" == typeof t;
        }

        function n(t) {
          return "boolean" == typeof t;
        }

        var s = /^[\w+/_-]+[=]{0,2}$/,
            l = null;

        function d() {}

        function i(t) {
          var e = typeof t;

          if ("object" == e) {
            if (!t) return "null";
            if (t instanceof Array) return "array";
            if (t instanceof Object) return e;
            var n = Object.prototype.toString.call(t);
            if ("[object Window]" == n) return "object";
            if ("[object Array]" == n || "number" == typeof t.length && void 0 !== t.splice && void 0 !== t.propertyIsEnumerable && !t.propertyIsEnumerable("splice")) return "array";
            if ("[object Function]" == n || void 0 !== t.call && void 0 !== t.propertyIsEnumerable && !t.propertyIsEnumerable("call")) return "function";
          } else if ("function" == e && void 0 === t.call) return "object";

          return e;
        }

        function r(t) {
          return null === t;
        }

        function p(t) {
          return "array" == i(t);
        }

        function v(t) {
          var e = i(t);
          return "array" == e || "object" == e && "number" == typeof t.length;
        }

        function m(t) {
          return "function" == i(t);
        }

        function g(t) {
          var e = typeof t;
          return "object" == e && null != t || "function" == e;
        }

        var e = "closure_uid_" + (1e9 * Math.random() >>> 0),
            b = 0;

        function y(t, e, n) {
          return t.call.apply(t.bind, arguments);
        }

        function w(e, n, t) {
          if (!e) throw Error();

          if (2 < arguments.length) {
            var i = Array.prototype.slice.call(arguments, 2);
            return function () {
              var t = Array.prototype.slice.call(arguments);
              return Array.prototype.unshift.apply(t, i), e.apply(n, t);
            };
          }

          return function () {
            return e.apply(n, arguments);
          };
        }

        function I(t, e, n) {
          return (I = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? y : w).apply(null, arguments);
        }

        function T(e, t) {
          var n = Array.prototype.slice.call(arguments, 1);
          return function () {
            var t = n.slice();
            return t.push.apply(t, arguments), e.apply(this, t);
          };
        }

        var k = Date.now || function () {
          return +new Date();
        };

        function E(t, o) {
          function e() {}

          e.prototype = o.prototype, t.qb = o.prototype, t.prototype = new e(), (t.prototype.constructor = t).cd = function (t, e, n) {
            for (var i = Array(arguments.length - 2), r = 2; r < arguments.length; r++) i[r - 2] = arguments[r];

            return o.prototype[e].apply(t, i);
          };
        }

        function S(t) {
          if (!t) return !1;

          try {
            return !!t.$goog_Thenable;
          } catch (t) {
            return !1;
          }
        }

        function A(t) {
          if (Error.captureStackTrace) Error.captureStackTrace(this, A);else {
            var e = Error().stack;
            e && (this.stack = e);
          }
          t && (this.message = String(t));
        }

        function N(t, e) {
          for (var n = "", i = (t = t.split("%s")).length - 1, r = 0; r < i; r++) n += t[r] + (r < e.length ? e[r] : "%s");

          A.call(this, n + t[i]);
        }

        function O(t, e) {
          throw new N("Failure" + (t ? ": " + t : ""), Array.prototype.slice.call(arguments, 1));
        }

        function _(t, e) {
          this.c = t, this.f = e, this.b = 0, this.a = null;
        }

        function P(t, e) {
          t.f(e), t.b < 100 && (t.b++, e.next = t.a, t.a = e);
        }

        function C() {
          this.b = this.a = null;
        }

        E(A, Error), A.prototype.name = "CustomError", E(N, A), N.prototype.name = "AssertionError", _.prototype.get = function () {
          if (0 < this.b) {
            this.b--;
            var t = this.a;
            this.a = t.next, t.next = null;
          } else t = this.c();

          return t;
        };
        var R = new _(function () {
          return new D();
        }, function (t) {
          t.reset();
        });

        function D() {
          this.next = this.b = this.a = null;
        }

        function L(t, e) {
          t: {
            try {
              var n = t && t.ownerDocument,
                  i = n && (n.defaultView || n.parentWindow);

              if ((i = i || h).Element && i.Location) {
                var r = i;
                break t;
              }
            } catch (t) {}

            r = null;
          }

          if (r && void 0 !== r[e] && (!t || !(t instanceof r[e]) && (t instanceof r.Location || t instanceof r.Element))) {
            if (g(t)) try {
              var o = t.constructor.displayName || t.constructor.name || Object.prototype.toString.call(t);
            } catch (t) {
              o = "<object could not be stringified>";
            } else o = void 0 === t ? "undefined" : null === t ? "null" : typeof t;
            O("Argument is not a %s (or a non-Element, non-Location mock); got: %s", e, o);
          }
        }

        C.prototype.add = function (t, e) {
          var n = R.get();
          n.set(t, e), this.b ? this.b.next = n : this.a = n, this.b = n;
        }, D.prototype.set = function (t, e) {
          this.a = t, this.b = e, this.next = null;
        }, D.prototype.reset = function () {
          this.next = this.b = this.a = null;
        };
        var x = Array.prototype.indexOf ? function (t, e) {
          return Array.prototype.indexOf.call(t, e, void 0);
        } : function (t, e) {
          if (f(t)) return f(e) && 1 == e.length ? t.indexOf(e, 0) : -1;

          for (var n = 0; n < t.length; n++) if (n in t && t[n] === e) return n;

          return -1;
        },
            M = Array.prototype.forEach ? function (t, e, n) {
          Array.prototype.forEach.call(t, e, n);
        } : function (t, e, n) {
          for (var i = t.length, r = f(t) ? t.split("") : t, o = 0; o < i; o++) o in r && e.call(n, r[o], o, t);
        };
        var j = Array.prototype.map ? function (t, e) {
          return Array.prototype.map.call(t, e, void 0);
        } : function (t, e) {
          for (var n = t.length, i = Array(n), r = f(t) ? t.split("") : t, o = 0; o < n; o++) o in r && (i[o] = e.call(void 0, r[o], o, t));

          return i;
        },
            U = Array.prototype.some ? function (t, e) {
          return Array.prototype.some.call(t, e, void 0);
        } : function (t, e) {
          for (var n = t.length, i = f(t) ? t.split("") : t, r = 0; r < n; r++) if (r in i && e.call(void 0, i[r], r, t)) return !0;

          return !1;
        };

        function V(t, e) {
          return 0 <= x(t, e);
        }

        function K(t, e) {
          var n;
          return (n = 0 <= (e = x(t, e))) && Array.prototype.splice.call(t, e, 1), n;
        }

        function F(n, i) {
          !function (t, e) {
            for (var n = f(t) ? t.split("") : t, i = t.length - 1; 0 <= i; --i) i in n && e.call(void 0, n[i], i, t);
          }(n, function (t, e) {
            i.call(void 0, t, e, n) && 1 == Array.prototype.splice.call(n, e, 1).length && 0;
          });
        }

        function q(t) {
          return Array.prototype.concat.apply([], arguments);
        }

        function H(t) {
          var e = t.length;

          if (0 < e) {
            for (var n = Array(e), i = 0; i < e; i++) n[i] = t[i];

            return n;
          }

          return [];
        }

        function B(t, e) {
          for (var n in t) e.call(void 0, t[n], n, t);
        }

        function G(t) {
          for (var e in t) return !1;

          return !0;
        }

        function W(t) {
          var e,
              n = {};

          for (e in t) n[e] = t[e];

          return n;
        }

        var X = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");

        function J(t, e) {
          for (var n, i, r = 1; r < arguments.length; r++) {
            for (n in i = arguments[r]) t[n] = i[n];

            for (var o = 0; o < X.length; o++) n = X[o], Object.prototype.hasOwnProperty.call(i, n) && (t[n] = i[n]);
          }
        }

        function z(t, e) {
          this.a = t === Z && e || "", this.b = $;
        }

        function Y(t) {
          return t instanceof z && t.constructor === z && t.b === $ ? t.a : (O("expected object of type Const, got '" + t + "'"), "type_error:Const");
        }

        z.prototype.na = !0, z.prototype.ma = function () {
          return this.a;
        }, z.prototype.toString = function () {
          return "Const{" + this.a + "}";
        };
        var $ = {},
            Z = {},
            Q = new z(Z, "");

        function tt() {
          this.a = "", this.b = ot;
        }

        function et(t) {
          return t instanceof tt && t.constructor === tt && t.b === ot ? t.a : (O("expected object of type TrustedResourceUrl, got '" + t + "' of type " + i(t)), "type_error:TrustedResourceUrl");
        }

        function nt(t, n) {
          var i = Y(t);
          if (!rt.test(i)) throw Error("Invalid TrustedResourceUrl format: " + i);
          return at(t = i.replace(it, function (t, e) {
            if (!Object.prototype.hasOwnProperty.call(n, e)) throw Error('Found marker, "' + e + '", in format string, "' + i + '", but no valid label mapping found in args: ' + JSON.stringify(n));
            return (t = n[e]) instanceof z ? Y(t) : encodeURIComponent(String(t));
          }));
        }

        tt.prototype.na = !0, tt.prototype.ma = function () {
          return this.a.toString();
        }, tt.prototype.toString = function () {
          return "TrustedResourceUrl{" + this.a + "}";
        };
        var it = /%{(\w+)}/g,
            rt = /^((https:)?\/\/[0-9a-z.:[\]-]+\/|\/[^/\\]|[^:/\\%]+\/|[^:/\\%]*[?#]|about:blank#)/i,
            ot = {};

        function at(t) {
          var e = new tt();
          return e.a = t, e;
        }

        var st = String.prototype.trim ? function (t) {
          return t.trim();
        } : function (t) {
          return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(t)[1];
        },
            ut = /&/g,
            ct = /</g,
            ht = />/g,
            ft = /"/g,
            lt = /'/g,
            dt = /\x00/g,
            pt = /[\x00&<>"']/;

        function vt(t, e) {
          return -1 != t.indexOf(e);
        }

        function mt(t, e) {
          return t < e ? -1 : e < t ? 1 : 0;
        }

        function gt() {
          this.a = "", this.b = Tt;
        }

        function bt(t) {
          return t instanceof gt && t.constructor === gt && t.b === Tt ? t.a : (O("expected object of type SafeUrl, got '" + t + "' of type " + i(t)), "type_error:SafeUrl");
        }

        gt.prototype.na = !0, gt.prototype.ma = function () {
          return this.a.toString();
        }, gt.prototype.toString = function () {
          return "SafeUrl{" + this.a + "}";
        };
        var yt = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;

        function wt(t) {
          return t instanceof gt ? t : (t = "object" == typeof t && t.na ? t.ma() : String(t), yt.test(t) || (t = "about:invalid#zClosurez"), kt(t));
        }

        var It,
            Tt = {};

        function kt(t) {
          var e = new gt();
          return e.a = t, e;
        }

        kt("about:blank");

        t: {
          var Et = h.navigator;

          if (Et) {
            var St = Et.userAgent;

            if (St) {
              It = St;
              break t;
            }
          }

          It = "";
        }

        function At(t) {
          return vt(It, t);
        }

        function Nt() {
          this.a = "", this.b = _t;
        }

        function Ot(t) {
          return t instanceof Nt && t.constructor === Nt && t.b === _t ? t.a : (O("expected object of type SafeHtml, got '" + t + "' of type " + i(t)), "type_error:SafeHtml");
        }

        Nt.prototype.na = !0, Nt.prototype.ma = function () {
          return this.a.toString();
        }, Nt.prototype.toString = function () {
          return "SafeHtml{" + this.a + "}";
        };
        var _t = {};

        function Pt(t) {
          var e = new Nt();
          return e.a = t, e;
        }

        Pt("<!DOCTYPE html>");
        var Ct,
            Rt,
            Dt = Pt("");

        function Lt(t, e) {
          for (var n = t.split("%s"), i = "", r = Array.prototype.slice.call(arguments, 1); r.length && 1 < n.length;) i += n.shift() + r.shift();

          return i + n.join("%s");
        }

        function xt(t) {
          return pt.test(t) && (-1 != t.indexOf("&") && (t = t.replace(ut, "&amp;")), -1 != t.indexOf("<") && (t = t.replace(ct, "&lt;")), -1 != t.indexOf(">") && (t = t.replace(ht, "&gt;")), -1 != t.indexOf('"') && (t = t.replace(ft, "&quot;")), -1 != t.indexOf("'") && (t = t.replace(lt, "&#39;")), -1 != t.indexOf("\0") && (t = t.replace(dt, "&#0;"))), t;
        }

        function Mt(t) {
          h.setTimeout(function () {
            throw t;
          }, 0);
        }

        function jt() {
          var t = h.MessageChannel;
          if (void 0 === t && "undefined" != typeof window && window.postMessage && window.addEventListener && !At("Presto") && (t = function () {
            var t = document.createElement("IFRAME");
            t.style.display = "none", function (t) {
              var e = at(Y(Q));
              L(t, "HTMLIFrameElement"), t.src = et(e).toString();
            }(t), document.documentElement.appendChild(t);
            var e = t.contentWindow;
            (t = e.document).open(), t.write(Ot(Dt)), t.close();
            var n = "callImmediate" + Math.random(),
                i = "file:" == e.location.protocol ? "*" : e.location.protocol + "//" + e.location.host;
            t = I(function (t) {
              "*" != i && t.origin != i || t.data != n || this.port1.onmessage();
            }, this), e.addEventListener("message", t, !1), this.port1 = {}, this.port2 = {
              postMessage: function () {
                e.postMessage(n, i);
              }
            };
          }), void 0 === t || At("Trident") || At("MSIE")) return "undefined" != typeof document && "onreadystatechange" in document.createElement("SCRIPT") ? function (t) {
            var e = document.createElement("SCRIPT");
            e.onreadystatechange = function () {
              e.onreadystatechange = null, e.parentNode.removeChild(e), e = null, t(), t = null;
            }, document.documentElement.appendChild(e);
          } : function (t) {
            h.setTimeout(t, 0);
          };
          var e = new t(),
              n = {},
              i = n;
          return e.port1.onmessage = function () {
            if (void 0 !== n.next) {
              var t = (n = n.next).yb;
              n.yb = null, t();
            }
          }, function (t) {
            i.next = {
              yb: t
            }, i = i.next, e.port2.postMessage(0);
          };
        }

        function Ut(t, e) {
          Rt || function () {
            if (h.Promise && h.Promise.resolve) {
              var t = h.Promise.resolve(void 0);

              Rt = function () {
                t.then(Ft);
              };
            } else Rt = function () {
              var t = Ft;
              !m(h.setImmediate) || h.Window && h.Window.prototype && !At("Edge") && h.Window.prototype.setImmediate == h.setImmediate ? (Ct = Ct || jt())(t) : h.setImmediate(t);
            };
          }(), Vt || (Rt(), Vt = !0), Kt.add(t, e);
        }

        Pt("<br>");
        var Vt = !1,
            Kt = new C();

        function Ft() {
          for (var t; n = e = void 0, n = null, (e = Kt).a && (n = e.a, e.a = e.a.next, e.a || (e.b = null), n.next = null), t = n;) {
            try {
              t.a.call(t.b);
            } catch (t) {
              Mt(t);
            }

            P(R, t);
          }

          var e, n;
          Vt = !1;
        }

        function qt(t, e) {
          if (this.a = Ht, this.i = void 0, this.f = this.b = this.c = null, this.g = this.h = !1, t != d) try {
            var n = this;
            t.call(e, function (t) {
              ee(n, Bt, t);
            }, function (t) {
              if (!(t instanceof ue)) try {
                if (t instanceof Error) throw t;
                throw Error("Promise rejected.");
              } catch (t) {}
              ee(n, Gt, t);
            });
          } catch (t) {
            ee(this, Gt, t);
          }
        }

        var Ht = 0,
            Bt = 2,
            Gt = 3;

        function Wt() {
          this.next = this.f = this.b = this.g = this.a = null, this.c = !1;
        }

        Wt.prototype.reset = function () {
          this.f = this.b = this.g = this.a = null, this.c = !1;
        };

        var Xt = new _(function () {
          return new Wt();
        }, function (t) {
          t.reset();
        });

        function Jt(t, e, n) {
          var i = Xt.get();
          return i.g = t, i.b = e, i.f = n, i;
        }

        function zt(t) {
          if (t instanceof qt) return t;
          var e = new qt(d);
          return ee(e, Bt, t), e;
        }

        function Yt(n) {
          return new qt(function (t, e) {
            e(n);
          });
        }

        function $t(t, e, n) {
          ne(t, e, n, null) || Ut(T(e, t));
        }

        function Zt(n) {
          return new qt(function (i) {
            var r = n.length,
                o = [];
            if (r) for (var t = function (t, e, n) {
              r--, o[t] = e ? {
                Eb: !0,
                value: n
              } : {
                Eb: !1,
                reason: n
              }, 0 == r && i(o);
            }, e = 0; e < n.length; e++) $t(n[e], T(t, e, !0), T(t, e, !1));else i(o);
          });
        }

        function Qt(t, e) {
          t.b || t.a != Bt && t.a != Gt || ie(t), t.f ? t.f.next = e : t.b = e, t.f = e;
        }

        function te(t, r, o, a) {
          var e = Jt(null, null, null);
          return e.a = new qt(function (n, i) {
            e.g = r ? function (t) {
              try {
                var e = r.call(a, t);
                n(e);
              } catch (t) {
                i(t);
              }
            } : n, e.b = o ? function (t) {
              try {
                var e = o.call(a, t);
                void 0 === e && t instanceof ue ? i(t) : n(e);
              } catch (t) {
                i(t);
              }
            } : i;
          }), Qt(e.a.c = t, e), e.a;
        }

        function ee(t, e, n) {
          t.a == Ht && (t === n && (e = Gt, n = new TypeError("Promise cannot resolve to itself")), t.a = 1, ne(n, t.Lc, t.Mc, t) || (t.i = n, t.a = e, t.c = null, ie(t), e != Gt || n instanceof ue || function (t, e) {
            t.g = !0, Ut(function () {
              t.g && se.call(null, e);
            });
          }(t, n)));
        }

        function ne(t, e, n, i) {
          if (t instanceof qt) return Qt(t, Jt(e || d, n || null, i)), !0;
          if (S(t)) return t.then(e, n, i), !0;
          if (g(t)) try {
            var r = t.then;
            if (m(r)) return function (t, e, n, i, r) {
              function o(t) {
                a || (a = !0, i.call(r, t));
              }

              var a = !1;

              try {
                e.call(t, function (t) {
                  a || (a = !0, n.call(r, t));
                }, o);
              } catch (t) {
                o(t);
              }
            }(t, r, e, n, i), !0;
          } catch (t) {
            return n.call(i, t), !0;
          }
          return !1;
        }

        function ie(t) {
          t.h || (t.h = !0, Ut(t.Wb, t));
        }

        function re(t) {
          var e = null;
          return t.b && (e = t.b, t.b = e.next, e.next = null), t.b || (t.f = null), e;
        }

        function oe(t, e, n, i) {
          if (n == Gt && e.b && !e.c) for (; t && t.g; t = t.c) t.g = !1;
          if (e.a) e.a.c = null, ae(e, n, i);else try {
            e.c ? e.g.call(e.f) : ae(e, n, i);
          } catch (t) {
            se.call(null, t);
          }
          P(Xt, e);
        }

        function ae(t, e, n) {
          e == Bt ? t.g.call(t.f, n) : t.b && t.b.call(t.f, n);
        }

        qt.prototype.then = function (t, e, n) {
          return te(this, m(t) ? t : null, m(e) ? e : null, n);
        }, qt.prototype.$goog_Thenable = !0, (t = qt.prototype).ia = function (t, e) {
          return (t = Jt(t, t, e)).c = !0, Qt(this, t), this;
        }, t.s = function (t, e) {
          return te(this, null, t, e);
        }, t.cancel = function (t) {
          this.a == Ht && Ut(function () {
            !function t(e, n) {
              if (e.a == Ht) if (e.c) {
                var i = e.c;

                if (i.b) {
                  for (var r = 0, o = null, a = null, s = i.b; s && (s.c || (r++, s.a == e && (o = s), !(o && 1 < r))); s = s.next) o || (a = s);

                  o && (i.a == Ht && 1 == r ? t(i, n) : (a ? ((r = a).next == i.f && (i.f = r), r.next = r.next.next) : re(i), oe(i, o, Gt, n)));
                }

                e.c = null;
              } else ee(e, Gt, n);
            }(this, new ue(t));
          }, this);
        }, t.Lc = function (t) {
          this.a = Ht, ee(this, Bt, t);
        }, t.Mc = function (t) {
          this.a = Ht, ee(this, Gt, t);
        }, t.Wb = function () {
          for (var t; t = re(this);) oe(this, t, this.a, this.i);

          this.h = !1;
        };
        var se = Mt;

        function ue(t) {
          A.call(this, t);
        }

        function ce() {
          this.qa = this.qa, this.ja = this.ja;
        }

        E(ue, A);
        var he = 0;

        function fe(t) {
          if (!t.qa && (t.qa = !0, t.va(), 0 != he)) t[e] || (t[e] = ++b);
        }

        function le(t) {
          return le[" "](t), t;
        }

        ce.prototype.qa = !(ue.prototype.name = "cancel"), ce.prototype.va = function () {
          if (this.ja) for (; this.ja.length;) this.ja.shift()();
        }, le[" "] = d;
        var de,
            pe,
            ve = At("Opera"),
            me = At("Trident") || At("MSIE"),
            ge = At("Edge"),
            be = ge || me,
            ye = At("Gecko") && !(vt(It.toLowerCase(), "webkit") && !At("Edge")) && !(At("Trident") || At("MSIE")) && !At("Edge"),
            we = vt(It.toLowerCase(), "webkit") && !At("Edge");

        function Ie() {
          var t = h.document;
          return t ? t.documentMode : void 0;
        }

        t: {
          var Te = "",
              ke = (pe = It, ye ? /rv:([^\);]+)(\)|;)/.exec(pe) : ge ? /Edge\/([\d\.]+)/.exec(pe) : me ? /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(pe) : we ? /WebKit\/(\S+)/.exec(pe) : ve ? /(?:Version)[ \/]?(\S+)/.exec(pe) : void 0);

          if (ke && (Te = ke ? ke[1] : ""), me) {
            var Ee = Ie();

            if (null != Ee && Ee > parseFloat(Te)) {
              de = String(Ee);
              break t;
            }
          }

          de = Te;
        }

        var Se,
            Ae = {};

        function Ne(s) {
          return function (t, e) {
            var n = Ae;
            return Object.prototype.hasOwnProperty.call(n, t) ? n[t] : n[t] = e(t);
          }(s, function () {
            for (var t = 0, e = st(String(de)).split("."), n = st(String(s)).split("."), i = Math.max(e.length, n.length), r = 0; 0 == t && r < i; r++) {
              var o = e[r] || "",
                  a = n[r] || "";

              do {
                if (o = /(\d*)(\D*)(.*)/.exec(o) || ["", "", "", ""], a = /(\d*)(\D*)(.*)/.exec(a) || ["", "", "", ""], 0 == o[0].length && 0 == a[0].length) break;
                t = mt(0 == o[1].length ? 0 : parseInt(o[1], 10), 0 == a[1].length ? 0 : parseInt(a[1], 10)) || mt(0 == o[2].length, 0 == a[2].length) || mt(o[2], a[2]), o = o[3], a = a[3];
              } while (0 == t);
            }

            return 0 <= t;
          });
        }

        Se = h.document && me ? Ie() : void 0;

        var Oe = Object.freeze || function (t) {
          return t;
        },
            _e = !me || 9 <= Number(Se),
            Pe = me && !Ne("9"),
            Ce = function () {
          if (!h.addEventListener || !Object.defineProperty) return !1;
          var t = !1,
              e = Object.defineProperty({}, "passive", {
            get: function () {
              t = !0;
            }
          });

          try {
            h.addEventListener("test", d, e), h.removeEventListener("test", d, e);
          } catch (t) {}

          return t;
        }();

        function Re(t, e) {
          this.type = t, this.b = this.target = e, this.Kb = !0;
        }

        function De(t, e) {
          if (Re.call(this, t ? t.type : ""), this.relatedTarget = this.b = this.target = null, this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0, this.key = "", this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1, this.pointerId = 0, this.pointerType = "", this.a = null, t) {
            var n = this.type = t.type,
                i = t.changedTouches && t.changedTouches.length ? t.changedTouches[0] : null;

            if (this.target = t.target || t.srcElement, this.b = e, e = t.relatedTarget) {
              if (ye) {
                t: {
                  try {
                    le(e.nodeName);
                    var r = !0;
                    break t;
                  } catch (t) {}

                  r = !1;
                }

                r || (e = null);
              }
            } else "mouseover" == n ? e = t.fromElement : "mouseout" == n && (e = t.toElement);

            this.relatedTarget = e, i ? (this.clientX = void 0 !== i.clientX ? i.clientX : i.pageX, this.clientY = void 0 !== i.clientY ? i.clientY : i.pageY, this.screenX = i.screenX || 0, this.screenY = i.screenY || 0) : (this.clientX = void 0 !== t.clientX ? t.clientX : t.pageX, this.clientY = void 0 !== t.clientY ? t.clientY : t.pageY, this.screenX = t.screenX || 0, this.screenY = t.screenY || 0), this.button = t.button, this.key = t.key || "", this.ctrlKey = t.ctrlKey, this.altKey = t.altKey, this.shiftKey = t.shiftKey, this.metaKey = t.metaKey, this.pointerId = t.pointerId || 0, this.pointerType = f(t.pointerType) ? t.pointerType : Le[t.pointerType] || "", (this.a = t).defaultPrevented && this.preventDefault();
          }
        }

        Re.prototype.preventDefault = function () {
          this.Kb = !1;
        }, E(De, Re);
        var Le = Oe({
          2: "touch",
          3: "pen",
          4: "mouse"
        });
        De.prototype.preventDefault = function () {
          De.qb.preventDefault.call(this);
          var t = this.a;
          if (t.preventDefault) t.preventDefault();else if (t.returnValue = !1, Pe) try {
            (t.ctrlKey || 112 <= t.keyCode && t.keyCode <= 123) && (t.keyCode = -1);
          } catch (t) {}
        }, De.prototype.f = function () {
          return this.a;
        };
        var xe = "closure_listenable_" + (1e6 * Math.random() | 0),
            Me = 0;

        function je(t, e, n, i, r) {
          this.listener = t, this.proxy = null, this.src = e, this.type = n, this.capture = !!i, this.Na = r, this.key = ++Me, this.oa = this.Ia = !1;
        }

        function Ue(t) {
          t.oa = !0, t.listener = null, t.proxy = null, t.src = null, t.Na = null;
        }

        function Ve(t) {
          this.src = t, this.a = {}, this.b = 0;
        }

        function Ke(t, e) {
          var n = e.type;
          n in t.a && K(t.a[n], e) && (Ue(e), 0 == t.a[n].length && (delete t.a[n], t.b--));
        }

        function Fe(t, e, n, i) {
          for (var r = 0; r < t.length; ++r) {
            var o = t[r];
            if (!o.oa && o.listener == e && o.capture == !!n && o.Na == i) return r;
          }

          return -1;
        }

        Ve.prototype.add = function (t, e, n, i, r) {
          var o = t.toString();
          (t = this.a[o]) || (t = this.a[o] = [], this.b++);
          var a = Fe(t, e, i, r);
          return -1 < a ? (e = t[a], n || (e.Ia = !1)) : ((e = new je(e, this.src, o, !!i, r)).Ia = n, t.push(e)), e;
        };

        var qe = "closure_lm_" + (1e6 * Math.random() | 0),
            He = {};

        function Be(t, e, n, i, r) {
          if (i && i.once) We(t, e, n, i, r);else if (p(e)) for (var o = 0; o < e.length; o++) Be(t, e[o], n, i, r);else n = en(n), t && t[xe] ? rn(t, e, n, g(i) ? !!i.capture : !!i, r) : Ge(t, e, n, !1, i, r);
        }

        function Ge(t, e, n, i, r, o) {
          if (!e) throw Error("Invalid event type");
          var a = g(r) ? !!r.capture : !!r,
              s = Qe(t);
          if (s || (t[qe] = s = new Ve(t)), !(n = s.add(e, n, i, a, o)).proxy) if (i = function () {
            var e = Ze,
                n = _e ? function (t) {
              return e.call(n.src, n.listener, t);
            } : function (t) {
              if (!(t = e.call(n.src, n.listener, t))) return t;
            };
            return n;
          }(), (n.proxy = i).src = t, i.listener = n, t.addEventListener) Ce || (r = a), void 0 === r && (r = !1), t.addEventListener(e.toString(), i, r);else if (t.attachEvent) t.attachEvent(ze(e.toString()), i);else {
            if (!t.addListener || !t.removeListener) throw Error("addEventListener and attachEvent are unavailable.");
            t.addListener(i);
          }
        }

        function We(t, e, n, i, r) {
          if (p(e)) for (var o = 0; o < e.length; o++) We(t, e[o], n, i, r);else n = en(n), t && t[xe] ? on(t, e, n, g(i) ? !!i.capture : !!i, r) : Ge(t, e, n, !0, i, r);
        }

        function Xe(t, e, n, i, r) {
          if (p(e)) for (var o = 0; o < e.length; o++) Xe(t, e[o], n, i, r);else i = g(i) ? !!i.capture : !!i, n = en(n), t && t[xe] ? (t = t.m, (e = String(e).toString()) in t.a && -1 < (n = Fe(o = t.a[e], n, i, r)) && (Ue(o[n]), Array.prototype.splice.call(o, n, 1), 0 == o.length && (delete t.a[e], t.b--))) : (t = t && Qe(t)) && (e = t.a[e.toString()], t = -1, e && (t = Fe(e, n, i, r)), (n = -1 < t ? e[t] : null) && Je(n));
        }

        function Je(t) {
          if ("number" != typeof t && t && !t.oa) {
            var e = t.src;
            if (e && e[xe]) Ke(e.m, t);else {
              var n = t.type,
                  i = t.proxy;
              e.removeEventListener ? e.removeEventListener(n, i, t.capture) : e.detachEvent ? e.detachEvent(ze(n), i) : e.addListener && e.removeListener && e.removeListener(i), (n = Qe(e)) ? (Ke(n, t), 0 == n.b && (n.src = null, e[qe] = null)) : Ue(t);
            }
          }
        }

        function ze(t) {
          return t in He ? He[t] : He[t] = "on" + t;
        }

        function Ye(t, e, n, i) {
          var r = !0;
          if ((t = Qe(t)) && (e = t.a[e.toString()])) for (e = e.concat(), t = 0; t < e.length; t++) {
            var o = e[t];
            o && o.capture == n && !o.oa && (o = $e(o, i), r = r && !1 !== o);
          }
          return r;
        }

        function $e(t, e) {
          var n = t.listener,
              i = t.Na || t.src;
          return t.Ia && Je(t), n.call(i, e);
        }

        function Ze(t, e) {
          if (t.oa) return !0;
          if (_e) return $e(t, new De(e, this));
          if (!e) t: {
            e = ["window", "event"];

            for (var n = h, i = 0; i < e.length; i++) if (null == (n = n[e[i]])) {
              e = null;
              break t;
            }

            e = n;
          }

          if (e = new De(i = e, this), n = !0, !(i.keyCode < 0 || null != i.returnValue)) {
            t: {
              var r = !1;
              if (0 == i.keyCode) try {
                i.keyCode = -1;
                break t;
              } catch (t) {
                r = !0;
              }
              !r && null != i.returnValue || (i.returnValue = !0);
            }

            for (i = [], r = e.b; r; r = r.parentNode) i.push(r);

            for (t = t.type, r = i.length - 1; 0 <= r; r--) {
              e.b = i[r];
              var o = Ye(i[r], t, !0, e);
              n = n && o;
            }

            for (r = 0; r < i.length; r++) e.b = i[r], o = Ye(i[r], t, !1, e), n = n && o;
          }

          return n;
        }

        function Qe(t) {
          return (t = t[qe]) instanceof Ve ? t : null;
        }

        var tn = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);

        function en(e) {
          return m(e) ? e : (e[tn] || (e[tn] = function (t) {
            return e.handleEvent(t);
          }), e[tn]);
        }

        function nn() {
          ce.call(this), this.m = new Ve(this), (this.Pb = this).Wa = null;
        }

        function rn(t, e, n, i, r) {
          t.m.add(String(e), n, !1, i, r);
        }

        function on(t, e, n, i, r) {
          t.m.add(String(e), n, !0, i, r);
        }

        function an(t, e, n, i) {
          if (!(e = t.m.a[String(e)])) return !0;
          e = e.concat();

          for (var r = !0, o = 0; o < e.length; ++o) {
            var a = e[o];

            if (a && !a.oa && a.capture == n) {
              var s = a.listener,
                  u = a.Na || a.src;
              a.Ia && Ke(t.m, a), r = !1 !== s.call(u, i) && r;
            }
          }

          return r && 0 != i.Kb;
        }

        function sn(t, e, n) {
          if (m(t)) n && (t = I(t, n));else {
            if (!t || "function" != typeof t.handleEvent) throw Error("Invalid listener argument");
            t = I(t.handleEvent, t);
          }
          return 2147483647 < Number(e) ? -1 : h.setTimeout(t, e || 0);
        }

        function un(n) {
          var i = null;
          return new qt(function (t, e) {
            -1 == (i = sn(function () {
              t(void 0);
            }, n)) && e(Error("Failed to schedule timer."));
          }).s(function (t) {
            throw h.clearTimeout(i), t;
          });
        }

        function cn(t) {
          if (t.S && "function" == typeof t.S) return t.S();
          if (f(t)) return t.split("");

          if (v(t)) {
            for (var e = [], n = t.length, i = 0; i < n; i++) e.push(t[i]);

            return e;
          }

          for (i in e = [], n = 0, t) e[n++] = t[i];

          return e;
        }

        function hn(t) {
          if (t.U && "function" == typeof t.U) return t.U();

          if (!t.S || "function" != typeof t.S) {
            if (v(t) || f(t)) {
              var e = [];
              t = t.length;

              for (var n = 0; n < t; n++) e.push(n);

              return e;
            }

            for (var i in e = [], n = 0, t) e[n++] = i;

            return e;
          }
        }

        function fn(t, e) {
          this.b = {}, this.a = [], this.c = 0;
          var n = arguments.length;

          if (1 < n) {
            if (n % 2) throw Error("Uneven number of arguments");

            for (var i = 0; i < n; i += 2) this.set(arguments[i], arguments[i + 1]);
          } else if (t) if (t instanceof fn) for (n = t.U(), i = 0; i < n.length; i++) this.set(n[i], t.get(n[i]));else for (i in t) this.set(i, t[i]);
        }

        function ln(t) {
          if (t.c != t.a.length) {
            for (var e = 0, n = 0; e < t.a.length;) {
              var i = t.a[e];
              dn(t.b, i) && (t.a[n++] = i), e++;
            }

            t.a.length = n;
          }

          if (t.c != t.a.length) {
            var r = {};

            for (n = e = 0; e < t.a.length;) dn(r, i = t.a[e]) || (r[t.a[n++] = i] = 1), e++;

            t.a.length = n;
          }
        }

        function dn(t, e) {
          return Object.prototype.hasOwnProperty.call(t, e);
        }

        E(nn, ce), nn.prototype[xe] = !0, nn.prototype.addEventListener = function (t, e, n, i) {
          Be(this, t, e, n, i);
        }, nn.prototype.removeEventListener = function (t, e, n, i) {
          Xe(this, t, e, n, i);
        }, nn.prototype.dispatchEvent = function (t) {
          var e,
              n = this.Wa;
          if (n) for (e = []; n; n = n.Wa) e.push(n);
          n = this.Pb;
          var i = t.type || t;
          if (f(t)) t = new Re(t, n);else if (t instanceof Re) t.target = t.target || n;else {
            var r = t;
            J(t = new Re(i, n), r);
          }
          if (r = !0, e) for (var o = e.length - 1; 0 <= o; o--) {
            var a = t.b = e[o];
            r = an(a, i, !0, t) && r;
          }
          if (r = an(a = t.b = n, i, !0, t) && r, r = an(a, i, !1, t) && r, e) for (o = 0; o < e.length; o++) r = an(a = t.b = e[o], i, !1, t) && r;
          return r;
        }, nn.prototype.va = function () {
          if (nn.qb.va.call(this), this.m) {
            var t,
                e = this.m;

            for (t in e.a) {
              for (var n = e.a[t], i = 0; i < n.length; i++) Ue(n[i]);

              delete e.a[t], e.b--;
            }
          }

          this.Wa = null;
        }, (t = fn.prototype).S = function () {
          ln(this);

          for (var t = [], e = 0; e < this.a.length; e++) t.push(this.b[this.a[e]]);

          return t;
        }, t.U = function () {
          return ln(this), this.a.concat();
        }, t.clear = function () {
          this.b = {}, this.c = this.a.length = 0;
        }, t.get = function (t, e) {
          return dn(this.b, t) ? this.b[t] : e;
        }, t.set = function (t, e) {
          dn(this.b, t) || (this.c++, this.a.push(t)), this.b[t] = e;
        }, t.forEach = function (t, e) {
          for (var n = this.U(), i = 0; i < n.length; i++) {
            var r = n[i],
                o = this.get(r);
            t.call(e, o, r, this);
          }
        };
        var pn = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;

        function vn(t, e) {
          var n;
          this.b = this.i = this.f = "", this.m = null, this.g = this.c = "", this.h = !1, t instanceof vn ? (this.h = void 0 !== e ? e : t.h, mn(this, t.f), this.i = t.i, this.b = t.b, gn(this, t.m), this.c = t.c, bn(this, jn(t.a)), this.g = t.g) : t && (n = String(t).match(pn)) ? (this.h = !!e, mn(this, n[1] || "", !0), this.i = kn(n[2] || ""), this.b = kn(n[3] || "", !0), gn(this, n[4]), this.c = kn(n[5] || "", !0), bn(this, n[6] || "", !0), this.g = kn(n[7] || "")) : (this.h = !!e, this.a = new Cn(null, this.h));
        }

        function mn(t, e, n) {
          t.f = n ? kn(e, !0) : e, t.f && (t.f = t.f.replace(/:$/, ""));
        }

        function gn(t, e) {
          if (e) {
            if (e = Number(e), isNaN(e) || e < 0) throw Error("Bad port number " + e);
            t.m = e;
          } else t.m = null;
        }

        function bn(t, e, n) {
          e instanceof Cn ? (t.a = e, function (t, e) {
            e && !t.f && (Rn(t), t.c = null, t.a.forEach(function (t, e) {
              var n = e.toLowerCase();
              e != n && (Ln(this, e), Mn(this, n, t));
            }, t)), t.f = e;
          }(t.a, t.h)) : (n || (e = En(e, _n)), t.a = new Cn(e, t.h));
        }

        function yn(t, e, n) {
          t.a.set(e, n);
        }

        function wn(t, e) {
          return t.a.get(e);
        }

        function In(t) {
          return t instanceof vn ? new vn(t) : new vn(t, void 0);
        }

        function Tn(t, e) {
          var n = new vn(null, void 0);
          return mn(n, "https"), t && (n.b = t), e && (n.c = e), n;
        }

        function kn(t, e) {
          return t ? e ? decodeURI(t.replace(/%25/g, "%2525")) : decodeURIComponent(t) : "";
        }

        function En(t, e, n) {
          return f(t) ? (t = encodeURI(t).replace(e, Sn), n && (t = t.replace(/%25([0-9a-fA-F]{2})/g, "%$1")), t) : null;
        }

        function Sn(t) {
          return "%" + ((t = t.charCodeAt(0)) >> 4 & 15).toString(16) + (15 & t).toString(16);
        }

        vn.prototype.toString = function () {
          var t = [],
              e = this.f;
          e && t.push(En(e, An, !0), ":");
          var n = this.b;
          return !n && "file" != e || (t.push("//"), (e = this.i) && t.push(En(e, An, !0), "@"), t.push(encodeURIComponent(String(n)).replace(/%25([0-9a-fA-F]{2})/g, "%$1")), null != (n = this.m) && t.push(":", String(n))), (n = this.c) && (this.b && "/" != n.charAt(0) && t.push("/"), t.push(En(n, "/" == n.charAt(0) ? On : Nn, !0))), (n = this.a.toString()) && t.push("?", n), (n = this.g) && t.push("#", En(n, Pn)), t.join("");
        }, vn.prototype.resolve = function (t) {
          var e = new vn(this),
              n = !!t.f;
          n ? mn(e, t.f) : n = !!t.i, n ? e.i = t.i : n = !!t.b, n ? e.b = t.b : n = null != t.m;
          var i = t.c;
          if (n) gn(e, t.m);else if (n = !!t.c) {
            if ("/" != i.charAt(0)) if (this.b && !this.c) i = "/" + i;else {
              var r = e.c.lastIndexOf("/");
              -1 != r && (i = e.c.substr(0, r + 1) + i);
            }
            if (".." == (r = i) || "." == r) i = "";else if (vt(r, "./") || vt(r, "/.")) {
              i = 0 == r.lastIndexOf("/", 0), r = r.split("/");

              for (var o = [], a = 0; a < r.length;) {
                var s = r[a++];
                "." == s ? i && a == r.length && o.push("") : ".." == s ? ((1 < o.length || 1 == o.length && "" != o[0]) && o.pop(), i && a == r.length && o.push("")) : (o.push(s), i = !0);
              }

              i = o.join("/");
            } else i = r;
          }
          return n ? e.c = i : n = "" !== t.a.toString(), n ? bn(e, jn(t.a)) : n = !!t.g, n && (e.g = t.g), e;
        };
        var An = /[#\/\?@]/g,
            Nn = /[#\?:]/g,
            On = /[#\?]/g,
            _n = /[#\?@]/g,
            Pn = /#/g;

        function Cn(t, e) {
          this.b = this.a = null, this.c = t || null, this.f = !!e;
        }

        function Rn(n) {
          n.a || (n.a = new fn(), n.b = 0, n.c && function (t, e) {
            if (t) {
              t = t.split("&");

              for (var n = 0; n < t.length; n++) {
                var i = t[n].indexOf("="),
                    r = null;

                if (0 <= i) {
                  var o = t[n].substring(0, i);
                  r = t[n].substring(i + 1);
                } else o = t[n];

                e(o, r ? decodeURIComponent(r.replace(/\+/g, " ")) : "");
              }
            }
          }(n.c, function (t, e) {
            n.add(decodeURIComponent(t.replace(/\+/g, " ")), e);
          }));
        }

        function Dn(t) {
          var e = hn(t);
          if (void 0 === e) throw Error("Keys are undefined");
          var n = new Cn(null, void 0);
          t = cn(t);

          for (var i = 0; i < e.length; i++) {
            var r = e[i],
                o = t[i];
            p(o) ? Mn(n, r, o) : n.add(r, o);
          }

          return n;
        }

        function Ln(t, e) {
          Rn(t), e = Un(t, e), dn(t.a.b, e) && (t.c = null, t.b -= t.a.get(e).length, dn((t = t.a).b, e) && (delete t.b[e], t.c--, t.a.length > 2 * t.c && ln(t)));
        }

        function xn(t, e) {
          return Rn(t), e = Un(t, e), dn(t.a.b, e);
        }

        function Mn(t, e, n) {
          Ln(t, e), 0 < n.length && (t.c = null, t.a.set(Un(t, e), H(n)), t.b += n.length);
        }

        function jn(t) {
          var e = new Cn();
          return e.c = t.c, t.a && (e.a = new fn(t.a), e.b = t.b), e;
        }

        function Un(t, e) {
          return e = String(e), t.f && (e = e.toLowerCase()), e;
        }

        (t = Cn.prototype).add = function (t, e) {
          Rn(this), this.c = null, t = Un(this, t);
          var n = this.a.get(t);
          return n || this.a.set(t, n = []), n.push(e), this.b += 1, this;
        }, t.clear = function () {
          this.a = this.c = null, this.b = 0;
        }, t.forEach = function (n, i) {
          Rn(this), this.a.forEach(function (t, e) {
            M(t, function (t) {
              n.call(i, t, e, this);
            }, this);
          }, this);
        }, t.U = function () {
          Rn(this);

          for (var t = this.a.S(), e = this.a.U(), n = [], i = 0; i < e.length; i++) for (var r = t[i], o = 0; o < r.length; o++) n.push(e[i]);

          return n;
        }, t.S = function (t) {
          Rn(this);
          var e = [];
          if (f(t)) xn(this, t) && (e = q(e, this.a.get(Un(this, t))));else {
            t = this.a.S();

            for (var n = 0; n < t.length; n++) e = q(e, t[n]);
          }
          return e;
        }, t.set = function (t, e) {
          return Rn(this), this.c = null, xn(this, t = Un(this, t)) && (this.b -= this.a.get(t).length), this.a.set(t, [e]), this.b += 1, this;
        }, t.get = function (t, e) {
          return t && 0 < (t = this.S(t)).length ? String(t[0]) : e;
        }, t.toString = function () {
          if (this.c) return this.c;
          if (!this.a) return "";

          for (var t = [], e = this.a.U(), n = 0; n < e.length; n++) {
            var i = e[n],
                r = encodeURIComponent(String(i));
            i = this.S(i);

            for (var o = 0; o < i.length; o++) {
              var a = r;
              "" !== i[o] && (a += "=" + encodeURIComponent(String(i[o]))), t.push(a);
            }
          }

          return this.c = t.join("&");
        };
        var Vn = !me || 9 <= Number(Se);

        function Kn(t) {
          var e = document;
          return f(t) ? e.getElementById(t) : t;
        }

        function Fn(n, t) {
          B(t, function (t, e) {
            t && "object" == typeof t && t.na && (t = t.ma()), "style" == e ? n.style.cssText = t : "class" == e ? n.className = t : "for" == e ? n.htmlFor = t : qn.hasOwnProperty(e) ? n.setAttribute(qn[e], t) : 0 == e.lastIndexOf("aria-", 0) || 0 == e.lastIndexOf("data-", 0) ? n.setAttribute(e, t) : n[e] = t;
          });
        }

        var qn = {
          cellpadding: "cellPadding",
          cellspacing: "cellSpacing",
          colspan: "colSpan",
          frameborder: "frameBorder",
          height: "height",
          maxlength: "maxLength",
          nonce: "nonce",
          role: "role",
          rowspan: "rowSpan",
          type: "type",
          usemap: "useMap",
          valign: "vAlign",
          width: "width"
        };

        function Hn(t, e, n) {
          var i = arguments,
              r = document,
              o = String(i[0]),
              a = i[1];

          if (!Vn && a && (a.name || a.type)) {
            if (o = ["<", o], a.name && o.push(' name="', xt(a.name), '"'), a.type) {
              o.push(' type="', xt(a.type), '"');
              var s = {};
              J(s, a), delete s.type, a = s;
            }

            o.push(">"), o = o.join("");
          }

          return o = r.createElement(o), a && (f(a) ? o.className = a : p(a) ? o.className = a.join(" ") : Fn(o, a)), 2 < i.length && function (e, n, t) {
            function i(t) {
              t && n.appendChild(f(t) ? e.createTextNode(t) : t);
            }

            for (var r = 2; r < t.length; r++) {
              var o = t[r];
              !v(o) || g(o) && 0 < o.nodeType ? i(o) : M(Bn(o) ? H(o) : o, i);
            }
          }(r, o, i), o;
        }

        function Bn(t) {
          if (t && "number" == typeof t.length) {
            if (g(t)) return "function" == typeof t.item || "string" == typeof t.item;
            if (m(t)) return "function" == typeof t.item;
          }

          return !1;
        }

        function Gn(t) {
          var e = [];
          return function t(e, n, i) {
            if (null == n) i.push("null");else {
              if ("object" == typeof n) {
                if (p(n)) {
                  var r = n;
                  n = r.length, i.push("[");

                  for (var o = "", a = 0; a < n; a++) i.push(o), t(e, r[a], i), o = ",";

                  return void i.push("]");
                }

                if (!(n instanceof String || n instanceof Number || n instanceof Boolean)) {
                  for (r in i.push("{"), o = "", n) Object.prototype.hasOwnProperty.call(n, r) && "function" != typeof (a = n[r]) && (i.push(o), zn(r, i), i.push(":"), t(e, a, i), o = ",");

                  return void i.push("}");
                }

                n = n.valueOf();
              }

              switch (typeof n) {
                case "string":
                  zn(n, i);
                  break;

                case "number":
                  i.push(isFinite(n) && !isNaN(n) ? String(n) : "null");
                  break;

                case "boolean":
                  i.push(String(n));
                  break;

                case "function":
                  i.push("null");
                  break;

                default:
                  throw Error("Unknown type: " + typeof n);
              }
            }
          }(new Wn(), t, e), e.join("");
        }

        function Wn() {}

        var Xn = {
          '"': '\\"',
          "\\": "\\\\",
          "/": "\\/",
          "\b": "\\b",
          "\f": "\\f",
          "\n": "\\n",
          "\r": "\\r",
          "\t": "\\t",
          "\v": "\\u000b"
        },
            Jn = /\uffff/.test("￿") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;

        function zn(t, e) {
          e.push('"', t.replace(Jn, function (t) {
            var e = Xn[t];
            return e || (e = "\\u" + (65536 | t.charCodeAt(0)).toString(16).substr(1), Xn[t] = e), e;
          }), '"');
        }

        function Yn() {
          var t = vi();
          return me && !!Se && 11 == Se || /Edge\/\d+/.test(t);
        }

        function $n() {
          return h.window && h.window.location.href || self && self.location && self.location.href || "";
        }

        function Zn(t, e) {
          e = e || h.window;
          var n = "about:blank";
          t && (n = bt(wt(t)).toString()), e.location.href = n;
        }

        function Qn(t) {
          return !!((t = (t || vi()).toLowerCase()).match(/android/) || t.match(/webos/) || t.match(/iphone|ipad|ipod/) || t.match(/blackberry/) || t.match(/windows phone/) || t.match(/iemobile/));
        }

        function ti(t) {
          t = t || h.window;

          try {
            t.close();
          } catch (t) {}
        }

        function ei(t, e, n) {
          var i = Math.floor(1e9 * Math.random()).toString();
          e = e || 500, n = n || 600;
          var r = (window.screen.availHeight - n) / 2,
              o = (window.screen.availWidth - e) / 2;

          for (a in e = {
            width: e,
            height: n,
            top: 0 < r ? r : 0,
            left: 0 < o ? o : 0,
            location: !0,
            resizable: !0,
            statusbar: !0,
            toolbar: !1
          }, n = vi().toLowerCase(), i && (e.target = i, vt(n, "crios/") && (e.target = "_blank")), li(vi()) == hi && (t = t || "http://localhost", e.scrollbars = !0), n = t || "", (t = e) || (t = {}), i = window, e = n instanceof gt ? n : wt(void 0 !== n.href ? n.href : String(n)), n = t.target || n.target, r = [], t) switch (a) {
            case "width":
            case "height":
            case "top":
            case "left":
              r.push(a + "=" + t[a]);
              break;

            case "target":
            case "noopener":
            case "noreferrer":
              break;

            default:
              r.push(a + "=" + (t[a] ? 1 : 0));
          }

          var a = r.join(",");
          if ((At("iPhone") && !At("iPod") && !At("iPad") || At("iPad") || At("iPod")) && i.navigator && i.navigator.standalone && n && "_self" != n ? (L(a = i.document.createElement("A"), "HTMLAnchorElement"), e instanceof gt || e instanceof gt || (e = "object" == typeof e && e.na ? e.ma() : String(e), yt.test(e) || (e = "about:invalid#zClosurez"), e = kt(e)), a.href = bt(e), a.setAttribute("target", n), t.noreferrer && a.setAttribute("rel", "noreferrer"), (t = document.createEvent("MouseEvent")).initMouseEvent("click", !0, !0, i, 1), a.dispatchEvent(t), a = {}) : t.noreferrer ? (a = i.open("", n, a), t = bt(e).toString(), a && (be && vt(t, ";") && (t = "'" + t.replace(/'/g, "%27") + "'"), a.opener = null, t = Pt('<meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0; url=' + xt(t) + '">'), a.document.write(Ot(t)), a.document.close())) : (a = i.open(bt(e).toString(), n, a)) && t.noopener && (a.opener = null), a) try {
            a.focus();
          } catch (t) {}
          return a;
        }

        var ni = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
            ii = /^[^@]+@[^@]+$/;

        function ri() {
          var e = null;
          return new qt(function (t) {
            "complete" == h.document.readyState ? t() : (e = function () {
              t();
            }, We(window, "load", e));
          }).s(function (t) {
            throw Xe(window, "load", e), t;
          });
        }

        function oi(t) {
          return t = t || vi(), !("file:" !== wi() || !t.toLowerCase().match(/iphone|ipad|ipod|android/));
        }

        function ai() {
          var t = h.window;

          try {
            return !(!t || t == t.top);
          } catch (t) {
            return !1;
          }
        }

        function si() {
          return void 0 !== h.WorkerGlobalScope && "function" == typeof h.importScripts;
        }

        function ui() {
          return $h.INTERNAL.hasOwnProperty("reactNative") ? "ReactNative" : $h.INTERNAL.hasOwnProperty("node") ? "Node" : si() ? "Worker" : "Browser";
        }

        function ci() {
          var t = ui();
          return "ReactNative" === t || "Node" === t;
        }

        var hi = "Firefox",
            fi = "Chrome";

        function li(t) {
          var e = t.toLowerCase();
          return vt(e, "opera/") || vt(e, "opr/") || vt(e, "opios/") ? "Opera" : vt(e, "iemobile") ? "IEMobile" : vt(e, "msie") || vt(e, "trident/") ? "IE" : vt(e, "edge/") ? "Edge" : vt(e, "firefox/") ? hi : vt(e, "silk/") ? "Silk" : vt(e, "blackberry") ? "Blackberry" : vt(e, "webos") ? "Webos" : !vt(e, "safari/") || vt(e, "chrome/") || vt(e, "crios/") || vt(e, "android") ? !vt(e, "chrome/") && !vt(e, "crios/") || vt(e, "edge/") ? vt(e, "android") ? "Android" : (t = t.match(/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/)) && 2 == t.length ? t[1] : "Other" : fi : "Safari";
        }

        var di = {
          Sc: "FirebaseCore-web",
          Uc: "FirebaseUI-web"
        };

        function pi(t, e) {
          e = e || [];
          var n,
              i = [],
              r = {};

          for (n in di) r[di[n]] = !0;

          for (n = 0; n < e.length; n++) void 0 !== r[e[n]] && (delete r[e[n]], i.push(e[n]));

          return i.sort(), (e = i).length || (e = ["FirebaseCore-web"]), "Browser" === (i = ui()) ? i = li(r = vi()) : "Worker" === i && (i = li(r = vi()) + "-" + i), i + "/JsCore/" + t + "/" + e.join(",");
        }

        function vi() {
          return h.navigator && h.navigator.userAgent || "";
        }

        function mi(t, e) {
          t = t.split("."), e = e || h;

          for (var n = 0; n < t.length && "object" == typeof e && null != e; n++) e = e[t[n]];

          return n != t.length && (e = void 0), e;
        }

        function gi() {
          try {
            var t = h.localStorage,
                e = Si();
            if (t) return t.setItem(e, "1"), t.removeItem(e), !Yn() || !!h.indexedDB;
          } catch (t) {
            return si() && !!h.indexedDB;
          }

          return !1;
        }

        function bi() {
          return (yi() || "chrome-extension:" === wi() || oi()) && !ci() && gi() && !si();
        }

        function yi() {
          return "http:" === wi() || "https:" === wi();
        }

        function wi() {
          return h.location && h.location.protocol || null;
        }

        function Ii(t) {
          return !Qn(t = t || vi()) && li(t) != hi;
        }

        function Ti(t) {
          return void 0 === t ? null : Gn(t);
        }

        function ki(t) {
          var e,
              n = {};

          for (e in t) t.hasOwnProperty(e) && null !== t[e] && void 0 !== t[e] && (n[e] = t[e]);

          return n;
        }

        function Ei(t) {
          if (null !== t) return JSON.parse(t);
        }

        function Si(t) {
          return t || Math.floor(1e9 * Math.random()).toString();
        }

        function Ai(t) {
          return "Safari" != li(t = t || vi()) && !t.toLowerCase().match(/iphone|ipad|ipod/);
        }

        function Ni() {
          var t = h.___jsl;
          if (t && t.H) for (var e in t.H) if (t.H[e].r = t.H[e].r || [], t.H[e].L = t.H[e].L || [], t.H[e].r = t.H[e].L.concat(), t.CP) for (var n = 0; n < t.CP.length; n++) t.CP[n] = null;
        }

        function Oi(t, e) {
          if (e < t) throw Error("Short delay should be less than long delay!");
          this.a = t, this.c = e, t = vi(), e = ui(), this.b = Qn(t) || "ReactNative" === e;
        }

        function _i() {
          var t = h.document;
          return !t || void 0 === t.visibilityState || "visible" == t.visibilityState;
        }

        function Pi(t) {
          try {
            var e = new Date(parseInt(t, 10));
            if (!isNaN(e.getTime()) && !/[^0-9]/.test(t)) return e.toUTCString();
          } catch (t) {}

          return null;
        }

        function Ci() {
          return !(!mi("fireauth.oauthhelper", h) && !mi("fireauth.iframe", h));
        }

        Oi.prototype.get = function () {
          var t = h.navigator;
          return !t || "boolean" != typeof t.onLine || !yi() && "chrome-extension:" !== wi() && void 0 === t.connection || t.onLine ? this.b ? this.c : this.a : Math.min(5e3, this.a);
        };

        var Ri,
            Di = {};

        function Li(t) {
          Di[t] || (Di[t] = !0, "undefined" != typeof console && "function" == typeof console.warn && console.warn(t));
        }

        try {
          var xi = {};
          Object.defineProperty(xi, "abcd", {
            configurable: !0,
            enumerable: !0,
            value: 1
          }), Object.defineProperty(xi, "abcd", {
            configurable: !0,
            enumerable: !0,
            value: 2
          }), Ri = 2 == xi.abcd;
        } catch (t) {
          Ri = !1;
        }

        function Mi(t, e, n) {
          Ri ? Object.defineProperty(t, e, {
            configurable: !0,
            enumerable: !0,
            value: n
          }) : t[e] = n;
        }

        function ji(t, e) {
          if (e) for (var n in e) e.hasOwnProperty(n) && Mi(t, n, e[n]);
        }

        function Ui(t) {
          var e = {};
          return ji(e, t), e;
        }

        function Vi(t) {
          var e = t;
          if ("object" == typeof t && null != t) for (var n in e = "length" in t ? [] : {}, t) Mi(e, n, Vi(t[n]));
          return e;
        }

        function Ki(t) {
          var e = {},
              n = t[qi],
              i = t[Hi];
          if (!(t = t[Bi]) || t != Fi && !n) throw Error("Invalid provider user info!");
          e[Wi] = i || null, e[Gi] = n || null, Mi(this, Ji, t), Mi(this, Xi, Vi(e));
        }

        var Fi = "EMAIL_SIGNIN",
            qi = "email",
            Hi = "newEmail",
            Bi = "requestType",
            Gi = "email",
            Wi = "fromEmail",
            Xi = "data",
            Ji = "operation";

        function zi(t, e) {
          this.code = $i + t, this.message = e || Zi[t] || "";
        }

        function Yi(t) {
          var e = t && t.code;
          return e ? new zi(e.substring($i.length), t.message) : null;
        }

        E(zi, Error), zi.prototype.w = function () {
          return {
            code: this.code,
            message: this.message
          };
        }, zi.prototype.toJSON = function () {
          return this.w();
        };
        var $i = "auth/",
            Zi = {
          "admin-restricted-operation": "This operation is restricted to administrators only.",
          "argument-error": "",
          "app-not-authorized": "This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.",
          "app-not-installed": "The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.",
          "captcha-check-failed": "The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.",
          "code-expired": "The SMS code has expired. Please re-send the verification code to try again.",
          "cordova-not-ready": "Cordova framework is not ready.",
          "cors-unsupported": "This browser is not supported.",
          "credential-already-in-use": "This credential is already associated with a different user account.",
          "custom-token-mismatch": "The custom token corresponds to a different audience.",
          "requires-recent-login": "This operation is sensitive and requires recent authentication. Log in again before retrying this request.",
          "dynamic-link-not-activated": "Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.",
          "email-already-in-use": "The email address is already in use by another account.",
          "expired-action-code": "The action code has expired. ",
          "cancelled-popup-request": "This operation has been cancelled due to another conflicting popup being opened.",
          "internal-error": "An internal error has occurred.",
          "invalid-app-credential": "The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.",
          "invalid-app-id": "The mobile app identifier is not registed for the current project.",
          "invalid-user-token": "This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.",
          "invalid-auth-event": "An internal error has occurred.",
          "invalid-verification-code": "The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure use the verification code provided by the user.",
          "invalid-continue-uri": "The continue URL provided in the request is invalid.",
          "invalid-cordova-configuration": "The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.",
          "invalid-custom-token": "The custom token format is incorrect. Please check the documentation.",
          "invalid-dynamic-link-domain": "The provided dynamic link domain is not configured or authorized for the current project.",
          "invalid-email": "The email address is badly formatted.",
          "invalid-api-key": "Your API key is invalid, please check you have copied it correctly.",
          "invalid-cert-hash": "The SHA-1 certificate hash provided is invalid.",
          "invalid-credential": "The supplied auth credential is malformed or has expired.",
          "invalid-message-payload": "The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.",
          "invalid-oauth-provider": "EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.",
          "invalid-oauth-client-id": "The OAuth client ID provided is either invalid or does not match the specified API key.",
          "unauthorized-domain": "This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.",
          "invalid-action-code": "The action code is invalid. This can happen if the code is malformed, expired, or has already been used.",
          "wrong-password": "The password is invalid or the user does not have a password.",
          "invalid-persistence-type": "The specified persistence type is invalid. It can only be local, session or none.",
          "invalid-phone-number": "The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].",
          "invalid-provider-id": "The specified provider ID is invalid.",
          "invalid-recipient-email": "The email corresponding to this action failed to send as the provided recipient email address is invalid.",
          "invalid-sender": "The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.",
          "invalid-verification-id": "The verification ID used to create the phone auth credential is invalid.",
          "missing-android-pkg-name": "An Android Package Name must be provided if the Android App is required to be installed.",
          "auth-domain-config-required": "Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.",
          "missing-app-credential": "The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.",
          "missing-verification-code": "The phone auth credential was created with an empty SMS verification code.",
          "missing-continue-uri": "A continue URL must be provided in the request.",
          "missing-iframe-start": "An internal error has occurred.",
          "missing-ios-bundle-id": "An iOS Bundle ID must be provided if an App Store ID is provided.",
          "missing-or-invalid-nonce": "The OIDC ID token requires a valid unhashed nonce.",
          "missing-phone-number": "To send verification codes, provide a phone number for the recipient.",
          "missing-verification-id": "The phone auth credential was created with an empty verification ID.",
          "app-deleted": "This instance of FirebaseApp has been deleted.",
          "account-exists-with-different-credential": "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.",
          "network-request-failed": "A network error (such as timeout, interrupted connection or unreachable host) has occurred.",
          "no-auth-event": "An internal error has occurred.",
          "no-such-provider": "User was not linked to an account with the given provider.",
          "null-user": "A null user object was provided as the argument for an operation which requires a non-null user object.",
          "operation-not-allowed": "The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.",
          "operation-not-supported-in-this-environment": 'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',
          "popup-blocked": "Unable to establish a connection with the popup. It may have been blocked by the browser.",
          "popup-closed-by-user": "The popup has been closed by the user before finalizing the operation.",
          "provider-already-linked": "User can only be linked to one identity for the given provider.",
          "quota-exceeded": "The project's quota for this operation has been exceeded.",
          "redirect-cancelled-by-user": "The redirect operation has been cancelled by the user before finalizing.",
          "redirect-operation-pending": "A redirect sign-in operation is already pending.",
          "rejected-credential": "The request contains malformed or mismatching credentials.",
          timeout: "The operation has timed out.",
          "user-token-expired": "The user's credential is no longer valid. The user must sign in again.",
          "too-many-requests": "We have blocked all requests from this device due to unusual activity. Try again later.",
          "unauthorized-continue-uri": "The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.",
          "unsupported-persistence-type": "The current environment does not support the specified persistence type.",
          "user-cancelled": "User did not grant your application the permissions it requested.",
          "user-not-found": "There is no user record corresponding to this identifier. The user may have been deleted.",
          "user-disabled": "The user account has been disabled by an administrator.",
          "user-mismatch": "The supplied credentials do not correspond to the previously signed in user.",
          "user-signed-out": "",
          "weak-password": "The password must be 6 characters long or more.",
          "web-storage-unsupported": "This browser is not supported or 3rd party cookies and data may be disabled."
        };

        function Qi(t) {
          var e = t[rr];
          if (void 0 === e) throw new zi("missing-continue-uri");
          if ("string" != typeof e || "string" == typeof e && !e.length) throw new zi("invalid-continue-uri");
          this.h = e, this.b = this.a = null, this.g = !1;
          var n = t[tr];

          if (n && "object" == typeof n) {
            e = n[sr];
            var i = n[or];

            if (n = n[ar], "string" == typeof e && e.length) {
              if (this.a = e, void 0 !== i && "boolean" != typeof i) throw new zi("argument-error", or + " property must be a boolean when specified.");
              if (this.g = !!i, void 0 !== n && ("string" != typeof n || "string" == typeof n && !n.length)) throw new zi("argument-error", ar + " property must be a non empty string when specified.");
              this.b = n || null;
            } else {
              if (void 0 !== e) throw new zi("argument-error", sr + " property must be a non empty string when specified.");
              if (void 0 !== i || void 0 !== n) throw new zi("missing-android-pkg-name");
            }
          } else if (void 0 !== n) throw new zi("argument-error", tr + " property must be a non null object when specified.");

          if (this.f = null, (e = t[ir]) && "object" == typeof e) {
            if ("string" == typeof (e = e[ur]) && e.length) this.f = e;else if (void 0 !== e) throw new zi("argument-error", ur + " property must be a non empty string when specified.");
          } else if (void 0 !== e) throw new zi("argument-error", ir + " property must be a non null object when specified.");

          if (void 0 !== (e = t[nr]) && "boolean" != typeof e) throw new zi("argument-error", nr + " property must be a boolean when specified.");
          if (this.c = !!e, void 0 !== (t = t[er]) && ("string" != typeof t || "string" == typeof t && !t.length)) throw new zi("argument-error", er + " property must be a non empty string when specified.");
          this.i = t || null;
        }

        var tr = "android",
            er = "dynamicLinkDomain",
            nr = "handleCodeInApp",
            ir = "iOS",
            rr = "url",
            or = "installApp",
            ar = "minimumVersion",
            sr = "packageName",
            ur = "bundleId";

        function cr(t) {
          var e = {};

          for (var n in e.continueUrl = t.h, e.canHandleCodeInApp = t.c, (e.androidPackageName = t.a) && (e.androidMinimumVersion = t.b, e.androidInstallApp = t.g), e.iOSBundleId = t.f, e.dynamicLinkDomain = t.i, e) null === e[n] && delete e[n];

          return e;
        }

        var hr = null,
            fr = null;

        function lr(t) {
          var e = "";
          return function (i, t) {
            function e(t) {
              for (; r < i.length;) {
                var e = i.charAt(r++),
                    n = fr[e];
                if (null != n) return n;
                if (!/^[\s\xa0]*$/.test(e)) throw Error("Unknown base64 encoding at char: " + e);
              }

              return t;
            }

            !function () {
              if (!hr) {
                hr = {}, fr = {};

                for (var t = 0; t < 65; t++) hr[t] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(t), 62 <= (fr[hr[t]] = t) && (fr["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(t)] = t);
              }
            }();

            for (var r = 0;;) {
              var n = e(-1),
                  o = e(0),
                  a = e(64),
                  s = e(64);
              if (64 === s && -1 === n) break;
              t(n << 2 | o >> 4), 64 != a && (t(o << 4 & 240 | a >> 2), 64 != s && t(a << 6 & 192 | s));
            }
          }(t, function (t) {
            e += String.fromCharCode(t);
          }), e;
        }

        function dr(t) {
          this.c = t.sub, this.a = t.provider_id || t.firebase && t.firebase.sign_in_provider || null, this.b = !!t.is_anonymous || "anonymous" == this.a;
        }

        function pr(t) {
          return (t = vr(t)) && t.sub && t.iss && t.aud && t.exp ? new dr(t) : null;
        }

        function vr(t) {
          if (!t) return null;
          if (3 != (t = t.split(".")).length) return null;

          for (var e = (4 - (t = t[1]).length % 4) % 4, n = 0; n < e; n++) t += ".";

          try {
            return JSON.parse(lr(t));
          } catch (t) {}

          return null;
        }

        dr.prototype.f = function () {
          return this.b;
        };

        var mr,
            gr = {
          Yc: {
            bb: "https://www.googleapis.com/identitytoolkit/v3/relyingparty/",
            jb: "https://securetoken.googleapis.com/v1/token",
            id: "p"
          },
          $c: {
            bb: "https://staging-www.sandbox.googleapis.com/identitytoolkit/v3/relyingparty/",
            jb: "https://staging-securetoken.sandbox.googleapis.com/v1/token",
            id: "s"
          },
          ad: {
            bb: "https://www-googleapis-test.sandbox.google.com/identitytoolkit/v3/relyingparty/",
            jb: "https://test-securetoken.sandbox.googleapis.com/v1/token",
            id: "t"
          }
        };

        function br(t) {
          for (var e in gr) if (gr[e].id === t) return {
            firebaseEndpoint: (t = gr[e]).bb,
            secureTokenEndpoint: t.jb
          };

          return null;
        }

        mr = br("__EID__") ? "__EID__" : void 0;
        var yr = "oauth_consumer_key oauth_nonce oauth_signature oauth_signature_method oauth_timestamp oauth_token oauth_version".split(" "),
            wr = ["client_id", "response_type", "scope", "redirect_uri", "state"],
            Ir = {
          Tc: {
            Oa: "locale",
            Ba: 500,
            Aa: 600,
            Pa: "facebook.com",
            ib: wr
          },
          Vc: {
            Oa: null,
            Ba: 500,
            Aa: 620,
            Pa: "github.com",
            ib: wr
          },
          Wc: {
            Oa: "hl",
            Ba: 515,
            Aa: 680,
            Pa: "google.com",
            ib: wr
          },
          bd: {
            Oa: "lang",
            Ba: 485,
            Aa: 705,
            Pa: "twitter.com",
            ib: yr
          }
        };

        function Tr(t) {
          for (var e in Ir) if (Ir[e].Pa == t) return Ir[e];

          return null;
        }

        function kr(t) {
          var e = {};
          e["facebook.com"] = Or, e["google.com"] = Pr, e["github.com"] = _r, e["twitter.com"] = Cr;
          var n = t && t[Sr];

          try {
            if (n) return e[n] ? new e[n](t) : new Nr(t);
            if (void 0 !== t[Er]) return new Ar(t);
          } catch (t) {}

          return null;
        }

        var Er = "idToken",
            Sr = "providerId";

        function Ar(t) {
          var e = t[Sr];

          if (!e && t[Er]) {
            var n = pr(t[Er]);
            n && n.a && (e = n.a);
          }

          if (!e) throw Error("Invalid additional user info!");
          "anonymous" != e && "custom" != e || (e = null), n = !1, void 0 !== t.isNewUser ? n = !!t.isNewUser : "identitytoolkit#SignupNewUserResponse" === t.kind && (n = !0), Mi(this, "providerId", e), Mi(this, "isNewUser", n);
        }

        function Nr(t) {
          Ar.call(this, t), Mi(this, "profile", Vi((t = Ei(t.rawUserInfo || "{}")) || {}));
        }

        function Or(t) {
          if (Nr.call(this, t), "facebook.com" != this.providerId) throw Error("Invalid provider ID!");
        }

        function _r(t) {
          if (Nr.call(this, t), "github.com" != this.providerId) throw Error("Invalid provider ID!");
          Mi(this, "username", this.profile && this.profile.login || null);
        }

        function Pr(t) {
          if (Nr.call(this, t), "google.com" != this.providerId) throw Error("Invalid provider ID!");
        }

        function Cr(t) {
          if (Nr.call(this, t), "twitter.com" != this.providerId) throw Error("Invalid provider ID!");
          Mi(this, "username", t.screenName || null);
        }

        function Rr(t) {
          this.a = In(t);
        }

        function Dr(t) {
          var e = In(t),
              n = wn(e, "link"),
              i = wn(In(n), "link");
          return wn(In(e = wn(e, "deep_link_id")), "link") || e || i || n || t;
        }

        function Lr() {}

        function xr(t, n) {
          return t.then(function (t) {
            if (t[Ea]) {
              var e = pr(t[Ea]);
              if (!e || n != e.c) throw new zi("user-mismatch");
              return t;
            }

            throw new zi("user-mismatch");
          }).s(function (t) {
            throw t && t.code && t.code == $i + "user-not-found" ? new zi("user-mismatch") : t;
          });
        }

        function Mr(t, e) {
          if (!e) throw new zi("internal-error", "failed to construct a credential");
          this.a = e, Mi(this, "providerId", t), Mi(this, "signInMethod", t);
        }

        function jr(t) {
          return {
            pendingToken: t.a,
            requestUri: "http://localhost"
          };
        }

        function Ur(t) {
          if (t && t.providerId && t.signInMethod && 0 == t.providerId.indexOf("saml.") && t.pendingToken) try {
            return new Mr(t.providerId, t.pendingToken);
          } catch (t) {}
          return null;
        }

        function Vr(t, e, n) {
          if (this.a = null, e.idToken || e.accessToken) e.idToken && Mi(this, "idToken", e.idToken), e.accessToken && Mi(this, "accessToken", e.accessToken), e.nonce && !e.pendingToken && Mi(this, "nonce", e.nonce), e.pendingToken && (this.a = e.pendingToken);else {
            if (!e.oauthToken || !e.oauthTokenSecret) throw new zi("internal-error", "failed to construct a credential");
            Mi(this, "accessToken", e.oauthToken), Mi(this, "secret", e.oauthTokenSecret);
          }
          Mi(this, "providerId", t), Mi(this, "signInMethod", n);
        }

        function Kr(t) {
          var e = {};
          return t.idToken && (e.id_token = t.idToken), t.accessToken && (e.access_token = t.accessToken), t.secret && (e.oauth_token_secret = t.secret), e.providerId = t.providerId, t.nonce && !t.a && (e.nonce = t.nonce), e = {
            postBody: Dn(e).toString(),
            requestUri: "http://localhost"
          }, t.a && (delete e.postBody, e.pendingToken = t.a), e;
        }

        function Fr(t) {
          if (t && t.providerId && t.signInMethod) {
            var e = {
              idToken: t.oauthIdToken,
              accessToken: t.oauthTokenSecret ? null : t.oauthAccessToken,
              oauthTokenSecret: t.oauthTokenSecret,
              oauthToken: t.oauthTokenSecret && t.oauthAccessToken,
              nonce: t.nonce,
              pendingToken: t.pendingToken
            };

            try {
              return new Vr(t.providerId, e, t.signInMethod);
            } catch (t) {}
          }

          return null;
        }

        function qr(t, e) {
          this.Cc = e || [], ji(this, {
            providerId: t,
            isOAuthProvider: !0
          }), this.zb = {}, this.eb = (Tr(t) || {}).Oa || null, this.ab = null;
        }

        function Hr(t) {
          if ("string" != typeof t || 0 != t.indexOf("saml.")) throw new zi("argument-error", 'SAML provider IDs must be prefixed with "saml."');
          qr.call(this, t, []);
        }

        function Br(t) {
          qr.call(this, t, wr), this.a = [];
        }

        function Gr() {
          Br.call(this, "facebook.com");
        }

        function Wr(t) {
          if (!t) throw new zi("argument-error", "credential failed: expected 1 argument (the OAuth access token).");
          var e = t;
          return g(t) && (e = t.accessToken), new Gr().credential({
            accessToken: e
          });
        }

        function Xr() {
          Br.call(this, "github.com");
        }

        function Jr(t) {
          if (!t) throw new zi("argument-error", "credential failed: expected 1 argument (the OAuth access token).");
          var e = t;
          return g(t) && (e = t.accessToken), new Xr().credential({
            accessToken: e
          });
        }

        function zr() {
          Br.call(this, "google.com"), this.ua("profile");
        }

        function Yr(t, e) {
          var n = t;
          return g(t) && (n = t.idToken, e = t.accessToken), new zr().credential({
            idToken: n,
            accessToken: e
          });
        }

        function $r() {
          qr.call(this, "twitter.com", yr);
        }

        function Zr(t, e) {
          var n = t;
          if (g(n) || (n = {
            oauthToken: t,
            oauthTokenSecret: e
          }), !n.oauthToken || !n.oauthTokenSecret) throw new zi("argument-error", "credential failed: expected 2 arguments (the OAuth access token and secret).");
          return new Vr("twitter.com", n, "twitter.com");
        }

        function Qr(t, e, n) {
          this.a = t, this.c = e, Mi(this, "providerId", "password"), Mi(this, "signInMethod", n === eo.EMAIL_LINK_SIGN_IN_METHOD ? eo.EMAIL_LINK_SIGN_IN_METHOD : eo.EMAIL_PASSWORD_SIGN_IN_METHOD);
        }

        function to(t) {
          return t && t.email && t.password ? new Qr(t.email, t.password, t.signInMethod) : null;
        }

        function eo() {
          ji(this, {
            providerId: "password",
            isOAuthProvider: !1
          });
        }

        function no(t, e) {
          if (!(e = io(e))) throw new zi("argument-error", "Invalid email link!");
          return new Qr(t, e, eo.EMAIL_LINK_SIGN_IN_METHOD);
        }

        function io(t) {
          var e = wn((t = new Rr(t = Dr(t))).a, "oobCode") || null;
          return "signIn" === (wn(t.a, "mode") || null) && e ? e : null;
        }

        function ro(t) {
          if (!(t.Ua && t.Ta || t.Fa && t.$)) throw new zi("internal-error");
          this.a = t, Mi(this, "providerId", "phone"), Mi(this, "signInMethod", "phone");
        }

        function oo(e) {
          if (e && "phone" === e.providerId && (e.verificationId && e.verificationCode || e.temporaryProof && e.phoneNumber)) {
            var n = {};
            return M(["verificationId", "verificationCode", "temporaryProof", "phoneNumber"], function (t) {
              e[t] && (n[t] = e[t]);
            }), new ro(n);
          }

          return null;
        }

        function ao(t) {
          return t.a.Fa && t.a.$ ? {
            temporaryProof: t.a.Fa,
            phoneNumber: t.a.$
          } : {
            sessionInfo: t.a.Ua,
            code: t.a.Ta
          };
        }

        function so(t) {
          try {
            this.a = t || $h.auth();
          } catch (t) {
            throw new zi("argument-error", "Either an instance of firebase.auth.Auth must be passed as an argument to the firebase.auth.PhoneAuthProvider constructor, or the default firebase App instance must be initialized via firebase.initializeApp().");
          }

          ji(this, {
            providerId: "phone",
            isOAuthProvider: !1
          });
        }

        function uo(t, e) {
          if (!t) throw new zi("missing-verification-id");
          if (!e) throw new zi("missing-verification-code");
          return new ro({
            Ua: t,
            Ta: e
          });
        }

        function co(t) {
          if (t.temporaryProof && t.phoneNumber) return new ro({
            Fa: t.temporaryProof,
            $: t.phoneNumber
          });
          var e = t && t.providerId;
          if (!e || "password" === e) return null;
          var n = t && t.oauthAccessToken,
              i = t && t.oauthTokenSecret,
              r = t && t.nonce,
              o = t && t.oauthIdToken,
              a = t && t.pendingToken;

          try {
            switch (e) {
              case "google.com":
                return Yr(o, n);

              case "facebook.com":
                return Wr(n);

              case "github.com":
                return Jr(n);

              case "twitter.com":
                return Zr(n, i);

              default:
                return n || i || o || a ? a ? 0 == e.indexOf("saml.") ? new Mr(e, a) : new Vr(e, {
                  pendingToken: a,
                  idToken: t.oauthIdToken,
                  accessToken: t.oauthAccessToken
                }, e) : new Br(e).credential({
                  idToken: o,
                  accessToken: n,
                  rawNonce: r
                }) : null;
            }
          } catch (t) {
            return null;
          }
        }

        function ho(t) {
          if (!t.isOAuthProvider) throw new zi("invalid-oauth-provider");
        }

        function fo(t, e, n, i, r, o) {
          if (this.c = t, this.b = e || null, this.g = n || null, this.f = i || null, this.h = o || null, this.a = r || null, !this.g && !this.a) throw new zi("invalid-auth-event");
          if (this.g && this.a) throw new zi("invalid-auth-event");
          if (this.g && !this.f) throw new zi("invalid-auth-event");
        }

        function lo(t) {
          return (t = t || {}).type ? new fo(t.type, t.eventId, t.urlResponse, t.sessionId, t.error && Yi(t.error), t.postBody) : null;
        }

        function po() {
          this.b = null, this.a = [];
        }

        E(Nr, Ar), E(Or, Nr), E(_r, Nr), E(Pr, Nr), E(Cr, Nr), Mr.prototype.la = function (t) {
          return qa(t, jr(this));
        }, Mr.prototype.b = function (t, e) {
          var n = jr(this);
          return n.idToken = e, Ha(t, n);
        }, Mr.prototype.f = function (t, e) {
          return xr(Ba(t, jr(this)), e);
        }, Mr.prototype.w = function () {
          return {
            providerId: this.providerId,
            signInMethod: this.signInMethod,
            pendingToken: this.a
          };
        }, Vr.prototype.la = function (t) {
          return qa(t, Kr(this));
        }, Vr.prototype.b = function (t, e) {
          var n = Kr(this);
          return n.idToken = e, Ha(t, n);
        }, Vr.prototype.f = function (t, e) {
          return xr(Ba(t, Kr(this)), e);
        }, Vr.prototype.w = function () {
          var t = {
            providerId: this.providerId,
            signInMethod: this.signInMethod
          };
          return this.idToken && (t.oauthIdToken = this.idToken), this.accessToken && (t.oauthAccessToken = this.accessToken), this.secret && (t.oauthTokenSecret = this.secret), this.nonce && (t.nonce = this.nonce), this.a && (t.pendingToken = this.a), t;
        }, qr.prototype.Da = function (t) {
          return this.zb = W(t), this;
        }, E(Hr, qr), E(Br, qr), Br.prototype.ua = function (t) {
          return V(this.a, t) || this.a.push(t), this;
        }, Br.prototype.Fb = function () {
          return H(this.a);
        }, Br.prototype.credential = function (t, e) {
          var n;
          if (!(n = g(t) ? {
            idToken: t.idToken || null,
            accessToken: t.accessToken || null,
            nonce: t.rawNonce || null
          } : {
            idToken: t || null,
            accessToken: e || null
          }).idToken && !n.accessToken) throw new zi("argument-error", "credential failed: must provide the ID token and/or the access token.");
          return new Vr(this.providerId, n, this.providerId);
        }, E(Gr, Br), Mi(Gr, "PROVIDER_ID", "facebook.com"), Mi(Gr, "FACEBOOK_SIGN_IN_METHOD", "facebook.com"), E(Xr, Br), Mi(Xr, "PROVIDER_ID", "github.com"), Mi(Xr, "GITHUB_SIGN_IN_METHOD", "github.com"), E(zr, Br), Mi(zr, "PROVIDER_ID", "google.com"), Mi(zr, "GOOGLE_SIGN_IN_METHOD", "google.com"), E($r, qr), Mi($r, "PROVIDER_ID", "twitter.com"), Mi($r, "TWITTER_SIGN_IN_METHOD", "twitter.com"), Qr.prototype.la = function (t) {
          return this.signInMethod == eo.EMAIL_LINK_SIGN_IN_METHOD ? ys(t, Za, {
            email: this.a,
            oobCode: this.c
          }) : ys(t, vs, {
            email: this.a,
            password: this.c
          });
        }, Qr.prototype.b = function (t, e) {
          return this.signInMethod == eo.EMAIL_LINK_SIGN_IN_METHOD ? ys(t, Qa, {
            idToken: e,
            email: this.a,
            oobCode: this.c
          }) : ys(t, cs, {
            idToken: e,
            email: this.a,
            password: this.c
          });
        }, Qr.prototype.f = function (t, e) {
          return xr(this.la(t), e);
        }, Qr.prototype.w = function () {
          return {
            email: this.a,
            password: this.c,
            signInMethod: this.signInMethod
          };
        }, ji(eo, {
          PROVIDER_ID: "password"
        }), ji(eo, {
          EMAIL_LINK_SIGN_IN_METHOD: "emailLink"
        }), ji(eo, {
          EMAIL_PASSWORD_SIGN_IN_METHOD: "password"
        }), ro.prototype.la = function (t) {
          return t.Va(ao(this));
        }, ro.prototype.b = function (t, e) {
          var n = ao(this);
          return n.idToken = e, ys(t, gs, n);
        }, ro.prototype.f = function (t, e) {
          var n = ao(this);
          return n.operation = "REAUTH", xr(t = ys(t, bs, n), e);
        }, ro.prototype.w = function () {
          var t = {
            providerId: "phone"
          };
          return this.a.Ua && (t.verificationId = this.a.Ua), this.a.Ta && (t.verificationCode = this.a.Ta), this.a.Fa && (t.temporaryProof = this.a.Fa), this.a.$ && (t.phoneNumber = this.a.$), t;
        }, so.prototype.Va = function (e, n) {
          var i = this.a.c;
          return zt(n.verify()).then(function (t) {
            if (!f(t)) throw new zi("argument-error", "An implementation of firebase.auth.ApplicationVerifier.prototype.verify() must return a firebase.Promise that resolves with a string.");

            switch (n.type) {
              case "recaptcha":
                return function (t, e) {
                  return ys(t, ss, e);
                }(i, {
                  phoneNumber: e,
                  recaptchaToken: t
                }).then(function (t) {
                  return "function" == typeof n.reset && n.reset(), t;
                }, function (t) {
                  throw "function" == typeof n.reset && n.reset(), t;
                });

              default:
                throw new zi("argument-error", 'Only firebase.auth.ApplicationVerifiers with type="recaptcha" are currently supported.');
            }
          });
        }, ji(so, {
          PROVIDER_ID: "phone"
        }), ji(so, {
          PHONE_SIGN_IN_METHOD: "phone"
        }), fo.prototype.getUid = function () {
          var t = [];
          return t.push(this.c), this.b && t.push(this.b), this.f && t.push(this.f), this.i && t.push(this.i), t.join("-");
        }, fo.prototype.w = function () {
          return {
            type: this.c,
            eventId: this.b,
            urlResponse: this.g,
            sessionId: this.f,
            postBody: this.h,
            error: this.a && this.a.w()
          };
        };
        var vo,
            mo = null;

        function go(t) {
          var e = "unauthorized-domain",
              n = void 0,
              i = In(t);
          t = i.b, "chrome-extension" == (i = i.f) ? n = Lt("This chrome extension ID (chrome-extension://%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.", t) : "http" == i || "https" == i ? n = Lt("This domain (%s) is not authorized to run this operation. Add it to the OAuth redirect domains list in the Firebase console -> Auth section -> Sign in method tab.", t) : e = "operation-not-supported-in-this-environment", zi.call(this, e, n);
        }

        function bo(t, e, n) {
          zi.call(this, t, n), (t = e || {}).Ab && Mi(this, "email", t.Ab), t.$ && Mi(this, "phoneNumber", t.$), t.credential && Mi(this, "credential", t.credential);
        }

        function yo(t) {
          if (t.code) {
            var e = t.code || "";
            0 == e.indexOf($i) && (e = e.substring($i.length));
            var n = {
              credential: co(t)
            };
            if (t.email) n.Ab = t.email;else if (t.phoneNumber) n.$ = t.phoneNumber;else if (!n.credential) return new zi(e, t.message || void 0);
            return new bo(e, n, t.message);
          }

          return null;
        }

        function wo() {}

        function Io(t) {
          return t.c || (t.c = t.b());
        }

        function To() {}

        function ko(t) {
          if (t.f || "undefined" != typeof XMLHttpRequest || "undefined" == typeof ActiveXObject) return t.f;

          for (var e = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"], n = 0; n < e.length; n++) {
            var i = e[n];

            try {
              return new ActiveXObject(i), t.f = i;
            } catch (t) {}
          }

          throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");
        }

        function Eo() {}

        function So() {
          this.a = new XDomainRequest(), this.readyState = 0, this.onreadystatechange = null, this.responseType = this.responseText = this.response = "", this.status = -1, this.statusText = "", this.a.onload = I(this.cc, this), this.a.onerror = I(this.Gb, this), this.a.onprogress = I(this.dc, this), this.a.ontimeout = I(this.hc, this);
        }

        function Ao(t, e) {
          t.readyState = e, t.onreadystatechange && t.onreadystatechange();
        }

        function No(t, e, n) {
          this.reset(t, e, n, void 0, void 0);
        }

        function Oo(t) {
          this.f = t, this.b = this.c = this.a = null;
        }

        function _o(t, e) {
          this.name = t, this.value = e;
        }

        po.prototype.subscribe = function (t) {
          var n = this;
          this.a.push(t), this.b || (this.b = function (t) {
            for (var e = 0; e < n.a.length; e++) n.a[e](t);
          }, "function" == typeof (t = mi("universalLinks.subscribe", h)) && t(null, this.b));
        }, po.prototype.unsubscribe = function (e) {
          F(this.a, function (t) {
            return t == e;
          });
        }, E(go, zi), E(bo, zi), bo.prototype.w = function () {
          var t = {
            code: this.code,
            message: this.message
          };
          this.email && (t.email = this.email), this.phoneNumber && (t.phoneNumber = this.phoneNumber);
          var e = this.credential && this.credential.w();
          return e && J(t, e), t;
        }, bo.prototype.toJSON = function () {
          return this.w();
        }, wo.prototype.c = null, E(To, wo), To.prototype.a = function () {
          var t = ko(this);
          return t ? new ActiveXObject(t) : new XMLHttpRequest();
        }, To.prototype.b = function () {
          var t = {};
          return ko(this) && (t[0] = !0, t[1] = !0), t;
        }, vo = new To(), E(Eo, wo), Eo.prototype.a = function () {
          var t = new XMLHttpRequest();
          if ("withCredentials" in t) return t;
          if ("undefined" != typeof XDomainRequest) return new So();
          throw Error("Unsupported browser");
        }, Eo.prototype.b = function () {
          return {};
        }, (t = So.prototype).open = function (t, e, n) {
          if (null != n && !n) throw Error("Only async requests are supported.");
          this.a.open(t, e);
        }, t.send = function (t) {
          if (t) {
            if ("string" != typeof t) throw Error("Only string data is supported");
            this.a.send(t);
          } else this.a.send();
        }, t.abort = function () {
          this.a.abort();
        }, t.setRequestHeader = function () {}, t.getResponseHeader = function (t) {
          return "content-type" == t.toLowerCase() ? this.a.contentType : "";
        }, t.cc = function () {
          this.status = 200, this.response = this.responseText = this.a.responseText, Ao(this, 4);
        }, t.Gb = function () {
          this.status = 500, this.response = this.responseText = "", Ao(this, 4);
        }, t.hc = function () {
          this.Gb();
        }, t.dc = function () {
          this.status = 200, Ao(this, 1);
        }, t.getAllResponseHeaders = function () {
          return "content-type: " + this.a.contentType;
        }, No.prototype.a = null, No.prototype.reset = function (t, e, n, i, r) {
          delete this.a;
        }, _o.prototype.toString = function () {
          return this.name;
        };
        var Po = new _o("SEVERE", 1e3),
            Co = new _o("WARNING", 900),
            Ro = new _o("CONFIG", 700),
            Do = new _o("FINE", 500);

        Oo.prototype.log = function (t, e, n) {
          if (t.value >= function t(e) {
            return e.c ? e.c : e.a ? t(e.a) : (O("Root logger has no level set."), null);
          }(this).value) for (m(e) && (e = e()), t = new No(t, String(e), this.f), n && (t.a = n), n = this; n;) n = n.a;
        };

        var Lo,
            xo = {},
            Mo = null;

        function jo(t) {
          var e;

          if (Mo || (Mo = new Oo(""), (xo[""] = Mo).c = Ro), !(e = xo[t])) {
            e = new Oo(t);
            var n = t.lastIndexOf("."),
                i = t.substr(n + 1);
            (n = jo(t.substr(0, n))).b || (n.b = {}), (n.b[i] = e).a = n, xo[t] = e;
          }

          return e;
        }

        function Uo(t, e) {
          t && t.log(Do, e, void 0);
        }

        function Vo(t) {
          this.f = t;
        }

        function Ko(t) {
          nn.call(this), this.u = t, this.readyState = Fo, this.status = 0, this.responseType = this.responseText = this.response = this.statusText = "", this.onreadystatechange = null, this.i = new Headers(), this.b = null, this.o = "GET", this.g = "", this.a = !1, this.h = jo("goog.net.FetchXmlHttp"), this.l = this.c = this.f = null;
        }

        E(Vo, wo), Vo.prototype.a = function () {
          return new Ko(this.f);
        }, Vo.prototype.b = (Lo = {}, function () {
          return Lo;
        }), E(Ko, nn);
        var Fo = 0;

        function qo(t) {
          t.c.read().then(t.bc.bind(t)).catch(t.Ma.bind(t));
        }

        function Ho(t, e) {
          e && t.f && (t.status = t.f.status, t.statusText = t.f.statusText), t.readyState = 4, t.f = null, t.c = null, t.l = null, Bo(t);
        }

        function Bo(t) {
          t.onreadystatechange && t.onreadystatechange.call(t);
        }

        function Go(t) {
          nn.call(this), this.headers = new fn(), this.D = t || null, this.c = !1, this.A = this.a = null, this.h = this.N = this.l = "", this.f = this.I = this.i = this.G = !1, this.g = 0, this.u = null, this.o = Wo, this.v = this.O = !1;
        }

        (t = Ko.prototype).open = function (t, e) {
          if (this.readyState != Fo) throw this.abort(), Error("Error reopening a connection");
          this.o = t, this.g = e, this.readyState = 1, Bo(this);
        }, t.send = function (t) {
          if (1 != this.readyState) throw this.abort(), Error("need to call open() first. ");
          this.a = !0;
          var e = {
            headers: this.i,
            method: this.o,
            credentials: void 0,
            cache: void 0
          };
          t && (e.body = t), this.u.fetch(new Request(this.g, e)).then(this.gc.bind(this), this.Ma.bind(this));
        }, t.abort = function () {
          this.response = this.responseText = "", this.i = new Headers(), this.status = 0, this.c && this.c.cancel("Request was aborted."), 1 <= this.readyState && this.a && 4 != this.readyState && (this.a = !1, Ho(this, !1)), this.readyState = Fo;
        }, t.gc = function (t) {
          this.a && (this.f = t, this.b || (this.b = t.headers, this.readyState = 2, Bo(this)), this.a && (this.readyState = 3, Bo(this), this.a && ("arraybuffer" === this.responseType ? t.arrayBuffer().then(this.ec.bind(this), this.Ma.bind(this)) : void 0 !== h.ReadableStream && "body" in t ? (this.response = this.responseText = "", this.c = t.body.getReader(), this.l = new TextDecoder(), qo(this)) : t.text().then(this.fc.bind(this), this.Ma.bind(this)))));
        }, t.bc = function (t) {
          if (this.a) {
            var e = this.l.decode(t.value ? t.value : new Uint8Array(0), {
              stream: !t.done
            });
            e && (this.response = this.responseText += e), t.done ? Ho(this, !0) : Bo(this), 3 == this.readyState && qo(this);
          }
        }, t.fc = function (t) {
          this.a && (this.response = this.responseText = t, Ho(this, !0));
        }, t.ec = function (t) {
          this.a && (this.response = t, Ho(this, !0));
        }, t.Ma = function (t) {
          var e = this.h;
          e && e.log(Co, "Failed to fetch url " + this.g, t instanceof Error ? t : Error(t)), this.a && Ho(this, !0);
        }, t.setRequestHeader = function (t, e) {
          this.i.append(t, e);
        }, t.getResponseHeader = function (t) {
          return this.b ? this.b.get(t.toLowerCase()) || "" : ((t = this.h) && t.log(Co, "Attempting to get response header but no headers have been received for url: " + this.g, void 0), "");
        }, t.getAllResponseHeaders = function () {
          if (!this.b) {
            var t = this.h;
            return t && t.log(Co, "Attempting to get all response headers but no headers have been received for url: " + this.g, void 0), "";
          }

          t = [];

          for (var e = this.b.entries(), n = e.next(); !n.done;) n = n.value, t.push(n[0] + ": " + n[1]), n = e.next();

          return t.join("\r\n");
        }, E(Go, nn);
        var Wo = "";
        Go.prototype.b = jo("goog.net.XhrIo");
        var Xo = /^https?$/i,
            Jo = ["POST", "PUT"];

        function zo(e, t, n, i, r) {
          if (e.a) throw Error("[goog.net.XhrIo] Object is active with another request=" + e.l + "; newUri=" + t);
          n = n ? n.toUpperCase() : "GET", e.l = t, e.h = "", e.N = n, e.G = !1, e.c = !0, e.a = e.D ? e.D.a() : vo.a(), e.A = e.D ? Io(e.D) : Io(vo), e.a.onreadystatechange = I(e.Jb, e);

          try {
            Uo(e.b, ra(e, "Opening Xhr")), e.I = !0, e.a.open(n, String(t), !0), e.I = !1;
          } catch (t) {
            return Uo(e.b, ra(e, "Error opening Xhr: " + t.message)), void $o(e, t);
          }

          t = i || "";
          var o = new fn(e.headers);
          r && function (t, e) {
            if (t.forEach && "function" == typeof t.forEach) t.forEach(e, void 0);else if (v(t) || f(t)) M(t, e, void 0);else for (var n = hn(t), i = cn(t), r = i.length, o = 0; o < r; o++) e.call(void 0, i[o], n && n[o], t);
          }(r, function (t, e) {
            o.set(e, t);
          }), r = function (t) {
            t: {
              for (var e = Yo, n = t.length, i = f(t) ? t.split("") : t, r = 0; r < n; r++) if (r in i && e.call(void 0, i[r], r, t)) {
                e = r;
                break t;
              }

              e = -1;
            }

            return e < 0 ? null : f(t) ? t.charAt(e) : t[e];
          }(o.U()), i = h.FormData && t instanceof h.FormData, !V(Jo, n) || r || i || o.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8"), o.forEach(function (t, e) {
            this.a.setRequestHeader(e, t);
          }, e), e.o && (e.a.responseType = e.o), "withCredentials" in e.a && e.a.withCredentials !== e.O && (e.a.withCredentials = e.O);

          try {
            ea(e), 0 < e.g && (e.v = function (t) {
              return me && Ne(9) && "number" == typeof t.timeout && void 0 !== t.ontimeout;
            }(e.a), Uo(e.b, ra(e, "Will abort after " + e.g + "ms if incomplete, xhr2 " + e.v)), e.v ? (e.a.timeout = e.g, e.a.ontimeout = I(e.Ga, e)) : e.u = sn(e.Ga, e.g, e)), Uo(e.b, ra(e, "Sending request")), e.i = !0, e.a.send(t), e.i = !1;
          } catch (t) {
            Uo(e.b, ra(e, "Send error: " + t.message)), $o(e, t);
          }
        }

        function Yo(t) {
          return "content-type" == t.toLowerCase();
        }

        function $o(t, e) {
          t.c = !1, t.a && (t.f = !0, t.a.abort(), t.f = !1), t.h = e, Zo(t), ta(t);
        }

        function Zo(t) {
          t.G || (t.G = !0, t.dispatchEvent("complete"), t.dispatchEvent("error"));
        }

        function Qo(e) {
          if (e.c && void 0 !== u) if (e.A[1] && 4 == na(e) && 2 == ia(e)) Uo(e.b, ra(e, "Local request error detected and ignored"));else if (e.i && 4 == na(e)) sn(e.Jb, 0, e);else if (e.dispatchEvent("readystatechange"), 4 == na(e)) {
            Uo(e.b, ra(e, "Request complete")), e.c = !1;

            try {
              var t,
                  n = ia(e);

              t: switch (n) {
                case 200:
                case 201:
                case 202:
                case 204:
                case 206:
                case 304:
                case 1223:
                  var i = !0;
                  break t;

                default:
                  i = !1;
              }

              if (!(t = i)) {
                var r;

                if (r = 0 === n) {
                  var o = String(e.l).match(pn)[1] || null;

                  if (!o && h.self && h.self.location) {
                    var a = h.self.location.protocol;
                    o = a.substr(0, a.length - 1);
                  }

                  r = !Xo.test(o ? o.toLowerCase() : "");
                }

                t = r;
              }

              if (t) e.dispatchEvent("complete"), e.dispatchEvent("success");else {
                try {
                  var s = 2 < na(e) ? e.a.statusText : "";
                } catch (t) {
                  Uo(e.b, "Can not get status: " + t.message), s = "";
                }

                e.h = s + " [" + ia(e) + "]", Zo(e);
              }
            } finally {
              ta(e);
            }
          }
        }

        function ta(e, t) {
          if (e.a) {
            ea(e);
            var n = e.a,
                i = e.A[0] ? d : null;
            e.a = null, e.A = null, t || e.dispatchEvent("ready");

            try {
              n.onreadystatechange = i;
            } catch (t) {
              (e = e.b) && e.log(Po, "Problem encountered resetting onreadystatechange: " + t.message, void 0);
            }
          }
        }

        function ea(t) {
          t.a && t.v && (t.a.ontimeout = null), t.u && (h.clearTimeout(t.u), t.u = null);
        }

        function na(t) {
          return t.a ? t.a.readyState : 0;
        }

        function ia(t) {
          try {
            return 2 < na(t) ? t.a.status : -1;
          } catch (t) {
            return -1;
          }
        }

        function ra(t, e) {
          return e + " [" + t.N + " " + t.l + " " + ia(t) + "]";
        }

        function oa(t) {
          var e = ma;
          this.g = [], this.v = e, this.u = t || null, this.f = this.a = !1, this.c = void 0, this.l = this.A = this.i = !1, this.h = 0, this.b = null, this.m = 0;
        }

        function aa(t, e, n) {
          t.a = !0, t.c = n, t.f = !e, ha(t);
        }

        function sa(t) {
          if (t.a) {
            if (!t.l) throw new fa(t);
            t.l = !1;
          }
        }

        function ua(t, e, n, i) {
          t.g.push([e, n, i]), t.a && ha(t);
        }

        function ca(t) {
          return U(t.g, function (t) {
            return m(t[1]);
          });
        }

        function ha(e) {
          if (e.h && e.a && ca(e)) {
            var n = e.h,
                i = pa[n];
            i && (h.clearTimeout(i.a), delete pa[n]), e.h = 0;
          }

          e.b && (e.b.m--, delete e.b), n = e.c;

          for (var t = i = !1; e.g.length && !e.i;) {
            var r = e.g.shift(),
                o = r[0],
                a = r[1];
            if (r = r[2], o = e.f ? a : o) try {
              var s = o.call(r || e.u, n);
              void 0 !== s && (e.f = e.f && (s == n || s instanceof Error), e.c = n = s), (S(n) || "function" == typeof h.Promise && n instanceof h.Promise) && (t = !0, e.i = !0);
            } catch (t) {
              n = t, e.f = !0, ca(e) || (i = !0);
            }
          }

          e.c = n, t && (s = I(e.o, e, !0), t = I(e.o, e, !1), n instanceof oa ? (ua(n, s, t), n.A = !0) : n.then(s, t)), i && (n = new da(n), pa[n.a] = n, e.h = n.a);
        }

        function fa() {
          A.call(this);
        }

        function la() {
          A.call(this);
        }

        function da(t) {
          this.a = h.setTimeout(I(this.c, this), 0), this.b = t;
        }

        (t = Go.prototype).Ga = function () {
          void 0 !== u && this.a && (this.h = "Timed out after " + this.g + "ms, aborting", Uo(this.b, ra(this, this.h)), this.dispatchEvent("timeout"), this.abort(8));
        }, t.abort = function () {
          this.a && this.c && (Uo(this.b, ra(this, "Aborting")), this.c = !1, this.f = !0, this.a.abort(), this.f = !1, this.dispatchEvent("complete"), this.dispatchEvent("abort"), ta(this));
        }, t.va = function () {
          this.a && (this.c && (this.c = !1, this.f = !0, this.a.abort(), this.f = !1), ta(this, !0)), Go.qb.va.call(this);
        }, t.Jb = function () {
          this.qa || (this.I || this.i || this.f ? Qo(this) : this.vc());
        }, t.vc = function () {
          Qo(this);
        }, t.getResponse = function () {
          try {
            if (!this.a) return null;
            if ("response" in this.a) return this.a.response;

            switch (this.o) {
              case Wo:
              case "text":
                return this.a.responseText;

              case "arraybuffer":
                if ("mozResponseArrayBuffer" in this.a) return this.a.mozResponseArrayBuffer;
            }

            var t = this.b;
            return t && t.log(Po, "Response type " + this.o + " is not supported on this browser", void 0), null;
          } catch (t) {
            return Uo(this.b, "Can not get response: " + t.message), null;
          }
        }, oa.prototype.cancel = function (t) {
          if (this.a) this.c instanceof oa && this.c.cancel();else {
            if (this.b) {
              var e = this.b;
              delete this.b, t ? e.cancel(t) : (e.m--, e.m <= 0 && e.cancel());
            }

            this.v ? this.v.call(this.u, this) : this.l = !0, this.a || (t = new la(this), sa(this), aa(this, !1, t));
          }
        }, oa.prototype.o = function (t, e) {
          this.i = !1, aa(this, t, e);
        }, oa.prototype.then = function (t, e, n) {
          var i,
              r,
              o = new qt(function (t, e) {
            i = t, r = e;
          });
          return ua(this, i, function (t) {
            t instanceof la ? o.cancel() : r(t);
          }), o.then(t, e, n);
        }, oa.prototype.$goog_Thenable = !0, E(fa, A), fa.prototype.message = "Deferred has already fired", fa.prototype.name = "AlreadyCalledError", E(la, A), la.prototype.message = "Deferred was canceled", la.prototype.name = "CanceledError", da.prototype.c = function () {
          throw delete pa[this.a], this.b;
        };
        var pa = {};

        function va(t) {
          var e,
              n = document,
              i = et(t).toString(),
              r = document.createElement("SCRIPT"),
              o = {
            Lb: r,
            Ga: void 0
          },
              a = new oa(o);
          return e = window.setTimeout(function () {
            ga(r, !0);
            var t = new wa(ya, "Timeout reached for loading script " + i);
            sa(a), aa(a, !1, t);
          }, 5e3), o.Ga = e, r.onload = r.onreadystatechange = function () {
            r.readyState && "loaded" != r.readyState && "complete" != r.readyState || (ga(r, !1, e), sa(a), aa(a, !0, null));
          }, r.onerror = function () {
            ga(r, !0, e);
            var t = new wa(ba, "Error while loading script " + i);
            sa(a), aa(a, !1, t);
          }, J(o = {}, {
            type: "text/javascript",
            charset: "UTF-8"
          }), Fn(r, o), function (t, e) {
            L(t, "HTMLScriptElement"), t.src = et(e), null === l && (l = (e = (e = h.document).querySelector && e.querySelector("script[nonce]")) && (e = e.nonce || e.getAttribute("nonce")) && s.test(e) ? e : ""), (e = l) && t.setAttribute("nonce", e);
          }(r, t), function (t) {
            var e;
            return (e = (t || document).getElementsByTagName("HEAD")) && 0 != e.length ? e[0] : t.documentElement;
          }(n).appendChild(r), a;
        }

        function ma() {
          if (this && this.Lb) {
            var t = this.Lb;
            t && "SCRIPT" == t.tagName && ga(t, !0, this.Ga);
          }
        }

        function ga(t, e, n) {
          null != n && h.clearTimeout(n), t.onload = d, t.onerror = d, t.onreadystatechange = d, e && window.setTimeout(function () {
            t && t.parentNode && t.parentNode.removeChild(t);
          }, 0);
        }

        var ba = 0,
            ya = 1;

        function wa(t, e) {
          var n = "Jsloader error (code #" + t + ")";
          e && (n += ": " + e), A.call(this, n), this.code = t;
        }

        function Ia(t) {
          this.f = t;
        }

        function Ta(t, e, n) {
          if (this.b = t, t = e || {}, this.i = t.secureTokenEndpoint || "https://securetoken.googleapis.com/v1/token", this.m = t.secureTokenTimeout || Sa, this.f = W(t.secureTokenHeaders || Aa), this.g = t.firebaseEndpoint || "https://www.googleapis.com/identitytoolkit/v3/relyingparty/", this.h = t.firebaseTimeout || Na, this.a = W(t.firebaseHeaders || Oa), n && (this.a["X-Client-Version"] = n, this.f["X-Client-Version"] = n), n = "Node" == ui(), !(n = h.XMLHttpRequest || n && $h.INTERNAL.node && $h.INTERNAL.node.XMLHttpRequest) && !si()) throw new zi("internal-error", "The XMLHttpRequest compatibility library was not found.");
          this.c = void 0, si() ? this.c = new Vo(self) : ci() ? this.c = new Ia(n) : this.c = new Eo();
        }

        E(wa, A), E(Ia, wo), Ia.prototype.a = function () {
          return new this.f();
        }, Ia.prototype.b = function () {
          return {};
        };
        var ka,
            Ea = "idToken",
            Sa = new Oi(3e4, 6e4),
            Aa = {
          "Content-Type": "application/x-www-form-urlencoded"
        },
            Na = new Oi(3e4, 6e4),
            Oa = {
          "Content-Type": "application/json"
        };

        function _a(t, e) {
          e ? t.a["X-Firebase-Locale"] = e : delete t.a["X-Firebase-Locale"];
        }

        function Pa(t, e) {
          e ? (t.a["X-Client-Version"] = e, t.f["X-Client-Version"] = e) : (delete t.a["X-Client-Version"], delete t.f["X-Client-Version"]);
        }

        function Ca(t, e, n, i, r, o, a) {
          (t = function () {
            var t = vi();
            return !((t = li(t) != fi ? null : (t = t.match(/\sChrome\/(\d+)/i)) && 2 == t.length ? parseInt(t[1], 10) : null) && t < 30) && (!me || !Se || 9 < Se);
          }() || si() ? I(t.o, t) : (ka = ka || new qt(function (t, e) {
            !function (t, e) {
              if (((window.gapi || {}).client || {}).request) t();else {
                h[Da] = function () {
                  ((window.gapi || {}).client || {}).request ? t() : e(Error("CORS_UNSUPPORTED"));
                }, function (t, e) {
                  ua(t, null, e, void 0);
                }(va(nt(Ra, {
                  onload: Da
                })), function () {
                  e(Error("CORS_UNSUPPORTED"));
                });
              }
            }(t, e);
          }), I(t.l, t)))(e, n, i, r, o, a);
        }

        Ta.prototype.o = function (t, n, e, i, r, o) {
          if (si() && (void 0 === h.fetch || void 0 === h.Headers || void 0 === h.Request)) throw new zi("operation-not-supported-in-this-environment", "fetch, Headers and Request native APIs or equivalent Polyfills must be available to support HTTP requests from a Worker environment.");
          var a = new Go(this.c);

          if (o) {
            a.g = Math.max(0, o);
            var s = setTimeout(function () {
              a.dispatchEvent("timeout");
            }, o);
          }

          rn(a, "complete", function () {
            s && clearTimeout(s);
            var e = null;

            try {
              e = JSON.parse(function (e) {
                try {
                  return e.a ? e.a.responseText : "";
                } catch (t) {
                  return Uo(e.b, "Can not get responseText: " + t.message), "";
                }
              }(this)) || null;
            } catch (t) {
              e = null;
            }

            n && n(e);
          }), on(a, "ready", function () {
            s && clearTimeout(s), fe(this);
          }), on(a, "timeout", function () {
            s && clearTimeout(s), fe(this), n && n(null);
          }), zo(a, t, e, i, r);
        };

        var Ra = new z(Z, "https://apis.google.com/js/client.js?onload=%{onload}"),
            Da = "__fcb" + Math.floor(1e6 * Math.random()).toString();

        function La(t) {
          if (!f(t = t.email) || !ii.test(t)) throw new zi("invalid-email");
        }

        function xa(t) {
          "email" in t && La(t);
        }

        function Ma(t) {
          if (!t[Ea]) throw new zi("internal-error");
        }

        function ja(t) {
          if (t.phoneNumber || t.temporaryProof) {
            if (!t.phoneNumber || !t.temporaryProof) throw new zi("internal-error");
          } else {
            if (!t.sessionInfo) throw new zi("missing-verification-id");
            if (!t.code) throw new zi("missing-verification-code");
          }
        }

        Ta.prototype.l = function (t, n, i, r, o) {
          var a = this;
          ka.then(function () {
            window.gapi.client.setApiKey(a.b);
            var e = window.gapi.auth.getToken();
            window.gapi.auth.setToken(null), window.gapi.client.request({
              path: t,
              method: i,
              body: r,
              headers: o,
              authType: "none",
              callback: function (t) {
                window.gapi.auth.setToken(e), n && n(t);
              }
            });
          }).s(function (t) {
            n && n({
              error: {
                message: t && t.message || "CORS_UNSUPPORTED"
              }
            });
          });
        }, Ta.prototype.ob = function () {
          return ys(this, hs, {});
        }, Ta.prototype.rb = function (t, e) {
          return ys(this, us, {
            idToken: t,
            email: e
          });
        }, Ta.prototype.sb = function (t, e) {
          return ys(this, cs, {
            idToken: t,
            password: e
          });
        };
        var Ua = {
          displayName: "DISPLAY_NAME",
          photoUrl: "PHOTO_URL"
        };

        function Va(t) {
          if (!t.requestUri || !t.sessionId && !t.postBody && !t.pendingToken) throw new zi("internal-error");
        }

        function Ka(t, e) {
          return e.oauthIdToken && e.providerId && 0 == e.providerId.indexOf("oidc.") && !e.pendingToken && (t.sessionId ? e.nonce = t.sessionId : t.postBody && xn(t = new Cn(t.postBody), "nonce") && (e.nonce = t.get("nonce"))), e;
        }

        function Fa(t) {
          var e = null;
          if (t.needConfirmation ? (t.code = "account-exists-with-different-credential", e = yo(t)) : "FEDERATED_USER_ID_ALREADY_LINKED" == t.errorMessage ? (t.code = "credential-already-in-use", e = yo(t)) : "EMAIL_EXISTS" == t.errorMessage ? (t.code = "email-already-in-use", e = yo(t)) : t.errorMessage && (e = ws(t.errorMessage)), e) throw e;
          if (!t[Ea]) throw new zi("internal-error");
        }

        function qa(t, e) {
          return e.returnIdpCredential = !0, ys(t, fs, e);
        }

        function Ha(t, e) {
          return e.returnIdpCredential = !0, ys(t, ds, e);
        }

        function Ba(t, e) {
          return e.returnIdpCredential = !0, e.autoCreate = !1, ys(t, ls, e);
        }

        function Ga(t) {
          if (!t.oobCode) throw new zi("invalid-action-code");
        }

        (t = Ta.prototype).tb = function (t, i) {
          var r = {
            idToken: t
          },
              o = [];
          return B(Ua, function (t, e) {
            var n = i[e];
            null === n ? o.push(t) : e in i && (r[e] = n);
          }), o.length && (r.deleteAttribute = o), ys(this, us, r);
        }, t.lb = function (t, e) {
          return J(t = {
            requestType: "PASSWORD_RESET",
            email: t
          }, e), ys(this, is, t);
        }, t.mb = function (t, e) {
          return J(t = {
            requestType: "EMAIL_SIGNIN",
            email: t
          }, e), ys(this, es, t);
        }, t.kb = function (t, e) {
          return J(t = {
            requestType: "VERIFY_EMAIL",
            idToken: t
          }, e), ys(this, ns, t);
        }, t.Va = function (t) {
          return ys(this, ms, t);
        }, t.$a = function (t, e) {
          return ys(this, as, {
            oobCode: t,
            newPassword: e
          });
        }, t.Ka = function (t) {
          return ys(this, Xa, {
            oobCode: t
          });
        }, t.Xa = function (t) {
          return ys(this, Wa, {
            oobCode: t
          });
        };
        var Wa = {
          endpoint: "setAccountInfo",
          C: Ga,
          da: "email"
        },
            Xa = {
          endpoint: "resetPassword",
          C: Ga,
          J: function (t) {
            var e = t.requestType;
            if (!e || !t.email && "EMAIL_SIGNIN" != e) throw new zi("internal-error");
          }
        },
            Ja = {
          endpoint: "signupNewUser",
          C: function (t) {
            if (La(t), !t.password) throw new zi("weak-password");
          },
          J: Ma,
          R: !0
        },
            za = {
          endpoint: "createAuthUri"
        },
            Ya = {
          endpoint: "deleteAccount",
          T: ["idToken"]
        },
            $a = {
          endpoint: "setAccountInfo",
          T: ["idToken", "deleteProvider"],
          C: function (t) {
            if (!p(t.deleteProvider)) throw new zi("internal-error");
          }
        },
            Za = {
          endpoint: "emailLinkSignin",
          T: ["email", "oobCode"],
          C: La,
          J: Ma,
          R: !0
        },
            Qa = {
          endpoint: "emailLinkSignin",
          T: ["idToken", "email", "oobCode"],
          C: La,
          J: Ma,
          R: !0
        },
            ts = {
          endpoint: "getAccountInfo"
        },
            es = {
          endpoint: "getOobConfirmationCode",
          T: ["requestType"],
          C: function (t) {
            if ("EMAIL_SIGNIN" != t.requestType) throw new zi("internal-error");
            La(t);
          },
          da: "email"
        },
            ns = {
          endpoint: "getOobConfirmationCode",
          T: ["idToken", "requestType"],
          C: function (t) {
            if ("VERIFY_EMAIL" != t.requestType) throw new zi("internal-error");
          },
          da: "email"
        },
            is = {
          endpoint: "getOobConfirmationCode",
          T: ["requestType"],
          C: function (t) {
            if ("PASSWORD_RESET" != t.requestType) throw new zi("internal-error");
            La(t);
          },
          da: "email"
        },
            rs = {
          wb: !0,
          endpoint: "getProjectConfig",
          Ib: "GET"
        },
            os = {
          wb: !0,
          endpoint: "getRecaptchaParam",
          Ib: "GET",
          J: function (t) {
            if (!t.recaptchaSiteKey) throw new zi("internal-error");
          }
        },
            as = {
          endpoint: "resetPassword",
          C: Ga,
          da: "email"
        },
            ss = {
          endpoint: "sendVerificationCode",
          T: ["phoneNumber", "recaptchaToken"],
          da: "sessionInfo"
        },
            us = {
          endpoint: "setAccountInfo",
          T: ["idToken"],
          C: xa,
          R: !0
        },
            cs = {
          endpoint: "setAccountInfo",
          T: ["idToken"],
          C: function (t) {
            if (xa(t), !t.password) throw new zi("weak-password");
          },
          J: Ma,
          R: !0
        },
            hs = {
          endpoint: "signupNewUser",
          J: Ma,
          R: !0
        },
            fs = {
          endpoint: "verifyAssertion",
          C: Va,
          Qa: Ka,
          J: Fa,
          R: !0
        },
            ls = {
          endpoint: "verifyAssertion",
          C: Va,
          Qa: Ka,
          J: function (t) {
            if (t.errorMessage && "USER_NOT_FOUND" == t.errorMessage) throw new zi("user-not-found");
            if (t.errorMessage) throw ws(t.errorMessage);
            if (!t[Ea]) throw new zi("internal-error");
          },
          R: !0
        },
            ds = {
          endpoint: "verifyAssertion",
          C: function (t) {
            if (Va(t), !t.idToken) throw new zi("internal-error");
          },
          Qa: Ka,
          J: Fa,
          R: !0
        },
            ps = {
          endpoint: "verifyCustomToken",
          C: function (t) {
            if (!t.token) throw new zi("invalid-custom-token");
          },
          J: Ma,
          R: !0
        },
            vs = {
          endpoint: "verifyPassword",
          C: function (t) {
            if (La(t), !t.password) throw new zi("wrong-password");
          },
          J: Ma,
          R: !0
        },
            ms = {
          endpoint: "verifyPhoneNumber",
          C: ja,
          J: Ma
        },
            gs = {
          endpoint: "verifyPhoneNumber",
          C: function (t) {
            if (!t.idToken) throw new zi("internal-error");
            ja(t);
          },
          J: function (t) {
            if (t.temporaryProof) throw t.code = "credential-already-in-use", yo(t);
            Ma(t);
          }
        },
            bs = {
          Vb: {
            USER_NOT_FOUND: "user-not-found"
          },
          endpoint: "verifyPhoneNumber",
          C: ja,
          J: Ma
        };

        function ys(t, e, n) {
          if (!function (t, e) {
            if (!e || !e.length) return !0;
            if (!t) return !1;

            for (var n = 0; n < e.length; n++) {
              var i = t[e[n]];
              if (null == i || "" === i) return !1;
            }

            return !0;
          }(n, e.T)) return Yt(new zi("internal-error"));
          var i,
              r = e.Ib || "POST";
          return zt(n).then(e.C).then(function () {
            return e.R && (n.returnSecureToken = !0), function (t, e, i, r, o, n) {
              var a = In(t.g + e);
              yn(a, "key", t.b), n && yn(a, "cb", k().toString());
              var s = "GET" == i;
              if (s) for (var u in r) r.hasOwnProperty(u) && yn(a, u, r[u]);
              return new qt(function (e, n) {
                Ca(t, a.toString(), function (t) {
                  t ? t.error ? n(Is(t, o || {})) : e(t) : n(new zi("network-request-failed"));
                }, i, s ? void 0 : Gn(ki(r)), t.a, t.h.get());
              });
            }(t, e.endpoint, r, n, e.Vb, e.wb || !1);
          }).then(function (t) {
            return i = t, e.Qa ? e.Qa(n, i) : i;
          }).then(e.J).then(function () {
            if (!e.da) return i;
            if (!(e.da in i)) throw new zi("internal-error");
            return i[e.da];
          });
        }

        function ws(t) {
          return Is({
            error: {
              errors: [{
                message: t
              }],
              code: 400,
              message: t
            }
          });
        }

        function Is(t, e) {
          var n = (t.error && t.error.errors && t.error.errors[0] || {}).reason || "",
              i = {
            keyInvalid: "invalid-api-key",
            ipRefererBlocked: "app-not-authorized"
          };
          if (n = i[n] ? new zi(i[n]) : null) return n;

          for (var r in n = t.error && t.error.message || "", J(i = {
            INVALID_CUSTOM_TOKEN: "invalid-custom-token",
            CREDENTIAL_MISMATCH: "custom-token-mismatch",
            MISSING_CUSTOM_TOKEN: "internal-error",
            INVALID_IDENTIFIER: "invalid-email",
            MISSING_CONTINUE_URI: "internal-error",
            INVALID_EMAIL: "invalid-email",
            INVALID_PASSWORD: "wrong-password",
            USER_DISABLED: "user-disabled",
            MISSING_PASSWORD: "internal-error",
            EMAIL_EXISTS: "email-already-in-use",
            PASSWORD_LOGIN_DISABLED: "operation-not-allowed",
            INVALID_IDP_RESPONSE: "invalid-credential",
            INVALID_PENDING_TOKEN: "invalid-credential",
            FEDERATED_USER_ID_ALREADY_LINKED: "credential-already-in-use",
            MISSING_OR_INVALID_NONCE: "missing-or-invalid-nonce",
            INVALID_MESSAGE_PAYLOAD: "invalid-message-payload",
            INVALID_RECIPIENT_EMAIL: "invalid-recipient-email",
            INVALID_SENDER: "invalid-sender",
            EMAIL_NOT_FOUND: "user-not-found",
            RESET_PASSWORD_EXCEED_LIMIT: "too-many-requests",
            EXPIRED_OOB_CODE: "expired-action-code",
            INVALID_OOB_CODE: "invalid-action-code",
            MISSING_OOB_CODE: "internal-error",
            INVALID_PROVIDER_ID: "invalid-provider-id",
            CREDENTIAL_TOO_OLD_LOGIN_AGAIN: "requires-recent-login",
            INVALID_ID_TOKEN: "invalid-user-token",
            TOKEN_EXPIRED: "user-token-expired",
            USER_NOT_FOUND: "user-token-expired",
            CORS_UNSUPPORTED: "cors-unsupported",
            DYNAMIC_LINK_NOT_ACTIVATED: "dynamic-link-not-activated",
            INVALID_APP_ID: "invalid-app-id",
            TOO_MANY_ATTEMPTS_TRY_LATER: "too-many-requests",
            WEAK_PASSWORD: "weak-password",
            OPERATION_NOT_ALLOWED: "operation-not-allowed",
            USER_CANCELLED: "user-cancelled",
            CAPTCHA_CHECK_FAILED: "captcha-check-failed",
            INVALID_APP_CREDENTIAL: "invalid-app-credential",
            INVALID_CODE: "invalid-verification-code",
            INVALID_PHONE_NUMBER: "invalid-phone-number",
            INVALID_SESSION_INFO: "invalid-verification-id",
            INVALID_TEMPORARY_PROOF: "invalid-credential",
            MISSING_APP_CREDENTIAL: "missing-app-credential",
            MISSING_CODE: "missing-verification-code",
            MISSING_PHONE_NUMBER: "missing-phone-number",
            MISSING_SESSION_INFO: "missing-verification-id",
            QUOTA_EXCEEDED: "quota-exceeded",
            SESSION_EXPIRED: "code-expired",
            REJECTED_CREDENTIAL: "rejected-credential",
            INVALID_CONTINUE_URI: "invalid-continue-uri",
            MISSING_ANDROID_PACKAGE_NAME: "missing-android-pkg-name",
            MISSING_IOS_BUNDLE_ID: "missing-ios-bundle-id",
            UNAUTHORIZED_DOMAIN: "unauthorized-continue-uri",
            INVALID_DYNAMIC_LINK_DOMAIN: "invalid-dynamic-link-domain",
            INVALID_OAUTH_CLIENT_ID: "invalid-oauth-client-id",
            INVALID_CERT_HASH: "invalid-cert-hash",
            ADMIN_ONLY_OPERATION: "admin-restricted-operation"
          }, e || {}), e = (e = n.match(/^[^\s]+\s*:\s*(.*)$/)) && 1 < e.length ? e[1] : void 0, i) if (0 === n.indexOf(r)) return new zi(i[r], e);

          return !e && t && (e = Ti(t)), new zi("internal-error", e);
        }

        function Ts(t) {
          this.b = t, this.a = null, this.gb = function (o) {
            return (As = As || new qt(function (t, e) {
              function n() {
                Ni(), mi("gapi.load")("gapi.iframes", {
                  callback: t,
                  ontimeout: function () {
                    Ni(), e(Error("Network Error"));
                  },
                  timeout: Es.get()
                });
              }

              if (mi("gapi.iframes.Iframe")) t();else if (mi("gapi.load")) n();else {
                var i = "__iframefcb" + Math.floor(1e6 * Math.random()).toString();
                h[i] = function () {
                  mi("gapi.load") ? n() : e(Error("Network Error"));
                }, zt(va(i = nt(ks, {
                  onload: i
                }))).s(function () {
                  e(Error("Network Error"));
                });
              }
            }).s(function (t) {
              throw As = null, t;
            })).then(function () {
              return new qt(function (i, r) {
                mi("gapi.iframes.getContext")().open({
                  where: document.body,
                  url: o.b,
                  messageHandlersFilter: mi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"),
                  attributes: {
                    style: {
                      position: "absolute",
                      top: "-100px",
                      width: "1px",
                      height: "1px"
                    }
                  },
                  dontclear: !0
                }, function (t) {
                  function e() {
                    clearTimeout(n), i();
                  }

                  o.a = t, o.a.restyle({
                    setHideOnLeave: !1
                  });
                  var n = setTimeout(function () {
                    r(Error("Network Error"));
                  }, Ss.get());
                  t.ping(e).then(e, function () {
                    r(Error("Network Error"));
                  });
                });
              });
            });
          }(this);
        }

        var ks = new z(Z, "https://apis.google.com/js/api.js?onload=%{onload}"),
            Es = new Oi(3e4, 6e4),
            Ss = new Oi(5e3, 15e3),
            As = null;

        function Ns(t, e, n) {
          this.i = t, this.g = e, this.h = n, this.f = null, this.a = Tn(this.i, "/__/auth/iframe"), yn(this.a, "apiKey", this.g), yn(this.a, "appName", this.h), this.b = null, this.c = [];
        }

        function Os(t, e, n, i, r) {
          this.o = t, this.l = e, this.c = n, this.m = i, this.h = this.g = this.i = null, this.a = r, this.f = null;
        }

        function _s(t) {
          try {
            return $h.app(t).auth().ya();
          } catch (t) {
            return [];
          }
        }

        function Ps(t, e, n, i, r) {
          this.l = t, this.f = e, this.b = n, this.c = i || null, this.h = r || null, this.o = this.u = this.v = null, this.g = [], this.m = this.a = null;
        }

        function Cs(t) {
          var s = $n();
          return function (t) {
            return ys(t, rs, {}).then(function (t) {
              return t.authorizedDomains || [];
            });
          }(t).then(function (t) {
            t: {
              var e = In(s),
                  n = e.f;
              e = e.b;

              for (var i = 0; i < t.length; i++) {
                var r = t[i],
                    o = e,
                    a = n;

                if (o = 0 == r.indexOf("chrome-extension://") ? In(r).b == o && "chrome-extension" == a : ("http" == a || "https" == a) && (ni.test(r) ? o == r : (r = r.split(".").join("\\."), new RegExp("^(.+\\." + r + "|" + r + ")$", "i").test(o)))) {
                  t = !0;
                  break t;
                }
              }

              t = !1;
            }

            if (!t) throw new go($n());
          });
        }

        function Rs(r) {
          return r.m || (r.m = ri().then(function () {
            if (!r.u) {
              var t = r.c,
                  e = r.h,
                  n = _s(r.b),
                  i = new Ns(r.l, r.f, r.b);

              i.f = t, i.b = e, i.c = H(n || []), r.u = i.toString();
            }

            r.i = new Ts(r.u), function (i) {
              if (!i.i) throw Error("IfcHandler must be initialized!");
              !function (t, e) {
                t.gb.then(function () {
                  t.a.register("authEvent", e, mi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"));
                });
              }(i.i, function (t) {
                var e = {};

                if (t && t.authEvent) {
                  var n = !1;

                  for (t = lo(t.authEvent), e = 0; e < i.g.length; e++) n = i.g[e](t) || n;

                  return (e = {}).status = n ? "ACK" : "ERROR", zt(e);
                }

                return e.status = "ERROR", zt(e);
              });
            }(r);
          })), r.m;
        }

        function Ds(t) {
          return t.o || (t.v = t.c ? pi(t.c, _s(t.b)) : null, t.o = new Ta(t.f, br(t.h), t.v)), t.o;
        }

        function Ls(t, e, n, i, r, o, a, s, u, c) {
          return (t = new Os(t, e, n, i, r)).i = o, t.g = a, t.h = s, t.b = W(u || null), t.f = c, t.toString();
        }

        function xs(t) {
          if (this.a = t || $h.INTERNAL.reactNative && $h.INTERNAL.reactNative.AsyncStorage, !this.a) throw new zi("internal-error", "The React Native compatibility library was not found.");
          this.type = "asyncStorage";
        }

        function Ms(t) {
          this.b = t, this.a = {}, this.c = I(this.f, this);
        }

        Ns.prototype.toString = function () {
          return this.f ? yn(this.a, "v", this.f) : Ln(this.a.a, "v"), this.b ? yn(this.a, "eid", this.b) : Ln(this.a.a, "eid"), this.c.length ? yn(this.a, "fw", this.c.join(",")) : Ln(this.a.a, "fw"), this.a.toString();
        }, Os.prototype.toString = function () {
          var t = Tn(this.o, "/__/auth/handler");

          if (yn(t, "apiKey", this.l), yn(t, "appName", this.c), yn(t, "authType", this.m), this.a.isOAuthProvider) {
            var e = this.a;

            try {
              var n = $h.app(this.c).auth().ea();
            } catch (t) {
              n = null;
            }

            for (var i in e.ab = n, yn(t, "providerId", this.a.providerId), n = ki((e = this.a).zb)) n[i] = n[i].toString();

            i = e.Cc, n = W(n);

            for (var r = 0; r < i.length; r++) {
              var o = i[r];
              o in n && delete n[o];
            }

            e.eb && e.ab && !n[e.eb] && (n[e.eb] = e.ab), G(n) || yn(t, "customParameters", Ti(n));
          }

          if ("function" == typeof this.a.Fb && (e = this.a.Fb()).length && yn(t, "scopes", e.join(",")), this.i ? yn(t, "redirectUrl", this.i) : Ln(t.a, "redirectUrl"), this.g ? yn(t, "eventId", this.g) : Ln(t.a, "eventId"), this.h ? yn(t, "v", this.h) : Ln(t.a, "v"), this.b) for (var a in this.b) this.b.hasOwnProperty(a) && !wn(t, a) && yn(t, a, this.b[a]);
          return this.f ? yn(t, "eid", this.f) : Ln(t.a, "eid"), (a = _s(this.c)).length && yn(t, "fw", a.join(",")), t.toString();
        }, (t = Ps.prototype).Ea = function (e, n, t) {
          var i = new zi("popup-closed-by-user"),
              r = new zi("web-storage-unsupported"),
              o = this,
              a = !1;
          return this.ga().then(function () {
            (function (t) {
              var e = {
                type: "webStorageSupport"
              };
              return Rs(t).then(function () {
                return function (e, n) {
                  return e.gb.then(function () {
                    return new qt(function (t) {
                      e.a.send(n.type, n, t, mi("gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER"));
                    });
                  });
                }(t.i, e);
              }).then(function (t) {
                if (t && t.length && void 0 !== t[0].webStorageSupport) return t[0].webStorageSupport;
                throw Error();
              });
            })(o).then(function (t) {
              t || (e && ti(e), n(r), a = !0);
            });
          }).s(function () {}).then(function () {
            if (!a) return function (n) {
              return new qt(function (e) {
                return function t() {
                  un(2e3).then(function () {
                    if (n && !n.closed) return t();
                    e();
                  });
                }();
              });
            }(e);
          }).then(function () {
            if (!a) return un(t).then(function () {
              n(i);
            });
          });
        }, t.Mb = function () {
          var t = vi();
          return !Ii(t) && !Ai(t);
        }, t.Hb = function () {
          return !1;
        }, t.Db = function (e, t, n, i, r, o, a) {
          if (!e) return Yt(new zi("popup-blocked"));
          if (a && !Ii()) return this.ga().s(function (t) {
            ti(e), r(t);
          }), i(), zt();
          this.a || (this.a = Cs(Ds(this)));
          var s = this;
          return this.a.then(function () {
            var t = s.ga().s(function (t) {
              throw ti(e), r(t), t;
            });
            return i(), t;
          }).then(function () {
            ho(n), a || Zn(Ls(s.l, s.f, s.b, t, n, null, o, s.c, void 0, s.h), e);
          }).s(function (t) {
            throw "auth/network-request-failed" == t.code && (s.a = null), t;
          });
        }, t.Ca = function (t, e, n) {
          this.a || (this.a = Cs(Ds(this)));
          var i = this;
          return this.a.then(function () {
            ho(e), Zn(Ls(i.l, i.f, i.b, t, e, $n(), n, i.c, void 0, i.h));
          }).s(function (t) {
            throw "auth/network-request-failed" == t.code && (i.a = null), t;
          });
        }, t.ga = function () {
          var t = this;
          return Rs(this).then(function () {
            return t.i.gb;
          }).s(function () {
            throw t.a = null, new zi("network-request-failed");
          });
        }, t.Ob = function () {
          return !0;
        }, t.wa = function (t) {
          this.g.push(t);
        }, t.La = function (e) {
          F(this.g, function (t) {
            return t == e;
          });
        }, (t = xs.prototype).get = function (t) {
          return zt(this.a.getItem(t)).then(function (t) {
            return t && Ei(t);
          });
        }, t.set = function (t, e) {
          return zt(this.a.setItem(t, Ti(e)));
        }, t.P = function (t) {
          return zt(this.a.removeItem(t));
        }, t.Y = function () {}, t.ca = function () {};
        var js,
            Us = [];

        function Vs(t) {
          this.a = t;
        }

        function Ks(t) {
          this.c = t, this.b = !1, this.a = [];
        }

        function Fs(i, t, e, n) {
          var r,
              o,
              a,
              s,
              u = e || {},
              c = null;
          if (i.b) return Yt(Error("connection_unavailable"));
          var h = n ? 800 : 50,
              f = "undefined" != typeof MessageChannel ? new MessageChannel() : null;
          return new qt(function (e, n) {
            f ? (r = Math.floor(Math.random() * Math.pow(10, 20)).toString(), f.port1.start(), a = setTimeout(function () {
              n(Error("unsupported_event"));
            }, h), c = {
              messageChannel: f,
              onMessage: o = function (t) {
                t.data.eventId === r && ("ack" === t.data.status ? (clearTimeout(a), s = setTimeout(function () {
                  n(Error("timeout"));
                }, 3e3)) : "done" === t.data.status ? (clearTimeout(s), void 0 !== t.data.response ? e(t.data.response) : n(Error("unknown_error"))) : (clearTimeout(a), clearTimeout(s), n(Error("invalid_response"))));
              }
            }, i.a.push(c), f.port1.addEventListener("message", o), i.c.postMessage({
              eventType: t,
              eventId: r,
              data: u
            }, [f.port2])) : n(Error("connection_unavailable"));
          }).then(function (t) {
            return qs(i, c), t;
          }).s(function (t) {
            throw qs(i, c), t;
          });
        }

        function qs(t, e) {
          if (e) {
            var n = e.messageChannel,
                i = e.onMessage;
            n && (n.port1.removeEventListener("message", i), n.port1.close()), F(t.a, function (t) {
              return t == e;
            });
          }
        }

        function Hs() {
          if (!Ws()) throw new zi("web-storage-unsupported");
          this.c = {}, this.a = [], this.b = 0, this.l = h.indexedDB, this.type = "indexedDB", this.g = this.m = this.f = this.i = null, this.u = !1, this.h = null;
          var i = this;
          si() && self ? (this.m = function () {
            var e = si() ? self : null;

            if (M(Us, function (t) {
              t.b == e && (n = t);
            }), !n) {
              var n = new Ms(e);
              Us.push(n);
            }

            return n;
          }(), this.m.subscribe("keyChanged", function (t, n) {
            return $s(i).then(function (e) {
              return 0 < e.length && M(i.a, function (t) {
                t(e);
              }), {
                keyProcessed: V(e, n.key)
              };
            });
          }), this.m.subscribe("ping", function () {
            return zt(["keyChanged"]);
          })) : function () {
            var t = h.navigator;
            return t && t.serviceWorker ? zt().then(function () {
              return t.serviceWorker.ready;
            }).then(function (t) {
              return t.active || null;
            }).s(function () {
              return null;
            }) : zt(null);
          }().then(function (t) {
            (i.h = t) && (i.g = new Ks(new Vs(t)), Fs(i.g, "ping", null, !0).then(function (t) {
              t[0].fulfilled && V(t[0].value, "keyChanged") && (i.u = !0);
            }).s(function () {}));
          });
        }

        function Bs(i) {
          return new qt(function (e, n) {
            var t = i.l.open("firebaseLocalStorageDb", 1);
            t.onerror = function (t) {
              try {
                t.preventDefault();
              } catch (t) {}

              n(Error(t.target.error));
            }, t.onupgradeneeded = function (t) {
              t = t.target.result;

              try {
                t.createObjectStore("firebaseLocalStorage", {
                  keyPath: "fbase_key"
                });
              } catch (t) {
                n(t);
              }
            }, t.onsuccess = function (t) {
              (t = t.target.result).objectStoreNames.contains("firebaseLocalStorage") ? e(t) : function (i) {
                return new qt(function (t, e) {
                  var n = i.l.deleteDatabase("firebaseLocalStorageDb");
                  n.onsuccess = function () {
                    t();
                  }, n.onerror = function (t) {
                    e(Error(t.target.error));
                  };
                });
              }(i).then(function () {
                return Bs(i);
              }).then(function (t) {
                e(t);
              }).s(function (t) {
                n(t);
              });
            };
          });
        }

        function Gs(t) {
          return t.o || (t.o = Bs(t)), t.o;
        }

        function Ws() {
          try {
            return !!h.indexedDB;
          } catch (t) {
            return !1;
          }
        }

        function Xs(t) {
          return t.objectStore("firebaseLocalStorage");
        }

        function Js(t, e) {
          return t.transaction(["firebaseLocalStorage"], e ? "readwrite" : "readonly");
        }

        function zs(t) {
          return new qt(function (e, n) {
            t.onsuccess = function (t) {
              t && t.target ? e(t.target.result) : e();
            }, t.onerror = function (t) {
              n(t.target.error);
            };
          });
        }

        function Ys(t, e) {
          return t.g && t.h && function () {
            var t = h.navigator;
            return t && t.serviceWorker && t.serviceWorker.controller || null;
          }() === t.h ? Fs(t.g, "keyChanged", {
            key: e
          }, t.u).then(function () {}).s(function () {}) : zt();
        }

        function $s(i) {
          return Gs(i).then(function (t) {
            var r = Xs(Js(t, !1));
            return r.getAll ? zs(r.getAll()) : new qt(function (e, n) {
              var i = [],
                  t = r.openCursor();
              t.onsuccess = function (t) {
                (t = t.target.result) ? (i.push(t.value), t.continue()) : e(i);
              }, t.onerror = function (t) {
                n(t.target.error);
              };
            });
          }).then(function (t) {
            var e = {},
                n = [];

            if (0 == i.b) {
              for (n = 0; n < t.length; n++) e[t[n].fbase_key] = t[n].value;

              n = function t(e, n) {
                var i,
                    r = [];

                for (i in e) i in n ? typeof e[i] != typeof n[i] ? r.push(i) : "object" == typeof e[i] && null != e[i] && null != n[i] ? 0 < t(e[i], n[i]).length && r.push(i) : e[i] !== n[i] && r.push(i) : r.push(i);

                for (i in n) i in e || r.push(i);

                return r;
              }(i.c, e), i.c = e;
            }

            return n;
          });
        }

        function Zs(t) {
          t.i && t.i.cancel("STOP_EVENT"), t.f && (clearTimeout(t.f), t.f = null);
        }

        function Qs(t) {
          var i = this,
              r = null;
          this.a = [], this.type = "indexedDB", this.c = t, this.b = zt().then(function () {
            if (Ws()) {
              var e = Si(),
                  n = "__sak" + e;
              return js = js || new Hs(), (r = js).set(n, e).then(function () {
                return r.get(n);
              }).then(function (t) {
                if (t !== e) throw Error("indexedDB not supported!");
                return r.P(n);
              }).then(function () {
                return r;
              }).s(function () {
                return i.c;
              });
            }

            return i.c;
          }).then(function (t) {
            return i.type = t.type, t.Y(function (e) {
              M(i.a, function (t) {
                t(e);
              });
            }), t;
          });
        }

        function tu() {
          this.a = {}, this.type = "inMemory";
        }

        function eu() {
          if (!function () {
            var t = "Node" == ui();
            if (!(t = nu() || t && $h.INTERNAL.node && $h.INTERNAL.node.localStorage)) return !1;

            try {
              return t.setItem("__sak", "1"), t.removeItem("__sak"), !0;
            } catch (t) {
              return !1;
            }
          }()) {
            if ("Node" == ui()) throw new zi("internal-error", "The LocalStorage compatibility library was not found.");
            throw new zi("web-storage-unsupported");
          }

          this.a = nu() || $h.INTERNAL.node.localStorage, this.type = "localStorage";
        }

        function nu() {
          try {
            var t = h.localStorage,
                e = Si();
            return t && (t.setItem(e, "1"), t.removeItem(e)), t;
          } catch (t) {
            return null;
          }
        }

        function iu() {
          this.type = "nullStorage";
        }

        function ru() {
          if (!function () {
            var t = "Node" == ui();
            if (!(t = ou() || t && $h.INTERNAL.node && $h.INTERNAL.node.sessionStorage)) return !1;

            try {
              return t.setItem("__sak", "1"), t.removeItem("__sak"), !0;
            } catch (t) {
              return !1;
            }
          }()) {
            if ("Node" == ui()) throw new zi("internal-error", "The SessionStorage compatibility library was not found.");
            throw new zi("web-storage-unsupported");
          }

          this.a = ou() || $h.INTERNAL.node.sessionStorage, this.type = "sessionStorage";
        }

        function ou() {
          try {
            var t = h.sessionStorage,
                e = Si();
            return t && (t.setItem(e, "1"), t.removeItem(e)), t;
          } catch (t) {
            return null;
          }
        }

        function au() {
          var t = {};
          t.Browser = cu, t.Node = hu, t.ReactNative = fu, t.Worker = lu, this.a = t[ui()];
        }

        Ms.prototype.f = function (n) {
          var i = n.data.eventType,
              r = n.data.eventId,
              t = this.a[i];

          if (t && 0 < t.length) {
            n.ports[0].postMessage({
              status: "ack",
              eventId: r,
              eventType: i,
              response: null
            });
            var e = [];
            M(t, function (t) {
              e.push(zt().then(function () {
                return t(n.origin, n.data.data);
              }));
            }), Zt(e).then(function (t) {
              var e = [];
              M(t, function (t) {
                e.push({
                  fulfilled: t.Eb,
                  value: t.value,
                  reason: t.reason ? t.reason.message : void 0
                });
              }), M(e, function (t) {
                for (var e in t) void 0 === t[e] && delete t[e];
              }), n.ports[0].postMessage({
                status: "done",
                eventId: r,
                eventType: i,
                response: e
              });
            });
          }
        }, Ms.prototype.subscribe = function (t, e) {
          G(this.a) && this.b.addEventListener("message", this.c), void 0 === this.a[t] && (this.a[t] = []), this.a[t].push(e);
        }, Ms.prototype.unsubscribe = function (t, e) {
          void 0 !== this.a[t] && e ? (F(this.a[t], function (t) {
            return t == e;
          }), 0 == this.a[t].length && delete this.a[t]) : e || delete this.a[t], G(this.a) && this.b.removeEventListener("message", this.c);
        }, Vs.prototype.postMessage = function (t, e) {
          this.a.postMessage(t, e);
        }, Ks.prototype.close = function () {
          for (; 0 < this.a.length;) qs(this, this.a[0]);

          this.b = !0;
        }, (t = Hs.prototype).set = function (n, i) {
          var r,
              o = !1,
              a = this;
          return Gs(this).then(function (t) {
            return zs((t = Xs(Js(r = t, !0))).get(n));
          }).then(function (t) {
            var e = Xs(Js(r, !0));
            return t ? (t.value = i, zs(e.put(t))) : (a.b++, o = !0, (t = {}).fbase_key = n, t.value = i, zs(e.add(t)));
          }).then(function () {
            return a.c[n] = i, Ys(a, n);
          }).ia(function () {
            o && a.b--;
          });
        }, t.get = function (e) {
          return Gs(this).then(function (t) {
            return zs(Xs(Js(t, !1)).get(e));
          }).then(function (t) {
            return t && t.value;
          });
        }, t.P = function (e) {
          var n = !1,
              i = this;
          return Gs(this).then(function (t) {
            return n = !0, i.b++, zs(Xs(Js(t, !0)).delete(e));
          }).then(function () {
            return delete i.c[e], Ys(i, e);
          }).ia(function () {
            n && i.b--;
          });
        }, t.Y = function (t) {
          0 == this.a.length && function (t) {
            Zs(t), function e() {
              t.f = setTimeout(function () {
                t.i = $s(t).then(function (e) {
                  0 < e.length && M(t.a, function (t) {
                    t(e);
                  });
                }).then(function () {
                  e();
                }).s(function (t) {
                  "STOP_EVENT" != t.message && e();
                });
              }, 800);
            }();
          }(this), this.a.push(t);
        }, t.ca = function (e) {
          F(this.a, function (t) {
            return t == e;
          }), 0 == this.a.length && Zs(this);
        }, (t = Qs.prototype).get = function (e) {
          return this.b.then(function (t) {
            return t.get(e);
          });
        }, t.set = function (e, n) {
          return this.b.then(function (t) {
            return t.set(e, n);
          });
        }, t.P = function (e) {
          return this.b.then(function (t) {
            return t.P(e);
          });
        }, t.Y = function (t) {
          this.a.push(t);
        }, t.ca = function (e) {
          F(this.a, function (t) {
            return t == e;
          });
        }, (t = tu.prototype).get = function (t) {
          return zt(this.a[t]);
        }, t.set = function (t, e) {
          return this.a[t] = e, zt();
        }, t.P = function (t) {
          return delete this.a[t], zt();
        }, t.Y = function () {}, t.ca = function () {}, (t = eu.prototype).get = function (t) {
          var e = this;
          return zt().then(function () {
            return Ei(e.a.getItem(t));
          });
        }, t.set = function (e, n) {
          var i = this;
          return zt().then(function () {
            var t = Ti(n);
            null === t ? i.P(e) : i.a.setItem(e, t);
          });
        }, t.P = function (t) {
          var e = this;
          return zt().then(function () {
            e.a.removeItem(t);
          });
        }, t.Y = function (t) {
          h.window && Be(h.window, "storage", t);
        }, t.ca = function (t) {
          h.window && Xe(h.window, "storage", t);
        }, (t = iu.prototype).get = function () {
          return zt(null);
        }, t.set = function () {
          return zt();
        }, t.P = function () {
          return zt();
        }, t.Y = function () {}, t.ca = function () {}, (t = ru.prototype).get = function (t) {
          var e = this;
          return zt().then(function () {
            return Ei(e.a.getItem(t));
          });
        }, t.set = function (e, n) {
          var i = this;
          return zt().then(function () {
            var t = Ti(n);
            null === t ? i.P(e) : i.a.setItem(e, t);
          });
        }, t.P = function (t) {
          var e = this;
          return zt().then(function () {
            e.a.removeItem(t);
          });
        }, t.Y = function () {}, t.ca = function () {};
        var su,
            uu,
            cu = {
          B: eu,
          Sa: ru
        },
            hu = {
          B: eu,
          Sa: ru
        },
            fu = {
          B: xs,
          Sa: iu
        },
            lu = {
          B: eu,
          Sa: iu
        },
            du = {
          Xc: "local",
          NONE: "none",
          Zc: "session"
        };

        function pu() {
          var t = !(Ai(vi()) || !ai()),
              e = Ii(),
              n = gi();
          this.o = t, this.h = e, this.m = n, this.a = {}, t = su = su || new au();

          try {
            this.g = !Yn() && Ci() || !h.indexedDB ? new t.a.B() : new Qs(si() ? new tu() : new t.a.B());
          } catch (t) {
            this.g = new tu(), this.h = !0;
          }

          try {
            this.i = new t.a.Sa();
          } catch (t) {
            this.i = new tu();
          }

          this.l = new tu(), this.f = I(this.Nb, this), this.b = {};
        }

        function vu() {
          return uu = uu || new pu();
        }

        function mu(t, e) {
          switch (e) {
            case "session":
              return t.i;

            case "none":
              return t.l;

            default:
              return t.g;
          }
        }

        function gu(t, e) {
          return "firebase:" + t.name + (e ? ":" + e : "");
        }

        function bu(t, e, n) {
          return n = gu(e, n), "local" == e.B && (t.b[n] = null), mu(t, e.B).P(n);
        }

        function yu(t) {
          t.c && (clearInterval(t.c), t.c = null);
        }

        function wu(t) {
          this.a = t, this.b = vu();
        }

        (t = pu.prototype).get = function (t, e) {
          return mu(this, t.B).get(gu(t, e));
        }, t.set = function (e, t, n) {
          var i = gu(e, n),
              r = this,
              o = mu(this, e.B);
          return o.set(i, t).then(function () {
            return o.get(i);
          }).then(function (t) {
            "local" == e.B && (r.b[i] = t);
          });
        }, t.addListener = function (t, e, n) {
          t = gu(t, e), this.m && (this.b[t] = h.localStorage.getItem(t)), G(this.a) && (mu(this, "local").Y(this.f), this.h || (Yn() || !Ci()) && h.indexedDB || !this.m || function (i) {
            yu(i), i.c = setInterval(function () {
              for (var t in i.a) {
                var e = h.localStorage.getItem(t),
                    n = i.b[t];
                e != n && (i.b[t] = e, e = new De({
                  type: "storage",
                  key: t,
                  target: window,
                  oldValue: n,
                  newValue: e,
                  a: !0
                }), i.Nb(e));
              }
            }, 1e3);
          }(this)), this.a[t] || (this.a[t] = []), this.a[t].push(n);
        }, t.removeListener = function (t, e, n) {
          t = gu(t, e), this.a[t] && (F(this.a[t], function (t) {
            return t == n;
          }), 0 == this.a[t].length && delete this.a[t]), G(this.a) && (mu(this, "local").ca(this.f), yu(this));
        }, t.Nb = function (t) {
          if (t && t.f) {
            var e = t.a.key;
            if (null == e) for (var n in this.a) {
              var i = this.b[n];
              void 0 === i && (i = null);
              var r = h.localStorage.getItem(n);
              r !== i && (this.b[n] = r, this.Ya(n));
            } else if (0 == e.indexOf("firebase:") && this.a[e]) {
              if (void 0 !== t.a.a ? mu(this, "local").ca(this.f) : yu(this), this.o) if (n = h.localStorage.getItem(e), (i = t.a.newValue) !== n) null !== i ? h.localStorage.setItem(e, i) : h.localStorage.removeItem(e);else if (this.b[e] === i && void 0 === t.a.a) return;
              var o = this;
              n = function () {
                void 0 === t.a.a && o.b[e] === h.localStorage.getItem(e) || (o.b[e] = h.localStorage.getItem(e), o.Ya(e));
              }, me && Se && 10 == Se && h.localStorage.getItem(e) !== t.a.newValue && t.a.newValue !== t.a.oldValue ? setTimeout(n, 10) : n();
            }
          } else M(t, I(this.Ya, this));
        }, t.Ya = function (t) {
          this.a[t] && M(this.a[t], function (t) {
            t();
          });
        };
        var Iu,
            Tu = {
          name: "authEvent",
          B: "local"
        };

        function ku() {
          this.a = vu();
        }

        function Eu(t, e) {
          this.b = Su, this.f = h.Uint8Array ? new Uint8Array(this.b) : Array(this.b), this.g = this.c = 0, this.a = [], this.i = t, this.h = e, this.m = h.Int32Array ? new Int32Array(64) : Array(64), void 0 !== Iu || (Iu = h.Int32Array ? new Int32Array(Ru) : Ru), this.reset();
        }

        E(Eu, function () {
          this.b = -1;
        });

        for (var Su = 64, Au = Su - 1, Nu = [], Ou = 0; Ou < Au; Ou++) Nu[Ou] = 0;

        var _u = q(128, Nu);

        function Pu(t) {
          for (var e = t.f, n = t.m, i = 0, r = 0; r < e.length;) n[i++] = e[r] << 24 | e[r + 1] << 16 | e[r + 2] << 8 | e[r + 3], r = 4 * i;

          for (e = 16; e < 64; e++) {
            r = 0 | n[e - 15], i = 0 | n[e - 2];
            var o = (0 | n[e - 16]) + ((r >>> 7 | r << 25) ^ (r >>> 18 | r << 14) ^ r >>> 3) | 0,
                a = (0 | n[e - 7]) + ((i >>> 17 | i << 15) ^ (i >>> 19 | i << 13) ^ i >>> 10) | 0;
            n[e] = o + a | 0;
          }

          i = 0 | t.a[0], r = 0 | t.a[1];
          var s = 0 | t.a[2],
              u = 0 | t.a[3],
              c = 0 | t.a[4],
              h = 0 | t.a[5],
              f = 0 | t.a[6];

          for (o = 0 | t.a[7], e = 0; e < 64; e++) {
            var l = ((i >>> 2 | i << 30) ^ (i >>> 13 | i << 19) ^ (i >>> 22 | i << 10)) + (i & r ^ i & s ^ r & s) | 0;
            a = (o = o + ((c >>> 6 | c << 26) ^ (c >>> 11 | c << 21) ^ (c >>> 25 | c << 7)) | 0) + ((a = (a = c & h ^ ~c & f) + (0 | Iu[e]) | 0) + (0 | n[e]) | 0) | 0, o = f, f = h, h = c, c = u + a | 0, u = s, s = r, r = i, i = a + l | 0;
          }

          t.a[0] = t.a[0] + i | 0, t.a[1] = t.a[1] + r | 0, t.a[2] = t.a[2] + s | 0, t.a[3] = t.a[3] + u | 0, t.a[4] = t.a[4] + c | 0, t.a[5] = t.a[5] + h | 0, t.a[6] = t.a[6] + f | 0, t.a[7] = t.a[7] + o | 0;
        }

        function Cu(t, e, n) {
          void 0 === n && (n = e.length);
          var i = 0,
              r = t.c;
          if (f(e)) for (; i < n;) t.f[r++] = e.charCodeAt(i++), r == t.b && (Pu(t), r = 0);else {
            if (!v(e)) throw Error("message must be string or array");

            for (; i < n;) {
              var o = e[i++];
              if (!("number" == typeof o && 0 <= o && o <= 255 && o == (0 | o))) throw Error("message must be a byte array");
              t.f[r++] = o, r == t.b && (Pu(t), r = 0);
            }
          }
          t.c = r, t.g += n;
        }

        Eu.prototype.reset = function () {
          this.g = this.c = 0, this.a = h.Int32Array ? new Int32Array(this.h) : H(this.h);
        };

        var Ru = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];

        function Du() {
          Eu.call(this, 8, Lu);
        }

        E(Du, Eu);
        var Lu = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];

        function xu(t, e, n, i, r) {
          this.l = t, this.i = e, this.m = n, this.o = i || null, this.u = r || null, this.h = e + ":" + n, this.v = new ku(), this.g = new wu(this.h), this.f = null, this.b = [], this.a = this.c = null;
        }

        function Mu(t) {
          return new zi("invalid-cordova-configuration", t);
        }

        function ju(t) {
          var e = new Du();
          Cu(e, t), t = [];
          var n = 8 * e.g;
          e.c < 56 ? Cu(e, _u, 56 - e.c) : Cu(e, _u, e.b - (e.c - 56));

          for (var i = 63; 56 <= i; i--) e.f[i] = 255 & n, n /= 256;

          for (Pu(e), i = n = 0; i < e.i; i++) for (var r = 24; 0 <= r; r -= 8) t[n++] = e.a[i] >> r & 255;

          return function (t) {
            return j(t, function (t) {
              return 1 < (t = t.toString(16)).length ? t : "0" + t;
            }).join("");
          }(t);
        }

        function Uu(t, e) {
          for (var n = 0; n < t.b.length; n++) try {
            t.b[n](e);
          } catch (t) {}
        }

        function Vu(i) {
          return i.f || (i.f = i.ga().then(function () {
            return new qt(function (n) {
              i.wa(function t(e) {
                return n(e), i.La(t), !1;
              }), function (r) {
                function e(i) {
                  t = !0, n && n.cancel(), Ku(r).then(function (t) {
                    var e = o;

                    if (t && i && i.url) {
                      var n = null;
                      -1 != (e = Dr(i.url)).indexOf("/__/auth/callback") && (n = (n = "object" == typeof (n = Ei(wn(n = In(e), "firebaseError") || null)) ? Yi(n) : null) ? new fo(t.c, t.b, null, null, n) : new fo(t.c, t.b, e, t.f)), e = n || o;
                    }

                    Uu(r, e);
                  });
                }

                var o = new fo("unknown", null, null, null, new zi("no-auth-event")),
                    t = !1,
                    n = un(500).then(function () {
                  return Ku(r).then(function () {
                    t || Uu(r, o);
                  });
                }),
                    i = h.handleOpenURL;
                h.handleOpenURL = function (t) {
                  if (0 == t.toLowerCase().indexOf(mi("BuildInfo.packageName", h).toLowerCase() + "://") && e({
                    url: t
                  }), "function" == typeof i) try {
                    i(t);
                  } catch (t) {
                    console.error(t);
                  }
                }, mo = mo || new po(), mo.subscribe(e);
              }(i);
            });
          })), i.f;
        }

        function Ku(e) {
          var n = null;
          return function (t) {
            return t.b.get(Tu, t.a).then(function (t) {
              return lo(t);
            });
          }(e.g).then(function (t) {
            return n = t, bu((t = e.g).b, Tu, t.a);
          }).then(function () {
            return n;
          });
        }

        function Fu(t) {
          this.a = t, this.b = vu();
        }

        (t = xu.prototype).ga = function () {
          return this.za ? this.za : this.za = (oi(void 0) ? ri().then(function () {
            return new qt(function (t, e) {
              var n = h.document,
                  i = setTimeout(function () {
                e(Error("Cordova framework is not ready."));
              }, 1e3);
              n.addEventListener("deviceready", function () {
                clearTimeout(i), t();
              }, !1);
            });
          }) : Yt(Error("Cordova must run in an Android or iOS file scheme."))).then(function () {
            if ("function" != typeof mi("universalLinks.subscribe", h)) throw Mu("cordova-universal-links-plugin-fix is not installed");
            if (void 0 === mi("BuildInfo.packageName", h)) throw Mu("cordova-plugin-buildinfo is not installed");
            if ("function" != typeof mi("cordova.plugins.browsertab.openUrl", h)) throw Mu("cordova-plugin-browsertab is not installed");
            if ("function" != typeof mi("cordova.InAppBrowser.open", h)) throw Mu("cordova-plugin-inappbrowser is not installed");
          }, function () {
            throw new zi("cordova-not-ready");
          });
        }, t.Ea = function (t, e) {
          return e(new zi("operation-not-supported-in-this-environment")), zt();
        }, t.Db = function () {
          return Yt(new zi("operation-not-supported-in-this-environment"));
        }, t.Ob = function () {
          return !1;
        }, t.Mb = function () {
          return !0;
        }, t.Hb = function () {
          return !0;
        }, t.Ca = function (t, e, n) {
          if (this.c) return Yt(new zi("redirect-operation-pending"));
          var i = this,
              r = h.document,
              o = null,
              a = null,
              s = null,
              u = null;
          return this.c = zt().then(function () {
            return ho(e), Vu(i);
          }).then(function () {
            return function (n, t, e, i) {
              var r = function () {
                for (var t = 20, e = []; 0 < t;) e.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62 * Math.random()))), t--;

                return e.join("");
              }(),
                  o = new fo(t, i, null, r, new zi("no-auth-event")),
                  a = mi("BuildInfo.packageName", h);

              if ("string" != typeof a) throw new zi("invalid-cordova-configuration");
              var s = mi("BuildInfo.displayName", h),
                  u = {};
              if (vi().toLowerCase().match(/iphone|ipad|ipod/)) u.ibi = a;else {
                if (!vi().toLowerCase().match(/android/)) return Yt(new zi("operation-not-supported-in-this-environment"));
                u.apn = a;
              }
              s && (u.appDisplayName = s), r = ju(r), u.sessionId = r;
              var c = Ls(n.l, n.i, n.m, t, e, null, i, n.o, u, n.u);
              return n.ga().then(function () {
                var t = n.h;
                return n.v.a.set(Tu, o.w(), t);
              }).then(function () {
                var t = mi("cordova.plugins.browsertab.isAvailable", h);
                if ("function" != typeof t) throw new zi("invalid-cordova-configuration");
                var e = null;
                t(function (t) {
                  if (t) {
                    if ("function" != typeof (e = mi("cordova.plugins.browsertab.openUrl", h))) throw new zi("invalid-cordova-configuration");
                    e(c);
                  } else {
                    if ("function" != typeof (e = mi("cordova.InAppBrowser.open", h))) throw new zi("invalid-cordova-configuration");
                    t = vi(), n.a = e(c, t.match(/(iPad|iPhone|iPod).*OS 7_\d/i) || t.match(/(iPad|iPhone|iPod).*OS 8_\d/i) ? "_blank" : "_system", "location=yes");
                  }
                });
              });
            }(i, t, e, n);
          }).then(function () {
            return new qt(function (e, t) {
              a = function () {
                var t = mi("cordova.plugins.browsertab.close", h);
                return e(), "function" == typeof t && t(), i.a && "function" == typeof i.a.close && (i.a.close(), i.a = null), !1;
              }, i.wa(a), s = function () {
                o = o || un(2e3).then(function () {
                  t(new zi("redirect-cancelled-by-user"));
                });
              }, u = function () {
                _i() && s();
              }, r.addEventListener("resume", s, !1), vi().toLowerCase().match(/android/) || r.addEventListener("visibilitychange", u, !1);
            }).s(function (t) {
              return Ku(i).then(function () {
                throw t;
              });
            });
          }).ia(function () {
            s && r.removeEventListener("resume", s, !1), u && r.removeEventListener("visibilitychange", u, !1), o && o.cancel(), a && i.La(a), i.c = null;
          });
        }, t.wa = function (e) {
          this.b.push(e), Vu(this).s(function (t) {
            "auth/invalid-cordova-configuration" === t.code && (t = new fo("unknown", null, null, null, new zi("no-auth-event")), e(t));
          });
        }, t.La = function (e) {
          F(this.b, function (t) {
            return t == e;
          });
        };
        var qu = {
          name: "pendingRedirect",
          B: "session"
        };

        function Hu(t) {
          return bu(t.b, qu, t.a);
        }

        function Bu(t, e, n) {
          this.i = {}, this.u = 0, this.A = t, this.l = e, this.o = n, this.h = [], this.f = !1, this.m = I(this.cb, this), this.b = new tc(), this.v = new rc(), this.g = new Fu(this.l + ":" + this.o), this.c = {}, this.c.unknown = this.b, this.c.signInViaRedirect = this.b, this.c.linkViaRedirect = this.b, this.c.reauthViaRedirect = this.b, this.c.signInViaPopup = this.v, this.c.linkViaPopup = this.v, this.c.reauthViaPopup = this.v, this.a = Gu(this.A, this.l, this.o, mr);
        }

        function Gu(t, e, n, i) {
          var r = $h.SDK_VERSION || null;
          return oi() ? new xu(t, e, n, r, i) : new Ps(t, e, n, r, i);
        }

        function Wu(e) {
          e.f || (e.f = !0, e.a.wa(e.m));
          var n = e.a;
          return e.a.ga().s(function (t) {
            throw e.a == n && e.reset(), t;
          });
        }

        function Xu(n) {
          n.a.Mb() && Wu(n).s(function (t) {
            var e = new fo("unknown", null, null, null, new zi("operation-not-supported-in-this-environment"));
            $u(t) && n.cb(e);
          }), n.a.Hb() || ec(n.b);
        }

        (t = Bu.prototype).reset = function () {
          this.f = !1, this.a.La(this.m), this.a = Gu(this.A, this.l, this.o), this.i = {};
        }, t.Za = function () {
          this.b.Za();
        }, t.subscribe = function (t) {
          if (V(this.h, t) || this.h.push(t), !this.f) {
            var n = this;
            (function (t) {
              return t.b.get(qu, t.a).then(function (t) {
                return "pending" == t;
              });
            })(this.g).then(function (t) {
              t ? Hu(n.g).then(function () {
                Wu(n).s(function (t) {
                  var e = new fo("unknown", null, null, null, new zi("operation-not-supported-in-this-environment"));
                  $u(t) && n.cb(e);
                });
              }) : Xu(n);
            }).s(function () {
              Xu(n);
            });
          }
        }, t.unsubscribe = function (e) {
          F(this.h, function (t) {
            return t == e;
          });
        }, t.cb = function (t) {
          if (!t) throw new zi("invalid-auth-event");
          if (6e5 <= k() - this.u && (this.i = {}, this.u = 0), t && t.getUid() && this.i.hasOwnProperty(t.getUid())) return !1;

          for (var e = !1, n = 0; n < this.h.length; n++) {
            var i = this.h[n];

            if (i.xb(t.c, t.b)) {
              (e = this.c[t.c]) && (e.h(t, i), t && (t.f || t.b) && (this.i[t.getUid()] = !0, this.u = k())), e = !0;
              break;
            }
          }

          return ec(this.b), e;
        };
        var Ju = new Oi(2e3, 1e4),
            zu = new Oi(3e4, 6e4);

        function Yu(t, e, n, i, r, o) {
          return t.a.Db(e, n, i, function () {
            t.f || (t.f = !0, t.a.wa(t.m));
          }, function () {
            t.reset();
          }, r, o);
        }

        function $u(t) {
          return !(!t || "auth/cordova-not-ready" != t.code);
        }

        Bu.prototype.fa = function () {
          return this.b.fa();
        }, Bu.prototype.Ca = function (t, e, n) {
          var i,
              r = this;
          return function (t) {
            return t.b.set(qu, "pending", t.a);
          }(this.g).then(function () {
            return r.a.Ca(t, e, n).s(function (t) {
              if ($u(t)) throw new zi("operation-not-supported-in-this-environment");
              return i = t, Hu(r.g).then(function () {
                throw i;
              });
            }).then(function () {
              return r.a.Ob() ? new qt(function () {}) : Hu(r.g).then(function () {
                return r.fa();
              }).then(function () {}).s(function () {});
            });
          });
        }, Bu.prototype.Ea = function (e, n, t, i) {
          return this.a.Ea(t, function (t) {
            e.ha(n, null, t, i);
          }, Ju.get());
        };
        var Zu = {};

        function Qu(t, e, n) {
          var i = e + ":" + n;
          return Zu[i] || (Zu[i] = new Bu(t, e, n)), Zu[i];
        }

        function tc() {
          this.b = null, this.f = [], this.c = [], this.a = null, this.i = this.g = !1;
        }

        function ec(t) {
          t.g || (t.g = !0, ic(t, !1, null, null));
        }

        function nc(t, e) {
          if (t.b = function () {
            return zt(e);
          }, t.f.length) for (var n = 0; n < t.f.length; n++) t.f[n](e);
        }

        function ic(t, e, n, i) {
          e ? i ? function (t, e) {
            if (t.b = function () {
              return Yt(e);
            }, t.c.length) for (var n = 0; n < t.c.length; n++) t.c[n](e);
          }(t, i) : nc(t, n) : nc(t, {
            user: null
          }), t.f = [], t.c = [];
        }

        function rc() {}

        function oc() {
          this.ub = !1, Object.defineProperty(this, "appVerificationDisabled", {
            get: function () {
              return this.ub;
            },
            set: function (t) {
              this.ub = t;
            },
            enumerable: !1
          });
        }

        function ac(t, e) {
          this.a = e, Mi(this, "verificationId", t);
        }

        function sc(t, e, n, i) {
          return new so(t).Va(e, n).then(function (t) {
            return new ac(t, i);
          });
        }

        function uc(t) {
          var e = vr(t);
          if (!(e && e.exp && e.auth_time && e.iat)) throw new zi("internal-error", "An internal error occurred. The token obtained by Firebase appears to be malformed. Please retry the operation.");
          ji(this, {
            token: t,
            expirationTime: Pi(1e3 * e.exp),
            authTime: Pi(1e3 * e.auth_time),
            issuedAtTime: Pi(1e3 * e.iat),
            signInProvider: e.firebase && e.firebase.sign_in_provider ? e.firebase.sign_in_provider : null,
            claims: e
          });
        }

        function cc(t, e, n) {
          if (this.h = t, this.i = e, this.g = n, this.c = 3e4, this.f = 96e4, this.b = null, this.a = this.c, this.f < this.c) throw Error("Proactive refresh lower bound greater than upper bound!");
        }

        function hc(t, e) {
          return e ? (t.a = t.c, t.g()) : (e = t.a, t.a *= 2, t.a > t.f && (t.a = t.f), e);
        }

        function fc(t) {
          this.f = t, this.b = this.a = null, this.c = 0;
        }

        function lc(t, e) {
          var n = e[Ea],
              i = e.refreshToken;
          e = dc(e.expiresIn), t.b = n, t.c = e, t.a = i;
        }

        function dc(t) {
          return k() + 1e3 * parseInt(t, 10);
        }

        function pc(e, t) {
          return function (t, i) {
            return new qt(function (e, n) {
              "refresh_token" == i.grant_type && i.refresh_token || "authorization_code" == i.grant_type && i.code ? Ca(t, t.i + "?key=" + encodeURIComponent(t.b), function (t) {
                t ? t.error ? n(Is(t)) : t.access_token && t.refresh_token ? e(t) : n(new zi("internal-error")) : n(new zi("network-request-failed"));
              }, "POST", Dn(i).toString(), t.f, t.m.get()) : n(new zi("internal-error"));
            });
          }(e.f, t).then(function (t) {
            return e.b = t.access_token, e.c = dc(t.expires_in), e.a = t.refresh_token, {
              accessToken: e.b,
              expirationTime: e.c,
              refreshToken: e.a
            };
          }).s(function (t) {
            throw "auth/user-token-expired" == t.code && (e.a = null), t;
          });
        }

        function vc(t, e) {
          this.a = t || null, this.b = e || null, ji(this, {
            lastSignInTime: Pi(e || null),
            creationTime: Pi(t || null)
          });
        }

        function mc(t, e, n, i, r, o) {
          ji(this, {
            uid: t,
            displayName: i || null,
            photoURL: r || null,
            email: n || null,
            phoneNumber: o || null,
            providerId: e
          });
        }

        function gc(t, e) {
          for (var n in Re.call(this, t), e) this[n] = e[n];
        }

        function bc(t, e, n) {
          this.G = [], this.l = t.apiKey, this.o = t.appName, this.u = t.authDomain || null, t = $h.SDK_VERSION ? pi($h.SDK_VERSION) : null, this.c = new Ta(this.l, br(mr), t), this.h = new fc(this.c), Sc(this, e[Ea]), lc(this.h, e), Mi(this, "refreshToken", this.h.a), Oc(this, n || {}), nn.call(this), this.I = !1, this.u && bi() && (this.a = Qu(this.u, this.l, this.o)), this.N = [], this.i = null, this.A = function (e) {
            return new cc(function () {
              return e.F(!0);
            }, function (t) {
              return !(!t || "auth/network-request-failed" != t.code);
            }, function () {
              var t = e.h.c - k() - 3e5;
              return 0 < t ? t : 0;
            });
          }(this), this.V = I(this.Ha, this);
          var i = this;
          this.ka = null, this.ta = function (t) {
            i.pa(t.g);
          }, this.X = null, this.O = [], this.sa = function (t) {
            wc(i, t.c);
          }, this.W = null;
        }

        function yc(t, e) {
          t.X && Xe(t.X, "languageCodeChanged", t.ta), (t.X = e) && Be(e, "languageCodeChanged", t.ta);
        }

        function wc(t, e) {
          t.O = e, Pa(t.c, $h.SDK_VERSION ? pi($h.SDK_VERSION, t.O) : null);
        }

        function Ic(t, e) {
          t.W && Xe(t.W, "frameworkChanged", t.sa), (t.W = e) && Be(e, "frameworkChanged", t.sa);
        }

        function Tc(e) {
          try {
            return $h.app(e.o).auth();
          } catch (t) {
            throw new zi("internal-error", "No firebase.auth.Auth instance is available for the Firebase App '" + e.o + "'!");
          }
        }

        function kc(t) {
          t.D || t.A.b || (t.A.start(), Xe(t, "tokenChanged", t.V), Be(t, "tokenChanged", t.V));
        }

        function Ec(t) {
          Xe(t, "tokenChanged", t.V), t.A.stop();
        }

        function Sc(t, e) {
          t.ra = e, Mi(t, "_lat", e);
        }

        function Ac(t) {
          for (var e = [], n = 0; n < t.N.length; n++) e.push(t.N[n](t));

          return Zt(e).then(function () {
            return t;
          });
        }

        function Nc(t) {
          t.a && !t.I && (t.I = !0, t.a.subscribe(t));
        }

        function Oc(t, e) {
          ji(t, {
            uid: e.uid,
            displayName: e.displayName || null,
            photoURL: e.photoURL || null,
            email: e.email || null,
            emailVerified: e.emailVerified || !1,
            phoneNumber: e.phoneNumber || null,
            isAnonymous: e.isAnonymous || !1,
            metadata: new vc(e.createdAt, e.lastLoginAt),
            providerData: []
          });
        }

        function _c() {}

        function Pc(t) {
          return zt().then(function () {
            if (t.D) throw new zi("app-deleted");
          });
        }

        function Cc(t) {
          return j(t.providerData, function (t) {
            return t.providerId;
          });
        }

        function Rc(t, e) {
          e && (Dc(t, e.providerId), t.providerData.push(e));
        }

        function Dc(t, e) {
          F(t.providerData, function (t) {
            return t.providerId == e;
          });
        }

        function Lc(t, e, n) {
          ("uid" != e || n) && t.hasOwnProperty(e) && Mi(t, e, n);
        }

        function xc(e, t) {
          e != t && (ji(e, {
            uid: t.uid,
            displayName: t.displayName,
            photoURL: t.photoURL,
            email: t.email,
            emailVerified: t.emailVerified,
            phoneNumber: t.phoneNumber,
            isAnonymous: t.isAnonymous,
            providerData: []
          }), t.metadata ? Mi(e, "metadata", function (t) {
            return new vc(t.a, t.b);
          }(t.metadata)) : Mi(e, "metadata", new vc()), M(t.providerData, function (t) {
            Rc(e, t);
          }), function (t, e) {
            t.b = e.b, t.a = e.a, t.c = e.c;
          }(e.h, t.h), Mi(e, "refreshToken", e.h.a));
        }

        function Mc(n) {
          return n.F().then(function (t) {
            var e = n.isAnonymous;
            return function (t, e) {
              return ys(t.c, ts, {
                idToken: e
              }).then(I(t.wc, t));
            }(n, t).then(function () {
              return e || Lc(n, "isAnonymous", !1), t;
            });
          });
        }

        function jc(t, e) {
          e[Ea] && t.ra != e[Ea] && (lc(t.h, e), t.dispatchEvent(new gc("tokenChanged")), Sc(t, e[Ea]), Lc(t, "refreshToken", t.h.a));
        }

        function Uc(t, e) {
          return Mc(t).then(function () {
            if (V(Cc(t), e)) return Ac(t).then(function () {
              throw new zi("provider-already-linked");
            });
          });
        }

        function Vc(t, e, n) {
          return Ui({
            user: t,
            credential: co(e),
            additionalUserInfo: e = kr(e),
            operationType: n
          });
        }

        function Kc(t, e) {
          return jc(t, e), t.reload().then(function () {
            return t;
          });
        }

        function Fc(n, i, t, e, r) {
          if (!bi()) return Yt(new zi("operation-not-supported-in-this-environment"));
          if (n.i && !r) return Yt(n.i);
          var o = Tr(t.providerId),
              a = Si(n.uid + ":::"),
              s = null;
          (!Ii() || ai()) && n.u && t.isOAuthProvider && (s = Ls(n.u, n.l, n.o, i, t, null, a, $h.SDK_VERSION || null));
          var u = ei(s, o && o.Ba, o && o.Aa);
          return e = e().then(function () {
            if (Hc(n), !r) return n.F().then(function () {});
          }).then(function () {
            return Yu(n.a, u, i, t, a, !!s);
          }).then(function () {
            return new qt(function (t, e) {
              n.ha(i, null, new zi("cancelled-popup-request"), n.g || null), n.f = t, n.v = e, n.g = a, n.b = n.a.Ea(n, i, u, a);
            });
          }).then(function (t) {
            return u && ti(u), t ? Ui(t) : null;
          }).s(function (t) {
            throw u && ti(u), t;
          }), Bc(n, e, r);
        }

        function qc(e, t, n, i, r) {
          if (!bi()) return Yt(new zi("operation-not-supported-in-this-environment"));
          if (e.i && !r) return Yt(e.i);
          var o = null,
              a = Si(e.uid + ":::");
          return i = i().then(function () {
            if (Hc(e), !r) return e.F().then(function () {});
          }).then(function () {
            return e.aa = a, Ac(e);
          }).then(function (t) {
            return e.ba && (t = (t = e.ba).b.set(Xc, e.w(), t.a)), t;
          }).then(function () {
            return e.a.Ca(t, n, a);
          }).s(function (t) {
            if (o = t, e.ba) return Jc(e.ba);
            throw o;
          }).then(function () {
            if (o) throw o;
          }), Bc(e, i, r);
        }

        function Hc(t) {
          if (!t.a || !t.I) {
            if (t.a && !t.I) throw new zi("internal-error");
            throw new zi("auth-domain-config-required");
          }
        }

        function Bc(t, e, n) {
          var i = function (e, t, n) {
            return e.i && !n ? (t.cancel(), Yt(e.i)) : t.s(function (t) {
              throw !t || "auth/user-disabled" != t.code && "auth/user-token-expired" != t.code || (e.i || e.dispatchEvent(new gc("userInvalidated")), e.i = t), t;
            });
          }(t, e, n);

          return t.G.push(i), i.ia(function () {
            K(t.G, i);
          }), i;
        }

        function Gc(t) {
          if (!t.apiKey) return null;
          var e = {
            apiKey: t.apiKey,
            authDomain: t.authDomain,
            appName: t.appName
          },
              n = {};
          if (!(t.stsTokenManager && t.stsTokenManager.accessToken && t.stsTokenManager.expirationTime)) return null;
          n[Ea] = t.stsTokenManager.accessToken, n.refreshToken = t.stsTokenManager.refreshToken || null, n.expiresIn = (t.stsTokenManager.expirationTime - k()) / 1e3;
          var i = new bc(e, n, t);
          return t.providerData && M(t.providerData, function (t) {
            t && Rc(i, Ui(t));
          }), t.redirectEventId && (i.aa = t.redirectEventId), i;
        }

        function Wc(t) {
          this.a = t, this.b = vu();
        }

        tc.prototype.reset = function () {
          this.b = null, this.a && (this.a.cancel(), this.a = null);
        }, tc.prototype.h = function (t, e) {
          if (t) {
            this.reset(), this.g = !0;
            var n = t.c,
                i = t.b,
                r = t.a && "auth/web-storage-unsupported" == t.a.code,
                o = t.a && "auth/operation-not-supported-in-this-environment" == t.a.code;
            this.i = !(!r && !o), "unknown" != n || r || o ? t.a ? (ic(this, !0, null, t.a), zt()) : e.xa(n, i) ? function (e, t, n) {
              n = n.xa(t.c, t.b);
              var i = t.g,
                  r = t.f,
                  o = t.h,
                  a = !!t.c.match(/Redirect$/);
              n(i, r, o).then(function (t) {
                ic(e, a, t, null);
              }).s(function (t) {
                ic(e, a, null, t);
              });
            }(this, t, e) : Yt(new zi("invalid-auth-event")) : (ic(this, !1, null, null), zt());
          } else Yt(new zi("invalid-auth-event"));
        }, tc.prototype.Za = function () {
          this.g && !this.i && ic(this, !1, null, null);
        }, tc.prototype.fa = function () {
          var n = this;
          return new qt(function (t, e) {
            n.b ? n.b().then(t, e) : (n.f.push(t), n.c.push(e), function (t) {
              var e = new zi("timeout");
              t.a && t.a.cancel(), t.a = un(zu.get()).then(function () {
                t.b || (t.g = !0, ic(t, !0, null, e));
              });
            }(n));
          });
        }, rc.prototype.h = function (t, e) {
          if (t) {
            var n = t.c,
                i = t.b;
            t.a ? (e.ha(t.c, null, t.a, t.b), zt()) : e.xa(n, i) ? function (t, e) {
              var n = t.b,
                  i = t.c;
              e.xa(i, n)(t.g, t.f, t.h).then(function (t) {
                e.ha(i, t, null, n);
              }).s(function (t) {
                e.ha(i, null, t, n);
              });
            }(t, e) : Yt(new zi("invalid-auth-event"));
          } else Yt(new zi("invalid-auth-event"));
        }, ac.prototype.confirm = function (t) {
          return t = uo(this.verificationId, t), this.a(t);
        }, cc.prototype.start = function () {
          this.a = this.c, function e(n, t) {
            n.stop();
            n.b = un(hc(n, t)).then(function () {
              return e = h.document, n = null, _i() || !e ? zt() : new qt(function (t) {
                n = function () {
                  _i() && (e.removeEventListener("visibilitychange", n, !1), t());
                }, e.addEventListener("visibilitychange", n, !1);
              }).s(function (t) {
                throw e.removeEventListener("visibilitychange", n, !1), t;
              });
              var e, n;
            }).then(function () {
              return n.h();
            }).then(function () {
              e(n, !0);
            }).s(function (t) {
              n.i(t) && e(n, !1);
            });
          }(this, !0);
        }, cc.prototype.stop = function () {
          this.b && (this.b.cancel(), this.b = null);
        }, fc.prototype.w = function () {
          return {
            apiKey: this.f.b,
            refreshToken: this.a,
            accessToken: this.b,
            expirationTime: this.c
          };
        }, fc.prototype.getToken = function (t) {
          return t = !!t, this.b && !this.a ? Yt(new zi("user-token-expired")) : t || !this.b || k() > this.c - 3e4 ? this.a ? pc(this, {
            grant_type: "refresh_token",
            refresh_token: this.a
          }) : zt(null) : zt({
            accessToken: this.b,
            expirationTime: this.c,
            refreshToken: this.a
          });
        }, vc.prototype.w = function () {
          return {
            lastLoginAt: this.b,
            createdAt: this.a
          };
        }, E(gc, Re), E(bc, nn), bc.prototype.pa = function (t) {
          this.ka = t, _a(this.c, t);
        }, bc.prototype.ea = function () {
          return this.ka;
        }, bc.prototype.ya = function () {
          return H(this.O);
        }, bc.prototype.Ha = function () {
          this.A.b && (this.A.stop(), this.A.start());
        }, Mi(bc.prototype, "providerId", "firebase"), (t = bc.prototype).reload = function () {
          var t = this;
          return Bc(this, Pc(this).then(function () {
            return Mc(t).then(function () {
              return Ac(t);
            }).then(_c);
          }));
        }, t.ac = function (t) {
          return this.F(t).then(function (t) {
            return new uc(t);
          });
        }, t.F = function (t) {
          var e = this;
          return Bc(this, Pc(this).then(function () {
            return e.h.getToken(t);
          }).then(function (t) {
            if (!t) throw new zi("internal-error");
            return t.accessToken != e.ra && (Sc(e, t.accessToken), e.dispatchEvent(new gc("tokenChanged"))), Lc(e, "refreshToken", t.refreshToken), t.accessToken;
          }));
        }, t.wc = function (t) {
          if (!(t = t.users) || !t.length) throw new zi("internal-error");
          Oc(this, {
            uid: (t = t[0]).localId,
            displayName: t.displayName,
            photoURL: t.photoUrl,
            email: t.email,
            emailVerified: !!t.emailVerified,
            phoneNumber: t.phoneNumber,
            lastLoginAt: t.lastLoginAt,
            createdAt: t.createdAt
          });

          for (var e = function (t) {
            return (t = t.providerUserInfo) && t.length ? j(t, function (t) {
              return new mc(t.rawId, t.providerId, t.email, t.displayName, t.photoUrl, t.phoneNumber);
            }) : [];
          }(t), n = 0; n < e.length; n++) Rc(this, e[n]);

          Lc(this, "isAnonymous", !(this.email && t.passwordHash || this.providerData && this.providerData.length));
        }, t.xc = function (t) {
          return Li("firebase.User.prototype.reauthenticateAndRetrieveDataWithCredential is deprecated. Please use firebase.User.prototype.reauthenticateWithCredential instead."), this.hb(t);
        }, t.hb = function (t) {
          var e = this,
              n = null;
          return Bc(this, t.f(this.c, this.uid).then(function (t) {
            return jc(e, t), n = Vc(e, t, "reauthenticate"), e.i = null, e.reload();
          }).then(function () {
            return n;
          }), !0);
        }, t.oc = function (t) {
          return Li("firebase.User.prototype.linkAndRetrieveDataWithCredential is deprecated. Please use firebase.User.prototype.linkWithCredential instead."), this.fb(t);
        }, t.fb = function (e) {
          var n = this,
              i = null;
          return Bc(this, Uc(this, e.providerId).then(function () {
            return n.F();
          }).then(function (t) {
            return e.b(n.c, t);
          }).then(function (t) {
            return i = Vc(n, t, "link"), Kc(n, t);
          }).then(function () {
            return i;
          }));
        }, t.pc = function (t, e) {
          var n = this;
          return Bc(this, Uc(this, "phone").then(function () {
            return sc(Tc(n), t, e, I(n.fb, n));
          }));
        }, t.yc = function (t, e) {
          var n = this;
          return Bc(this, zt().then(function () {
            return sc(Tc(n), t, e, I(n.hb, n));
          }), !0);
        }, t.rb = function (e) {
          var n = this;
          return Bc(this, this.F().then(function (t) {
            return n.c.rb(t, e);
          }).then(function (t) {
            return jc(n, t), n.reload();
          }));
        }, t.Pc = function (e) {
          var n = this;
          return Bc(this, this.F().then(function (t) {
            return e.b(n.c, t);
          }).then(function (t) {
            return jc(n, t), n.reload();
          }));
        }, t.sb = function (e) {
          var n = this;
          return Bc(this, this.F().then(function (t) {
            return n.c.sb(t, e);
          }).then(function (t) {
            return jc(n, t), n.reload();
          }));
        }, t.tb = function (e) {
          if (void 0 === e.displayName && void 0 === e.photoURL) return Pc(this);
          var n = this;
          return Bc(this, this.F().then(function (t) {
            return n.c.tb(t, {
              displayName: e.displayName,
              photoUrl: e.photoURL
            });
          }).then(function (t) {
            return jc(n, t), Lc(n, "displayName", t.displayName || null), Lc(n, "photoURL", t.photoUrl || null), M(n.providerData, function (t) {
              "password" === t.providerId && (Mi(t, "displayName", n.displayName), Mi(t, "photoURL", n.photoURL));
            }), Ac(n);
          }).then(_c));
        }, t.Nc = function (e) {
          var n = this;
          return Bc(this, Mc(this).then(function (t) {
            return V(Cc(n), e) ? function (t, e, n) {
              return ys(t, $a, {
                idToken: e,
                deleteProvider: n
              });
            }(n.c, t, [e]).then(function (t) {
              var e = {};
              return M(t.providerUserInfo || [], function (t) {
                e[t.providerId] = !0;
              }), M(Cc(n), function (t) {
                e[t] || Dc(n, t);
              }), e[so.PROVIDER_ID] || Mi(n, "phoneNumber", null), Ac(n);
            }) : Ac(n).then(function () {
              throw new zi("no-such-provider");
            });
          }));
        }, t.delete = function () {
          var e = this;
          return Bc(this, this.F().then(function (t) {
            return ys(e.c, Ya, {
              idToken: t
            });
          }).then(function () {
            e.dispatchEvent(new gc("userDeleted"));
          })).then(function () {
            for (var t = 0; t < e.G.length; t++) e.G[t].cancel("app-deleted");

            yc(e, null), Ic(e, null), e.G = [], e.D = !0, Ec(e), Mi(e, "refreshToken", null), e.a && e.a.unsubscribe(e);
          });
        }, t.xb = function (t, e) {
          return !!("linkViaPopup" == t && (this.g || null) == e && this.f || "reauthViaPopup" == t && (this.g || null) == e && this.f || "linkViaRedirect" == t && (this.aa || null) == e || "reauthViaRedirect" == t && (this.aa || null) == e);
        }, t.ha = function (t, e, n, i) {
          "linkViaPopup" != t && "reauthViaPopup" != t || i != (this.g || null) || (n && this.v ? this.v(n) : e && !n && this.f && this.f(e), this.b && (this.b.cancel(), this.b = null), delete this.f, delete this.v);
        }, t.xa = function (t, e) {
          return "linkViaPopup" == t && e == (this.g || null) ? I(this.Bb, this) : "reauthViaPopup" == t && e == (this.g || null) ? I(this.Cb, this) : "linkViaRedirect" == t && (this.aa || null) == e ? I(this.Bb, this) : "reauthViaRedirect" == t && (this.aa || null) == e ? I(this.Cb, this) : null;
        }, t.qc = function (t) {
          var e = this;
          return Fc(this, "linkViaPopup", t, function () {
            return Uc(e, t.providerId).then(function () {
              return Ac(e);
            });
          }, !1);
        }, t.zc = function (t) {
          return Fc(this, "reauthViaPopup", t, function () {
            return zt();
          }, !0);
        }, t.rc = function (t) {
          var e = this;
          return qc(this, "linkViaRedirect", t, function () {
            return Uc(e, t.providerId);
          }, !1);
        }, t.Ac = function (t) {
          return qc(this, "reauthViaRedirect", t, function () {
            return zt();
          }, !0);
        }, t.Bb = function (e, n, i) {
          var r = this;
          this.b && (this.b.cancel(), this.b = null);
          var o = null,
              t = this.F().then(function (t) {
            return Ha(r.c, {
              requestUri: e,
              postBody: i,
              sessionId: n,
              idToken: t
            });
          }).then(function (t) {
            return o = Vc(r, t, "link"), Kc(r, t);
          }).then(function () {
            return o;
          });
          return Bc(this, t);
        }, t.Cb = function (t, e, n) {
          var i = this;
          this.b && (this.b.cancel(), this.b = null);
          var r = null;
          return Bc(this, zt().then(function () {
            return xr(Ba(i.c, {
              requestUri: t,
              sessionId: e,
              postBody: n
            }), i.uid);
          }).then(function (t) {
            return r = Vc(i, t, "reauthenticate"), jc(i, t), i.i = null, i.reload();
          }).then(function () {
            return r;
          }), !0);
        }, t.kb = function (e) {
          var n = this,
              i = null;
          return Bc(this, this.F().then(function (t) {
            return i = t, void 0 === e || G(e) ? {} : cr(new Qi(e));
          }).then(function (t) {
            return n.c.kb(i, t);
          }).then(function (t) {
            if (n.email != t) return n.reload();
          }).then(function () {}));
        }, t.toJSON = function () {
          return this.w();
        }, t.w = function () {
          var e = {
            uid: this.uid,
            displayName: this.displayName,
            photoURL: this.photoURL,
            email: this.email,
            emailVerified: this.emailVerified,
            phoneNumber: this.phoneNumber,
            isAnonymous: this.isAnonymous,
            providerData: [],
            apiKey: this.l,
            appName: this.o,
            authDomain: this.u,
            stsTokenManager: this.h.w(),
            redirectEventId: this.aa || null
          };
          return this.metadata && J(e, this.metadata.w()), M(this.providerData, function (t) {
            e.providerData.push(function (t) {
              var e,
                  n = {};

              for (e in t) t.hasOwnProperty(e) && (n[e] = t[e]);

              return n;
            }(t));
          }), e;
        };
        var Xc = {
          name: "redirectUser",
          B: "session"
        };

        function Jc(t) {
          return bu(t.b, Xc, t.a);
        }

        function zc(t) {
          this.a = t, this.b = vu(), this.c = null, this.f = function (e) {
            var n = Zc("local"),
                i = Zc("session"),
                r = Zc("none");
            return function (n, i, r) {
              var o = gu(i, r),
                  a = mu(n, i.B);
              return n.get(i, r).then(function (t) {
                var e = null;

                try {
                  e = Ei(h.localStorage.getItem(o));
                } catch (t) {}

                if (e && !t) return h.localStorage.removeItem(o), n.set(i, e, r);
                e && t && "localStorage" != a.type && h.localStorage.removeItem(o);
              });
            }(e.b, n, e.a).then(function () {
              return e.b.get(i, e.a);
            }).then(function (t) {
              return t ? i : e.b.get(r, e.a).then(function (t) {
                return t ? r : e.b.get(n, e.a).then(function (t) {
                  return t ? n : e.b.get($c, e.a).then(function (t) {
                    return t ? Zc(t) : n;
                  });
                });
              });
            }).then(function (t) {
              return e.c = t, Yc(e, t.B);
            }).s(function () {
              e.c || (e.c = n);
            });
          }(this), this.b.addListener(Zc("local"), this.a, I(this.g, this));
        }

        function Yc(t, e) {
          var n,
              i = [];

          for (n in du) du[n] !== e && i.push(bu(t.b, Zc(du[n]), t.a));

          return i.push(bu(t.b, $c, t.a)), function (s) {
            return new qt(function (n, e) {
              var i = s.length,
                  r = [];
              if (i) for (var t = function (t, e) {
                i--, r[t] = e, 0 == i && n(r);
              }, o = function (t) {
                e(t);
              }, a = 0; a < s.length; a++) $t(s[a], T(t, a), o);else n(r);
            });
          }(i);
        }

        zc.prototype.g = function () {
          var e = this,
              n = Zc("local");
          nh(this, function () {
            return zt().then(function () {
              return e.c && "local" != e.c.B ? e.b.get(n, e.a) : null;
            }).then(function (t) {
              if (t) return Yc(e, "local").then(function () {
                e.c = n;
              });
            });
          });
        };

        var $c = {
          name: "persistence",
          B: "session"
        };

        function Zc(t) {
          return {
            name: "authUser",
            B: t
          };
        }

        function Qc(t, e) {
          return nh(t, function () {
            return t.b.set(t.c, e.w(), t.a);
          });
        }

        function th(t) {
          return nh(t, function () {
            return bu(t.b, t.c, t.a);
          });
        }

        function eh(t, e) {
          return nh(t, function () {
            return t.b.get(t.c, t.a).then(function (t) {
              return t && e && (t.authDomain = e), Gc(t || {});
            });
          });
        }

        function nh(t, e) {
          return t.f = t.f.then(e, e), t.f;
        }

        function ih(t) {
          if (this.l = !1, Mi(this, "settings", new oc()), Mi(this, "app", t), !hh(this).options || !hh(this).options.apiKey) throw new zi("invalid-api-key");
          t = $h.SDK_VERSION ? pi($h.SDK_VERSION) : null, this.c = new Ta(hh(this).options && hh(this).options.apiKey, br(mr), t), this.N = [], this.o = [], this.I = [], this.Rb = $h.INTERNAL.createSubscribe(I(this.kc, this)), this.O = void 0, this.Sb = $h.INTERNAL.createSubscribe(I(this.mc, this)), uh(this, null), this.h = new zc(hh(this).options.apiKey + ":" + hh(this).name), this.A = new Wc(hh(this).options.apiKey + ":" + hh(this).name), this.V = ph(this, function (n) {
            var t = hh(n).options.authDomain,
                e = function (e) {
              var t = function (t, e) {
                return t.b.get(Xc, t.a).then(function (t) {
                  return t && e && (t.authDomain = e), Gc(t || {});
                });
              }(e.A, hh(e).options.authDomain).then(function (t) {
                return (e.D = t) && (t.ba = e.A), Jc(e.A);
              });

              return ph(e, t);
            }(n).then(function () {
              return eh(n.h, t);
            }).then(function (e) {
              return e ? (e.ba = n.A, n.D && (n.D.aa || null) == (e.aa || null) ? e : e.reload().then(function () {
                return Qc(n.h, e).then(function () {
                  return e;
                });
              }).s(function (t) {
                return "auth/network-request-failed" == t.code ? e : th(n.h);
              })) : null;
            }).then(function (t) {
              uh(n, t || null);
            });

            return ph(n, e);
          }(this)), this.i = ph(this, function (e) {
            return e.V.then(function () {
              return e.fa();
            }).s(function () {}).then(function () {
              if (!e.l) return e.ka();
            }).s(function () {}).then(function () {
              if (!e.l) {
                e.X = !0;
                var t = e.h;
                t.b.addListener(Zc("local"), t.a, e.ka);
              }
            });
          }(this)), this.X = !1, this.ka = I(this.Kc, this), this.Ha = I(this.Z, this), this.ra = I(this.Zb, this), this.sa = I(this.ic, this), this.ta = I(this.jc, this), function (e) {
            var n = hh(e).options.authDomain,
                i = hh(e).options.apiKey;
            n && bi() && (e.Qb = e.V.then(function () {
              if (!e.l) {
                if (e.a = Qu(n, i, hh(e).name), e.a.subscribe(e), fh(e) && Nc(fh(e)), e.D) {
                  Nc(e.D);
                  var t = e.D;
                  t.pa(e.ea()), yc(t, e), wc(t = e.D, e.G), Ic(t, e), e.D = null;
                }

                return e.a;
              }
            }));
          }(this), this.INTERNAL = {}, this.INTERNAL.delete = I(this.delete, this), this.INTERNAL.logFramework = I(this.sc, this), this.u = 0, nn.call(this), function (t) {
            Object.defineProperty(t, "lc", {
              get: function () {
                return this.ea();
              },
              set: function (t) {
                this.pa(t);
              },
              enumerable: !1
            }), t.W = null;
          }(this), this.G = [];
        }

        function rh(t) {
          Re.call(this, "languageCodeChanged"), this.g = t;
        }

        function oh(t) {
          Re.call(this, "frameworkChanged"), this.c = t;
        }

        function ah(t) {
          return t.Qb || Yt(new zi("auth-domain-config-required"));
        }

        function sh(e, t) {
          var n = {};
          return n.apiKey = hh(e).options.apiKey, n.authDomain = hh(e).options.authDomain, n.appName = hh(e).name, e.V.then(function () {
            return function (t, e, n, i) {
              var r = new bc(t, e);
              return n && (r.ba = n), i && wc(r, i), r.reload().then(function () {
                return r;
              });
            }(n, t, e.A, e.ya());
          }).then(function (t) {
            return fh(e) && t.uid == fh(e).uid ? xc(fh(e), t) : (uh(e, t), Nc(t)), e.Z(t);
          }).then(function () {
            dh(e);
          });
        }

        function uh(t, e) {
          fh(t) && (function (t, e) {
            F(t.N, function (t) {
              return t == e;
            });
          }(fh(t), t.Ha), Xe(fh(t), "tokenChanged", t.ra), Xe(fh(t), "userDeleted", t.sa), Xe(fh(t), "userInvalidated", t.ta), Ec(fh(t))), e && (e.N.push(t.Ha), Be(e, "tokenChanged", t.ra), Be(e, "userDeleted", t.sa), Be(e, "userInvalidated", t.ta), 0 < t.u && kc(e)), Mi(t, "currentUser", e), e && (e.pa(t.ea()), yc(e, t), wc(e, t.G), Ic(e, t));
        }

        function ch(e, t) {
          var n = null,
              i = null;
          return ph(e, t.then(function (t) {
            return n = co(t), i = kr(t), sh(e, t);
          }).then(function () {
            return Ui({
              user: fh(e),
              credential: n,
              additionalUserInfo: i,
              operationType: "signIn"
            });
          }));
        }

        function hh(t) {
          return t.app;
        }

        function fh(t) {
          return t.currentUser;
        }

        function lh(t) {
          return fh(t) && fh(t)._lat || null;
        }

        function dh(t) {
          if (t.X) {
            for (var e = 0; e < t.o.length; e++) t.o[e] && t.o[e](lh(t));

            if (t.O !== t.getUid() && t.I.length) for (t.O = t.getUid(), e = 0; e < t.I.length; e++) t.I[e] && t.I[e](lh(t));
          }
        }

        function ph(t, e) {
          return t.N.push(e), e.ia(function () {
            K(t.N, e);
          }), e;
        }

        function vh() {}

        function mh() {
          this.a = {}, this.b = 1e12;
        }

        zc.prototype.nb = function (e) {
          var n = null,
              i = this;
          return function (t) {
            var e = new zi("invalid-persistence-type"),
                n = new zi("unsupported-persistence-type");

            t: {
              for (i in du) if (du[i] == t) {
                var i = !0;
                break t;
              }

              i = !1;
            }

            if (!i || "string" != typeof t) throw e;

            switch (ui()) {
              case "ReactNative":
                if ("session" === t) throw n;
                break;

              case "Node":
                if ("none" !== t) throw n;
                break;

              default:
                if (!gi() && "none" !== t) throw n;
            }
          }(e), nh(this, function () {
            return e != i.c.B ? i.b.get(i.c, i.a).then(function (t) {
              return n = t, Yc(i, e);
            }).then(function () {
              if (i.c = Zc(e), n) return i.b.set(i.c, n, i.a);
            }) : zt();
          });
        }, E(ih, nn), E(rh, Re), E(oh, Re), (t = ih.prototype).nb = function (t) {
          return t = this.h.nb(t), ph(this, t);
        }, t.pa = function (t) {
          this.W === t || this.l || (this.W = t, _a(this.c, this.W), this.dispatchEvent(new rh(this.ea())));
        }, t.ea = function () {
          return this.W;
        }, t.Qc = function () {
          var t = h.navigator;
          this.pa(t && (t.languages && t.languages[0] || t.language || t.userLanguage) || null);
        }, t.sc = function (t) {
          this.G.push(t), Pa(this.c, $h.SDK_VERSION ? pi($h.SDK_VERSION, this.G) : null), this.dispatchEvent(new oh(this.G));
        }, t.ya = function () {
          return H(this.G);
        }, t.toJSON = function () {
          return {
            apiKey: hh(this).options.apiKey,
            authDomain: hh(this).options.authDomain,
            appName: hh(this).name,
            currentUser: fh(this) && fh(this).w()
          };
        }, t.xb = function (t, e) {
          switch (t) {
            case "unknown":
            case "signInViaRedirect":
              return !0;

            case "signInViaPopup":
              return this.g == e && !!this.f;

            default:
              return !1;
          }
        }, t.ha = function (t, e, n, i) {
          "signInViaPopup" == t && this.g == i && (n && this.v ? this.v(n) : e && !n && this.f && this.f(e), this.b && (this.b.cancel(), this.b = null), delete this.f, delete this.v);
        }, t.xa = function (t, e) {
          return "signInViaRedirect" == t || "signInViaPopup" == t && this.g == e && this.f ? I(this.Yb, this) : null;
        }, t.Yb = function (t, e, n) {
          var i = this;
          t = {
            requestUri: t,
            postBody: n,
            sessionId: e
          }, this.b && (this.b.cancel(), this.b = null);
          var r = null,
              o = null,
              a = qa(i.c, t).then(function (t) {
            return r = co(t), o = kr(t), t;
          });
          return ph(this, t = i.V.then(function () {
            return a;
          }).then(function (t) {
            return sh(i, t);
          }).then(function () {
            return Ui({
              user: fh(i),
              credential: r,
              additionalUserInfo: o,
              operationType: "signIn"
            });
          }));
        }, t.Ic = function (e) {
          if (!bi()) return Yt(new zi("operation-not-supported-in-this-environment"));
          var n = this,
              t = Tr(e.providerId),
              i = Si(),
              r = null;
          (!Ii() || ai()) && hh(this).options.authDomain && e.isOAuthProvider && (r = Ls(hh(this).options.authDomain, hh(this).options.apiKey, hh(this).name, "signInViaPopup", e, null, i, $h.SDK_VERSION || null));
          var o = ei(r, t && t.Ba, t && t.Aa);
          return ph(this, t = ah(this).then(function (t) {
            return Yu(t, o, "signInViaPopup", e, i, !!r);
          }).then(function () {
            return new qt(function (t, e) {
              n.ha("signInViaPopup", null, new zi("cancelled-popup-request"), n.g), n.f = t, n.v = e, n.g = i, n.b = n.a.Ea(n, "signInViaPopup", o, i);
            });
          }).then(function (t) {
            return o && ti(o), t ? Ui(t) : null;
          }).s(function (t) {
            throw o && ti(o), t;
          }));
        }, t.Jc = function (t) {
          if (!bi()) return Yt(new zi("operation-not-supported-in-this-environment"));
          var e = this;
          return ph(this, ah(this).then(function () {
            return function (t) {
              return nh(t, function () {
                return t.b.set($c, t.c.B, t.a);
              });
            }(e.h);
          }).then(function () {
            return e.a.Ca("signInViaRedirect", t);
          }));
        }, t.fa = function () {
          if (!bi()) return Yt(new zi("operation-not-supported-in-this-environment"));
          var t = this;
          return ph(this, ah(this).then(function () {
            return t.a.fa();
          }).then(function (t) {
            return t ? Ui(t) : null;
          }));
        }, t.Oc = function (t) {
          if (!t) return Yt(new zi("null-user"));
          var e = this,
              n = {};
          n.apiKey = hh(this).options.apiKey, n.authDomain = hh(this).options.authDomain, n.appName = hh(this).name;

          var i = function (t, e, n, i) {
            e = e || {
              apiKey: t.l,
              authDomain: t.u,
              appName: t.o
            };
            var r = t.h,
                o = {};
            return o[Ea] = r.b, o.refreshToken = r.a, o.expiresIn = (r.c - k()) / 1e3, e = new bc(e, o), n && (e.ba = n), i && wc(e, i), xc(e, t), e;
          }(t, n, e.A, e.ya());

          return ph(this, this.i.then(function () {
            if (hh(e).options.apiKey != t.l) return i.reload();
          }).then(function () {
            return fh(e) && t.uid == fh(e).uid ? (xc(fh(e), t), e.Z(t)) : (uh(e, i), Nc(i), e.Z(i));
          }).then(function () {
            dh(e);
          }));
        }, t.pb = function () {
          var t = this,
              e = this.i.then(function () {
            return fh(t) ? (uh(t, null), th(t.h).then(function () {
              dh(t);
            })) : zt();
          });
          return ph(this, e);
        }, t.Kc = function () {
          var i = this;
          return eh(this.h, hh(this).options.authDomain).then(function (t) {
            if (!i.l) {
              var e;

              if (e = fh(i) && t) {
                e = fh(i).uid;
                var n = t.uid;
                e = null != e && "" !== e && null != n && "" !== n && e == n;
              }

              if (e) return xc(fh(i), t), fh(i).F();
              (fh(i) || t) && (uh(i, t), t && (Nc(t), t.ba = i.A), i.a && i.a.subscribe(i), dh(i));
            }
          });
        }, t.Z = function (t) {
          return Qc(this.h, t);
        }, t.Zb = function () {
          dh(this), this.Z(fh(this));
        }, t.ic = function () {
          this.pb();
        }, t.jc = function () {
          this.pb();
        }, t.kc = function (t) {
          var e = this;
          this.addAuthTokenListener(function () {
            t.next(fh(e));
          });
        }, t.mc = function (t) {
          var e = this;
          !function (t, e) {
            t.I.push(e), ph(t, t.i.then(function () {
              !t.l && V(t.I, e) && t.O !== t.getUid() && (t.O = t.getUid(), e(lh(t)));
            }));
          }(this, function () {
            t.next(fh(e));
          });
        }, t.uc = function (t, e, n) {
          var i = this;
          return this.X && Promise.resolve().then(function () {
            m(t) ? t(fh(i)) : m(t.next) && t.next(fh(i));
          }), this.Rb(t, e, n);
        }, t.tc = function (t, e, n) {
          var i = this;
          return this.X && Promise.resolve().then(function () {
            i.O = i.getUid(), m(t) ? t(fh(i)) : m(t.next) && t.next(fh(i));
          }), this.Sb(t, e, n);
        }, t.$b = function (t) {
          var e = this,
              n = this.i.then(function () {
            return fh(e) ? fh(e).F(t).then(function (t) {
              return {
                accessToken: t
              };
            }) : null;
          });
          return ph(this, n);
        }, t.Ec = function (t) {
          var n = this;
          return this.i.then(function () {
            return ch(n, ys(n.c, ps, {
              token: t
            }));
          }).then(function (t) {
            var e = t.user;
            return Lc(e, "isAnonymous", !1), n.Z(e), t;
          });
        }, t.Fc = function (t, e) {
          var n = this;
          return this.i.then(function () {
            return ch(n, ys(n.c, vs, {
              email: t,
              password: e
            }));
          });
        }, t.Ub = function (t, e) {
          var n = this;
          return this.i.then(function () {
            return ch(n, ys(n.c, Ja, {
              email: t,
              password: e
            }));
          });
        }, t.Ra = function (t) {
          var e = this;
          return this.i.then(function () {
            return ch(e, t.la(e.c));
          });
        }, t.Dc = function (t) {
          return Li("firebase.auth.Auth.prototype.signInAndRetrieveDataWithCredential is deprecated. Please use firebase.auth.Auth.prototype.signInWithCredential instead."), this.Ra(t);
        }, t.ob = function () {
          var n = this;
          return this.i.then(function () {
            var t = fh(n);
            return t && t.isAnonymous ? Ui({
              user: t,
              credential: null,
              additionalUserInfo: Ui({
                providerId: null,
                isNewUser: !1
              }),
              operationType: "signIn"
            }) : ch(n, n.c.ob()).then(function (t) {
              var e = t.user;
              return Lc(e, "isAnonymous", !0), n.Z(e), t;
            });
          });
        }, t.getUid = function () {
          return fh(this) && fh(this).uid || null;
        }, t.Tb = function (t) {
          this.addAuthTokenListener(t), this.u++, 0 < this.u && fh(this) && kc(fh(this));
        }, t.Bc = function (e) {
          var n = this;
          M(this.o, function (t) {
            t == e && n.u--;
          }), this.u < 0 && (this.u = 0), 0 == this.u && fh(this) && Ec(fh(this)), this.removeAuthTokenListener(e);
        }, t.addAuthTokenListener = function (t) {
          var e = this;
          this.o.push(t), ph(this, this.i.then(function () {
            e.l || V(e.o, t) && t(lh(e));
          }));
        }, t.removeAuthTokenListener = function (e) {
          F(this.o, function (t) {
            return t == e;
          });
        }, t.delete = function () {
          this.l = !0;

          for (var t = 0; t < this.N.length; t++) this.N[t].cancel("app-deleted");

          return this.N = [], this.h && (t = this.h).b.removeListener(Zc("local"), t.a, this.ka), this.a && (this.a.unsubscribe(this), this.a.Za()), Promise.resolve();
        }, t.Xb = function (t) {
          return ph(this, function (t, e) {
            return ys(t, za, {
              identifier: e,
              continueUri: yi() ? $n() : "http://localhost"
            }).then(function (t) {
              return t.signinMethods || [];
            });
          }(this.c, t));
        }, t.nc = function (t) {
          return !!io(t);
        }, t.mb = function (e, n) {
          var i = this;
          return ph(this, zt().then(function () {
            var t = new Qi(n);
            if (!t.c) throw new zi("argument-error", nr + " must be true when sending sign in link to email");
            return cr(t);
          }).then(function (t) {
            return i.c.mb(e, t);
          }).then(function () {}));
        }, t.Rc = function (t) {
          return this.Ka(t).then(function (t) {
            return t.data.email;
          });
        }, t.$a = function (t, e) {
          return ph(this, this.c.$a(t, e).then(function () {}));
        }, t.Ka = function (t) {
          return ph(this, this.c.Ka(t).then(function (t) {
            return new Ki(t);
          }));
        }, t.Xa = function (t) {
          return ph(this, this.c.Xa(t).then(function () {}));
        }, t.lb = function (e, t) {
          var n = this;
          return ph(this, zt().then(function () {
            return void 0 === t || G(t) ? {} : cr(new Qi(t));
          }).then(function (t) {
            return n.c.lb(e, t);
          }).then(function () {}));
        }, t.Hc = function (t, e) {
          return ph(this, sc(this, t, e, I(this.Ra, this)));
        }, t.Gc = function (e, n) {
          var i = this;
          return ph(this, zt().then(function () {
            var t = no(e, n || $n());
            return i.Ra(t);
          }));
        }, vh.prototype.render = function () {}, vh.prototype.reset = function () {}, vh.prototype.getResponse = function () {}, vh.prototype.execute = function () {};
        var gh = null;

        function bh(t, e) {
          return (e = yh(e)) && t.a[e] || null;
        }

        function yh(t) {
          return (t = void 0 === t ? 1e12 : t) ? t.toString() : null;
        }

        function wh(t, e) {
          this.g = !1, this.c = e, this.a = this.b = null, this.h = "invisible" !== this.c.size, this.f = Kn(t);
          var n = this;
          this.i = function () {
            n.execute();
          }, this.h ? this.execute() : Be(this.f, "click", this.i);
        }

        function Ih(t) {
          if (t.g) throw Error("reCAPTCHA mock was already deleted!");
        }

        function Th() {}

        mh.prototype.render = function (t, e) {
          return this.a[this.b.toString()] = new wh(t, e), this.b++;
        }, mh.prototype.reset = function (t) {
          var e = bh(this, t);
          t = yh(t), e && t && (e.delete(), delete this.a[t]);
        }, mh.prototype.getResponse = function (t) {
          return (t = bh(this, t)) ? t.getResponse() : null;
        }, mh.prototype.execute = function (t) {
          (t = bh(this, t)) && t.execute();
        }, wh.prototype.getResponse = function () {
          return Ih(this), this.b;
        }, wh.prototype.execute = function () {
          Ih(this);
          var n = this;
          this.a || (this.a = setTimeout(function () {
            n.b = function () {
              for (var t = 50, e = []; 0 < t;) e.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62 * Math.random()))), t--;

              return e.join("");
            }();

            var t = n.c.callback,
                e = n.c["expired-callback"];
            if (t) try {
              t(n.b);
            } catch (t) {}
            n.a = setTimeout(function () {
              if (n.a = null, n.b = null, e) try {
                e();
              } catch (t) {}
              n.h && n.execute();
            }, 6e4);
          }, 500));
        }, wh.prototype.delete = function () {
          Ih(this), this.g = !0, clearTimeout(this.a), this.a = null, Xe(this.f, "click", this.i);
        }, Th.prototype.g = function () {
          return zt(gh = gh || new mh());
        }, Th.prototype.c = function () {};
        var kh = null;

        function Eh() {
          this.b = h.grecaptcha ? 1 / 0 : 0, this.f = null, this.a = "__rcb" + Math.floor(1e6 * Math.random()).toString();
        }

        var Sh = new z(Z, "https://www.google.com/recaptcha/api.js?onload=%{onload}&render=explicit&hl=%{hl}"),
            Ah = new Oi(3e4, 6e4);
        Eh.prototype.g = function (r) {
          var o = this;
          return new qt(function (t, e) {
            var i = setTimeout(function () {
              e(new zi("network-request-failed"));
            }, Ah.get());
            !h.grecaptcha || r !== o.f && !o.b ? (h[o.a] = function () {
              if (h.grecaptcha) {
                o.f = r;
                var n = h.grecaptcha.render;
                h.grecaptcha.render = function (t, e) {
                  return t = n(t, e), o.b++, t;
                }, clearTimeout(i), t(h.grecaptcha);
              } else clearTimeout(i), e(new zi("internal-error"));

              delete h[o.a];
            }, zt(va(nt(Sh, {
              onload: o.a,
              hl: r || ""
            }))).s(function () {
              clearTimeout(i), e(new zi("internal-error", "Unable to load external reCAPTCHA dependencies!"));
            })) : (clearTimeout(i), t(h.grecaptcha));
          });
        }, Eh.prototype.c = function () {
          this.b--;
        };
        var Nh = null;

        function Oh(t, e, n, i, r, o, a) {
          if (Mi(this, "type", "recaptcha"), this.c = this.f = null, this.D = !1, this.l = e, this.g = null, a = a ? kh = kh || new Th() : Nh = Nh || new Eh(), this.o = a, this.a = n || {
            theme: "light",
            type: "image"
          }, this.h = [], this.a[Ch]) throw new zi("argument-error", "sitekey should not be provided for reCAPTCHA as one is automatically provisioned for the current project.");
          if (this.i = "invisible" === this.a[Rh], !h.document) throw new zi("operation-not-supported-in-this-environment", "RecaptchaVerifier is only supported in a browser HTTP/HTTPS environment with DOM support.");
          if (!Kn(e) || !this.i && Kn(e).hasChildNodes()) throw new zi("argument-error", "reCAPTCHA container is either not found or already contains inner elements!");
          this.u = new Ta(t, o || null, r || null), this.v = i || function () {
            return null;
          };
          var s = this;
          this.m = [];
          var u = this.a[_h];

          this.a[_h] = function (t) {
            if (Dh(s, t), "function" == typeof u) u(t);else if ("string" == typeof u) {
              var e = mi(u, h);
              "function" == typeof e && e(t);
            }
          };

          var c = this.a[Ph];

          this.a[Ph] = function () {
            if (Dh(s, null), "function" == typeof c) c();else if ("string" == typeof c) {
              var t = mi(c, h);
              "function" == typeof t && t();
            }
          };
        }

        var _h = "callback",
            Ph = "expired-callback",
            Ch = "sitekey",
            Rh = "size";

        function Dh(t, e) {
          for (var n = 0; n < t.m.length; n++) try {
            t.m[n](e);
          } catch (t) {}
        }

        function Lh(t, e) {
          return t.h.push(e), e.ia(function () {
            K(t.h, e);
          }), e;
        }

        function xh(t) {
          if (t.D) throw new zi("internal-error", "RecaptchaVerifier instance has been destroyed.");
        }

        function Mh(t, e, n) {
          var i = !1;

          try {
            this.b = n || $h.app();
          } catch (t) {
            throw new zi("argument-error", "No firebase.app.App instance is currently initialized.");
          }

          if (!this.b.options || !this.b.options.apiKey) throw new zi("invalid-api-key");
          n = this.b.options.apiKey;
          var r = this,
              o = null;

          try {
            o = this.b.auth().ya();
          } catch (t) {}

          try {
            i = this.b.auth().settings.appVerificationDisabledForTesting;
          } catch (t) {}

          o = $h.SDK_VERSION ? pi($h.SDK_VERSION, o) : null, Oh.call(this, n, t, e, function () {
            try {
              var e = r.b.auth().ea();
            } catch (t) {
              e = null;
            }

            return e;
          }, o, br(mr), i);
        }

        function jh(t, e, n, i) {
          t: {
            n = Array.prototype.slice.call(n);

            for (var r = 0, o = !1, a = 0; a < e.length; a++) if (e[a].optional) o = !0;else {
              if (o) throw new zi("internal-error", "Argument validator encountered a required argument after an optional argument.");
              r++;
            }

            if (o = e.length, n.length < r || o < n.length) i = "Expected " + (r == o ? 1 == r ? "1 argument" : r + " arguments" : r + "-" + o + " arguments") + " but got " + n.length + ".";else {
              for (r = 0; r < n.length; r++) if (o = e[r].optional && void 0 === n[r], !e[r].M(n[r]) && !o) {
                if (e = e[r], r < 0 || r >= Uh.length) throw new zi("internal-error", "Argument validator received an unsupported number of arguments.");
                n = Uh[r], i = (i ? "" : n + " argument ") + (e.name ? '"' + e.name + '" ' : "") + "must be " + e.K + ".";
                break t;
              }

              i = null;
            }
          }

          if (i) throw new zi("argument-error", t + " failed: " + i);
        }

        (t = Oh.prototype).za = function () {
          var e = this;
          return this.f ? this.f : this.f = Lh(this, zt().then(function () {
            if (yi() && !si()) return ri();
            throw new zi("operation-not-supported-in-this-environment", "RecaptchaVerifier is only supported in a browser HTTP/HTTPS environment.");
          }).then(function () {
            return e.o.g(e.v());
          }).then(function (t) {
            return e.g = t, ys(e.u, os, {});
          }).then(function (t) {
            e.a[Ch] = t.recaptchaSiteKey;
          }).s(function (t) {
            throw e.f = null, t;
          }));
        }, t.render = function () {
          xh(this);
          var n = this;
          return Lh(this, this.za().then(function () {
            if (null === n.c) {
              var t = n.l;

              if (!n.i) {
                var e = Kn(t);
                t = Hn("DIV"), e.appendChild(t);
              }

              n.c = n.g.render(t, n.a);
            }

            return n.c;
          }));
        }, t.verify = function () {
          xh(this);
          var r = this;
          return Lh(this, this.render().then(function (i) {
            return new qt(function (e) {
              var t = r.g.getResponse(i);
              if (t) e(t);else {
                var n = function (t) {
                  t && (function (t, e) {
                    F(t.m, function (t) {
                      return t == e;
                    });
                  }(r, n), e(t));
                };

                r.m.push(n), r.i && r.g.execute(r.c);
              }
            });
          }));
        }, t.reset = function () {
          xh(this), null !== this.c && this.g.reset(this.c);
        }, t.clear = function () {
          xh(this), this.D = !0, this.o.c();

          for (var t = 0; t < this.h.length; t++) this.h[t].cancel("RecaptchaVerifier instance has been destroyed.");

          if (!this.i) {
            t = Kn(this.l);

            for (var e; e = t.firstChild;) t.removeChild(e);
          }
        }, E(Mh, Oh);
        var Uh = "First Second Third Fourth Fifth Sixth Seventh Eighth Ninth".split(" ");

        function Vh(t, e) {
          return {
            name: t || "",
            K: "a valid string",
            optional: !!e,
            M: f
          };
        }

        function Kh(t, e) {
          return {
            name: t || "",
            K: "a boolean",
            optional: !!e,
            M: n
          };
        }

        function Fh(t, e) {
          return {
            name: t || "",
            K: "a valid object",
            optional: !!e,
            M: g
          };
        }

        function qh(t, e) {
          return {
            name: t || "",
            K: "a function",
            optional: !!e,
            M: m
          };
        }

        function Hh(t, e) {
          return {
            name: t || "",
            K: "null",
            optional: !!e,
            M: r
          };
        }

        function Bh(n) {
          return {
            name: n ? n + "Credential" : "credential",
            K: n ? "a valid " + n + " credential" : "a valid credential",
            optional: !1,
            M: function (t) {
              if (!t) return !1;
              var e = !n || t.providerId === n;
              return !(!t.la || !e);
            }
          };
        }

        function Gh() {
          return {
            name: "applicationVerifier",
            K: "an implementation of firebase.auth.ApplicationVerifier",
            optional: !1,
            M: function (t) {
              return !!(t && f(t.type) && m(t.verify));
            }
          };
        }

        function Wh(e, n, t, i) {
          return {
            name: t || "",
            K: e.K + " or " + n.K,
            optional: !!i,
            M: function (t) {
              return e.M(t) || n.M(t);
            }
          };
        }

        function Xh(t, e) {
          for (var n in e) {
            var i = e[n].name;
            t[i] = Yh(i, t[n], e[n].j);
          }
        }

        function Jh(t, e) {
          for (var n in e) {
            var i = e[n].name;
            i !== n && Object.defineProperty(t, i, {
              get: T(function (t) {
                return this[t];
              }, n),
              set: T(function (t, e, n, i) {
                jh(t, [n], [i], !0), this[e] = i;
              }, i, n, e[n].vb),
              enumerable: !0
            });
          }
        }

        function zh(t, e, n, i) {
          t[e] = Yh(e, n, i);
        }

        function Yh(t, e, n) {
          function i() {
            var t = Array.prototype.slice.call(arguments);
            return jh(o, n, t), e.apply(this, t);
          }

          if (!n) return e;

          var r,
              o = function (t) {
            return (t = t.split("."))[t.length - 1];
          }(t);

          for (r in e) i[r] = e[r];

          for (r in e.prototype) i.prototype[r] = e.prototype[r];

          return i;
        }

        Xh(ih.prototype, {
          Xa: {
            name: "applyActionCode",
            j: [Vh("code")]
          },
          Ka: {
            name: "checkActionCode",
            j: [Vh("code")]
          },
          $a: {
            name: "confirmPasswordReset",
            j: [Vh("code"), Vh("newPassword")]
          },
          Ub: {
            name: "createUserWithEmailAndPassword",
            j: [Vh("email"), Vh("password")]
          },
          Xb: {
            name: "fetchSignInMethodsForEmail",
            j: [Vh("email")]
          },
          fa: {
            name: "getRedirectResult",
            j: []
          },
          nc: {
            name: "isSignInWithEmailLink",
            j: [Vh("emailLink")]
          },
          tc: {
            name: "onAuthStateChanged",
            j: [Wh(Fh(), qh(), "nextOrObserver"), qh("opt_error", !0), qh("opt_completed", !0)]
          },
          uc: {
            name: "onIdTokenChanged",
            j: [Wh(Fh(), qh(), "nextOrObserver"), qh("opt_error", !0), qh("opt_completed", !0)]
          },
          lb: {
            name: "sendPasswordResetEmail",
            j: [Vh("email"), Wh(Fh("opt_actionCodeSettings", !0), Hh(null, !0), "opt_actionCodeSettings", !0)]
          },
          mb: {
            name: "sendSignInLinkToEmail",
            j: [Vh("email"), Fh("actionCodeSettings")]
          },
          nb: {
            name: "setPersistence",
            j: [Vh("persistence")]
          },
          Dc: {
            name: "signInAndRetrieveDataWithCredential",
            j: [Bh()]
          },
          ob: {
            name: "signInAnonymously",
            j: []
          },
          Ra: {
            name: "signInWithCredential",
            j: [Bh()]
          },
          Ec: {
            name: "signInWithCustomToken",
            j: [Vh("token")]
          },
          Fc: {
            name: "signInWithEmailAndPassword",
            j: [Vh("email"), Vh("password")]
          },
          Gc: {
            name: "signInWithEmailLink",
            j: [Vh("email"), Vh("emailLink", !0)]
          },
          Hc: {
            name: "signInWithPhoneNumber",
            j: [Vh("phoneNumber"), Gh()]
          },
          Ic: {
            name: "signInWithPopup",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          Jc: {
            name: "signInWithRedirect",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          Oc: {
            name: "updateCurrentUser",
            j: [Wh({
              name: "user",
              K: "an instance of Firebase User",
              optional: !1,
              M: function (t) {
                return !!(t && t instanceof bc);
              }
            }, Hh(), "user")]
          },
          pb: {
            name: "signOut",
            j: []
          },
          toJSON: {
            name: "toJSON",
            j: [Vh(null, !0)]
          },
          Qc: {
            name: "useDeviceLanguage",
            j: []
          },
          Rc: {
            name: "verifyPasswordResetCode",
            j: [Vh("code")]
          }
        }), Jh(ih.prototype, {
          lc: {
            name: "languageCode",
            vb: Wh(Vh(), Hh(), "languageCode")
          }
        }), (ih.Persistence = du).LOCAL = "local", ih.Persistence.SESSION = "session", ih.Persistence.NONE = "none", Xh(bc.prototype, {
          delete: {
            name: "delete",
            j: []
          },
          ac: {
            name: "getIdTokenResult",
            j: [Kh("opt_forceRefresh", !0)]
          },
          F: {
            name: "getIdToken",
            j: [Kh("opt_forceRefresh", !0)]
          },
          oc: {
            name: "linkAndRetrieveDataWithCredential",
            j: [Bh()]
          },
          fb: {
            name: "linkWithCredential",
            j: [Bh()]
          },
          pc: {
            name: "linkWithPhoneNumber",
            j: [Vh("phoneNumber"), Gh()]
          },
          qc: {
            name: "linkWithPopup",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          rc: {
            name: "linkWithRedirect",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          xc: {
            name: "reauthenticateAndRetrieveDataWithCredential",
            j: [Bh()]
          },
          hb: {
            name: "reauthenticateWithCredential",
            j: [Bh()]
          },
          yc: {
            name: "reauthenticateWithPhoneNumber",
            j: [Vh("phoneNumber"), Gh()]
          },
          zc: {
            name: "reauthenticateWithPopup",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          Ac: {
            name: "reauthenticateWithRedirect",
            j: [{
              name: "authProvider",
              K: "a valid Auth provider",
              optional: !1,
              M: function (t) {
                return !!(t && t.providerId && t.hasOwnProperty && t.hasOwnProperty("isOAuthProvider"));
              }
            }]
          },
          reload: {
            name: "reload",
            j: []
          },
          kb: {
            name: "sendEmailVerification",
            j: [Wh(Fh("opt_actionCodeSettings", !0), Hh(null, !0), "opt_actionCodeSettings", !0)]
          },
          toJSON: {
            name: "toJSON",
            j: [Vh(null, !0)]
          },
          Nc: {
            name: "unlink",
            j: [Vh("provider")]
          },
          rb: {
            name: "updateEmail",
            j: [Vh("email")]
          },
          sb: {
            name: "updatePassword",
            j: [Vh("password")]
          },
          Pc: {
            name: "updatePhoneNumber",
            j: [Bh("phone")]
          },
          tb: {
            name: "updateProfile",
            j: [Fh("profile")]
          }
        }), Xh(mh.prototype, {
          execute: {
            name: "execute"
          },
          render: {
            name: "render"
          },
          reset: {
            name: "reset"
          },
          getResponse: {
            name: "getResponse"
          }
        }), Xh(vh.prototype, {
          execute: {
            name: "execute"
          },
          render: {
            name: "render"
          },
          reset: {
            name: "reset"
          },
          getResponse: {
            name: "getResponse"
          }
        }), Xh(qt.prototype, {
          ia: {
            name: "finally"
          },
          s: {
            name: "catch"
          },
          then: {
            name: "then"
          }
        }), Jh(oc.prototype, {
          appVerificationDisabled: {
            name: "appVerificationDisabledForTesting",
            vb: Kh("appVerificationDisabledForTesting")
          }
        }), Xh(ac.prototype, {
          confirm: {
            name: "confirm",
            j: [Vh("verificationCode")]
          }
        }), zh(Lr, "fromJSON", function (t) {
          t = f(t) ? JSON.parse(t) : t;

          for (var e, n = [Fr, to, oo, Ur], i = 0; i < n.length; i++) if (e = n[i](t)) return e;

          return null;
        }, [Wh(Vh(), Fh(), "json")]), zh(eo, "credential", function (t, e) {
          return new Qr(t, e);
        }, [Vh("email"), Vh("password")]), Xh(Qr.prototype, {
          w: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(Gr.prototype, {
          ua: {
            name: "addScope",
            j: [Vh("scope")]
          },
          Da: {
            name: "setCustomParameters",
            j: [Fh("customOAuthParameters")]
          }
        }), zh(Gr, "credential", Wr, [Wh(Vh(), Fh(), "token")]), zh(eo, "credentialWithLink", no, [Vh("email"), Vh("emailLink")]), Xh(Xr.prototype, {
          ua: {
            name: "addScope",
            j: [Vh("scope")]
          },
          Da: {
            name: "setCustomParameters",
            j: [Fh("customOAuthParameters")]
          }
        }), zh(Xr, "credential", Jr, [Wh(Vh(), Fh(), "token")]), Xh(zr.prototype, {
          ua: {
            name: "addScope",
            j: [Vh("scope")]
          },
          Da: {
            name: "setCustomParameters",
            j: [Fh("customOAuthParameters")]
          }
        }), zh(zr, "credential", Yr, [Wh(Vh(), Wh(Fh(), Hh()), "idToken"), Wh(Vh(), Hh(), "accessToken", !0)]), Xh($r.prototype, {
          Da: {
            name: "setCustomParameters",
            j: [Fh("customOAuthParameters")]
          }
        }), zh($r, "credential", Zr, [Wh(Vh(), Fh(), "token"), Vh("secret", !0)]), Xh(Br.prototype, {
          ua: {
            name: "addScope",
            j: [Vh("scope")]
          },
          credential: {
            name: "credential",
            j: [Wh(Vh(), Wh(Fh(), Hh()), "optionsOrIdToken"), Wh(Vh(), Hh(), "accessToken", !0)]
          },
          Da: {
            name: "setCustomParameters",
            j: [Fh("customOAuthParameters")]
          }
        }), Xh(Vr.prototype, {
          w: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(Mr.prototype, {
          w: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), zh(so, "credential", uo, [Vh("verificationId"), Vh("verificationCode")]), Xh(so.prototype, {
          Va: {
            name: "verifyPhoneNumber",
            j: [Vh("phoneNumber"), Gh()]
          }
        }), Xh(ro.prototype, {
          w: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(zi.prototype, {
          toJSON: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(bo.prototype, {
          toJSON: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(go.prototype, {
          toJSON: {
            name: "toJSON",
            j: [Vh(null, !0)]
          }
        }), Xh(Mh.prototype, {
          clear: {
            name: "clear",
            j: []
          },
          render: {
            name: "render",
            j: []
          },
          verify: {
            name: "verify",
            j: []
          }
        }), function () {
          if (void 0 === $h || !$h.INTERNAL || !$h.INTERNAL.registerService) throw Error("Cannot find the firebase namespace; be sure to include firebase-app.js before this library.");
          var t = {
            Auth: ih,
            AuthCredential: Lr,
            Error: zi
          };
          zh(t, "EmailAuthProvider", eo, []), zh(t, "FacebookAuthProvider", Gr, []), zh(t, "GithubAuthProvider", Xr, []), zh(t, "GoogleAuthProvider", zr, []), zh(t, "TwitterAuthProvider", $r, []), zh(t, "OAuthProvider", Br, [Vh("providerId")]), zh(t, "SAMLAuthProvider", Hr, [Vh("providerId")]), zh(t, "PhoneAuthProvider", so, [{
            name: "auth",
            K: "an instance of Firebase Auth",
            optional: !0,
            M: function (t) {
              return !!(t && t instanceof ih);
            }
          }]), zh(t, "RecaptchaVerifier", Mh, [Wh(Vh(), {
            name: "",
            K: "an HTML element",
            optional: !1,
            M: function (t) {
              return !!(t && t instanceof Element);
            }
          }, "recaptchaContainer"), Fh("recaptchaParameters", !0), {
            name: "app",
            K: "an instance of Firebase App",
            optional: !0,
            M: function (t) {
              return !!(t && t instanceof $h.app.App);
            }
          }]), $h.INTERNAL.registerService("auth", function (t, e) {
            return e({
              INTERNAL: {
                getUid: I((t = new ih(t)).getUid, t),
                getToken: I(t.$b, t),
                addAuthTokenListener: I(t.Tb, t),
                removeAuthTokenListener: I(t.Bc, t)
              }
            }), t;
          }, t, function (t, e) {
            if ("create" === t) try {
              e.auth();
            } catch (t) {}
          }), $h.INTERNAL.extendNamespace({
            User: bc
          });
        }();
      }.apply("undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
    }).apply(this, arguments);
  } catch (t) {
    throw console.error(t), new Error("Cannot instantiate firebase-auth - be sure to load firebase-app.js first.");
  }
});

/**
 * `firebase-loginbutton`
 * FirebaseLoginbutton
 *
 * @customElement
 * @polymer
 * @litElement
 * @demo demo/index.html
 */

class FirebaseLoginbutton extends LitElement {
  static get is() {
    return 'firebase-loginbutton';
  }

  static get properties() {
    return {
      dataUser: {
        type: Object
      },
      displayName: {
        type: String
      },
      email: {
        type: String
      },
      uid: {
        type: String
      },
      apiKey: {
        type: String,
        attribute: 'api-key'
      },
      domain: {
        type: String
      },
      messagingSenderId: {
        type: String,
        attribute: 'messaging-sender-id'
      },
      appId: {
        type: String,
        attribute: 'app-id'
      },
      showPhoto: {
        type: Boolean,
        attribute: 'show-photo'
      },
      showEmail: {
        type: Boolean,
        attribute: 'show-email'
      },
      showUser: {
        type: Boolean,
        attribute: 'show-user'
      },
      showIcon: {
        type: Boolean,
        attribute: 'show-icon'
      },
      hasParams: {
        type: Boolean,
        attribute: false
      },
      iconLogout: {
        type: String,
        attribute: false
      },
      infobtn: {
        type: String,
        attribute: false
      }
    };
  }

  static get styles() {
    return css`
      :host, :root{
        display: block;
        --btn-primary-color: rgb(204, 204, 204);
        --btn-background-color: rgb(255, 57, 0);
        --btn-secondary-color: black;
        --btn-text-user-color: #FF0;
        --icon-bg-color-singin: #0A0;
        --icon-bg-color-singout: #A00;
      }
      svg { border:0; border-radius: 50%; padding:5px; padding-bottom: 6px; }
      svg.signin { background: var(--icon-bg-color-singin);}
      svg.signout { background: var(--icon-bg-color-singout); }
      img { margin:0 5px; }
      .wrapper__login--button {
        display:flex;
        font-size: 1.2rem;
        background-color: var(--btn-background-color);
        color: var(--btn-primary-color);
        cursor: pointer;
        border-radius: 10px;
        padding: 10px 20px;
        flex-flow: row wrap;
        justify-content: space-around;
        max-width: 200px;
      }
      .button-text {
        padding-top: 5px;
      }
      .button-icon {
        padding-top: 0;
        margin-left: 5px;
      }
      .button-photo img {
        border: 0;
        width: 25px;
        padding-top: 5px;
      }
      .button-user {
        color: var(--btn-text-user-color);
        font-size: 0.8rem;
      }
      .button-email {
        font-weight: bold;
        font-size: 0.8rem;
      }
    `;
  }

  constructor() {
    super();
    this.showEmail = false;
    this.showUser = false;
    this.showIcon = false;
    this.showPhoto = false;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  attributeChangedCallback(name, oldval, newval) {
    super.attributeChangedCallback(name, oldval, newval);
    this.hasParams = !!(this.apiKey && this.domain && this.messagingSenderId && this.appId);

    if (this.hasParams) {
      this.firebaseInitialize();
      this.infobtn = 'login with "' + this.domain + '" firebase database';
    }
  }

  firebaseInitialize() {
    if (firebase.apps.length === 0) {
      const firebaseConfig = {
        apiKey: this.apiKey,
        authDomain: this.domain + '.firebaseapp.com',
        databaseURL: 'https://' + this.domain + '.firebaseio.com',
        projectId: this.domain,
        storageBucket: this.domain + '.appspot.com',
        messagingSenderId: this.messagingSenderId,
        appId: this.appId
      };
      firebase.initializeApp(firebaseConfig);
    }

    this.onAuthStateChanged();
  }

  onAuthStateChanged() {
    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        this.iconLogout = `<svg id="logout-icon" width="23" height="21" class="signout"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>`;
        this.displayName = user.displayName;
        this.email = user.email;
        this.uid = user.uid;
        this.photo = user.photoURL;
        this.shadowRoot.querySelector('.button-photo').innerHTML = this.showPhoto ? `<img src="${this.photo}" />` : '';
        this.shadowRoot.querySelector('.button-text').innerText = 'Sign out';
        this.shadowRoot.querySelector('.button-icon').innerHTML = this.showIcon ? `${this.iconLogout}` : '';
        this.shadowRoot.querySelector('.button-user').textContent = this.showUser ? `${this.displayName}` : '';
        this.shadowRoot.querySelector('.button-email').textContent = this.showEmail ? `${this.email}` : '';
        this.shadowRoot.querySelector('#quickstart-sign-in').disabled = false;
        document.dispatchEvent(new CustomEvent('firebase-signin', {
          detail: {
            user: user
          }
        }));
      } else {
        this.iconLogout = `<svg id="logout-icon" width="23" height="21" class="signin"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>`;
        this.shadowRoot.querySelector('.button-photo').textContent = '';
        this.shadowRoot.querySelector('.button-text').textContent = 'Sign in';
        this.shadowRoot.querySelector('.button-icon').innerHTML = this.showIcon ? `${this.iconLogout}` : '';
        this.shadowRoot.querySelector('.button-user').textContent = '';
        this.shadowRoot.querySelector('.button-email').textContent = '';
        this.shadowRoot.querySelector('#quickstart-sign-in').disabled = false;
        document.dispatchEvent(new CustomEvent('firebase-signout', {
          detail: {
            user: this.email
          }
        }));
        this.displayName = undefined;
        this.email = undefined;
        this.uid = undefined;
      }
    }.bind(this));
  }

  toggleSignIn() {
    if (!firebase.auth().currentUser) {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).then(function (result) {
        this.dataUser = result.user;
      }.bind(this)).catch(function (error) {
        console.log(error);
      });
    } else {
      firebase.auth().signOut();
    }

    this.shadowRoot.querySelector('#quickstart-sign-in').disabled = true;
  }

  render() {
    return html`
      <section class="wrapper__layer--login">
      ${this.hasParams ? html`
        <div id="user" class="wrapper__user"></div>
        <button disabled class="wrapper__login--button" id="quickstart-sign-in" @click="${this.toggleSignIn}" title="${this.infobtn}">
          <div class="button-photo"></div>
          <div class="button-text"></div>
          <div class="button-icon"></div>
          <div class="button-user"></div>
          <div class="button-email"></div>
        </button>
      ` : html`
        <p>Faltan parámetros en la definición del componente</p>
      `}
      </section>
    `;
  }

}

window.customElements.define(FirebaseLoginbutton.is, FirebaseLoginbutton);
//# sourceMappingURL=firebase-loginbutton.js.map