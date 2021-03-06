'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/////////////////////////////////////////////////////////////////////////
//    _____                       _   _     _____                _ _   //
//   /  ___|                     | | | |   /  ___|              | | |  //
//   \ `--. _ __ ___   ___   ___ | |_| |__ \ `--.  ___ _ __ ___ | | |  //
//    `--. \ '_ ` _ \ / _ \ / _ \| __| '_ \ `--. \/ __| '__/ _ \| | |  //
//   /\__/ / | | | | | (_) | (_) | |_| | | /\__/ / (__| | | (_) | | |  //
//   \____/|_| |_| |_|\___/ \___/ \__|_| |_\____/ \___|_|  \___/|_|_|  //
//                                                                     //
/////////////////////////////////////////////////////////////////////////

// SmoothScroll for websites v1.5.0 (Balazs Galambosi (https://www.smoothscroll.net))
// http://www.smoothscroll.net/
//
// Licensed under the terms of the MIT license.
//
// You may use it in your theme if you credit me.
// It is also free to use on any individual website.
//
// Exception:
// The only restriction is to not publish any 
// extension for browsers or native application
// without getting a written permission first.

/////////////////////////////////////////////////////////////////////////

// Self invoking -- calls itself with any public API options
// Should bind to onload
(function () {

    ////////////////////////////////////////////
    // Defs
    ////////////////////////////////////////////

    // NAME
    var NAME = 'SmoothScroll';

    // VERSION
    var VERSION = '1.5.0';

    // Defaults (CONST)
    var DEFAULTS = {

        // General
        debug: false, // Debug mode (for logs)

        // Scrolling Core
        frameRate: 150, // [Hz]
        animationTime: 400, // [ms]
        stepSize: 100, // [px]

        // Pulse (less tweakable)
        // ratio of "tail" to "acceleration"
        pulseAlgorithm: true,
        pulseScale: 4,
        pulseNormalize: 1,

        // Acceleration
        accelerationDelta: 50, // 50
        accelerationMax: 3, // 3

        // Keyboard Settings
        keyboardSupport: true, // option
        arrowScroll: 50, // [px]

        // Other
        touchpadSupport: false, // ignore touchpad by default
        fixedBackground: true,
        excluded: ''
    };

    //Keys
    var KEY = { left: 37, up: 38, right: 39, down: 40, spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36 };
    var ARROWKEYS = { 37: 1, 38: 1, 39: 1, 40: 1 };

    //Misc
    var ROOT = document.documentElement;

    ////////////////////////////////////////////
    // Setup
    ////////////////////////////////////////////

    // Classify

    var SmoothScroll = function () {

        // Global Vars //

        // isExcluded
        // wheelEvent
        // initDone
        // isFrame
        // activeElement
        // observer
        // refreshSize
        // deltabuffer =[]
        // deltaBufferTimer
        // direction = { x: 0, y: 0 }
        // pending

        // Constructor

        function SmoothScroll(config) {
            _classCallCheck(this, SmoothScroll);

            // Object.assign == Jquery.extend
            // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
            // Values on right take precedence
            this.options = Object.assign(DEFAULTS, config); // instance.options

            // DeltaBuffer
            this.deltaBuffer = [];
            if (window.localStorage && localStorage.SS_deltaBuffer) {
                this.deltaBuffer = localStorage.SS_deltaBuffer.split(',');
            }

            this.que = [];
            this.lastScroll = Date.now();

            this.direction = { x: 0, y: 0 };

            this.cache = {};

            // Init
            this.init();
        }

        //////////////////////////////////

        // Defs
        // Static methods not callable from instances -- only as class methods
        // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes#Static_methods

        // Name


        _createClass(SmoothScroll, [{
            key: 'init',


            //////////////////////////////////
            //////////////////////////////////

            // Private Methods

            //////////////////////////////////
            //////////////////////////////////

            // Init
            // First run -- binds methods to events
            value: function init() {

                // Log
                this.options.debug && console.log(NAME + " : Initializing Instance (Binding Events)");

                // Check if should implement
                if ('onwheel' in document.createElement('div')) this.wheelEvent = 'wheel';else if ('onmousewheel' in document.createElement('div')) this.wheelEvent = 'mousewheel';

                // Only run if browser is valid
                if (this.wheelEvent && this.constructor.BROWSER) {
                    var self = this; // http://stackoverflow.com/a/3856177/1143732
                    this.setEvent('add', this.wheelEvent, function (e) {
                        self.wheel(e);
                    }); // On wheel event, set wheel method
                    this.setEvent('add', 'mousedown', function (e) {
                        self.mousedown(e);
                    }); // On mouse down, set mousedown method
                    this.setEvent('add', 'load', function (e) {
                        self.load;
                    }); // On page load, invoke init method
                }
            }

            ///////////////////////////////
            //         EVENTS            //
            ///////////////////////////////

            // Wheel
            // When the wheel is invoked, it will perform the following

        }, {
            key: 'wheel',
            value: function wheel(event) {

                // Log
                this.options.debug && console.log(this.constructor.name + " : Wheel Event");

                // Loaded?
                !this.initDone && this.load;

                var target = event.target;
                var overflowing = this.overflowingAncestor(target);

                // use default if there's no overflowing
                // element or default action is prevented  
                // or it's a zooming event with CTRL
                //if (!overflowing || event.defaultPrevented || event.ctrlKey) {
                //    return true;
                //}

                // leave embedded content alone (flash & pdf)
                if (this.isNodeName(this.activeElement, 'embed') || this.isNodeName(target, 'embed') && /\.pdf/i.test(target.src) || this.isNodeName(this.activeElement, 'object') || target.shadowRoot) {
                    return true;
                }

                var deltaX = -event.wheelDeltaX || event.deltaX || 0;
                var deltaY = -event.wheelDeltaY || event.deltaY || 0;

                if (this.constructor.isMac) {
                    if (event.wheelDeltaX && isDivisible(event.wheelDeltaX, 120)) {
                        deltaX = -120 * (event.wheelDeltaX / Math.abs(event.wheelDeltaX));
                    }
                    if (event.wheelDeltaY && isDivisible(event.wheelDeltaY, 120)) {
                        deltaY = -120 * (event.wheelDeltaY / Math.abs(event.wheelDeltaY));
                    }
                }

                // use wheelDelta if deltaX/Y is not available
                if (!deltaX && !deltaY) {
                    deltaY = -event.wheelDelta || 0;
                }

                // line based scrolling (Firefox mostly)
                if (event.deltaMode === 1) {
                    deltaX *= 40;
                    deltaY *= 40;
                }

                // check if it's a touchpad scroll that should be ignored
                if (!this.options.touchpadSupport && this.isTouchpad(deltaY)) {
                    return true;
                }

                // scale by step size
                // delta is 120 most of the time
                // synaptics seems to send 1 sometimes
                if (Math.abs(deltaX) > 1.2) {
                    deltaX *= this.options.stepSize / 120;
                }
                if (Math.abs(deltaY) > 1.2) {
                    deltaY *= this.options.stepSize / 120;
                }

                this.scrollArray(overflowing, deltaX, deltaY);
                event.preventDefault();
                this.scheduleClearCache();
            }

            //KeyDown

        }, {
            key: 'keydown',
            value: function keydown(event) {

                // Log
                this.options.debug && console.log(this.constructor.name + " : Keydown Event");

                //Constants
                var key = this.constructor.KEY;
                var arrowkeys = this.constructor.ARROWKEYS;

                //Vars
                var target = event.target;
                var modifier = event.ctrlKey || event.altKey || event.metaKey || event.shiftKey && event.keyCode !== key.spacebar;

                // our own tracked active element could've been removed from the DOM
                if (!document.body.contains(this.activeElement)) this.activeElement = document.activeElement;

                // do nothing if user is editing text
                // or using a modifier key (except shift)
                // or in a dropdown
                // or inside interactive elements
                var inputNodeNames = /^(textarea|select|embed|object)$/i;
                var buttonTypes = /^(button|submit|radio|checkbox|file|color|image)$/i;
                if (event.defaultPrevented || inputNodeNames.test(target.nodeName) || this.isNodeName(target, 'input') && !buttonTypes.test(target.type) || this.isNodeName(this.activeElement, 'video') || this.isInsideYoutubeVideo(event) || target.isContentEditable || modifier) {
                    return true;
                }

                // [spacebar] should trigger button press, leave it alone
                if ((this.isNodeName(target, 'button') || this.isNodeName(target, 'input') && buttonTypes.test(target.type)) && event.keyCode === key.spacebar) {
                    return true;
                }

                // [arrwow keys] on radio buttons should be left alone
                if (this.isNodeName(target, 'input') && target.type == 'radio' && arrowkeys[event.keyCode]) {
                    return true;
                }

                var shift,
                    x = 0,
                    y = 0;
                var elem = this.overflowingAncestor(this.activeElement);
                var clientHeight = elem.clientHeight;

                if (elem == document.body) clientHeight = window.innerHeight;

                switch (event.keyCode) {
                    case key.up:
                        y = -this.options.arrowScroll;
                        break;
                    case key.down:
                        y = this.options.arrowScroll;
                        break;
                    case key.spacebar:
                        // (+ shift)
                        shift = event.shiftKey ? 1 : -1;
                        y = -shift * clientHeight * 0.9;
                        break;
                    case key.pageup:
                        y = -clientHeight * 0.9;
                        break;
                    case key.pagedown:
                        y = clientHeight * 0.9;
                        break;
                    case key.home:
                        y = -elem.scrollTop;
                        break;
                    case key.end:
                        var damt = elem.scrollHeight - elem.scrollTop - clientHeight;
                        y = damt > 0 ? damt + 10 : 0;
                        break;
                    case key.left:
                        x = -this.options.arrowScroll;
                        break;
                    case key.right:
                        x = this.options.arrowScroll;
                        break;
                    default:
                        return true; // a key we don't care about
                }

                this.scrollArray(elem, x, y);
                event.preventDefault();
                this.scheduleClearCache();
            }

            // Mousedown -- only for updating activeElement

        }, {
            key: 'mousedown',
            value: function mousedown(event) {

                // Log
                this.options.debug && console.log(this.constructor.name + " : Mousedown Event");

                // Set value of class var
                this.activeElement = event.target;
            }

            //////////////////////////////////
            //////////////////////////////////

            // Helpers

            //////////////////////////////////
            //////////////////////////////////

            //initTest

        }, {
            key: 'initTest',
            value: function initTest() {
                if (this.options.keyboardSupport) var self = this;
                this.setEvent('add', 'keydown', function (e) {
                    self.keydown(e);
                });
            }

            //nodeName

        }, {
            key: 'isNodeName',
            value: function isNodeName(el, tag) {
                return (el.nodeName || '').toLowerCase() === tag.toLowerCase();
            }

            // Set Events

        }, {
            key: 'setEvent',
            value: function setEvent(type, event, func) {
                if (type == "add") window.addEventListener(event, func, false);else if (type == "remove") window.removeEventListener(event, func, false);
            }

            // RequestFrame

        }, {
            key: 'requestFrame',
            value: function requestFrame(callback, element, delay) {
                window.setTimeout(callback, delay || 1000 / 60);
            }

            // Direction Check

        }, {
            key: 'directionCheck',
            value: function directionCheck(x, y) {
                x = x > 0 ? 1 : -1;
                y = y > 0 ? 1 : -1;
                if (this.direction.x !== x || this.direction.y !== y) {
                    this.direction.x = x;
                    this.direction.y = y;
                    this.que = [];
                    this.lastScroll = 0;
                }
            }

            //Touchpad

        }, {
            key: 'isTouchpad',
            value: function isTouchpad(deltaY) {
                if (!deltaY) return;
                if (!this.deltaBuffer.length) {
                    this.deltaBuffer = [deltaY, deltaY, deltaY];
                }
                deltaY = Math.abs(deltaY);
                this.deltaBuffer.push(deltaY);
                this.deltaBuffer.shift();
                clearTimeout(this.deltaBufferTimer);

                var self = this;
                this.deltaBufferTimer = setTimeout(function () {
                    if (window.localStorage) {
                        localStorage.SS_deltaBuffer = self.deltaBuffer.join(',');
                    }
                }, 1000);
                return !this.allDeltasDivisableBy(120) && !this.allDeltasDivisableBy(100);
            }

            //Indivisiable

        }, {
            key: 'isDivisible',
            value: function isDivisible(n, divisor) {
                return Math.floor(n / divisor) == n / divisor;
            }

            // Divisible

        }, {
            key: 'allDeltasDivisableBy',
            value: function allDeltasDivisableBy(divisor) {
                return this.isDivisible(this.deltaBuffer[0], divisor) && this.isDivisible(this.deltaBuffer[1], divisor) && this.isDivisible(this.deltaBuffer[2], divisor);
            }

            // Youtube?

        }, {
            key: 'isInsideYoutubeVideo',
            value: function isInsideYoutubeVideo(event) {
                var elem = event.target;
                var isControl = false;
                if (document.URL.indexOf('www.youtube.com/watch') != -1) {
                    do {
                        isControl = elem.classList && elem.classList.contains('html5-video-controls');
                        if (isControl) break;
                    } while (elem = elem.parentNode);
                }
                return isControl;
            }

            /////////////

            // Scrolling

        }, {
            key: 'scrollArray',
            value: function scrollArray(elem, left, top) {

                // Log
                this.options.debug && console.log(this.constructor.NAME + " : Functionality");

                // Scroll Direction
                this.directionCheck(left, top);

                if (this.options.accelerationMax != 1) {
                    var now = Date.now();
                    var elapsed = now - this.lastScroll;
                    if (elapsed < this.options.accelerationDelta) {
                        var factor = (1 + 50 / elapsed) / 2;
                        if (factor > 1) {
                            factor = Math.min(factor, this.options.accelerationMax);
                            left *= factor;
                            top *= factor;
                        }
                    }
                    this.lastScroll = Date.now();
                }

                // push a scroll command
                this.que.push({
                    x: left,
                    y: top,
                    lastX: left < 0 ? 0.99 : -0.99,
                    lastY: top < 0 ? 0.99 : -0.99,
                    start: Date.now()
                });

                // don't act if there's a pending queue
                if (this.pending) {
                    return;
                }

                var scrollWindow = elem === document.body;

                var self = this;
                var step = function step(time) {

                    var now = Date.now();
                    var scrollX = 0;
                    var scrollY = 0;

                    for (var i = 0; i < self.que.length; i++) {

                        var item = self.que[i];
                        var elapsed = now - item.start;
                        var finished = elapsed >= self.options.animationTime;

                        // scroll position: [0, 1]
                        var position = finished ? 1 : elapsed / self.options.animationTime;

                        // easing [optional]
                        if (self.options.pulseAlgorithm) {
                            position = self.pulse(position);
                        }

                        // only need the difference
                        var x = item.x * position - item.lastX >> 0;
                        var y = item.y * position - item.lastY >> 0;

                        // add this to the total scrolling
                        scrollX += x;
                        scrollY += y;

                        // update last values
                        item.lastX += x;
                        item.lastY += y;

                        // delete and step back if it's over
                        if (finished) {
                            self.que.splice(i, 1);i--;
                        }
                    }

                    // scroll left and top
                    if (scrollWindow) {
                        window.scrollBy(scrollX, scrollY);
                    } else {
                        if (scrollX) elem.scrollLeft += scrollX;
                        if (scrollY) elem.scrollTop += scrollY;
                    }

                    // clean up if there's nothing left to do
                    if (!left && !top) {
                        self.que = [];
                    }

                    if (self.que.length) {
                        self.requestFrame(step, elem, 1000 / self.options.frameRate + 1);
                    } else {
                        self.pending = false;
                    }
                };

                // start a new queue of actions
                this.requestFrame(step, elem, 0);
                this.pending = true;
            }

            ////////////////////////////////////////////
            // OVERFLOW
            ////////////////////////////////////////////

            // Clear Cache

        }, {
            key: 'scheduleClearCache',
            value: function scheduleClearCache() {
                clearTimeout(this.clearCacheTimer);
                this.clearCacheTimer = setInterval(function () {
                    this.cache = {};
                }, 1 * 1000);
            }

            // Set Cache

        }, {
            key: 'setCache',
            value: function setCache(elems, overflowing) {
                for (var i = elems.length; i--;) {
                    this.cache[this.uniqueID(elems[i])] = overflowing;
                }return overflowing;
            }

            //  (body)                (root)
            //         | hidden | visible | scroll |  auto  |
            // hidden  |   no   |    no   |   YES  |   YES  |
            // visible |   no   |   YES   |   YES  |   YES  |
            // scroll  |   no   |   YES   |   YES  |   YES  |
            // auto    |   no   |   YES   |   YES  |   YES  |

            // Overflowing Ancestor

        }, {
            key: 'overflowingAncestor',
            value: function overflowingAncestor(el) {
                var root = this.constructor.ROOT;
                var elems = [];
                var body = document.body;
                var rootScrollHeight = root.scrollHeight;
                do {
                    var cached = this.cache[this.uniqueID(el)];
                    if (cached) {
                        return this.setCache(elems, cached);
                    }
                    elems.push(el);
                    if (rootScrollHeight === el.scrollHeight) {
                        var topOverflowsNotHidden = this.overflowNotHidden(root) && this.overflowNotHidden(body);
                        var isOverflowCSS = topOverflowsNotHidden || this.overflowAutoOrScroll(root);
                        if (this.isFrame && this.isContentOverflowing(root) || !this.isFrame && isOverflowCSS) {
                            return this.setCache(elems, this.constructor.getScrollRoot);
                        }
                    } else if (this.isContentOverflowing(el) && this.overflowAutoOrScroll(el)) {
                        return this.setCache(elems, el);
                    }
                } while (el = el.parentElement);
            }

            // Is Content Overflowing

        }, {
            key: 'isContentOverflowing',
            value: function isContentOverflowing(el) {
                return el.clientHeight + 10 < el.scrollHeight;
            }

            // typically for <body> and <html>

        }, {
            key: 'overflowNotHidden',
            value: function overflowNotHidden(el) {
                var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
                return overflow !== 'hidden';
            }

            // for all other elements

        }, {
            key: 'overflowAutoOrScroll',
            value: function overflowAutoOrScroll(el) {
                var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
                return overflow === 'scroll' || overflow === 'auto';
            }

            // ID

        }, {
            key: 'uniqueID',
            value: function uniqueID(el) {
                var i = 0;
                return function (el) {
                    return el.uniqueID || (el.uniqueID = i++);
                };
            }

            ////////////////////////////////////////////
            // PULSE (By Michael Herf)
            ////////////////////////////////////////////

            // Viscous fluid with a pulse for part and decay for the rest.
            // Applies a fixed force over an interval (a damped acceleration), and
            // Lets the exponential bleed away the velocity over a longer interval
            // Michael Herf, http://stereopsis.com/stopping/

        }, {
            key: 'pulse_',
            value: function pulse_(x) {
                var val, start, expx;
                // test
                x = x * this.options.pulseScale;
                if (x < 1) {
                    // acceleartion
                    val = x - (1 - Math.exp(-x));
                } else {
                    // tail
                    // the previous animation ended here:
                    start = Math.exp(-1);
                    // simple viscous drag
                    x -= 1;
                    expx = 1 - Math.exp(-x);
                    val = start + expx * (1 - start);
                }
                return val * this.options.pulseNormalize;
            }
        }, {
            key: 'pulse',
            value: function pulse(x) {
                if (x >= 1) return 1;
                if (x <= 0) return 0;

                if (this.options.pulseNormalize == 1) {
                    this.options.pulseNormalize /= this.pulse_(1);
                }
                return this.pulse_(x);
            }

            ///////////////////////////////

            // Tie to Public API (so it works without having to call new)
            // To get this working without invocation, set the bottom

        }, {
            key: 'load',


            //////////////////////////////////
            //////////////////////////////////

            // Public Methods

            //////////////////////////////////
            //////////////////////////////////

            // Load
            get: function get() {

                // Log
                this.options.debug && console.log(NAME + " : Load");

                // If no body
                if (this.initDone || !document.body) return;

                this.initDone = true;

                var body = document.body;
                var html = document.documentElement;
                var windowHeight = window.innerHeight;
                var scrollHeight = body.scrollHeight;

                // check compat mode for root element
                var root = document.compatMode.indexOf('CSS') >= 0 ? html : body;
                this.activeElement = body;

                this.initTest();

                // Checks if this script is running in a frame
                if (top != self) this.isFrame = true;

                /**
                 * Please duplicate this radar for a Safari fix! 
                 * rdar://22376037
                 * https://openradar.appspot.com/radar?id=4965070979203072
                 * 
                 * Only applies to Safari now, Chrome fixed it in v45:
                 * This fixes a bug where the areas left and right to 
                 * the content does not trigger the onmousewheel event
                 * on some pages. e.g.: html, body { height: 100% }
                 */
                else if (scrollHeight > windowHeight && (body.offsetHeight <= windowHeight || html.offsetHeight <= windowHeight)) {

                        var fullPageElem = document.createElement('div');
                        fullPageElem.style.cssText = 'position:absolute; z-index:-10000; ' + 'top:0; left:0; right:0; height:' + root.scrollHeight + 'px';
                        document.body.appendChild(fullPageElem);

                        // DOM changed (throttled) to fix height
                        var pendingRefresh;
                        this.refreshSize = function () {
                            if (pendingRefresh) return; // could also be: clearTimeout(pendingRefresh);
                            pendingRefresh = setTimeout(function () {
                                if (this.isExcluded) return; // could be running after cleanup
                                fullPageElem.style.height = '0';
                                fullPageElem.style.height = root.scrollHeight + 'px';
                                pendingRefresh = null;
                            }, 500); // act rarely to stay fast
                        };

                        setTimeout(this.refreshSize, 10);

                        this.setEvent('add', 'resize', this.refreshSize);

                        // TODO: attributeFilter?
                        var config = {
                            attributes: true,
                            childList: true,
                            characterData: false
                            // subtree: true
                        };

                        this.observer = new MutationObserver(this.refreshSize);
                        this.observer.observe(body, config);

                        if (root.offsetHeight <= windowHeight) {
                            var clearfix = document.createElement('div');
                            clearfix.style.clear = 'both';
                            body.appendChild(clearfix);
                        }
                    }

                // disable fixed background
                if (!this.options.fixedBackground && !this.isExcluded) {
                    body.style.backgroundAttachment = 'scroll';
                    html.style.backgroundAttachment = 'scroll';
                }
            }

            // Destroy

        }, {
            key: 'destroy',
            get: function get() {
                // check if bound
                this.options.debug && console.log(NAME + " : Destroying Instance"); // http://stackoverflow.com/a/8860674/1143732

                // Remove bindings
                this.observer && this.observer.disconnect();

                // Remove Bound Events
                var self = this;

                this.setEvent('remove', this.wheelEvent, function (e) {
                    self.wheel(e);
                });
                this.setEvent('remove', 'mousedown', function (e) {
                    self.mousedown(e);
                });
                this.setEvent('remove', 'keydown', function (e) {
                    self.keydown(e);
                });
                this.setEvent('remove', 'resize', function (e) {
                    self.refreshSize();
                });
                this.setEvent('remove', 'load', function (e) {
                    self.load;
                });
            }
        }], [{
            key: '_invoke',
            value: function _invoke(config) {

                //https://github.com/twbs/bootstrap/blob/v4-dev/js/src/tooltip.js#L619
                new SmoothScroll(config);
            }
        }, {
            key: 'NAME',
            get: function get() {
                return NAME;
            }

            // Version

        }, {
            key: 'VERSION',
            get: function get() {
                return VERSION;
            }

            // Defaults

        }, {
            key: 'DEFAULTS',
            get: function get() {
                return DEFAULTS;
            }

            // Key

        }, {
            key: 'KEY',
            get: function get() {
                return KEY;
            }

            // Arrows

        }, {
            key: 'ARROWKEYS',
            get: function get() {
                return ARROWKEYS;
            }

            // Browser

        }, {
            key: 'BROWSER',
            get: function get() {
                var userAgent = window.navigator.userAgent;
                var isEdge = /Edge/.test(userAgent); // thank you MS
                var isChrome = /chrome/i.test(userAgent) && !isEdge;
                var isSafari = /safari/i.test(userAgent) && !isEdge;
                var isMobile = /mobile/i.test(userAgent);
                var isIEWin7 = /Windows NT 6.1/i.test(userAgent) && /rv:11/i.test(userAgent);

                // Return
                return (isChrome || isSafari || isIEWin7) && !isMobile;
            }

            ////////////

            // ROOT

        }, {
            key: 'ROOT',
            get: function get() {
                return ROOT;
            }

            // Mac

        }, {
            key: 'isMac',
            get: function get() {
                return (/^Mac/.test(navigator.platform)
                );
            }

            //MutationObserver
            //Since it's a function, it will not be able to invoke the constructor
            //As such, can should be able to rely on MutationObserver call ( I think )
            //MutationObserver() {
            //    return (window.MutationObserver || window.WebKitMutationObserver ||window.MozMutationObserver);
            //}

            //GetScrollRoot

        }, {
            key: 'getScrollRoot',
            get: function get() {
                var SCROLL_ROOT;
                var data = function () {
                    if (!SCROLL_ROOT) {
                        var dummy = document.createElement('div');
                        dummy.style.cssText = 'height:10000px;width:1px;';
                        document.body.appendChild(dummy);
                        var bodyScrollTop = document.body.scrollTop;
                        var docElScrollTop = document.documentElement.scrollTop;
                        window.scrollBy(0, 3);
                        if (document.body.scrollTop != bodyScrollTop) SCROLL_ROOT = document.body;else SCROLL_ROOT = document.documentElement;
                        window.scrollBy(0, -3);
                        document.body.removeChild(dummy);
                    }
                    return SCROLL_ROOT;
                }();
                return data;
            }
        }]);

        return SmoothScroll;
    }();

    ;

    ////////////////////////////////////////////
    // PUBLIC
    ////////////////////////////////////////////

    //Load on page
    window.SmoothScroll = SmoothScroll._invoke; // This will always be called (allows you to do what you want to invoke)
    window.SmoothScroll.Constructor = SmoothScroll; // This allows you to call the class without having to use "new"

    // Async API
    // If "SmoothScrollOptions" attached to Window
    if (window.SmoothScrollOptions) SmoothScroll._invoke(window.SmoothScrollOptions);

    if (typeof define === 'function' && define.amd) define(function () {
        return SmoothScroll._invoke;
    });else if ('object' == (typeof exports === 'undefined' ? 'undefined' : _typeof(exports))) module.exports = SmoothScroll._invoke;else SmoothScroll._invoke(window.SmoothScrollOptions);
})();

/////////////////////////////////////////////////////////////////////////
//# sourceMappingURL=smoothscroll-for-websites.js.map
