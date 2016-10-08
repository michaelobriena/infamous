import 'geometry-interfaces'
import Transformable from './Transformable'
import ImperativeBase, {initImperativeBase} from './ImperativeBase'
import MotorHTMLNode from '../motor-html/node'

initImperativeBase()

class Node extends Transformable.mixin(ImperativeBase) {

    /**
     * @constructor
     *
     * @param {Object} options Initial properties that the node will
     * have. This can be used when creating a node, alternatively to using the
     * setters/getters for position, rotation, etc.
     *
     * @example
     * var node = new Node({
     *   absoluteSize: {x:100, y:100, z:100},
     *   rotation: {x:30, y:20, z:25}
     * })
     */
    constructor (options = {}) {
        super(options)

        // This was when using my `multiple()` implementation, we could call
        // specific constructors using specific arguments. But, we're using
        // class-factory style mixins for now, so we don't have control over the
        // specific arguments we can pass to the constructors, so we're just
        // using a single `options` parameter in all the constructors.
        //this.callSuperConstructor(Transformable, options)
        //this.callSuperConstructor(TreeNode)
        //this.callSuperConstructor(ImperativeBase)

        // TODO: We need to render one time each time mountPromise is resolved,
        // not just this one time in the constructor.
        this._needsToBeRendered()
    }

    /**
     * @override
     */
    _makeElement() {
        return new MotorHTMLNode
    }

    /**
     * Trigger a re-render for this node (wait until mounted if not nounted
     * yet).
     *
     * @override see Transformable#override
     *
     * TODO If a setter is called over and over in a render task before the node
     * is mounted, then each tick will cause an await this.mountPromise, and
     * eventually all the bodies will fire all at once. I don't think we want
     * this to happen. However, it's harmless since the calls to
     * super._needsToBeRendered after the first call are basically no-ops when
     * the code path reaches Motor._setNodeToBeRendered. We need to evaluate
     * this a little more...
     */
    async _needsToBeRendered() {
        if (!this._mounted) {
            await this.mountPromise
        }
        super._needsToBeRendered()
    }
}

export {Node as default}
