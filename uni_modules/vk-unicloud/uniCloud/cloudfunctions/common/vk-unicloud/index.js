"use strict";
var e = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {},
    t = {
        regExpTest: function (e, t) {
            let n = !1;
            if ("string" == typeof e) {
                new RegExp(e).test(t) && (n = !0)
            } else if ("object" == typeof e) for (let r = 0; r < e.length; r++) {
                if (new RegExp(e[r]).test(t)) {
                    n = !0;
                    break
                }
            } else "function" == typeof e && (n = e(t));
            return n
        }
    }, n = t, r = {
        main: async e => {
            let {url: t, data: n = {}, util: r} = e, {uniID: i} = r, {need_user_info: a} = n, o = {code: -1, msg: ""};
            void 0 === a && (a = -1 == t.indexOf("."));
            let s = 0 == t.indexOf("admin/");
            s && (a = !0), (t.indexOf("sys.") > -1 || t.indexOf("sys_") > -1 || t.indexOf("/sys") > -1) && (a = !0);
            let l = t.indexOf("/sys/") > -1, c = await i.checkToken(e.uniIdToken, {needPermission: l, needUserInfo: a});
            if (c.code && c.code > 0) return c;
            if (c.userInfo) {
                let e = c.userInfo;
                e.permission = c.permission, delete e.token, delete e.password, o.userInfo = e
            }
            if (o.uid = c.uid, c.token && (o.token = c.token, o.tokenExpired = c.tokenExpired), s) {
                if (!o.userInfo) return {code: 403, msg: "need_user_info必须为true"};
                {
                    let e = o.userInfo.role || [];
                    if (!o.userInfo.allow_login_background && !e.includes("admin")) return {
                        code: 403,
                        msg: "您无权限登录后台"
                    }
                }
            }
            return o.code = 0, o.msg = "ok", o
        }
    };

async function i(e = {}, t) {
    let {vk: n, db: r, _: i} = t, {whereJson: a = {}, fieldJson: o = {}, justNeedID: s = !1} = e;
    s && (o = {permission_id: !0}), a.enable = !0;
    let l = [], c = await n.baseDao.select({
        dbName: "uni-id-permissions",
        pageIndex: 1,
        pageSize: 500,
        fieldJson: o,
        whereJson: a
    });
    if (s) for (let e = 0; e < c.rows.length; e++) {
        let t = c.rows[e];
        l.push(t.permission_id)
    } else l = c.rows;
    return l
}

var a = [{
    id: "pub", regExp: function (e = "") {
        return "pub" === o(e)
    }, description: "pub函数为所有人都可以访问的函数", index: 100, mode: "onActionExecuting", main: async function (e) {
        let {url: t, data: n = {}, util: i} = e, {uniID: a} = i, o = {};
        if (e.data.need_user_info) o = await r.main(e); else if (e.uniIdToken) {
            let t = await a.checkToken(e.uniIdToken, {needPermission: !1, needUserInfo: !1});
            0 === t.code && (o.uid = t.uid)
        }
        return o.code = 0, o.msg = "ok", o
    }
}, {
    id: "kh", regExp: function (e = "") {
        return "kh" === o(e)
    }, description: "kh函数为必须登录后才能访问的函数(客户端用户)", index: 200, mode: "onActionExecuting", main: r.main
}, {
    id: "sys",
    regExp: function (e = "") {
        return "sys" === o(e)
    },
    description: "sys函数为后端管理人员才能访问的函数(商家后台工作人员)",
    index: 300,
    mode: "onActionExecuting",
    main: {
        main: async e => {
            let {url: t, util: n} = e, {uniID: a, config: o, pubFun: s, vk: l, db: c, _: d} = n,
                u = {code: -1, msg: ""};
            const p = r;
            if (u = await p.main(e), 0 !== u.code) return u;
            if (!u.userInfo) return {code: 403, msg: "请去除need_user_info:false"};
            if (u.userInfo.role || (u.userInfo.role = []), u.userInfo.role.includes("admin")) return u;
            if (!u.userInfo.allow_login_background && 0 == t.indexOf("admin/")) return {
                code: 403,
                msg: "您无权限登录后台"
            };
            let f = [];
            if (u.userInfo.role.includes("admin-lv3")) {
                let e = await i({whereJson: {level: d.in([1, 2, 3])}, justNeedID: !0}, n);
                l.pubfn.isNotNull(e) && (f = f.concat(e))
            }
            if (u.userInfo.role.includes("admin-lv2")) {
                let e = await i({whereJson: {level: d.in([1, 2])}, justNeedID: !0}, n);
                l.pubfn.isNotNull(e) && (f = f.concat(e))
            }
            if (u.userInfo.role.includes("admin-lv1")) {
                let e = await i({whereJson: {level: d.in([1])}, justNeedID: !0}, n);
                l.pubfn.isNotNull(e) && (f = f.concat(e))
            }
            if (u.userInfo.role.includes("query-all")) {
                let e = await i({whereJson: {curd_category: 4, level: d.neq(4)}, justNeedID: !0}, n);
                l.pubfn.isNotNull(e) && (f = f.concat(e))
            }
            let g = await async function (e, t) {
                let {vk: n, db: r, _: i} = t, {role: a} = e;
                if (n.pubfn.isNull(a)) return [];
                return (await n.baseDao.select({
                    dbName: "uni-id-roles",
                    whereJson: {role_id: i.in(a), enable: !0},
                    fieldJson: {permission: !0}
                })).rows
            }({role: u.userInfo.role}, n);
            for (let e in g) {
                let {permission: t} = g[e];
                l.pubfn.isNotNull(t) && (f = f.concat(t))
            }
            if (0 == f.length) return {code: 403, msg: "权限不足"};
            f = [...new Set(f)];
            let m = await i({whereJson: {permission_id: d.in(f), match_mode: d.in([1, 2])}}, n), h = !1;
            for (let e = 0; e < m.length; e++) {
                let n = m[e];
                if (1 === n.match_mode) {
                    if (l.pubfn.wildcardTest(t, n.url)) {
                        h = !0;
                        break
                    }
                } else if (2 === n.match_mode && l.pubfn.regExpTest(t, n.url)) {
                    h = !0;
                    break
                }
            }
            if (!h) {
                await async function (e, t) {
                    let {vk: n, db: r, _: i} = t, {myPermission: a, url: o} = e;
                    if (n.pubfn.isNull(a)) return !1;
                    return await n.baseDao.count({
                        dbName: "uni-id-permissions",
                        whereJson: {enable: !0, permission_id: i.in(a), url: o, match_mode: i.nin([1, 2])}
                    }) > 0
                }({myPermission: f, url: t}, n) && (h = !0)
            }
            return h ? (u.code = 0, u.msg = "ok", u) : {code: 403, msg: "权限不足"}
        }
    }.main
}, {
    id: "access_denied",
    regExp: function (e = "") {
        return "access denied" === o(e)
    },
    description: "sys函数为后端管理人员才能访问的函数(商家后台工作人员)",
    index: 100,
    mode: "onActionExecuting",
    main: function () {
        return {code: 403, msg: "禁止访问私有函数！"}
    }
}];

function o(e = "") {
    let t = "";
    return e.indexOf("/sys/") > -1 ? t = "sys" : e.indexOf("/kh/") > -1 ? t = "kh" : e.indexOf("/pub/") > -1 && (t = "pub"), e.indexOf("/sys.") > -1 || e.indexOf("/sys_") > -1 || 0 === e.indexOf("sys.") || 0 === e.indexOf("sys_") ? t = "sys" : e.indexOf("/kh.") > -1 || e.indexOf("/kh_") > -1 || 0 === e.indexOf("kh.") || 0 === e.indexOf("kh_") ? t = "kh" : (e.indexOf("/pub.") > -1 || e.indexOf("/pub_") > -1 || 0 === e.indexOf("pub.") || 0 === e.indexOf("pub_")) && (t = "pub"), e.indexOf(".sys_") > -1 ? t = "sys" : e.indexOf(".kh_") > -1 ? t = "kh" : e.indexOf(".pub_") > -1 && (t = "pub"), "" == t && e.indexOf(".") > -1 && (t = "kh"), e.indexOf("._") > -1 && (t = "access denied"), t
}

var s = {
    onActionExecuting: async (e = {}) => {
        let {serviceParam: t, middlewareService: r = []} = e,
            i = {code: 403, msg: "access denied", filterStack: []}, {url: a} = t;
        for (let e in r) {
            let o = r[e], {mode: s = "onActionExecuting", enable: l = !0} = o;
            if (l && "onActionExecuting" === s && n.regExpTest(o.regExp, a)) {
                t.filterResponse = i;
                let e = await o.main(t);
                if (e.filterId = o.id, i.filterStack.push(e), 0 !== e.code) {
                    i = e;
                    break
                }
                i = Object.assign(i, e)
            }
        }
        return i
    }, onActionExecuted: async (e = {}) => {
        let {serviceParam: t, middlewareService: r = [], serviceRes: i} = e, {url: a} = t;
        for (let e in r) {
            let o = r[e], {mode: s, enable: l = !0} = o;
            if (l && "onActionExecuted" === s && n.regExpTest(o.regExp, a)) {
                let e = await o.main(t, i);
                if (e) {
                    if (0 !== e.code) {
                        i = e;
                        break
                    }
                    i = Object.assign(i, e)
                }
            }
        }
        return i
    }, onActionIntercepted: async (e = {}) => {
        let {serviceParam: t, middlewareService: r = [], filterResponse: i} = e, {url: a} = t;
        for (let e in r) {
            let o = r[e], {mode: s, enable: l = !0} = o;
            if (l && "onActionIntercepted" === s && n.regExpTest(o.regExp, a)) {
                let e = await o.main(t, i);
                if (e) {
                    if (0 !== e.code) {
                        i = e;
                        break
                    }
                    i = Object.assign(i, e)
                }
            }
        }
        return i
    }, onActionError: async (e = {}) => {
        let {serviceParam: t, middlewareService: r = [], serviceRes: i} = e, {url: a} = t;
        for (let e in r) {
            let o = r[e], {mode: s, enable: l = !0} = o;
            if (l && "onActionError" === s && n.regExpTest(o.regExp, a)) {
                let e = await o.main(t, i);
                if (e) {
                    if (0 !== e.code) {
                        i = e;
                        break
                    }
                    i = Object.assign(i, e)
                }
            }
        }
        return i
    }, getMiddleware: function (e) {
        let t = [];
        if (e) {
            let n = [...a, ...e];
            n.sort((function (e, t) {
                return e.index - t.index
            })), t = n.filter((e, t, r) => {
                var i = [];
                return n.forEach((e, t) => {
                    i.push(e.id)
                }), i.indexOf(e.id) === t
            })
        } else t = a;
        return t
    }
}, l = {
    filterService: s, getQueryStringParameters: function (e) {
        let {event: t, vk: n} = e, r = {};
        if (t.httpMethod) {
            let {path: e = ""} = t;
            if ("/" === e[0] && (e = e.substring(1)), e) {
                let i, {urlrewrite: a = {}} = n.getUnicloud(), {rule: o} = a,
                    s = n.pubfn.getData(a, "config.accessOnlyInRule"), l = !1;
                if (o) for (let t in o) {
                    let r = o[t], a = n.pubfn.regExpExecToTemplate(e, t, r);
                    if (a) {
                        l = !0;
                        let t = a.split("?");
                        e = t[0], i = n.pubfn.urlStringToJson(t[1]);
                        break
                    }
                }
                if (!l && s) return {
                    mpserverlessComposedResponse: !0,
                    statusCode: 403,
                    code: 403,
                    headers: {"content-type": "application/json"},
                    body: JSON.stringify({code: 403, msg: "access denied"})
                };
                if (r = {data: {}}, n.pubfn.isNotNull(i) && (r.data = Object.assign(r.data, i)), t.queryStringParameters) {
                    let e = t.queryStringParameters;
                    "string" == typeof e && (e = JSON.parse(e)), r.data = Object.assign(r.data, e)
                }
                if (t.body) {
                    let e = t.body, i = t.headers && t.headers["content-type"] ? t.headers["content-type"] : "";
                    if (i.indexOf("multipart/form-data;") > -1) e = n.formDataUtil.formParser(t), r.data = Object.assign(r.data, e); else {
                        t.isBase64Encoded && (e = Buffer.from(e, "base64").toString("utf-8"));
                        try {
                            "string" == typeof e && (e = JSON.parse(e)), r.data = Object.assign(r.data, e)
                        } catch (e) {
                        }
                        try {
                            "string" == typeof e && i.indexOf("x-www-form-urlencoded") > -1 && (e = n.pubfn.urlStringToJson(e), "object" == typeof e && (e = n.pubfn.string2Number(e), r.data = Object.assign(r.data, e)))
                        } catch (e) {
                        }
                    }
                }
                r.$url || (r.data.$url ? r.$url = r.data.$url : r.$url = e), r.data.uni_id_token && (r.uni_id_token = r.data.uni_id_token, delete r.data.uni_id_token)
            } else {
                if (t.queryStringParameters) {
                    let e = t.queryStringParameters;
                    "string" == typeof e.data && (e.data = JSON.parse(e.data)), r = Object.assign(r, e)
                }
                if (t.body) {
                    let e = t.body;
                    t.isBase64Encoded && (e = Buffer.from(e, "base64").toString("utf-8"));
                    try {
                        "string" == typeof e && (e = JSON.parse(e)), r = Object.assign(r, e)
                    } catch (e) {
                    }
                }
            }
            try {
                let e = t.headers["uni-id-token"] || t.headers.uni_id_token;
                !r.uni_id_token && e && (r.uni_id_token = e)
            } catch (e) {
            }
        } else r = JSON.parse(JSON.stringify(t));
        return r.data || (r.data = {}), r.uniIdToken || (r.uniIdToken = r.uni_id_token), r.url = r.$url || "", r
    }, returnError: d, filterInterception: async function ({serviceParam: e, middlewareService: t, filterResponse: n}) {
        try {
            n = await s.onActionIntercepted({serviceParam: e, middlewareService: t, filterResponse: n})
        } catch (n) {
            return await d({
                code: 500,
                msg: `云函数 ${e.url} 的中间件 onActionIntercepted 运行异常!`,
                err: n,
                serviceParam: e,
                middlewareService: t
            })
        }
        return n
    }, requireService: async function (e = {}) {
        let t, {vk: n, serviceParam: r} = e, {
            url: i,
            data: a,
            uniIdToken: o,
            util: s,
            filterResponse: l = {},
            originalParam: c = {}
        } = r;
        if (i.indexOf(".") > -1) {
            let e, r = i.lastIndexOf("."), d = n.require("service/" + i.substring(0, r));
            if (t = n.pubfn.objectAssign({}, d), !t.isCloudObject) throw new Error("msg:禁止访问私有对象内的函数！");
            let u = i.substring(r + 1);
            if (0 == u.indexOf("_")) throw new Error("msg:禁止访问私有函数！");
            if ("function" != typeof t[u]) {
                try {
                    c.event && c.event.httpMethod && c.event.path && (i = c.event.path.substring(1))
                } catch (e) {
                }
                throw new Error(`msg:云函数【${i}】不存在！`)
            }
            Object.assign(t, {
                vk: n, methodName: u, isCloudObject: !0, getClientInfo: function () {
                    let {context: e = {}} = c;
                    return {
                        ...e,
                        os: e.OS,
                        appId: e.APPID,
                        locale: e.LOCALE,
                        clientIP: e.CLIENTIP,
                        userAgent: e.CLIENTUA,
                        platform: e.PLATFORM,
                        deviceId: e.DEVICEID,
                        source: e.SOURCE,
                        uniIdToken: o,
                        uid: l.uid,
                        userInfo: l.userInfo,
                        filterResponse: l,
                        originalParam: c
                    }
                }, getUserInfo: async function () {
                    if (l.userInfo && l.userInfo._id) return l.userInfo;
                    if (!e && l.uid) {
                        let t = await s.uniID.checkToken(o, {needUserInfo: !0});
                        if (0 !== t.code) throw new Error("msg:token失效：" + t.errMsg);
                        t.userInfo && t.userInfo._id && (delete t.userInfo.token, delete t.userInfo.password, e = t.userInfo)
                    }
                    return e
                }, getUtil: function () {
                    return s
                }, getMethodName: function () {
                    return u
                }, getParams: function () {
                    return a
                }, getCloudInfo: function () {
                    let {SPACEINFO: e = {}, FUNCTION_NAME: t, FUNCTION_TYPE: n} = c.context || {}, {
                        provider: r,
                        spaceId: i
                    } = e;
                    return {provider: r, spaceId: i, functionName: t, functionType: "cloudobject"}
                }, getUniIdToken: function () {
                    return o
                }, getUniCloudRequestId: function () {
                    return c.context.requestId
                }, getHttpInfo: function () {
                    return c.event
                }
            })
        } else t = n.require("service/" + i);
        return t
    }, serviceRun: async function (e = {}) {
        let t, {serviceParam: n = {}, serviceMain: r} = e, {filterResponse: i} = n;
        if (i.uid && (n.uid = i.uid), i.userInfo && (n.userInfo = i.userInfo), r.isCloudObject) {
            let {methodName: e = "main"} = r;
            if ("function" == typeof r._before) {
                let e = await r._before();
                if ("string" == typeof e) return {code: -1, msg: e};
                if ("object" == typeof e && 0 !== e.code) return {code: e.code, msg: e.msg};
                if ("boolean" == typeof e && !1 === e) return {code: -1, msg: ""}
            }
            if (t = await r[e](n.data), "function" == typeof r._after) {
                let e = await r._after({res: t || {}});
                "object" == typeof e && (t = e)
            }
        } else t = await r.main(n);
        return "object" == typeof t && (void 0 === t.vk_uni_token && "object" == typeof i && i.token && void 0 !== i.tokenExpired && (t.vk_uni_token = {
            token: i.token,
            tokenExpired: i.tokenExpired
        }), t = l.returnRes(t)), t
    }, errorCatch: async function (e = {}) {
        let {err: t, type: n, serviceParam: r, middlewareService: i, serviceMain: a = {}} = e, {
            url: o,
            originalParam: s = {}
        } = r;
        t || (t = {});
        let {code: l} = t, c = t.message || t.msg || t.errMsg || "";
        if ("run" === n && "function" == typeof a._after) {
            let e = await a._after({err: t});
            if (e) return e
        }
        let u = {code: 500, msg: c, err: t, serviceParam: r, middlewareService: i};
        try {
            s.event && s.event.httpMethod && s.event.path && (o = s.event.path.substring(1))
        } catch (t) {
        }
        return "MODULE_NOT_FOUND" == l && c.indexOf("service/") > -1 || "ENOENT" == l && c.indexOf("service") > -1 ? Object.assign(u, {
            code: 404,
            msg: `云函数 ${o} 不存在!`
        }) : "MODULE_NOT_FOUND" == l && c.indexOf("Cannot find module") > -1 ? Object.assign(u, {
            code: 500,
            msg: c
        }) : "InternalServerError" == l && c.indexOf("_id_ dup key") > -1 ? Object.assign(u, {
            code: 500,
            msg: "vk.baseDao.add : _id不能重复添加"
        }) : 0 === c.indexOf("Cannot read property 'mp-weixin' of undefined") ? Object.assign(u, {
            code: 501,
            msg: "请先绑定微信"
        }) : c.indexOf("Response timeout for 10000ms") > -1 ? Object.assign(u, {
            code: 502,
            msg: "timeout 请求超时，请重试！"
        }) : c.indexOf("msg:token失效") > -1 ? Object.assign(u, {
            code: 30202,
            errMsg: c,
            msg: c
        }) : c.indexOf("msg:禁止访问私有对象内的函数") > -1 || c.indexOf("msg:禁止访问私有函数") > -1 ? Object.assign(u, {
            code: 403,
            msg: c.substring(4)
        }) : 0 === c.indexOf("msg:") ? Object.assign(u, {
            code: 501,
            msg: c.substring(4)
        }) : "Error" === t.name ? Object.assign(u, {
            code: 501,
            msg: c
        }) : "ReferenceError" === t.name ? Object.assign(u, {
            code: 501,
            msg: `云函数 ${o} 变量引用错误：${c}`
        }) : "TypeError" === t.name ? Object.assign(u, {
            code: 501,
            msg: `云函数 ${o} 运行异常，类型错误：${c}`
        }) : t.stack ? Object.assign(u, {
            code: 500,
            msg: "require" == n ? `云函数 ${o} 编译异常!` : `云函数 ${o} 运行异常!`
        }) : "string" == typeof t ? Object.assign(u, {code: -1, msg: t}) : Object.assign(u, t), await d(u)
    }, returnRes: function (e = {}) {
        return "object" == typeof e && (void 0 !== e.code || void 0 !== e.errCode && (e.code = e.errCode, e.msg = e.errMsg)), e
    }
}, c = l;

