void (function () {
    let WebEdit = (window.WebEdit = {})
    let $ = function (cot) {
        return typeof cot == "string" ? document.getElementById(cot) : cot
    }

    let safeColors = "0369cf".split("")

    function getColorLi(format, c) {
        return '<a href="javascript:;" title="#' + c + '" v-click="format,' + format + ",#" + c + '" style="background-color:#' + c + '"></a>'
    }

    function getColors(format) {
        let rv = []
        for (let i = 0; i < 256; i += 7.4) {
            let c = ("0" + Math.round(i).toString(16)).slice(-2)
            rv.push(getColorLi(format, c + c + c))
        }
        rv.push(getColorLi(format, "fff"))
        safeColors.forEach(function (r) {
            safeColors.forEach(function (g) {
                safeColors.forEach(function (b) {
                    rv.push(getColorLi(format, r + g + b))
                })
            })
        })
        return rv.join("")
    }

    function callFuns() {
        let key = Array.prototype.shift.call(arguments)
        WebEdit[key].apply(WebEdit, arguments)
    }

    function bind(fn, self, ...args) {
        return function (...arg) {
            fn.apply(self || this, args.concat(arg))
        }
    }

    Object.assign(WebEdit, {
        defDeploys: ["Clean", "fontsize", "Bold", "Italic", "Underline", "Justifyleft", "Justifycenter", "Justifyright", "Insertorderedlist", "Insertunorderedlist", "Outdent", "Indent", "foreColor", "backColor", "|"],
        renderTo: function (cot, deploys) {
            this.deploys = deploys || this.defDeploys
            let htmls = ['<table cellpadding="0" cellspacing="0" width="100%" class="WebEdit_Edit">', "<thead>", "<tr>", '<td nowrap="nowrap"><div class="WebEdit_empty1"></div>']
            for (let i = 0, t; i < this.deploys.length; i += 1) {
                t =
                    this.deploys[i] == "-"
                        ? [this.htmlDeploys[this.deploys[i]]]
                        : [
                              '<div class="WebEdit_left" v-mouseleave="close">', // v-click="WebEdit.stopClick(event);"
                              this.htmlDeploys[this.deploys[i]],
                              "</div>"
                          ]
                htmls.push(t.join(""))
            }
            htmls.push(["</td>", "</tr>", "</thead>", "<tbody>", "<tr>", "<td>", '<iframe width="100%" allowtransparency="true" name="WebEdit_HTMLEdit" id="WebEdit_HTMLEdit" class="WebEdit_HTMLEdit" frameBorder="0" marginHeight="15" marginWidth="15"></iframe>', "</td>", "</tr>", "</tbody>", "</table>"].join(""))
            cot = $(cot)
            cot.innerHTML = htmls.join("")
            let tags = cot.getElementsByTagName("*")
            for (let i = 0, tag, v_click, v_over, v_leave; i < tags.length; i += 1) {
                tag = tags[i]
                v_click = tag.getAttribute("v-click")
                if (v_click) {
                    //                    console.log(v_click);
                    tag.onclick = bind.apply(window, [callFuns, null].concat(v_click.split(",")))
                }
                v_over = tag.getAttribute("v-mouseover")
                if (v_over) {
                    //                    console.log(v_over);
                    tag.onmouseover = bind.apply(window, [callFuns, null].concat(v_over.split(",")))
                }
                v_leave = tag.getAttribute("v-mouseleave")
                if (v_leave) {
                    tag.onmouseleave = bind.apply(window, [callFuns, null].concat(v_leave.split(",")))
                }
            }

            this.iframe = window.frames["WebEdit_HTMLEdit"]
            this.iframe.document.designMode = "on"
            this.iframe.document.getElementsByTagName("head")[0].innerHTML = '<link href="./res/scroll.css" rel="stylesheet" type="text/css" />'

            this.iframeWin = $("WebEdit_HTMLEdit").contentWindow
            //window obblur
            //FF
            this.iframeWin.addEventListener("click", WebEdit.close, false)
        },
        showCot: null,
        show: function (id) {
            let c = $("WebEdit.Down." + id)
            this.close()
            this.showCot = c
            if (this.showCot) {
                this.showCot.style.display = "block"
            }
        },
        close: function () {
            if (WebEdit.showCot) {
                WebEdit.showCot.style.display = "none"
                WebEdit.showCot = null
            }
        },
        outClose: function (ev, id) {
            ev = ev || window.event
            let d = ev.target || ev.srcElement
            if (d.getAttribute("id") == id) {
                WebEdit.close()
            }
        },
        format: function (type, para) {
            this.iframe.focus()
            if (!para) {
                this.iframe.document.execCommand(type, false, false)
            } else {
                this.iframe.document.execCommand(type, false, para)
            }
            this.close()
        },
        // 临时
        createLink: function () {
            let sURL = window.prompt("请输入网站地址:", "http://")
            if (sURL != null && sURL != "http://") {
                this.format("CreateLink", sURL)
            }
        },
        createImg: function () {
            let sPhoto = prompt("请输入图片位置:", "http://")
            if (sPhoto != null && sPhoto != "http://") {
                this.format("InsertImage", sPhoto)
            }
        },
        setHTML: function (str) {
            this.iframe.document.body.innerHTML = str
        },
        //去除HTML
        getHTML: function () {
            return this.iframe.document.body.innerHTML
        },
        getText: function () {
            return this.iframe.document.body.textContent || this.iframe.document.body.innerTextZ
        },
        clear: function () {
            this.iframe.document.body.innerHTML = ""
            return this
        }
    })

    WebEdit.htmlDeploys = {
        Clean: ['<a v-click="format,removeFormat" v-mouseover="show,Clean" id="WebEdit.Deploy.Clean" hidefocus="true" title="清理格式" href="javascript:;" class="WebEdit_abtn WebEdit_a1"></a>'],
        fontsize: ['<a v-mouseover="show,fontsize" id="WebEdit.Deploy.fontsize" hidefocus="true" title="字号" href="javascript:;" class="WebEdit_abtn WebEdit_a4"></a>', '<div id="WebEdit.Down.fontsize" class="WebEdit_down WebEdit_down-font" v-mouseleave="close">', '<A v-click="format,fontsize,1" href="javascript:;" style="line-height: 120%; font-size: xx-small;">极小</A>', '<A v-click="format,fontsize,2" href="javascript:;" style="line-height: 120%; font-size: x-small;">特小</A>', '<A v-click="format,fontsize,3" href="javascript:;" style="line-height: 120%; font-size: small;">小</A>', '<A v-click="format,fontsize,4" href="javascript:;" style="line-height: 120%; font-size: medium;">中</A>', '<A v-click="format,fontsize,5" href="javascript:;" style="line-height: 120%; font-size: large;">大</A>', '<A v-click="format,fontsize,6" href="javascript:;" style="line-height: 120%; font-size: x-large;">特大</A>', '<A v-click="format,fontsize,7" href="javascript:;" style="line-height: 120%; font-size: xx-large;">极大</A>', "</div>"].join(""),
        Bold: '<a v-click="format,Bold,1" v-mouseover="show,Bold" id="WebEdit.Deploy.Bold" hidefocus="true" title="加粗" href="javascript:;" class="WebEdit_abtn WebEdit_a5"></a>',
        Italic: '<a v-click="format,Italic,1" v-mouseover="show,Italic" id="WebEdit.Deploy.Italic" hidefocus="true" title="斜体" href="javascript:;" class="WebEdit_abtn WebEdit_a6"></a>',
        Underline: '<a v-click="format,Underline,1" v-mouseover="show,Underline" id="WebEdit.Deploy.Underline" hidefocus="true" title="下划线" href="javascript:;" class="WebEdit_abtn WebEdit_a7"></a>',
        Justifyleft: '<a v-click="format,Justifyleft,1" v-mouseover="show,Justifyleft" id="WebEdit.Deploy.Justifyleft" hidefocus="true" title="左对齐" href="javascript:;" class="WebEdit_abtn WebEdit_a8"></a>',
        Justifycenter: '<a v-click="format,Justifycenter,1" ov-mouseover="show,Justifycenter" id="WebEdit.Deploy.Justifycenter" hidefocus="true" title="居中对齐" href="javascript:;" class="WebEdit_abtn WebEdit_a9"></a>',
        Justifyright: '<a v-click="format,Justifyright,1" v-mouseover="show,Justifyright" id="WebEdit.Deploy.Justifyright" hidefocus="true" title="右对齐" href="javascript:;" class="WebEdit_abtn WebEdit_a10"></a>',
        Insertorderedlist: '<a v-click="format,Insertorderedlist,1" v-mouseover="show,Insertorderedlist" id="WebEdit.Deploy.Insertorderedlist" hidefocus="true" title="数字编号" href="javascript:;" class="WebEdit_abtn WebEdit_a11"></a>',
        Insertunorderedlist: '<a v-click="format,Insertunorderedlist,1" v-mouseover="show,Insertunorderedlist" id="WebEdit.Deploy.Insertunorderedlist" hidefocus="true" title="项目编号" href="javascript:;" class="WebEdit_abtn WebEdit_a12"></a>',
        Indent: '<a v-click="format,Indent,1" v-mouseover="show,Indent" id="WebEdit.Deploy.Outdent" hidefocus="true" title="增加缩进" href="javascript:;" class="WebEdit_abtn WebEdit_a13"></a>',
        Outdent: '<a v-click="format,Outdent,1" v-mouseover="show,Outdent" id="WebEdit.Deploy.Indent" hidefocus="true" title="减少缩进" href="javascript:;" class="WebEdit_abtn WebEdit_a14"></a>',
        foreColor: ['<a v-mouseover="show,foreColor" id="WebEdit.Deploy.foreColor" hidefocus="true" title="字体颜色" href="javascript:;" class="WebEdit_abtn WebEdit_a15"></a>', '<div id="WebEdit.Down.foreColor" class="WebEdit_down WebEdit_Color" v-mouseleave="close">', getColors("foreColor"), "</div>"].join(""),
        backColor: ['<a v-mouseover="show,backColor" id="WebEdit.Deploy.backColor" hidefocus="true" title="背景颜色" href="javascript:;" class="WebEdit_abtn WebEdit_a16"></a>', '<div id="WebEdit.Down.backColor" class="WebEdit_down WebEdit_Color" v-mouseleave="close">', getColors("backColor"), "</div>"].join(""),
        CreateLink: ['<a v-click="createLink" v-mouseover="show,CreateLink" id="WebEdit.Deploy.CreateLink" hidefocus="true" title="增加连接" href="javascript:;" class="WebEdit_abtn WebEdit_a17"></a>'].join(""),
        CreateImg: ['<a v-click="createImg" v-mouseover="show,CreateImg" id="WebEdit.Deploy.CreateImg" hidefocus="true" title="增加图片" href="javascript:;" class="WebEdit_abtn WebEdit_a18"></a>'].join(""),
        "-": ['</td></tr><tr><td nowrap="nowrap">'].join("")
    }
})()
