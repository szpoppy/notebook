window.WFn = {
    checkToggle(me, event) {
        if (me != event.target) {
            return
        }
        // let offset = me.getBoundingClientRect()
        // console.log(offset, event)
        if (event.offsetX > 20 || event.offsetY > 20) {
            return
        }
        me.className = me.className == "checked-line" ? "check-line" : "checked-line"
    },
    stop(event) {
        event.stopPro
    }
}
