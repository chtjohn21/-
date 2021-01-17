window.addEventListener('load', function (e) {
    // 获取canvas元素
    // var can = document.getElementById('canvas');
    var can = document.querySelector('#canvas');
    // 宽度高度按照浏览器屏幕尺寸的90% 80%
    can.width = screen.width * 1;
    can.height = screen.height * 0.8;
    var body = document.body;
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    can.style.display = 'block';
    can.style.margin = 'auto';
    // 定义画笔
    var brush = can.getContext('2d');
    // 定义 INDEX 索引值 
    var INDEX = 0;
    var WW = [7, 9, 11, 13, 15];
    var HH = [14, 18, 22, 26, 30];
    var jianmie = 0;
    var home = [];
    var D = {
        U: 'U',
        D: 'D',
        L: 'L',
        R: 'R'
    };
    var E = {
        WALL: '墙块',
        ENEMY: '敌军',
        BULLET: '子弹',
        PLANE: '飞机',
        PROP: '道具',
        PHOTO: '图片',
        BOOM: '炸弹',
        SELF: '我军',
        CMD: '指挥官',
    }

    var ZT = {
        WKS: '未开始',
        JZ: '激战',
        BD: '沉睡',
        BBD: '被冰冻',
        WIN: '胜利',
        SB: '失败',
        DFH: '待复活',
        PAUSE: '暂停'
    }
    var overy = can.height + 70;
    var overtimer = null;
    var zt = ZT.WKS; // 游戏的初始状态为未开始

    // 音频
    var kaipao = new Audio();
    kaipao.src = 'sounds/attack.mp3';

    var tkbz = new Audio();
    tkbz.src = 'sounds/bomb1.wav';

    var p0 = new Audio();
    p0.src = 'sounds/speed.wav';
    var p1 = new Audio();
    p1.src = 'sounds/prop.mp3';
    var p3 = new Audio();
    p3.src = 'sounds/daxiao.wav';
    var p4 = new Audio();
    p4.src = 'sounds/prop.wav';
    var p6 = new Audio();
    p6.src = 'sounds/blei.wav';
    var p7 = new Audio();
    p7.src = 'sounds/zeg.wav';
    var p11 = new Audio();
    p11.src = 'sounds/newenemy.wav';
    var begin = new Audio();
    begin.src = 'sounds/go.wav';
	var cao = new Audio();
    cao.src = 'sounds/cao.wav';

    /**
     * 
     * @param {x} x x轴坐标
     * @param {y} y y轴坐标
     * @param {w} w 宽度
     * @param {h} h 高度
     * @param {src} src 图片链接
     * @param {type} type 类别
     */


    function Base(x, y, w, h, src, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.src = src;
        this.type = type;
        this.hp = 100;
        this.index = INDEX++;
        this.img = new Image();
        this.img.src = 'images/' + src
        this.show = function () {
            brush.drawImage(this.img, this.x, this.y, this.w, this.h);
            this.paintBlood();
        }
        // 血条
        this.paintBlood = function () {
            // 血条的宽度  = 宽度 * 血量 / 100
            var bw = this.w * (this.hp / 100);
            // 血条的颜色
            brush.fillStyle = 'lawngreen';
            if (this.hp < 30) {
                brush.fillStyle = 'red';
            } else if (this.hp < 60) {
                brush.fillStyle = 'orange';
            } else if (this.hp < 80) {
                brush.fillStyle = 'yellow';
            }
            // 血条的位置
            brush.fillRect(this.x, this.y - 6, bw, 6);
        }
        this.die = function () {
            this.hp = 0;
            clearInterval(this.movetimer);
            st.remove(this);

            if (this.type == E.ENEMY) {
                clearInterval(this.controller);
                tkbz.play();
                jianmie++; // 歼灭数量
                enemycount--; // 总数量
                if (enemycount == 0) {
                    zt = ZT.WIN;
                }
            }


            // CMD死了游戏失败
            if (this.type == E.CMD) {
                zt = ZT.SB;
                me.die();
                me1.die();
                overtimer = setInterval(function () {
                    overy -= 5;
                    if (overy <= can.height / 2) {
                        clearInterval(overtimer);
                    }
                }, 30);
            } else if ( this.type == E.SELF ){
				cao.play();
			}

            if (this.type == E.ENEMY || this.type == E.SELF || this.type == E.WALL) {
                var b = new Bomb(this);
                st.add(b);
            }
        }

        this.gaixue = function (n) {
            if (this.fang && n < 0) {
                n = n + this.fang;
            }
            this.hp += n;
            this.hp = this.hp > 100 ? 100 : this.hp;
            if (this.hp <= 0) {
                this.die();
            }
        }
    }

    // 死亡物体产生的爆炸特效
    function Bomb(o) {
        var b = new Base(o.x, o.y, o.w, o.h, 'b0.gif', E.PHOTO);
        b.i = 0;
        b.timer = setInterval(function () {
            b.i++;
            if (b.i > 8) {
                clearInterval(b.timer);
                b.die();
                var p = new Prop(b);
                st.add(p);
                return;
            }
            b.img.src = 'images/b' + b.i + '.gif';
        }, 80);
        b.paintBlood = function () { } // 无血条
        return b;
    }


    // 道具
    function Prop(o) {
        var n = parseInt(Math.random() * 11);
        // n = 2;
        var p = new Base(o.x, o.y, 26, 26, 'yy' + n + '.jpg', E.PROP);
        p.paintBlood = function () { } // 道具去血条
        p.x += (o.w - 26) / 2;
        p.y += (o.h - 26) / 2;
        p.n = n;
        return p;
    }

    // 墙块
    function Wall(x, y) {
        var o = new Base(x, y, 30, 30, 'qiang.gif', E.WALL);
        return o;
    }

    function Cmd(x, y) {
        var o = new Base(x, y, 90, 90, 'p3.gif', E.CMD);
        o.fang = 6;
        return o;
    }

    // 坦克
    function Tank(x, y, src, type) {
        var o = new Base(x, y, 40, 40, src, type);
        // var o1 = new Base(x, y, 40, 40, src, type);
        o.speed = 3;// 移动速度
        o.gong = 15;         // 攻击力 15 20 25 30 35 （升级） 
        o.fang = 0;        // 防御力 0 3 6 9 12 (升级)
        o.dir = D.U;        // 方向朝上
        o.left = false;// 左
        o.right = false; // 右
        o.up = false;// 上
        o.down = false;// 下
        o.pianyi = function () {
            var zx = can.width / 2, zy = can.height / 2;
            var p = 5, q = 5;
            p = o.x > zx ? -p : p;
            q = o.y > zy ? -q : q;
            while (true) {
                var t = checkhit(o);
                if (t == null) {
                    break;
                }
                o.x += p;
                o.y += q;
            }
        }
        // 移动
        o.yidong = function () {
            if (bunengdong(o)) return;
            var ox = o.x, oy = o.y; // 记录旧坐标
            // 移动
            if (o.left) {
                o.x -= o.speed;
            } else if (o.right) {
                o.x += o.speed;
            } else if (o.up) {
                o.y -= o.speed;
            } else if (o.down) {
                o.y += o.speed;
            }

            // 判断是否移动到画布的边缘 
            if (out(o)) {
                o.x = ox; o.y = oy;
                o.outDie(); // 飞出边界的子弹死掉
            }

            // 调用碰撞检查的方法，检查是否发生碰撞，返回被碰撞物体
            var p = check(o);
            if (p != null) {
                o.x = ox; o.y = oy;
                if (o.type == E.BULLET) {
                    p.gaixue(-o.tank.gong);
                    o.die();
                } else if (p.type == E.PROP) { // 坦克吃道具
                    o.eat(p);
                }
            }
        }

        o.eat = function (p) {
            p.die();
            switch (p.n) {
                case 0:
                    o.tisu(); // 提速
                    o.p0();
                    break;
                case 1:
                    o.yongbao(); // 正方增加生命 反方随机生产坦克
                    break;
                case 2:
                    o.changezt() // 修改当前游戏状态
                    break;
                case 3:
                    o.shenggong(); // 增加攻击
                    o.p3();
                    break;
                case 4:
                    o.shengfang(); // 增加防御
                    o.p4();
                    break;
                case 5:
                    o.changehome() // 修改房屋的血量
                    break;
                case 6:
                    o.gaixue(30);
                    o.p6();
                    break;
                case 7:
                    var n = parseInt(Math.random() * 20) + 30;
                    o.gaixue(-n)
                    o.p7();
                    break;
                case 8:
                    o.zhongcaomei();
                    break;
                case 9:
                    o.ciya();
                    break;
            }
        }

        o.changezt = function () {
            if (zt != ZT.JZ) return;
            var zttimer = null;
            var tp = zt; // 记录当前游戏状态
            zt = o.type == E.SELF ? ZT.BD : ZT.BBD;
            var second = 5; // 冰冻的时间是5 秒
            zttimer = setInterval(function () {
                second--;
                if (second == 0) {
                    clearInterval(zttimer);
                    // 恢复游戏状态
                    if (zt != ZT.WIN && zt != ZT.SB) {
                        zt = tp; // 如果没有胜利也没有失败，才能恢复
                    }
                }
            }, 1000)
        }

        // 提速
        o.tisu = function () {
            o.speed++;
            o.speed = o.speed > 7 ? 7 : o.speed;
        }
        // 增加攻击力
        o.shenggong = function () {
            o.gong += 5;
            o.gong = o.gong > 35 ? 35 : o.gong;
        }

        // 增加防御
        o.shengfang = function () {
            o.fang += 3;
            o.fang = o.fang > 12 ? 12 : o.fang;
        }

        o.outDie = function () { }

        // 定时器
        o.movetimer = setInterval(o.yidong, 30);
        // 按下启动
        o.toLeft = function () {
            o.dir = D.L; // o.src = 'wU.gif';
            o.src = o.src.substring(0, o.src.lastIndexOf('.') - 1);
            o.src += 'L.gif';
            // o.src += 'U1.png';
            o.img.src = 'images/' + o.src;
            o.left = true;
            o.right = false;
            o.up = false;
            o.down = false;
        }
        o.toRight = function () {
            o.dir = D.R; // o.src = 'wU.gif';
            o.src = o.src.substring(0, o.src.lastIndexOf('.') - 1);
            o.src += 'R.gif';
            o.img.src = 'images/' + o.src;
            o.left = false;
            o.right = true;
            o.up = false;
            o.down = false;
        }
        o.toUp = function () {
            o.dir = D.U; // o.src = 'wU.gif';
            o.src = o.src.substring(0, o.src.lastIndexOf('.') - 1);
            o.src += 'U.gif';
            o.img.src = 'images/' + o.src;
            o.left = false;
            o.right = false;
            o.up = true;
            o.down = false;
        }
        o.toDown = function () {
            o.dir = D.D; // o.src = 'wU.gif';
            o.src = o.src.substring(0, o.src.lastIndexOf('.') - 1);
            o.src += 'D.gif';
            o.img.src = 'images/' + o.src;
            o.left = false;
            o.right = false;
            o.up = false;
            o.down = true;
        }
        // 弹起停止
        o.stopLeft = function () {
            o.left = false;
        }
        o.stopRight = function () {
            o.right = false;
        }
        o.stopUp = function () {
            o.up = false;
        }
        o.stopDown = function () {
            o.down = false;
        }

        // 发射子弹
        o.fire = function () {
            if (bunengdong(o)) return;
            var z = new Bullet(o); // 构造一颗子弹
            st.add(z);
        }
        return o;
    }

    // 子弹
    function Bullet(t) {
        // 计算坦克的攻击等级
        var gdj = t.gong / 5 - 3;
        // gdj = 4; // 子弹的等级
        var o = new Tank(t.x, t.y, 'm' + gdj + t.dir + '.png', E.BULLET);
        o.tank = t;
        o.dir = t.dir;
        o.speed = 15;
        // 子弹大小位置
        o.w = t.dir == D.U || t.dir == D.D ? WW[gdj] : HH[gdj];
        o.h = t.dir == D.U || t.dir == D.D ? HH[gdj] : WW[gdj];
        // 子弹发射                                
        if (o.dir == D.L) {
            o.x -= o.w;
            o.y += (t.h - o.h) / 2;
            o.left = true
        } else if (o.dir == D.R) {
            o.x += t.w;
            o.y += (t.h - o.h) / 2;
            o.right = true
        } else if (o.dir == D.U) {
            o.x += (t.w - o.w) / 2;
            o.y -= o.h
            o.up = true;
        } else if (o.dir == D.D) {
            o.x += (t.w - o.w) / 2;
            o.y += t.h
            o.down = true;
        }
        o.paintBlood = function () { }
        o.outDie = function () {
            o.die();
        }
        return o;
    }

    function Self(x, y) {
        var o = new Tank(x, y, 'wU.gif', E.SELF);
        o.relife = 3; // 复活次数
        o.delei = 3; // 地雷个数
        o.zhongcaomei = function () {
            cmd.gaixue(20);
        }
        o.changehome = function () {
            for (var i = 0; i < home.length; i++) {
                var z = home[i];
                if (z.hp == 0) {
                    st.add(z);
                    var t = checkhit(z);
                    if (t != null) {
                        if (t.type == E.ENEMY || t.type == E.SELF) {
                            t.pianyi(); // 如果有坦克在墙的位置，就强制位移
                        }
                    }
                }
                z.gaixue(20);
            }
        }
        o.ciya = function () {
            o.dilei += 2;
            o.dilei = o.delei > 5 ? 5 : o.delei;
            p3.play();
        }
        o.yongbao = function () {
            o.relife++; // 复活次数++ 最多5次
            o.relife = o.relife > 5 ? 5 : o.relife;
            p1.play();
        }
        o.p0 = function () {  // 添加声音
            p0.play();
        }
        o.p3 = function () {
            p3.play();
        }
        o.p4 = function () {
            p4.play();
        }
        o.p6 = function () {
            p6.play();
        }
        o.p7 = function () {
            p7.play();
        }
        return o;
    }

    function Enemy(x, y, src) {
        var o = new Tank(x, y, src, E.ENEMY);
        o.dir = D.D; // 默认敌军坦克朝下
        o.zhongcaomei = function () {
            o.yongbao();
        }
        o.changehome = function () {
            for (var i = 0; i < home.length; i++) {
                var z = home[i];
                if (z.hp > 0) {
                    z.gaixue(-20);
                }
            }
        }
        o.ciya = function () {
            o.yongbao();
        }
        o.yongbao = function () {
            buildNewEnemy();
            p11.play();
        }
        o.p0 = function () { } // 清除声音
        o.p3 = function () { }
        o.p4 = function () { }
        o.p6 = function () { }
        o.p7 = function () {
            p7.play();
        }

        // 控制敌军移动
        o.controller = setInterval(function () {
            if (bunengdong(o)) return;
            var n = parseInt(Math.random() * 100);
            var k = parseInt(Math.random() * 4); // 0代表上 1代表下 2代表左 3代表右
            if (n % 19 == 0) {
                if (k == 0) {
                    o.toUp();
                } else if (k == 1) {
                    o.toDown();
                } else if (k == 2) {
                    o.toLeft();
                } else if (k == 3) {
                    o.toRight();
                }
            }
            var n = parseInt(Math.random() * 100);
            if (n % 23 == 0) {
                o.fire()
            }
        }, 30)

        return o;
    }

    // 精英坦克
    function Hero(x, y) {
        var o = new Enemy(x, y, 'dD.gif');
        // 移动速度
        o.speed = 4;
        // 攻击力
        o.gong = 25;
        // 防御力
        o.fang = 6;
        return o;
    }

    // 普通坦克
    function Normal(x, y) {
        var o = new Enemy(x, y, 'tankD.gif');
        return o;
    }

    // 定义画家
    function Stage() {
        this.data = [];
    }

    // 为画家添加一个add函数
    Stage.prototype.add = function (o) {
        this.data.push(o); // 添加新的元素

    }
    Stage.prototype.remove = function (o) {
        var i = this.data.indexOf(o); // 删除元素
        if (i != -1) {
            this.data.splice(i, 1); // 找到了就删除这个元素
        }
    }

    // 渲染
    Stage.prototype.render = function () {
        var list = this.data;
        var img = new Image(); // 创建一个背景图
        img.src = 'images/ditudark.jpg'; // 链接地图图片
        function loop() {
            brush.drawImage(img, 0, 0, can.width, can.height);  // 画背景图
            list.forEach(function (o) {
                o.show();
            })
            // 画信息
            huaxinxi();
            huaxinxi1();
            dijushuliang();
            huazuozhe();
            huatitle();
            huaend();
            // 浏览器每隔17毫秒左右刷新一次
            requestAnimationFrame(loop);
        }

        loop();

        function huaend() {
            if (zt != ZT.SB) return;
            var x = (can.width - 650) / 2;
            brush.fillStyle = 'RED';
            brush.font = '130px Consolas';
            brush.fillText("Game Over", x, overy);

        }
        function dijushuliang() {
            var x = 20, y = 25;
            brush.fillStyle = '#bfa';
            brush.font = '14px 宋体';
            brush.fillText('敌军数量：' + enemycount, x, y); x += 150;
            brush.fillText('歼灭数量：' + jianmie, x, y); x += 150;
            brush.fillText('游戏状态：' + zt, x, y);

        }

        function huaxinxi() {
            var x = 20, y = 50;
            brush.fillStyle = 'aqua';
            brush.font = '14px 宋体';
            brush.fillText('蓝色坦克', x, y); x += 100;
            brush.fillText('生命值：' + me.hp, x, y); x += 100;
            brush.fillText('速度：' + me.speed, x, y); x += 100;
            brush.fillText('攻击：' + me.gong, x, y); x += 100;
            brush.fillText('防御：' + me.fang, x, y); x += 100;
            brush.fillText('复活次数：' + me.relife, x, y); x += 100;
            brush.fillText('可用大招：' + me.delei, x, y); x += 10;
        }

        function huaxinxi1() {
            var x = 20, y = 75;
            brush.fillStyle = 'red';
            brush.font = '14px 宋体';
            brush.fillText('红色坦克', x, y); x += 100;
            brush.fillText('生命值：' + me1.hp, x, y); x += 100;
            brush.fillText('速度：' + me1.speed, x, y); x += 100;
            brush.fillText('攻击：' + me1.gong, x, y); x += 100;
            brush.fillText('防御：' + me1.fang, x, y); x += 100;
            brush.fillText('复活次数：' + me1.relife, x, y); x += 100;
            brush.fillText('可用大招：' + me1.delei, x, y); x += 100;
        }


        function huatitle() {
            if (zt != ZT.WKS) return;
            var x = (can.width - 700) / 2; y = can.height / 2;
            brush.fillStyle = 'hotpink';
            brush.font = '100px 黑体';
            brush.fillText('按回车开始游戏', x, y)
        }

        function huazuozhe() {
            var x = 20; y = can.height * 0.98;
            brush.fillStyle = 'burlywood';
            brush.font = '14px 宋体';
            brush.fillText('陈海涛', x, y)
        }
    }

    function initwall() {
        //  x 轴居中
        var x = (can.width - 30 * wallcount) / 2, y = 180;
        for (var i = 0; i < wallcount; i++) {
            var w = new Wall(x, y);
            st.add(w);
            x += w.w;
        }
    }

    function initenemy() {
        var x = (can.width - enemycount * 43) / 2 // 下面 + 3 这里的40 也要+ 3 做出居中的效果
        var y = 120;
        for (var i = 0; i < enemycount; i++) {
            var n = parseInt(Math.random() * 100);
            // console.log(n);
            var t = n % 11 == 0 ? new Hero(x, y) : new Normal(x, y);
            st.add(t);
            x += t.w + 3; // + 3 给每辆坦克之间空出空隙
        }
    }

    function inithome() {
        var x = (can.width - 120) / 2;
        var y = can.height - 120;
        // 1 1
        var o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        // 1 2
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        // 1 3
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        // 1 4
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        // 1 5
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x = (can.width - 120) / 2;
        y += o.h;
        // 2 1
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;
        // 2 5
        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;

        x = (can.width - 120) / 2;
        y += o.h

        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;

        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;

        x = (can.width - 120) / 2;
        y += o.h

        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;

        o = new Wall(x, y);
        home.push(o);
        st.add(o);
        x += o.w;
        x += o.w * 3;
    }

    function initcmd() {

    }

    // onkeydown = function(e) {
    //     var c = e.keyCode;
    //     if (me.hp <= 0) return;
    //     if (c == 37) {
    //         me.toLeft();
    //     }else if ( c == 38) {
    //         me.toUp();
    //     }else if ( c == 39) {
    //         me.toRight();
    //     }else if ( c == 40) {
    //         me.toDown();
    //     }


    //     if (c == 65) {
    //         me1.toLeft();
    //     }else if ( c == 87) {
    //         me1.toUp();
    //     }else if ( c == 68) {
    //         me1.toRight();
    //     }else if ( c == 83) {
    //         me1.toDown();
    //     }else if ( c == 32) {
    //         me1.fire();
    //         kaipao.play();
    //     } //  87 65 83 68 
    // }

    document.addEventListener('keydown', function (e) {
        var c = e.keyCode;
        if (c == 13 && zt == ZT.WKS) {
            zt = ZT.JZ;
            begin.play();
        }
        if (me.hp > 0) {
            if (c == 37) {
                me.toLeft();
            } else if (c == 38) {
                me.toUp();
            } else if (c == 39) {
                me.toRight();
            } else if (c == 40) {
                me.toDown();
            }
        }


        if (me1.hp > 0) {
            if (c == 65) {
                me1.toLeft();
            } else if (c == 87) {
                me1.toUp();
            } else if (c == 68) {
                me1.toRight();
            } else if (c == 83) {
                me1.toDown();
            }

        }

    })

    // onkeyup = function (e) {
    //     // me.stop();
    //     var c = e.keyCode;
    //     if (me.hp <= 0) return;
    //     if (c == 37) {
    //         me.stopLeft();
    //     }else if ( c == 38) {
    //         me.stopUp();
    //     }else if ( c == 39) {
    //         me.stopRight();
    //     }else if ( c == 40) {
    //         me.stopDown();
    //     }else if ( c == 96) {
    //         me.fire();
    //         kaipao.play();
    //     }

    //     if (c == 65) {
    //         me1.stopLeft();
    //     }else if ( c == 87) {
    //         me1.stopUp();
    //     }else if ( c == 68) {
    //         me1.stopRight();
    //     }else if ( c == 83) {
    //         me1.stopDown();
    //     }
    // }

    document.addEventListener('keyup', function (e) {
        var c = e.keyCode;
        // if (me.hp <= 0) return;
        if (c == 37) {
            me.stopLeft();
        } else if (c == 38) {
            me.stopUp();
        } else if (c == 39) {
            me.stopRight();
        } else if (c == 40) {
            me.stopDown();
        } else if (c == 96) {
            me.fire();
            if (me.hp > 0) kaipao.play();
        } else if (c == 32) {
            me1.fire();
            if (me1.hp > 0) kaipao.play();
        }

        if (c == 65) {
            me1.stopLeft();
        } else if (c == 87) {
            me1.stopUp();
        } else if (c == 68) {
            me1.stopRight();
        } else if (c == 83) {
            me1.stopDown();
        }
    })

    // 判断坦克是否出界
    function out(o) {
        return o.x < 0 || o.y < 0 || o.x > can.width - o.w || o.y > can.height - o.h;
    }

    /**
     * 矩形物体碰撞检验
     * @param {Object} o1
     * @param {Object} o2
     */
    function hitForRectangle(o1, o2) {
        if (o1.x < o2.x) {
            if (o2.x - o1.x <= o1.w) {
                if (o1.y < o2.y) {
                    return o2.y - o1.y <= o1.h;
                } else if (o1.y > o2.y) {
                    return o1.y - o2.y <= o2.h;
                } else
                    return o1.y == o2.y;
            }
        } else if (o1.x > o2.x) {
            if (o1.x - o2.x <= o2.w) {
                if (o1.y < o2.y) {
                    return o2.y - o1.y <= o1.h;
                } else if (o1.y > o2.y) {
                    return o1.y - o2.y <= o2.h;
                } else
                    return o1.y == o2.y;
            }
        } else {
            if (o1.y < o2.y) {
                return o2.y - o1.y <= o1.h;
            } else if (o1.y > o2.y) {
                return o1.y - o2.y <= o2.h;
            } else
                return o1.y == o2.y;
        }
        return false;
    }

    function check(o) {
        var list = st.data;
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (a.index == o.index) continue // 避开自己
            if (a.type == E.BULLET) continue // 避免坦克和子弹的碰撞
            if (a.type == E.PHOTO) continue // 避免与特效图碰撞
            if (o.type == E.BULLET && a.type == E.PROP) continue // 子弹避开道具
            if (o.type == E.BULLET && a.index == o.tank.index) continue //子弹避开自己
            if (o.type == E.BULLET && o.tank.type == a.type) continue  // 我方坦克子弹避开我方坦克
            if (hitForRectangle(o, a)) {
                return a;
            }
        }
        return null;
    }
    function checkhit(o) {
        var list = st.data;
        for (var i = 0; i < list.length; i++) {
            var a = list[i];
            if (a.index == o.index) continue // 避开自己
            if (a.type != E.WALL && a.type != E.SELF && a.type != E.CMD && a.type != E.ENEMY) continue;
            if (hitForRectangle(o, a)) {
                return a;
            }
        }
        return null;
    }

    // 随机产生3-5个新的敌军出现在界面
    function buildNewEnemy() {
        if (enemycount > 25) return;
        var n = parseInt(Math.random() * 3) + 3;
        for (var i = 0; i < n; i++) {
            var k = parseInt(Math.random() * 100);
            var x = parseInt(Math.random() * (can.width - 200)) + 100;
            var y = parseInt(Math.random() * (can.height - 150)) + 80;
            var e = k % 9 == 0 ? new Hero(x, y) : new Normal(x, y);

            while (true) {
                var p = check(e);  // 进行碰撞检查
                if (p == null) {
                    break;
                } else {
                    e.x = parseInt(Math.random() * (can.width - 200)) + 100;
                    e.y = parseInt(Math.random() * (can.height - 150)) + 80;
                }
            }

            st.add(e);
            enemycount++;
        }
    }

    function bunengdong(o) {
        if (zt == ZT.WKS || zt == ZT.PAUSE) return true;
        if (zt == ZT.BD && o.type == E.ENEMY) return true;
        if (zt == ZT.BBD && o.type == E.SELF) return true;
        if (zt == ZT.DFH && o.type == E.SELF) return true;
        if (o.hp <= 0) return true;
        return false;
    }

    var st = new Stage();
    var wallcount = 20; // 障碍墙的初始数量
    var enemycount = 15; // 敌人初始的数量

    var me = new Self(can.width * 0.7, can.height * 0.8); // 我军坦克的位置
    var me1 = new Self(can.width * 0.3, can.height * 0.8); // 我军坦克的位置
    me1.src = "w1U.gif";
    me1.img.src = "images/" + me1.src;
    st.add(me); // 调出我方坦克
    st.add(me1); // 调出我方坦克

    initwall();
    initenemy();
    inithome();
    // initcmd();
    var cmd = new Cmd((can.width - 60) / 2, can.height - 90);
    st.add(cmd)

    st.render();
})