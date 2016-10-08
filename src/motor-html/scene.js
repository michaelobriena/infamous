
import styles from './scene-style'
import Motor from '../motor/Motor'
import Scene from '../motor/Scene'
import Observable from '../motor/Observable'
import MotorHTMLBase, {initMotorHTMLBase} from './base'

console.log('Observable class?', Observable)

initMotorHTMLBase()

let privates = new WeakMap()
let _ = instance => {
    if (!privates.get(instance)) privates.set(instance, {})
    return privates.get(instance)
}

class MotorHTMLScene extends Observable.mixin(MotorHTMLBase) {

    createdCallback() {
        super.createdCallback()

        // TODO move to DOMRenderer
        this._sizePollTask = null
        this._computedSize = {x:0, y:0, z:0}
    }

    init() {
        super.init() // indirectly triggers this._makeImperativeCounterpart...

        // ... then we can reference it.
        this.imperativeCounterpart.mount(this.parentNode)

        // poll for size changes. Polling is requred because there's no other
        // way to dothis reliably, not even with MutationObserver.
        this._startSizePolling()
    }

    _startSizePolling() {
        this._sizePollTask = Motor.addRenderTask(this._checkSize.bind(this))
    }

    // NOTE, the Z dimension of a scene doesn't matter, it's a flat plane, so
    // we haven't taken that into consideration here.
    // TODO: WHat's the best alternative to
    // `getComputedStyle(this).getPropertyValue('width')`, if any?
    _checkSize() {
        let width = parseInt(getComputedStyle(this).getPropertyValue('width'))
        let height = parseInt(getComputedStyle(this).getPropertyValue('height'))

        // if we have a size change, trigger SizeChange
        // TODO, we need an Event/Observable pattern, issue #54
        if (this._computedSize.x != width || this._computedSize.y != height) {
            this._computedSize.x = width
            this._computedSize.y = height

            this.triggerEvent('sizechange', this._computedSize)
        }
    }

    _makeImperativeCounterpart() {
        return new Scene({
            _motorHtmlCounterpart: this
        })
    }

    /** @override */
    getStyles() {
        return styles
    }

    deinit() {
        super.deinit()

        this.imperativeCounterpart.unmount()

        this._stopSizePolling()
    }

    _stopSizePolling() {
        Motor.removeRenderTask(this._sizePollTask)
        this._sizePollTask = null
    }
}

import 'document-register-element'
MotorHTMLScene = document.registerElement('motor-scene', MotorHTMLScene)

export {MotorHTMLScene as default}
