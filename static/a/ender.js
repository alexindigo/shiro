/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build jeesh lodash oatmeal --output static/a/ender
  * Packages: ender-js@0.5.0 domready@0.2.12 qwery@3.4.1 bonzo@1.3.5 bean@1.0.4 jeesh@0.0.6 lodash@2.1.0 oatmeal@0.1.3
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011-2012 (@ded @fat)
  * http://ender.jit.su
  * License MIT
  */
(function (context, window, document) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // loosely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldRequire = context['require']
    , oldProvide = context['provide']

  /**
   * @param {string} name
   */
  function require(name) {
    // modules can be required from ender's build system, or found on the window
    var module = modules['$' + name] || window[name]
    if (!module) throw new Error("Ender Error: Requested module '" + name + "' has not been defined.")
    return module
  }

  /**
   * @param {string} name
   * @param {*}      what
   */
  function provide(name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }
  
  /**
   * @param   {*}  o  is an item to count
   * @return  {number|boolean}
   */
  function count(o) {
    if (typeof o != 'object' || !o || o.nodeType || o === window)
      return false
    return typeof (o = o.length) == 'number' && o === o ? o : false
  }

  /**
   * @constructor
   * @param  {*=}      item   selector|node|collection|callback|anything
   * @param  {Object=} root   node(s) from which to base selector queries
   */  
  function Ender(item, root) {
    var i
    this.length = 0 // Ensure that instance owns length

    if (typeof item == 'string')
      // Start @ strings so the result parlays into the other checks
      // The .selector prop only applies to strings
      item = ender['_select'](this['selector'] = item, root)

    if (null == item)
      return this // Do not wrap null|undefined

    if (typeof item == 'function')
      ender['_closure'](item, root)

    // DOM node | scalar | not array-like
    else if (false === (i = count(item)))
      this[this.length++] = item

    // Array-like - Bitwise ensures integer length:
    else for (this.length = i = i > 0 ? i >> 0 : 0; i--;)
      this[i] = item[i]
  }
  
  /**
   * @param  {*=}      item   selector|node|collection|callback|anything
   * @param  {Object=} root   node(s) from which to base selector queries
   * @return {Ender}
   */
  function ender(item, root) {
    return new Ender(item, root)
  }

  ender['_VERSION'] = '0.4.x'

  // Sync the prototypes for jQuery compatibility
  ender['fn'] = ender.prototype = Ender.prototype 

  Ender.prototype['$'] = ender // handy reference to self

  // dev tools secret sauce
  Ender.prototype['splice'] = function () { throw new Error('Not implemented') }
  
  /**
   * @param   {function(*, number, Ender)} fn
   * @param   {Object=} opt_scope
   * @return  {Ender}
   */
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }

  /**
   * @param {Object|Function} o
   * @param {boolean=}        chain
   */
  ender['ender'] = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  /**
   * @param {string}  s
   * @param {Node=}   r
   */
  ender['_select'] = function (s, r) {
    return s ? (r || document).querySelectorAll(s) : []
  }

  /**
   * @param {Function} fn
   */
  ender['_closure'] = function (fn) {
    fn.call(document, ender)
  }

  /**
   * @param {(boolean|Function)=} fn  optional flag or callback
   * To unclaim the global $, use no args. To unclaim *all* ender globals, 
   * use `true` or a callback that receives (require, provide, ender)
   */
  ender['noConflict'] = function (fn) {
    context['$'] = old
    if (fn) {
      context['provide'] = oldProvide
      context['require'] = oldRequire
      context['ender'] = oldEnder
      typeof fn == 'function' && fn(require, provide, this)
    }
    return this
  }

  if (typeof module !== 'undefined' && module['exports']) module['exports'] = ender
  // use subscript notation as extern for Closure compilation
  // developers.google.com/closure/compiler/docs/api-tutorial3
  context['ender'] = context['$'] = ender

}(this, window, document));

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * domready (c) Dustin Diaz 2012 - License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('domready', function (ready) {

    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , readyState = 'readyState'
      , loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/
      , loaded = loadedRgx.test(doc[readyState])

    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }

    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)


    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    })

    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })
  if (typeof provide == "function") provide("domready", module.exports);

  !function ($) {
    var ready = require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);
}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * @preserve Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz 2012
    * MIT License
    */

  (function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  })('qwery', this, function () {
    var doc = document
      , html = doc.documentElement
      , byClass = 'getElementsByClassName'
      , byTag = 'getElementsByTagName'
      , qSA = 'querySelectorAll'
      , useNativeQSA = 'useNativeQSA'
      , tagName = 'tagName'
      , nodeType = 'nodeType'
      , select // main select() method, assign later

      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+)$/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , splittable = /(^|,)\s*[>~+]/
      , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/
      , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')

    var walker = {
        ' ': function (node) {
          return node && node !== html && node.parentNode
        }
      , '>': function (node, contestant) {
          return node && node.parentNode == contestant.parentNode && node.parentNode
        }
      , '~': function (node) {
          return node && node.previousSibling
        }
      , '+': function (node, contestant, p1, p2) {
          if (!node) return false
          return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
        }
      }

    function cache() {
      this.c = {}
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined
      }
    , s: function (k, v, r) {
        v = r ? new RegExp(v) : v
        return (this.c[k] = v)
      }
    }

    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()

    function classRegex(c) {
      return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
    }

    // not quite as fast as inline loops in older browsers so don't use liberally
    function each(a, fn) {
      var i = 0, l = a.length
      for (; i < l; i++) fn(a[i])
    }

    function flatten(ar) {
      for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
      return r
    }

    function arrayify(ar) {
      var i = 0, l = ar.length, r = []
      for (; i < l; i++) r[i] = ar[i]
      return r
    }

    function previous(n) {
      while (n = n.previousSibling) if (n[nodeType] == 1) break;
      return n
    }

    function q(query) {
      return query.match(chunker)
    }

    // called using `this` as element and arguments from regex group results.
    // given => div.hello[title="world"]:foo('bar')
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var i, m, k, o, classes
      if (this[nodeType] !== 1) return false
      if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
      if (wholeAttribute && !value) { // select is just for existance of attrib
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
        // select is for attrib equality
        return false
      }
      return this
    }

    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }

    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
      }
      return 0
    }

    // given a selector, first check for simple cases then collect all base candidate matches and filter
    function _qwery(selector, _root) {
      var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers)

      if (!tokens.length) return r

      token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
      if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
      if (!root) return r

      intr = q(token)
      // collect base candidates to filter
      els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
        function (r) {
          while (root = root.nextSibling) {
            root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
          }
          return r
        }([]) :
        root[byTag](intr[1] || '*')
      // filter elements according to the right-most part of the selector
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) r[r.length] = item
      }
      if (!tokens.length) return r

      // filter further according to the rest of the selector (the left side)
      each(r, function (e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
      return ret
    }

    // compare element to a selector
    function is(el, selector, root) {
      if (isNode(selector)) return el == selector
      if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?

      var selectors = selector.split(','), tokens, dividedTokens
      while (selector = selectors.pop()) {
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        dividedTokens = selector.match(dividers)
        tokens = tokens.slice(0) // copy array
        if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
          return true
        }
      }
      return false
    }

    // given elements matching the right-most part of a selector, filter out any that don't match the rest
    function ancestorMatch(el, tokens, dividedTokens, root) {
      var cand
      // recursively work backwards through the tokens and up the dom, covering all options
      function crawl(e, i, p) {
        while (p = walker[dividedTokens[i]](p, e)) {
          if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
            if (i) {
              if (cand = crawl(p, i - 1, p)) return cand
            } else return p
          }
        }
      }
      return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
    }

    function isNode(el, t) {
      return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
    }

    function uniq(ar) {
      var a = [], i, j;
      o:
      for (i = 0; i < ar.length; ++i) {
        for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
        a[a.length] = ar[i]
      }
      return a
    }

    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }

    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (!root[nodeType] && arrayLike(root)) return root[0]
      return root
    }

    function byId(root, id, el) {
      // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
      return root[nodeType] === 9 ? root.getElementById(id) :
        root.ownerDocument &&
          (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
            (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
    }

    function qwery(selector, _root) {
      var m, el, root = normalizeRoot(_root)

      // easy, fast cases that we can dispatch with simple DOM calls
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(easy)) {
        if (m[1]) return (el = byId(root, m[1])) ? [el] : []
        if (m[2]) return arrayify(root[byTag](m[2]))
        if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
      }

      return select(selector, root)
    }

    // where the root is not document and a relationship selector is first we have to
    // do some awkward adjustments to get it to work, even with qSA
    function collectSelector(root, collector) {
      return function (s) {
        var oid, nid
        if (splittable.test(s)) {
          if (root[nodeType] !== 9) {
            // make sure the el has an id, rewrite the query, set root to doc and run it
            if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
            s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
            collector(root.parentNode || root, s, true)
            oid || root.removeAttribute('id')
          }
          return;
        }
        s.length && collector(root, s, false)
      }
    }

    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container[nodeType] === 9 || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      }
    , getAttr = function () {
        // detect buggy IE src/href getAttribute() call
        var e = doc.createElement('p')
        return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
          function (e, a) {
            return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
              e.getAttribute(a, 2) : e.getAttribute(a)
          } :
          function (e, a) { return e.getAttribute(a) }
      }()
    , hasByClass = !!doc[byClass]
      // has native qSA support
    , hasQSA = doc.querySelector && doc[qSA]
      // use native qSA
    , selectQSA = function (selector, root) {
        var result = [], ss, e
        try {
          if (root[nodeType] === 9 || !splittable.test(selector)) {
            // most work is done right here, defer to qSA
            return arrayify(root[qSA](selector))
          }
          // special case where we need the services of `collectSelector()`
          each(ss = selector.split(','), collectSelector(root, function (ctx, s) {
            e = ctx[qSA](s)
            if (e.length == 1) result[result.length] = e.item(0)
            else if (e.length) result = result.concat(arrayify(e))
          }))
          return ss.length > 1 && result.length > 1 ? uniq(result) : result
        } catch (ex) { }
        return selectNonNative(selector, root)
      }
      // no native selector support
    , selectNonNative = function (selector, root) {
        var result = [], items, m, i, l, r, ss
        selector = selector.replace(normalizr, '$1')
        if (m = selector.match(tagAndOrClass)) {
          r = classRegex(m[2])
          items = root[byTag](m[1] || '*')
          for (i = 0, l = items.length; i < l; i++) {
            if (r.test(items[i].className)) result[result.length] = items[i]
          }
          return result
        }
        // more complex selector, get `_qwery()` to do the work for us
        each(ss = selector.split(','), collectSelector(root, function (ctx, s, rewrite) {
          r = _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
    , configure = function (options) {
        // configNativeQSA: use fully-internal selector or native qSA where present
        if (typeof options[useNativeQSA] !== 'undefined')
          select = !options[useNativeQSA] ? selectNonNative : hasQSA ? selectQSA : selectNonNative
      }

    configure({ useNativeQSA: true })

    qwery.configure = configure
    qwery.uniq = uniq
    qwery.is = is
    qwery.pseudos = {}

    return qwery
  });

  if (typeof provide == "function") provide("qwery", module.exports);

  (function ($) {
    var q = function () {
      var r
      try {
        r = require('qwery')
      } catch (ex) {
        r = require('qwery-mobile')
      } finally {
        return r
      }
    }()

    $.pseudos = q.pseudos

    $._select = function (s, r) {
      // detect if sibling module 'bonzo' is available at run-time
      // rather than load-time since technically it's not a dependency and
      // can be loaded in any order
      // hence the lazy function re-definition
      return ($._select = (function () {
        var b
        if (typeof $.create == 'function') return function (s, r) {
          return /^\s*</.test(s) ? $.create(s, r) : q(s, r)
        }
        try {
          b = require('bonzo')
          return function (s, r) {
            return /^\s*</.test(s) ? b.create(s, r) : q(s, r)
          }
        } catch (e) { }
        return q
      })())(s, r)
    }

    $.ender({
        find: function (s) {
          var r = [], i, l, j, k, els
          for (i = 0, l = this.length; i < l; i++) {
            els = q(s, this[i])
            for (j = 0, k = els.length; j < k; j++) r.push(els[j])
          }
          return $(q.uniq(r))
        }
      , and: function (s) {
          var plus = $(s)
          for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
            this[i] = plus[j]
          }
          this.length += plus.length
          return this
        }
      , is: function(s, r) {
          var i, l
          for (i = 0, l = this.length; i < l; i++) {
            if (q.is(this[i], s, r)) {
              return true
            }
          }
          return false
        }
    }, true)
  }(ender));

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2012
    * https://github.com/ded/bonzo
    * License MIT
    */
  (function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  })('bonzo', this, function() {
    var win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , specialAttributes = /^(checked|value|selected|disabled)$/i
        // tags that we have trouble inserting *into*
      , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i
      , simpleScriptTagRe = /\s*<script +src=['"]([^'"]+)['"]>/
      , table = ['<table>', '</table>', 1]
      , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
      , option = ['<select>', '</select>', 1]
      , noscope = ['_', '', 0, 1]
      , tagMap = { // tags that we have trouble *inserting*
            thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: ['<table><tbody>', '</tbody></table>', 2]
          , th: td , td: td
          , col: ['<table><colgroup>', '</colgroup></table>', 2]
          , fieldset: ['<form>', '</form>', 1]
          , legend: ['<form><fieldset>', '</fieldset></form>', 2]
          , option: option, optgroup: option
          , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
        }
      , stateAttributes = /^(checked|selected|disabled)$/
      , ie = /msie/i.test(navigator.userAgent)
      , hasClass, addClass, removeClass
      , uidMap = {}
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , dattr = /^data-(.+)$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['transform', 'webkitTransform', 'MozTransform', 'OTransform', 'msTransform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
          , classList: 'classList' in e
          , opasity: function () {
              return typeof doc.createElement('a').style.opacity !== 'undefined'
            }()
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , whitespaceRegex = /\s+/
      , toString = String.prototype.toString
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
      , query = doc.querySelectorAll && function (selector) { return doc.querySelectorAll(selector) }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }

      , getStyle = features.computedStyle
          ? function (el, property) {
              var value = null
                , computed = doc.defaultView.getComputedStyle(el, '')
              computed && (value = computed[property])
              return el.style[property] || value
            }
          : !(ie && html.currentStyle)
            ? function (el, property) {
                return el.style[property]
              }
            :
            /**
             * @param {Element} el
             * @param {string} property
             * @return {string|number}
             */
            function (el, property) {
              var val, value
              if (property == 'opacity' && !features.opasity) {
                val = 100
                try {
                  val = el['filters']['DXImageTransform.Microsoft.Alpha'].opacity
                } catch (e1) {
                  try {
                    val = el['filters']('alpha').opacity
                  } catch (e2) {}
                }
                return val / 100
              }
              value = el.currentStyle ? el.currentStyle[property] : null
              return el.style[property] || value
            }

    function isNode(node) {
      return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
    }


    function normalize(node, host, clone) {
      var i, l, ret
      if (typeof node == 'string') return bonzo.create(node)
      if (isNode(node)) node = [ node ]
      if (clone) {
        ret = [] // don't change original array
        for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
        return ret
      }
      return node
    }

    /**
     * @param {string} c a class name to test
     * @return {boolean}
     */
    function classReg(c) {
      return new RegExp('(^|\\s+)' + c + '(\\s+|$)')
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @param {boolean=} opt_rev
     * @return {Bonzo|Array}
     */
    function each(ar, fn, opt_scope, opt_rev) {
      var ind, i = 0, l = ar.length
      for (; i < l; i++) {
        ind = opt_rev ? ar.length - i - 1 : i
        fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
      }
      return ar
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {Bonzo|Array}
     */
    function deepEach(ar, fn, opt_scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        if (isNode(ar[i])) {
          deepEach(ar[i].childNodes, fn, opt_scope)
          fn.call(opt_scope || ar[i], ar[i], i, ar)
        }
      }
      return ar
    }


    /**
     * @param {string} s
     * @return {string}
     */
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }


    /**
     * @param {string} s
     * @return {string}
     */
    function decamelize(s) {
      return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
    }


    /**
     * @param {Element} el
     * @return {*}
     */
    function data(el) {
      el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
      var uid = el[getAttribute]('data-node-uid')
      return uidMap[uid] || (uidMap[uid] = {})
    }


    /**
     * removes the data associated with an element
     * @param {Element} el
     */
    function clearData(el) {
      var uid = el[getAttribute]('data-node-uid')
      if (uid) delete uidMap[uid]
    }


    function dataValue(d) {
      var f
      try {
        return (d === null || d === undefined) ? undefined :
          d === 'true' ? true :
            d === 'false' ? false :
              d === 'null' ? null :
                (f = parseFloat(d)) == d ? f : d;
      } catch(e) {}
      return undefined
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {boolean} whether `some`thing was found
     */
    function some(ar, fn, opt_scope) {
      for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
      return false
    }


    /**
     * this could be a giant enum of CSS properties
     * but in favor of file size sans-closure deadcode optimizations
     * we're just asking for any ol string
     * then it gets transformed into the appropriate style property for JS access
     * @param {string} p
     * @return {string}
     */
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + 'Origin')) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }

    // this insert method is intense
    function insert(target, host, fn, rev) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t, j) {
        each(self, function (el) {
          fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
        }, null, rev)
      }, this, rev)
      self.length = i
      each(r, function (e) {
        self[--i] = e
      }, null, !rev)
      return self
    }


    /**
     * sets an element to an explicit x/y position on the page
     * @param {Element} el
     * @param {?number} x
     * @param {?number} y
     */
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]

      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }

      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)

      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)

    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    if (features.classList) {
      hasClass = function (el, c) {
        return el.classList.contains(c)
      }
      addClass = function (el, c) {
        el.classList.add(c)
      }
      removeClass = function (el, c) {
        el.classList.remove(c)
      }
    }
    else {
      hasClass = function (el, c) {
        return classReg(c).test(el.className)
      }
      addClass = function (el, c) {
        el.className = trim(el.className + ' ' + c)
      }
      removeClass = function (el, c) {
        el.className = trim(el.className.replace(classReg(c), ' '))
      }
    }


    /**
     * this allows method calling for setting values
     *
     * @example
     * bonzo(elements).css('color', function (el) {
     *   return el.getAttribute('data-original-color')
     * })
     *
     * @param {Element} el
     * @param {function (Element)|string}
     * @return {string}
     */
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }

    function scroll(x, y, type) {
      var el = this[0]
      if (!el) return this
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }

    /**
     * @constructor
     * @param {Array.<Element>|Element|Node|string} elements
     */
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) this[i] = elements[i]
      }
    }

    Bonzo.prototype = {

        /**
         * @param {number} index
         * @return {Element|Node}
         */
        get: function (index) {
          return this[index] || null
        }

        // itetators
        /**
         * @param {function(Element|Node)} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , each: function (fn, opt_scope) {
          return each(this, fn, opt_scope)
        }

        /**
         * @param {Function} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , deepEach: function (fn, opt_scope) {
          return deepEach(this, fn, opt_scope)
        }


        /**
         * @param {Function} fn
         * @param {Function=} opt_reject
         * @return {Array}
         */
      , map: function (fn, opt_reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }

      // text and html inserters!

      /**
       * @param {string} h the HTML to insert
       * @param {boolean=} opt_text whether to set or get text content
       * @return {Bonzo|string}
       */
      , html: function (h, opt_text) {
          var method = opt_text
                ? html.textContent === undefined ? 'innerText' : 'textContent'
                : 'innerHTML'
            , that = this
            , append = function (el, i) {
                each(normalize(h, that, i), function (node) {
                  el.appendChild(node)
                })
              }
            , updateElement = function (el, i) {
                try {
                  if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                    return el[method] = h
                  }
                } catch (e) {}
                append(el, i)
              }
          return typeof h != 'undefined'
            ? this.empty().each(updateElement)
            : this[0] ? this[0][method] : ''
        }

        /**
         * @param {string=} opt_text the text to set, otherwise this is a getter
         * @return {Bonzo|string}
         */
      , text: function (opt_text) {
          return this.html(opt_text, true)
        }

        // more related insertion methods

        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , append: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el.appendChild(i)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , prepend: function (node) {
          var that = this
          return this.each(function (el, i) {
            var first = el.firstChild
            each(normalize(node, that, i), function (i) {
              el.insertBefore(i, first)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , appendTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.appendChild(el)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , prependTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          }, 1)
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , before: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , after: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            }, null, 1)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertBefore: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertAfter: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            var sibling = t.nextSibling
            sibling ?
              t[parentNode].insertBefore(el, sibling) :
              t[parentNode].appendChild(el)
          }, 1)
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , replaceWith: function (node) {
          bonzo(normalize(node)).insertAfter(this)
          return this.remove()
        }

        /**
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , clone: function (opt_host) {
          var ret = [] // don't change original array
            , l, i
          for (i = 0, l = this.length; i < l; i++) ret[i] = cloneNode(opt_host || this, this[i])
          return bonzo(ret)
        }

        // class management

        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , addClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            // we `each` here so you can do $el.addClass('foo bar')
            each(c, function (c) {
              if (c && !hasClass(el, setter(el, c)))
                addClass(el, setter(el, c))
            })
          })
        }


        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , removeClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c && hasClass(el, setter(el, c)))
                removeClass(el, setter(el, c))
            })
          })
        }


        /**
         * @param {string} c
         * @return {boolean}
         */
      , hasClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return some(this, function (el) {
            return some(c, function (c) {
              return c && hasClass(el, c)
            })
          })
        }


        /**
         * @param {string} c classname to toggle
         * @param {boolean=} opt_condition whether to add or remove the class straight away
         * @return {Bonzo}
         */
      , toggleClass: function (c, opt_condition) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c) {
                typeof opt_condition !== 'undefined' ?
                  opt_condition ? !hasClass(el, c) && addClass(el, c) : removeClass(el, c) :
                  hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
              }
            })
          })
        }

        // display togglers

        /**
         * @param {string=} opt_type useful to set back to anything other than an empty string
         * @return {Bonzo}
         */
      , show: function (opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : ''
          return this.each(function (el) {
            el.style.display = opt_type
          })
        }


        /**
         * @return {Bonzo}
         */
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }


        /**
         * @param {Function=} opt_callback
         * @param {string=} opt_type
         * @return {Bonzo}
         */
      , toggle: function (opt_callback, opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : '';
          typeof opt_callback != 'function' && (opt_callback = null)
          return this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type;
            opt_callback && opt_callback.call(el)
          })
        }


        // DOM Walkers & getters

        /**
         * @return {Element|Node}
         */
      , first: function () {
          return bonzo(this.length ? this[0] : [])
        }


        /**
         * @return {Element|Node}
         */
      , last: function () {
          return bonzo(this.length ? this[this.length - 1] : [])
        }


        /**
         * @return {Element|Node}
         */
      , next: function () {
          return this.related('nextSibling')
        }


        /**
         * @return {Element|Node}
         */
      , previous: function () {
          return this.related('previousSibling')
        }


        /**
         * @return {Element|Node}
         */
      , parent: function() {
          return this.related(parentNode)
        }


        /**
         * @private
         * @param {string} method the directional DOM method
         * @return {Element|Node}
         */
      , related: function (method) {
          return bonzo(this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          ))
        }


        /**
         * @return {Bonzo}
         */
      , focus: function () {
          this.length && this[0].focus()
          return this
        }


        /**
         * @return {Bonzo}
         */
      , blur: function () {
          this.length && this[0].blur()
          return this
        }

        // style getter setter & related methods

        /**
         * @param {Object|string} o
         * @param {string=} opt_v
         * @return {Bonzo|string}
         */
      , css: function (o, opt_v) {
          var p, iter = o
          // is this a request for just getting a style?
          if (opt_v === undefined && typeof o == 'string') {
            // repurpose 'v'
            opt_v = this[0]
            if (!opt_v) return null
            if (opt_v === doc || opt_v === win) {
              p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
          }

          if (typeof o == 'string') {
            iter = {}
            iter[o] = opt_v
          }

          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }

          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                try { el.style[p] = setter(el, v) } catch(e) {}
              }
            }
          }
          return this.each(fn)
        }


        /**
         * @param {number=} opt_x
         * @param {number=} opt_y
         * @return {Bonzo|number}
         */
      , offset: function (opt_x, opt_y) {
          if (opt_x && typeof opt_x == 'object' && (typeof opt_x.top == 'number' || typeof opt_x.left == 'number')) {
            return this.each(function (el) {
              xy(el, opt_x.left, opt_x.top)
            })
          } else if (typeof opt_x == 'number' || typeof opt_y == 'number') {
            return this.each(function (el) {
              xy(el, opt_x, opt_y)
            })
          }
          if (!this[0]) return {
              top: 0
            , left: 0
            , height: 0
            , width: 0
          }
          var el = this[0]
            , de = el.ownerDocument.documentElement
            , bcr = el.getBoundingClientRect()
            , scroll = getWindowScroll()
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = bcr.top + scroll.y - Math.max(0, de && de.clientTop, doc.body.clientTop)
            , left = bcr.left + scroll.x - Math.max(0, de && de.clientLeft, doc.body.clientLeft)

          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }


        /**
         * @return {number}
         */
      , dim: function () {
          if (!this.length) return { height: 0, width: 0 }
          var el = this[0]
            , de = el.nodeType == 9 && el.documentElement // document
            , orig = !de && !!el.style && !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t) {
                 var s = {
                     position: el.style.position || ''
                   , visibility: el.style.visibility || ''
                   , display: el.style.display || ''
                 }
                 t.first().css({
                     position: 'absolute'
                   , visibility: 'hidden'
                   , display: 'block'
                 })
                 return s
              }(this) : null
            , width = de
                ? Math.max(el.body.scrollWidth, el.body.offsetWidth, de.scrollWidth, de.offsetWidth, de.clientWidth)
                : el.offsetWidth
            , height = de
                ? Math.max(el.body.scrollHeight, el.body.offsetHeight, de.scrollHeight, de.offsetHeight, de.clientHeight)
                : el.offsetHeight

          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }

        // attributes are hard. go shopping

        /**
         * @param {string} k an attribute to get or set
         * @param {string=} opt_v the value to set
         * @return {Bonzo|string}
         */
      , attr: function (k, opt_v) {
          var el = this[0]
            , n

          if (typeof k != 'string' && !(k instanceof String)) {
            for (n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }

          return typeof opt_v == 'undefined' ?
            !el ? null : specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
            })
        }


        /**
         * @param {string} k
         * @return {Bonzo}
         */
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }


        /**
         * @param {string=} opt_s
         * @return {Bonzo|string}
         */
      , val: function (s) {
          return (typeof s == 'string') ?
            this.attr('value', s) :
            this.length ? this[0].value : null
        }

        // use with care and knowledge. this data() method uses data attributes on the DOM nodes
        // to do this differently costs a lot more code. c'est la vie
        /**
         * @param {string|Object=} opt_k the key for which to get or set data
         * @param {Object=} opt_v
         * @return {Bonzo|Object}
         */
      , data: function (opt_k, opt_v) {
          var el = this[0], o, m
          if (typeof opt_v === 'undefined') {
            if (!el) return null
            o = data(el)
            if (typeof opt_k === 'undefined') {
              each(el.attributes, function (a) {
                (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
              })
              return o
            } else {
              if (typeof o[opt_k] === 'undefined')
                o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
              return o[opt_k]
            }
          } else {
            return this.each(function (el) { data(el)[opt_k] = opt_v })
          }
        }

        // DOM detachment & related

        /**
         * @return {Bonzo}
         */
      , remove: function () {
          this.deepEach(clearData)
          return this.detach()
        }


        /**
         * @return {Bonzo}
         */
      , empty: function () {
          return this.each(function (el) {
            deepEach(el.childNodes, clearData)

            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }


        /**
         * @return {Bonzo}
         */
      , detach: function () {
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }

        // who uses a mouse anyway? oh right.

        /**
         * @param {number} y
         */
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }


        /**
         * @param {number} x
         */
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }

    }


    function cloneNode(host, el) {
      var c = el.cloneNode(true)
        , cloneElems
        , elElems
        , i

      // check for existence of an event cloner
      // preferably https://github.com/fat/bean
      // otherwise Bonzo won't do this for you
      if (host.$ && typeof host.cloneEvents == 'function') {
        host.$(c).cloneEvents(el)

        // clone events from every child node
        cloneElems = host.$(c).find('*')
        elElems = host.$(el).find('*')

        for (i = 0; i < elElems.length; i++)
          host.$(cloneElems[i]).cloneEvents(elElems[i])
      }
      return c
    }

    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }

    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }

    function createScriptFromHtml(html) {
      var scriptEl = document.createElement('script')
        , matches = html.match(simpleScriptTagRe)
      scriptEl.src = matches[1]
      return scriptEl
    }

    /**
     * @param {Array.<Element>|Element|Node|string} els
     * @return {Bonzo}
     */
    function bonzo(els) {
      return new Bonzo(els)
    }

    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }

    bonzo.aug = function (o, target) {
      // for those standalone bonzo users. this love is for you.
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }

    bonzo.create = function (node) {
      // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
      return typeof node == 'string' && node !== '' ?
        function () {
          if (simpleScriptTagRe.test(node)) return [createScriptFromHtml(node)]
          var tag = node.match(/^\s*<([^\s>]+)/)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , ns = p && p[3]
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)

          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          // for IE NoScope, we may insert cruft at the begining just to get it to work
          if (ns && el && el.nodeType !== 1) el = el.nextSibling
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || (el.tagName && el.tagName != 'TBODY'))) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }

    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }

    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }

    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }

    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }

    return bonzo
  }); // the only line we care about using a semi-colon. placed here for concatenation tools

  if (typeof provide == "function") provide("bonzo", module.exports);

  (function ($) {

    var b = require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })

    $.id = function (id) {
      return $([document.getElementById(id)])
    }

    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
      return -1
    }

    function uniq(ar) {
      var r = [], i = 0, j = 0, k, item, inIt
      for (; item = ar[i]; ++i) {
        inIt = false
        for (k = 0; k < r.length; ++k) {
          if (r[k] === item) {
            inIt = true; break
          }
        }
        if (!inIt) r[j++] = item
      }
      return r
    }

    $.ender({
      parents: function (selector, closest) {
        if (!this.length) return this
        if (!selector) selector = '*'
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      }

    , parent: function() {
        return $(uniq(b(this).parent()))
      }

    , closest: function (selector) {
        return this.parents(selector, true)
      }

    , first: function () {
        return $(this.length ? this[0] : this)
      }

    , last: function () {
        return $(this.length ? this[this.length - 1] : [])
      }

    , next: function () {
        return $(b(this).next())
      }

    , previous: function () {
        return $(b(this).previous())
      }

    , related: function (t) {
        return $(b(this).related(t))
      }

    , appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      }

    , prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      }

    , insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      }

    , insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      }

    , clone: function () {
        return $(b(this).clone(this))
      }

    , siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      }

    , children: function () {
        var i, l, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      }

    , height: function (v) {
        return dimension.call(this, 'height', v)
      }

    , width: function (v) {
        return dimension.call(this, 'width', v)
      }
    }, true)

    /**
     * @param {string} type either width or height
     * @param {number=} opt_v becomes a setter instead of a getter
     * @return {number}
     */
    function dimension(type, opt_v) {
      return typeof opt_v == 'undefined'
        ? b(this).dim()[type]
        : this.css(type, opt_v)
    }
  }(ender));
}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bean - copyright (c) Jacob Thornton 2011-2012
    * https://github.com/fat/bean
    * MIT license
    */
  (function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  })('bean', this, function (name, context) {
    name    = name    || 'bean'
    context = context || this

    var win            = window
      , old            = context[name]
      , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
      , nameRegex      = /\..*/
      , addEvent       = 'addEventListener'
      , removeEvent    = 'removeEventListener'
      , doc            = document || {}
      , root           = doc.documentElement || {}
      , W3C_MODEL      = root[addEvent]
      , eventSupport   = W3C_MODEL ? addEvent : 'attachEvent'
      , ONE            = {} // singleton for quick matching making add() do one()

      , slice          = Array.prototype.slice
      , str2arr        = function (s, d) { return s.split(d || ' ') }
      , isString       = function (o) { return typeof o == 'string' }
      , isFunction     = function (o) { return typeof o == 'function' }

        // events that we consider to be 'native', anything not in this list will
        // be treated as a custom event
      , standardNativeEvents =
          'click dblclick mouseup mousedown contextmenu '                  + // mouse buttons
          'mousewheel mousemultiwheel DOMMouseScroll '                     + // mouse wheel
          'mouseover mouseout mousemove selectstart selectend '            + // mouse movement
          'keydown keypress keyup '                                        + // keyboard
          'orientationchange '                                             + // mobile
          'focus blur change reset select submit '                         + // form elements
          'load unload beforeunload resize move DOMContentLoaded '         + // window
          'readystatechange message '                                      + // window
          'error abort scroll '                                              // misc
        // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
        // that doesn't actually exist, so make sure we only do these on newer browsers
      , w3cNativeEvents =
          'show '                                                          + // mouse buttons
          'input invalid '                                                 + // form elements
          'touchstart touchmove touchend touchcancel '                     + // touch
          'gesturestart gesturechange gestureend '                         + // gesture
          'textinput'                                                      + // TextEvent
          'readystatechange pageshow pagehide popstate '                   + // window
          'hashchange offline online '                                     + // window
          'afterprint beforeprint '                                        + // printing
          'dragstart dragenter dragover dragleave drag drop dragend '      + // dnd
          'loadstart progress suspend emptied stalled loadmetadata '       + // media
          'loadeddata canplay canplaythrough playing waiting seeking '     + // media
          'seeked ended durationchange timeupdate play pause ratechange '  + // media
          'volumechange cuechange '                                        + // media
          'checking noupdate downloading cached updateready obsolete '       // appcache

        // convert to a hash for quick lookups
      , nativeEvents = (function (hash, events, i) {
          for (i = 0; i < events.length; i++) events[i] && (hash[events[i]] = 1)
          return hash
        }({}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : ''))))

        // custom events are events that we *fake*, they are not provided natively but
        // we can use native events to generate them
      , customEvents = (function () {
          var isAncestor = 'compareDocumentPosition' in root
                ? function (element, container) {
                    return container.compareDocumentPosition && (container.compareDocumentPosition(element) & 16) === 16
                  }
                : 'contains' in root
                  ? function (element, container) {
                      container = container.nodeType === 9 || container === window ? root : container
                      return container !== element && container.contains(element)
                    }
                  : function (element, container) {
                      while (element = element.parentNode) if (element === container) return 1
                      return 0
                    }
            , check = function (event) {
                var related = event.relatedTarget
                return !related
                  ? related == null
                  : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
                      && !isAncestor(related, this))
              }

          return {
              mouseenter: { base: 'mouseover', condition: check }
            , mouseleave: { base: 'mouseout', condition: check }
            , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
          }
        }())

        // we provide a consistent Event object across browsers by taking the actual DOM
        // event object and generating a new one from its properties.
      , Event = (function () {
              // a whitelist of properties (for different event types) tells us what to check for and copy
          var commonProps  = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget ' +
                'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '  +
                'srcElement target timeStamp type view which propertyName')
            , mouseProps   = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '      +
                'fromElement offsetX offsetY pageX pageY screenX screenY toElement'))
            , mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' +
                'axis')) // 'axis' is FF specific
            , keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
                'keyLocation location'))
            , textProps    = commonProps.concat(str2arr('data'))
            , touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
            , messageProps = commonProps.concat(str2arr('data origin source'))
            , stateProps   = commonProps.concat(str2arr('state'))
            , overOutRegex = /over|out/
              // some event types need special handling and some need special properties, do that all here
            , typeFixers   = [
                  { // key events
                      reg: /key/i
                    , fix: function (event, newEvent) {
                        newEvent.keyCode = event.keyCode || event.which
                        return keyProps
                      }
                  }
                , { // mouse events
                      reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
                    , fix: function (event, newEvent, type) {
                        newEvent.rightClick = event.which === 3 || event.button === 2
                        newEvent.pos = { x: 0, y: 0 }
                        if (event.pageX || event.pageY) {
                          newEvent.clientX = event.pageX
                          newEvent.clientY = event.pageY
                        } else if (event.clientX || event.clientY) {
                          newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                          newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                        }
                        if (overOutRegex.test(type)) {
                          newEvent.relatedTarget = event.relatedTarget
                            || event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
                        }
                        return mouseProps
                      }
                  }
                , { // mouse wheel events
                      reg: /mouse.*(wheel|scroll)/i
                    , fix: function () { return mouseWheelProps }
                  }
                , { // TextEvent
                      reg: /^text/i
                    , fix: function () { return textProps }
                  }
                , { // touch and gesture events
                      reg: /^touch|^gesture/i
                    , fix: function () { return touchProps }
                  }
                , { // message events
                      reg: /^message$/i
                    , fix: function () { return messageProps }
                  }
                , { // popstate events
                      reg: /^popstate$/i
                    , fix: function () { return stateProps }
                  }
                , { // everything else
                      reg: /.*/
                    , fix: function () { return commonProps }
                  }
              ]
            , typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

            , Event = function (event, element, isNative) {
                if (!arguments.length) return
                event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
                this.originalEvent = event
                this.isNative       = isNative
                this.isBean         = true

                if (!event) return

                var type   = event.type
                  , target = event.target || event.srcElement
                  , i, l, p, props, fixer

                this.target = target && target.nodeType === 3 ? target.parentNode : target

                if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
                  fixer = typeFixerMap[type]
                  if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                    for (i = 0, l = typeFixers.length; i < l; i++) {
                      if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                        typeFixerMap[type] = fixer = typeFixers[i].fix
                        break
                      }
                    }
                  }

                  props = fixer(event, this, type)
                  for (i = props.length; i--;) {
                    if (!((p = props[i]) in this) && p in event) this[p] = event[p]
                  }
                }
              }

          // preventDefault() and stopPropagation() are a consistent interface to those functions
          // on the DOM, stop() is an alias for both of them together
          Event.prototype.preventDefault = function () {
            if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
            else this.originalEvent.returnValue = false
          }
          Event.prototype.stopPropagation = function () {
            if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
            else this.originalEvent.cancelBubble = true
          }
          Event.prototype.stop = function () {
            this.preventDefault()
            this.stopPropagation()
            this.stopped = true
          }
          // stopImmediatePropagation() has to be handled internally because we manage the event list for
          // each element
          // note that originalElement may be a Bean#Event object in some situations
          Event.prototype.stopImmediatePropagation = function () {
            if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
            this.isImmediatePropagationStopped = function () { return true }
          }
          Event.prototype.isImmediatePropagationStopped = function () {
            return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
          }
          Event.prototype.clone = function (currentTarget) {
            //TODO: this is ripe for optimisation, new events are *expensive*
            // improving this will speed up delegated events
            var ne = new Event(this, this.element, this.isNative)
            ne.currentTarget = currentTarget
            return ne
          }

          return Event
        }())

        // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
      , targetElement = function (element, isNative) {
          return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
        }

        /**
          * Bean maintains an internal registry for event listeners. We don't touch elements, objects
          * or functions to identify them, instead we store everything in the registry.
          * Each event listener has a RegEntry object, we have one 'registry' for the whole instance.
          */
      , RegEntry = (function () {
          // each handler is wrapped so we can handle delegation and custom events
          var wrappedHandler = function (element, fn, condition, args) {
              var call = function (event, eargs) {
                    return fn.apply(element, args ? slice.call(eargs, event ? 0 : 1).concat(args) : eargs)
                  }
                , findTarget = function (event, eventElement) {
                    return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement
                  }
                , handler = condition
                    ? function (event) {
                        var target = findTarget(event, this) // deleated event
                        if (condition.apply(target, arguments)) {
                          if (event) event.currentTarget = target
                          return call(event, arguments)
                        }
                      }
                    : function (event) {
                        if (fn.__beanDel) event = event.clone(findTarget(event)) // delegated event, fix the fix
                        return call(event, arguments)
                      }
              handler.__beanDel = fn.__beanDel
              return handler
            }

          , RegEntry = function (element, type, handler, original, namespaces, args, root) {
              var customType     = customEvents[type]
                , isNative

              if (type == 'unload') {
                // self clean-up
                handler = once(removeListener, element, type, handler, original)
              }

              if (customType) {
                if (customType.condition) {
                  handler = wrappedHandler(element, handler, customType.condition, args)
                }
                type = customType.base || type
              }

              this.isNative      = isNative = nativeEvents[type] && !!element[eventSupport]
              this.customType    = !W3C_MODEL && !isNative && type
              this.element       = element
              this.type          = type
              this.original      = original
              this.namespaces    = namespaces
              this.eventType     = W3C_MODEL || isNative ? type : 'propertychange'
              this.target        = targetElement(element, isNative)
              this[eventSupport] = !!this.target[eventSupport]
              this.root          = root
              this.handler       = wrappedHandler(element, handler, null, args)
            }

          // given a list of namespaces, is our entry in any of them?
          RegEntry.prototype.inNamespaces = function (checkNamespaces) {
            var i, j, c = 0
            if (!checkNamespaces) return true
            if (!this.namespaces) return false
            for (i = checkNamespaces.length; i--;) {
              for (j = this.namespaces.length; j--;) {
                if (checkNamespaces[i] == this.namespaces[j]) c++
              }
            }
            return checkNamespaces.length === c
          }

          // match by element, original fn (opt), handler fn (opt)
          RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
            return this.element === checkElement &&
              (!checkOriginal || this.original === checkOriginal) &&
              (!checkHandler || this.handler === checkHandler)
          }

          return RegEntry
        }())

      , registry = (function () {
          // our map stores arrays by event type, just because it's better than storing
          // everything in a single array.
          // uses '$' as a prefix for the keys for safety and 'r' as a special prefix for
          // rootListeners so we can look them up fast
          var map = {}

            // generic functional search of our registry for matching listeners,
            // `fn` returns false to break out of the loop
            , forAll = function (element, type, original, handler, root, fn) {
                var pfx = root ? 'r' : '$'
                if (!type || type == '*') {
                  // search the whole registry
                  for (var t in map) {
                    if (t.charAt(0) == pfx) {
                      forAll(element, t.substr(1), original, handler, root, fn)
                    }
                  }
                } else {
                  var i = 0, l, list = map[pfx + type], all = element == '*'
                  if (!list) return
                  for (l = list.length; i < l; i++) {
                    if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return
                  }
                }
              }

            , has = function (element, type, original, root) {
                // we're not using forAll here simply because it's a bit slower and this
                // needs to be fast
                var i, list = map[(root ? 'r' : '$') + type]
                if (list) {
                  for (i = list.length; i--;) {
                    if (!list[i].root && list[i].matches(element, original, null)) return true
                  }
                }
                return false
              }

            , get = function (element, type, original, root) {
                var entries = []
                forAll(element, type, original, null, root, function (entry) {
                  return entries.push(entry)
                })
                return entries
              }

            , put = function (entry) {
                var has = !entry.root && !this.has(entry.element, entry.type, null, false)
                  , key = (entry.root ? 'r' : '$') + entry.type
                ;(map[key] || (map[key] = [])).push(entry)
                return has
              }

            , del = function (entry) {
                forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                  list.splice(i, 1)
                  entry.removed = true
                  if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type]
                  return false
                })
              }

              // dump all entries, used for onunload
            , entries = function () {
                var t, entries = []
                for (t in map) {
                  if (t.charAt(0) == '$') entries = entries.concat(map[t])
                }
                return entries
              }

          return { has: has, get: get, put: put, del: del, entries: entries }
        }())

        // we need a selector engine for delegated events, use querySelectorAll if it exists
        // but for older browsers we need Qwery, Sizzle or similar
      , selectorEngine
      , setSelectorEngine = function (e) {
          if (!arguments.length) {
            selectorEngine = doc.querySelectorAll
              ? function (s, r) {
                  return r.querySelectorAll(s)
                }
              : function () {
                  throw new Error('Bean: No selector engine installed') // eeek
                }
          } else {
            selectorEngine = e
          }
        }

        // we attach this listener to each DOM event that we need to listen to, only once
        // per event type per DOM element
      , rootListener = function (event, type) {
          if (!W3C_MODEL && type && event && event.propertyName != '_on' + type) return

          var listeners = registry.get(this, type || event.type, null, false)
            , l = listeners.length
            , i = 0

          event = new Event(event, this, true)
          if (type) event.type = type

          // iterate through all handlers registered for this type, calling them unless they have
          // been removed by a previous handler or stopImmediatePropagation() has been called
          for (; i < l && !event.isImmediatePropagationStopped(); i++) {
            if (!listeners[i].removed) listeners[i].handler.call(this, event)
          }
        }

        // add and remove listeners to DOM elements
      , listener = W3C_MODEL
          ? function (element, type, add) {
              // new browsers
              element[add ? addEvent : removeEvent](type, rootListener, false)
            }
          : function (element, type, add, custom) {
              // IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
              // to simulate event bubbling etc.
              var entry
              if (add) {
                registry.put(entry = new RegEntry(
                    element
                  , custom || type
                  , function (event) { // handler
                      rootListener.call(element, event, custom)
                    }
                  , rootListener
                  , null
                  , null
                  , true // is root
                ))
                if (custom && element['_on' + custom] == null) element['_on' + custom] = 0
                entry.target.attachEvent('on' + entry.eventType, entry.handler)
              } else {
                entry = registry.get(element, custom || type, rootListener, true)[0]
                if (entry) {
                  entry.target.detachEvent('on' + entry.eventType, entry.handler)
                  registry.del(entry)
                }
              }
            }

      , once = function (rm, element, type, fn, originalFn) {
          // wrap the handler in a handler that does a remove as well
          return function () {
            fn.apply(this, arguments)
            rm(element, type, originalFn)
          }
        }

      , removeListener = function (element, orgType, handler, namespaces) {
          var type     = orgType && orgType.replace(nameRegex, '')
            , handlers = registry.get(element, type, null, false)
            , removed  = {}
            , i, l

          for (i = 0, l = handlers.length; i < l; i++) {
            if ((!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces)) {
              // TODO: this is problematic, we have a registry.get() and registry.del() that
              // both do registry searches so we waste cycles doing this. Needs to be rolled into
              // a single registry.forAll(fn) that removes while finding, but the catch is that
              // we'll be splicing the arrays that we're iterating over. Needs extra tests to
              // make sure we don't screw it up. @rvagg
              registry.del(handlers[i])
              if (!removed[handlers[i].eventType] && handlers[i][eventSupport])
                removed[handlers[i].eventType] = { t: handlers[i].eventType, c: handlers[i].type }
            }
          }
          // check each type/element for removed listeners and remove the rootListener where it's no longer needed
          for (i in removed) {
            if (!registry.has(element, removed[i].t, null, false)) {
              // last listener of this type, remove the rootListener
              listener(element, removed[i].t, false, removed[i].c)
            }
          }
        }

        // set up a delegate helper using the given selector, wrap the handler function
      , delegate = function (selector, fn) {
          //TODO: findTarget (therefore $) is called twice, once for match and once for
          // setting e.currentTarget, fix this so it's only needed once
          var findTarget = function (target, root) {
                var i, array = isString(selector) ? selectorEngine(selector, root) : selector
                for (; target && target !== root; target = target.parentNode) {
                  for (i = array.length; i--;) {
                    if (array[i] === target) return target
                  }
                }
              }
            , handler = function (e) {
                var match = findTarget(e.target, this)
                if (match) fn.apply(match, arguments)
              }

          // __beanDel isn't pleasant but it's a private function, not exposed outside of Bean
          handler.__beanDel = {
              ft       : findTarget // attach it here for customEvents to use too
            , selector : selector
          }
          return handler
        }

      , fireListener = W3C_MODEL ? function (isNative, type, element) {
          // modern browsers, do a proper dispatchEvent()
          var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
          evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
          element.dispatchEvent(evt)
        } : function (isNative, type, element) {
          // old browser use onpropertychange, just increment a custom property to trigger the event
          element = targetElement(element, isNative)
          isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
        }

        /**
          * Public API: off(), on(), add(), (remove()), one(), fire(), clone()
          */

        /**
          * off(element[, eventType(s)[, handler ]])
          */
      , off = function (element, typeSpec, fn) {
          var isTypeStr = isString(typeSpec)
            , k, type, namespaces, i

          if (isTypeStr && typeSpec.indexOf(' ') > 0) {
            // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
            typeSpec = str2arr(typeSpec)
            for (i = typeSpec.length; i--;)
              off(element, typeSpec[i], fn)
            return element
          }

          type = isTypeStr && typeSpec.replace(nameRegex, '')
          if (type && customEvents[type]) type = customEvents[type].base

          if (!typeSpec || isTypeStr) {
            // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
            if (namespaces = isTypeStr && typeSpec.replace(namespaceRegex, '')) namespaces = str2arr(namespaces, '.')
            removeListener(element, type, fn, namespaces)
          } else if (isFunction(typeSpec)) {
            // off(el, fn)
            removeListener(element, null, typeSpec)
          } else {
            // off(el, { t1: fn1, t2, fn2 })
            for (k in typeSpec) {
              if (typeSpec.hasOwnProperty(k)) off(element, k, typeSpec[k])
            }
          }

          return element
        }

        /**
          * on(element, eventType(s)[, selector], handler[, args ])
          */
      , on = function(element, events, selector, fn) {
          var originalFn, type, types, i, args, entry, first

          //TODO: the undefined check means you can't pass an 'args' argument, fix this perhaps?
          if (selector === undefined && typeof events == 'object') {
            //TODO: this can't handle delegated events
            for (type in events) {
              if (events.hasOwnProperty(type)) {
                on.call(this, element, type, events[type])
              }
            }
            return
          }

          if (!isFunction(selector)) {
            // delegated event
            originalFn = fn
            args       = slice.call(arguments, 4)
            fn         = delegate(selector, originalFn, selectorEngine)
          } else {
            args       = slice.call(arguments, 3)
            fn         = originalFn = selector
          }

          types = str2arr(events)

          // special case for one(), wrap in a self-removing handler
          if (this === ONE) {
            fn = once(off, element, events, fn, originalFn)
          }

          for (i = types.length; i--;) {
            // add new handler to the registry and check if it's the first for this element/type
            first = registry.put(entry = new RegEntry(
                element
              , types[i].replace(nameRegex, '') // event type
              , fn
              , originalFn
              , str2arr(types[i].replace(namespaceRegex, ''), '.') // namespaces
              , args
              , false // not root
            ))
            if (entry[eventSupport] && first) {
              // first event of this type on this element, add root listener
              listener(element, entry.eventType, true, entry.customType)
            }
          }

          return element
        }

        /**
          * add(element[, selector], eventType(s), handler[, args ])
          *
          * Deprecated: kept (for now) for backward-compatibility
          */
      , add = function (element, events, fn, delfn) {
          return on.apply(
              null
            , !isString(fn)
                ? slice.call(arguments)
                : [ element, fn, events, delfn ].concat(arguments.length > 3 ? slice.call(arguments, 5) : [])
          )
        }

        /**
          * one(element, eventType(s)[, selector], handler[, args ])
          */
      , one = function () {
          return on.apply(ONE, arguments)
        }

        /**
          * fire(element, eventType(s)[, args ])
          *
          * The optional 'args' argument must be an array, if no 'args' argument is provided
          * then we can use the browser's DOM event system, otherwise we trigger handlers manually
          */
      , fire = function (element, type, args) {
          var types = str2arr(type)
            , i, j, l, names, handlers

          for (i = types.length; i--;) {
            type = types[i].replace(nameRegex, '')
            if (names = types[i].replace(namespaceRegex, '')) names = str2arr(names, '.')
            if (!names && !args && element[eventSupport]) {
              fireListener(nativeEvents[type], type, element)
            } else {
              // non-native event, either because of a namespace, arguments or a non DOM element
              // iterate over all listeners and manually 'fire'
              handlers = registry.get(element, type, null, false)
              args = [false].concat(args)
              for (j = 0, l = handlers.length; j < l; j++) {
                if (handlers[j].inNamespaces(names)) {
                  handlers[j].handler.apply(element, args)
                }
              }
            }
          }
          return element
        }

        /**
          * clone(dstElement, srcElement[, eventType ])
          *
          * TODO: perhaps for consistency we should allow the same flexibility in type specifiers?
          */
      , clone = function (element, from, type) {
          var handlers = registry.get(from, type, null, false)
            , l = handlers.length
            , i = 0
            , args, beanDel

          for (; i < l; i++) {
            if (handlers[i].original) {
              args = [ element, handlers[i].type ]
              if (beanDel = handlers[i].handler.__beanDel) args.push(beanDel.selector)
              args.push(handlers[i].original)
              on.apply(null, args)
            }
          }
          return element
        }

      , bean = {
            on                : on
          , add               : add
          , one               : one
          , off               : off
          , remove            : off
          , clone             : clone
          , fire              : fire
          , Event             : Event
          , setSelectorEngine : setSelectorEngine
          , noConflict        : function () {
              context[name] = old
              return this
            }
        }

    // for IE, clean up on unload to avoid leaks
    if (win.attachEvent) {
      var cleanup = function () {
        var i, entries = registry.entries()
        for (i in entries) {
          if (entries[i].type && entries[i].type !== 'unload') off(entries[i].element, entries[i].type)
        }
        win.detachEvent('onunload', cleanup)
        win.CollectGarbage && win.CollectGarbage()
      }
      win.attachEvent('onunload', cleanup)
    }

    // initialize selector engine to internal default (qSA or throw Error)
    setSelectorEngine()

    return bean
  });
  if (typeof provide == "function") provide("bean", module.exports);

  !function ($) {
    var b = require('bean')

      , integrate = function (method, type, method2) {
          var _args = type ? [type] : []
          return function () {
            for (var i = 0, l = this.length; i < l; i++) {
              if (!arguments.length && method == 'on' && type) method = 'fire'
              b[method].apply(this, [this[i]].concat(_args, Array.prototype.slice.call(arguments, 0)))
            }
            return this
          }
        }

      , add   = integrate('add')
      , on    = integrate('on')
      , one   = integrate('one')
      , off   = integrate('off')
      , fire  = integrate('fire')
      , clone = integrate('clone')

      , hover = function (enter, leave, i) { // i for internal
          for (i = this.length; i--;) {
            b.on.call(this, this[i], 'mouseenter', enter)
            b.on.call(this, this[i], 'mouseleave', leave)
          }
          return this
        }

      , methods = {
            on             : on
          , addListener    : on
          , bind           : on
          , listen         : on
          , delegate       : add // jQuery compat, same arg order as add()

          , one            : one

          , off            : off
          , unbind         : off
          , unlisten       : off
          , removeListener : off
          , undelegate     : off

          , emit           : fire
          , trigger        : fire

          , cloneEvents    : clone

          , hover          : hover
        }

      , shortcuts =
           ('blur change click dblclick error focus focusin focusout keydown keypress '
          + 'keyup load mousedown mouseenter mouseleave mouseout mouseover mouseup '
          + 'mousemove resize scroll select submit unload').split(' ')

    for (var i = shortcuts.length; i--;) {
      methods[shortcuts[i]] = integrate('on', shortcuts[i])
    }

    b.setSelectorEngine($)

    $.ender(methods, true)
  }(ender);
}());