async function d(e = {}) {
    let {code: t, msg: n, err: r, serviceParam: i, middlewareService: a} = e;
    console.error(n);
    let o = {code: t, msg: n};
    r && (r.stack ? (console.error(r.stack), o.err = {message: r.message, stack: r.stack, code: r.code}) : o.err = r);
    try {
        o.requestId = i.originalParam.context.requestId
    } catch (r) {
    }
    let c = await s.onActionError({serviceParam: i, middlewareService: a, serviceRes: o});
    return l.returnRes(c)
}

try {
    process.env.TZ = "Asia/Shanghai"
} catch (e) {
}
var u = async function (e) {
    let {event: t, context: n, vk: r} = e;
    !r && this && (r = this);
    let {
        config: i,
        uniID: a,
        uniPay: o,
        db: s,
        middlewareService: l,
        pubFun: d,
        customUtil: u,
        crypto: p
    } = r.getUnicloud();
    if (r.pubfn.getData(i, "vk.system.serviceShutdown")) return c.returnRes({
        code: 405,
        msg: r.pubfn.getData(i, "vk.system.serviceShutdownDescription")
    });
    if (["h5", "web"].indexOf(n.PLATFORM) > -1) {
        let e = r.pubfn.getUniIdConfig(i, "preferedWebPlatform", "h5");
        n.PLATFORM = e
    } else if (["app-plus", "app"].indexOf(n.PLATFORM) > -1) {
        let e = r.pubfn.getUniIdConfig(i, "preferedAppPlatform", "app-plus");
        n.PLATFORM = e
    }
    let f = {event: t, context: n}, g = c.getQueryStringParameters(e), {url: m, data: h, uniIdToken: y} = g;
    if ([403].indexOf(g.code) > -1) return c.returnRes(g);
    if (m && "function" == typeof m.trim && (m = m.trim()), h) {
        h.vk_appid && (n.APPID = h.vk_appid), h.vk_platform && (n.PLATFORM = h.vk_platform), h.vk_locale && (n.LOCALE = h.vk_locale);
        let e = {};
        if ("object" == typeof t.headers && (t.headers["vk-appid"] && (e.appid = t.headers["vk-appid"]), t.headers["vk-platform"] && (e.platform = t.headers["vk-platform"]), t.headers["vk-locale"] && (e.locale = t.headers["vk-locale"]), t.headers["vk-clientIP"] && (e.clientIP = t.headers["vk-clientIP"]), "object" == typeof h.vk_context && (e = r.pubfn.objectAssign(e, h.vk_context), delete h.vk_context)), "object" == typeof e && r.pubfn.isNotNull(e) && (e.appid && (n.APPID = e.appid), e.platform && (n.PLATFORM = e.platform), e.locale && (n.LOCALE = e.locale), e.clientIP && !n.CLIENTIP && (n.CLIENTIP = e.clientIP)), r.pubfn.isNullOne(n.APPID, n.PLATFORM)) {
            let e = r.pubfn.getData(i, "vk.context");
            r.pubfn.isNotNull(e) && (n.APPID || (n.APPID = e.APPID), n.PLATFORM || (n.PLATFORM = e.PLATFORM), n.LOCALE || (n.LOCALE = e.LOCALE), n.CLIENTIP || (n.CLIENTIP = e.CLIENTIP))
        }
    }
    const b = a.createInstance({context: n});
    s.command.$ = s.command.aggregate;
    let w = {
        vk: r,
        config: i,
        pubFun: d,
        uniID: b,
        uniPay: o,
        db: s,
        _: s.command,
        $: s.command.aggregate,
        customUtil: u,
        crypto: p,
        env: {APPID: n.APPID, PLATFORM: n.PLATFORM}
    };
    try {
        uniCloud.vk = r, uniCloud.env = w.env
    } catch (e) {
    }
    let k = {url: m, data: h, uniIdToken: y, util: w, originalParam: f};
    const _ = c.filterService.getMiddleware(l);
    try {
        let e = await c.filterService.onActionExecuting({serviceParam: k, middlewareService: _});
        if (0 !== e.code) return c.returnRes(await c.filterInterception({
            serviceParam: k,
            middlewareService: _,
            filterResponse: e
        }));
        delete h.uid, e.uid && (h.uid = e.uid), k.filterResponse = e
    } catch (e) {
        return await c.returnError({
            code: 500,
            msg: `云函数 ${m} 的中间件 onActionExecuting 运行异常!`,
            err: e,
            serviceParam: k,
            middlewareService: _
        })
    }
    let v, N;
    try {
        v = await c.requireService({vk: r, serviceParam: k})
    } catch (e) {
        return await c.errorCatch({err: e, type: "require", serviceParam: k, middlewareService: _})
    }
    try {
        N = await c.serviceRun({serviceParam: k, serviceMain: v})
    } catch (e) {
        return await c.errorCatch({err: e, type: "run", serviceParam: k, middlewareService: _, serviceMain: v})
    }
    try {
        N = await c.filterService.onActionExecuted({serviceParam: k, middlewareService: _, serviceRes: N})
    } catch (e) {
        return await c.returnError({
            code: 500,
            msg: `云函数 ${m} 的中间件 onActionExecuted 运行异常!`,
            err: e,
            serviceParam: k,
            middlewareService: _
        })
    }
    return c.returnRes(N)
};

function p(e, t, n, r, i, a) {
    return y((o = y(y(t, e), y(r, a))) << (s = i) | o >>> 32 - s, n);
    var o, s
}

function f(e, t, n, r, i, a, o) {
    return p(t & n | ~t & r, e, t, i, a, o)
}

function g(e, t, n, r, i, a, o) {
    return p(t & r | n & ~r, e, t, i, a, o)
}

function m(e, t, n, r, i, a, o) {
    return p(t ^ n ^ r, e, t, i, a, o)
}

function h(e, t, n, r, i, a, o) {
    return p(n ^ (t | ~r), e, t, i, a, o)
}

function y(e, t) {
    var n = (65535 & e) + (65535 & t);
    return (e >> 16) + (t >> 16) + (n >> 16) << 16 | 65535 & n
}

