window.addEventListener('load' , function (e) {
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
    var WW = [7 , 9 , 11 , 13 , 15];
    var HH = [14 , 18 , 22 , 26 , 30];
    var D = {
        U : 'U',
        D : 'D',
        L : 'L',
        R : 'R'
    };
    var E = {
        WALL : '墙块',
        ENEMY : '敌军',
        BULLET : '子弹',
        PLANE : '飞机',
        PROP : '道具',
        PHOTO : '图片',
        BOOM : '炸弹',
        SELF : '我军',
        CMD : '指挥官'
    }

    // 音频
    var kaipao = new Audio();
    kaipao.src = 'sounds/attack.mp3';

    var tkbz = new Audio();
    tkbz.src = 'sounds/bomb1.wav';
    /**
     * 
     * @param {x} x x轴坐标
     * @param {y} y y轴坐标
     * @param {w} w 宽度
     * @param {h} h 高度
     * @param {src} src 图片链接
     * @param {type} type 类别
     */

    
    function Base(x , y , w , h , src , type) {
        this.x = x ;
        this.y = y ;
        this.w = w ;
        this.h = h ;
        this.src = src ;
        this.type = type ;
        this.hp = 100;
        this.index = INDEX ++ ;
        this.img = new Image ();
        this.img.src = 'images/' + src
        this.show = function () {
            brush.drawImage(this.img , this.x , this.y , this.w , this.h);
            this.paintBlood();
        }
        // 血条
        this.paintBlood = function () {
            // 血条的宽度  = 宽度 * 血量 / 100
            var bw = this.w * (this.hp / 100);
            // 血条的颜色
            brush.fillStyle = 'lawngreen';
            if ( this.hp < 30) {
                brush.fillStyle = 'red';
            } else if ( this.hp < 60 ) {
                brush.fillStyle = 'orange';
            } else if  ( this.hp < 80 ) {
                brush.fillStyle = 'yellow';
            }
            // 血条的位置
            brush.fillRect( this.x , this.y - 6 , bw , 6);
        }
        this.die = function() {
            this.hp = 0;
            clearInterval(this.movetimer);
            st.remove(this);

            if (this.type == E.ENEMY) {
                tkbz.play();
            }

            if ( this.type == E.ENEMY || this.type == E.SELF || this.type == E.WALL) {
                var b = new Bomb(this);
                st.add(b);
            }
        }

        this.gaixue = function (n) {
            this.hp += n;
            this.hp = this.hp > 100 ? 100 : this.hp;
            if ( this.hp <= 0) {
                this.die();
            }
        }
    }

    // 死亡物体产生的爆炸特效
    function Bomb (o){
        var b = new Base(o.x , o.y , o.w , o.h , 'b0.gif' , E.PHOTO);
        b.i = 0;
        b.timer = setInterval( function() {
            b.i ++ ;
            if ( b.i > 8 ) {
                clearInterval(b.timer);
                b.die();
                return;
            }
            b.img.src = 'images/b' + b.i + '.gif';
        } , 80);
        b.paintBlood = function(){} // 无血条
        return b;
    }
    
    // 墙块
    function Wall(x , y) {
        var o = new Base(x , y , 30 , 30 , 'qiang.gif' , E.WALL);
        return o;
    }

    // 坦克
    function Tank(x , y , src , type ) {
        var o = new Base(x , y , 40 , 40 , src , type);
        // 移动速度
        o.speed = 3 ;
        // 攻击力 15 20 25 30 35 （升级） 
        o.gong = 15 ; 
        // 防御力 0 3 6 9 12 (升级)
        o.fang = 0 ;
        // 方向朝上
        o.dir = D.U;
        // 左
        o.left = false;
        // 右
        o.right = false;
        // 上
        o.up = false;
        // 下
        o.down = false;
        // 移动
        o.yidong = function() {
            var ox = o.x , oy = o.y; // 记录旧坐标
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
            if ( out(o)) {
                o.x = ox ; o.y = oy;
                o.outDie(); // 飞出边界的子弹死掉
            }

            // 调用碰撞检查的方法，检查是否发生碰撞，返回被碰撞物体
            var p = check(o);
            if ( p != null) {
                o.x = ox ; o.y = oy;
                if (o.type == E.BULLET) {
                    p.gaixue(-o.gong);
                    o.die();
                }
            }
        }


        o.outDie = function() {

        }

        // 定时器
        o.movetimer = setInterval( o.yidong, 30);
        // 按下启动
        o.toLeft = function () {
            o.dir = D.L; // o.src = 'wU.gif';
            o.src = o.src.substring(0, o.src.lastIndexOf('.') - 1);
            o.src += 'L.gif';
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
            var z = new Bullet(o); // 构造一颗子弹
            st.add(z);
        }
        return o;
    }

    // 子弹
    function Bullet (t) {
        // 计算坦克的攻击等级
        var gdj = t.gong / 5 - 3 ;
        gdj = 4; // 子弹的等级
        var o = new Tank(t.x , t.y , 'm' + gdj + t.dir + '.png' , E.BULLET);                                    
        o.tank = t;
        o.dir = t.dir;
        o.speed = 15;
        // 子弹大小位置
        o.w = t.dir == D.U || t.dir == D.D ? WW[gdj] : HH[gdj];
        o.h = t.dir == D.U || t.dir == D.D ? HH[gdj] : WW[gdj];
        // 子弹发射                                
        if ( o.dir == D.L) {
            o.x -= o.w ; 
            o.y += (t.h - o.h) / 2;
            o.left = true
        } else if ( o.dir == D.R) {
            o.x += t.w ; 
            o.y += (t.h - o.h) / 2;
            o.right = true
        } else if ( o.dir == D.U) {
            o.x += (t.w - o.w) / 2 ; 
            o.y -= o.h
            o.up = true;
        } else if ( o.dir == D.D) {
            o.x += (t.w - o.w) / 2 ; 
            o.y += t.h
            o.down = true;
        }
        o.paintBlood = function () {}
        o.outDie = function() {
            o.die();   
        }
        return o ;
    }

    function Self (x , y ) {
        var o = new Tank(x , y , 'wU.gif' , E.SELF);
        return o ;
    }

    function Enemy (x , y , src) {
        var o = new Tank ( x , y , src ,E.ENEMY);
        o.dir = D.D; // 默认敌军坦克朝下
        return o ; 
    }

    // 精英坦克
    function Hero ( x , y ) {
        var o = new Enemy (x , y , 'dD.gif');
        // 移动速度
        o.speed = 4 ;
        // 攻击力
        o.gong = 25 ; 
        // 防御力
        o.fang = 6 ;
        return o ;
    }
    
    // 普通坦克
    function Normal( x , y ) {
        var o = new Enemy(x , y , 'tankD.gif');
        return o;
    }

    // 定义画家
    function Stage () {
        this.data = [];
    }

    // 为画家添加一个add函数
    Stage.prototype.add = function(o) {
        this.data.push(o); // 添加新的元素
    
    }
    Stage.prototype.remove = function(o) {
        var i = this.data.indexOf(o); // 删除元素
        if ( i != -1 ) {
            this.data.splice(i , 1); // 找到了就删除这个元素
        }
    }

    // 渲染
    Stage.prototype.render = function () {
        var list = this.data;
        var img = new Image(); // 创建一个背景图
        img.src = 'images/ditudark.jpg'; // 链接地图图片
        function loop () {
            brush.drawImage(img , 0 , 0 , can.width , can.height);  // 画背景图
            list.forEach ( function(o) {
                o.show();
            })
            requestAnimationFrame(loop);
        }

        loop();

        // 浏览器每隔17毫秒左右刷新一次
        
        // img.onload = function(e) {
        //     requestAnimationFrame(loop);
        // }
    }

    function initwall() {
        //  x 轴居中
        var x = (can.width -30 * wallcount) / 2 , y = 180 ;
        for ( var i = 0 ; i < wallcount; i++) {
            var w = new Wall(x, y);
            st.add(w);
            x += w.w;
        }
    }

    function initenemy() {
        var x = (can.width - enemycount * 43) / 2 // 下面 + 3 这里的40 也要+ 3 做出居中的效果
        var y = 120;
        for (var i = 0 ; i < enemycount; i ++) {
            var n = parseInt(Math.random() * 100);
            // console.log(n);
            var t = n % 11 == 0 ? new Hero( x, y ) : new Normal( x, y);
            st.add(t);
            x += t.w + 3; // + 3 给每辆坦克之间空出空隙
        }
    }

    onkeydown = function(e) {
        var c = e.keyCode;
        if (c == 37) {
            me.toLeft();
        }else if ( c == 38) {
            me.toUp();
        }else if ( c == 39) {
            me.toRight();
        }else if ( c == 40) {
            me.toDown();
        }
    }

    onkeyup = function (e) {
        // me.stop();
        var c = e.keyCode;
        if (c == 37) {
            me.stopLeft();
        }else if ( c == 38) {
            me.stopUp();
        }else if ( c == 39) {
            me.stopRight();
        }else if ( c == 40) {
            me.stopDown();
        }else if ( c == 32) {
            me.fire();
            kaipao.play();
        }
    }
    // 判断坦克是否出界
    function out(o) {
        return o.x < 0 || o.y < 0 || o.x > can.width - o.w || o.y > can.height - o.h;
    }
    
		/**
		 * 矩形物体碰撞检验
		 * @param {Object} o1
		 * @param {Object} o2
		 */
    function hitForRectangle(o1,o2){
        if ( o1.x < o2.x )
        {
            if ( o2.x - o1.x <= o1.w ){
                if ( o1.y < o2.y ){
                    return o2.y - o1.y <= o1.h;
                } else if ( o1.y > o2.y ){
                    return o1.y - o2.y <= o2.h;
                } else 
                    return o1.y == o2.y;
            }
        } else if ( o1.x > o2.x )
        {
            if ( o1.x - o2.x <= o2.w ){
                if ( o1.y < o2.y ){
                    return o2.y - o1.y <= o1.h;
                } else if ( o1.y > o2.y ){
                    return o1.y - o2.y <= o2.h;
                } else 
                    return o1.y == o2.y;
            }
        } else {
            if ( o1.y < o2.y ){
                return o2.y - o1.y <= o1.h;
            } else if ( o1.y > o2.y ){
                return o1.y - o2.y <= o2.h;
            } else 
                return o1.y == o2.y;
        }
        return false;
    }
    
    function check(o) {
        var list = st.data;
        for ( var i = 0 ; i < list.length; i ++) {
            var a = list[i];
            if ( a.index == o.index) continue // 避开自己
            if ( a.type == E.BULLET) continue // 避免坦克和子弹的碰撞
            if ( a.type == E.PHOTO) continue // 避免与特效图碰撞
            if ( hitForRectangle(o , a)) {
                return a ;
            }
        }
        return null;
    }

    var st = new Stage();
    st.render();
    var wallcount = 20; // 障碍墙的初始数量
    var enemycount = 15; // 敌人初始的数量

    var me = new Self(can.width * 0.3 , can.height * 0.8); // 我军坦克的位置
    st.add(me); // 调出我方坦克

    initwall();
    initenemy();
})