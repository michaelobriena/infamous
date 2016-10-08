import XYZValues from './XYZValues'
import Motor from './Motor'
import Scene from './Scene'
import { makeLowercaseSetterAliases } from './Utility'

// fallback to experimental CSS transform if browser doesn't have it (fix for Safari 9)
if (typeof document.createElement('div').style.transform == 'undefined') {
    Object.defineProperty(CSSStyleDeclaration.prototype, 'transform', {
        set(value) {
            // XXX Might need to proxy to ms for IE11.
            this.webkitTransform = value
        },
        get() {
            return this.webkitTransform
        },
        enumerable: true,
    })
}

var Sizeable

initSizeable()
export function initSizeable() {
    if (Sizeable) return

    console.log('init Sizeable gosh darn it!!!')

    let instanceofSymbol = Symbol('instanceofSymbol')

    const SizeableMixin = base => {
        class Sizeable extends base {

            constructor(options = {}) {
                super(options)

                // Property Cache, with default values
                this._properties = {
                    sizeMode: new XYZValues('absolute', 'absolute', 'absolute'),
                    absoluteSize: new XYZValues(0, 0, 0),
                    proportionalSize: new XYZValues(1, 1, 1),
                };

                // TODO: move this observation in Node. I don't think it belongs here.
                const propertyChange = () => this._needsToBeRendered()
                this._properties.sizeMode.onChanged = propertyChange
                this._properties.absoluteSize.onChanged = propertyChange
                this._properties.proportionalSize.onChanged = propertyChange

                // This line calls the leaf-class `properties` setter, but we want
                // to use the current prototype's `properties` setter, which
                // requires the super long line after this one. XXX Maybe there's a
                // better way to manage this?
                //this.properties = options
                Object.getOwnPropertyDescriptor(Sizeable.prototype, 'properties').set.call(this, options)
            }

            /**
             * Set the size mode for each axis. Possible size modes are "absolute" and "proportional".
             *
             * @param {Object} newValue
             * @param {number} [newValue.x] The x-axis sizeMode to apply.
             * @param {number} [newValue.y] The y-axis sizeMode to apply.
             * @param {number} [newValue.z] The z-axis sizeMode to apply.
             */
            set sizeMode(newValue) {
                if (!(newValue instanceof Object))
                    throw new TypeError('Invalid value for Node#sizeMode.')

                if (typeof newValue.x != 'undefined') this._properties.sizeMode._x = newValue.x
                if (typeof newValue.y != 'undefined') this._properties.sizeMode._y = newValue.y
                if (typeof newValue.z != 'undefined') this._properties.sizeMode._z = newValue.z

                this._needsToBeRendered()
            }
            get sizeMode() {
                return this._properties.sizeMode
            }

            /**
             * @param {Object} newValue
             * @param {number} [newValue.x] The x-axis absoluteSize to apply.
             * @param {number} [newValue.y] The y-axis absoluteSize to apply.
             * @param {number} [newValue.z] The z-axis absoluteSize to apply.
             */
            set absoluteSize(newValue) {
                if (!(newValue instanceof Object))
                    throw new TypeError('Invalid value for Node#absoluteSize.')

                if (typeof newValue.x != 'undefined') this._properties.absoluteSize._x = newValue.x
                if (typeof newValue.y != 'undefined') this._properties.absoluteSize._y = newValue.y
                if (typeof newValue.z != 'undefined') this._properties.absoluteSize._z = newValue.z

                this._needsToBeRendered()
            }
            get absoluteSize() {
                return this._properties.absoluteSize
            }

            /**
             * Get the actual size of the Node. This can be useful when size is
             * proportional, as the actual size of the Node depends on querying the DOM
             * for the size of the Node's DOM element relative to it's parent.
             *
             * @readonly
             *
             * @return {Array.number} An Oject with x, y, and z properties, each
             * property representing the computed size of the x, y, and z axes
             * respectively.
             *
             * TODO: Avoid getComputedStyle and traverse up the tree to find parent
             * size when this Node's size is proportional. Ultimately we rely on
             * the size of the scene.
             *
             * TODO: this couples the Sizeable class to the Scene and TreeNode
             * classes. How can we organize this code better?  This Sizeable
             * class is coupled to the TreeNode class because it traverses to
             * the parent of the current node when size is proportional. Maybe
             * it needs to extend TreeNode explicitly?
             */
            get actualSize() {
                const actualSize = { x:null, y:null, z:null }
                let parentSize = null

                const calcProportionalSize = (axis) => {
                    if (this instanceof Scene) {
                        actualSize[axis] = this._calculatedSize[axis]
                    }
                    else {
                        if (this._parent) {
                            if (!parentSize) parentSize = this._parent.actualSize
                            if (parentSize[axis] !== null)
                                actualSize[axis] = this._properties.proportionalSize[axis] * parentSize[axis]
                        }
                    }
                }

                if (this._properties.sizeMode.x === 'absolute') {
                    actualSize.x = this._properties.absoluteSize.x
                }
                else if (this._properties.sizeMode.x === 'proportional') {
                    calcProportionalSize('x')
                }

                if (this._properties.sizeMode.y === 'absolute') {
                    actualSize.y = this._properties.absoluteSize.y
                }
                else if (this._properties.sizeMode.y === 'proportional') {
                    calcProportionalSize('y')
                }

                if (this._properties.sizeMode.z === 'absolute') {
                    actualSize.z = this._properties.absoluteSize.z
                }
                else if (this._properties.sizeMode.z === 'proportional') {
                    // TODO: Z sizing. We haven't really worried about it because
                    // DOM elements are flat. We'll need it for WebGL.
                    //calcProportionalSize('z')
                    actualSize.z = 0
                }

                return actualSize
            }

            /**
             * Set the size of a Node proportional to the size of it's parent Node. The
             * values are a real number between 0 and 1 inclusive where 0 means 0% of
             * the parent size and 1 means 100% of the parent size.
             *
             * @param {Object} newValue
             * @param {number} [newValue.x] The x-axis proportionalSize to apply.
             * @param {number} [newValue.y] The y-axis proportionalSize to apply.
             * @param {number} [newValue.z] The z-axis proportionalSize to apply.
             */
            set proportionalSize(newValue) {
                if (!(newValue instanceof Object))
                    throw new TypeError('Invalid value for Node#proportionalSize.')

                if (typeof newValue.x != 'undefined') this._properties.proportionalSize._x = newValue.x
                if (typeof newValue.y != 'undefined') this._properties.proportionalSize._y = newValue.y
                if (typeof newValue.z != 'undefined') this._properties.proportionalSize._z = newValue.z

                this._needsToBeRendered()
            }
            get proportionalSize() {
                return this._properties.proportionalSize
            }

            /**
             * Set all properties of the Node in one method.
             *
             * XXX: Should we change size so it matches structure here and on the node?
             *
             * @param {Object} properties Properties object - see example
             *
             * @example
             * node.properties = {
             *   classes: ['open'],
             *   position: [200, 300, 0],
             *   rotation: [3, 0, 0],
             *   scale: [1, 1, 1],
             *   size: {
             *     mode: ['absolute', 'proportional'],
             *     absolute: [300, null],
             *     proportional: [null, .5]
             *   },
             *   opacity: .9
             * }
             */
            set properties (properties = {}) {
                // Classes
                // TODO: _el reference needs to be moved out.
                if (properties.classes)
                    this._el.setClasses(properties.classes);

                // Size Modes
                if (properties.sizeMode)
                    this.sizeMode = properties.sizeMode

                // Absolute Size
                if (properties.absoluteSize)
                    this.absoluteSize = properties.absoluteSize

                // Proportional Size
                if (properties.proportionalSize)
                    this.proportionalSize = properties.proportionalSize

                this._needsToBeRendered()
            }
            // no need for a properties getter.

            // TODO Where does _render belong? Probably in the DOMRenderer?
            _render(timestamp) {

                // TODO move to DOMRenderer
                this._applySize()

                return this
            }

            /**
             * [applySize description]
             *
             * @method
             * @private
             * @memberOf Node
             *
             * TODO: move to DOMRenderer
             */
            _applySize () {
                var mode = this._properties.sizeMode;
                var absolute = this._properties.absoluteSize;
                var proportional = this._properties.proportionalSize;

                if (mode.x === 'absolute')
                    this._applyStyle('width', `${absolute.x}px`);
                else if (mode.x === 'proportional')
                    this._applyStyle('width', `${proportional.x * 100}%`);

                if (mode.y === 'absolute')
                    this._applyStyle('height', `${absolute.y}px`);
                else if (mode.y === 'proportional')
                    this._applyStyle('height', `${proportional.y * 100}%`);

                //TODO z axis
                //if (mode.z === 'absolute')
                    //this._applyStyle('height', `${absolute.z}px`);
                //else if (mode.z === 'proportional')
                    //this._applyStyle('height', `${proportional.z * 100}%`);
            }

            /**
             * Apply a style property to this node's element.
             *
             * TODO: move into DOMRenderer.
             *
             * @private
             * @param  {string} property The CSS property we will a apply.
             * @param  {string} value    The value the CSS property wil have.
             */
            _applyStyle (property, value) {
                this._el.element.style[property] = value;
            }

            /**
             * TODO: This method is currently extended by the Node class which seems
             * out of place. What's the best way to organize this behavior?
             *
             * TODO: where is the best place to house _needsToBeRendered? In the ImperativeBase class?
             * Sizeable? A new Renderable class?
             */
            _needsToBeRendered() {
                Motor._setNodeToBeRendered(this)

                // TODO: Move this logic into Motor (probably to the _setNodeToBeRendered method).
                if (!Motor._inFrame) Motor._startAnimationLoop()
            }
        }

        Object.defineProperty(Sizeable, Symbol.hasInstance, {
            value: function(obj) {
                if (this !== Sizeable) return Object.getPrototypeOf(Sizeable)[Symbol.hasInstance].call(this, obj)

                let currentProto = obj

                while (currentProto) {
                    let desc = Object.getOwnPropertyDescriptor(currentProto, "constructor")

                    if (desc && desc.value && desc.value.hasOwnProperty(instanceofSymbol))
                        return true

                    currentProto = Object.getPrototypeOf(currentProto)
                }

                return false
            }
        })

        Sizeable[instanceofSymbol] = true

        // for use by MotorHTML, convenient since HTMLElement attributes are all
        // converted to lowercase by default, so if we don't do this then we won't be
        // able to map attributes to Node setters as easily.
        //
        // TODO: move this call out of here, run it in a motor-specific class so
        // that Transformable and related classes are not necessarily
        // motor-scpecific and can be used anywhere.
        console.log('Make the lowercase setter aliases on Sizeable!!!')
        makeLowercaseSetterAliases(Sizeable.prototype)

        return Sizeable
    }

    Sizeable = SizeableMixin(class{})
    Sizeable.mixin = SizeableMixin

}

export {Sizeable as default}
