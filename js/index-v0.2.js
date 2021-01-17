window.addEventListener('load' , function (e) {
    // 获取canvas元素
    // var can = document.getElementById('canvas');
    var can = document.querySelector('#canvas');
    // 宽度高度按照浏览器屏幕尺寸的90% 80%
    can.width = screen.width * 0.9;
    can.height = screen.height * 0.8;
    // 定义画笔
    var brush = can.getContext('2d');
    // 定义 INDEX 索引值 
    var INDEX = 0;

    var E = {
        WALL : '墙块',
        ENEMY : '敌军',
        BULLET : '子弹',
        PLANE : '飞机',
        PROP : '道具',
        PHOTO : '图片',
        BOOM : '炸弹',
        SEFL : '我军',
        CMD : '指挥官'
    }
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
        }
    }
    
    // 墙块
    function Wall(x , y) {
        var o = new Base(x , y , 30 , 30 , 'qiang.gif' , E.WALL);
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
        img.src = '../images/ditudark.jpg'; // 链接地图图片
        function loop () {
            brush.drawImage(img , 0 , 0 , can.width , can.height);  // 画背景图
            list.forEach ( function(o) {
                o.show();
            })
            // requestAnimationFrame(loop);
        }

        // loop();

        // 浏览器每隔17毫秒左右刷新一次
        
        img.onload = function(e) {
            requestAnimationFrame(loop);
        }
    }

    function initwall() {
        var x = (can.width-30*wallcount)/2 , y = 180 ;
        for ( var i = 0 ; i < wallcount; i++) {
            var w = new Wall(x, y);
            st.add(w);
            x += w.w;
        }
    }


    var st = new Stage();
    st.render();
    var wallcount = 20;
    initwall();
})