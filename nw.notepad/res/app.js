void (function () {
    let nWin = nw.Window.get()
    let nWinMaxSize = [0, 0]
    // 监听最小化事件
    nWin.on("maximize", function () {
        nWinMaxSize = [nWin.width, nWin.height]
    })

    WebEdit.renderTo("note-box")

    let $ = function (cot) {
        return typeof cot == "string" ? document.getElementById(cot) : cot
    }

    function htmlToText(str) {
        return str.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/"/g, "&#34;").replace(/'/g, "&#39;")
    }

    const fs = require("fs")
    const path = require("path")

    const rootDir = process.execPath.replace(/[^\/\\]*$/, path.join("nw.notepad", "data"))

    function getPath(...arg) {
        return path.resolve(...[rootDir].concat(arg))
    }

    function getUUID() {
        let t = new Date().getTime() - 1599783690695
        return parseInt(Math.floor(Math.random() * 100) + "" + t).toString(36)
    }

    let curBook = {}
    // console.log("curBook", curBook)
    let curNote = {}
    let bookIds = []

    function createBook(title) {
        let id = getUUID()
        fs.mkdirSync(getPath(id))
        curBook = {
            id,
            title,
            tree: [],
            treeHash: {}
        }

        getBook()

        return id
    }

    // 读取目录
    function readBooks() {
        // 读取目录中的所有文件/目录
        let paths = fs.readdirSync(rootDir) || []
        if (paths.length == 0) {
            paths.push(createBook("默认笔记本"))
        }

        return paths
    }

    // 所有书本id
    bookIds = readBooks()
    // 当前书本
    curBook = require(getPath(bookIds[0], "index.json")) || {}

    function reSetLib() {
        let libs = []
        bookIds.forEach(function (id) {
            let book = require(getPath(id, "index.json"))
            libs.push('<div class="lib-li' + (id == curBook.id ? " act" : "") + '"><i class="iconfont l">&#xe7d4;</i><i class="iconfont r" event="removeBook:' + id + '">&#xe780;</i><b event="electBook:' + id + '">' + htmlToText(book.title) + "</b></div>")
        })

        $("lib.lis").innerHTML = libs.join("")
    }

    function reSetBookTree() {
        let treeText = []
        curBook.tree.forEach(function (id) {
            let li = curBook.treeHash[id]
            treeText.push('<div class="li' + (curNote.id == li.id ? " act" : "") + '" id="book.tree.li.' + li.id + '"><div class="con" event="electNote:' + li.id + '"><i class="r iconfont" event="removeNote:' + li.id + '">&#xe780;</i><i class="x iconfont">&#xe7d4;</i><b id="book.tree.title.' + li.id + '">' + htmlToText(li.title) + "</b></div></div>")
        })

        $("book.tree").innerHTML = treeText.join("")
    }

    function getBook(id) {
        if (id && id != curBook.id) {
            curBook = require(getPath(id, "index.json"))
        }

        $("book.title").value = curBook.title
        if (curBook.tree.length == 0) {
            createNote("新建笔记")
        }

        reSetBookTree()
        electNote(curBook.tree[0])
    }

    function removeBookDir(dir) {
        if (fs.existsSync(dir)) {
            files = fs.readdirSync(dir) || []
            files.forEach(function (file) {
                let curPath = path.join(dir, file)
                if (fs.statSync(curPath).isDirectory()) {
                    // recurse
                    removeBookDir(curPath)
                } else {
                    // delete file
                    fs.unlinkSync(curPath)
                }
            })
            fs.rmdirSync(dir)
        }
    }

    function removeBook(id) {
        let book = require(getPath(id, "index.json"))
        let msg = ["确认删除《" + book.title + "》"]
        msg.push(bookIds.length > 1 ? "删除后，无法恢复？" : "删除后，将会重新初始化？")
        if (book && window.confirm(msg.join("\n"))) {
            bookIds.splice(bookIds.indexOf(book.id), 1)

            removeBookDir(getPath(book.id))

            if (bookIds.length == 0) {
                bookIds.push(createBook("默认笔记本"))
            }

            if (book.id == curBook.id) {
                curBook = {}
                getBook(bookIds[0])
            }
        }
    }

    function saveNote() {
        let bookId = curBook.id
        let noteId = curNote.id
        if (bookId && noteId) {
            fs.writeFileSync(getPath(bookId, noteId + ".html"), WebEdit.getHTML(), "utf8")
        }
    }

    function getNote() {
        try {
            return fs.readFileSync(getPath(curBook.id, curNote.id + ".html"), "utf8")
        } catch (e) {}
        return ""
    }

    function saveCurBook() {
        fs.writeFileSync(getPath(curBook.id, "index.json"), JSON.stringify(curBook), "utf8")
    }

    function createNote(title) {
        let id = getUUID()
        curBook.tree.push(id)
        curBook.treeHash[id] = {
            id,
            title
        }
        saveCurBook()
        reSetBookTree()
        electNote(id)
        WebEdit.setHTML("")
        saveNote()
        return id
    }

    function electNote(id) {
        let cur = $("book.tree.li." + curNote.id)
        if (cur) {
            cur.className = "li"
        }
        if (id && id != curNote.id) {
            curNote = curBook.treeHash[id]
        }
        cur = $("book.tree.li." + curNote.id)
        if (cur) {
            cur.className = "li act"
        }
        // console.log("curNote", curNote, id)
        $("note.title").value = curNote.title
        WebEdit.setHTML(getNote())
    }

    let ppEventFn = {
        electNote(event, id) {
            // console.log("event", event)
            saveNote()
            electNote(id)
        },
        addNote() {
            createNote("新建笔记")
            $("note.title").select()
        },
        removeNote(event, id) {
            let note = curBook.treeHash[id]
            if (note) {
                if (curBook.tree.length == 1) {
                    if (window.confirm("无法删除最后一遍笔记，是否删除整个笔记本？")) {
                        removeBook(curBook.id)
                    }
                    return true
                }

                if (window.confirm("确认删除《" + note.title + "》?")) {
                    delete curBook.treeHash[id]
                    let index = curBook.tree.indexOf(id)
                    curBook.tree.splice(index, 1)
                    try {
                        fs.unlinkSync(getPath(curBook.id, id + ".html"))
                    } catch (e) {}

                    reSetBookTree()

                    if (curNote.id == id) {
                        electNote(curBook.tree[0])
                    }
                }
            }

            return true
        },
        stop(event) {
            event.stopPropagation()
            return true
        },
        // 显示
        showLibs() {
            reSetLib()
            $("lib.block").className = "lib-block act"
        },
        hideLibs() {
            $("lib.block").className = "lib-block"
        },
        addBook() {
            bookIds.push(createBook("新建笔记本"))
            ppEventFn.hideLibs()

            $("book.title").select()
        },
        electBook(event, id) {
            getBook(id)
            ppEventFn.hideLibs()
        },
        removeBook(event, id) {
            removeBook(id)
            ppEventFn.hideLibs()
            return true
        },
        winClose() {
            nWin.close()
        },
        winMinimize() {
            nWin.minimize()
        },
        winToggle() {
            if (nWin.width == nWinMaxSize[0] && nWin.height == nWinMaxSize[1]) {
                nWin.unmaximize()
            } else {
                nWin.maximize()
            }
        },
        createQuickStart() {
            console.log(process)
            if (window.confirm("即将创建桌面快捷方式，如果已存在，将覆盖。")) {
                let dir = process.execPath.replace(/[^\/\\]*$/, "")
                fs.writeFileSync(
                    path.resolve(process.env.HOME, "Desktop", "nw.nptebookpad.desktop"),
                    `[Desktop Entry]
Name=NW笔记本
Path=${dir}
Exec=${path.resolve(dir, "nw")}
Icon=${path.resolve(dir, "icon.svg")}
Type=Application
Categories=Office;`,
                    "utf8"
                )
            }
        }
    }

    function ppEvent(event) {
        let target = event.target
        while (target && target != this) {
            if (target.getAttribute) {
                let evn = target.getAttribute("event")
                if (evn) {
                    let args = evn.split(":")
                    let fnKey = args[0]
                    args[0] = event
                    let flag = ppEventFn[fnKey].apply(this, args)
                    if (flag) {
                        break
                    }
                }
            }
            target = target.parentNode
        }
    }
    $("context").onclick = ppEvent

    getBook()

    function keyDownEventFn(event) {
        let key = event.key.toLowerCase()
        let ctrl = event.ctrlKey
        if (key == "f5") {
            window.location.reload()
            return
        }
        if (key == "s" && ctrl) {
            // 保存
            saveNote()
            return
        }
    }
    document.onkeydown = keyDownEventFn

    WebEdit.iframeWin.addEventListener("keydown", keyDownEventFn, false)

    // 标题更新
    $("note.title").onblur = function () {
        let val = this.value.trim()
        $("book.tree.title." + curNote.id).innerText = val
        curBook.treeHash[curNote.id].title = val

        saveCurBook()
    }

    // 更新book名称
    $("book.title").onblur = function () {
        curBook.title = this.value.trim()
        saveCurBook()
    }
})()