var b = function (e) {
    return function (e) {
        for (var t = "", n = 0; n < 4 * e.length; n++) t += "0123456789abcdef".charAt(e[n >> 2] >> n % 4 * 8 + 4 & 15) + "0123456789abcdef".charAt(e[n >> 2] >> n % 4 * 8 & 15);
        return t
    }(function (e, t) {
        e[t >> 5] |= 128 << t % 32, e[14 + (t + 64 >>> 9 << 4)] = t;
        for (var n = 1732584193, r = -271733879, i = -1732584194, a = 271733878, o = 0; o < e.length; o += 16) {
            var s = n, l = r, c = i, d = a;
            n = f(n, r, i, a, e[o + 0], 7, -680876936), a = f(a, n, r, i, e[o + 1], 12, -389564586), i = f(i, a, n, r, e[o + 2], 17, 606105819), r = f(r, i, a, n, e[o + 3], 22, -1044525330), n = f(n, r, i, a, e[o + 4], 7, -176418897), a = f(a, n, r, i, e[o + 5], 12, 1200080426), i = f(i, a, n, r, e[o + 6], 17, -1473231341), r = f(r, i, a, n, e[o + 7], 22, -45705983), n = f(n, r, i, a, e[o + 8], 7, 1770035416), a = f(a, n, r, i, e[o + 9], 12, -1958414417), i = f(i, a, n, r, e[o + 10], 17, -42063), r = f(r, i, a, n, e[o + 11], 22, -1990404162), n = f(n, r, i, a, e[o + 12], 7, 1804603682), a = f(a, n, r, i, e[o + 13], 12, -40341101), i = f(i, a, n, r, e[o + 14], 17, -1502002290), r = f(r, i, a, n, e[o + 15], 22, 1236535329), n = g(n, r, i, a, e[o + 1], 5, -165796510), a = g(a, n, r, i, e[o + 6], 9, -1069501632), i = g(i, a, n, r, e[o + 11], 14, 643717713), r = g(r, i, a, n, e[o + 0], 20, -373897302), n = g(n, r, i, a, e[o + 5], 5, -701558691), a = g(a, n, r, i, e[o + 10], 9, 38016083), i = g(i, a, n, r, e[o + 15], 14, -660478335), r = g(r, i, a, n, e[o + 4], 20, -405537848), n = g(n, r, i, a, e[o + 9], 5, 568446438), a = g(a, n, r, i, e[o + 14], 9, -1019803690), i = g(i, a, n, r, e[o + 3], 14, -187363961), r = g(r, i, a, n, e[o + 8], 20, 1163531501), n = g(n, r, i, a, e[o + 13], 5, -1444681467), a = g(a, n, r, i, e[o + 2], 9, -51403784), i = g(i, a, n, r, e[o + 7], 14, 1735328473), r = g(r, i, a, n, e[o + 12], 20, -1926607734), n = m(n, r, i, a, e[o + 5], 4, -378558), a = m(a, n, r, i, e[o + 8], 11, -2022574463), i = m(i, a, n, r, e[o + 11], 16, 1839030562), r = m(r, i, a, n, e[o + 14], 23, -35309556), n = m(n, r, i, a, e[o + 1], 4, -1530992060), a = m(a, n, r, i, e[o + 4], 11, 1272893353), i = m(i, a, n, r, e[o + 7], 16, -155497632), r = m(r, i, a, n, e[o + 10], 23, -1094730640), n = m(n, r, i, a, e[o + 13], 4, 681279174), a = m(a, n, r, i, e[o + 0], 11, -358537222), i = m(i, a, n, r, e[o + 3], 16, -722521979), r = m(r, i, a, n, e[o + 6], 23, 76029189), n = m(n, r, i, a, e[o + 9], 4, -640364487), a = m(a, n, r, i, e[o + 12], 11, -421815835), i = m(i, a, n, r, e[o + 15], 16, 530742520), r = m(r, i, a, n, e[o + 2], 23, -995338651), n = h(n, r, i, a, e[o + 0], 6, -198630844), a = h(a, n, r, i, e[o + 7], 10, 1126891415), i = h(i, a, n, r, e[o + 14], 15, -1416354905), r = h(r, i, a, n, e[o + 5], 21, -57434055), n = h(n, r, i, a, e[o + 12], 6, 1700485571), a = h(a, n, r, i, e[o + 3], 10, -1894986606), i = h(i, a, n, r, e[o + 10], 15, -1051523), r = h(r, i, a, n, e[o + 1], 21, -2054922799), n = h(n, r, i, a, e[o + 8], 6, 1873313359), a = h(a, n, r, i, e[o + 15], 10, -30611744), i = h(i, a, n, r, e[o + 6], 15, -1560198380), r = h(r, i, a, n, e[o + 13], 21, 1309151649), n = h(n, r, i, a, e[o + 4], 6, -145523070), a = h(a, n, r, i, e[o + 11], 10, -1120210379), i = h(i, a, n, r, e[o + 2], 15, 718787259), r = h(r, i, a, n, e[o + 9], 21, -343485551), n = y(n, s), r = y(r, l), i = y(i, c), a = y(a, d)
        }
        return Array(n, r, i, a)
    }(function (e) {
        for (var t = Array(), n = 0; n < 8 * e.length; n += 8) t[n >> 5] |= (255 & e.charCodeAt(n / 8)) << n % 32;
        return t
    }(e), 8 * e.length))
}, w = {}, k = {
    init: function (e) {
        w = e
    }, add: async function (e) {
        let {db: t, _: n, vk: r, config: i} = w, {
            dbName: a,
            dataJson: o,
            db: s,
            cancelAddTime: l,
            cancelAddTimeStr: c
        } = e;
        if (r.pubfn.isNull(a)) throw new Error("vk.baseDao.add 中 dbName 不能为空");
        if (r.pubfn.isNull(o)) throw new Error("vk.baseDao.add 中 dataJson 不能为空");
        let d = s || t;
        if (!o._add_time) {
            let e = r.pubfn.getData(i, "vk.db.unicloud.cancelAddTime");
            void 0 === l && e && (l = e);
            let t = r.pubfn.getData(i, "vk.db.unicloud.cancelAddTimeStr");
            if (void 0 === c && t && (c = t), !l) {
                let e = new Date;
                o._add_time = e.getTime(), c || (o._add_time_str = r.pubfn.timeFormat(e, "yyyy-MM-dd hh:mm:ss"))
            }
        }
        let u = await d.collection(a).add(o);
        return u.id ? u.id : null
    }, adds: async function (e) {
        let {db: t, _: n, vk: r, config: i} = w, {
            dbName: a,
            dataJson: o,
            db: s,
            cancelAddTime: l,
            cancelAddTimeStr: c
        } = e;
        if (r.pubfn.isNull(a)) throw new Error("vk.baseDao.adds 中 dbName 不能为空");
        if (r.pubfn.isNull(o)) throw new Error("vk.baseDao.adds 中 dataJson 不能为空");
        if ("[object Array]" !== Object.prototype.toString.call(o)) throw new Error("vk.baseDao.adds 中 dataJson 必须是数组对象");
        let d = s || t, u = r.pubfn.getData(i, "vk.db.unicloud.cancelAddTime");
        void 0 === l && u && (l = u);
        let p = r.pubfn.getData(i, "vk.db.unicloud.cancelAddTimeStr");
        if (void 0 === c && p && (c = p), !l) {
            let e = new Date, t = e.getTime(), n = r.pubfn.timeFormat(e, "yyyy-MM-dd hh:mm:ss");
            for (let e in o) o[e]._add_time || (o[e]._add_time = t, c || (o[e]._add_time_str = n))
        }
        let f = await d.collection(a).add(o);
        return f.ids ? f.ids : f.id ? f.id : null
    }, del: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, whereJson: a, db: o} = e, s = o || n, l = 0;
        if (t.pubfn.isNotNull(a)) {
            let e = await s.collection(i).where(a).remove();
            e ? l = e.deleted : (console.error(e.errMsg), l = -1)
        } else console.error("whereJson条件不能为空");
        return l
    }, delete: async function (e) {
        return await k.del(e)
    }, remove: async function (e) {
        return await k.del(e)
    }, deleteById: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, id: a, db: o} = e, s = o || n, l = 0;
        if (t.pubfn.isNull(a)) throw new Error("deleteById的id不能为空,且必须是字符串");
        let c = await s.collection(i).doc(a).remove();
        return c ? l = c.deleted : (console.error(c.errMsg), l = 0), l
    }, update: async function (e) {
        let t, {vk: n, db: r, _: i} = w, {dbName: a, whereJson: o, dataJson: s, db: l} = e, c = l || r, d = 0;
        if (n.pubfn.isNull(o)) throw new Error("update的whereJson不能为空，且必须是对象形式");
        if (n.pubfn.isNull(s)) throw new Error("update的dataJson不能为空，且必须是对象形式");
        return s._id && delete s._id, t = void 0 === o ? await c.collection(a).update(s) : await c.collection(a).where(o).update(s), t ? d = t.updated : console.error(t.errMsg), d
    }, updateById: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, id: a, dataJson: o, getUpdateData: s, db: l} = e, c = l || n, d = 0;
        if (t.pubfn.isNull(a)) throw new Error("updateById的id不能为空，且必须是字符串");
        if (t.pubfn.isNull(o)) throw new Error("updateById的dataJson不能为空，且必须是对象形式");
        o._id === a && delete o._id;
        let u = await c.collection(i).doc(a).update(o);
        return s ? u ? await k.findById({
            db: c,
            dbName: i,
            id: a
        }) : null : (u ? d = u.updated : (console.error(u.errMsg), d = 0), d)
    }, updateAndReturn: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, id: a, whereJson: o, dataJson: s, db: l} = e, c = l || n;
        if (t.pubfn.isNullAll(a, o)) throw new Error("updateAndReturn的id和whereJson两者不能都为空");
        if (t.pubfn.isNull(s)) throw new Error("updateAndReturn的dataJson不能为空，且必须是对象形式");
        if (s._id && delete s._id, t.pubfn.isNotNull(a)) {
            return (await c.collection(i).doc(a).updateAndReturn(s)).doc
        }
        if (t.pubfn.isNotNull(o)) {
            return (await c.collection(i).where(o).updateAndReturn(s)).doc
        }
        throw new Error("updateAndReturn的id和whereJson两者不能都为空")
    }, select: async function (e = {}) {
        let {vk: t, db: n, _: r} = w;
        "string" == typeof e.pageIndex && (e.pageIndex = parseInt(e.pageIndex)), "string" == typeof e.pageSize && (e.pageSize = parseInt(e.pageSize));
        let {dbName: i, whereJson: a, pageSize: o = 10, getOne: s = !1, getMain: l = !1} = e;
        if (o <= 0 && (o = 999999999), o > 500) return await k.selectAll(e);
        let c = await k.getSelectData(e), {
            result: d,
            hasMore: u,
            total: p,
            getCount: f,
            pageIndex: g,
            fieldJson: m
        } = c;
        return d = d.skip((g - 1) * o).limit(o), t.pubfn.isNotNull(m) && (d = d.field(m)), d.get().then(e => {
            let t = {};
            return f ? (t.total = p, t.hasMore = u) : (t.total = e.data ? e.data.length : 0, t.hasMore = t.total >= o), t.rows = e.data, t.code = 0, t.msg = "查询成功", t.pagination = {
                pageIndex: g,
                pageSize: o
            }, s && (t.rows = t.rows[0]), l ? t.rows : t
        })
    }, findById: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, id: a, fieldJson: o, db: s} = e, l = (s || n).collection(i).doc(a);
        o && (l = l.field(o));
        let c = await l.get();
        return "[object Array]" === Object.prototype.toString.call(c.data) ? c.data[0] : c.data
    }, findByWhereJson: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, whereJson: a, fieldJson: o, sortArr: s, db: l} = e, c = l || n;
        if (t.pubfn.isNotNull(a)) {
            let e = c.collection(i).where(a);
            if (s) for (let t in s) {
                let n = s[t], r = n.name, i = n.type;
                null != i && "" != i || (i = "asc"), e = e.orderBy(r, i)
            }
            o && (e = e.field(o));
            let t = await e.limit(1).get();
            if (t.data && t.data.length > 0) return t.data[0]
        } else console.error("whereJson条件不能为空");
        return null
    }, count: async function (e) {
        let t, {vk: n, db: r, _: i} = w, {
            dbName: a,
            whereJson: o,
            foreignDB: s,
            foreignKey: l,
            groupJson: c,
            lastWhereJson: d,
            db: u
        } = e, p = u || r;
        if (n.pubfn.isNotNull(s) || n.pubfn.isNotNull(c)) {
            let e = p.collection(a).aggregate();
            return n.pubfn.isNotNull(o) && e.match(o), n.pubfn.isNotNull(c) && e.group(c), n.pubfn.isNotNull(s) && (e = k.addForeignDB({
                foreignDB: s,
                foreignKey: l,
                result: e
            })), n.pubfn.isNotNull(d) && (e = e.match(d)), e = await e.count("total").end(), e.data[0] ? e.data[0].total : 0
        }
        return t = n.pubfn.isNotNull(o) ? await p.collection(a).where(o).count() : await p.collection(a).count(), t.total
    }, getSelectData: async function (e) {
        let {vk: t, db: n, _: r} = w, {
            dbName: i,
            whereJson: a,
            pageIndex: o = 1,
            pageSize: s = 10,
            getCount: l = !1,
            db: c
        } = e;
        s < 0 && (o = 1, s = 999999999, l = !0);
        let d = c || n, u = e.sortArr, p = e.fieldJson, f = 0, g = !1;
        if (l) {
            let e;
            e = t.pubfn.isNotNull(a) ? await d.collection(i).where(a).count() : await d.collection(i).count(), f = e.total, o < Math.ceil(f / s) && (g = !0)
        }
        let m = d.collection(i);
        if (t.pubfn.isNotNull(a) && (m = m.where(a)), t.pubfn.isNotNull(u)) for (let e in u) {
            let t = u[e], n = t.name, r = t.type;
            null != r && "" != r || (r = "asc"), m = m.orderBy(n, r)
        }
        return {
            result: m,
            dbName: i,
            whereJson: a,
            pageIndex: o,
            pageSize: s,
            getCount: l,
            sortArr: u,
            fieldJson: p,
            total: f,
            hasMore: g
        }
    }, selectAll: async function (e) {
        let {db: t, _: n, vk: r, config: i} = w, {dbName: a, getOne: o = !1, getMain: s = !1} = e, l = 500;
        r.pubfn.getData(i, "vk.db.unicloud.maxLimit") && (l = r.pubfn.getData(i, "vk.db.unicloud.maxLimit"), l <= 0 && (l = 500), l > 1e3 && (l = 1e3));
        let c = await k.getSelectData(e), {
            result: d,
            hasMore: u,
            total: p,
            getCount: f,
            pageIndex: g,
            pageSize: m,
            fieldJson: h
        } = c;
        m > 0 && !p && !f && (p = m), r.pubfn.isNotNull(h) && (d = d.field(h));
        let y = {};
        if (f && 0 === p) y = {data: []}; else {
            let t = p;
            m < p && (t = m);
            let n = Math.ceil(t / l), r = [], i = (g - 1) * m, a = i + m;
            for (let e = 0; e < n; e++) {
                let t = i + e * l, n = l;
                t + l > a && (n = a - t);
                let o = d.skip(t).limit(n).get();
                r.push(o)
            }
            try {
                y = (await Promise.all(r)).reduce((e, t) => ({data: e.data.concat(t.data), errMsg: e.errMsg}))
            } catch (t) {
                throw console.error("vk.baseDao.select-异常", e, t), new Error("msg:vk.baseDao.select-异常")
            }
        }
        let b = {};
        return b.total = f ? p : y.data ? y.data.length : 0, b.hasMore = u, b.rows = y.data, b.code = 0, b.msg = "查询成功", b.pagination = {
            pageIndex: g,
            pageSize: m
        }, o && (b.rows = b.rows[0]), s ? b.rows : b
    }, sum: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, fieldName: a, whereJson: o, db: s} = e, l = s || n;
        const c = l.command.aggregate;
        let d = l.collection(i).aggregate();
        t.pubfn.isNotNull(o) && d.match(o), d.group({_id: null, num: c.sum("$" + a)});
        let u = await d.end();
        return u.data && u.data[0] ? u.data[0].num : 0
    }, avg: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, fieldName: a, whereJson: o, db: s} = e, l = s || n;
        const c = l.command.aggregate;
        let d = l.collection(i).aggregate();
        t.pubfn.isNotNull(o) && d.match(o), d.group({_id: null, num: c.avg("$" + a)});
        let u = await d.end();
        return u.data && u.data[0] ? u.data[0].num : null
    }, max: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, fieldName: a, whereJson: o, db: s} = e, l = s || n;
        const c = l.command.aggregate;
        let d = l.collection(i).aggregate();
        t.pubfn.isNotNull(o) && d.match(o), d.group({_id: null, num: c.max("$" + a)});
        let u = await d.end();
        return u.data && u.data[0] ? u.data[0].num : null
    }, min: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, fieldName: a, whereJson: o, db: s} = e, l = s || n;
        const c = l.command.aggregate;
        let d = l.collection(i).aggregate();
        t.pubfn.isNotNull(o) && d.match(o), d.group({_id: null, num: c.min("$" + a)});
        let u = await d.end();
        return u.data && u.data[0] ? u.data[0].num : null
    }, sample: async function (e) {
        let {vk: t, db: n, _: r} = w, {dbName: i, whereJson: a, size: o, fieldJson: s, db: l} = e, c = l || n;
        c.command.aggregate;
        let d = c.collection(i).aggregate();
        return t.pubfn.isNotNull(a) && d.match(a), d.sample({size: o}), t.pubfn.isNotNull(s) && d.project(s), (await d.end()).data
    }, selects: async function (e = {}) {
        let {vk: t, db: n, _: r} = w;
        if (t.pubfn.isNotNull(e.treeProps)) return await k.tree(e);
        "string" == typeof e.pageIndex && (e.pageIndex = parseInt(e.pageIndex)), "string" == typeof e.pageSize && (e.pageSize = parseInt(e.pageSize));
        let {
            db: i,
            dbName: a,
            foreignKey: o = "_id",
            pageIndex: s = 1,
            pageSize: l = 10,
            getCount: c = !1,
            getOne: d = !1,
            getMain: u = !1,
            whereJson: p = {},
            unwindJson: f,
            groupJson: g,
            sortArr: m = [],
            foreignDB: h = [],
            lastWhereJson: y,
            lastSortArr: b = [],
            fieldJson: _ = {},
            addFields: v
        } = e, N = i || n;
        -1 == l && (s = 1, l = 999999999, c = !1), d && (l = 1, c = !1);
        let x, T = 0, D = !1;
        if (t.pubfn.isNotNull(p)) for (let e in p) p[e] && "object" == typeof p[e] && "geoNear" === p[e].operator && (x = t.pubfn.copyObject(p[e]), x.keyName = e, x.limit = s * l, delete p[e]);
        if (c) {
            if (t.pubfn.isNullAll(g, f, y)) {
                let e;
                e = t.pubfn.isNotNull(p) ? await N.collection(a).where(p).count() : await N.collection(a).count(), T = e.total
            } else {
                let e = N.collection(a).aggregate();
                t.pubfn.isNotNull(p) && (t.pubfn.isNotNull(x) ? e = k.getGeoNearJson({
                    runDB: N,
                    result: e,
                    geoNearJson: x,
                    whereJson: p
                }) : e.match(p)), t.pubfn.isNotNull(f) && (e = k.getTnwind({
                    result: e,
                    unwindJson: f
                })), t.pubfn.isNotNull(g) && e.group(g), t.pubfn.isNotNull(y) && (t.pubfn.isNotNull(h) && (e = k.addForeignDB({
                    foreignDB: h,
                    foreignKey: o,
                    result: e
                })), e.match(y)), e = await e.count("total").end(), T = e.data[0] ? e.data[0].total : 0
            }
            s < Math.ceil(T / l) && (D = !0)
        }
        let O = {};
        r.aggregate;
        let I = N.collection(a).aggregate();
        I = t.pubfn.isNotNull(x) ? k.getGeoNearJson({
            runDB: N,
            result: I,
            geoNearJson: x,
            whereJson: p
        }) : I.match(p), t.pubfn.isNotNull(f) && (I = k.getTnwind({
            result: I,
            unwindJson: f
        })), t.pubfn.isNotNull(g) && (I = I.group(g)), t.pubfn.isNotNull(m) && (I = k.getSortArr({
            result: I,
            sortArr: m
        }));
        let S = t.pubfn.isNullAll(y, b);
        S && (I = I.skip((s - 1) * l).limit(l)), I = k.addForeignDB({
            foreignDB: h,
            foreignKey: o,
            result: I
        }), t.pubfn.isNotNull(y) && (I = I.match(y)), t.pubfn.isNotNull(b) && (I = k.getSortArr({
            result: I,
            sortArr: b
        })), S || (I = I.skip((s - 1) * l).limit(l)), t.pubfn.isNotNull(_) && (_ = k.foreignDBToProject({
            fieldJson: _,
            foreignDB: h,
            foreignKey: o
        }), I = I.project(_)), t.pubfn.isNotNull(v) && (I = I.addFields(v)), I = await I.end();
        let A = I.data;
        return c ? (O.total = T, O.hasMore = D) : (O.total = A ? A.length : 0, O.hasMore = T >= l), O.rows = A, O.code = 0, O.msg = "查询成功", O.pagination = {
            pageIndex: s,
            pageSize: l
        }, d && (O.rows = O.rows[0]), u ? O.rows : O
    }, listToObjectByLimit1: function (e) {
        let {vk: t, db: n, _: r} = w, {list: i, foreignDB: a} = e;
        if (t.pubfn.isNotNull(a)) for (let e in i) for (let n in a) {
            let {as: r, limit: o, foreignDB: s, dbName: l} = a[n];
            r || (r = l), t.pubfn.isNotNull(s) && (i[e][r] = k.listToObjectByLimit1({
                list: i[e][r],
                foreignDB: s
            })), 1 === o && (t.pubfn.isArray(i[e][r]) ? i[e][r] && i[e][r].length > 0 ? i[e][r] = i[e][r][0] : i[e][r] = {} : void 0 === i[e][r] && (i[e][r] = {}))
        }
        return i
    }, addForeignDB: function (e) {
        let {vk: t, db: n, _: r} = w, {foreignDB: i, foreignKey: a, result: o} = e;
        const s = r.aggregate;
        for (let e in i) {
            let n, {
                dbName: l,
                foreignKey: c,
                localKey: d,
                localKeyType: u = "",
                foreignKeyType: p = "",
                as: f,
                limit: g,
                getOne: m,
                whereJson: h,
                fieldJson: y,
                sortArr: b,
                foreignDB: w,
                addFields: _
            } = i[e];
            f || (f = l), n = t.pubfn.isNotNull(d) ? d : "object" == typeof a ? a[e] : a;
            let v, N = "string" == typeof n ? "$" + n : n, x = "string" == typeof c ? "$" + c : c,
                T = "$$foreignKey" + k.getForeignKeyName(n), D = "foreignKey" + k.getForeignKeyName(n);
            v = "array" === u.toLowerCase() ? [s.cond({
                if: s.isArray(T),
                then: s.in([x, T]),
                else: s.eq([x, T])
            })] : "array" === p.toLowerCase() ? [s.cond({
                if: s.isArray(x),
                then: s.in([T, x]),
                else: s.eq([x, T])
            })] : [s.eq([x, T])];
            let O = s.pipeline().match(r.expr(s.and(v)));
            if (t.pubfn.isNotNull(h) && (O = O.match(h)), t.pubfn.isNotNull(b)) {
                let e = {};
                for (let t in b) {
                    let n = b[t], r = n.name, i = n.type;
                    i = null == i || "" == i || "asc" == i ? 1 : -1, e[r] = i
                }
                O = O.sort(e)
            }
            g && (O = O.limit(g)), t.pubfn.isNotNull(w) && (O = k.addForeignDB({
                foreignDB: w,
                result: O
            })), t.pubfn.isNotNull(y) && (y = k.foreignDBToProject({
                fieldJson: y,
                foreignDB: w
            }), O = O.project(y)), t.pubfn.isNotNull(_) && (O = O.addFields(_)), O = O.done();
            let I = {};
            I[D] = N;
            let S = {from: l, let: I, pipeline: O, as: f};
            o = o.lookup(S), (1 === g && !1 !== m || !0 === m) && (o = o.unwind({
                path: "$" + f,
                preserveNullAndEmptyArrays: !0
            }))
        }
        return o
    }, getForeignKeyName: function (e) {
        return "string" == typeof e ? e.replace(new RegExp("\\.", "g"), "__") : "__vk__foreignKey1"
    }, addWhereJson: function (e, t = {}, n = "whereJson") {
        let {vk: r, db: i, _: a} = w, {formData: o, columns: s} = e;
        for (let e in s) {
            let i, l = s[e], {
                key: c,
                mode: d,
                defaultValue: u,
                type: p = "",
                lastWhereJson: f,
                auxiliary: g = !0,
                trim: m = !0,
                isNumber: h = !1
            } = l;
            if ("lastWhereJson" === n && !f) continue;
            if ("lastWhereJson" !== n && f) continue;
            let y = c;
            if (r.pubfn.isNotNull(l.fieldName) && (y = l.fieldName), i = r.pubfn.isNotNull(l.value) ? l.value : o[c], r.pubfn.isNull(i) && r.pubfn.isNotNull(u) && (i = u), r.pubfn.isNull(d) && (d = ["address", "province", "city", "area"].indexOf(p) > -1 ? "address" : "[object Array]" === Object.prototype.toString.call(i) && i.length >= 2 ? "[]" : "="), r.pubfn.isNotNull(i)) if ("string" == typeof i && m && "function" == typeof i.trim && (i = i.trim()), h && !isNaN(i) && (i = Number(i)), "custom" === d) ; else if ("%%" === d) try {
                t[y] = new RegExp(i)
            } catch (e) {
            } else if ("%*" === d) try {
                t[y] = new RegExp("^" + i)
            } catch (e) {
            } else if ("*%" === d) try {
                t[y] = new RegExp(i + "$")
            } catch (e) {
            } else if (">" === d) t[y] = t[y] ? t[y].gt(i) : a.gt(i); else if (">=" === d) t[y] = t[y] ? t[y].gte(i) : a.gte(i); else if ("<" === d) t[y] = t[y] ? t[y].lt(i) : a.lt(i); else if ("<=" === d) t[y] = t[y] ? t[y].lte(i) : a.lte(i); else if ("in" === d) t[y] = a.in(i); else if ("nin" === d) t[y] = a.nin(i); else if ("!=" === d) t[y] = a.neq(i); else if ("[]" === d) t[y] = a.gte(i[0]).lte(i[1]); else if ("[)" === d) t[y] = a.gte(i[0]).lt(i[1]); else if ("(]" === d) t[y] = a.gt(i[0]).lte(i[1]); else if ("()" === d) t[y] = a.gt(i[0]).lt(i[1]); else if ("address" === d) {
                let e = {};
                i.province && i.province.code && (e["province.code"] = i.province.code), i.city && i.city.code && (e["city.code"] = i.city.code), i.area && i.area.code && (e["area.code"] = i.area.code), t[y] = e
            } else t[y] = g ? "___empty-array___" === i ? [] : "___empty-object___" === i ? {} : "___non-existent___" === i ? a.exists(!1) : "___existent___" === i ? a.exists(!0) : i : i
        }
        return t
    }, addLastWhereJson: function (e, t = {}) {
        return k.addWhereJson(e, t, "lastWhereJson")
    }, getTableData: async function (e) {
        let {vk: t, db: n, _: r, config: i} = w, {
            db: a,
            dbName: o,
            data: s = {},
            getCount: l = !0,
            getMain: c,
            whereJson: d,
            unwindJson: u,
            fieldJson: p,
            sortArr: f,
            treeProps: g,
            groupJson: m,
            foreignKey: h,
            foreignDB: y,
            lastWhereJson: b,
            lastSortArr: _
        } = e, {pageIndex: v, pageSize: N, pagination: x, sortRule: T, lastSortRule: D, formData: O, columns: I} = s;
        x && (v = x.pageIndex, N = x.pageSize);
        let S, A = {}, E = {}, $ = [], C = {};
        if (t.pubfn.isNotNull(f)) $ = f; else {
            let e = t.pubfn.getData(i, "vk.db.unicloud.getTableData.sortArr");
            t.pubfn.isNotNull(e) ? $ = e : $.push({name: "_id", type: "desc"})
        }
        if (t.pubfn.isNotNull(T) && ($ = T), t.pubfn.isNotNull(D) && (_ = D), E = k.addWhereJson(s), C = k.addLastWhereJson(s), t.pubfn.isNotNull(d) && (d.operator && d.operands && ["or", "and"].indexOf(d.operator) > -1 ? E = r.and([E, d]) : t.pubfn.objectAssign(E, d)), t.pubfn.isNotNull(p) && t.pubfn.objectAssign(A, p), t.pubfn.isNotNull(b) && t.pubfn.objectAssign(C, b), t.pubfn.isNotNull(E)) for (let e in E) "object" == typeof E[e] && E[e] && "geoNear" === E[e].operator && (S = !0);
        return t.pubfn.isNullAll(y, m, g, u, S) ? await t.baseDao.select({
            db: a,
            dbName: o,
            getMain: c,
            getCount: l,
            pageIndex: v,
            pageSize: N,
            fieldJson: A,
            whereJson: E,
            sortArr: $
        }) : await t.baseDao.selects({
            db: a,
            dbName: o,
            foreignKey: h,
            getMain: c,
            getCount: l,
            pageIndex: v,
            pageSize: N,
            whereJson: E,
            unwindJson: u,
            fieldJson: A,
            sortArr: $,
            treeProps: g,
            groupJson: m,
            foreignDB: y,
            lastWhereJson: C,
            lastSortArr: _
        })
    }, startTransaction: async function (e) {
        let {vk: t, db: n, _: r} = w;
        return await n.startTransaction()
    }, rollbackTransaction: async function (e) {
        let {db: t, msg: n = "【异常】操作失败", tips: r = "事务已回滚。", err: i = {}} = e;
        console.error("transaction error", i);
        let a = {code: -1, msg: n, tips: r};
        await t.rollback();
        let o = {message: i.message, stack: i.stack};
        try {
            o.body = JSON.parse(i.message), "object" == typeof o.body && void 0 !== o.body.code && (o.body.msg, 1) && (a.msg = o.body.msg)
        } catch (e) {
        }
        return console.error("transaction errJson", o), a.err = o, a
    }, group: async function (e) {
        let {vk: t, db: n, _: r} = w, {
            dbName: i,
            whereJson: a,
            groupJson: o,
            sortArr: s,
            pageIndex: l = 1,
            pageSize: c = 10,
            getCount: d = !1,
            lookupJson: u,
            db: p
        } = e, f = p || n;
        c <= 0 && (c = 999999999);
        r.aggregate;
        let g, m = f.collection(i).aggregate();
        if (t.pubfn.isNotNull(a) && (m = m.match(a)), t.pubfn.isNotNull(o) && (m = m.group(o)), t.pubfn.isNotNull(s)) {
            let e = {};
            for (let t in s) {
                let n = s[t], r = n.name, i = n.type;
                i = null == i || "" == i || "asc" == i ? 1 : -1, e[r] = i
            }
            m = m.sort(e)
        }
        m = m.skip((l - 1) * c).limit(c), t.pubfn.isNotNull(u) && (g = u.returnObject, delete u.returnObject, m = m.lookup(u)), m = await m.end();
        let h, y = m.data;
        if (g) for (let e in y) y[e][u.as] = y[e][u.as][0];
        let b = !1;
        if (d) {
            let e = f.collection(i).aggregate();
            t.pubfn.isNotNull(a) && (e = e.match(a)), t.pubfn.isNotNull(o) && (e = e.group(o));
            let n = await e.count("total").end();
            h = n.data[0] ? n.data[0].total : 0, l < Math.ceil(h / c) && (b = !0)
        } else h = y ? y.length : 0, b = h >= c;
        return {hasMore: b, total: h, rows: y, code: 0, key: 1, pageIndex: l, pageSize: c}
    }, tree: async function (e) {
        let {vk: t, db: n, _: r} = w, {
            dbName: i,
            whereJson: a = {},
            pageIndex: o = 1,
            pageSize: s = 10,
            getCount: l = !1,
            sortArr: c = [],
            fieldJson: d = {},
            lastWhereJson: u,
            treeProps: p = {}
        } = e;
        e.foreignDB || (e.foreignDB = []);
        let {id: f = "_id", parent_id: g = "parent_id", children: m = "children", level: h = 10, limit: y = 500} = p;
        if (h < 1 || h > 20) throw new Error("msg:treeProps.level的范围必须在[1,20]");
        delete e.treeProps, e.whereJson || (e.whereJson = {[g]: null}), e.foreignDB.unshift({
            dbName: i,
            localKey: f,
            foreignKey: g,
            as: m,
            limit: y,
            whereJson: p.whereJson,
            fieldJson: p.fieldJson || e.fieldJson,
            sortArr: p.sortArr,
            foreignDB: t.pubfn.copyObject(e.foreignDB)
        });
        let b = t.pubfn.copyObject(e.foreignDB);
        for (let n = 1; n < h; n++) {
            let r = "";
            for (let e = 0; e < n; e++) r += "[0].foreignDB";
            t.pubfn.setData(b, r, e.foreignDB)
        }
        return e.foreignDB = b, await k.selects(e)
    }, foreignDBToProject: function (e) {
        let {fieldJson: t, foreignDB: n, foreignKey: r} = e, i = !0;
        for (let e in t) "_id" == e || t[e] || (i = !1);
        if (i) for (let e in n) {
            let {as: r, dbName: i} = n[e];
            r ? t[r] = !0 : t[i] = !0
        }
        return t
    }, getTnwind: function (e = {}) {
        let {vk: t, db: n, _: r} = w, {result: i, unwindJson: a} = e;
        if (t.pubfn.isNotNull(a)) {
            let {
                path: e,
                includeArrayIndex: n,
                preserveNullAndEmptyArrays: r,
                replaceRoot: o,
                unwindWhereJson: s,
                replaceRootWhereJson: l
            } = a, c = {path: e, includeArrayIndex: n, preserveNullAndEmptyArrays: r};
            i = i.unwind(c), t.pubfn.isNotNull(s) && (i = i.match(s)), o && (i = i.replaceRoot({newRoot: e}), t.pubfn.isNotNull(l) && (i = i.match(l)))
        }
        return i
    }, getSortArr: function (e) {
        let {result: t, sortArr: n} = e, r = {};
        for (let e in n) {
            let t = n[e], i = t.name, a = t.type;
            a = null == a || "" == a || "asc" == a ? 1 : -1, r[i] = a
        }
        return t = t.sort(r), t
    }, getGeoNearJson: function (e) {
        let {runDB: t, result: n, geoNearJson: r, whereJson: i} = e;
        return n = n.geoNear({
            near: new t.Geo.Point(r.$geoNear.geometry.coordinates[0], r.$geoNear.geometry.coordinates[1]),
            spherical: !0,
            maxDistance: r.$geoNear.maxDistance,
            minDistance: r.$geoNear.minDistance,
            query: i,
            distanceMultiplier: r.$geoNear.distanceMultiplier,
            distanceField: r.$geoNear.distanceField || "distance",
            includeLocs: r.keyName,
            key: r.keyName
        }), n
    }
}, _ = k;
var v = async (e = {}) => {
    "[object object]" === Object.prototype.toString.call(e.content) && (e.content = JSON.stringify(e.content)), void 0 === e.dataType && (e.dataType = "json"), "default" != e.dataType && "" !== e.dataType || delete e.dataType, e.useContent && (e.content = JSON.stringify(e.data)), e.method || (e.method = "POST"), e.method = e.method.toUpperCase(), void 0 === e.headers && void 0 !== e.header && (e.headers = e.header);
    let t = await uniCloud.httpclient.request(e.url, e);
    return !e.needOriginalRes && t && t.data ? t.data : t
};
var N = async (e = {}) => {
    let {name: t, url: n, data: r = {}, uniIdToken: i, clientInfo: a, event: o = {}, uniCloud: s} = e;
    a || (a = o);
    let l, c = s || uniCloud;
    l = c.$context && c.$context.FUNCTION_NAME ? c.$context.FUNCTION_NAME : c.$options && c.$options.context && c.$options.context.FUNCTION_NAME ? c.$options.context.FUNCTION_NAME : "router", i || a.uniIdToken && (i = a.uniIdToken), r.vk_context = {
        appid: a.appId,
        platform: a.platform,
        clientIP: a.clientIP,
        locale: a.locale
    }, t || (t = l);
    let d = await c.callFunction({name: t, data: {$url: n, uniIdToken: i, data: r}});
    return d && d.result
}, x = {
    formValidateItem: function (e, t, n) {
        let r = {code: 0, msg: "ok"};
        for (let i in n) {
            let a = n[i];
            if (void 0 === e[t] && a.required) {
                r = {type: "undefined", code: -1, msg: "字段：" + t + " 名称错误，请检查！", key: t, value: e[t]};
                break
            }
            if (a.required && (null == e[t] || null == e[t] || "" === e[t] || 0 == e[t].length)) {
                r = {type: "required", code: -1, msg: a.message, key: t, value: e[t]};
                break
            }
            if (a.type && void 0 !== e[t]) {
                if (Object.prototype.toString.call(e[t]).toLowerCase().toLowerCase() !== `[object ${a.type}]`.toLowerCase()) {
                    r = {type: "type", code: -1, msg: a.message, key: t, value: e[t]};
                    break
                }
            }
            if (a.len && e[t].length != a.len) {
                r = {type: "len", code: -1, msg: a.message, key: t, value: e[t]};
                break
            }
            if (a.min) if (a.type && "number" == a.type) {
                if (e[t] < a.min) {
                    r = {type: "min", code: -1, msg: a.message, key: t, value: e[t]};
                    break
                }
            } else if (e[t].length < a.min) {
                r = {type: "min", code: -1, msg: a.message, key: t, value: e[t]};
                break
            }
            if (a.max && void 0 !== e[t]) if (a.type && "number" == a.type) {
                if (e[t] > a.max) {
                    r = {type: "max", code: -1, msg: a.message, key: t, value: e[t]};
                    break
                }
            } else if (e[t].length > a.max) {
                r = {type: "max", code: -1, msg: a.message, key: t, value: e[t]};
                break
            }
            if ("function" == typeof a.validator) {
                let n = a.validator(a, e[t], (function (e) {
                    return e
                }));
                if (void 0 !== n && !0 !== n) {
                    r = {type: "validator", code: -1, msg: a.message, key: t, value: e[t]};
                    break
                }
            }
        }
        return r
    }
};

