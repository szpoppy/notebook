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

    const rootDir = process.execPath.replace(/[^\/\\]*$/, "nw.data")

    function getPath(...arg) {
        // console.log("arg", arg)
        return path.resolve(...[rootDir].concat(arg))
    }

    function getUUID() {
        let t = new Date().getTime() - 1599783690695
        return parseInt(`${t}${Math.floor(Math.random() * 100)}`).toString(36)
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
        let getBookDir = getPath("book.json")
        // console.log("getBookDir", getBookDir)
        let books = []
        try {
            books = require(getBookDir).tree
        } catch (e) {}
        // console.log("books", books)
        return books
    }

    function saveBooks() {
        fs.writeFile(getPath("book.json"), JSON.stringify({ tree: bookIds }), "utf8", function () {})
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
            saveBooks()

            if (bookIds.length == 0) {
                bookIds.push(createBook("默认笔记本"))
            }

            if (book.id == curBook.id) {
                curBook = {}
                getBook(bookIds[0])
            }
        }
    }

    let curNoteText = ""
    function saveNote() {
        let bookId = curBook.id
        let noteId = curNote.id
        let html = WebEdit.getHTML()
        if (bookId && noteId && curNoteText != html) {
            fs.writeFile(getPath(bookId, noteId + ".html"), html, "utf8", function () {})
            // console.log(noteId, curBook)
            if (noteId && curBook.tree.length > 1 && curBook.tree[0] != noteId) {
                let index = curBook.tree.indexOf(noteId)
                curBook.tree.unshift(...curBook.tree.splice(index, 1))
                saveCurBook()
                // reSetBookTree()
            }
        }
    }

    function getNote() {
        try {
            return (curNoteText = fs.readFileSync(getPath(curBook.id, curNote.id + ".html"), "utf8"))
        } catch (e) {}
        return ""
    }

    function saveCurBook() {
        fs.writeFile(getPath(curBook.id, "index.json"), JSON.stringify(curBook), "utf8", function () {})
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
        saveNote()
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
            event.stopPropagation()
            electNote(id)
            return true
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
            if (window.confirm("即将创建桌面快捷方式，如果已存在，将覆盖。")) {
                let dir = process.execPath.replace(/[^\/\\]*$/, "")
                fs.writeFile(
                    path.resolve(process.env.HOME, "Desktop", "nw.nptebookpad.desktop"),
                    `[Desktop Entry]
Name=NW笔记本
Path=${dir}
Exec=${path.resolve(dir, "nw")}
Icon=${path.resolve(dir, "icon.svg")}
Type=Application
Categories=Office;`,
                    "utf8",
                    function () {}
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

    document.onclick = function () {
        // 每次点击，都自动保存
        saveNote()
    }

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

        if (bookIds.length > 1 && bookIds[0] != curBook.id) {
            let index = bookIds.indexOf(curBook.id)
            bookIds.unshift(...bookIds.splice(index, 1))
            saveBooks()
        }
    }

    window.document.documentElement.className = (function () {
        let ug = window.navigator.userAgent
        let isLinux = /\blinux\b/i.test(ug)
        // let isWin = /\bwindows\b/i.test(ug)
        if (isLinux) {
            return "os-linux"
        }
        return ""
    })()
    /*

    console.log()

    let fork = require("child_process").fork
    let child = fork(process.execPath.replace(/[^\/\\]*$/, "") + 'shortcut.vbs /target:"' + process.execPath + '" /shortcut:"' + path.resolve(process.env.USERPROFILE, "桌面", "nw.nptebookpad.lnk") + '"')
    child.on("error", function () {
        console.log("err", arguments)
    })
    console.log(process.execPath.replace(/[^\/\\]*$/, "") + 'shortcut.vbs /target:"' + process.execPath + '" /shortcut:"' + path.resolve(process.env.USERPROFILE, "桌面", "nw.nptebookpad.lnk") + '"')
    */
})()