(function () {

  var module = { exports: {} }, exports = module.exports;


  if (typeof provide == "function") provide("jeesh", module.exports);
  $.ender(module.exports);
}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /**
   * @license
   * Lo-Dash 2.1.0 (Custom Build) <http://lodash.com/>
   * Build: `lodash modern -o ./dist/lodash.js`
   * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <http://lodash.com/license>
   */
  ;(function() {

    /** Used as a safe reference for `undefined` in pre ES5 environments */
    var undefined;

    /** Used to pool arrays and objects used internally */
    var arrayPool = [],
        objectPool = [];

    /** Used to generate unique IDs */
    var idCounter = 0;

    /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
    var keyPrefix = +new Date + '';

    /** Used as the size when optimizations are enabled for large arrays */
    var largeArraySize = 75;

    /** Used as the max size of the `arrayPool` and `objectPool` */
    var maxPoolSize = 40;

    /** Used to detect and test whitespace */
    var whitespace = (
      // whitespace
      ' \t\x0B\f\xA0\ufeff' +

      // line terminators
      '\n\r\u2028\u2029' +

      // unicode category "Zs" space separators
      '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
    );

    /** Used to match empty string literals in compiled template source */
    var reEmptyStringLeading = /\b__p \+= '';/g,
        reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
        reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

    /**
     * Used to match ES6 template delimiters
     * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
     */
    var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

    /** Used to match regexp flags from their coerced string values */
    var reFlags = /\w*$/;

    /** Used to detected named functions */
    var reFuncName = /^function[ \n\r\t]+\w/;

    /** Used to match "interpolate" template delimiters */
    var reInterpolate = /<%=([\s\S]+?)%>/g;

    /** Used to match leading whitespace and zeros to be removed */
    var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

    /** Used to ensure capturing order of template delimiters */
    var reNoMatch = /($^)/;

    /** Used to detect functions containing a `this` reference */
    var reThis = /\bthis\b/;

    /** Used to match unescaped characters in compiled string literals */
    var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

    /** Used to assign default `context` object properties */
    var contextProps = [
      'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
      'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
      'parseInt', 'setImmediate', 'setTimeout'
    ];

    /** Used to make template sourceURLs easier to identify */
    var templateCounter = 0;

    /** `Object#toString` result shortcuts */
    var argsClass = '[object Arguments]',
        arrayClass = '[object Array]',
        boolClass = '[object Boolean]',
        dateClass = '[object Date]',
        funcClass = '[object Function]',
        numberClass = '[object Number]',
        objectClass = '[object Object]',
        regexpClass = '[object RegExp]',
        stringClass = '[object String]';

    /** Used to identify object classifications that `_.clone` supports */
    var cloneableClasses = {};
    cloneableClasses[funcClass] = false;
    cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
    cloneableClasses[boolClass] = cloneableClasses[dateClass] =
    cloneableClasses[numberClass] = cloneableClasses[objectClass] =
    cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

    /** Used to determine if values are of the language type Object */
    var objectTypes = {
      'boolean': false,
      'function': true,
      'object': true,
      'number': false,
      'string': false,
      'undefined': false
    };

    /** Used to escape characters for inclusion in compiled string literals */
    var stringEscapes = {
      '\\': '\\',
      "'": "'",
      '\n': 'n',
      '\r': 'r',
      '\t': 't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };

    /** Used as a reference to the global object */
    var root = (objectTypes[typeof window] && window) || this;

    /** Detect free variable `exports` */
    var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

    /** Detect free variable `module` */
    var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports` */
    var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

    /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
    var freeGlobal = objectTypes[typeof global] && global;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
      root = freeGlobal;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.indexOf` without support for binary searches
     * or `fromIndex` constraints.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * An implementation of `_.contains` for cache objects that mimics the return
     * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache object to inspect.
     * @param {*} value The value to search for.
     * @returns {number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
      var type = typeof value;
      cache = cache.cache;

      if (type == 'boolean' || value == null) {
        return cache[value] ? 0 : -1;
      }
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value;
      cache = (cache = cache[type]) && cache[key];

      return type == 'object'
        ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
        : (cache ? 0 : -1);
    }

    /**
     * Adds a given value to the corresponding cache object.
     *
     * @private
     * @param {*} value The value to add to the cache.
     */
    function cachePush(value) {
      var cache = this.cache,
          type = typeof value;

      if (type == 'boolean' || value == null) {
        cache[value] = true;
      } else {
        if (type != 'number' && type != 'string') {
          type = 'object';
        }
        var key = type == 'number' ? value : keyPrefix + value,
            typeCache = cache[type] || (cache[type] = {});

        if (type == 'object') {
          (typeCache[key] || (typeCache[key] = [])).push(value);
        } else {
          typeCache[key] = true;
        }
      }
    }

    /**
     * Used by `_.max` and `_.min` as the default callback when a given
     * collection is a string value.
     *
     * @private
     * @param {string} value The character to inspect.
     * @returns {number} Returns the code unit of given character.
     */
    function charAtCallback(value) {
      return value.charCodeAt(0);
    }

    /**
     * Used by `sortBy` to compare transformed `collection` elements, stable sorting
     * them in ascending order.
     *
     * @private
     * @param {Object} a The object to compare to `b`.
     * @param {Object} b The object to compare to `a`.
     * @returns {number} Returns the sort order indicator of `1` or `-1`.
     */
    function compareAscending(a, b) {
      var ac = a.criteria,
          bc = b.criteria;

      // ensure a stable sort in V8 and other engines
      // http://code.google.com/p/v8/issues/detail?id=90
      if (ac !== bc) {
        if (ac > bc || typeof ac == 'undefined') {
          return 1;
        }
        if (ac < bc || typeof bc == 'undefined') {
          return -1;
        }
      }
      // The JS engine embedded in Adobe applications like InDesign has a buggy
      // `Array#sort` implementation that causes it, under certain circumstances,
      // to return the same value for `a` and `b`.
      // See https://github.com/jashkenas/underscore/pull/1247
      return a.index - b.index;
    }

    /**
     * Creates a cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [array=[]] The array to search.
     * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
     */
    function createCache(array) {
      var index = -1,
          length = array.length,
          first = array[0],
          mid = array[(length / 2) | 0],
          last = array[length - 1];

      if (first && typeof first == 'object' &&
          mid && typeof mid == 'object' && last && typeof last == 'object') {
        return false;
      }
      var cache = getObject();
      cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

      var result = getObject();
      result.array = array;
      result.cache = cache;
      result.push = cachePush;

      while (++index < length) {
        result.push(array[index]);
      }
      return result;
    }

    /**
     * Used by `template` to escape characters for inclusion in compiled
     * string literals.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeStringChar(match) {
      return '\\' + stringEscapes[match];
    }

    /**
     * Gets an array from the array pool or creates a new one if the pool is empty.
     *
     * @private
     * @returns {Array} The array from the pool.
     */
    function getArray() {
      return arrayPool.pop() || [];
    }

    /**
     * Gets an object from the object pool or creates a new one if the pool is empty.
     *
     * @private
     * @returns {Object} The object from the pool.
     */
    function getObject() {
      return objectPool.pop() || {
        'array': null,
        'cache': null,
        'configurable': false,
        'criteria': null,
        'enumerable': false,
        'false': false,
        'index': 0,
        'leading': false,
        'maxWait': 0,
        'null': false,
        'number': null,
        'object': null,
        'push': null,
        'string': null,
        'trailing': false,
        'true': false,
        'undefined': false,
        'value': null,
        'writable': false
      };
    }

    /**
     * A no-operation function.
     *
     * @private
     */
    function noop() {
      // no operation performed
    }

    /**
     * Releases the given array back to the array pool.
     *
     * @private
     * @param {Array} [array] The array to release.
     */
    function releaseArray(array) {
      array.length = 0;
      if (arrayPool.length < maxPoolSize) {
        arrayPool.push(array);
      }
    }

    /**
     * Releases the given object back to the object pool.
     *
     * @private
     * @param {Object} [object] The object to release.
     */
    function releaseObject(object) {
      var cache = object.cache;
      if (cache) {
        releaseObject(cache);
      }
      object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
      if (objectPool.length < maxPoolSize) {
        objectPool.push(object);
      }
    }

    /**
     * Slices the `collection` from the `start` index up to, but not including,
     * the `end` index.
     *
     * Note: This function is used instead of `Array#slice` to support node lists
     * in IE < 9 and to ensure dense arrays are returned.
     *
     * @private
     * @param {Array|Object|string} collection The collection to slice.
     * @param {number} start The start index.
     * @param {number} end The end index.
     * @returns {Array} Returns the new array.
     */
    function slice(array, start, end) {
      start || (start = 0);
      if (typeof end == 'undefined') {
        end = array ? array.length : 0;
      }
      var index = -1,
          length = end - start || 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = array[start + index];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Create a new `lodash` function using the given context object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} [context=root] The context object.
     * @returns {Function} Returns the `lodash` function.
     */
    function runInContext(context) {
      // Avoid issues with some ES3 environments that attempt to use values, named
      // after built-in constructors like `Object`, for the creation of literals.
      // ES5 clears this up by stating that literals must use built-in constructors.
      // See http://es5.github.io/#x11.1.5.
      context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

      /** Native constructor references */
      var Array = context.Array,
          Boolean = context.Boolean,
          Date = context.Date,
          Function = context.Function,
          Math = context.Math,
          Number = context.Number,
          Object = context.Object,
          RegExp = context.RegExp,
          String = context.String,
          TypeError = context.TypeError;

      /**
       * Used for `Array` method references.
       *
       * Normally `Array.prototype` would suffice, however, using an array literal
       * avoids issues in Narwhal.
       */
      var arrayRef = [];

      /** Used for native method references */
      var objectProto = Object.prototype;

      /** Used to restore the original `_` reference in `noConflict` */
      var oldDash = context._;

      /** Used to detect if a method is native */
      var reNative = RegExp('^' +
        String(objectProto.valueOf)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
      );

      /** Native method shortcuts */
      var ceil = Math.ceil,
          clearTimeout = context.clearTimeout,
          floor = Math.floor,
          fnToString = Function.prototype.toString,
          getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
          hasOwnProperty = objectProto.hasOwnProperty,
          now = reNative.test(now = Date.now) && now || function() { return +new Date; },
          push = arrayRef.push,
          setImmediate = context.setImmediate,
          setTimeout = context.setTimeout,
          splice = arrayRef.splice,
          toString = objectProto.toString,
          unshift = arrayRef.unshift;

      var defineProperty = (function() {
        try {
          var o = {},
              func = reNative.test(func = Object.defineProperty) && func,
              result = func(o, o, o) && func;
        } catch(e) { }
        return result;
      }());

      /* Native method shortcuts for methods with the same name as other `lodash` methods */
      var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
          nativeCreate = reNative.test(nativeCreate = Object.create) && nativeCreate,
          nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
          nativeIsFinite = context.isFinite,
          nativeIsNaN = context.isNaN,
          nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
          nativeMax = Math.max,
          nativeMin = Math.min,
          nativeParseInt = context.parseInt,
          nativeRandom = Math.random,
          nativeSlice = arrayRef.slice;

      /** Detect various environments */
      var isIeOpera = reNative.test(context.attachEvent),
          isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

      /** Used to lookup a built-in constructor by [[Class]] */
      var ctorByClass = {};
      ctorByClass[arrayClass] = Array;
      ctorByClass[boolClass] = Boolean;
      ctorByClass[dateClass] = Date;
      ctorByClass[funcClass] = Function;
      ctorByClass[objectClass] = Object;
      ctorByClass[numberClass] = Number;
      ctorByClass[regexpClass] = RegExp;
      ctorByClass[stringClass] = String;

      /*--------------------------------------------------------------------------*/

      /**
       * Creates a `lodash` object which wraps the given value to enable method
       * chaining.
       *
       * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
       * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
       * and `unshift`
       *
       * Chaining is supported in custom builds as long as the `value` method is
       * implicitly or explicitly included in the build.
       *
       * The chainable wrapper functions are:
       * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
       * `compose`, `concat`, `countBy`, `createCallback`, `curry`, `debounce`,
       * `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`, `forEach`,
       * `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `functions`,
       * `groupBy`, `indexBy`, `initial`, `intersection`, `invert`, `invoke`, `keys`,
       * `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`, `once`, `pairs`,
       * `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`, `range`, `reject`,
       * `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`, `splice`,
       * `tap`, `throttle`, `times`, `toArray`, `transform`, `union`, `uniq`, `unshift`,
       * `unzip`, `values`, `where`, `without`, `wrap`, and `zip`
       *
       * The non-chainable wrapper functions are:
       * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
       * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
       * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
       * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
       * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
       * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
       * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
       * `template`, `unescape`, `uniqueId`, and `value`
       *
       * The wrapper functions `first` and `last` return wrapped values when `n` is
       * provided, otherwise they return unwrapped values.
       *
       * @name _
       * @constructor
       * @category Chaining
       * @param {*} value The value to wrap in a `lodash` instance.
       * @returns {Object} Returns a `lodash` instance.
       * @example
       *
       * var wrapped = _([1, 2, 3]);
       *
       * // returns an unwrapped value
       * wrapped.reduce(function(sum, num) {
       *   return sum + num;
       * });
       * // => 6
       *
       * // returns a wrapped value
       * var squares = wrapped.map(function(num) {
       *   return num * num;
       * });
       *
       * _.isArray(squares);
       * // => false
       *
       * _.isArray(squares.value());
       * // => true
       */
      function lodash(value) {
        // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
        return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
         ? value
         : new lodashWrapper(value);
      }

      /**
       * A fast path for creating `lodash` wrapper objects.
       *
       * @private
       * @param {*} value The value to wrap in a `lodash` instance.
       * @param {boolean} chainAll A flag to enable chaining for all methods
       * @returns {Object} Returns a `lodash` instance.
       */
      function lodashWrapper(value, chainAll) {
        this.__chain__ = !!chainAll;
        this.__wrapped__ = value;
      }
      // ensure `new lodashWrapper` is an instance of `lodash`
      lodashWrapper.prototype = lodash.prototype;

      /**
       * An object used to flag environments features.
       *
       * @static
       * @memberOf _
       * @type Object
       */
      var support = lodash.support = {};

      /**
       * Detect if `Function#bind` exists and is inferred to be fast (all but V8).
       *
       * @memberOf _.support
       * @type boolean
       */
      support.fastBind = nativeBind && !isV8;

      /**
       * Detect if functions can be decompiled by `Function#toString`
       * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
       *
       * @memberOf _.support
       * @type boolean
       */
      support.funcDecomp = !reNative.test(context.WinRTError) && reThis.test(runInContext);

      /**
       * Detect if `Function#name` is supported (all but IE).
       *
       * @memberOf _.support
       * @type boolean
       */
      support.funcNames = typeof Function.name == 'string';

      /**
       * By default, the template delimiters used by Lo-Dash are similar to those in
       * embedded Ruby (ERB). Change the following template settings to use alternative
       * delimiters.
       *
       * @static
       * @memberOf _
       * @type Object
       */
      lodash.templateSettings = {

        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type RegExp
         */
        'escape': /<%-([\s\S]+?)%>/g,

        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type RegExp
         */
        'evaluate': /<%([\s\S]+?)%>/g,

        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type RegExp
         */
        'interpolate': reInterpolate,

        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type string
         */
        'variable': '',

        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type Object
         */
        'imports': {

          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type Function
           */
          '_': lodash
        }
      };

      /*--------------------------------------------------------------------------*/

      /**
       * The base implementation of `_.clone` without argument juggling or support
       * for `thisArg` binding.
       *
       * @private
       * @param {*} value The value to clone.
       * @param {boolean} [deep=false] Specify a deep clone.
       * @param {Function} [callback] The function to customize cloning values.
       * @param {Array} [stackA=[]] Tracks traversed source objects.
       * @param {Array} [stackB=[]] Associates clones with source counterparts.
       * @returns {*} Returns the cloned `value`.
       */
      function baseClone(value, deep, callback, stackA, stackB) {
        var result = value;

        if (callback) {
          result = callback(result);
          if (typeof result != 'undefined') {
            return result;
          }
          result = value;
        }
        // inspect [[Class]]
        var isObj = isObject(result);
        if (isObj) {
          var className = toString.call(result);
          if (!cloneableClasses[className]) {
            return result;
          }
          var isArr = isArray(result);
        }
        // shallow clone
        if (!isObj || !deep) {
          return isObj
            ? (isArr ? slice(result) : assign({}, result))
            : result;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+result);

          case numberClass:
          case stringClass:
            return new ctor(result);

          case regexpClass:
            return ctor(result.source, reFlags.exec(result));
        }
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        // init cloned object
        result = isArr ? ctor(result.length) : {};

        // add array properties assigned by `RegExp#exec`
        if (isArr) {
          if (hasOwnProperty.call(value, 'index')) {
            result.index = value.index;
          }
          if (hasOwnProperty.call(value, 'input')) {
            result.input = value.input;
          }
        }
        // add the source value to the stack of traversed objects
        // and associate it with its clone
        stackA.push(value);
        stackB.push(result);

        // recursively populate clone (susceptible to call stack limits)
        (isArr ? forEach : forOwn)(value, function(objValue, key) {
          result[key] = baseClone(objValue, deep, callback, stackA, stackB);
        });

        if (initedStack) {
          releaseArray(stackA);
          releaseArray(stackB);
        }
        return result;
      }

      /**
       * The base implementation of `_.createCallback` without support for creating
       * "_.pluck" or "_.where" style callbacks.
       *
       * @private
       * @param {*} [func=identity] The value to convert to a callback.
       * @param {*} [thisArg] The `this` binding of the created callback.
       * @param {number} [argCount] The number of arguments the callback accepts.
       * @returns {Function} Returns a callback function.
       */
      function baseCreateCallback(func, thisArg, argCount) {
        if (typeof func != 'function') {
          return identity;
        }
        // exit early if there is no `thisArg`
        if (typeof thisArg == 'undefined') {
          return func;
        }
        var bindData = func.__bindData__ || (support.funcNames && !func.name);
        if (typeof bindData == 'undefined') {
          var source = reThis && fnToString.call(func);
          if (!support.funcNames && source && !reFuncName.test(source)) {
            bindData = true;
          }
          if (support.funcNames || !bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = !support.funcDecomp || reThis.test(source);
            setBindData(func, bindData);
          }
        }
        // exit early if there are no `this` references or `func` is bound
        if (bindData !== true && (bindData && bindData[1] & 1)) {
          return func;
        }
        switch (argCount) {
          case 1: return function(value) {
            return func.call(thisArg, value);
          };
          case 2: return function(a, b) {
            return func.call(thisArg, a, b);
          };
          case 3: return function(value, index, collection) {
            return func.call(thisArg, value, index, collection);
          };
          case 4: return function(accumulator, value, index, collection) {
            return func.call(thisArg, accumulator, value, index, collection);
          };
        }
        return bind(func, thisArg);
      }

      /**
       * The base implementation of `_.flatten` without support for callback
       * shorthands or `thisArg` binding.
       *
       * @private
       * @param {Array} array The array to flatten.
       * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
       * @param {boolean} [isArgArrays=false] A flag to restrict flattening to arrays and `arguments` objects.
       * @param {number} [fromIndex=0] The index to start from.
       * @returns {Array} Returns a new flattened array.
       */
      function baseFlatten(array, isShallow, isArgArrays, fromIndex) {
        var index = (fromIndex || 0) - 1,
            length = array ? array.length : 0,
            result = [];

        while (++index < length) {
          var value = array[index];

          if (value && typeof value == 'object' && typeof value.length == 'number'
              && (isArray(value) || isArguments(value))) {
            // recursively flatten arrays (susceptible to call stack limits)
            if (!isShallow) {
              value = baseFlatten(value, isShallow, isArgArrays);
            }
            var valIndex = -1,
                valLength = value.length,
                resIndex = result.length;

            result.length += valLength;
            while (++valIndex < valLength) {
              result[resIndex++] = value[valIndex];
            }
          } else if (!isArgArrays) {
            result.push(value);
          }
        }
        return result;
      }

      /**
       * The base implementation of `_.isEqual`, without support for `thisArg` binding,
       * that allows partial "_.where" style comparisons.
       *
       * @private
       * @param {*} a The value to compare.
       * @param {*} b The other value to compare.
       * @param {Function} [callback] The function to customize comparing values.
       * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
       * @param {Array} [stackA=[]] Tracks traversed `a` objects.
       * @param {Array} [stackB=[]] Tracks traversed `b` objects.
       * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
       */
      function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
        // used to indicate that when comparing objects, `a` has at least the properties of `b`
        if (callback) {
          var result = callback(a, b);
          if (typeof result != 'undefined') {
            return !!result;
          }
        }
        // exit early for identical values
        if (a === b) {
          // treat `+0` vs. `-0` as not equal
          return a !== 0 || (1 / a == 1 / b);
        }
        var type = typeof a,
            otherType = typeof b;

        // exit early for unlike primitive values
        if (a === a &&
            !(a && objectTypes[type]) &&
            !(b && objectTypes[otherType])) {
          return false;
        }
        // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
        // http://es5.github.io/#x15.3.4.4
        if (a == null || b == null) {
          return a === b;
        }
        // compare [[Class]] names
        var className = toString.call(a),
            otherClass = toString.call(b);

        if (className == argsClass) {
          className = objectClass;
        }
        if (otherClass == argsClass) {
          otherClass = objectClass;
        }
        if (className != otherClass) {
          return false;
        }
        switch (className) {
          case boolClass:
          case dateClass:
            // coerce dates and booleans to numbers, dates to milliseconds and booleans
            // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
            return +a == +b;

          case numberClass:
            // treat `NaN` vs. `NaN` as equal
            return (a != +a)
              ? b != +b
              // but treat `+0` vs. `-0` as not equal
              : (a == 0 ? (1 / a == 1 / b) : a == +b);

          case regexpClass:
          case stringClass:
            // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
            // treat string primitives and their corresponding object instances as equal
            return a == String(b);
        }
        var isArr = className == arrayClass;
        if (!isArr) {
          // unwrap any `lodash` wrapped values
          if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {
            return baseIsEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, isWhere, stackA, stackB);
          }
          // exit for functions and DOM nodes
          if (className != objectClass) {
            return false;
          }
          // in older versions of Opera, `arguments` objects have `Array` constructors
          var ctorA = a.constructor,
              ctorB = b.constructor;

          // non `Object` object instances with different constructors are not equal
          if (ctorA != ctorB && !(
                isFunction(ctorA) && ctorA instanceof ctorA &&
                isFunction(ctorB) && ctorB instanceof ctorB
              )) {
            return false;
          }
        }
        // assume cyclic structures are equal
        // the algorithm for detecting cyclic structures is adapted from ES 5.1
        // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == a) {
            return stackB[length] == b;
          }
        }
        var size = 0;
        result = true;

        // add `a` and `b` to the stack of traversed objects
        stackA.push(a);
        stackB.push(b);

        // recursively compare objects and arrays (susceptible to call stack limits)
        if (isArr) {
          length = a.length;
          size = b.length;

          // compare lengths to determine if a deep comparison is necessary
          result = size == a.length;
          if (!result && !isWhere) {
            return result;
          }
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
          return result;
        }
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
        if (initedStack) {
          releaseArray(stackA);
          releaseArray(stackB);
        }
        return result;
      }

      /**
       * The base implementation of `_.merge` without argument juggling or support
       * for `thisArg` binding.
       *
       * @private
       * @param {Object} object The destination object.
       * @param {Object} source The source object.
       * @param {Function} [callback] The function to customize merging properties.
       * @param {Array} [stackA=[]] Tracks traversed source objects.
       * @param {Array} [stackB=[]] Associates values with source counterparts.
       */
      function baseMerge(object, source, callback, stackA, stackB) {
        (isArray(source) ? forEach : forOwn)(source, function(source, key) {
          var found,
              isArr,
              result = source,
              value = object[key];

          if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
            // avoid merging previously merged cyclic sources
            var stackLength = stackA.length;
            while (stackLength--) {
              if ((found = stackA[stackLength] == source)) {
                value = stackB[stackLength];
                break;
              }
            }
            if (!found) {
              var isShallow;
              if (callback) {
                result = callback(value, source);
                if ((isShallow = typeof result != 'undefined')) {
                  value = result;
                }
              }
              if (!isShallow) {
                value = isArr
                  ? (isArray(value) ? value : [])
                  : (isPlainObject(value) ? value : {});
              }
              // add `source` and associated `value` to the stack of traversed objects
              stackA.push(source);
              stackB.push(value);

              // recursively merge objects and arrays (susceptible to call stack limits)
              if (!isShallow) {
                baseMerge(value, source, callback, stackA, stackB);
              }
            }
          }
          else {
            if (callback) {
              result = callback(value, source);
              if (typeof result == 'undefined') {
                result = source;
              }
            }
            if (typeof result != 'undefined') {
              value = result;
            }
          }
          object[key] = value;
        });
      }

      /**
       * The base implementation of `_.uniq` without support for callback shorthands
       * or `thisArg` binding.
       *
       * @private
       * @param {Array} array The array to process.
       * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
       * @param {Function} [callback] The function called per iteration.
       * @returns {Array} Returns a duplicate-value-free array.
       */
      function baseUniq(array, isSorted, callback) {
        var index = -1,
            indexOf = getIndexOf(),
            length = array ? array.length : 0,
            result = [];

        var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
            seen = (callback || isLarge) ? getArray() : result;

        if (isLarge) {
          var cache = createCache(seen);
          if (cache) {
            indexOf = cacheIndexOf;
            seen = cache;
          } else {
            isLarge = false;
            seen = callback ? seen : (releaseArray(seen), result);
          }
        }
        while (++index < length) {
          var value = array[index],
              computed = callback ? callback(value, index, array) : value;

          if (isSorted
                ? !index || seen[seen.length - 1] !== computed
                : indexOf(seen, computed) < 0
              ) {
            if (callback || isLarge) {
              seen.push(computed);
            }
            result.push(value);
          }
        }
        if (isLarge) {
          releaseArray(seen.array);
          releaseObject(seen);
        } else if (callback) {
          releaseArray(seen);
        }
        return result;
      }

      /**
       * Creates a function that aggregates a collection, creating an object composed
       * of keys generated from the results of running each element of the collection
       * through a callback. The given `setter` function sets the keys and values
       * of the composed object.
       *
       * @private
       * @param {Function} setter The setter function.
       * @returns {Function} Returns the new aggregator function.
       */
      function createAggregator(setter) {
        return function(collection, callback, thisArg) {
          var result = {};
          callback = lodash.createCallback(callback, thisArg, 3);

          var index = -1,
              length = collection ? collection.length : 0;

          if (typeof length == 'number') {
            while (++index < length) {
              var value = collection[index];
              setter(result, value, callback(value, index, collection), collection);
            }
          } else {
            forOwn(collection, function(value, key, collection) {
              setter(result, value, callback(value, key, collection), collection);
            });
          }
          return result;
        };
      }

      /**
       * Creates a function that, when called, either curries or invokes `func`
       * with an optional `this` binding and partially applied arguments.
       *
       * @private
       * @param {Function|string} func The function or method name to reference.
       * @param {number} bitmask The bitmask of method flags to compose.
       *  The bitmask may be composed of the following flags:
       *  1 - `_.bind`
       *  2 - `_.bindKey`
       *  4 - `_.curry`
       *  8 - `_.curry` (bound)
       *  16 - `_.partial`
       *  32 - `_.partialRight`
       * @param {Array} [partialArgs] An array of arguments to prepend to those
       *  provided to the new function.
       * @param {Array} [partialRightArgs] An array of arguments to append to those
       *  provided to the new function.
       * @param {*} [thisArg] The `this` binding of `func`.
       * @param {number} [arity] The arity of `func`.
       * @returns {Function} Returns the new bound function.
       */
      function createBound(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
        var isBind = bitmask & 1,
            isBindKey = bitmask & 2,
            isCurry = bitmask & 4,
            isCurryBound = bitmask & 8,
            isPartial = bitmask & 16,
            isPartialRight = bitmask & 32,
            key = func;

        if (!isBindKey && !isFunction(func)) {
          throw new TypeError;
        }
        if (isPartial && !partialArgs.length) {
          bitmask &= ~16;
          isPartial = partialArgs = false;
        }
        if (isPartialRight && !partialRightArgs.length) {
          bitmask &= ~32;
          isPartialRight = partialRightArgs = false;
        }
        var bindData = func && func.__bindData__;
        if (bindData) {
          if (isBind && !(bindData[1] & 1)) {
            bindData[4] = thisArg;
          }
          if (!isBind && bindData[1] & 1) {
            bitmask |= 8;
          }
          if (isCurry && !(bindData[1] & 4)) {
            bindData[5] = arity;
          }
          if (isPartial) {
            push.apply(bindData[2] || (bindData[2] = []), partialArgs);
          }
          if (isPartialRight) {
            push.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
          }
          bindData[1] |= bitmask;
          return createBound.apply(null, bindData);
        }
        // use `Function#bind` if it exists and is fast
        // (in V8 `Function#bind` is slower except when partially applied)
        if (isBind && !(isBindKey || isCurry || isPartialRight) &&
            (support.fastBind || (nativeBind && isPartial))) {
          if (isPartial) {
            var args = [thisArg];
            push.apply(args, partialArgs);
          }
          var bound = isPartial
            ? nativeBind.apply(func, args)
            : nativeBind.call(func, thisArg);
        }
        else {
          bound = function() {
            // `Function#bind` spec
            // http://es5.github.io/#x15.3.4.5
            var args = arguments,
                thisBinding = isBind ? thisArg : this;

            if (isCurry || isPartial || isPartialRight) {
              args = nativeSlice.call(args);
              if (isPartial) {
                unshift.apply(args, partialArgs);
              }
              if (isPartialRight) {
                push.apply(args, partialRightArgs);
              }
              if (isCurry && args.length < arity) {
                bitmask |= 16 & ~32;
                return createBound(func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity);
              }
            }
            if (isBindKey) {
              func = thisBinding[key];
            }
            if (this instanceof bound) {
              // ensure `new bound` is an instance of `func`
              thisBinding = createObject(func.prototype);

              // mimic the constructor's `return` behavior
              // http://es5.github.io/#x13.2.2
              var result = func.apply(thisBinding, args);
              return isObject(result) ? result : thisBinding;
            }
            return func.apply(thisBinding, args);
          };
        }
        setBindData(bound, nativeSlice.call(arguments));
        return bound;
      }

      /**
       * Creates a new object with the specified `prototype`.
       *
       * @private
       * @param {Object} prototype The prototype object.
       * @returns {Object} Returns the new object.
       */
      function createObject(prototype) {
        return isObject(prototype) ? nativeCreate(prototype) : {};
      }

      /**
       * Used by `escape` to convert characters to HTML entities.
       *
       * @private
       * @param {string} match The matched character to escape.
       * @returns {string} Returns the escaped character.
       */
      function escapeHtmlChar(match) {
        return htmlEscapes[match];
      }

      /**
       * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
       * customized, this method returns the custom method, otherwise it returns
       * the `baseIndexOf` function.
       *
       * @private
       * @returns {Function} Returns the "indexOf" function.
       */
      function getIndexOf() {
        var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
        return result;
      }

      /**
       * Sets `this` binding data on a given function.
       *
       * @private
       * @param {Function} func The function to set data on.
       * @param {*} value The value to set.
       */
      var setBindData = !defineProperty ? noop : function(func, value) {
        var descriptor = getObject();
        descriptor.value = value;
        defineProperty(func, '__bindData__', descriptor);
        releaseObject(descriptor);
      };

      /**
       * A fallback implementation of `isPlainObject` which checks if a given value
       * is an object created by the `Object` constructor, assuming objects created
       * by the `Object` constructor have no inherited enumerable properties and that
       * there are no `Object.prototype` extensions.
       *
       * @private
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
       */
      function shimIsPlainObject(value) {
        var ctor,
            result;

        // avoid non Object objects, `arguments` objects, and DOM elements
        if (!(value && toString.call(value) == objectClass) ||
            (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
          return false;
        }
        // In most environments an object's own properties are iterated before
        // its inherited properties. If the last iterated property is an object's
        // own property then there are no inherited enumerable properties.
        forIn(value, function(value, key) {
          result = key;
        });
        return typeof result == 'undefined' || hasOwnProperty.call(value, result);
      }

      /**
       * Used by `unescape` to convert HTML entities to characters.
       *
       * @private
       * @param {string} match The matched character to unescape.
       * @returns {string} Returns the unescaped character.
       */
      function unescapeHtmlChar(match) {
        return htmlUnescapes[match];
      }

      /*--------------------------------------------------------------------------*/

      /**
       * Checks if `value` is an `arguments` object.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
       * @example
       *
       * (function() { return _.isArguments(arguments); })(1, 2, 3);
       * // => true
       *
       * _.isArguments([1, 2, 3]);
       * // => false
       */
      function isArguments(value) {
        return value && typeof value == 'object' && typeof value.length == 'number' &&
          toString.call(value) == argsClass || false;
      }

      /**
       * Checks if `value` is an array.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
       * @example
       *
       * (function() { return _.isArray(arguments); })();
       * // => false
       *
       * _.isArray([1, 2, 3]);
       * // => true
       */
      var isArray = nativeIsArray || function(value) {
        return value && typeof value == 'object' && typeof value.length == 'number' &&
          toString.call(value) == arrayClass || false;
      };

      /**
       * A fallback implementation of `Object.keys` which produces an array of the
       * given object's own enumerable property names.
       *
       * @private
       * @type Function
       * @param {Object} object The object to inspect.
       * @returns {Array} Returns an array of property names.
       */
      var shimKeys = function(object) {
        var index, iterable = object, result = [];
        if (!iterable) return result;
        if (!(objectTypes[typeof object])) return result;
          for (index in iterable) {
            if (hasOwnProperty.call(iterable, index)) {
              result.push(index);
            }
          }
        return result
      };

      /**
       * Creates an array composed of the own enumerable property names of an object.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to inspect.
       * @returns {Array} Returns an array of property names.
       * @example
       *
       * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
       * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
       */
      var keys = !nativeKeys ? shimKeys : function(object) {
        if (!isObject(object)) {
          return [];
        }
        return nativeKeys(object);
      };

      /**
       * Used to convert characters to HTML entities:
       *
       * Though the `>` character is escaped for symmetry, characters like `>` and `/`
       * don't require escaping in HTML and have no special meaning unless they're part
       * of a tag or an unquoted attribute value.
       * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
       */
      var htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };

      /** Used to convert HTML entities to characters */
      var htmlUnescapes = invert(htmlEscapes);

      /** Used to match HTML entities and HTML characters */
      var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
          reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

      /*--------------------------------------------------------------------------*/

      /**
       * Assigns own enumerable properties of source object(s) to the destination
       * object. Subsequent sources will overwrite property assignments of previous
       * sources. If a callback is provided it will be executed to produce the
       * assigned values. The callback is bound to `thisArg` and invoked with two
       * arguments; (objectValue, sourceValue).
       *
       * @static
       * @memberOf _
       * @type Function
       * @alias extend
       * @category Objects
       * @param {Object} object The destination object.
       * @param {...Object} [source] The source objects.
       * @param {Function} [callback] The function to customize assigning values.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns the destination object.
       * @example
       *
       * _.assign({ 'name': 'moe' }, { 'age': 40 });
       * // => { 'name': 'moe', 'age': 40 }
       *
       * var defaults = _.partialRight(_.assign, function(a, b) {
       *   return typeof a == 'undefined' ? b : a;
       * });
       *
       * var food = { 'name': 'apple' };
       * defaults(food, { 'name': 'banana', 'type': 'fruit' });
       * // => { 'name': 'apple', 'type': 'fruit' }
       */
      var assign = function(object, source, guard) {
        var index, iterable = object, result = iterable;
        if (!iterable) return result;
        var args = arguments,
            argsIndex = 0,
            argsLength = typeof guard == 'number' ? 2 : args.length;
        if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
          var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
        } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
          callback = args[--argsLength];
        }
        while (++argsIndex < argsLength) {
          iterable = args[argsIndex];
          if (iterable && objectTypes[typeof iterable]) {
          var ownIndex = -1,
              ownProps = objectTypes[typeof iterable] && keys(iterable),
              length = ownProps ? ownProps.length : 0;

          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
          }
          }
        }
        return result
      };

      /**
       * Creates a clone of `value`. If `deep` is `true` nested objects will also
       * be cloned, otherwise they will be assigned by reference. If a callback
       * is provided it will be executed to produce the cloned values. If the
       * callback returns `undefined` cloning will be handled by the method instead.
       * The callback is bound to `thisArg` and invoked with one argument; (value).
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to clone.
       * @param {boolean} [deep=false] Specify a deep clone.
       * @param {Function} [callback] The function to customize cloning values.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the cloned `value`.
       * @example
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * var shallow = _.clone(stooges);
       * shallow[0] === stooges[0];
       * // => true
       *
       * var deep = _.clone(stooges, true);
       * deep[0] === stooges[0];
       * // => false
       *
       * _.mixin({
       *   'clone': _.partialRight(_.clone, function(value) {
       *     return _.isElement(value) ? value.cloneNode(false) : undefined;
       *   })
       * });
       *
       * var clone = _.clone(document.body);
       * clone.childNodes.length;
       * // => 0
       */
      function clone(value, deep, callback, thisArg) {
        // allows working with "Collections" methods without using their `index`
        // and `collection` arguments for `deep` and `callback`
        if (typeof deep != 'boolean' && deep != null) {
          thisArg = callback;
          callback = deep;
          deep = false;
        }
        return baseClone(value, deep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
      }

      /**
       * Creates a deep clone of `value`. If a callback is provided it will be
       * executed to produce the cloned values. If the callback returns `undefined`
       * cloning will be handled by the method instead. The callback is bound to
       * `thisArg` and invoked with one argument; (value).
       *
       * Note: This method is loosely based on the structured clone algorithm. Functions
       * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
       * objects created by constructors other than `Object` are cloned to plain `Object` objects.
       * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to deep clone.
       * @param {Function} [callback] The function to customize cloning values.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the deep cloned `value`.
       * @example
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * var deep = _.cloneDeep(stooges);
       * deep[0] === stooges[0];
       * // => false
       *
       * var view = {
       *   'label': 'docs',
       *   'node': element
       * };
       *
       * var clone = _.cloneDeep(view, function(value) {
       *   return _.isElement(value) ? value.cloneNode(true) : undefined;
       * });
       *
       * clone.node == view.node;
       * // => false
       */
      function cloneDeep(value, callback, thisArg) {
        return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
      }

      /**
       * Assigns own enumerable properties of source object(s) to the destination
       * object for all destination properties that resolve to `undefined`. Once a
       * property is set, additional defaults of the same property will be ignored.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Objects
       * @param {Object} object The destination object.
       * @param {...Object} [source] The source objects.
       * @param- {Object} [guard] Allows working with `_.reduce` without using its
       *  `key` and `object` arguments as sources.
       * @returns {Object} Returns the destination object.
       * @example
       *
       * var food = { 'name': 'apple' };
       * _.defaults(food, { 'name': 'banana', 'type': 'fruit' });
       * // => { 'name': 'apple', 'type': 'fruit' }
       */
      var defaults = function(object, source, guard) {
        var index, iterable = object, result = iterable;
        if (!iterable) return result;
        var args = arguments,
            argsIndex = 0,
            argsLength = typeof guard == 'number' ? 2 : args.length;
        while (++argsIndex < argsLength) {
          iterable = args[argsIndex];
          if (iterable && objectTypes[typeof iterable]) {
          var ownIndex = -1,
              ownProps = objectTypes[typeof iterable] && keys(iterable),
              length = ownProps ? ownProps.length : 0;

          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            if (typeof result[index] == 'undefined') result[index] = iterable[index];
          }
          }
        }
        return result
      };

      /**
       * This method is like `_.findIndex` except that it returns the key of the
       * first element that passes the callback check, instead of the element itself.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to search.
       * @param {Function|Object|string} [callback=identity] The function called per
       *  iteration. If a property name or object is provided it will be used to
       *  create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {string|undefined} Returns the key of the found element, else `undefined`.
       * @example
       *
       * _.findKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
       *   return num % 2 == 0;
       * });
       * // => 'b' (property order is not guaranteed across environments)
       */
      function findKey(object, callback, thisArg) {
        var result;
        callback = lodash.createCallback(callback, thisArg, 3);
        forOwn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result = key;
            return false;
          }
        });
        return result;
      }

      /**
       * This method is like `_.findKey` except that it iterates over elements
       * of a `collection` in the opposite order.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to search.
       * @param {Function|Object|string} [callback=identity] The function called per
       *  iteration. If a property name or object is provided it will be used to
       *  create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {string|undefined} Returns the key of the found element, else `undefined`.
       * @example
       *
       * _.findLastKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
       *   return num % 2 == 1;
       * });
       * // => returns `c`, assuming `_.findKey` returns `a`
       */
      function findLastKey(object, callback, thisArg) {
        var result;
        callback = lodash.createCallback(callback, thisArg, 3);
        forOwnRight(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result = key;
            return false;
          }
        });
        return result;
      }

      /**
       * Iterates over own and inherited enumerable properties of an object,
       * executing the callback for each property. The callback is bound to `thisArg`
       * and invoked with three arguments; (value, key, object). Callbacks may exit
       * iteration early by explicitly returning `false`.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Objects
       * @param {Object} object The object to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns `object`.
       * @example
       *
       * function Dog(name) {
       *   this.name = name;
       * }
       *
       * Dog.prototype.bark = function() {
       *   console.log('Woof, woof!');
       * };
       *
       * _.forIn(new Dog('Dagny'), function(value, key) {
       *   console.log(key);
       * });
       * // => logs 'bark' and 'name' (property order is not guaranteed across environments)
       */
      var forIn = function(collection, callback, thisArg) {
        var index, iterable = collection, result = iterable;
        if (!iterable) return result;
        if (!objectTypes[typeof iterable]) return result;
        callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
          for (index in iterable) {
            if (callback(iterable[index], index, collection) === false) return result;
          }
        return result
      };

      /**
       * This method is like `_.forIn` except that it iterates over elements
       * of a `collection` in the opposite order.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns `object`.
       * @example
       *
       * function Dog(name) {
       *   this.name = name;
       * }
       *
       * Dog.prototype.bark = function() {
       *   console.log('Woof, woof!');
       * };
       *
       * _.forInRight(new Dog('Dagny'), function(value, key) {
       *   console.log(key);
       * });
       * // => logs 'name' and 'bark' assuming `_.forIn ` logs 'bark' and 'name'
       */
      function forInRight(object, callback, thisArg) {
        var pairs = [];

        forIn(object, function(value, key) {
          pairs.push(key, value);
        });

        var length = pairs.length;
        callback = baseCreateCallback(callback, thisArg, 3);
        while (length--) {
          if (callback(pairs[length--], pairs[length], object) === false) {
            break;
          }
        }
        return object;
      }

      /**
       * Iterates over own enumerable properties of an object, executing the callback
       * for each property. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, key, object). Callbacks may exit iteration early by
       * explicitly returning `false`.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Objects
       * @param {Object} object The object to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns `object`.
       * @example
       *
       * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
       *   console.log(key);
       * });
       * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
       */
      var forOwn = function(collection, callback, thisArg) {
        var index, iterable = collection, result = iterable;
        if (!iterable) return result;
        if (!objectTypes[typeof iterable]) return result;
        callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
          var ownIndex = -1,
              ownProps = objectTypes[typeof iterable] && keys(iterable),
              length = ownProps ? ownProps.length : 0;

          while (++ownIndex < length) {
            index = ownProps[ownIndex];
            if (callback(iterable[index], index, collection) === false) return result;
          }
        return result
      };

      /**
       * This method is like `_.forOwn` except that it iterates over elements
       * of a `collection` in the opposite order.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns `object`.
       * @example
       *
       * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
       *   console.log(key);
       * });
       * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
       */
      function forOwnRight(object, callback, thisArg) {
        var props = keys(object),
            length = props.length;

        callback = baseCreateCallback(callback, thisArg, 3);
        while (length--) {
          var key = props[length];
          if (callback(object[key], key, object) === false) {
            break;
          }
        }
        return object;
      }

      /**
       * Creates a sorted array of property names of all enumerable properties,
       * own and inherited, of `object` that have function values.
       *
       * @static
       * @memberOf _
       * @alias methods
       * @category Objects
       * @param {Object} object The object to inspect.
       * @returns {Array} Returns an array of property names that have function values.
       * @example
       *
       * _.functions(_);
       * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
       */
      function functions(object) {
        var result = [];
        forIn(object, function(value, key) {
          if (isFunction(value)) {
            result.push(key);
          }
        });
        return result.sort();
      }

      /**
       * Checks if the specified object `property` exists and is a direct property,
       * instead of an inherited property.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to check.
       * @param {string} property The property to check for.
       * @returns {boolean} Returns `true` if key is a direct property, else `false`.
       * @example
       *
       * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
       * // => true
       */
      function has(object, property) {
        return object ? hasOwnProperty.call(object, property) : false;
      }

      /**
       * Creates an object composed of the inverted keys and values of the given object.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to invert.
       * @returns {Object} Returns the created inverted object.
       * @example
       *
       *  _.invert({ 'first': 'moe', 'second': 'larry' });
       * // => { 'moe': 'first', 'larry': 'second' }
       */
      function invert(object) {
        var index = -1,
            props = keys(object),
            length = props.length,
            result = {};

        while (++index < length) {
          var key = props[index];
          result[object[key]] = key;
        }
        return result;
      }

      /**
       * Checks if `value` is a boolean value.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
       * @example
       *
       * _.isBoolean(null);
       * // => false
       */
      function isBoolean(value) {
        return value === true || value === false || toString.call(value) == boolClass;
      }

      /**
       * Checks if `value` is a date.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
       * @example
       *
       * _.isDate(new Date);
       * // => true
       */
      function isDate(value) {
        return value ? (typeof value == 'object' && toString.call(value) == dateClass) : false;
      }

      /**
       * Checks if `value` is a DOM element.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
       * @example
       *
       * _.isElement(document.body);
       * // => true
       */
      function isElement(value) {
        return value ? value.nodeType === 1 : false;
      }

      /**
       * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
       * length of `0` and objects with no own enumerable properties are considered
       * "empty".
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Array|Object|string} value The value to inspect.
       * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
       * @example
       *
       * _.isEmpty([1, 2, 3]);
       * // => false
       *
       * _.isEmpty({});
       * // => true
       *
       * _.isEmpty('');
       * // => true
       */
      function isEmpty(value) {
        var result = true;
        if (!value) {
          return result;
        }
        var className = toString.call(value),
            length = value.length;

        if ((className == arrayClass || className == stringClass || className == argsClass ) ||
            (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
          return !length;
        }
        forOwn(value, function() {
          return (result = false);
        });
        return result;
      }

      /**
       * Performs a deep comparison between two values to determine if they are
       * equivalent to each other. If a callback is provided it will be executed
       * to compare values. If the callback returns `undefined` comparisons will
       * be handled by the method instead. The callback is bound to `thisArg` and
       * invoked with two arguments; (a, b).
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} a The value to compare.
       * @param {*} b The other value to compare.
       * @param {Function} [callback] The function to customize comparing values.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
       * @example
       *
       * var moe = { 'name': 'moe', 'age': 40 };
       * var copy = { 'name': 'moe', 'age': 40 };
       *
       * moe == copy;
       * // => false
       *
       * _.isEqual(moe, copy);
       * // => true
       *
       * var words = ['hello', 'goodbye'];
       * var otherWords = ['hi', 'goodbye'];
       *
       * _.isEqual(words, otherWords, function(a, b) {
       *   var reGreet = /^(?:hello|hi)$/i,
       *       aGreet = _.isString(a) && reGreet.test(a),
       *       bGreet = _.isString(b) && reGreet.test(b);
       *
       *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
       * });
       * // => true
       */
      function isEqual(a, b, callback, thisArg) {
        return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
      }

      /**
       * Checks if `value` is, or can be coerced to, a finite number.
       *
       * Note: This is not the same as native `isFinite` which will return true for
       * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
       * @example
       *
       * _.isFinite(-101);
       * // => true
       *
       * _.isFinite('10');
       * // => true
       *
       * _.isFinite(true);
       * // => false
       *
       * _.isFinite('');
       * // => false
       *
       * _.isFinite(Infinity);
       * // => false
       */
      function isFinite(value) {
        return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
      }

      /**
       * Checks if `value` is a function.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
       * @example
       *
       * _.isFunction(_);
       * // => true
       */
      function isFunction(value) {
        return typeof value == 'function';
      }

      /**
       * Checks if `value` is the language type of Object.
       * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
       * @example
       *
       * _.isObject({});
       * // => true
       *
       * _.isObject([1, 2, 3]);
       * // => true
       *
       * _.isObject(1);
       * // => false
       */
      function isObject(value) {
        // check if the value is the ECMAScript language type of Object
        // http://es5.github.io/#x8
        // and avoid a V8 bug
        // http://code.google.com/p/v8/issues/detail?id=2291
        return !!(value && objectTypes[typeof value]);
      }

      /**
       * Checks if `value` is `NaN`.
       *
       * Note: This is not the same as native `isNaN` which will return `true` for
       * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
       * @example
       *
       * _.isNaN(NaN);
       * // => true
       *
       * _.isNaN(new Number(NaN));
       * // => true
       *
       * isNaN(undefined);
       * // => true
       *
       * _.isNaN(undefined);
       * // => false
       */
      function isNaN(value) {
        // `NaN` as a primitive is the only value that is not equal to itself
        // (perform the [[Class]] check first to avoid errors with some host objects in IE)
        return isNumber(value) && value != +value;
      }

      /**
       * Checks if `value` is `null`.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
       * @example
       *
       * _.isNull(null);
       * // => true
       *
       * _.isNull(undefined);
       * // => false
       */
      function isNull(value) {
        return value === null;
      }

      /**
       * Checks if `value` is a number.
       *
       * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
       * @example
       *
       * _.isNumber(8.4 * 5);
       * // => true
       */
      function isNumber(value) {
        return typeof value == 'number' || toString.call(value) == numberClass;
      }

      /**
       * Checks if `value` is an object created by the `Object` constructor.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
       * @example
       *
       * function Stooge(name, age) {
       *   this.name = name;
       *   this.age = age;
       * }
       *
       * _.isPlainObject(new Stooge('moe', 40));
       * // => false
       *
       * _.isPlainObject([1, 2, 3]);
       * // => false
       *
       * _.isPlainObject({ 'name': 'moe', 'age': 40 });
       * // => true
       */
      var isPlainObject = function(value) {
        if (!(value && toString.call(value) == objectClass)) {
          return false;
        }
        var valueOf = value.valueOf,
            objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

        return objProto
          ? (value == objProto || getPrototypeOf(value) == objProto)
          : shimIsPlainObject(value);
      };

      /**
       * Checks if `value` is a regular expression.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
       * @example
       *
       * _.isRegExp(/moe/);
       * // => true
       */
      function isRegExp(value) {
        return value ? (typeof value == 'object' && toString.call(value) == regexpClass) : false;
      }

      /**
       * Checks if `value` is a string.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
       * @example
       *
       * _.isString('moe');
       * // => true
       */
      function isString(value) {
        return typeof value == 'string' || toString.call(value) == stringClass;
      }

      /**
       * Checks if `value` is `undefined`.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {*} value The value to check.
       * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
       * @example
       *
       * _.isUndefined(void 0);
       * // => true
       */
      function isUndefined(value) {
        return typeof value == 'undefined';
      }

      /**
       * Recursively merges own enumerable properties of the source object(s), that
       * don't resolve to `undefined` into the destination object. Subsequent sources
       * will overwrite property assignments of previous sources. If a callback is
       * provided it will be executed to produce the merged values of the destination
       * and source properties. If the callback returns `undefined` merging will
       * be handled by the method instead. The callback is bound to `thisArg` and
       * invoked with two arguments; (objectValue, sourceValue).
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The destination object.
       * @param {...Object} [source] The source objects.
       * @param {Function} [callback] The function to customize merging properties.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns the destination object.
       * @example
       *
       * var names = {
       *   'stooges': [
       *     { 'name': 'moe' },
       *     { 'name': 'larry' }
       *   ]
       * };
       *
       * var ages = {
       *   'stooges': [
       *     { 'age': 40 },
       *     { 'age': 50 }
       *   ]
       * };
       *
       * _.merge(names, ages);
       * // => { 'stooges': [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }] }
       *
       * var food = {
       *   'fruits': ['apple'],
       *   'vegetables': ['beet']
       * };
       *
       * var otherFood = {
       *   'fruits': ['banana'],
       *   'vegetables': ['carrot']
       * };
       *
       * _.merge(food, otherFood, function(a, b) {
       *   return _.isArray(a) ? a.concat(b) : undefined;
       * });
       * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
       */
      function merge(object) {
        var args = arguments,
            length = 2;

        if (!isObject(object)) {
          return object;
        }
        // allows working with `_.reduce` and `_.reduceRight` without using
        // their `index` and `collection` arguments
        if (typeof args[2] != 'number') {
          length = args.length;
        }
        if (length > 3 && typeof args[length - 2] == 'function') {
          var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
        } else if (length > 2 && typeof args[length - 1] == 'function') {
          callback = args[--length];
        }
        var sources = nativeSlice.call(arguments, 1, length),
            index = -1,
            stackA = getArray(),
            stackB = getArray();

        while (++index < length) {
          baseMerge(object, sources[index], callback, stackA, stackB);
        }
        releaseArray(stackA);
        releaseArray(stackB);
        return object;
      }

      /**
       * Creates a shallow clone of `object` excluding the specified properties.
       * Property names may be specified as individual arguments or as arrays of
       * property names. If a callback is provided it will be executed for each
       * property of `object` omitting the properties the callback returns truey
       * for. The callback is bound to `thisArg` and invoked with three arguments;
       * (value, key, object).
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The source object.
       * @param {Function|...string|string[]} [callback] The properties to omit or the
       *  function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns an object without the omitted properties.
       * @example
       *
       * _.omit({ 'name': 'moe', 'age': 40 }, 'age');
       * // => { 'name': 'moe' }
       *
       * _.omit({ 'name': 'moe', 'age': 40 }, function(value) {
       *   return typeof value == 'number';
       * });
       * // => { 'name': 'moe' }
       */
      function omit(object, callback, thisArg) {
        var indexOf = getIndexOf(),
            isFunc = typeof callback == 'function',
            result = {};

        if (isFunc) {
          callback = lodash.createCallback(callback, thisArg, 3);
        } else {
          var props = baseFlatten(arguments, true, false, 1);
        }
        forIn(object, function(value, key, object) {
          if (isFunc
                ? !callback(value, key, object)
                : indexOf(props, key) < 0
              ) {
            result[key] = value;
          }
        });
        return result;
      }

      /**
       * Creates a two dimensional array of an object's key-value pairs,
       * i.e. `[[key1, value1], [key2, value2]]`.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to inspect.
       * @returns {Array} Returns new array of key-value pairs.
       * @example
       *
       * _.pairs({ 'moe': 30, 'larry': 40 });
       * // => [['moe', 30], ['larry', 40]] (property order is not guaranteed across environments)
       */
      function pairs(object) {
        var index = -1,
            props = keys(object),
            length = props.length,
            result = Array(length);

        while (++index < length) {
          var key = props[index];
          result[index] = [key, object[key]];
        }
        return result;
      }

      /**
       * Creates a shallow clone of `object` composed of the specified properties.
       * Property names may be specified as individual arguments or as arrays of
       * property names. If a callback is provided it will be executed for each
       * property of `object` picking the properties the callback returns truey
       * for. The callback is bound to `thisArg` and invoked with three arguments;
       * (value, key, object).
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The source object.
       * @param {Function|...string|string[]} [callback] The function called per
       *  iteration or property names to pick, specified as individual property
       *  names or arrays of property names.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns an object composed of the picked properties.
       * @example
       *
       * _.pick({ 'name': 'moe', '_userid': 'moe1' }, 'name');
       * // => { 'name': 'moe' }
       *
       * _.pick({ 'name': 'moe', '_userid': 'moe1' }, function(value, key) {
       *   return key.charAt(0) != '_';
       * });
       * // => { 'name': 'moe' }
       */
      function pick(object, callback, thisArg) {
        var result = {};
        if (typeof callback != 'function') {
          var index = -1,
              props = baseFlatten(arguments, true, false, 1),
              length = isObject(object) ? props.length : 0;

          while (++index < length) {
            var key = props[index];
            if (key in object) {
              result[key] = object[key];
            }
          }
        } else {
          callback = lodash.createCallback(callback, thisArg, 3);
          forIn(object, function(value, key, object) {
            if (callback(value, key, object)) {
              result[key] = value;
            }
          });
        }
        return result;
      }

      /**
       * An alternative to `_.reduce` this method transforms `object` to a new
       * `accumulator` object which is the result of running each of its elements
       * through a callback, with each callback execution potentially mutating
       * the `accumulator` object. The callback is bound to `thisArg` and invoked
       * with four arguments; (accumulator, value, key, object). Callbacks may exit
       * iteration early by explicitly returning `false`.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Array|Object} collection The collection to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [accumulator] The custom accumulator value.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the accumulated value.
       * @example
       *
       * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
       *   num *= num;
       *   if (num % 2) {
       *     return result.push(num) < 3;
       *   }
       * });
       * // => [1, 9, 25]
       *
       * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
       *   result[key] = num * 3;
       * });
       * // => { 'a': 3, 'b': 6, 'c': 9 }
       */
      function transform(object, callback, accumulator, thisArg) {
        var isArr = isArray(object);
        callback = baseCreateCallback(callback, thisArg, 4);

        if (accumulator == null) {
          if (isArr) {
            accumulator = [];
          } else {
            var ctor = object && object.constructor,
                proto = ctor && ctor.prototype;

            accumulator = createObject(proto);
          }
        }
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
        return accumulator;
      }

      /**
       * Creates an array composed of the own enumerable property values of `object`.
       *
       * @static
       * @memberOf _
       * @category Objects
       * @param {Object} object The object to inspect.
       * @returns {Array} Returns an array of property values.
       * @example
       *
       * _.values({ 'one': 1, 'two': 2, 'three': 3 });
       * // => [1, 2, 3] (property order is not guaranteed across environments)
       */
      function values(object) {
        var index = -1,
            props = keys(object),
            length = props.length,
            result = Array(length);

        while (++index < length) {
          result[index] = object[props[index]];
        }
        return result;
      }

      /*--------------------------------------------------------------------------*/

      /**
       * Creates an array of elements from the specified indexes, or keys, of the
       * `collection`. Indexes may be specified as individual arguments or as arrays
       * of indexes.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
       *   to retrieve, specified as individual indexes or arrays of indexes.
       * @returns {Array} Returns a new array of elements corresponding to the
       *  provided indexes.
       * @example
       *
       * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
       * // => ['a', 'c', 'e']
       *
       * _.at(['moe', 'larry', 'curly'], 0, 2);
       * // => ['moe', 'curly']
       */
      function at(collection) {
        var args = arguments,
            index = -1,
            props = baseFlatten(args, true, false, 1),
            length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
            result = Array(length);

        while(++index < length) {
          result[index] = collection[props[index]];
        }
        return result;
      }

      /**
       * Checks if a given value is present in a collection using strict equality
       * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
       * offset from the end of the collection.
       *
       * @static
       * @memberOf _
       * @alias include
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {*} target The value to check for.
       * @param {number} [fromIndex=0] The index to search from.
       * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
       * @example
       *
       * _.contains([1, 2, 3], 1);
       * // => true
       *
       * _.contains([1, 2, 3], 1, 2);
       * // => false
       *
       * _.contains({ 'name': 'moe', 'age': 40 }, 'moe');
       * // => true
       *
       * _.contains('curly', 'ur');
       * // => true
       */
      function contains(collection, target, fromIndex) {
        var index = -1,
            indexOf = getIndexOf(),
            length = collection ? collection.length : 0,
            result = false;

        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
        if (isArray(collection)) {
          result = indexOf(collection, target, fromIndex) > -1;
        } else if (typeof length == 'number') {
          result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
        } else {
          forOwn(collection, function(value) {
            if (++index >= fromIndex) {
              return !(result = value === target);
            }
          });
        }
        return result;
      }

      /**
       * Creates an object composed of keys generated from the results of running
       * each element of `collection` through the callback. The corresponding value
       * of each key is the number of times the key was returned by the callback.
       * The callback is bound to `thisArg` and invoked with three arguments;
       * (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns the composed aggregate object.
       * @example
       *
       * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
       * // => { '4': 1, '6': 2 }
       *
       * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
       * // => { '4': 1, '6': 2 }
       *
       * _.countBy(['one', 'two', 'three'], 'length');
       * // => { '3': 2, '5': 1 }
       */
      var countBy = createAggregator(function(result, value, key) {
        (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
      });

      /**
       * Checks if the given callback returns truey value for **all** elements of
       * a collection. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias all
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {boolean} Returns `true` if all elements passed the callback check,
       *  else `false`.
       * @example
       *
       * _.every([true, 1, null, 'yes'], Boolean);
       * // => false
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.every(stooges, 'age');
       * // => true
       *
       * // using "_.where" callback shorthand
       * _.every(stooges, { 'age': 50 });
       * // => false
       */
      function every(collection, callback, thisArg) {
        var result = true;
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            if (!(result = !!callback(collection[index], index, collection))) {
              break;
            }
          }
        } else {
          forOwn(collection, function(value, index, collection) {
            return (result = !!callback(value, index, collection));
          });
        }
        return result;
      }

      /**
       * Iterates over elements of a collection, returning an array of all elements
       * the callback returns truey for. The callback is bound to `thisArg` and
       * invoked with three arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias select
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new array of elements that passed the callback check.
       * @example
       *
       * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
       * // => [2, 4, 6]
       *
       * var food = [
       *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
       *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.filter(food, 'organic');
       * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
       *
       * // using "_.where" callback shorthand
       * _.filter(food, { 'type': 'fruit' });
       * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
       */
      function filter(collection, callback, thisArg) {
        var result = [];
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            if (callback(value, index, collection)) {
              result.push(value);
            }
          }
        } else {
          forOwn(collection, function(value, index, collection) {
            if (callback(value, index, collection)) {
              result.push(value);
            }
          });
        }
        return result;
      }

      /**
       * Iterates over elements of a collection, returning the first element that
       * the callback returns truey for. The callback is bound to `thisArg` and
       * invoked with three arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias detect, findWhere
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the found element, else `undefined`.
       * @example
       *
       * _.find([1, 2, 3, 4], function(num) {
       *   return num % 2 == 0;
       * });
       * // => 2
       *
       * var food = [
       *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
       *   { 'name': 'banana', 'organic': true,  'type': 'fruit' },
       *   { 'name': 'beet',   'organic': false, 'type': 'vegetable' }
       * ];
       *
       * // using "_.where" callback shorthand
       * _.find(food, { 'type': 'vegetable' });
       * // => { 'name': 'beet', 'organic': false, 'type': 'vegetable' }
       *
       * // using "_.pluck" callback shorthand
       * _.find(food, 'organic');
       * // => { 'name': 'banana', 'organic': true, 'type': 'fruit' }
       */
      function find(collection, callback, thisArg) {
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            if (callback(value, index, collection)) {
              return value;
            }
          }
        } else {
          var result;
          forOwn(collection, function(value, index, collection) {
            if (callback(value, index, collection)) {
              result = value;
              return false;
            }
          });
          return result;
        }
      }

      /**
       * This method is like `_.find` except that it iterates over elements
       * of a `collection` from right to left.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the found element, else `undefined`.
       * @example
       *
       * _.findLast([1, 2, 3, 4], function(num) {
       *   return num % 2 == 1;
       * });
       * // => 3
       */
      function findLast(collection, callback, thisArg) {
        var result;
        callback = lodash.createCallback(callback, thisArg, 3);
        forEachRight(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }

      /**
       * Iterates over elements of a collection, executing the callback for each
       * element. The callback is bound to `thisArg` and invoked with three arguments;
       * (value, index|key, collection). Callbacks may exit iteration early by
       * explicitly returning `false`.
       *
       * @static
       * @memberOf _
       * @alias each
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array|Object|string} Returns `collection`.
       * @example
       *
       * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
       * // => logs each number and returns '1,2,3'
       *
       * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
       * // => logs each number and returns the object (property order is not guaranteed across environments)
       */
      function forEach(collection, callback, thisArg) {
        var index = -1,
            length = collection ? collection.length : 0;

        callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        if (typeof length == 'number') {
          while (++index < length) {
            if (callback(collection[index], index, collection) === false) {
              break;
            }
          }
        } else {
          forOwn(collection, callback);
        }
        return collection;
      }

      /**
       * This method is like `_.forEach` except that it iterates over elements
       * of a `collection` from right to left.
       *
       * @static
       * @memberOf _
       * @alias eachRight
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array|Object|string} Returns `collection`.
       * @example
       *
       * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
       * // => logs each number from right to left and returns '3,2,1'
       */
      function forEachRight(collection, callback, thisArg) {
        var length = collection ? collection.length : 0;
        callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        if (typeof length == 'number') {
          while (length--) {
            if (callback(collection[length], length, collection) === false) {
              break;
            }
          }
        } else {
          var props = keys(collection);
          length = props.length;
          forOwn(collection, function(value, key, collection) {
            key = props ? props[--length] : --length;
            return callback(collection[key], key, collection);
          });
        }
        return collection;
      }

      /**
       * Creates an object composed of keys generated from the results of running
       * each element of a collection through the callback. The corresponding value
       * of each key is an array of the elements responsible for generating the key.
       * The callback is bound to `thisArg` and invoked with three arguments;
       * (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns the composed aggregate object.
       * @example
       *
       * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
       * // => { '4': [4.2], '6': [6.1, 6.4] }
       *
       * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
       * // => { '4': [4.2], '6': [6.1, 6.4] }
       *
       * // using "_.pluck" callback shorthand
       * _.groupBy(['one', 'two', 'three'], 'length');
       * // => { '3': ['one', 'two'], '5': ['three'] }
       */
      var groupBy = createAggregator(function(result, value, key) {
        (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
      });

      /**
       * Creates an object composed of keys generated from the results of running
       * each element of the collection through the given callback. The corresponding
       * value of each key is the last element responsible for generating the key.
       * The callback is bound to `thisArg` and invoked with three arguments;
       * (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Object} Returns the composed aggregate object.
       * @example
       *
       * var keys = [
       *   { 'dir': 'left', 'code': 97 },
       *   { 'dir': 'right', 'code': 100 }
       * ];
       *
       * _.indexBy(keys, 'dir');
       * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
       *
       * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
       * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
       *
       * _.indexBy(stooges, function(key) { this.fromCharCode(key.code); }, String);
       * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
       */
      var indexBy = createAggregator(function(result, value, key) {
        result[key] = value;
      });

      /**
       * Invokes the method named by `methodName` on each element in the `collection`
       * returning an array of the results of each invoked method. Additional arguments
       * will be provided to each invoked method. If `methodName` is a function it
       * will be invoked for, and `this` bound to, each element in the `collection`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|string} methodName The name of the method to invoke or
       *  the function invoked per iteration.
       * @param {...*} [arg] Arguments to invoke the method with.
       * @returns {Array} Returns a new array of the results of each invoked method.
       * @example
       *
       * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
       * // => [[1, 5, 7], [1, 2, 3]]
       *
       * _.invoke([123, 456], String.prototype.split, '');
       * // => [['1', '2', '3'], ['4', '5', '6']]
       */
      function invoke(collection, methodName) {
        var args = nativeSlice.call(arguments, 2),
            index = -1,
            isFunc = typeof methodName == 'function',
            length = collection ? collection.length : 0,
            result = Array(typeof length == 'number' ? length : 0);

        forEach(collection, function(value) {
          result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
        });
        return result;
      }

      /**
       * Creates an array of values by running each element in the collection
       * through the callback. The callback is bound to `thisArg` and invoked with
       * three arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias collect
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new array of the results of each `callback` execution.
       * @example
       *
       * _.map([1, 2, 3], function(num) { return num * 3; });
       * // => [3, 6, 9]
       *
       * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
       * // => [3, 6, 9] (property order is not guaranteed across environments)
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.map(stooges, 'name');
       * // => ['moe', 'larry']
       */
      function map(collection, callback, thisArg) {
        var index = -1,
            length = collection ? collection.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        if (typeof length == 'number') {
          var result = Array(length);
          while (++index < length) {
            result[index] = callback(collection[index], index, collection);
          }
        } else {
          result = [];
          forOwn(collection, function(value, key, collection) {
            result[++index] = callback(value, key, collection);
          });
        }
        return result;
      }

      /**
       * Retrieves the maximum value of a collection. If the collection is empty or
       * falsey `-Infinity` is returned. If a callback is provided it will be executed
       * for each value in the collection to generate the criterion by which the value
       * is ranked. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, index, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the maximum value.
       * @example
       *
       * _.max([4, 2, 8, 6]);
       * // => 8
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * _.max(stooges, function(stooge) { return stooge.age; });
       * // => { 'name': 'larry', 'age': 50 };
       *
       * // using "_.pluck" callback shorthand
       * _.max(stooges, 'age');
       * // => { 'name': 'larry', 'age': 50 };
       */
      function max(collection, callback, thisArg) {
        var computed = -Infinity,
            result = computed;

        if (!callback && isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            if (value > result) {
              result = value;
            }
          }
        } else {
          callback = (!callback && isString(collection))
            ? charAtCallback
            : lodash.createCallback(callback, thisArg, 3);

          forEach(collection, function(value, index, collection) {
            var current = callback(value, index, collection);
            if (current > computed) {
              computed = current;
              result = value;
            }
          });
        }
        return result;
      }

      /**
       * Retrieves the minimum value of a collection. If the collection is empty or
       * falsey `Infinity` is returned. If a callback is provided it will be executed
       * for each value in the collection to generate the criterion by which the value
       * is ranked. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, index, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the minimum value.
       * @example
       *
       * _.min([4, 2, 8, 6]);
       * // => 2
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * _.min(stooges, function(stooge) { return stooge.age; });
       * // => { 'name': 'moe', 'age': 40 };
       *
       * // using "_.pluck" callback shorthand
       * _.min(stooges, 'age');
       * // => { 'name': 'moe', 'age': 40 };
       */
      function min(collection, callback, thisArg) {
        var computed = Infinity,
            result = computed;

        if (!callback && isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            if (value < result) {
              result = value;
            }
          }
        } else {
          callback = (!callback && isString(collection))
            ? charAtCallback
            : lodash.createCallback(callback, thisArg, 3);

          forEach(collection, function(value, index, collection) {
            var current = callback(value, index, collection);
            if (current < computed) {
              computed = current;
              result = value;
            }
          });
        }
        return result;
      }

      /**
       * Retrieves the value of a specified property from all elements in the `collection`.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {string} property The property to pluck.
       * @returns {Array} Returns a new array of property values.
       * @example
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * _.pluck(stooges, 'name');
       * // => ['moe', 'larry']
       */
      function pluck(collection, property) {
        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          var result = Array(length);
          while (++index < length) {
            result[index] = collection[index][property];
          }
        }
        return result || map(collection, property);
      }

      /**
       * Reduces a collection to a value which is the accumulated result of running
       * each element in the collection through the callback, where each successive
       * callback execution consumes the return value of the previous execution. If
       * `accumulator` is not provided the first element of the collection will be
       * used as the initial `accumulator` value. The callback is bound to `thisArg`
       * and invoked with four arguments; (accumulator, value, index|key, collection).
       *
       * @static
       * @memberOf _
       * @alias foldl, inject
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [accumulator] Initial value of the accumulator.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the accumulated value.
       * @example
       *
       * var sum = _.reduce([1, 2, 3], function(sum, num) {
       *   return sum + num;
       * });
       * // => 6
       *
       * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
       *   result[key] = num * 3;
       *   return result;
       * }, {});
       * // => { 'a': 3, 'b': 6, 'c': 9 }
       */
      function reduce(collection, callback, accumulator, thisArg) {
        if (!collection) return accumulator;
        var noaccum = arguments.length < 3;
        callback = baseCreateCallback(callback, thisArg, 4);

        var index = -1,
            length = collection.length;

        if (typeof length == 'number') {
          if (noaccum) {
            accumulator = collection[++index];
          }
          while (++index < length) {
            accumulator = callback(accumulator, collection[index], index, collection);
          }
        } else {
          forOwn(collection, function(value, index, collection) {
            accumulator = noaccum
              ? (noaccum = false, value)
              : callback(accumulator, value, index, collection)
          });
        }
        return accumulator;
      }

      /**
       * This method is like `_.reduce` except that it iterates over elements
       * of a `collection` from right to left.
       *
       * @static
       * @memberOf _
       * @alias foldr
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function} [callback=identity] The function called per iteration.
       * @param {*} [accumulator] Initial value of the accumulator.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the accumulated value.
       * @example
       *
       * var list = [[0, 1], [2, 3], [4, 5]];
       * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
       * // => [4, 5, 2, 3, 0, 1]
       */
      function reduceRight(collection, callback, accumulator, thisArg) {
        var noaccum = arguments.length < 3;
        callback = baseCreateCallback(callback, thisArg, 4);
        forEachRight(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection);
        });
        return accumulator;
      }

      /**
       * The opposite of `_.filter` this method returns the elements of a
       * collection that the callback does **not** return truey for.
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new array of elements that failed the callback check.
       * @example
       *
       * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
       * // => [1, 3, 5]
       *
       * var food = [
       *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
       *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.reject(food, 'organic');
       * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
       *
       * // using "_.where" callback shorthand
       * _.reject(food, { 'type': 'fruit' });
       * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
       */
      function reject(collection, callback, thisArg) {
        callback = lodash.createCallback(callback, thisArg, 3);
        return filter(collection, function(value, index, collection) {
          return !callback(value, index, collection);
        });
      }

      /**
       * Retrieves a random element or `n` random elements from a collection.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to sample.
       * @param {number} [n] The number of elements to sample.
       * @param- {Object} [guard] Allows working with functions, like `_.map`,
       *  without using their `key` and `object` arguments as sources.
       * @returns {Array} Returns the random sample(s) of `collection`.
       * @example
       *
       * _.sample([1, 2, 3, 4]);
       * // => 2
       *
       * _.sample([1, 2, 3, 4], 2);
       * // => [3, 1]
       */
      function sample(collection, n, guard) {
        var length = collection ? collection.length : 0;
        if (typeof length != 'number') {
          collection = values(collection);
        }
        if (n == null || guard) {
          return collection ? collection[random(length - 1)] : undefined;
        }
        var result = shuffle(collection);
        result.length = nativeMin(nativeMax(0, n), result.length);
        return result;
      }

      /**
       * Creates an array of shuffled values, using a version of the Fisher-Yates
       * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to shuffle.
       * @returns {Array} Returns a new shuffled collection.
       * @example
       *
       * _.shuffle([1, 2, 3, 4, 5, 6]);
       * // => [4, 1, 6, 3, 5, 2]
       */
      function shuffle(collection) {
        var index = -1,
            length = collection ? collection.length : 0,
            result = Array(typeof length == 'number' ? length : 0);

        forEach(collection, function(value) {
          var rand = random(++index);
          result[index] = result[rand];
          result[rand] = value;
        });
        return result;
      }

      /**
       * Gets the size of the `collection` by returning `collection.length` for arrays
       * and array-like objects or the number of own enumerable properties for objects.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to inspect.
       * @returns {number} Returns `collection.length` or number of own enumerable properties.
       * @example
       *
       * _.size([1, 2]);
       * // => 2
       *
       * _.size({ 'one': 1, 'two': 2, 'three': 3 });
       * // => 3
       *
       * _.size('curly');
       * // => 5
       */
      function size(collection) {
        var length = collection ? collection.length : 0;
        return typeof length == 'number' ? length : keys(collection).length;
      }

      /**
       * Checks if the callback returns a truey value for **any** element of a
       * collection. The function returns as soon as it finds a passing value and
       * does not iterate over the entire collection. The callback is bound to
       * `thisArg` and invoked with three arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias any
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {boolean} Returns `true` if any element passed the callback check,
       *  else `false`.
       * @example
       *
       * _.some([null, 0, 'yes', false], Boolean);
       * // => true
       *
       * var food = [
       *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
       *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.some(food, 'organic');
       * // => true
       *
       * // using "_.where" callback shorthand
       * _.some(food, { 'type': 'meat' });
       * // => false
       */
      function some(collection, callback, thisArg) {
        var result;
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            if ((result = callback(collection[index], index, collection))) {
              break;
            }
          }
        } else {
          forOwn(collection, function(value, index, collection) {
            return !(result = callback(value, index, collection));
          });
        }
        return !!result;
      }

      /**
       * Creates an array of elements, sorted in ascending order by the results of
       * running each element in a collection through the callback. This method
       * performs a stable sort, that is, it will preserve the original sort order
       * of equal elements. The callback is bound to `thisArg` and invoked with
       * three arguments; (value, index|key, collection).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new array of sorted elements.
       * @example
       *
       * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
       * // => [3, 1, 2]
       *
       * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
       * // => [3, 1, 2]
       *
       * // using "_.pluck" callback shorthand
       * _.sortBy(['banana', 'strawberry', 'apple'], 'length');
       * // => ['apple', 'banana', 'strawberry']
       */
      function sortBy(collection, callback, thisArg) {
        var index = -1,
            length = collection ? collection.length : 0,
            result = Array(typeof length == 'number' ? length : 0);

        callback = lodash.createCallback(callback, thisArg, 3);
        forEach(collection, function(value, key, collection) {
          var object = result[++index] = getObject();
          object.criteria = callback(value, key, collection);
          object.index = index;
          object.value = value;
        });

        length = result.length;
        result.sort(compareAscending);
        while (length--) {
          var object = result[length];
          result[length] = object.value;
          releaseObject(object);
        }
        return result;
      }

      /**
       * Converts the `collection` to an array.
       *
       * @static
       * @memberOf _
       * @category Collections
       * @param {Array|Object|string} collection The collection to convert.
       * @returns {Array} Returns the new converted array.
       * @example
       *
       * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
       * // => [2, 3, 4]
       */
      function toArray(collection) {
        if (collection && typeof collection.length == 'number') {
          return slice(collection);
        }
        return values(collection);
      }

      /**
       * Performs a deep comparison of each element in a `collection` to the given
       * `properties` object, returning an array of all elements that have equivalent
       * property values.
       *
       * @static
       * @memberOf _
       * @type Function
       * @category Collections
       * @param {Array|Object|string} collection The collection to iterate over.
       * @param {Object} properties The object of property values to filter by.
       * @returns {Array} Returns a new array of elements that have the given properties.
       * @example
       *
       * var stooges = [
       *   { 'name': 'curly', 'age': 30, 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
       *   { 'name': 'moe', 'age': 40, 'quotes': ['Spread out!', 'You knucklehead!'] }
       * ];
       *
       * _.where(stooges, { 'age': 40 });
       * // => [{ 'name': 'moe', 'age': 40, 'quotes': ['Spread out!', 'You knucklehead!'] }]
       *
       * _.where(stooges, { 'quotes': ['Poifect!'] });
       * // => [{ 'name': 'curly', 'age': 30, 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] }]
       */
      var where = filter;

      /*--------------------------------------------------------------------------*/

      /**
       * Creates an array with all falsey values removed. The values `false`, `null`,
       * `0`, `""`, `undefined`, and `NaN` are all falsey.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to compact.
       * @returns {Array} Returns a new array of filtered values.
       * @example
       *
       * _.compact([0, 1, false, 2, '', 3]);
       * // => [1, 2, 3]
       */
      function compact(array) {
        var index = -1,
            length = array ? array.length : 0,
            result = [];

        while (++index < length) {
          var value = array[index];
          if (value) {
            result.push(value);
          }
        }
        return result;
      }

      /**
       * Creates an array excluding all values of the provided arrays using strict
       * equality for comparisons, i.e. `===`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to process.
       * @param {...Array} [array] The arrays of values to exclude.
       * @returns {Array} Returns a new array of filtered values.
       * @example
       *
       * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
       * // => [1, 3, 4]
       */
      function difference(array) {
        var index = -1,
            indexOf = getIndexOf(),
            length = array ? array.length : 0,
            seen = baseFlatten(arguments, true, true, 1),
            result = [];

        var isLarge = length >= largeArraySize && indexOf === baseIndexOf;

        if (isLarge) {
          var cache = createCache(seen);
          if (cache) {
            indexOf = cacheIndexOf;
            seen = cache;
          } else {
            isLarge = false;
          }
        }
        while (++index < length) {
          var value = array[index];
          if (indexOf(seen, value) < 0) {
            result.push(value);
          }
        }
        if (isLarge) {
          releaseObject(seen);
        }
        return result;
      }

      /**
       * This method is like `_.find` except that it returns the index of the first
       * element that passes the callback check, instead of the element itself.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to search.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {number} Returns the index of the found element, else `-1`.
       * @example
       *
       * _.findIndex(['apple', 'banana', 'beet'], function(food) {
       *   return /^b/.test(food);
       * });
       * // => 1
       */
      function findIndex(array, callback, thisArg) {
        var index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length) {
          if (callback(array[index], index, array)) {
            return index;
          }
        }
        return -1;
      }

      /**
       * This method is like `_.findIndex` except that it iterates over elements
       * of a `collection` from right to left.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to search.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {number} Returns the index of the found element, else `-1`.
       * @example
       *
       * _.findLastIndex(['apple', 'banana', 'beet'], function(food) {
       *   return /^b/.test(food);
       * });
       * // => 2
       */
      function findLastIndex(array, callback, thisArg) {
        var length = array ? array.length : 0;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (length--) {
          if (callback(array[length], length, array)) {
            return length;
          }
        }
        return -1;
      }

      /**
       * Gets the first element or first `n` elements of an array. If a callback
       * is provided elements at the beginning of the array are returned as long
       * as the callback returns truey. The callback is bound to `thisArg` and
       * invoked with three arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias head, take
       * @category Arrays
       * @param {Array} array The array to query.
       * @param {Function|Object|number|string} [callback] The function called
       *  per element or the number of elements to return. If a property name or
       *  object is provided it will be used to create a "_.pluck" or "_.where"
       *  style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the first element(s) of `array`.
       * @example
       *
       * _.first([1, 2, 3]);
       * // => 1
       *
       * _.first([1, 2, 3], 2);
       * // => [1, 2]
       *
       * _.first([1, 2, 3], function(num) {
       *   return num < 3;
       * });
       * // => [1, 2]
       *
       * var food = [
       *   { 'name': 'banana', 'organic': true },
       *   { 'name': 'beet',   'organic': false },
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.first(food, 'organic');
       * // => [{ 'name': 'banana', 'organic': true }]
       *
       * var food = [
       *   { 'name': 'apple',  'type': 'fruit' },
       *   { 'name': 'banana', 'type': 'fruit' },
       *   { 'name': 'beet',   'type': 'vegetable' }
       * ];
       *
       * // using "_.where" callback shorthand
       * _.first(food, { 'type': 'fruit' });
       * // => [{ 'name': 'apple', 'type': 'fruit' }, { 'name': 'banana', 'type': 'fruit' }]
       */
      function first(array, callback, thisArg) {
        var n = 0,
            length = array ? array.length : 0;

        if (typeof callback != 'number' && callback != null) {
          var index = -1;
          callback = lodash.createCallback(callback, thisArg, 3);
          while (++index < length && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = callback;
          if (n == null || thisArg) {
            return array ? array[0] : undefined;
          }
        }
        return slice(array, 0, nativeMin(nativeMax(0, n), length));
      }

      /**
       * Flattens a nested array (the nesting can be to any depth). If `isShallow`
       * is truey, the array will only be flattened a single level. If a callback
       * is provided each element of the array is passed through the callback before
       * flattening. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to flatten.
       * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new flattened array.
       * @example
       *
       * _.flatten([1, [2], [3, [[4]]]]);
       * // => [1, 2, 3, 4];
       *
       * _.flatten([1, [2], [3, [[4]]]], true);
       * // => [1, 2, 3, [[4]]];
       *
       * var stooges = [
       *   { 'name': 'curly', 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
       *   { 'name': 'moe', 'quotes': ['Spread out!', 'You knucklehead!'] }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.flatten(stooges, 'quotes');
       * // => ['Oh, a wise guy, eh?', 'Poifect!', 'Spread out!', 'You knucklehead!']
       */
      function flatten(array, isShallow, callback, thisArg) {
        // juggle arguments
        if (typeof isShallow != 'boolean' && isShallow != null) {
          thisArg = callback;
          callback = !(thisArg && thisArg[isShallow] === array) ? isShallow : null;
          isShallow = false;
        }
        if (callback != null) {
          array = map(array, callback, thisArg);
        }
        return baseFlatten(array, isShallow);
      }

      /**
       * Gets the index at which the first occurrence of `value` is found using
       * strict equality for comparisons, i.e. `===`. If the array is already sorted
       * providing `true` for `fromIndex` will run a faster binary search.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to search.
       * @param {*} value The value to search for.
       * @param {boolean|number} [fromIndex=0] The index to search from or `true`
       *  to perform a binary search on a sorted array.
       * @returns {number} Returns the index of the matched value or `-1`.
       * @example
       *
       * _.indexOf([1, 2, 3, 1, 2, 3], 2);
       * // => 1
       *
       * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
       * // => 4
       *
       * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
       * // => 2
       */
      function indexOf(array, value, fromIndex) {
        if (typeof fromIndex == 'number') {
          var length = array ? array.length : 0;
          fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
        } else if (fromIndex) {
          var index = sortedIndex(array, value);
          return array[index] === value ? index : -1;
        }
        return baseIndexOf(array, value, fromIndex);
      }

      /**
       * Gets all but the last element or last `n` elements of an array. If a
       * callback is provided elements at the end of the array are excluded from
       * the result as long as the callback returns truey. The callback is bound
       * to `thisArg` and invoked with three arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to query.
       * @param {Function|Object|number|string} [callback=1] The function called
       *  per element or the number of elements to exclude. If a property name or
       *  object is provided it will be used to create a "_.pluck" or "_.where"
       *  style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a slice of `array`.
       * @example
       *
       * _.initial([1, 2, 3]);
       * // => [1, 2]
       *
       * _.initial([1, 2, 3], 2);
       * // => [1]
       *
       * _.initial([1, 2, 3], function(num) {
       *   return num > 1;
       * });
       * // => [1]
       *
       * var food = [
       *   { 'name': 'beet',   'organic': false },
       *   { 'name': 'carrot', 'organic': true }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.initial(food, 'organic');
       * // => [{ 'name': 'beet',   'organic': false }]
       *
       * var food = [
       *   { 'name': 'banana', 'type': 'fruit' },
       *   { 'name': 'beet',   'type': 'vegetable' },
       *   { 'name': 'carrot', 'type': 'vegetable' }
       * ];
       *
       * // using "_.where" callback shorthand
       * _.initial(food, { 'type': 'vegetable' });
       * // => [{ 'name': 'banana', 'type': 'fruit' }]
       */
      function initial(array, callback, thisArg) {
        var n = 0,
            length = array ? array.length : 0;

        if (typeof callback != 'number' && callback != null) {
          var index = length;
          callback = lodash.createCallback(callback, thisArg, 3);
          while (index-- && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = (callback == null || thisArg) ? 1 : callback || n;
        }
        return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
      }

      /**
       * Creates an array of unique values present in all provided arrays using
       * strict equality for comparisons, i.e. `===`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {...Array} [array] The arrays to inspect.
       * @returns {Array} Returns an array of composite values.
       * @example
       *
       * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
       * // => [1, 2]
       */
      function intersection(array) {
        var args = arguments,
            argsLength = args.length,
            argsIndex = -1,
            caches = getArray(),
            index = -1,
            indexOf = getIndexOf(),
            length = array ? array.length : 0,
            result = [],
            seen = getArray();

        while (++argsIndex < argsLength) {
          var value = args[argsIndex];
          caches[argsIndex] = indexOf === baseIndexOf &&
            (value ? value.length : 0) >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen);
        }
        outer:
        while (++index < length) {
          var cache = caches[0];
          value = array[index];

          if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
            argsIndex = argsLength;
            (cache || seen).push(value);
            while (--argsIndex) {
              cache = caches[argsIndex];
              if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
                continue outer;
              }
            }
            result.push(value);
          }
        }
        while (argsLength--) {
          cache = caches[argsLength];
          if (cache) {
            releaseObject(cache);
          }
        }
        releaseArray(caches);
        releaseArray(seen);
        return result;
      }

      /**
       * Gets the last element or last `n` elements of an array. If a callback is
       * provided elements at the end of the array are returned as long as the
       * callback returns truey. The callback is bound to `thisArg` and invoked
       * with three arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to query.
       * @param {Function|Object|number|string} [callback] The function called
       *  per element or the number of elements to return. If a property name or
       *  object is provided it will be used to create a "_.pluck" or "_.where"
       *  style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {*} Returns the last element(s) of `array`.
       * @example
       *
       * _.last([1, 2, 3]);
       * // => 3
       *
       * _.last([1, 2, 3], 2);
       * // => [2, 3]
       *
       * _.last([1, 2, 3], function(num) {
       *   return num > 1;
       * });
       * // => [2, 3]
       *
       * var food = [
       *   { 'name': 'beet',   'organic': false },
       *   { 'name': 'carrot', 'organic': true }
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.last(food, 'organic');
       * // => [{ 'name': 'carrot', 'organic': true }]
       *
       * var food = [
       *   { 'name': 'banana', 'type': 'fruit' },
       *   { 'name': 'beet',   'type': 'vegetable' },
       *   { 'name': 'carrot', 'type': 'vegetable' }
       * ];
       *
       * // using "_.where" callback shorthand
       * _.last(food, { 'type': 'vegetable' });
       * // => [{ 'name': 'beet', 'type': 'vegetable' }, { 'name': 'carrot', 'type': 'vegetable' }]
       */
      function last(array, callback, thisArg) {
        var n = 0,
            length = array ? array.length : 0;

        if (typeof callback != 'number' && callback != null) {
          var index = length;
          callback = lodash.createCallback(callback, thisArg, 3);
          while (index-- && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = callback;
          if (n == null || thisArg) {
            return array ? array[length - 1] : undefined;
          }
        }
        return slice(array, nativeMax(0, length - n));
      }

      /**
       * Gets the index at which the last occurrence of `value` is found using strict
       * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
       * as the offset from the end of the collection.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to search.
       * @param {*} value The value to search for.
       * @param {number} [fromIndex=array.length-1] The index to search from.
       * @returns {number} Returns the index of the matched value or `-1`.
       * @example
       *
       * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
       * // => 4
       *
       * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
       * // => 1
       */
      function lastIndexOf(array, value, fromIndex) {
        var index = array ? array.length : 0;
        if (typeof fromIndex == 'number') {
          index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
        }
        while (index--) {
          if (array[index] === value) {
            return index;
          }
        }
        return -1;
      }

      /**
       * Removes all provided values from the given array using strict equality for
       * comparisons, i.e. `===`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to modify.
       * @param {...*} [value] The values to remove.
       * @returns {Array} Returns `array`.
       * @example
       *
       * var array = [1, 2, 3, 1, 2, 3];
       * _.pull(array, 2, 3);
       * console.log(array);
       * // => [1, 1]
       */
      function pull(array) {
        var args = arguments,
            argsIndex = 0,
            argsLength = args.length,
            length = array ? array.length : 0;

        while (++argsIndex < argsLength) {
          var index = -1,
              value = args[argsIndex];
          while (++index < length) {
            if (array[index] === value) {
              splice.call(array, index--, 1);
              length--;
            }
          }
        }
        return array;
      }

      /**
       * Creates an array of numbers (positive and/or negative) progressing from
       * `start` up to but not including `end`. If `start` is less than `stop` a
       * zero-length range is created unless a negative `step` is specified.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {number} [start=0] The start of the range.
       * @param {number} end The end of the range.
       * @param {number} [step=1] The value to increment or decrement by.
       * @returns {Array} Returns a new range array.
       * @example
       *
       * _.range(10);
       * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
       *
       * _.range(1, 11);
       * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
       *
       * _.range(0, 30, 5);
       * // => [0, 5, 10, 15, 20, 25]
       *
       * _.range(0, -10, -1);
       * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
       *
       * _.range(1, 4, 0);
       * // => [1, 1, 1]
       *
       * _.range(0);
       * // => []
       */
      function range(start, end, step) {
        start = +start || 0;
        step = typeof step == 'number' ? step : (+step || 1);

        if (end == null) {
          end = start;
          start = 0;
        }
        // use `Array(length)` so engines, like Chakra and V8, avoid slower modes
        // http://youtu.be/XAqIpGU8ZZk#t=17m25s
        var index = -1,
            length = nativeMax(0, ceil((end - start) / (step || 1))),
            result = Array(length);

        while (++index < length) {
          result[index] = start;
          start += step;
        }
        return result;
      }

      /**
       * Removes all elements from an array that the callback returns truey for
       * and returns an array of removed elements. The callback is bound to `thisArg`
       * and invoked with three arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to modify.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a new array of removed elements.
       * @example
       *
       * var array = [1, 2, 3, 4, 5, 6];
       * var evens = _.remove(array, function(num) { return num % 2 == 0; });
       *
       * console.log(array);
       * // => [1, 3, 5]
       *
       * console.log(evens);
       * // => [2, 4, 6]
       */
      function remove(array, callback, thisArg) {
        var index = -1,
            length = array ? array.length : 0,
            result = [];

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length) {
          var value = array[index];
          if (callback(value, index, array)) {
            result.push(value);
            splice.call(array, index--, 1);
            length--;
          }
        }
        return result;
      }

      /**
       * The opposite of `_.initial` this method gets all but the first element or
       * first `n` elements of an array. If a callback function is provided elements
       * at the beginning of the array are excluded from the result as long as the
       * callback returns truey. The callback is bound to `thisArg` and invoked
       * with three arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias drop, tail
       * @category Arrays
       * @param {Array} array The array to query.
       * @param {Function|Object|number|string} [callback=1] The function called
       *  per element or the number of elements to exclude. If a property name or
       *  object is provided it will be used to create a "_.pluck" or "_.where"
       *  style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a slice of `array`.
       * @example
       *
       * _.rest([1, 2, 3]);
       * // => [2, 3]
       *
       * _.rest([1, 2, 3], 2);
       * // => [3]
       *
       * _.rest([1, 2, 3], function(num) {
       *   return num < 3;
       * });
       * // => [3]
       *
       * var food = [
       *   { 'name': 'banana', 'organic': true },
       *   { 'name': 'beet',   'organic': false },
       * ];
       *
       * // using "_.pluck" callback shorthand
       * _.rest(food, 'organic');
       * // => [{ 'name': 'beet', 'organic': false }]
       *
       * var food = [
       *   { 'name': 'apple',  'type': 'fruit' },
       *   { 'name': 'banana', 'type': 'fruit' },
       *   { 'name': 'beet',   'type': 'vegetable' }
       * ];
       *
       * // using "_.where" callback shorthand
       * _.rest(food, { 'type': 'fruit' });
       * // => [{ 'name': 'beet', 'type': 'vegetable' }]
       */
      function rest(array, callback, thisArg) {
        if (typeof callback != 'number' && callback != null) {
          var n = 0,
              index = -1,
              length = array ? array.length : 0;

          callback = lodash.createCallback(callback, thisArg, 3);
          while (++index < length && callback(array[index], index, array)) {
            n++;
          }
        } else {
          n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
        }
        return slice(array, n);
      }

      /**
       * Uses a binary search to determine the smallest index at which a value
       * should be inserted into a given sorted array in order to maintain the sort
       * order of the array. If a callback is provided it will be executed for
       * `value` and each element of `array` to compute their sort ranking. The
       * callback is bound to `thisArg` and invoked with one argument; (value).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to inspect.
       * @param {*} value The value to evaluate.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {number} Returns the index at which `value` should be inserted
       *  into `array`.
       * @example
       *
       * _.sortedIndex([20, 30, 50], 40);
       * // => 2
       *
       * // using "_.pluck" callback shorthand
       * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
       * // => 2
       *
       * var dict = {
       *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
       * };
       *
       * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
       *   return dict.wordToNumber[word];
       * });
       * // => 2
       *
       * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
       *   return this.wordToNumber[word];
       * }, dict);
       * // => 2
       */
      function sortedIndex(array, value, callback, thisArg) {
        var low = 0,
            high = array ? array.length : low;

        // explicitly reference `identity` for better inlining in Firefox
        callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
        value = callback(value);

        while (low < high) {
          var mid = (low + high) >>> 1;
          (callback(array[mid]) < value)
            ? low = mid + 1
            : high = mid;
        }
        return low;
      }

      /**
       * Creates an array of unique values, in order, of the provided arrays using
       * strict equality for comparisons, i.e. `===`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {...Array} [array] The arrays to inspect.
       * @returns {Array} Returns an array of composite values.
       * @example
       *
       * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
       * // => [1, 2, 3, 101, 10]
       */
      function union(array) {
        return baseUniq(baseFlatten(arguments, true, true));
      }

      /**
       * Creates a duplicate-value-free version of an array using strict equality
       * for comparisons, i.e. `===`. If the array is sorted, providing
       * `true` for `isSorted` will use a faster algorithm. If a callback is provided
       * each element of `array` is passed through the callback before uniqueness
       * is computed. The callback is bound to `thisArg` and invoked with three
       * arguments; (value, index, array).
       *
       * If a property name is provided for `callback` the created "_.pluck" style
       * callback will return the property value of the given element.
       *
       * If an object is provided for `callback` the created "_.where" style callback
       * will return `true` for elements that have the properties of the given object,
       * else `false`.
       *
       * @static
       * @memberOf _
       * @alias unique
       * @category Arrays
       * @param {Array} array The array to process.
       * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
       * @param {Function|Object|string} [callback=identity] The function called
       *  per iteration. If a property name or object is provided it will be used
       *  to create a "_.pluck" or "_.where" style callback, respectively.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns a duplicate-value-free array.
       * @example
       *
       * _.uniq([1, 2, 1, 3, 1]);
       * // => [1, 2, 3]
       *
       * _.uniq([1, 1, 2, 2, 3], true);
       * // => [1, 2, 3]
       *
       * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
       * // => ['A', 'b', 'C']
       *
       * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
       * // => [1, 2.5, 3]
       *
       * // using "_.pluck" callback shorthand
       * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
       * // => [{ 'x': 1 }, { 'x': 2 }]
       */
      function uniq(array, isSorted, callback, thisArg) {
        // juggle arguments
        if (typeof isSorted != 'boolean' && isSorted != null) {
          thisArg = callback;
          callback = !(thisArg && thisArg[isSorted] === array) ? isSorted : null;
          isSorted = false;
        }
        if (callback != null) {
          callback = lodash.createCallback(callback, thisArg, 3);
        }
        return baseUniq(array, isSorted, callback);
      }

      /**
       * Creates an array excluding all provided values using strict equality for
       * comparisons, i.e. `===`.
       *
       * @static
       * @memberOf _
       * @category Arrays
       * @param {Array} array The array to filter.
       * @param {...*} [value] The values to exclude.
       * @returns {Array} Returns a new array of filtered values.
       * @example
       *
       * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
       * // => [2, 3, 4]
       */
      function without(array) {
        return difference(array, nativeSlice.call(arguments, 1));
      }

      /**
       * Creates an array of grouped elements, the first of which contains the first
       * elements of the given arrays, the second of which contains the second
       * elements of the given arrays, and so on.
       *
       * @static
       * @memberOf _
       * @alias unzip
       * @category Arrays
       * @param {...Array} [array] Arrays to process.
       * @returns {Array} Returns a new array of grouped elements.
       * @example
       *
       * _.zip(['moe', 'larry'], [30, 40], [true, false]);
       * // => [['moe', 30, true], ['larry', 40, false]]
       */
      function zip() {
        var array = arguments.length > 1 ? arguments : arguments[0],
            index = -1,
            length = array ? max(pluck(array, 'length')) : 0,
            result = Array(length < 0 ? 0 : length);

        while (++index < length) {
          result[index] = pluck(array, index);
        }
        return result;
      }

      /**
       * Creates an object composed from arrays of `keys` and `values`. Provide
       * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
       * or two arrays, one of `keys` and one of corresponding `values`.
       *
       * @static
       * @memberOf _
       * @alias object
       * @category Arrays
       * @param {Array} keys The array of keys.
       * @param {Array} [values=[]] The array of values.
       * @returns {Object} Returns an object composed of the given keys and
       *  corresponding values.
       * @example
       *
       * _.zipObject(['moe', 'larry'], [30, 40]);
       * // => { 'moe': 30, 'larry': 40 }
       */
      function zipObject(keys, values) {
        var index = -1,
            length = keys ? keys.length : 0,
            result = {};

        while (++index < length) {
          var key = keys[index];
          if (values) {
            result[key] = values[index];
          } else if (key) {
            result[key[0]] = key[1];
          }
        }
        return result;
      }

      /*--------------------------------------------------------------------------*/

      /**
       * Creates a function that executes `func`, with  the `this` binding and
       * arguments of the created function, only after being called `n` times.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {number} n The number of times the function must be called before
       *  `func` is executed.
       * @param {Function} func The function to restrict.
       * @returns {Function} Returns the new restricted function.
       * @example
       *
       * var saves = ['profile', 'settings'];
       *
       * var done = _.after(saves.length, function() {
       *   console.log('Done saving!');
       * });
       *
       * _.forEach(saves, function(type) {
       *   asyncSave({ 'type': type, 'complete': done });
       * });
       * // => logs 'Done saving!', after all saves have completed
       */
      function after(n, func) {
        if (!isFunction(func)) {
          throw new TypeError;
        }
        return function() {
          if (--n < 1) {
            return func.apply(this, arguments);
          }
        };
      }

      /**
       * Creates a function that, when called, invokes `func` with the `this`
       * binding of `thisArg` and prepends any additional `bind` arguments to those
       * provided to the bound function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to bind.
       * @param {*} [thisArg] The `this` binding of `func`.
       * @param {...*} [arg] Arguments to be partially applied.
       * @returns {Function} Returns the new bound function.
       * @example
       *
       * var func = function(greeting) {
       *   return greeting + ' ' + this.name;
       * };
       *
       * func = _.bind(func, { 'name': 'moe' }, 'hi');
       * func();
       * // => 'hi moe'
       */
      function bind(func, thisArg) {
        return arguments.length > 2
          ? createBound(func, 17, nativeSlice.call(arguments, 2), null, thisArg)
          : createBound(func, 1, null, null, thisArg);
      }

      /**
       * Binds methods of an object to the object itself, overwriting the existing
       * method. Method names may be specified as individual arguments or as arrays
       * of method names. If no method names are provided all the function properties
       * of `object` will be bound.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Object} object The object to bind and assign the bound methods to.
       * @param {...string} [methodName] The object method names to
       *  bind, specified as individual method names or arrays of method names.
       * @returns {Object} Returns `object`.
       * @example
       *
       * var view = {
       *  'label': 'docs',
       *  'onClick': function() { console.log('clicked ' + this.label); }
       * };
       *
       * _.bindAll(view);
       * jQuery('#docs').on('click', view.onClick);
       * // => logs 'clicked docs', when the button is clicked
       */
      function bindAll(object) {
        var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
            index = -1,
            length = funcs.length;

        while (++index < length) {
          var key = funcs[index];
          object[key] = createBound(object[key], 1, null, null, object);
        }
        return object;
      }

      /**
       * Creates a function that, when called, invokes the method at `object[key]`
       * and prepends any additional `bindKey` arguments to those provided to the bound
       * function. This method differs from `_.bind` by allowing bound functions to
       * reference methods that will be redefined or don't yet exist.
       * See http://michaux.ca/articles/lazy-function-definition-pattern.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Object} object The object the method belongs to.
       * @param {string} key The key of the method.
       * @param {...*} [arg] Arguments to be partially applied.
       * @returns {Function} Returns the new bound function.
       * @example
       *
       * var object = {
       *   'name': 'moe',
       *   'greet': function(greeting) {
       *     return greeting + ' ' + this.name;
       *   }
       * };
       *
       * var func = _.bindKey(object, 'greet', 'hi');
       * func();
       * // => 'hi moe'
       *
       * object.greet = function(greeting) {
       *   return greeting + ', ' + this.name + '!';
       * };
       *
       * func();
       * // => 'hi, moe!'
       */
      function bindKey(object, key) {
        return arguments.length > 2
          ? createBound(key, 19, nativeSlice.call(arguments, 2), null, object)
          : createBound(key, 3, null, null, object);
      }

      /**
       * Creates a function that is the composition of the provided functions,
       * where each function consumes the return value of the function that follows.
       * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
       * Each function is executed with the `this` binding of the composed function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {...Function} [func] Functions to compose.
       * @returns {Function} Returns the new composed function.
       * @example
       *
       * var realNameMap = {
       *   'curly': 'jerome'
       * };
       *
       * var format = function(name) {
       *   name = realNameMap[name.toLowerCase()] || name;
       *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
       * };
       *
       * var greet = function(formatted) {
       *   return 'Hiya ' + formatted + '!';
       * };
       *
       * var welcome = _.compose(greet, format);
       * welcome('curly');
       * // => 'Hiya Jerome!'
       */
      function compose() {
        var funcs = arguments,
            length = funcs.length;

        while (length--) {
          if (!isFunction(funcs[length])) {
            throw new TypeError;
          }
        }
        return function() {
          var args = arguments,
              length = funcs.length;

          while (length--) {
            args = [funcs[length].apply(this, args)];
          }
          return args[0];
        };
      }

      /**
       * Produces a callback bound to an optional `thisArg`. If `func` is a property
       * name the created callback will return the property value for a given element.
       * If `func` is an object the created callback will return `true` for elements
       * that contain the equivalent object properties, otherwise it will return `false`.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {*} [func=identity] The value to convert to a callback.
       * @param {*} [thisArg] The `this` binding of the created callback.
       * @param {number} [argCount] The number of arguments the callback accepts.
       * @returns {Function} Returns a callback function.
       * @example
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 }
       * ];
       *
       * // wrap to create custom callback shorthands
       * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
       *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
       *   return !match ? func(callback, thisArg) : function(object) {
       *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
       *   };
       * });
       *
       * _.filter(stooges, 'age__gt45');
       * // => [{ 'name': 'larry', 'age': 50 }]
       */
      function createCallback(func, thisArg, argCount) {
        var type = typeof func;
        if (func == null || type == 'function') {
          return baseCreateCallback(func, thisArg, argCount);
        }
        // handle "_.pluck" style callback shorthands
        if (type != 'object') {
          return function(object) {
            return object[func];
          };
        }
        var props = keys(func),
            key = props[0],
            a = func[key];

        // handle "_.where" style callback shorthands
        if (props.length == 1 && a === a && !isObject(a)) {
          // fast path the common case of providing an object with a single
          // property containing a primitive value
          return function(object) {
            var b = object[key];
            return a === b && (a !== 0 || (1 / a == 1 / b));
          };
        }
        return function(object) {
          var length = props.length,
              result = false;

          while (length--) {
            if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
              break;
            }
          }
          return result;
        };
      }

      /**
       * Creates a function which accepts one or more arguments of `func` that when
       * invoked either executes `func` returning its result, if all `func` arguments
       * have been provided, or returns a function that accepts one or more of the
       * remaining `func` arguments, and so on. The arity of `func` can be specified
       * if `func.length` is not sufficient.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to curry.
       * @param {number} [arity=func.length] The arity of `func`.
       * @returns {Function} Returns the new curried function.
       * @example
       *
       * var curried = _.curry(function(a, b, c) {
       *   console.log(a + b + c);
       * });
       *
       * curried(1)(2)(3);
       * // => 6
       *
       * curried(1, 2)(3);
       * // => 6
       *
       * curried(1, 2, 3);
       * // => 6
       */
      function curry(func, arity) {
        arity = typeof arity == 'number' ? arity : (+arity || func.length);
        return createBound(func, 4, null, null, null, arity);
      }

      /**
       * Creates a function that will delay the execution of `func` until after
       * `wait` milliseconds have elapsed since the last time it was invoked.
       * Provide an options object to indicate that `func` should be invoked on
       * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
       * to the debounced function will return the result of the last `func` call.
       *
       * Note: If `leading` and `trailing` options are `true` `func` will be called
       * on the trailing edge of the timeout only if the the debounced function is
       * invoked more than once during the `wait` timeout.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to debounce.
       * @param {number} wait The number of milliseconds to delay.
       * @param {Object} [options] The options object.
       * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
       * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
       * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
       * @returns {Function} Returns the new debounced function.
       * @example
       *
       * // avoid costly calculations while the window size is in flux
       * var lazyLayout = _.debounce(calculateLayout, 150);
       * jQuery(window).on('resize', lazyLayout);
       *
       * // execute `sendMail` when the click event is fired, debouncing subsequent calls
       * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
       *   'leading': true,
       *   'trailing': false
       * });
       *
       * // ensure `batchLog` is executed once after 1 second of debounced calls
       * var source = new EventSource('/stream');
       * source.addEventListener('message', _.debounce(batchLog, 250, {
       *   'maxWait': 1000
       * }, false);
       */
      function debounce(func, wait, options) {
        var args,
            maxTimeoutId,
            result,
            stamp,
            thisArg,
            timeoutId,
            trailingCall,
            lastCalled = 0,
            maxWait = false,
            trailing = true;

        if (!isFunction(func)) {
          throw new TypeError;
        }
        wait = nativeMax(0, wait) || 0;
        if (options === true) {
          var leading = true;
          trailing = false;
        } else if (isObject(options)) {
          leading = options.leading;
          maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
          trailing = 'trailing' in options ? options.trailing : trailing;
        }
        var delayed = function() {
          var remaining = wait - (now() - stamp);
          if (remaining <= 0) {
            if (maxTimeoutId) {
              clearTimeout(maxTimeoutId);
            }
            var isCalled = trailingCall;
            maxTimeoutId = timeoutId = trailingCall = undefined;
            if (isCalled) {
              lastCalled = now();
              result = func.apply(thisArg, args);
            }
          } else {
            timeoutId = setTimeout(delayed, remaining);
          }
        };

        var maxDelayed = function() {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (trailing || (maxWait !== wait)) {
            lastCalled = now();
            result = func.apply(thisArg, args);
          }
        };

        return function() {
          args = arguments;
          stamp = now();
          thisArg = this;
          trailingCall = trailing && (timeoutId || !leading);

          if (maxWait === false) {
            var leadingCall = leading && !timeoutId;
          } else {
            if (!maxTimeoutId && !leading) {
              lastCalled = stamp;
            }
            var remaining = maxWait - (stamp - lastCalled);
            if (remaining <= 0) {
              if (maxTimeoutId) {
                maxTimeoutId = clearTimeout(maxTimeoutId);
              }
              lastCalled = stamp;
              result = func.apply(thisArg, args);
            }
            else if (!maxTimeoutId) {
              maxTimeoutId = setTimeout(maxDelayed, remaining);
            }
          }
          if (!timeoutId && wait !== maxWait) {
            timeoutId = setTimeout(delayed, wait);
          }
          if (leadingCall) {
            result = func.apply(thisArg, args);
          }
          return result;
        };
      }

      /**
       * Defers executing the `func` function until the current call stack has cleared.
       * Additional arguments will be provided to `func` when it is invoked.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to defer.
       * @param {...*} [arg] Arguments to invoke the function with.
       * @returns {number} Returns the timer id.
       * @example
       *
       * _.defer(function() { console.log('deferred'); });
       * // returns from the function before 'deferred' is logged
       */
      function defer(func) {
        if (!isFunction(func)) {
          throw new TypeError;
        }
        var args = nativeSlice.call(arguments, 1);
        return setTimeout(function() { func.apply(undefined, args); }, 1);
      }
      // use `setImmediate` if available in Node.js
      if (isV8 && moduleExports && typeof setImmediate == 'function') {
        defer = function(func) {
          if (!isFunction(func)) {
            throw new TypeError;
          }
          return setImmediate.apply(context, arguments);
        };
      }

      /**
       * Executes the `func` function after `wait` milliseconds. Additional arguments
       * will be provided to `func` when it is invoked.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to delay.
       * @param {number} wait The number of milliseconds to delay execution.
       * @param {...*} [arg] Arguments to invoke the function with.
       * @returns {number} Returns the timer id.
       * @example
       *
       * var log = _.bind(console.log, console);
       * _.delay(log, 1000, 'logged later');
       * // => 'logged later' (Appears after one second.)
       */
      function delay(func, wait) {
        if (!isFunction(func)) {
          throw new TypeError;
        }
        var args = nativeSlice.call(arguments, 2);
        return setTimeout(function() { func.apply(undefined, args); }, wait);
      }

      /**
       * Creates a function that memoizes the result of `func`. If `resolver` is
       * provided it will be used to determine the cache key for storing the result
       * based on the arguments provided to the memoized function. By default, the
       * first argument provided to the memoized function is used as the cache key.
       * The `func` is executed with the `this` binding of the memoized function.
       * The result cache is exposed as the `cache` property on the memoized function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to have its output memoized.
       * @param {Function} [resolver] A function used to resolve the cache key.
       * @returns {Function} Returns the new memoizing function.
       * @example
       *
       * var fibonacci = _.memoize(function(n) {
       *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
       * });
       *
       * var data = {
       *   'moe': { 'name': 'moe', 'age': 40 },
       *   'curly': { 'name': 'curly', 'age': 60 }
       * };
       *
       * // modifying the result cache
       * var stooge = _.memoize(function(name) { return data[name]; }, _.identity);
       * stooge('curly');
       * // => { 'name': 'curly', 'age': 60 }
       *
       * stooge.cache.curly.name = 'jerome';
       * stooge('curly');
       * // => { 'name': 'jerome', 'age': 60 }
       */
      function memoize(func, resolver) {
        if (!isFunction(func)) {
          throw new TypeError;
        }
        var memoized = function() {
          var cache = memoized.cache,
              key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

          return hasOwnProperty.call(cache, key)
            ? cache[key]
            : (cache[key] = func.apply(this, arguments));
        }
        memoized.cache = {};
        return memoized;
      }

      /**
       * Creates a function that is restricted to execute `func` once. Repeat calls to
       * the function will return the value of the first call. The `func` is executed
       * with the `this` binding of the created function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to restrict.
       * @returns {Function} Returns the new restricted function.
       * @example
       *
       * var initialize = _.once(createApplication);
       * initialize();
       * initialize();
       * // `initialize` executes `createApplication` once
       */
      function once(func) {
        var ran,
            result;

        if (!isFunction(func)) {
          throw new TypeError;
        }
        return function() {
          if (ran) {
            return result;
          }
          ran = true;
          result = func.apply(this, arguments);

          // clear the `func` variable so the function may be garbage collected
          func = null;
          return result;
        };
      }

      /**
       * Creates a function that, when called, invokes `func` with any additional
       * `partial` arguments prepended to those provided to the new function. This
       * method is similar to `_.bind` except it does **not** alter the `this` binding.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to partially apply arguments to.
       * @param {...*} [arg] Arguments to be partially applied.
       * @returns {Function} Returns the new partially applied function.
       * @example
       *
       * var greet = function(greeting, name) { return greeting + ' ' + name; };
       * var hi = _.partial(greet, 'hi');
       * hi('moe');
       * // => 'hi moe'
       */
      function partial(func) {
        return createBound(func, 16, nativeSlice.call(arguments, 1));
      }

      /**
       * This method is like `_.partial` except that `partial` arguments are
       * appended to those provided to the new function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to partially apply arguments to.
       * @param {...*} [arg] Arguments to be partially applied.
       * @returns {Function} Returns the new partially applied function.
       * @example
       *
       * var defaultsDeep = _.partialRight(_.merge, _.defaults);
       *
       * var options = {
       *   'variable': 'data',
       *   'imports': { 'jq': $ }
       * };
       *
       * defaultsDeep(options, _.templateSettings);
       *
       * options.variable
       * // => 'data'
       *
       * options.imports
       * // => { '_': _, 'jq': $ }
       */
      function partialRight(func) {
        return createBound(func, 32, null, nativeSlice.call(arguments, 1));
      }

      /**
       * Creates a function that, when executed, will only call the `func` function
       * at most once per every `wait` milliseconds. Provide an options object to
       * indicate that `func` should be invoked on the leading and/or trailing edge
       * of the `wait` timeout. Subsequent calls to the throttled function will
       * return the result of the last `func` call.
       *
       * Note: If `leading` and `trailing` options are `true` `func` will be called
       * on the trailing edge of the timeout only if the the throttled function is
       * invoked more than once during the `wait` timeout.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {Function} func The function to throttle.
       * @param {number} wait The number of milliseconds to throttle executions to.
       * @param {Object} [options] The options object.
       * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
       * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
       * @returns {Function} Returns the new throttled function.
       * @example
       *
       * // avoid excessively updating the position while scrolling
       * var throttled = _.throttle(updatePosition, 100);
       * jQuery(window).on('scroll', throttled);
       *
       * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
       * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
       *   'trailing': false
       * }));
       */
      function throttle(func, wait, options) {
        var leading = true,
            trailing = true;

        if (!isFunction(func)) {
          throw new TypeError;
        }
        if (options === false) {
          leading = false;
        } else if (isObject(options)) {
          leading = 'leading' in options ? options.leading : leading;
          trailing = 'trailing' in options ? options.trailing : trailing;
        }
        options = getObject();
        options.leading = leading;
        options.maxWait = wait;
        options.trailing = trailing;

        var result = debounce(func, wait, options);
        releaseObject(options);
        return result;
      }

      /**
       * Creates a function that provides `value` to the wrapper function as its
       * first argument. Additional arguments provided to the function are appended
       * to those provided to the wrapper function. The wrapper is executed with
       * the `this` binding of the created function.
       *
       * @static
       * @memberOf _
       * @category Functions
       * @param {*} value The value to wrap.
       * @param {Function} wrapper The wrapper function.
       * @returns {Function} Returns the new function.
       * @example
       *
       * var hello = function(name) { return 'hello ' + name; };
       * hello = _.wrap(hello, function(func) {
       *   return 'before, ' + func('moe') + ', after';
       * });
       * hello();
       * // => 'before, hello moe, after'
       */
      function wrap(value, wrapper) {
        if (!isFunction(wrapper)) {
          throw new TypeError;
        }
        return function() {
          var args = [value];
          push.apply(args, arguments);
          return wrapper.apply(this, args);
        };
      }

      /*--------------------------------------------------------------------------*/

      /**
       * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
       * corresponding HTML entities.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {string} string The string to escape.
       * @returns {string} Returns the escaped string.
       * @example
       *
       * _.escape('Moe, Larry & Curly');
       * // => 'Moe, Larry &amp; Curly'
       */
      function escape(string) {
        return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
      }

      /**
       * This method returns the first argument provided to it.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {*} value Any value.
       * @returns {*} Returns `value`.
       * @example
       *
       * var moe = { 'name': 'moe' };
       * moe === _.identity(moe);
       * // => true
       */
      function identity(value) {
        return value;
      }

      /**
       * Adds function properties of a source object to the `lodash` function and
       * chainable wrapper.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {Object} object The object of function properties to add to `lodash`.
       * @param {Object} object The object of function properties to add to `lodash`.
       * @example
       *
       * _.mixin({
       *   'capitalize': function(string) {
       *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
       *   }
       * });
       *
       * _.capitalize('moe');
       * // => 'Moe'
       *
       * _('moe').capitalize();
       * // => 'Moe'
       */
      function mixin(object, source) {
        var ctor = object,
            isFunc = !source || isFunction(ctor);

        if (!source) {
          ctor = lodashWrapper;
          source = object;
          object = lodash;
        }
        forEach(functions(source), function(methodName) {
          var func = object[methodName] = source[methodName];
          if (isFunc) {
            ctor.prototype[methodName] = function() {
              var value = this.__wrapped__,
                  args = [value];

              push.apply(args, arguments);
              var result = func.apply(object, args);
              return (value && typeof value == 'object' && value === result)
                ? this
                : new ctor(result);
            };
          }
        });
      }

      /**
       * Reverts the '_' variable to its previous value and returns a reference to
       * the `lodash` function.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @returns {Function} Returns the `lodash` function.
       * @example
       *
       * var lodash = _.noConflict();
       */
      function noConflict() {
        context._ = oldDash;
        return this;
      }

      /**
       * Converts the given value into an integer of the specified radix.
       * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
       * `value` is a hexadecimal, in which case a `radix` of `16` is used.
       *
       * Note: This method avoids differences in native ES3 and ES5 `parseInt`
       * implementations. See http://es5.github.io/#E.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {string} value The value to parse.
       * @param {number} [radix] The radix used to interpret the value to parse.
       * @returns {number} Returns the new integer value.
       * @example
       *
       * _.parseInt('08');
       * // => 8
       */
      var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
        // Firefox and Opera still follow the ES3 specified implementation of `parseInt`
        return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
      };

      /**
       * Produces a random number between `min` and `max` (inclusive). If only one
       * argument is provided a number between `0` and the given number will be
       * returned. If `floating` is truey or either `min` or `max` are floats a
       * floating-point number will be returned instead of an integer.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {number} [min=0] The minimum possible value.
       * @param {number} [max=1] The maximum possible value.
       * @param {boolean} [floating=false] Specify returning a floating-point number.
       * @returns {number} Returns a random number.
       * @example
       *
       * _.random(0, 5);
       * // => an integer between 0 and 5
       *
       * _.random(5);
       * // => also an integer between 0 and 5
       *
       * _.random(5, true);
       * // => a floating-point number between 0 and 5
       *
       * _.random(1.2, 5.2);
       * // => a floating-point number between 1.2 and 5.2
       */
      function random(min, max, floating) {
        var noMin = min == null,
            noMax = max == null;

        if (floating == null) {
          if (typeof min == 'boolean' && noMax) {
            floating = min;
            min = 1;
          }
          else if (!noMax && typeof max == 'boolean') {
            floating = max;
            noMax = true;
          }
        }
        if (noMin && noMax) {
          max = 1;
        }
        min = +min || 0;
        if (noMax) {
          max = min;
          min = 0;
        } else {
          max = +max || 0;
        }
        var rand = nativeRandom();
        return (floating || min % 1 || max % 1)
          ? min + nativeMin(rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1))), max)
          : min + floor(rand * (max - min + 1));
      }

      /**
       * Resolves the value of `property` on `object`. If `property` is a function
       * it will be invoked with the `this` binding of `object` and its result returned,
       * else the property value is returned. If `object` is falsey then `undefined`
       * is returned.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {Object} object The object to inspect.
       * @param {string} property The property to get the value of.
       * @returns {*} Returns the resolved value.
       * @example
       *
       * var object = {
       *   'cheese': 'crumpets',
       *   'stuff': function() {
       *     return 'nonsense';
       *   }
       * };
       *
       * _.result(object, 'cheese');
       * // => 'crumpets'
       *
       * _.result(object, 'stuff');
       * // => 'nonsense'
       */
      function result(object, property) {
        if (object) {
          var value = object[property];
          return isFunction(value) ? object[property]() : value;
        }
      }

      /**
       * A micro-templating method that handles arbitrary delimiters, preserves
       * whitespace, and correctly escapes quotes within interpolated code.
       *
       * Note: In the development build, `_.template` utilizes sourceURLs for easier
       * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
       *
       * For more information on precompiling templates see:
       * http://lodash.com/#custom-builds
       *
       * For more information on Chrome extension sandboxes see:
       * http://developer.chrome.com/stable/extensions/sandboxingEval.html
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {string} text The template text.
       * @param {Object} data The data object used to populate the text.
       * @param {Object} [options] The options object.
       * @param {RegExp} [options.escape] The "escape" delimiter.
       * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
       * @param {Object} [options.imports] An object to import into the template as local variables.
       * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
       * @param {string} [sourceURL] The sourceURL of the template's compiled source.
       * @param {string} [variable] The data object variable name.
       * @returns {Function|string} Returns a compiled function when no `data` object
       *  is given, else it returns the interpolated text.
       * @example
       *
       * // using the "interpolate" delimiter to create a compiled template
       * var compiled = _.template('hello <%= name %>');
       * compiled({ 'name': 'moe' });
       * // => 'hello moe'
       *
       * // using the "escape" delimiter to escape HTML in data property values
       * _.template('<b><%- value %></b>', { 'value': '<script>' });
       * // => '<b>&lt;script&gt;</b>'
       *
       * // using the "evaluate" delimiter to generate HTML
       * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
       * _.template(list, { 'people': ['moe', 'larry'] });
       * // => '<li>moe</li><li>larry</li>'
       *
       * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
       * _.template('hello ${ name }', { 'name': 'curly' });
       * // => 'hello curly'
       *
       * // using the internal `print` function in "evaluate" delimiters
       * _.template('<% print("hello " + name); %>!', { 'name': 'larry' });
       * // => 'hello larry!'
       *
       * // using a custom template delimiters
       * _.templateSettings = {
       *   'interpolate': /{{([\s\S]+?)}}/g
       * };
       *
       * _.template('hello {{ name }}!', { 'name': 'mustache' });
       * // => 'hello mustache!'
       *
       * // using the `imports` option to import jQuery
       * var list = '<% $.each(people, function(name) { %><li><%- name %></li><% }); %>';
       * _.template(list, { 'people': ['moe', 'larry'] }, { 'imports': { '$': jQuery } });
       * // => '<li>moe</li><li>larry</li>'
       *
       * // using the `sourceURL` option to specify a custom sourceURL for the template
       * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
       * compiled(data);
       * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
       *
       * // using the `variable` option to ensure a with-statement isn't used in the compiled template
       * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
       * compiled.source;
       * // => function(data) {
       *   var __t, __p = '', __e = _.escape;
       *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
       *   return __p;
       * }
       *
       * // using the `source` property to inline compiled templates for meaningful
       * // line numbers in error messages and a stack trace
       * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
       *   var JST = {\
       *     "main": ' + _.template(mainText).source + '\
       *   };\
       * ');
       */
      function template(text, data, options) {
        // based on John Resig's `tmpl` implementation
        // http://ejohn.org/blog/javascript-micro-templating/
        // and Laura Doktorova's doT.js
        // https://github.com/olado/doT
        var settings = lodash.templateSettings;
        text || (text = '');

        // avoid missing dependencies when `iteratorTemplate` is not defined
        options = defaults({}, options, settings);

        var imports = defaults({}, options.imports, settings.imports),
            importsKeys = keys(imports),
            importsValues = values(imports);

        var isEvaluating,
            index = 0,
            interpolate = options.interpolate || reNoMatch,
            source = "__p += '";

        // compile the regexp to match each delimiter
        var reDelimiters = RegExp(
          (options.escape || reNoMatch).source + '|' +
          interpolate.source + '|' +
          (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
          (options.evaluate || reNoMatch).source + '|$'
        , 'g');

        text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
          interpolateValue || (interpolateValue = esTemplateValue);

          // escape characters that cannot be included in string literals
          source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

          // replace delimiters with snippets
          if (escapeValue) {
            source += "' +\n__e(" + escapeValue + ") +\n'";
          }
          if (evaluateValue) {
            isEvaluating = true;
            source += "';\n" + evaluateValue + ";\n__p += '";
          }
          if (interpolateValue) {
            source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
          }
          index = offset + match.length;

          // the JS engine embedded in Adobe products requires returning the `match`
          // string in order to produce the correct `offset` value
          return match;
        });

        source += "';\n";

        // if `variable` is not specified, wrap a with-statement around the generated
        // code to add the data object to the top of the scope chain
        var variable = options.variable,
            hasVariable = variable;

        if (!hasVariable) {
          variable = 'obj';
          source = 'with (' + variable + ') {\n' + source + '\n}\n';
        }
        // cleanup code by stripping empty strings
        source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
          .replace(reEmptyStringMiddle, '$1')
          .replace(reEmptyStringTrailing, '$1;');

        // frame code as the function body
        source = 'function(' + variable + ') {\n' +
          (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
          "var __t, __p = '', __e = _.escape" +
          (isEvaluating
            ? ', __j = Array.prototype.join;\n' +
              "function print() { __p += __j.call(arguments, '') }\n"
            : ';\n'
          ) +
          source +
          'return __p\n}';

        // Use a sourceURL for easier debugging.
        // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
        var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

        try {
          var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
        } catch(e) {
          e.source = source;
          throw e;
        }
        if (data) {
          return result(data);
        }
        // provide the compiled function's source by its `toString` method, in
        // supported environments, or the `source` property as a convenience for
        // inlining compiled templates during the build process
        result.source = source;
        return result;
      }

      /**
       * Executes the callback `n` times, returning an array of the results
       * of each callback execution. The callback is bound to `thisArg` and invoked
       * with one argument; (index).
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {number} n The number of times to execute the callback.
       * @param {Function} callback The function called per iteration.
       * @param {*} [thisArg] The `this` binding of `callback`.
       * @returns {Array} Returns an array of the results of each `callback` execution.
       * @example
       *
       * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
       * // => [3, 6, 4]
       *
       * _.times(3, function(n) { mage.castSpell(n); });
       * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
       *
       * _.times(3, function(n) { this.cast(n); }, mage);
       * // => also calls `mage.castSpell(n)` three times
       */
      function times(n, callback, thisArg) {
        n = (n = +n) > -1 ? n : 0;
        var index = -1,
            result = Array(n);

        callback = baseCreateCallback(callback, thisArg, 1);
        while (++index < n) {
          result[index] = callback(index);
        }
        return result;
      }

      /**
       * The inverse of `_.escape` this method converts the HTML entities
       * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
       * corresponding characters.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {string} string The string to unescape.
       * @returns {string} Returns the unescaped string.
       * @example
       *
       * _.unescape('Moe, Larry &amp; Curly');
       * // => 'Moe, Larry & Curly'
       */
      function unescape(string) {
        return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
      }

      /**
       * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
       *
       * @static
       * @memberOf _
       * @category Utilities
       * @param {string} [prefix] The value to prefix the ID with.
       * @returns {string} Returns the unique ID.
       * @example
       *
       * _.uniqueId('contact_');
       * // => 'contact_104'
       *
       * _.uniqueId();
       * // => '105'
       */
      function uniqueId(prefix) {
        var id = ++idCounter;
        return String(prefix == null ? '' : prefix) + id;
      }

      /*--------------------------------------------------------------------------*/

      /**
       * Creates a `lodash` object that wraps the given value.
       *
       * @static
       * @memberOf _
       * @category Chaining
       * @param {*} value The value to wrap.
       * @returns {Object} Returns the wrapper object.
       * @example
       *
       * var stooges = [
       *   { 'name': 'moe', 'age': 40 },
       *   { 'name': 'larry', 'age': 50 },
       *   { 'name': 'curly', 'age': 60 }
       * ];
       *
       * var youngest = _.chain(stooges)
       *     .sortBy(function(stooge) { return stooge.age; })
       *     .map(function(stooge) { return stooge.name + ' is ' + stooge.age; })
       *     .first();
       * // => 'moe is 40'
       */
      function chain(value) {
        value = new lodashWrapper(value);
        value.__chain__ = true;
        return value;
      }

      /**
       * Invokes `interceptor` with the `value` as the first argument and then
       * returns `value`. The purpose of this method is to "tap into" a method
       * chain in order to perform operations on intermediate results within
       * the chain.
       *
       * @static
       * @memberOf _
       * @category Chaining
       * @param {*} value The value to provide to `interceptor`.
       * @param {Function} interceptor The function to invoke.
       * @returns {*} Returns `value`.
       * @example
       *
       * _([1, 2, 3, 4])
       *  .filter(function(num) { return num % 2 == 0; })
       *  .tap(function(array) { console.log(array); })
       *  .map(function(num) { return num * num; })
       *  .value();
       * // => // [2, 4] (logged)
       * // => [4, 16]
       */
      function tap(value, interceptor) {
        interceptor(value);
        return value;
      }

      /**
       * Enables method chaining on the wrapper object.
       *
       * @name chain
       * @memberOf _
       * @category Chaining
       * @returns {*} Returns the wrapper object.
       * @example
       *
       * var sum = _([1, 2, 3])
       *     .chain()
       *     .reduce(function(sum, num) { return sum + num; })
       *     .value()
       * // => 6`
       */
      function wrapperChain() {
        this.__chain__ = true;
        return this;
      }

      /**
       * Produces the `toString` result of the wrapped value.
       *
       * @name toString
       * @memberOf _
       * @category Chaining
       * @returns {string} Returns the string result.
       * @example
       *
       * _([1, 2, 3]).toString();
       * // => '1,2,3'
       */
      function wrapperToString() {
        return String(this.__wrapped__);
      }

      /**
       * Extracts the wrapped value.
       *
       * @name valueOf
       * @memberOf _
       * @alias value
       * @category Chaining
       * @returns {*} Returns the wrapped value.
       * @example
       *
       * _([1, 2, 3]).valueOf();
       * // => [1, 2, 3]
       */
      function wrapperValueOf() {
        return this.__wrapped__;
      }

      /*--------------------------------------------------------------------------*/

      // add functions that return wrapped values when chaining
      lodash.after = after;
      lodash.assign = assign;
      lodash.at = at;
      lodash.bind = bind;
      lodash.bindAll = bindAll;
      lodash.bindKey = bindKey;
      lodash.chain = chain;
      lodash.compact = compact;
      lodash.compose = compose;
      lodash.countBy = countBy;
      lodash.createCallback = createCallback;
      lodash.curry = curry;
      lodash.debounce = debounce;
      lodash.defaults = defaults;
      lodash.defer = defer;
      lodash.delay = delay;
      lodash.difference = difference;
      lodash.filter = filter;
      lodash.flatten = flatten;
      lodash.forEach = forEach;
      lodash.forEachRight = forEachRight;
      lodash.forIn = forIn;
      lodash.forInRight = forInRight;
      lodash.forOwn = forOwn;
      lodash.forOwnRight = forOwnRight;
      lodash.functions = functions;
      lodash.groupBy = groupBy;
      lodash.indexBy = indexBy;
      lodash.initial = initial;
      lodash.intersection = intersection;
      lodash.invert = invert;
      lodash.invoke = invoke;
      lodash.keys = keys;
      lodash.map = map;
      lodash.max = max;
      lodash.memoize = memoize;
      lodash.merge = merge;
      lodash.min = min;
      lodash.omit = omit;
      lodash.once = once;
      lodash.pairs = pairs;
      lodash.partial = partial;
      lodash.partialRight = partialRight;
      lodash.pick = pick;
      lodash.pluck = pluck;
      lodash.pull = pull;
      lodash.range = range;
      lodash.reject = reject;
      lodash.remove = remove;
      lodash.rest = rest;
      lodash.shuffle = shuffle;
      lodash.sortBy = sortBy;
      lodash.tap = tap;
      lodash.throttle = throttle;
      lodash.times = times;
      lodash.toArray = toArray;
      lodash.transform = transform;
      lodash.union = union;
      lodash.uniq = uniq;
      lodash.values = values;
      lodash.where = where;
      lodash.without = without;
      lodash.wrap = wrap;
      lodash.zip = zip;
      lodash.zipObject = zipObject;

      // add aliases
      lodash.collect = map;
      lodash.drop = rest;
      lodash.each = forEach;
      lodash.eachRight = forEachRight;
      lodash.extend = assign;
      lodash.methods = functions;
      lodash.object = zipObject;
      lodash.select = filter;
      lodash.tail = rest;
      lodash.unique = uniq;
      lodash.unzip = zip;

      // add functions to `lodash.prototype`
      mixin(lodash);

      /*--------------------------------------------------------------------------*/

      // add functions that return unwrapped values when chaining
      lodash.clone = clone;
      lodash.cloneDeep = cloneDeep;
      lodash.contains = contains;
      lodash.escape = escape;
      lodash.every = every;
      lodash.find = find;
      lodash.findIndex = findIndex;
      lodash.findKey = findKey;
      lodash.findLast = findLast;
      lodash.findLastIndex = findLastIndex;
      lodash.findLastKey = findLastKey;
      lodash.has = has;
      lodash.identity = identity;
      lodash.indexOf = indexOf;
      lodash.isArguments = isArguments;
      lodash.isArray = isArray;
      lodash.isBoolean = isBoolean;
      lodash.isDate = isDate;
      lodash.isElement = isElement;
      lodash.isEmpty = isEmpty;
      lodash.isEqual = isEqual;
      lodash.isFinite = isFinite;
      lodash.isFunction = isFunction;
      lodash.isNaN = isNaN;
      lodash.isNull = isNull;
      lodash.isNumber = isNumber;
      lodash.isObject = isObject;
      lodash.isPlainObject = isPlainObject;
      lodash.isRegExp = isRegExp;
      lodash.isString = isString;
      lodash.isUndefined = isUndefined;
      lodash.lastIndexOf = lastIndexOf;
      lodash.mixin = mixin;
      lodash.noConflict = noConflict;
      lodash.parseInt = parseInt;
      lodash.random = random;
      lodash.reduce = reduce;
      lodash.reduceRight = reduceRight;
      lodash.result = result;
      lodash.runInContext = runInContext;
      lodash.size = size;
      lodash.some = some;
      lodash.sortedIndex = sortedIndex;
      lodash.template = template;
      lodash.unescape = unescape;
      lodash.uniqueId = uniqueId;

      // add aliases
      lodash.all = every;
      lodash.any = some;
      lodash.detect = find;
      lodash.findWhere = find;
      lodash.foldl = reduce;
      lodash.foldr = reduceRight;
      lodash.include = contains;
      lodash.inject = reduce;

      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          lodash.prototype[methodName] = function() {
            var args = [this.__wrapped__],
                chainAll = this.__chain__;

            push.apply(args, arguments);
            var result = func.apply(lodash, args);
            return chainAll
              ? new lodashWrapper(result, chainAll)
              : result;
          };
        }
      });

      /*--------------------------------------------------------------------------*/

      // add functions capable of returning wrapped and unwrapped values when chaining
      lodash.first = first;
      lodash.last = last;
      lodash.sample = sample;

      // add aliases
      lodash.take = first;
      lodash.head = first;

      forOwn(lodash, function(func, methodName) {
        var callbackable = methodName !== 'sample';
        if (!lodash.prototype[methodName]) {
          lodash.prototype[methodName]= function(n, guard) {
            var chainAll = this.__chain__,
                result = func(this.__wrapped__, n, guard);

            return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
              ? result
              : new lodashWrapper(result, chainAll);
          };
        }
      });

      /*--------------------------------------------------------------------------*/

      /**
       * The semantic version number.
       *
       * @static
       * @memberOf _
       * @type string
       */
      lodash.VERSION = '2.1.0';

      // add "Chaining" functions to the wrapper
      lodash.prototype.chain = wrapperChain;
      lodash.prototype.toString = wrapperToString;
      lodash.prototype.value = wrapperValueOf;
      lodash.prototype.valueOf = wrapperValueOf;

      // add `Array` functions that return unwrapped values
      forEach(['join', 'pop', 'shift'], function(methodName) {
        var func = arrayRef[methodName];
        lodash.prototype[methodName] = function() {
          var chainAll = this.__chain__,
              result = func.apply(this.__wrapped__, arguments);

          return chainAll
            ? new lodashWrapper(result, chainAll)
            : result;
        };
      });

      // add `Array` functions that return the wrapped value
      forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
        var func = arrayRef[methodName];
        lodash.prototype[methodName] = function() {
          func.apply(this.__wrapped__, arguments);
          return this;
        };
      });

      // add `Array` functions that return new wrapped values
      forEach(['concat', 'slice', 'splice'], function(methodName) {
        var func = arrayRef[methodName];
        lodash.prototype[methodName] = function() {
          return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
        };
      });

      return lodash;
    }

    /*--------------------------------------------------------------------------*/

    // expose Lo-Dash
    var _ = runInContext();

    // some AMD build optimizers, like r.js, check for condition patterns like the following:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      // Expose Lo-Dash to the global object even when an AMD loader is present in
      // case Lo-Dash was injected by a third-party script and not intended to be
      // loaded as a module. The global assignment can be reverted in the Lo-Dash
      // module by its `noConflict()` method.
      root._ = _;

      // define as an anonymous module so, through path mapping, it can be
      // referenced as the "underscore" module
      define(function() {
        return _;
      });
    }
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
    else if (freeExports && freeModule) {
      // in Node.js or RingoJS
      if (moduleExports) {
        (freeModule.exports = _)._ = _;
      }
      // in Narwhal or Rhino -require
      else {
        freeExports._ = _;
      }
    }
    else {
      // in a browser or Rhino
      root._ = _;
    }
  }.call(this));

  if (typeof provide == "function") provide("lodash", module.exports);
  $.ender(module.exports);
}());

