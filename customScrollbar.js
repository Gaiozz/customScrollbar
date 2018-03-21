class CustomScrollbar {
    constructor ({ el, contentWrapper, width, float, offset, autoDetectResize = true, scrollbarStyle = {}, scrollbarBtnStyle = {}  }) {
        this.container = el
        this.contentWrapper = contentWrapper || null
        this.width = width != null ? width : 8
        this.float = float || 'right'
        this.offset = offset || 0
        this.autoDetectResize = autoDetectResize === true ? true : false

        this.scrollbar = null
        this.scrollbarBtn = null

        this.scrollbarStyle = scrollbarStyle
        this.scrollbarBtnStyle = scrollbarBtnStyle

        this._scrollPerc = 0
        this._lastScrollHeight = 0
        this._lastClientHeight = 0

        if (window.jQuery != null) {
            if (this.container instanceof jQuery) {
                this.container = this.container[0]
            }
            if (this.contentWrapper instanceof jQuery) {
                this.contentWrapper = this.contentWrapper[0]
            }
        }

        this._InitContainers()
        this._CreateScrollbar()

        this._InitEvents()
        this.ResetScrollbar()
    }

    get _scrollDistance () {
        var height = this.contentWrapper.clientHeight
        var scrollHeight = this.contentWrapper.scrollHeight

        return scrollHeight - height
    }
    get _scrollbarDistance () {
        return this.scrollbar.clientHeight - this.scrollbarBtn.clientHeight
    }

    _InitContainers () {
        var computedStyle = window.getComputedStyle(this.container)
        var inlineStyle = this.container.style
        if ((!computedStyle.position || computedStyle.position === 'static') &&
            (!inlineStyle.position || inlineStyle.position === 'static')) {

            this.container.style.position = 'relative'
        }

        this.container.style.overflow = 'hidden'

        var wrapperStyle = {
            'position': 'relative',
            'width': '100%',
            'height': '100%',
            'overflow-y': 'auto',
            'overflow-x': 'hidden'
        }

        if (this.contentWrapper) {
            for (let x in wrapperStyle) {
                this.contentWrapper.style[x] = wrapperStyle[x]
            }
            return
        }

        var content = this.container.innerHTML
        this.contentWrapper = document.createElement('div')
        this.contentWrapper.className = 'custom-scrollbar-container-wrapper'

        for (let x in wrapperStyle) {
            this.contentWrapper.style[x] = wrapperStyle[x]
        }

        this.contentWrapper.innerHTML = content
        this.container.innerHTML = ''
        this.container.appendChild(this.contentWrapper)
    }
    _CreateScrollbar () {
        this.scrollbar = document.createElement('div')
        this.scrollbar.className = 'custom-scrollbar'
        /// apply style
        this.scrollbar.style.position = 'absolute'
        this.scrollbar.style['top'] = 0
        this.scrollbar.style[this.float] = -this.offset + 'px'
        this.scrollbar.style['z-index'] = 2
        this.scrollbar.style['width'] = this.width + 'px'
        this.scrollbar.style['height'] = '100%'
        this.scrollbar.style['pointer-events'] = 'none'

        for (let x in this.scrollbarStyle) {
            this.scrollbar.style[x] = this.scrollbarStyle[x]
        }
        ///

        this.scrollbarBtn = document.createElement('div')
        this.scrollbarBtn.className = 'custom-scrollbar-btn'
        /// apply style
        this.scrollbarBtn.style['position'] = 'absolute'
        this.scrollbarBtn.style['left'] = 0
        this.scrollbarBtn.style['top'] = 0
        this.scrollbarBtn.style['width'] = '100%'
        this.scrollbarBtn.style['cursor'] = 'pointer'
        this.scrollbarBtn.style['background-color'] = 'rgba(170, 170, 170, 0.85)'
        this.scrollbarBtn.style['pointer-events'] = 'all'

        for (let x in this.scrollbarBtnStyle) {
            this.scrollbarBtn.style[x] = this.scrollbarBtnStyle[x]
        }
        ///

        this.scrollbar.appendChild(this.scrollbarBtn)
        this.container.appendChild(this.scrollbar)
    }

    _InitEvents () {
        this.contentWrapper.addEventListener('scroll', () => {
            if (btnActive) return
            this._SetScrollPosition()
        })

        var btnActive = false, currY = null
        this.scrollbarBtn.addEventListener('mousedown', (ev) => {
            btnActive = true
            currY = ev.pageY

            this.scrollbar.className.replace(/ active/g, '')
            this.scrollbar.className += ' active'

            document.body.style['user-select'] = 'none'
        })
        window.addEventListener('mousemove', (ev) => {
            if (!btnActive) return
            if (!currY || ev.pageY == currY) return

            var newPerc = this._scrollPerc + (ev.pageY - currY) / this._scrollbarDistance * 100
            this._SetScrollPosition(newPerc)
            currY = ev.pageY
        })
        window.addEventListener('mouseup', () => {
            btnActive = false
            currY = null
            this.scrollbar.className.replace(/ active/g, '')
            document.body.style['user-select'] = ''
        })

        if (this.autoDetectResize) {
            this._WatchScrollHeightChange()
        }
    }
    _WatchScrollHeightChange () {
        if (this.container.parentNode == null) return // container doesn't exists anymore

        var currClientHeight = this.contentWrapper.clientHeight
        var currScrollHeight = this.contentWrapper.scrollHeight

        if (this._lastClientHeight != currClientHeight) {
            this.ResetScrollbar()
            this._lastClientHeight = currClientHeight
        }
        if (this._lastScrollHeight != currScrollHeight) {
            this.ResetScrollbar()
            this._lastScrollHeight = currScrollHeight
        }

        window.requestAnimationFrame(this._WatchScrollHeightChange.bind(this))
    }

    _GetScrollbarWidth () {
        var inner = document.createElement('p')
        inner.style.width = '100%'
        inner.style.height = '200px'

        var outer = document.createElement('div')
        outer.style.position = 'absolute'
        outer.style.top = '0px'
        outer.style.left = '0px'
        outer.style.visibility = 'hidden'
        outer.style.width = '200px'
        outer.style.height = '150px'
        outer.style.overflow = 'hidden'
        outer.appendChild(inner)

        document.body.appendChild(outer)
        var w1 = inner.offsetWidth
        outer.style.overflow = 'scroll'
        var w2 = inner.offsetWidth
        if (w1 == w2) w2 = outer.clientWidth

        document.body.removeChild(outer)

        return (w1 - w2)
    }

    _SetScrollPosition (perc = null) {
        if (perc == null) {
            let scrollTop = this.contentWrapper.scrollTop
            this._scrollPerc = 100 * scrollTop / this._scrollDistance
        }
        else {
            this._scrollPerc = parseFloat(perc) || 0
            this._scrollPerc = Math.max(Math.min(this._scrollPerc, 100), 0)
            this.contentWrapper.scrollTop = this._scrollPerc * this._scrollDistance / 100
        }

        var posY = Math.ceil(this._scrollbarDistance * this._scrollPerc / 100)
        this.scrollbarBtn.style.top = posY + 'px'
    }

    ResetScrollbar () {
        var height = this.contentWrapper.clientHeight
        var scrollHeight = this.contentWrapper.scrollHeight

        if (height < scrollHeight) {
            let btnHeight = Math.max(Math.pow(height, 2) / scrollHeight, 20)
            this.scrollbarBtn.style.height = parseInt(btnHeight) + 'px'
            this.contentWrapper.style.width = `calc(100% + ${this._GetScrollbarWidth()}px`
            this.scrollbar.style.visibility = 'visible'
        }
        else {
            this.scrollbar.style.visibility = 'hidden'
            this.contentWrapper.style.width = '100%'
        }

        this._SetScrollPosition()
    }
}

void function Init () {
    window.CustomScrollbar = CustomScrollbar
}()