function T(e) {
    return JSON.parse(JSON.stringify(e))
}

var D = {};

function O(e) {
    let t = [];
    for (let n = 0; n < e.length; n++) -1 == t.indexOf(e[n]) && t.push(e[n]);
    return t
}

D.treeToArray = function (e, t) {
    let n = T(e);
    return D.treeToArrayFn(n, t)
}, D.treeToArrayFn = function (e, t = {}, n = [], r) {
    let {id: i = "_id", parent_id: a = "parent_id", children: o = "children", deleteChildren: s = !0} = t;
    for (let l in e) {
        let c = e[l];
        r && (c[a] = r), n.push(c), c[o] && c[o].length > 0 && (n = D.treeToArrayFn(c[o], t, n, c[i])), s && delete c[o]
    }
    return n
}, D.arrayToTree = function (e, t) {
    let n = T(e), {
        id: r = "_id",
        parent_id: i = "parent_id",
        children: a = "children",
        deleteParentId: o = !1,
        need_field: s
    } = t, l = [], c = {};
    for (let e = 0; e < n.length; e++) c[n[e][r]] = n[e];
    for (let e = 0; e < n.length; e++) {
        let t = n[e];
        if (s) {
            s = O(s.concat([r, i, a]));
            for (let e in t) -1 === s.indexOf(e) && delete t[e]
        }
        let d = c[t[i]];
        d ? (d[a] || (d[a] = []), o && delete t[i], d[a].push(t)) : l.push(t)
    }
    return l
};
var I = D, S = {
    getTargetTimezone: function (e) {
        if ("number" == typeof e) return e;
        let t = 8;
        try {
            const {config: e} = vk.getUnicloud();
            t = vk.pubfn.getData(e.vk, "system.targetTimezone", 8)
        } catch (e) {
        }
        return t
    }, getDateObject: function (e, t) {
        if (!e) return "";
        let n;
        if ("string" == typeof e && !isNaN(e) && e.length >= 10 && (e = Number(e)), "number" == typeof e) 10 == e.toString().length && (e *= 1e3), n = new Date(e); else if ("object" == typeof e) n = new Date(e.getTime()); else if ("string" == typeof e) {
            let r = t = S.getTargetTimezone(t), i = t >= 0 ? "+" : "";
            t >= 0 && t < 10 ? r = "0" + t : t < 0 && t > -10 && (r = "-0" + -1 * t);
            let a, o = e.split(" "), s = o[0] || "", l = o[1] || "";
            a = s.indexOf("-") > -1 ? s.split("-") : s.split("/");
            let c = l.split(":"), d = {
                year: Number(a[0]),
                month: Number(a[1]) || 1,
                day: Number(a[2]) || 1,
                hour: Number(c[0]) || 0,
                minute: Number(c[1]) || 0,
                second: Number(c[2]) || 0
            };
            for (let e in d) d[e] >= 0 && d[e] < 10 && (d[e] = "0" + d[e]);
            let u = `${d.year}-${d.month}-${d.day}T${d.hour}:${d.minute}:${d.second}${i}${r}:00`;
            n = new Date(u)
        }
        return n
    }, getTimeByTimeZone: function (e, t) {
        let n = S.getDateObject(e);
        t = S.getTargetTimezone(t);
        let r = 60 * n.getTimezoneOffset() * 1e3 + 60 * t * 60 * 1e3, i = n.getTime() + r;
        return n = new Date(i), n
    }, timeFormat: function (e, t = "yyyy-MM-dd hh:mm:ss", n) {
        try {
            if (!e) return "";
            let r = S.getTimeByTimeZone(e, n), i = {
                "M+": r.getMonth() + 1,
                "d+": r.getDate(),
                "h+": r.getHours(),
                "m+": r.getMinutes(),
                "s+": r.getSeconds(),
                "q+": Math.floor((r.getMonth() + 3) / 3),
                S: r.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (r.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        } catch (e) {
            return time
        }
    }, getDateInfo: function (e = new Date, t) {
        let n = S.getTimeByTimeZone(e, t), r = n.getFullYear() + "",
            i = n.getMonth() + 1 < 10 ? "0" + (n.getMonth() + 1) : n.getMonth() + 1,
            a = n.getDate() < 10 ? "0" + n.getDate() : n.getDate(),
            o = n.getHours() < 10 ? "0" + n.getHours() : n.getHours(),
            s = n.getMinutes() < 10 ? "0" + n.getMinutes() : n.getMinutes(),
            l = n.getSeconds() < 10 ? "0" + n.getSeconds() : n.getSeconds(), c = n.getMilliseconds(), d = n.getDay(),
            u = Math.floor((n.getMonth() + 3) / 3);
        return {
            year: Number(r),
            month: Number(i),
            day: Number(a),
            hour: Number(o),
            minute: Number(s),
            second: Number(l),
            millisecond: Number(c),
            week: Number(d),
            quarter: Number(u)
        }
    }, getCommonTime: function (e = new Date, t) {
        let n = {}, r = S.getDateObject(e);
        t = S.getTargetTimezone(t);
        const i = 60 * r.getTimezoneOffset() * 1e3 + 60 * t * 60 * 1e3, {
            year: a,
            month: o,
            day: s,
            hour: l,
            minute: c,
            second: d,
            millisecond: u,
            week: p,
            quarter: f
        } = S.getDateInfo(r, t);
        n.now = {
            year: a,
            month: o,
            day: s,
            hour: l,
            minute: c,
            second: d,
            millisecond: u,
            week: p,
            quarter: f,
            date_str: S.timeFormat(r, "yyyy-MM-dd hh:mm:ss", t),
            date_day_str: S.timeFormat(r, "yyyy-MM-dd", t),
            date_month_str: S.timeFormat(r, "yyyy-MM", t)
        };
        let g = new Date(a, o, 0).getDate(), m = new Date(a, 12, 0).getDate();
        n.todayStart = new Date(`${a}/${o}/${s}`).getTime() - i, n.today12End = new Date(`${a}/${o}/${s}`).getTime() + 43199999 - i, n.todayEnd = new Date(`${a}/${o}/${s}`).getTime() + 86399999 - i, n.monthStart = new Date(`${a}/${o}/1`).getTime() - i, n.monthEnd = new Date(`${a}/${o}/${g}`).getTime() + 86399999 - i, n.yearStart = new Date(a + "/1/1").getTime() - i, n.yearEnd = new Date(`${a}/12/${m}`).getTime() + 86399999 - i, n.hourStart = new Date(`${a}/${o}/${s} ${l}:00:00`).getTime() - i, n.hourEnd = new Date(`${a}/${o}/${s} ${l}:59:59`).getTime() - i;
        let h = a, y = o - 1;
        0 === y && (y = 12, h = a - 1);
        let b = new Date(h, y, 0).getDate();
        n.lastMonthStart = new Date(`${h}/${y}/1`).getTime() - i, n.lastMonthEnd = new Date(`${h}/${y}/${b}`).getTime() + 86399999 - i, n.yesterdayStart = n.todayStart - 864e5, n.yesterday12End = n.today12End - 864e5, n.yesterdayEnd = n.todayEnd - 864e5;
        let w = S.getWeekOffsetStartAndEnd(0, r, t);
        n.weekStart = w.startTime, n.weekEnd = w.endTime, n.months = [], n.months[0] = {
            startTime: n.monthStart,
            endTime: n.monthEnd,
            startTimeStr: S.timeFormat(n.monthStart, "yyyy-MM-dd hh:mm:ss", t),
            endTimeStr: S.timeFormat(n.monthEnd, "yyyy-MM-dd hh:mm:ss", t),
            monthStart: n.monthStart,
            monthEnd: n.monthEnd
        };
        for (let e = 1; e <= 12; e++) {
            let r = new Date(a, e, 0).getDate(), o = new Date(`${a}/${e}/1`).getTime() - i,
                s = new Date(`${a}/${e}/${r}`).getTime() + 86399999 - i;
            n.months[e] = {
                startTime: o,
                endTime: s,
                startTimeStr: S.timeFormat(o, "yyyy-MM-dd hh:mm:ss", t),
                endTimeStr: S.timeFormat(s, "yyyy-MM-dd hh:mm:ss", t),
                monthStart: o,
                monthEnd: s
            }
        }
        n.days = [], n.days[0] = {
            startTime: n.todayStart,
            endTime: n.todayEnd,
            startTimeStr: S.timeFormat(n.todayStart, "yyyy-MM-dd hh:mm:ss", t),
            endTimeStr: S.timeFormat(n.todayEnd, "yyyy-MM-dd hh:mm:ss", t)
        };
        for (let e = 1; e <= g; e++) {
            let r = n.monthStart + 864e5 * (e - 1), {startTime: i, endTime: a} = S.getDayOffsetStartAndEnd(0, r, t);
            n.days[e] = {
                startTime: i,
                endTime: a,
                startTimeStr: S.timeFormat(i, "yyyy-MM-dd hh:mm:ss", t),
                endTimeStr: S.timeFormat(a, "yyyy-MM-dd hh:mm:ss", t)
            }
        }
        for (let e in n) "number" == typeof n[e] && 13 === n[e].toString().length && (n[e + "Str"] = S.timeFormat(n[e], "yyyy-MM-dd hh:mm:ss", t));
        return n
    }, getMonthStartAndEnd: function (e, t) {
        t = S.getTargetTimezone(t);
        let n = {startTime: null, endTime: null}, {year: r, month: i} = e;
        if (r > 0 && i > 0) {
            const e = 60 * (new Date).getTimezoneOffset() * 1e3 + 60 * t * 60 * 1e3;
            let a = new Date(r, i, 0).getDate();
            n.startTime = new Date(`${r}/${i}/1`).getTime() - e, n.endTime = new Date(`${r}/${i}/${a}`).getTime() + 86399999 - e
        }
        return n
    }, getHourOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = S.getDateObject(t);
        n = S.getTargetTimezone(n);
        let i = {};
        const a = 60 * r.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        r = new Date(r.getTime() + 36e5 * e);
        let o = S.getDateInfo(r);
        return i.startTime = new Date(`${o.year}/${o.month}/${o.day} ${o.hour}:00:00`).getTime() - a, i.endTime = new Date(`${o.year}/${o.month}/${o.day} ${o.hour}:00:00`).getTime() + 3599999 - a, i
    }, getDayOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = S.getDateObject(t);
        n = S.getTargetTimezone(n);
        let i = {};
        const a = 60 * r.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        r = new Date(r.getTime() + 864e5 * e);
        let o = S.getDateInfo(r);
        return i.startTime = new Date(`${o.year}/${o.month}/${o.day}`).getTime() - a, i.endTime = new Date(`${o.year}/${o.month}/${o.day}`).getTime() + 86399999 - a, i
    }, getWeekOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = {}, i = S.getDateObject(t);
        n = S.getTargetTimezone(n);
        const a = 60 * i.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        let o = 0 === i.getDay() ? 7 : i.getDay();
        i.setDate(i.getDate() - o + 1 + 7 * e);
        let s = S.getDateInfo(i);
        i.setDate(i.getDate() + 7);
        let l = S.getDateInfo(i);
        return r.startTime = new Date(`${s.year}/${s.month}/${s.day}`).getTime() - a, r.endTime = new Date(`${l.year}/${l.month}/${l.day}`).getTime() - 1 - a, r
    }, getMonthOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = {}, i = S.getDateObject(t), a = S.getDateInfo(i), o = a.month + e, s = a.year;
        o > 12 ? (s += Math.floor(o / 12), o = Math.abs(o) % 12) : o <= 0 && (s = s - 1 - Math.floor(Math.abs(o) / 12), o = 12 - Math.abs(o) % 12);
        let l = new Date(s, o, 0).getDate();
        return r.startTime = S.getDateObject(`${s}/${o}/01`, n).getTime(), r.endTime = S.getDateObject(`${s}/${o}/${l}`, n).getTime() + 86399999, r
    }, getQuarterOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = {}, i = S.getDateObject(t);
        i.setMonth(i.getMonth() + 3 * e), n = S.getTargetTimezone(n);
        const a = 60 * i.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        let o = S.getDateInfo(i).month;
        [1, 2, 3].indexOf(o) > -1 ? o = 1 : [4, 5, 6].indexOf(o) > -1 ? o = 4 : [7, 8, 9].indexOf(o) > -1 ? o = 7 : [10, 11, 12].indexOf(o) > -1 && (o = 10), i.setMonth(o - 1);
        let s = S.getDateInfo(i);
        i.setMonth(i.getMonth() + 3);
        let l = S.getDateInfo(i);
        return r.startTime = new Date(`${s.year}/${s.month}/1`).getTime() - a, r.endTime = new Date(`${l.year}/${l.month}/1`).getTime() - 1 - a, r
    }, getYearOffsetStartAndEnd: function (e = 0, t = new Date, n) {
        let r = {}, i = S.getDateObject(t);
        n = S.getTargetTimezone(n);
        const a = 60 * i.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        let o = S.getDateInfo(i).year + e;
        return r.startTime = new Date(o + "/1/1").getTime() - a, r.endTime = new Date(o + "/12/31").getTime() + 86399999 - a, r
    }, getOffsetTime: function (e = new Date, t, n) {
        let r = S.getDateObject(e), i = S.getDateInfo(r);
        n = S.getTargetTimezone(n);
        const a = 60 * r.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3;
        let o = t.year || t.y || 0, s = t.month || t.m || 0, l = t.day || t.d || 0, c = t.hour || t.hours || t.hh || 0,
            d = t.minute || t.minutes || t.mm || 0, u = t.second || t.seconds || t.ss || 0, {mode: p = "after"} = t;
        "before" == p && (o *= -1, s *= -1, l *= -1, c *= -1, d *= -1, u *= -1);
        let f = {
            year: i.year + o,
            month: i.month + s,
            day: i.day + l,
            hour: i.hour + c,
            minute: i.minute + d,
            second: i.second + u
        };
        return r = new Date(f.year, f.month - 1, f.day, f.hour, f.minute, f.second), r.getTime() - a
    }, isLeapYear: function (e) {
        if (void 0 === e) {
            let {now: t} = S.getCommonTime();
            e = t.year
        } else if ("object" == typeof e) {
            let {now: t} = S.getCommonTime(e);
            e = t.year
        }
        return e % 4 == 0 && e % 100 != 0 || e % 400 == 0
    }, isQingming: function (e = new Date) {
        let {now: t} = S.getCommonTime(e), {year: n, month: r, day: i} = t, a = !1;
        return S.isLeapYear(n) || S.isLeapYear(n - 1) ? 4 === r && 4 === i && (a = !0) : 4 === r && 5 === i && (a = !0), a
    }, getFullTime: function (e, t = 0, n) {
        if (!e) return "";
        n = S.getTargetTimezone(n);
        let r = S.getDateObject(e);
        const i = 60 * r.getTimezoneOffset() * 1e3 + 60 * n * 60 * 1e3, a = r.getTime() + i;
        r = new Date(a);
        let o = r.getFullYear() + "", s = r.getMonth() + 1 < 10 ? "0" + (r.getMonth() + 1) : r.getMonth() + 1,
            l = r.getDate() < 10 ? "0" + r.getDate() : r.getDate(),
            c = r.getHours() < 10 ? "0" + r.getHours() : r.getHours(),
            d = r.getMinutes() < 10 ? "0" + r.getMinutes() : r.getMinutes(),
            u = r.getSeconds() < 10 ? "0" + r.getSeconds() : r.getSeconds();
        return 2 === t ? {
            YYYY: Number(o),
            MM: Number(s),
            DD: Number(l),
            hh: Number(c),
            mm: Number(d),
            ss: Number(u),
            year: Number(o),
            month: Number(s),
            day: Number(l),
            hour: Number(c),
            minute: Number(d),
            second: Number(u)
        } : 1 === t ? o + "" + s + l + c + d + u : o + "-" + s + "-" + l + " " + c + ":" + d + ":" + u
    }
}, A = S, E = {
    formValidate: function (e = {}) {
        let t = {code: 0, msg: "ok"}, {data: n, rules: r} = e;
        if (r) for (let e in r) {
            let i = r[e];
            if (t = x.formValidateItem(n, e, i), 0 != t.code) break
        }
        return t
    }
};
E.treeUtil = I, E.timeUtil = A, E.sleep = e => new Promise(t => setTimeout(t, e)), E.timeFormat = E.timeUtil.timeFormat, E.getDateInfo = E.timeUtil.getDateInfo, E.getFullTime = E.timeUtil.getFullTime, E.getCommonTime = E.timeUtil.getCommonTime, E.getOffsetTime = E.timeUtil.getOffsetTime, E.getHourOffsetStartAndEnd = E.timeUtil.getHourOffsetStartAndEnd, E.getDayOffsetStartAndEnd = E.timeUtil.getDayOffsetStartAndEnd, E.getWeekOffsetStartAndEnd = E.timeUtil.getWeekOffsetStartAndEnd, E.getWeekStartAndEnd = E.timeUtil.getWeekOffsetStartAndEnd, E.getMonthOffsetStartAndEnd = E.timeUtil.getMonthOffsetStartAndEnd, E.getQuarterOffsetStartAndEnd = E.timeUtil.getQuarterOffsetStartAndEnd, E.getYearOffsetStartAndEnd = E.timeUtil.getYearOffsetStartAndEnd, E.getMonthStartAndEnd = E.timeUtil.getMonthStartAndEnd, E.validator = function (e) {
    return function (t, n, r) {
        let i = E.test(n, e);
        return "function" != typeof r || !i && n ? r(!1) : void r()
    }
}, E.test = function (e, t = "") {
    switch (t = t.toLowerCase()) {
        case"mobile":
            return new RegExp(/^1[3|4|5|6|7|8|9][0-9]{9}$/).test(e);
        case"tel":
            return new RegExp(/^(0\d{2,3}-\d{7,8})(-\d{1,4})?$/).test(e);
        case"card":
            return new RegExp(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/).test(e);
        case"mobilecode":
            return new RegExp(/^[0-9]{6}$/).test(e);
        case"username":
            return new RegExp(/^[a-zA-Z]([-_a-zA-Z0-9]{5,17})$/).test(e);
        case"pwd":
        case"password":
            return new RegExp(/^([a-zA-Z0-9_@]){6,18}$/).test(e);
        case"paypwd":
            return new RegExp(/^[0-9]{6}$/).test(e);
        case"postal":
            return new RegExp(/[1-9]\d{5}(?!\d)/).test(e);
        case"qq":
            return new RegExp(/^[1-9][0-9]{4,9}$/).test(e);
        case"email":
            return new RegExp(/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/).test(e);
        case"money":
            return new RegExp(/^\d*(?:\.\d{0,2})?$/).test(e);
        case"url":
            return new RegExp(/^(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/).test(e);
        case"ip":
            return new RegExp(/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/).test(e);
        case"date":
            return new RegExp(/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/).test(e);
        case"time":
            return new RegExp(/^(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d$/).test(e);
        case"datetime":
            return new RegExp(/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])\s+(20|21|22|23|[0-1]\d):[0-5]\d:[0-5]\d$/).test(e);
        case"english+number":
            return new RegExp(/^[a-zA-Z0-9]*$/).test(e);
        case"english+number+_":
            return new RegExp(/^[a-zA-Z0-9_]*$/).test(e);
        case"english+number+_-":
            return new RegExp(/^[a-zA-Z0-9_-]*$/).test(e);
        case"version":
            return new RegExp(/^([1-9]\d|[1-9])(.([1-9]\d|\d)){2}$/).test(e);
        case"number":
            return new RegExp(/^[0-9]*$/).test(e);
        case"english":
            return new RegExp(/^[a-zA-Z]+$/).test(e);
        case"chinese":
            return new RegExp(/^[\u4e00-\u9fa5]+$/gi).test(e);
        case"lower":
            return new RegExp(/^[a-z]+$/).test(e);
        case"upper":
            return new RegExp(/^[A-Z]+$/).test(e);
        case"html":
            return new RegExp(/<("[^"]*"|'[^']*'|[^'">])*>/).test(e);
        default:
            return !0
    }
}, E.checkStr = E.test, E.priceFilter = function (e, t = "") {
    return E.isNull(e) ? t : isNaN(e) ? e : ("string" == typeof e && (e = parseFloat(e)), (e / 100).toFixed(2))
}, E.priceLeftFilter = function (e) {
    let t = "";
    return e && (t = E.priceFilter(e).split(".")[0]), t
}, E.priceRightFilter = function (e) {
    let t = "";
    return e && (t = E.priceFilter(e).split(".")[1]), t
}, E.percentageFilter = function (e, t = !0, n = "") {
    return E.isNull(e) ? n : (isNaN(e) || ("string" == typeof e && (e = parseFloat(e)), e = parseFloat((100 * e).toFixed(2)), t && (e += "%")), e)
}, E.discountFilter = function (e, t = !0, n = "") {
    return E.isNull(e) ? n : isNaN(e) ? e : ("string" == typeof e && (e = parseFloat(e)), (e = parseFloat((10 * e).toFixed(2))) > 10 ? "折扣不可以大于原价" : 10 == e ? "原价" : 0 == e ? "免费" : e < 0 ? "折扣不可以小于0" : (t && (e += " 折"), e))
}, E.objectDeleteInvalid = function (e) {
    return Object.keys(e).forEach(t => {
        void 0 === e[t] && delete e[t]
    }), e
}, E.objectAssign = function (e, t, n = !0) {
    return n && E.objectDeleteInvalid(t), Object.assign(e, t)
}, E.copyObject = function (e) {
    return void 0 !== e ? JSON.parse(JSON.stringify(e)) : e
}, E.deepClone = function (e) {
    if ([null, void 0, NaN, !1].includes(e)) return e;
    if ("object" != typeof e && "function" != typeof e) return e;
    let t = "[object Array]" === Object.prototype.toString.call(e) ? [] : {};
    for (let n in e) e.hasOwnProperty(n) && (t[n] = "object" == typeof e[n] ? E.deepClone(e[n]) : e[n]);
    return t
}, E.formAssign = function (e, t) {
    let n = E.copyObject(e);
    return E.objectAssign(n, t)
}, E.arr_concat = function (e, t, n) {
    n || (n = "id"), e || (e = []), t || (t = []);
    let r = e.concat(t), i = [];
    if (-1 != n) {
        let e = [];
        for (let t in r) -1 == e.indexOf(r[t][n]) && (e.push(r[t][n]), i.push(r[t]))
    } else i = r;
    return i
}, E.getData = function (e, t, n) {
    let r = JSON.parse(JSON.stringify(e));
    t = t.replace(/\s+/g, "") + ".";
    let i = "";
    for (let e = 0; e < t.length; e++) {
        let n = t.charAt(e);
        "." != n && "[" != n && "]" != n ? i += n : r && ("" != i && (r = r[i]), i = "")
    }
    return void 0 === r && void 0 !== n && (r = n), r
}, E.setData = function (e, t, n) {
    let r;
    r = "object" == typeof n ? E.copyObject(n) : n;
    let i = new RegExp("([\\w$-]+)|\\[(:\\d)\\]", "g");
    const a = t.match(i);
    for (let t = 0; t < a.length - 1; t++) {
        let n = a[t];
        "object" != typeof e[n] && (e[n] = {}), e = e[n]
    }
    e[a[a.length - 1]] = r
}, E.isNull = function (e) {
    let t = !1;
    return void 0 !== e && "[object Null]" != Object.prototype.toString.call(e) && "" !== e && "{}" != JSON.stringify(e) && "[]" != JSON.stringify(e) && void 0 !== JSON.stringify(e) || (t = !0), t
}, E.isNotNull = function (e) {
    return !E.isNull(e)
}, E.isNullOne = function (...e) {
    let t = !1;
    for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (E.isNull(r)) {
            t = !0;
            break
        }
    }
    return t
}, E.isNullOneByObject = function (e) {
    let t;
    for (let n in e) {
        let r = e[n];
        if (E.isNull(r)) {
            t = n;
            break
        }
    }
    return t
}, E.isNullAll = function (...e) {
    let t = !0;
    for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (E.isNotNull(r)) {
            t = !1;
            break
        }
    }
    return t
}, E.isNotNullAll = function (...e) {
    return !E.isNullOne(...e)
}, E.getListItem = function (e, t, n) {
    let r;
    for (let i = 0; i < e.length; i++) if (e[i][t] === n) {
        r = e[i];
        break
    }
    return r
}, E.getListIndex = function (e, t, n) {
    let r = -1;
    for (let i = 0; i < e.length; i++) if (e[i][t] === n) {
        r = i;
        break
    }
    return r
}, E.getListItemIndex = function (e, t, n) {
    let r, i = {}, a = -1;
    for (let i = 0; i < e.length; i++) if (e[i][t] === n) {
        a = i, r = e[i];
        break
    }
    return i = {item: r, index: a}, i
}, E.arrayToJson = function (e, t) {
    let n = {};
    for (let r in e) {
        let i = e[r];
        n[i[t]] = i
    }
    return n
}, E.listToJson = E.arrayToJson, E.arrayObjectGetArray = function (e, t) {
    return e.map(e => e[t])
}, E.random = function (e, t, n) {
    let r;
    if (E.isNull(n)) r = E.randomFn(e, t); else {
        let i = 0, a = 1e5;
        do {
            i++, r = E.randomFn(e, t)
        } while (n.indexOf(r) > -1 && i < a);
        i === a && (r = void 0)
    }
    return r
}, E.randomFn = function (e, t) {
    let n = "", r = "123456789";
    E.isNotNull(t) && ("a-z,0-9" == t ? t = "abcdefghijklmnopqrstuvwxyz0123456789" : "A-Z,0-9" == t ? t = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" : "a-z,A-Z,0-9" != t && "A-Z,a-z,0-9" != t || (t = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), r = t);
    for (let t = 0; t < e; t++) {
        n += r[Math.floor(Math.random() * r.length)]
    }
    return n
}, E.stringIdToNumberId = function (e, t) {
    let n = "", r = e.split("").reverse().join("");
    for (let e = 0; e < t; e++) if (r.length > e) {
        n += "0123456789"[r[e].charCodeAt() % 10]
    } else n = "0" + n;
    return n
}, E.hidden = function (e = "", t = 0, n = 0) {
    let r = e.length - t - n, i = "";
    for (let e = 0; e < r; e++) i += "*";
    return e.substring(0, t) + i + e.substring(e.length - n)
}, E.checkArrayIntersection = function (e = [], t = []) {
    let n = !1;
    for (let r = 0; r < t.length; r++) e.indexOf(t[r]) > -1 && (n = !0);
    return n
}, E.isArray = function (e) {
    return "[object Array]" === Object.prototype.toString.call(e)
}, E.isObject = function (e) {
    return "[object Object]" === Object.prototype.toString.call(e)
}, E.calcFreights = function (e, t) {
    return vk.pubfn.calcFreightDetail(e, t).total_amount
}, E.calcFreightDetail = function (e, t) {
    let {first_weight: n, first_weight_price: r, continuous_weight: i, continuous_weight_price: a, max_weight: o} = e;
    o || (o = 1e9);
    let s = t, l = 0, c = o, d = !1, u = 0;
    for (; t > 0;) d ? (u++, t -= i, c -= i) : (d = !0, l++, c = o, t -= n, c -= n), c <= 0 && (d = !1);
    let p = r * l + a * u;
    return {
        weight: s,
        first_weight: n,
        first_weight_price: r,
        first_weight_count: l,
        continuous_weight: i,
        continuous_weight_price: a,
        continuous_weight_count: u,
        first_weight_amount: l * r,
        continuous_weight_amount: a * u,
        total_amount: p,
        formula: `${r} * ${l} + ${a} * ${u} = ${p}`
    }
}, E.getNewObject = function (e, t) {
    let n = E.copyObject(e), r = {};
    if (t && t.length > 0) for (let e in t) {
        let i = t[e];
        E.isNotNull(n[i]) && (r[i] = n[i])
    } else r = n;
    return r
}, E.deleteObjectKeys = function (e, t = []) {
    var n = {};
    if (e) for (let r in e) -1 == t.indexOf(r) && (n[r] = e[r]);
    return n
}, E.arrayToTree = E.treeUtil.arrayToTree, E.treeToArray = E.treeUtil.treeToArray, E.wildcardTestOne = function (e, t) {
    if (!t) return !1;
    let n = t.replace(new RegExp("\\*"), "(.*)"), r = 0 !== t.indexOf("*") ? "^" : "",
        i = "*" !== t[t.length - 1] ? "$" : "";
    return new RegExp(r + n + i).test(e)
}, E.wildcardTest = function (e, t) {
    let n = 0;
    if ("string" == typeof t) E.wildcardTestOne(e, t) && n++; else if ("object" == typeof t) for (let r = 0; r < t.length; r++) {
        let i = t[r];
        E.wildcardTestOne(e, i) && n++
    }
    return n
}, E.regExpTestOne = function (e, t) {
    if (!t) return !1;
    return new RegExp(t).test(e)
}, E.regExpTest = function (e, t) {
    let n = 0;
    if ("string" == typeof t) E.regExpTestOne(e, t) && n++; else if ("object" == typeof t) for (let r = 0; r < t.length; r++) {
        let i = t[r];
        E.regExpTestOne(e, i) && n++
    }
    return n
}, E.regExpExecToTemplate = function (e, t, n) {
    let r = new RegExp(t).exec(e);
    if (r) {
        for (let e = 1; e < r.length; e++) n = n.replace("$" + e, r[e]);
        return n
    }
}, E.createOrderNo = function (e = "", t = 25) {
    let n = vk.pubfn.timeFormat(new Date, "yyyyMMddhhmmss");
    n = n.substring(2);
    let r = t - (e + n).length;
    return e + n + E.random(r)
}, E.dateDiff = function (e, t = "前") {
    if (!e) return "";
    "string" != typeof e || isNaN(e) || (e = Number(e)), "number" == typeof e && (10 == e.toString().length && (e *= 1e3), e = new Date(e), e = E.timeFormat(e)), "string" == typeof e && (e = e = e.replace("T", " "), e = new Date(e.replace(/-/g, "/")));
    var n = 864e5, r = 36e5, i = (new Date).getTime() - e.getTime(), a = Math.floor(i / n), o = Math.floor(i % n / r),
        s = Math.floor(i % n % r / 6e4), l = Math.round(i % n % r % 6e4 / 1e3), c = "1 秒";
    return a > 0 ? c = a + "天" : o > 0 ? c = o + "小时" : s > 0 ? c = s + "分钟" : l > 0 && (c = l + "秒"), c += t
}, E.dateDiff2 = function (e, t = "1秒") {
    if (!e) return "";
    "string" != typeof e || isNaN(e) || (e = Number(e)), "number" == typeof e && (10 == e.toString().length && (e *= 1e3), e = new Date(e), e = E.timeFormat(e)), "string" == typeof e && (e = e = e.replace("T", " "), e = new Date(e.replace(/-/g, "/")));
    var n = new Date, r = 864e5, i = 36e5, a = e.getTime() - n.getTime(), o = Math.floor(a / r),
        s = Math.floor(a % r / i), l = Math.floor(a % r % i / 6e4), c = Math.round(a % r % i % 6e4 / 1e3), d = t;
    return o > 0 ? d = o + "天" : s > 0 ? d = s + "小时" : l > 0 ? d = l + "分钟" : c > 0 && (d = c + "秒"), d
}, E.numStr = function (e) {
    "string" == typeof e && (e = parseFloat(e));
    var t = e;
    if (e < 1e3) t = e; else if (e < 1e4) {
        t = Math.floor(e / 100) / 10 + "千"
    } else if (e < 1e6) {
        t = Math.floor(e / 1e3) / 10 + "万"
    } else if (e < 1e7) {
        t = Math.floor(e / 1e6) + "百万"
    } else if (e < 1e8) {
        t = Math.floor(e / 1e7) + "千万"
    } else if (e >= 1e8) {
        t = Math.floor(e / 1e7) / 10 + "亿"
    }
    return t
}, E.calcSize = function (e = 0, t, n, r = 2, i = "auto") {
    let a = 0, o = "";
    if ((e = parseFloat(e)) < n || t.length <= 1) o = t[0], a = parseFloat(e.toFixed(r)); else for (let s = 1; s < t.length; s++) {
        let l = t[s];
        if (e /= n, "auto" === i) {
            if (e < n) {
                o = l, a = parseFloat(e.toFixed(r));
                break
            }
        } else if (i === l) {
            o = l, a = parseFloat(e.toFixed(r));
            break
        }
    }
    return {size: a, type: o, title: a + " " + o}
};
const $ = new RegExp("_(\\w)", "g"), C = new RegExp("[A-Z]", "g");

function M(e, t) {
    let n, r;
    switch (t) {
        case"snake2camel":
            r = E.snake2camel, n = $;
            break;
        case"camel2snake":
            r = E.camel2snake, n = C
    }
    for (const i in e) if (Object.prototype.hasOwnProperty.call(e, i) && n.test(i)) {
        const n = r(i);
        e[n] = e[i], delete e[i], "[object Object]" === Object.prototype.toString.call(e[n]) ? e[n] = M(e[n], t) : Array.isArray(e[n]) && (e[n] = e[n].map(e => M(e, t)))
    }
    return e
}

E.snake2camel = function (e) {
    return e.replace($, (e, t) => t ? t.toUpperCase() : "")
}, E.camel2snake = function (e) {
    return e.replace(C, e => "_" + e.toLowerCase())
}, E.snake2camelJson = function (e) {
    return M(e, "snake2camel")
}, E.camel2snakeJson = function (e) {
    return M(e, "camel2snake")
}, E.string2Number = function (e, t = {}) {
    switch (Object.prototype.toString.call(e).slice(8, -1).toLowerCase()) {
        case"string":
            if (e && !isNaN(e)) {
                let {mobile: n = !0, idCard: r = !0, startFrom0: i = !0, maxLength: a = 14} = t;
                return e.length > a || (n && E.test(e, "mobile") || r && E.test(e, "card") || i && e.length > 1 && 0 === e.indexOf("0") && 1 !== e.indexOf(".")) ? e : Number(e)
            }
            return e;
        case"object":
            const n = Object.keys(e);
            for (let t = 0; t < n.length; t++) {
                const r = n[t];
                e[r] = E.string2Number(e[r])
            }
            return e;
        case"array":
            for (let t = 0; t < e.length; t++) e[t] = E.string2Number(e[t]);
            return e;
        default:
            return e
    }
}, E.toDecimal = function (e, t = 0) {
    return "string" == typeof e && (e = Number(e)), parseFloat(e.toFixed(t))
}, E.getFileType = function (e) {
    let t;
    return t = E.checkFileSuffix(e, ["png", "jpg", "jpeg", "gif", "bmp", "svg"]) ? "image" : E.checkFileSuffix(e, ["avi", "mp4", "3gp", "mov", "rmvb", "rm", "flv", "mkv"]) ? "video" : E.checkFileSuffix(e, ["mp3"]) ? "audio" : "other", t
}, E.getFileSuffix = function (e) {
    let t, n = e.lastIndexOf(".");
    return n > -1 && (t = e.substring(n + 1)), t
}, E.checkFileSuffix = function (e, t) {
    let n = !1, r = E.getFileSuffix(e);
    for (let e = 0; e < t.length; e++) if (t.indexOf(r) > -1) {
        n = !0;
        break
    }
    return n
}, E.splitArray = function (e, t) {
    let n = [];
    for (let r = 0; r < e.length; r += t) n.push(e.slice(r, r + t));
    return n
}, E.urlStringToJson = function (e) {
    var t = {};
    if ("" != e && null != e && null != e) for (var n = e.split("&"), r = 0; r < n.length; r++) {
        var i = n[r].split("="), a = i[0], o = i[1];
        t[a] = o
    }
    return t
}, E.getQueryStringParameters = function (e) {
    let t = {};
    if (e.httpMethod) {
        if (console.log("event.path:", e.path), e.body) {
            let n = e.body;
            e.isBase64Encoded && (n = Buffer.from(n, "base64").toString("utf-8")), "string" == typeof n && (n = JSON.parse(n)), t = n
        } else if (e.queryStringParameters) {
            let n = e.queryStringParameters;
            "string" == typeof n.data && (n.data = JSON.parse(n.data)), t = n
        }
    } else t = JSON.parse(JSON.stringify(e));
    return t.data || (t.data = {}), t.url = t.$url || "", t
}, E.stringToFormData = function (e) {
    e || (e = "");
    for (var t = e.split("Content-Disposition: form-data;"), n = {}, r = 0; r < t.length; r++) {
        var i = t[r];
        let e = 'name="';
        var a = i.indexOf(e) + e.length;
        if (a > -1) {
            var o = i.indexOf('"', a), s = i.substring(a, o);
            if (o > a) {
                var l = i.indexOf("---", o), c = i.substring(o + 1, l).trim();
                n[s] = c
            }
        }
    }
    return n
}, E.getPlatform = function (e) {
    return "web" === e ? e = "h5" : "app" === e && (e = "app-plus"), e
}, E.getClientUAByContext = function (e = {}) {
    return e.ua || e.CLIENTUA
}, E.getPlatformForUniId = function (e = {}) {
    let t = e.PLATFORM;
    if (t = E.getPlatform(t), "h5" === t) {
        E.getClientUAByContext(e).toLowerCase().indexOf("micromessenger") > -1 && (t = "h5-weixin")
    }
    return t
}, E.getUniCloudContext = function () {
    let e;
    try {
        uniCloud.$context && uniCloud.$context ? e = uniCloud.$context : uniCloud.$options && uniCloud.$options.context && (e = uniCloud.$options.context)
    } catch (e) {
    }
    return e
}, E.getUniCloudFunctionName = function () {
    let e;
    try {
        let t = vk.pubfn.getUniCloudContext();
        e = t.FUNCTION_NAME || t.function_name
    } catch (e) {
    }
    try {
        e || (e = uniCloud.logger.options.functionName)
    } catch (e) {
    }
    return e
}, E.getUniCloudProvider = function () {
    let e;
    try {
        e = uniCloud.$provider
    } catch (e) {
    }
    return e
}, E.getUniIdConfig = function (e = {}, t, n) {
    const r = e.uni;
    let i;
    if (E.isArray(r)) {
        let e = uniCloud.env && uniCloud.env.APPID ? uniCloud.env.APPID : uniCloud.$context.APPID;
        i = E.getListItem(r, "dcloudAppid", e), E.isNull(i) && (i = E.getListItem(r, "isDefaultConfig", !0))
    } else i = r;
    if (E.isNotNull(t)) {
        let e = E.getData(i, t);
        return E.isNull(e) ? n : e
    }
    return i
}, E.batchRun = async function (e) {
    let {main: t, data: n = [], concurrency: r = 100} = e;
    if (E.isArray(t)) return E.batchRun2(e);
    let i = n.length, a = [];
    if (0 == i) return {stack: a, total: i};
    if (1 === r) {
        for (let e = 0; e < i; e++) try {
            let r = await t(n[e], e);
            a.push(r)
        } catch (e) {
            a.push(e)
        }
        return {stack: a, total: i}
    }
    {
        let e = Math.ceil(i / r);
        for (let o = 0; o < e; o++) {
            let e = [];
            for (let a = 0; a < r; a++) {
                let s = o * r + a;
                if (s >= i) break;
                let l = t(n[s], s);
                e.push(l)
            }
            try {
                await Promise.all(e).then(e => {
                    a = a.concat(e)
                })
            } catch (e) {
                console.error(e)
            }
        }
        return {stack: a, total: i}
    }
}, E.batchRun2 = async function (e) {
    let {main: t, concurrency: n = 100} = e, r = t.length, i = [];
    if (0 == r) return {stack: i, total: r};
    if (1 === n) {
        for (let e = 0; e < r; e++) try {
            let n = t[e], r = await n();
            i.push(r)
        } catch (e) {
            i.push(e)
        }
        return {stack: i, total: r}
    }
    {
        let e = Math.ceil(r / n);
        for (let a = 0; a < e; a++) {
            let e = [];
            for (let i = 0; i < n; i++) {
                let o = a * n + i;
                if (o >= r) break;
                let s = (0, t[o])();
                e.push(s)
            }
            try {
                await Promise.all(e).then(e => {
                    i = i.concat(e)
                })
            } catch (e) {
                console.error(e)
            }
        }
        return {stack: i, total: r}
    }
}, E.getUniCloudRequestId = function () {
    let e;
    try {
        uniCloud.$context && uniCloud.$context.request_id ? e = uniCloud.$context.request_id : uniCloud.$options && uniCloud.$options.context && uniCloud.$options.context.requestId && (e = uniCloud.$options.context.requestId)
    } catch (e) {
    }
    return e
}, E.randomAsync = async function (e, t, n) {
    let r;
    if ("function" == typeof n) {
        let i = 0, a = 500;
        do {
            i++, r = E.randomFn(e, t)
        } while (!await n(r) && i < a);
        i === a && (r = void 0), await n(r)
    } else r = E.randomFn(e, t);
    return r
};
var J = E, P = {}, j = {};
P.get = function (e) {
    let t, n = j[e];
    if (n) {
        let {value: r, expired: i} = n;
        P.isExpired(e) ? delete j[e] : t = r
    }
    return t
}, P.set = function (e, t, n = 0) {
    let r = {value: t, expired: n > 0 ? (new Date).getTime() + 1e3 * n : 0};
    j[e] = r
}, P.del = function (e) {
    delete j[e]
}, P.clear = function (e) {
    if (e) for (let t in j) 0 == t.indexOf(e) && delete j[t]; else j = {}
}, P.isExpired = function (e) {
    let t = !0, n = j[e];
    return n && (0 == n.expired || n.expired > (new Date).getTime()) && (t = !1), t
}, P.getAll = function (e) {
    let t = {};
    if (e) for (let n in j) 0 == n.indexOf(e) && (t[e] = j[e]); else t = j;
    for (let e in t) P.isExpired(e) && (delete t[e], delete j[e]);
    return t
};
var F = P, q = {}, B = {}, R = {};
q.init = function (e) {
    R = (B = e).vk.system.globalDataDao
}, q.get = async function (e, t = 0, n, r = !0) {
    return "function" == typeof n ? q.autoGet(e, t, n, r) : q._get(e)
}, q.autoGet = async function (e, t = 0, n, r = !0) {
    let i, {vk: a} = B;
    try {
        i = await q._get(e), a.pubfn.isNull(i) && "function" == typeof n && (i = await n(), void 0 !== i && r && await a.globalDataCache.set(e, i, t))
    } catch (e) {
        return
    }
    return i
}, q._get = async function (e) {
    let t;
    try {
        let n = await R.find(e);
        if (n) {
            let {value: r, expired_at: i} = n;
            q.isExpired(n) ? await q.del(e) : t = r
        }
    } catch (e) {
        return
    }
    return t
}, q.set = async function (e, t, n = 0) {
    let r;
    e && void 0 !== e.key && void 0 !== e.value ? (r = e.key, t = e.value, n = e.second) : r = e;
    let i = {code: 0, msg: "ok"};
    try {
        if (!r) return {code: -1, msg: "key值不能为空"};
        let e = n > 0 ? (new Date).getTime() + 1e3 * n : 0;
        i = await R.set({key: r, value: t, expired_at: e})
    } catch (e) {
        return console.error(e), {code: -1, msg: "异常"}
    }
    return i
}, q.del = async function (e) {
    await R.del(e)
}, q.clear = async function (e) {
    if (e) return await R.deleteByWhere({key: new RegExp("^" + e)})
}, q.list = async function (e) {
    return await R.list(e)
}, q.count = async function (e) {
    return await R.count(e)
}, q.isExpired = function (e) {
    let t = !0;
    return e && (!e.expired_at || 0 == e.expired_at || e.expired_at > (new Date).getTime()) && (t = !1), t
}, q.inc = async function (e, t = 1, n = 0) {
    let r;
    e && void 0 !== e.key && void 0 !== e.value ? (r = e.key, t = e.value, n = e.second) : r = e;
    let i = {code: 0, msg: "ok"};
    try {
        if (!r) return {code: -1, msg: "key值不能为空"};
        let e = n > 0 ? (new Date).getTime() + 1e3 * n : 0;
        i = await R.inc({key: r, value: t, expired_at: e})
    } catch (e) {
        return {code: -1, msg: "异常", err: e}
    }
    return i
}, q.uniqueAdd = async function (e, t = 1, n = 5) {
    let {vk: r} = B, i = {code: 0, msg: "ok"};
    try {
        if (!e) return {code: -1, msg: "key值不能为空"};
        let a = n > 0 ? (new Date).getTime() + 1e3 * n : 0;
        await r.globalDataCache.deleteExpired(e);
        i.id = await R.add({key: e, value: t, expired_at: a})
    } catch (e) {
        return console.error(e), {code: -1, msg: "异常"}
    }
    return i
}, q.deleteExpired = async function (e) {
    await R.deleteExpired(e)
};
var U = q, L = {aes: {}};
const z = "5fb2cd73c7b53918728417c50762e6d45fb2cd73c7b53918728417c50762e6d4";
L.aes.encrypt = function (e) {
    let {data: t, key: n} = e, {crypto: r, config: i} = vk.getUnicloud();
    n || (n = vk.pubfn.getData(i.vk, "crypto.aes", z)), "object" == typeof t && (t = JSON.stringify(t));
    const a = r.createCipher("aes192", n);
    let o = a.update(t, "utf8", "hex");
    return o += a.final("hex"), o
}, L.aes.decrypt = function (e) {
    let t, {data: n, key: r} = e, {crypto: i, config: a} = vk.getUnicloud();
    if (vk.pubfn.isNull(n)) throw new Error("msg:待解密原文不能为空");
    r || (r = vk.pubfn.getData(a.vk, "crypto.aes", z));
    try {
        const e = i.createDecipher("aes192", r);
        t = e.update(n, "hex", "utf8"), t += e.final("utf8");
        try {
            t = JSON.parse(t)
        } catch (e) {
        }
    } catch (e) {
        throw new Error("msg:aes密钥错误")
    }
    return t
};
var K = L, W = {}, G = {};

function Z(e) {
    return e.code = e.errcode, e.msg = e.errmsg, e
}

W.init = function (e) {
    G = e
}, W.getConfig = function () {
    let {vk: e, config: t} = G;
    return e.pubfn.getUniIdConfig(t)
}, W.request = async function (e = {}) {
    let {vk: t} = G, {url: n, method: r, data: i, access_token: a} = e;
    if (a || (a = await W.auth.getAccessToken(e)), !a) return {
        code: -1,
        msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"
    };
    -1 === n.indexOf("http") && (n = "https://api.weixin.qq.com/" + n), r || (r = t.pubfn.isNull(i) ? "GET" : "POST"), r && "POST" === r.toUpperCase() && void 0 === e.useContent && (e.useContent = !0);
    let o = await t.request({...e, url: `${n}?access_token=${a}`});
    return o = Z(o), o
}, W.decrypt = {}, W.decrypt.getPhoneNumber = async function (e = {}) {
    let {vk: t} = G, {code: n} = e;
    if (!n && e.encryptedData) return await W.decrypt.getPhoneNumberByEncryptedData(e);
    let r = {code: 0, msg: "ok"}, i = t.pubfn.isNullOneByObject({code: n});
    if (i) return {code: -1, msg: i + "不能为空"};
    let a = await t.openapi.weixin.request({method: "POST", url: "wxa/business/getuserphonenumber", data: {code: n}});
    return 0 !== a.code ? a : (r.data = a.phone_info, r.phone = r.data.phoneNumber, r.mobile = r.data.phoneNumber, r)
}, W.decrypt.getPhoneNumberByEncryptedData = async function (e = {}) {
    let t, {vk: n} = G, {encryptedData: r, iv: i, sessionKey: a, encryptedKey: o, code: s} = e,
        l = {code: 0, msg: "ok"}, c = n.pubfn.isNullOneByObject({encryptedData: r, iv: i});
    if (c) return {code: -1, msg: c + "不能为空"};
    if (o) {
        let e = n.crypto.aes.decrypt({data: o});
        t = e.appid, a = e.sessionKey
    } else {
        t = W.auth.getAppidInfo(e).appid
    }
    return l.data = W.decrypt.decryptData({
        appid: t,
        encryptedData: r,
        iv: i,
        sessionKey: a
    }), l.phone = l.data.phoneNumber, l.mobile = l.data.phoneNumber, l
}, W.decrypt.decryptData = function (e = {}) {
    let t, {appid: n, encryptedData: r, iv: i, sessionKey: a} = e, {vk: o, crypto: s} = G, l = new Buffer(a, "base64"),
        c = new Buffer(r, "base64"), d = new Buffer(i, "base64");
    try {
        let e = s.createDecipheriv("aes-128-cbc", l, d);
        e.setAutoPadding(!0), t = e.update(c, "binary", "utf8"), t += e.final("utf8"), t = JSON.parse(t)
    } catch (e) {
        throw new Error(e)
    }
    return t.watermark.appid !== n ? {code: -1, msg: "appid不一致"} : t
}, W.auth = {}, W.auth.getAppidInfo = function (e = {}) {
    let {appid: t, appsecret: n} = e, {vk: r, config: i} = G;
    const a = W.getConfig();
    if (t) {
        if (!n) {
            let e = r.pubfn.getData(i, "vk.oauth.weixin.list") || [], a = r.pubfn.getListItem(e, "appid", t) || {};
            if (t = a.appid, n = a.appsecret, r.pubfn.isNullOne(t, n)) throw console.log("config", e), new Error(`你使用了多小程序登录模式，但未找到${t}对应的 appsecret 请先在 uni-config-center/vk-unicloud/index.js 中配置微信小程序（vk.oauth.weixin.list）的appid和appsecret`)
        }
    } else {
        let e = r.pubfn.getData(a, "mp-weixin.oauth.weixin") || {};
        if (t = e.appid, n = e.appsecret, r.pubfn.isNullOne(t, n)) throw console.log("config", a), new Error("请先在 uni-config-center/uni-id/config.json 中配置微信小程序（mp-weixin）的appid和appsecret")
    }
    return {appid: t, appsecret: n}
}, W.auth.getAccessTokenFn = async function (e = {}) {
    let {appid: t, appsecret: n} = W.auth.getAppidInfo(e), {vk: r, config: i} = G, a = await r.request({
        url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${t}&secret=${n}`,
        method: "GET"
    });
    return a.errcode ? (console.error("getAccessToken失败：", a), {code: a.errcode, msg: a.errmsg, err: a}) : {
        code: 0,
        msg: "ok",
        access_token: a.access_token,
        expires_in: a.expires_in
    }
}, W.auth.getAccessToken = async function (e = {}) {
    let t, {appid: n, appsecret: r} = W.auth.getAppidInfo(e), {cache: i = !0} = e, {vk: a} = G, o = "mp-weixin-" + n;
    if (i && (t = await a.globalDataCache.get(o)), a.pubfn.isNull(t)) {
        let n = await W.auth.getAccessTokenFn(e);
        0 === n.code && (t = n.access_token, await a.globalDataCache.set(o, t, 240), await a.globalDataCache.deleteExpired())
    }
    return t
}, W.auth.code2Session = async function (e = {}) {
    let t, {vk: n, uniID: r} = G, {platform: i, context: a, needKey: o = !1} = e;
    i || (i = n.pubfn.getPlatformForUniId(a) || "mp-weixin"), t = "mp-weixin" === i ? await W.auth.code2SessionMpWeixin(e) : "h5-weixin" === i ? await W.h5.auth.code2Session(e) : await r.code2SessionWeixin(e);
    try {
        let e = n.crypto.aes.encrypt({data: t});
        t.encryptedKey = e
    } catch (e) {
    }
    return o || (delete t.sessionKey, delete t.accessToken), delete t.appid, delete t.appsecret, t.platform = i, t
}, W.auth.code2SessionMpWeixin = async function (e = {}) {
    let {appid: t, appsecret: n} = W.auth.getAppidInfo(e), r = e.code || e.js_code, {vk: i} = G, a = await i.request({
        url: `https://api.weixin.qq.com/sns/jscode2session?appid=${t}&secret=${n}&js_code=${r}&grant_type=authorization_code`,
        method: "GET"
    });
    if (a.errcode) {
        let e = a.errmsg;
        return 40163 === a.errcode && (e = "该code已被使用，请重新获取"), 40029 === a.errcode && (e = "无效code，请重新获取"), {
            ...a,
            code: a.errcode,
            msg: e
        }
    }
    return a = i.pubfn.snake2camelJson(a), {appid: t, appsecret: n, ...a, code: 0, msg: "ok"}
}, W.wxacode = {}, W.wxacode.getUnlimited = async function (e = {}) {
    let {vk: t} = G, {
        access_token: n,
        page: r,
        scene: i,
        check_path: a,
        env_version: o,
        width: s,
        auto_color: l,
        line_color: c,
        is_hyaline: d
    } = e;
    if (n || (n = await W.auth.getAccessToken(e)), !n) return {
        code: -1,
        msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"
    };
    let u = await t.request({
        url: "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=" + n,
        method: "POST",
        data: {page: r, scene: i, check_path: a, env_version: o, width: s, auto_color: l, line_color: c, is_hyaline: d},
        dataType: "default",
        useContent: !0,
        headers: {encoding: null}
    });
    if (u.length < 500) {
        let e = u.toString();
        try {
            e = JSON.parse(e)
        } catch (e) {
        }
        return u = Z(e), 40001 === u.code && (u.msg = "access_token错误"), 41030 === u.code && (u.msg = "小程序页面不存在!"), u
    }
    return Buffer.isBuffer(u) ? u : Z(u)
}, W.urlscheme = {}, W.urlscheme.generate = async function (e = {}) {
    let {vk: t} = G, {
        access_token: n,
        jump_wxa: r,
        is_expire: i,
        expire_time: a,
        expire_type: o,
        expire_interval: s
    } = e;
    if (n || (n = await W.auth.getAccessToken(e)), !n) return {
        code: -1,
        msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"
    };
    let l = await t.request({
        url: "https://api.weixin.qq.com/wxa/generatescheme?access_token=" + n,
        method: "POST",
        data: {jump_wxa: r, is_expire: i, expire_time: a, expire_type: o, expire_interval: s},
        useContent: !0
    });
    return l = Z(l), 40001 === l.code && (l.msg = "access_token错误"), 40165 === l.code && (l.msg = "小程序页面不存在!"), l
}, W.urllink = {}, W.urllink.generate = async function (e = {}) {
    let {vk: t} = G, {
        access_token: n,
        path: r,
        query: i,
        is_expire: a,
        expire_type: o,
        expire_time: s,
        expire_interval: l,
        cloud_base: c,
        env_version: d
    } = e;
    if (n || (n = await W.auth.getAccessToken(e)), !n) return {
        code: -1,
        msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"
    };
    let u = await t.request({
        url: "https://api.weixin.qq.com/wxa/generate_urllink?access_token=" + n,
        method: "POST",
        data: {
            path: r,
            query: i,
            is_expire: a,
            expire_type: o,
            expire_time: s,
            expire_interval: l,
            cloud_base: c,
            env_version: d
        },
        useContent: !0
    });
    return u = Z(u), 40001 === u.code && (u.msg = "access_token错误"), 40165 === u.code && (u.msg = "小程序页面不存在!"), u
}, W.security = {}, W.security.msgSecCheck = async function (e = {}) {
    let {vk: t} = G, {content: n, version: r, scene: i, openid: a, title: o, nickname: s, signature: l} = e,
        c = await W.auth.getAccessToken(e);
    if (!c) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    let d = await t.request({
        url: "https://api.weixin.qq.com/wxa/msg_sec_check?access_token=" + c,
        method: "POST",
        data: {content: n, version: r, scene: i, openid: a, title: o, nickname: s, signature: l},
        useContent: !0
    });
    return d = Z(d), 40001 === d.code && (d.msg = "access_token错误"), 87014 === d.code && (d.msg = "内容含有违法违规内容，请检查!"), 2 === r && d.result && 100 !== d.result.label && (d.code = d.result.label, d.msg = "内容含有违法违规内容，请检查!"), d
}, W.security.imgSecCheck = async function (e = {}) {
    let {vk: t} = G, {dataBuffer: n, formData: r, base64: i} = e, a = await W.auth.getAccessToken(e);
    if (!a) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    if (i && !n) {
        let e = "base64,", t = i.indexOf(e);
        t > -1 && (i = i.substring(t + e.length)), n = new Buffer(i, "base64")
    }
    n && !r && (r = new t.formDataUtil.FormData, r.append("media", n, {
        filename: Date.now() + ".png",
        contentType: "image/png"
    }));
    let o = await t.request({
        url: "https://api.weixin.qq.com/wxa/img_sec_check?access_token=" + a,
        content: r.getBuffer(),
        headers: r.getHeaders()
    });
    switch (o = Z(o), o.code) {
        case 40001:
            o.msg = "access_token错误";
            break;
        case 87014:
            o.msg = "图片内容含有违法违规内容，请检查!";
            break;
        case 40006:
            o.msg = "图片大小不能超过1M"
    }
    return o
}, W.riskControl = {}, W.riskControl.getUserRiskRank = async function (e = {}) {
    let {vk: t} = G, {
        appid: n,
        openid: r,
        scene: i,
        mobile_no: a,
        client_ip: o,
        email_address: s,
        extended_info: l,
        is_test: c
    } = e, d = await W.auth.getAccessToken(e);
    if (!d) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    let u = await t.request({
        url: "https://api.weixin.qq.com/wxa/getuserriskrank?access_token=" + d,
        method: "POST",
        data: {
            appid: n,
            openid: r,
            scene: i,
            mobile_no: a,
            client_ip: o,
            email_address: s,
            extended_info: l,
            is_test: c
        },
        useContent: !0
    });
    return u = Z(u), 40001 === u.code && (u.msg = "access_token错误"), u
}, W.subscribeMessage = {}, W.subscribeMessage.send = async function (e = {}) {
    let {vk: t} = G, {
        touser: n,
        template_id: r,
        page: i,
        data: a,
        miniprogram_state: o = "formal",
        lang: s = "zh_CN"
    } = e, l = await W.auth.getAccessToken(e);
    if (!l) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    let c = await t.request({
        url: "https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=" + l,
        method: "POST",
        data: {touser: n, template_id: r, page: i, data: a, miniprogram_state: o, lang: s},
        useContent: !0
    });
    switch (c = Z(c), c.code) {
        case 40003:
            c.msg = "touser字段openid为空或者不正确";
            break;
        case 40037:
            c.msg = "订阅模板id为空不正确";
            break;
        case 43101:
            c.msg = "用户未订阅该消息";
            break;
        case 47003:
            c.msg = "模板参数不准确，可能为空或者不满足规则，errmsg会提示具体是哪个字段出错";
            break;
        case 41030:
            c.msg = "page路径不正确，需要保证在现网版本小程序中存在"
    }
    return c
}, W.uniformMessage = {}, W.uniformMessage.send = async function (e = {}) {
    let {vk: t} = G, {touser: n, template_id: r, url: i, miniprogram: a, data: o} = e,
        s = await W.auth.getAccessToken(e);
    if (!s) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    let {appid: l, appsecret: c} = W.h5.auth.getAppidInfo(e), d = await t.request({
        url: "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token=" + s,
        method: "POST",
        data: {touser: n, mp_template_msg: {appid: l, template_id: r, url: i, miniprogram: a, data: o}},
        useContent: !0
    });
    switch (d = Z(d), d.code) {
        case 40003:
            d.msg = "touser字段openid为空或者不正确";
            break;
        case 40037:
            d.msg = "订阅模板id为空不正确";
            break;
        case 43101:
            d.msg = "用户未订阅该消息";
            break;
        case 47003:
            d.msg = "模板参数不准确，可能为空或者不满足规则，errmsg会提示具体是哪个字段出错";
            break;
        case 41030:
            d.msg = "page路径不正确，需要保证在现网版本小程序中存在"
    }
    return d
}, W.livebroadcast = {}, W.livebroadcast.getLiveInfo = async function (e = {}) {
    let {vk: t} = G, {pageIndex: n = 1, pageSize: r = 100} = e, i = await W.auth.getAccessToken(e);
    if (!i) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的mp-weixin配置的appid和appsecret是否正确"};
    if (n <= 0) return {code: -1, msg: "pageIndex必须是大于0的整数"};
    let a = (n - 1) * r, o = r, s = await t.request({
        url: "https://api.weixin.qq.com/wxa/business/getliveinfo?access_token=" + i,
        method: "POST",
        data: {start: a, limit: o},
        useContent: !0
    });
    switch (s = Z(s), s.code) {
        case 941e4:
            s.msg = "直播间列表为空"
    }
    return s
}, W.app = {}, W.app.auth = {}, W.app.auth.getAppidInfo = function (e = {}) {
    let {appid: t, appsecret: n} = e, {vk: r, config: i} = G;
    const a = W.getConfig();
    if (t) {
        if (!n) {
            let e = r.pubfn.getData(i, "vk.oauth.weixin.list") || [], a = r.pubfn.getListItem(e, "appid", t) || {};
            t = a.appid, n = a.appsecret
        }
    } else {
        let e = r.pubfn.getData(a, "app-plus.oauth.weixin") || {};
        t = e.appid, n = e.appsecret
    }
    if (r.pubfn.isNullOne(t, n)) throw console.log("config", a), new Error("请先在 uni-config-center/uni-id/config.json 中配置微信app登录（app-plus）的appid和appsecret");
    return {appid: t, appsecret: n}
}, W.app.auth.getAccessToken = async function (e = {}) {
    let {appid: t, appsecret: n} = W.app.auth.getAppidInfo(e), {vk: r, config: i} = G, {code: a} = e,
        o = await r.request({
            url: `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${t}&secret=${n}&code=${a}&grant_type=authorization_code`,
            method: "GET"
        });
    return o.errcode ? (console.error("getAccessToken失败：", o), {code: o.errcode, msg: o.errmsg, err: o}) : {
        ...o,
        code: 0,
        msg: "ok"
    }
}, W.app.auth.getUserInfo = async function (e = {}) {
    let {vk: t, config: n} = G, {access_token: r, openid: i, lang: a = "zh-CN"} = e;
    if (!r) return {code: -1, msg: "access_token不能为空"};
    let o = await t.request({
        url: `https://api.weixin.qq.com/sns/userinfo?access_token=${r}&openid=${i}$lang=${a}`,
        method: "GET"
    });
    return o.errcode ? (console.error("getUserInfo失败：", o), {code: o.errcode, msg: o.errmsg, err: o}) : {
        ...o,
        code: 0,
        msg: "ok",
        avatar: o.headimgurl,
        gender: o.sex
    }
}, W.h5 = {}, W.h5.request = async function (e = {}) {
    let {vk: t} = G, {url: n, method: r, data: i, access_token: a} = e;
    if (a || (a = await W.h5.auth.getAccessToken(e)), !a) return {
        code: -1,
        msg: "获取access_token失败，请检查uni-id配置下的h5-weixin配置的appid和appsecret是否正确"
    };
    -1 === n.indexOf("http") && (n = "https://api.weixin.qq.com/" + n), r || (r = t.pubfn.isNull(i) ? "GET" : "POST"), r && "POST" === r.toUpperCase() && void 0 === e.useContent && (e.useContent = !0);
    let o = await t.request({...e, url: `${n}?access_token=${a}`});
    return o = Z(o), o
}, W.h5.auth = {}, W.h5.auth.getAppidInfo = function (e = {}) {
    let {appid: t, appsecret: n} = e, {vk: r, config: i} = G;
    const a = W.getConfig();
    if (t) {
        if (!n) {
            let e = r.pubfn.getData(i, "vk.oauth.weixin.list") || [], a = r.pubfn.getListItem(e, "appid", t) || {};
            t = a.appid, n = a.appsecret
        }
    } else {
        let e = r.pubfn.getData(a, "h5-weixin.oauth.weixin") || {};
        t = e.appid, n = e.appsecret
    }
    if (r.pubfn.isNullOne(t, n)) throw console.log("config", a), new Error("请先配置微信公众号appid和appsecret");
    return {appid: t, appsecret: n}
}, W.h5.auth.code2Session = async function (e = {}) {
    let {appid: t, appsecret: n} = W.h5.auth.getAppidInfo(e), {code: r} = e, {vk: i} = G, a = await i.request({
        url: `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${t}&secret=${n}&code=${r}&grant_type=authorization_code`,
        method: "GET"
    });
    if (a.errcode) {
        let e = a.errmsg;
        return 40163 === a.errcode && (e = "该code已被使用，请重新获取"), 40029 === a.errcode && (e = "无效code，请重新获取"), {
            ...a,
            code: a.errcode,
            msg: e
        }
    }
    return a = i.pubfn.snake2camelJson(a), {appid: t, appsecret: n, ...a, code: 0, msg: "ok"}
}, W.h5.auth.getAccessToken = async function (e = {}) {
    let t, {appid: n, appsecret: r} = W.h5.auth.getAppidInfo(e), {cache: i = !0} = e, {vk: a} = G, o = "h5-weixin-" + n;
    if (i && (t = await a.globalDataCache.get(o)), a.pubfn.isNull(t)) {
        let n = await W.h5.auth.getAccessTokenFn(e);
        if (0 === n.code) t = n.access_token, await a.globalDataCache.set(o, t, 240), await a.globalDataCache.deleteExpired(); else if (console.log("获取微信公众号access_token失败:", n), 40164 === n.code) throw{
            code: n.code,
            msg: "请将固定IP全部加入微信公众号IP白名单，详见搜索文档：固定ip",
            err: n
        }
    }
    return t
}, W.h5.auth.getAccessTokenFn = async function (e = {}) {
    let t, {appid: n, appsecret: r} = W.h5.auth.getAppidInfo(e), {vk: i, config: a} = G;
    if ("aliyun" === i.pubfn.getUniCloudProvider()) {
        let e = await uniCloud.httpProxyForEip.get("https://api.weixin.qq.com/cgi-bin/token", {
            grant_type: "client_credential",
            appid: n,
            secret: r
        });
        if ("string" == typeof e) try {
            e = JSON.parse(e)
        } catch (e) {
            t = {errcode: -1, errmsg: "异常" + e.message}
        }
        t = "object" == typeof e ? e.body : {errcode: -1, errmsg: "异常:getRes未获取到值"}
    } else t = await i.request({
        url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${n}&secret=${r}`,
        method: "GET"
    });
    return t.errcode ? (console.error("getAccessToken失败：", t), {code: t.errcode, msg: t.errmsg, err: t}) : {
        code: 0,
        msg: "ok",
        access_token: t.access_token,
        expires_in: t.expires_in
    }
}, W.h5.subscribeMessage = {}, W.h5.subscribeMessage.send = async function (e = {}) {
    let {vk: t} = G, {touser: n, template_id: r, page: i, data: a, miniprogram: o} = e,
        s = await W.h5.auth.getAccessToken(e);
    if (!s) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的h5-weixin配置的appid和appsecret是否正确"};
    let l = await t.request({
        url: "https://api.weixin.qq.com/cgi-bin/message/subscribe/bizsend?access_token=" + s,
        method: "POST",
        data: {touser: n, template_id: r, page: i, data: a, miniprogram: o},
        useContent: !0
    });
    switch (l = Z(l), l.code) {
        case 40003:
            l.msg = "touser字段openid为空或者不正确";
            break;
        case 40037:
            l.msg = "订阅模板id为空不正确";
            break;
        case 43101:
            l.msg = "用户未订阅该消息";
            break;
        case 47003:
            l.msg = "模板参数不准确，可能为空或者不满足规则，errmsg会提示具体是哪个字段出错";
            break;
        case 41030:
            l.msg = "page路径不正确，需要保证在现网版本小程序中存在"
    }
    return l
}, W.h5.templateMessage = {}, W.h5.templateMessage.send = async function (e = {}) {
    let {vk: t} = G, {touser: n, template_id: r, url: i, miniprogram: a, data: o} = e,
        s = await W.h5.auth.getAccessToken(e);
    if (!s) return {code: -1, msg: "获取access_token失败，请检查uni-id配置下的h5-weixin配置的appid和appsecret是否正确"};
    let l = await t.request({
        url: "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" + s,
        method: "POST",
        data: {touser: n, template_id: r, url: i, miniprogram: a, data: o},
        useContent: !0
    });
    switch (l = Z(l), l.code) {
        case 40003:
            l.msg = "touser字段openid为空或者不正确";
            break;
        case 40037:
            l.msg = "订阅模板id为空不正确";
            break;
        case 43101:
            l.msg = "用户未订阅该消息";
            break;
        case 47003:
            l.msg = "模板参数不准确，可能为空或者不满足规则，errmsg会提示具体是哪个字段出错";
            break;
        case 41030:
            l.msg = "page路径不正确，需要保证在现网版本小程序中存在"
    }
    return l
}, W.loginByWeixin = async function (e = {}, t, n) {
    let r, i, a;
    e.context ? (r = e.data || {}, i = e.context, a = e.custom, e.appid && (r.appid = e.appid), e.appsecret && (r.appsecret = e.appsecret)) : (r = e, i = t, a = n);
    let o, s, {vk: l, uniID: c, _: d} = G, {code: u, platform: p, type: f, appid: g} = r;
    if (p || (p = l.pubfn.getPlatformForUniId(i), r.platform = p), g && ["mp-weixin", "h5-weixin", "app-plus"].indexOf(p) > -1) {
        let e;
        "mp-weixin" === p ? e = W.auth.getAppidInfo(r) : "h5-weixin" === p ? e = W.h5.auth.getAppidInfo(r) : "app-plus" === p && (e = W.app.auth.getAppidInfo(r));
        let {appid: t, appsecret: n} = e, a = l.pubfn.copyObject(W.getConfig());
        l.pubfn.setData(a, p + ".oauth.weixin", {
            appid: t,
            appsecret: n
        }), r.platform = p, s = c.createInstance({context: i, config: a})
    }
    s || (s = c);
    try {
        o = await s.loginByWeixin(r);
        try {
            if (o.uid && !o.msg && (o.msg = "register" === o.type ? "注册成功" : "登录成功"), o.uid && "register" === o.type) {
                let e = {};
                if (["h5-weixin", "app-plus"].indexOf(p) > -1) {
                    let t = await l.openapi.weixin.app.auth.getUserInfo({
                        access_token: o.accessToken,
                        openid: o.openid
                    });
                    e = {nickname: t.nickname, avatar: t.headimgurl}
                }
                ["mp-weixin"].indexOf(p) > -1 && (e = {
                    nickname: r.nickname,
                    avatar: r.avatar
                }), l.pubfn.isNotNull(a) && (e = l.pubfn.objectAssign(e, a)), l.pubfn.isNotNull(e) && (o.userInfo = await l.baseDao.updateAndReturn({
                    dbName: "uni-id-users",
                    whereJson: {_id: o.uid || "___", nickname: d.exists(!1)},
                    dataJson: e
                }))
            }
        } catch (e) {
            console.error("保存用户头像昵称异常：", e)
        }
        if (0 === o.code) try {
            let t = l.crypto.aes.encrypt({
                data: {
                    code: 0,
                    sessionKey: o.sessionKey,
                    openid: o.openid,
                    unionid: o.unionid,
                    uid: o.uid,
                    accessToken: o.accessToken,
                    accessTokenExpired: o.accessTokenExpired,
                    refreshToken: o.refreshToken
                }
            });
            o.encryptedKey = t, e.needKey || (delete o.sessionKey, delete o.accessToken, delete o.refreshToken)
        } catch (e) {
        }
    } catch (e) {
        console.error("loginByWeixin异常：", e);
        let t = e.message || "";
        throw e.message.indexOf("code been used") > -1 && (t = "该code已被使用，请重新获取"), e.message.indexOf("invalid code") > -1 && (t = "无效code，请重新获取"), new Error("msg:" + t)
    }
    return o
};
var H = W, Y = {}, V = {};
Y.init = function (e) {
    V = e
}, Y.open = {}, Y.open.auth = {}, Y.open.auth.getAppidInfo = function (e = {}) {
    let {appid: t, appsecret: n} = e, {vk: r, config: i} = V;
    if (!t) {
        let e = r.pubfn.getData(i, "vk.service.openapi.baidu") || {};
        t = e.appid, n = e.appsecret
    }
    if (r.pubfn.isNullOne(t, n)) throw new Error("请在uniCloud/cloudfunctions/common/uni-config-center/vk-unicloud/index.js中配置并检查百度开放平台的appid和appsecret是否正确，参数路径：vk.service.openapi.baidu");
    return {appid: t, appsecret: n}
}, Y.open.auth.getAccessTokenFn = async function (e = {}) {
    let {appid: t, appsecret: n} = Y.open.auth.getAppidInfo(e), {vk: r, config: i} = V, a = await r.request({
        url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${t}&client_secret=${n}`,
        method: "GET"
    });
    return a.error_code ? (console.error("getAccessToken失败：", a), {
        code: a.error_code,
        msg: a.error_msg,
        err: a
    }) : {...a, code: 0, msg: "ok"}
}, Y.open.auth.getAccessToken = async function (e = {}) {
    let t, {appid: n, appsecret: r} = Y.open.auth.getAppidInfo(e), {cache: i = !0} = e, {vk: a} = V,
        o = "openapi-baidu-" + n;
    if (i && (t = await a.globalDataCache.get(o)), a.pubfn.isNull(t)) {
        let n = await Y.open.auth.getAccessTokenFn(e);
        0 === n.code && (t = n.access_token, await a.globalDataCache.set(o, t, n.expires_in - 3600), await a.globalDataCache.deleteExpired())
    }
    return t
}, Y.open.ocr = {}, Y.open.ocr.business_license = async function (e = {}) {
    let {image: t, url: n} = e;
    return await Y.open.request({
        ...e,
        action: "ocr/v1/business_license",
        actionVersion: "2.0",
        data: {image: t, url: n}
    })
}, Y.open.ocr.idcard = async function (e = {}) {
    let {image: t, url: n, id_card_side: r, detect_risk: i, detect_photo: a} = e;
    return await Y.open.request({
        ...e,
        action: "ocr/v1/idcard",
        actionVersion: "2.0",
        data: {image: t, url: n, id_card_side: r, detect_risk: i, detect_photo: a}
    })
}, Y.open.request = async function (e = {}) {
    let {vk: t} = V, n = await Y.open.auth.getAccessToken(e);
    if (!n) return {
        code: -1,
        msg: "获取access_token失败，请检查vk-unicloud配置下vk.service.openapi.baidu配置的appid和appsecret是否正确"
    };
    let {
        action: r,
        actionVersion: i = "2.0",
        header: a = {"content-type": "application/x-www-form-urlencoded"},
        data: o
    } = e, s = await t.request({
        url: `https://aip.baidubce.com/rest/${i}/${r}?access_token=${n}`,
        method: "POST",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        data: o
    });
    return s.error_code ? {code: s.error_code, msg: s.error_msg, err: s} : {...s, code: 0, msg: "ok"}
};
var Q = Y, X = {};
X.weixin = H, X.baidu = Q, X.init = function (e) {
    X.weixin.init(e), X.baidu.init(e)
};
var ee = X;
const te = /^multipart\/.+?(?:;\s*boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i,
    ne = /Content-Disposition:\sform-data;\sname="(.+?)"(?:;\sfilename="(.+?)")?/i, re = /Content-Type:\s(.+?)$/i;
var ie = {
    FormData: class {
        constructor() {
            this._shouldUseCache = !1, this._cachedBuffer = null, this._lineBreak = "\r\n", this._boundary = "------FormDataBaseBoundary" + Math.random().toString(36).substring(2), this.dataList = []
        }

        _addData(e) {
            if (this._shouldUseCache = !1, 0 === this.dataList.length) return void this.dataList.push(e);
            const t = this.dataList[this.dataList.length - 1];
            switch (`${Buffer.isBuffer(t) ? "buffer" : "other"}_${Buffer.isBuffer(e) ? "buffer" : "other"}`) {
                case"buffer_buffer":
                    this.dataList.push(this._lineBreak), this.dataList.push(e);
                    break;
                case"buffer_other":
                    this.dataList.push(this._lineBreak + e);
                    break;
                case"other_buffer":
                    this.dataList[this.dataList.length - 1] = t + "\r\n", this.dataList.push(e);
                    break;
                case"other_other":
                    this.dataList[this.dataList.length - 1] = t + "\r\n" + e
            }
        }

        append(e, t, n) {
            this._addData("--" + this._boundary);
            let r = `Content-Disposition: form-data; name="${encodeURIComponent(e)}"`;
            if (Buffer.isBuffer(t)) {
                if (!n.filename || !n.contentType) throw new Error("filename and contentType required");
                r += `; filename="${encodeURIComponent(n.filename)}"`, this._addData(r), this._addData("Content-Type: " + n.contentType), this._addData(""), this._addData(t)
            } else this._addData(r), this._addData(""), this._addData(t)
        }

        getHeaders(e) {
            const t = {"Content-Type": "multipart/form-data; boundary=" + this._boundary};
            return Object.assign(t, e)
        }

        getBuffer() {
            if (this._shouldUseCache) return this._cachedBuffer;
            this._shouldUseCache = !0;
            let e = Buffer.alloc(0);
            return this.dataList.forEach(t => {
                e = Buffer.isBuffer(t) ? Buffer.concat([e, t]) : Buffer.concat([e, Buffer.from("" + t)])
            }), e = Buffer.concat([e, Buffer.from(`${this._lineBreak}--${this._boundary}--`)]), this._cachedBuffer = e, e
        }
    }, formParser: e => {
        const t = (e.headers["content-type"] || e.headers["Content-Type"]).match(te), n = t[1] || t[2],
            r = function (e, t) {
                let n = 0, r = 0, i = [];
                for (; -1 !== (r = e.indexOf(t, n));) i.push(e.slice(n, r)), n = r + t.length, r = e.indexOf(t, n);
                return i
            }(Buffer.from(e.body, "base64"), Buffer.from("--" + n)).map(e => function (e) {
                let t = e.indexOf("\r\n") + "\r\n".length, n = t, r = e.lastIndexOf("\r\n"), i = [];
                for (; -1 !== (n = e.indexOf("\r\n", t));) if (i.push(e.slice(t, n)), t = n + "\r\n".length, 0 === i[i.length - 1].length) {
                    i.push(e.slice(t, r));
                    break
                }
                return i
            }(e).filter(e => e.length > 0)).filter(e => 2 === e.length || 3 === e.length || 4 === e.length).map(e => {
                const t = {}, n = e[0].toString().match(ne);
                switch (t.name = decodeURIComponent(n[1]), e.length) {
                    case 2:
                        t.value = e[1].toString();
                        break;
                    case 3:
                        t.filename = decodeURIComponent(n[2]), t.contentType = e[1].toString().match(re)[1], t.fileContent = e[2];
                        break;
                    case 4:
                        t.filename = decodeURIComponent(n[2]), t.contentType = e[1].toString().match(re)[1], t.fileContent = e[3]
                }
                return t
            }), i = {};
        return r.forEach(e => {
            const t = e.name;
            delete e.name, i[t] = e.fileContent ? e : e.value
        }), i
    }
};
const ae = "opendb-admin-menus";
var oe = {}, se = {};
oe.init = function (e) {
    se = e
}, oe.findRoleById = async (e = "___") => {
    let t, {vk: n, db: r, _: i} = se;
    return t = await n.baseDao.findByWhereJson({dbName: "uni-id-roles", whereJson: {role_id: e}}), t
}, oe.roleBindPermission = async (e = {}) => {
    let {vk: t, db: n, _: r} = se, i = {code: 0, msg: ""}, {
        role_id: a = "___",
        permissionList: o = [],
        reset: s = !1
    } = e;
    if (!s) {
        let e = await oe.findRoleById(a), {permission: t = []} = e;
        o = t.concat(o), o = [...new Set(o)]
    }
    return i.num = await t.baseDao.update({
        dbName: "uni-id-roles",
        whereJson: {role_id: a},
        dataJson: {permission: r.set(o)}
    }), i
}, oe.roleBindMenu = async (e = {}) => {
    let {vk: t, db: n, _: r} = se, i = {code: 0, msg: ""}, {
        role_id: a = "___",
        menuList: o = [],
        reset: s = !1,
        addPermission: l = !1
    } = e, c = [], d = await oe.findRoleById(a), {menu: u = [], permission: p = []} = d;
    if (s ? c = ce(o, u) : (o = u.concat(o), o = [...new Set(o)]), i.num = await t.baseDao.update({
        dbName: "uni-id-roles",
        whereJson: {role_id: a},
        dataJson: {menu: r.set(o)}
    }), l) {
        let e = await oe.findMenuByIdsToPermission(o), n = [];
        if (s && t.pubfn.isNotNull(c)) {
            n = ce(e, await oe.findMenuByIdsToPermission(c))
        }
        p = p.concat(e), p = ce(n, p), p = [...new Set(p)], oe.roleBindPermission({
            role_id: a,
            permissionList: p,
            reset: !0
        })
    }
    return i
}, oe.findPermissionById = async (e = "___") => {
    let t, {vk: n, db: r, _: i} = se;
    return t = await n.baseDao.findByWhereJson({dbName: "uni-id-permissions", whereJson: {permission_id: e}}), t
}, oe.findMenuByIdsToPermission = async e => {
    let {vk: t, db: n, _: r} = se, i = await oe.findMenuByIds(e);
    if (t.pubfn.isNull(i)) return [];
    let a = [];
    for (let e in i) {
        let n = i[e].permission;
        t.pubfn.isNotNull(n) && (a = a.concat(n))
    }
    return a = [...new Set(a)], a
}, oe.listPermissionToTree = async (e = {}) => {
    let t, {vk: n, db: r, _: i} = se, {
        getCount: a = !1,
        pageSize: o = 500,
        pageIndex: s = 1,
        whereJson: l = {parent_id: null},
        sortArr: c = [{name: "sort", type: "asc"}],
        treeProps: d = {}
    } = e, {level: u = 3, limit: p = 500, whereJson: f} = d;
    t = await n.baseDao.selects({
        dbName: "uni-id-permissions",
        pageIndex: s,
        pageSize: o,
        getCount: a,
        whereJson: l,
        sortArr: c,
        treeProps: {
            id: "permission_id",
            parent_id: "parent_id",
            children: "children",
            level: u,
            limit: p,
            whereJson: f,
            sortArr: c
        }
    });
    let g = {id: "permission_id", parent_id: "parent_id", children: "children"}, m = t.rows;
    m = n.pubfn.treeToArray(m, g), t.list = n.pubfn.copyObject(m);
    for (let e in m) {
        let t = m[e], r = "", i = "";
        if (n.pubfn.isNotNull(t.level)) {
            r = ` - ${["未分类", "子弹级", "炸弹级", "榴弹级", "核弹级"][t.level]}（LV：${t.level}）`
        }
        if (n.pubfn.isNotNull(t.curd_category)) {
            i = " - " + ["未分类", "增", "删", "改", "查", "特殊"][t.curd_category]
        }
        m[e].label = `${t.permission_name}（${t.permission_id}）${i}${r}`
    }
    return m = n.pubfn.arrayToTree(m, g), t.rows = m, t
}, oe.findMenuById = async (e = "___") => {
    let t, {vk: n, db: r, _: i} = se;
    return t = await n.baseDao.findByWhereJson({dbName: ae, whereJson: {menu_id: e}}), t
}, oe.findMenuByIds = async e => {
    let t, {vk: n, db: r, _: i} = se;
    return n.pubfn.isNull(e) ? [] : (t = (await n.baseDao.select({
        dbName: ae,
        pageIndex: 1,
        pageSize: 500,
        whereJson: {menu_id: i.in(e)}
    })).rows, t)
}, oe.listMenuByRole = async (e = {}) => {
    let {vk: t, db: n, _: r} = se, i = {code: 0, msg: "", menus: [], menuList: []}, {role: a, treeProps: o = {}} = e,
        s = [], l = {enable: !0}, c = {enable: !0};
    if (!(a.indexOf("admin") > -1)) {
        if (t.pubfn.isNull(a)) return i;
        let e = await t.baseDao.select({
            dbName: "uni-id-roles",
            pageSize: 500,
            whereJson: {role_id: r.in(a), enable: !0},
            fieldJson: {menu: !0}
        });
        for (let n in e.rows) {
            let {menu: r} = e.rows[n];
            t.pubfn.isNotNull(r) && (s = s.concat(r))
        }
        if (0 == s.length) return i;
        s = [...new Set(s)], l.menu_id = r.in(s), c.menu_id = r.in(s)
    }
    l.parent_id = r.in([null, ""]);
    let d = [{name: "sort", type: "asc"}], {level: u = 3, limit: p = 500} = o, f = await t.baseDao.selects({
        dbName: ae,
        pageIndex: 1,
        pageSize: 500,
        whereJson: l,
        sortArr: d,
        treeProps: {
            id: "menu_id",
            parent_id: "parent_id",
            children: "children",
            level: u,
            limit: p,
            whereJson: c,
            sortArr: d
        }
    });
    return i.menus = f.rows, i.menuList = t.pubfn.treeToArray(f.rows, {
        id: "menu_id",
        parent_id: "parent_id",
        children: "children"
    }), i
}, oe.menuBindPermission = async (e = {}) => {
    let {vk: t, db: n, _: r} = se, i = {code: 0, msg: ""}, {
        menu_id: a = "___",
        permissionList: o = [],
        reset: s = !1
    } = e;
    if (!s) {
        let e = await oe.findMenuById(a), {permission: t = []} = e;
        o = t.concat(o), o = [...new Set(o)]
    }
    return i.num = await t.baseDao.update({dbName: ae, whereJson: {menu_id: a}, dataJson: {permission: r.set(o)}}), i
}, oe.listMenuToTree = async (e = {}) => {
    let t, {vk: n, db: r, _: i} = se, {
        getCount: a = !1,
        pageSize: o = 500,
        pageIndex: s = 1,
        whereJson: l = {parent_id: null},
        sortArr: c = [{name: "sort", type: "asc"}],
        treeProps: d = {}
    } = e, {level: u = 3, limit: p = 500, whereJson: f} = d;
    t = await n.baseDao.selects({
        dbName: ae,
        pageIndex: s,
        pageSize: o,
        getCount: a,
        whereJson: l,
        sortArr: c,
        treeProps: {
            id: "menu_id",
            parent_id: "parent_id",
            children: "children",
            level: u,
            limit: p,
            whereJson: f,
            sortArr: c
        }
    });
    let g = {id: "menu_id", parent_id: "parent_id", children: "children"}, m = t.rows;
    m = n.pubfn.treeToArray(m, g), t.list = n.pubfn.copyObject(m);
    for (let e in m) {
        let t = m[e];
        m[e].label = `${t.name}（${t.menu_id}）`
    }
    return m = n.pubfn.arrayToTree(m, g), t.rows = m, t
};
var le = oe;

function ce(e, t) {
    let n = new Set(e);
    return t.filter(e => !n.has(e))
}

const de = "vk-global-data";
var ue = {}, pe = {};
ue.init = function (e) {
    pe = e
}, ue.find = async e => {
    let {vk: t, db: n, _: r} = pe, i = {};
    return i = await t.baseDao.findById({dbName: de, id: e}), i
}, ue.del = async e => {
    let {vk: t, db: n, _: r} = pe, i = {};
    return i = await t.baseDao.deleteById({dbName: de, id: e}), i
}, ue.deleteByWhere = async e => {
    let {vk: t, db: n, _: r} = pe, i = {};
    return i = await t.baseDao.del({dbName: de, whereJson: e}), i
}, ue.deleteExpired = async e => {
    let {vk: t, db: n, _: r} = pe, i = {}, a = {};
    "string" == typeof e ? a._id = e : "object" == typeof e && (a = e);
    let o = (new Date).getTime();
    return i = await t.baseDao.del({dbName: de, whereJson: {...a, expired_at: r.gt(0).lte(o)}}), i
}, ue.update = async e => {
    let {vk: t, db: n, _: r} = pe, i = {}, {key: a, value: o, comment: s, expired_at: l} = e;
    return i = await t.baseDao.updateById({
        dbName: de,
        id: a,
        dataJson: {value: r.set(o), comment: s, expired_at: l}
    }), i
}, ue.add = async e => {
    let {vk: t, db: n, _: r} = pe, i = {}, {key: a, value: o, comment: s, expired_at: l} = e;
    return i = await t.baseDao.add({dbName: de, dataJson: {_id: a, key: a, value: o, comment: s, expired_at: l}}), i
}, ue.count = async e => {
    let {vk: t, db: n, _: r} = pe, i = {};
    return i = await t.baseDao.count({dbName: de, whereJson: e}), i
}, ue.set = async e => {
    let {vk: t, db: n, _: r} = pe, i = {code: 0, msg: "ok"}, a = new Date;
    e._add_time = a.getTime(), e._add_time_str = t.pubfn.timeFormat(a, "yyyy-MM-dd hh:mm:ss");
    let o = await n.collection(de).doc(e.key).set(e);
    return o.upsertedId ? (i.id = o.upsertedId, i.mode = "add") : (i.mode = "update", i.updated = o.updated), i.num = 1, i
}, ue.inc = async e => {
    let {vk: t, db: n, _: r} = pe, {key: i, value: a, expired_at: o} = e, s = {},
        l = await t.baseDao.updateById({dbName: de, id: i, dataJson: {value: r.inc(a), expired_at: o}});
    if (0 == l) {
        0 === await ue.count({_id: i}) && (s.id = await ue.add(e), s.num = 1, s.mode = "add")
    } else s.num = l, s.mode = "update";
    return s
}, ue.list = async e => {
    let {vk: t, db: n, _: r} = pe, i = {}, {pageIndex: a, pageSize: o, whereJson: s, sortArr: l} = e;
    return i = await t.baseDao.select({dbName: de, pageIndex: a, pageSize: o, whereJson: s, sortArr: l}), i
};
var fe = ue, ge = {}, me = {
    init: function (e) {
        ge = e
    }
}, he = {
    specialUrlEncode: function (e) {
        return (e = encodeURIComponent(e)).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~")
    }, sign: function (e, t) {
        let {crypto: n} = ge;
        return n.createHmac("sha1", e).update(t).digest("base64")
    }
};
me.sendSms = async function (e) {
    let {vk: t, config: n} = ge, {
        provider: r,
        appid: i,
        smsKey: a,
        smsSecret: o,
        signName: s,
        phone: l,
        templateId: c,
        data: d
    } = e, u = {};
    if ("aliyun" === r) {
        let r = t.pubfn.getData(n, "vk.service.sms.aliyun");
        t.pubfn.isNotNull(r) && (a || (e.smsKey = r.accessKeyId), o || (e.smsSecret = r.accessKeySecret), s || (e.signName = r.signName)), u = await me.sendSmsByAliyun(e)
    } else {
        if ("unicloud" !== r) return {code: -1, msg: `暂不支持${r}供应商`};
        {
            let r = t.pubfn.getData(n, "uni.service.sms");
            t.pubfn.isNotNull(r) && (a || (e.smsKey = r.smsKey), o || (e.smsSecret = r.smsSecret), s || (e.signName = r.signName)), u = await me.sendSmsByUnicloud(e)
        }
    }
    return u.requestParam = {provider: r, phone: l}, u
}, me.sendSmsByAliyun = async function (e) {
    let {vk: t, config: n} = ge, {
        provider: r,
        appid: i,
        smsKey: a,
        smsSecret: o,
        signName: s,
        phone: l,
        templateId: c,
        data: d
    } = e, u = {code: 0, msg: ""};
    try {
        if (t.pubfn.isNullOne(a, o)) return {
            code: -1,
            msg: "阿里云短信配置错误，请检查vk-unicloud配置下的vk.service.sms.aliyun配置的accessKeyId和accessKeySecret是否正确"
        };
        let e = "https://dysmsapi.aliyuncs.com", n = t.pubfn.timeFormat(new Date, "yyyy-MM-ddThh:mm:ssZ", 0),
            r = (new Date).getTime().toString().substring(7) + t.pubfn.random(30);
        "object" == typeof d && (d = JSON.stringify(d));
        let i = {
            SignatureMethod: "HMAC-SHA1",
            SignatureNonce: r,
            AccessKeyId: a,
            SignatureVersion: "1.0",
            Timestamp: n,
            Format: "json",
            Action: "SendSms",
            Version: "2017-05-25",
            PhoneNumbers: l,
            SignName: s,
            TemplateParam: d,
            TemplateCode: c
        };
        delete i.Signature;
        let p = [];
        for (let e in i) p.push(e);
        p.sort();
        let f = !1, g = "";
        for (let e in p) {
            let t = p[e];
            g += "&" + he.specialUrlEncode(t) + "=" + he.specialUrlEncode(i[t])
        }
        g = g.substring(1);
        let m = "GET&" + he.specialUrlEncode("/") + "&" + he.specialUrlEncode(g), h = he.sign(o + "&", m),
            y = he.specialUrlEncode(h), b = "Signature=" + y + "&" + g;
        f && (console.log("\r\n随机数\r\n"), console.log(i.SignatureNonce), console.log("\r\n=========\r\n"), console.log(i.Timestamp), console.log("\r\n====sortedQueryString====\r\n"), console.log(g), console.log("\r\n=====stringToSign====\r\n"), console.log(m), console.log("\r\n=====sign====\r\n"), console.log(h), console.log("\r\n=====signature====\r\n"), console.log(y), console.log("\r\n=========\r\n"), console.log(e + "/?" + b));
        t.pubfn.urlStringToJson(b);
        let w = await t.request({url: `${e}?${b}`, method: "GET"});
        return u = "OK" === w.Code ? {code: 0, msg: "ok", requestRes: w} : {code: -1, msg: w.Message, requestRes: w}, u
    } catch (e) {
        return {code: -1, msg: "短信发送失败", err: {message: e.message, stack: e.stack}}
    }
}, me.sendSmsByUnicloud = async function (e) {
    let {vk: t, config: n} = ge, {
        provider: r,
        appid: i,
        smsKey: a,
        smsSecret: o,
        signName: s,
        phone: l,
        templateId: c,
        data: d
    } = e, u = {code: 0, msg: ""};
    try {
        if (t.pubfn.isNullOne(a, o)) return {
            code: -1,
            msg: "unicloud短信配置错误，请检查uni-id配置下的service.sms配置的smsKey和smsSecret是否正确"
        };
        let e = await uniCloud.sendSms({smsKey: a, smsSecret: o, phone: l, templateId: c, data: d});
        u = 0 == e.code || 0 == e.errCode ? {code: 0, msg: "ok", requestRes: e} : {
            code: -1,
            msg: e.errMessage || e.errMsg,
            requestRes: e
        }
    } catch (e) {
        return {code: -1, msg: "短信发送失败", err: {message: e.message, stack: e.stack}}
    }
    return u
}, me.sendSmsVerifyCode = async function (e) {
    let t, {vk: n, config: r, uniID: i} = ge, {provider: a, phone: o, code: s, type: l, expiresIn: c = 180} = e,
        d = {code: 0, msg: ""};
    if ("unicloud" === a) {
        t = n.pubfn.getData(r, "uni.service.sms.templateId");
        let e = n.pubfn.getData(r, "uni.service.sms.codeExpiresIn");
        e && (c = e);
        let i = n.pubfn.getData(r, "uni.service.sms.name"), l = Math.ceil(c / 60).toString();
        d = await n.system.smsUtil.sendSms({
            provider: a,
            phone: o,
            templateId: t,
            data: {code: s, name: i, action: "身份验证", expMinute: l}
        })
    } else t = n.pubfn.getData(r, `vk.service.sms.${a}.templateCode.verifyCode`), d = await n.system.smsUtil.sendSms({
        provider: a,
        phone: o,
        templateId: t,
        data: {code: s}
    });
    return 0 === d.code && await i.setVerifyCode({mobile: o, code: s, expiresIn: c, type: l}), d
};
var ye = me, be = {};
be.sysDao = le, be.globalDataDao = fe, be.smsUtil = ye, be.init = function (e) {
    let t = ["sysDao", "globalDataDao", "smsUtil"];
    for (let n in t) {
        let r = t[n];
        "function" == typeof be[r].init && be[r].init(e)
    }
};
var we = be, ke = {};

class _e {
    constructor(e) {
        this.router = u, this.md5 = b, this.baseDao = _, this.request = v, this.callFunction = N, this.pubfn = J, this.temporaryCache = F, this.globalDataCache = U, this.crypto = K, this.openapi = ee, this.formDataUtil = ie, this.system = we, this.baseDir = null, e && this.init(e)
    }

    require(e) {
        return ke.requireFn(this.baseDir + "/" + e)
    }

    requireFn(e) {
        try {
            return ke.requireFn(e)
        } catch (e) {
            let {message: t = ""} = e;
            return void (-1 == t.indexOf("Cannot find module") && -1 == t.indexOf("no such file or directory") && console.error(e))
        }
    }

    use(e, t) {
        for (let n in e) e[n] && "function" == typeof e[n].init && e[n].init(t), this[n] = e[n]
    }

    getGlobalObject() {
        return "object" == typeof globalThis ? globalThis : "object" == typeof self ? self : "object" == typeof window ? window : "object" == typeof e ? e : void 0
    }

    init(e = {}) {
        let t = this;
        if (e.requireFn && (ke.requireFn = e.requireFn), e.baseDir && (t.baseDir = e.baseDir), e.configCenter || (e.configCenter = t.requireFn("uni-config-center")), e.uniID || (e.uniID = t.requireFn("uni-id")), e.uniPay || (e.uniPay = t.requireFn("uni-pay")), e.middlewareService || (e.middlewareService = t.requireFn("./middleware/index")), e.daoCenter || (e.daoCenter = t.requireFn("./dao/index")), e.crypto || (e.crypto = t.requireFn("crypto")), e.urlrewrite || (e.urlrewrite = t.requireFn("./util/urlrewrite")), e.config || (e.config = e.configCenter({pluginId: "vk-unicloud"}).requireFile("index.js")), !e.config) throw new Error("配置文件：uniCloud/cloudfunctions/common/uni-config-center/vk-unicloud/index.js \n编译错误，请检查！");
        if (!e.db) try {
            e.db = uniCloud.database()
        } catch (e) {
        }
        if (t.vkPay = t.requireFn("vk-uni-pay"), e.pubFun || (e.pubFun = t.requireFn("./util/pubFunction")), e.pubFun && (t.myfn = e.pubFun), e.redis || (e.redis = t.requireFn("vk-redis")), e.redis) t.redisUtil = e.redis, t.redis = e.redis.redis, t.newRedis = e.redis.newRedis; else try {
            t.redis = uniCloud.redis
        } catch (e) {
        }
        e.db && (ke.db = e.db, ke._ = e.db.command), ke.pubfn = t.pubfn, e.configCenter && (ke.configCenter = e.configCenter), e.config && (ke.config = e.config), e.uniID && (ke.uniID = e.uniID), e.uniPay && (ke.uniPay = e.uniPay), e.middlewareService && (ke.middlewareService = e.middlewareService), e.pubFun && (ke.pubFun = e.pubFun), e.customUtil && (ke.customUtil = e.customUtil), e.crypto && (ke.crypto = e.crypto), e.urlrewrite && (ke.urlrewrite = e.urlrewrite);
        const n = {vk: t, ...ke};
        t.use({
            daoCenter: e.daoCenter,
            baseDao: t.baseDao,
            openapi: t.openapi,
            globalDataCache: t.globalDataCache,
            system: t.system,
            pubFun: e.pubFun
        }, n);
        try {
            let e = t.getGlobalObject();
            "object" == typeof e && (e.vk = t)
        } catch (e) {
        }
    }

    getUnicloud() {
        return ke
    }

    createInstance(e) {
        return new _e(e)
    }
}

var ve = new _e;
module.exports = ve;