(function () {

  var module = { exports: {} }, exports = module.exports;


  /*!
   * oatmeal - copyright (c) Nathan McWilliams 2013
   * https://github.com/endium/oatmeal
   * MIT license
  */


  (function() {
    'use strict';
    var bake, cookie, cookieJar, decode, encode, get, getSource, munch, munchMunch, oatmeal, oatmealNode, refillJar, serialize, set, setSource, source,
      __hasProp = {}.hasOwnProperty;

    cookieJar = null;

    source = null;

    /*
    Gets the specified source containing the cookie string, or document.cookie if not set.
    @returns a string containing the cookies to parse or null if not available.
    */


    getSource = function() {
      return source || (typeof document !== "undefined" && document !== null ? document.cookie : void 0) || '';
    };

    /*
    Specifies the specific string to parse for cookies.
    @param {String} src The properly formatted string containing the cookies.
    */


    setSource = function(src) {
      source = src;
      return refillJar();
    };

    /*
    Encodes a cookie value and converts it to a JSON string.
    @param {Object|Number|Boolean|String} value The value to encode.
    */


    encode = function(value) {
      return encodeURIComponent(JSON.stringify(value));
    };

    /*
    Decodes a cookie value. If the original value was a boolean, string or number
    then that's what will be returned. Otherwise if it was an object then the object
    will be returned.
  
    @param {String} the JSON/URI encoded value
    */


    decode = function(value) {
      return JSON.parse(decodeURIComponent(value));
    };

    /*
    Gets a cookie value by name.
  
    @param {String} name The name of the cookie to retrieve.
    */


    get = function(name) {
      return (cookieJar != null ? cookieJar : cookieJar = refillJar())[name];
    };

    /*
    Saves a cookie to document.cookie.
  
    This is for use in the browser only. The value will always be encoded and JSON-stringified.
  
    The cookies cache will automatically be updated after setting the cookie.
  
    @param {String} name The name of the cookie to save.
    @param {String|Boolean|Number|Object} value The value of the cookie. This can be a full blown object
                                                to be JSONified, or a simple scalar value as well.
    @param {Object} [options] Optional configuration options. See the #cookie method for detailed list.
    */


    set = function(name, value, options) {
      document.cookie = bake(name, value, options);
      return refillJar();
    };

    /*
    Reads and parses the cookies from getSource() and caches the results to an object map.
    Under normal operations you will not need to call this explicitly. However you may need
    to if you respecify the source.
    */


    refillJar = function() {
      var cookie, pair, _i, _len, _ref;
      cookieJar = {};
      if (!getSource()) {
        return cookieJar;
      }
      _ref = getSource().split(/;\s*/g);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cookie = _ref[_i];
        pair = cookie.split('=');
        cookieJar[pair[0]] = decode(pair[1]);
      }
      return cookieJar;
    };

    /*
    Constructs a properly formatted cookie string using the given information.
    Use this method instead of #cookie(name, value, options) if you want the raw
    cookie string back instead of automatically setting document.cookie.
  
    The value will always be encoded and JSON-stringified.
  
    @param {String} name The name of the cookie to save.
    @param {String|Boolean|Number|Object} value The value of the cookie. This can be a full blown object
                                                to be JSONified, or a simple scalar value as well.
    @param {Object} [options] Optional configuration options. See the #cookie method for detailed list.
  
    @returns The properly formatted cookie string, e.g, 'name=value; path=/'
    */


    bake = function(name, value, options) {
      var date, domain, expires, length, path, secure;
      if (options == null) {
        options = {};
      }
      date = options.expires || new Date();
      length = 0;
      if (options.seconds) {
        length += 1000 * options.seconds;
      }
      if (options.minutes) {
        length += 1000 * 60 * options.minutes;
      }
      if (options.hours) {
        length += 1000 * 60 * 60 * options.hours;
      }
      if (options.days) {
        length += 1000 * 60 * 60 * 24 * options.days;
      }
      if (options.months) {
        length += 1000 * 60 * 60 * 24 * 30 * options.months;
      }
      if (options.years) {
        length += 1000 * 60 * 60 * 24 * 365 * options.years;
      }
      date.setTime(date.getTime() + length);
      path = serialize('path', options.path || '/');
      domain = serialize('domain', options.domain);
      secure = serialize('secure', options.secure);
      expires = serialize('expires', options.expires || length !== 0 ? date.toUTCString() : null);
      return "" + name + "=" + (encode(value)) + expires + path + domain + secure;
    };

    /*
    Helper method to construct the cookie string.
  
    @param {String} name Name of the item.
    @param {Boolean|String|Number} value The value of the item.
  
    @returns if value is not present, an empty string. If value is boolean true, then
    just a string containing the name. Otherwise a string in the format of 'name=value'.
    */


    serialize = function(name, value) {
      if ((value == null) || value === false) {
        return '';
      }
      if (value === true) {
        return "; " + name;
      } else {
        return "; " + name + "=" + value;
      }
    };

    /*
    Deletes a cookie.
  
    @param {String} name Name of the cookie to delete.
    */


    munch = function(name) {
      return set(name, '', {
        days: -1
      });
    };

    /*
    Deletes all cookies
    */


    munchMunch = function() {
      var cookie;
      refillJar();
      for (cookie in cookieJar) {
        if (!__hasProp.call(cookieJar, cookie)) continue;
        munch(cookie);
      }
    };

    /*
    Main entry point for reading and writing cookies.
  
    if the 'name' parameter alone is specified then the cookie's value will be returned.
    If both the 'name' and 'value' parameters are specified, this will set the cookie's value.
  
    The cookie value will always be encoded and JSONified. This means you can pass in full JSON
    compatible objects as the cookie value. When the cookie is read later, it will be decoded from JSON
    back into the object.
  
    You can also pass in several options, as described below.
  
    Note that the time lengths are cumulative. More than one can be specified, and they will be added on
    to either options.expires (if specified) or the current time.
  
    @param {String} name The name of the cookie to read or write.
    @param {String|Boolean|Number|Object} value The value of the cookie to write. This value will be JSONified.
    @param {Object} [options] Object containing futher options.
    @param {String} [options.domain] Specify the domain of the cookie.
    @param {Boolean} [options.secure] Specify that the cookie is secure.
    @param {Date} [options.expires] Specify a Date object for when the cookie should expire.
    @param {Number} [options.seconds] Specify additional seconds to add to optional.expires or the current time.
    @param {Number} [options.minutes] Specify additional minutes to add to optional.expires or the current time.
    @param {Number} [options.hours] Specify additional hours to add to optional.expires or the current time.
    @param {Number} [options.days] Specify additional days to add to optional.expires or the current time.
    @param {Number} [options.months] Specify additional ~months to add to optional.expires or the current time.
    @param {Number} [options.years] Specify additional ~years to add to optional.expires or the current time.
    */


    cookie = function(name, value, options) {
      if (value != null) {
        return set(name, value, options);
      } else {
        return get(name);
      }
    };

    oatmeal = {
      bake: bake,
      munch: munch,
      cookie: cookie,
      source: setSource,
      munchMunch: munchMunch
    };

    oatmealNode = {
      bake: bake,
      cookie: get,
      source: setSource
    };

    if (typeof process !== "undefined" && process !== null ? process.pid : void 0) {
      module.exports = oatmealNode;
    } else {
      if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
        module.exports = oatmeal;
      } else {
        window.oatmeal = oatmeal;
      }
    }

  }).call(this);

  if (typeof provide == "function") provide("oatmeal", module.exports);


  /*
  integration with Ender (ender.jit.su)
  */


  (function() {
    'use strict';
    var oatmeal;

    oatmeal = require('oatmeal');

    $.ender({
      cookie: oatmeal.cookie,
      deleteCookie: oatmeal.munch,
      deleteCookies: oatmeal.munchMunch,
      serializeCookie: oatmeal.bake,
      useCookieSource: oatmeal.source
    });

  }).call(this);

}());