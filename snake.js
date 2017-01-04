/*
 * @author Eric
 * @2013-12-04
 */

//游戏状态
var ENUM_STATUS_SNAKE =
{
    idle: 0,
    gaming: 1,
    pause: 2
};
//方向
var ENUM_DIRECTION_SNAKE =
{
    left    :   0,
    right   :   1,
    up      :   2,
    down    :   3
};

/*
 * 对外接口(初始化等)
 */
var JR_API_SNAKE =
{
    isInit: false,
    init: function()
    {
        if(JR_API_SNAKE.isInit){
            return ;
        }
        JR_API_SNAKE.isInit = true;
        $("#canvas_snake").css("background-color", SNAKE_HANDLE.config.bgColor);
        $("#snake_high_scores").text(SNAKE_HANDLE.highScore.get());

        SNAKE_HANDLE.config.bodyW = Math.floor(SNAKE_HANDLE.config.backgroundW / SNAKE_HANDLE.config.col);
        SNAKE_HANDLE.config.bodyH = Math.floor(SNAKE_HANDLE.config.backgroundH / SNAKE_HANDLE.config.row);
        //防止之前一步"除去小数"时出现的偏差
        SNAKE_HANDLE.config.backgroundW = SNAKE_HANDLE.config.bodyW * SNAKE_HANDLE.config.col;
        SNAKE_HANDLE.config.backgroundH = SNAKE_HANDLE.config.bodyH * SNAKE_HANDLE.config.row;

        SNAKE_HANDLE.active = 1;
        window.addEventListener('keydown', SNAKE_HANDLE.anyKey, false);
    },
    startGame: function()
    {
        SNAKE_HANDLE.curSnake = createSnake();
        SNAKE_HANDLE.curSnake.randFood();
        SNAKE_HANDLE.status = ENUM_STATUS_SNAKE.gaming;
        SNAKE_HANDLE.drawBG();
        try{
            window.clearInterval(SNAKE_HANDLE.Timer);
        }catch(e){
        }
        SNAKE_HANDLE.config.curSpeed = SNAKE_HANDLE.config.initSpeed;
        SNAKE_HANDLE.Timer = window.setInterval(SNAKE_HANDLE.onTimer, SNAKE_HANDLE.config.curSpeed);
        $("#snake_speed").text(SNAKE_HANDLE.config.curSpeed);
    },
    pauseGame: function()
    {
        if(SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.gaming){
            window.clearInterval(SNAKE_HANDLE.Timer);
            SNAKE_HANDLE.status = ENUM_STATUS_SNAKE.pause;
            $("#pause_snake").removeClass("btn_pause").addClass("btn_play");
        }else if(SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.pause){
            SNAKE_HANDLE.status = ENUM_STATUS_SNAKE.gaming;
            SNAKE_HANDLE.Timer = window.setInterval(SNAKE_HANDLE.onTimer, SNAKE_HANDLE.config.curSpeed);
            $("#pause_snake").removeClass("btn_play").addClass("btn_pause");
        }
    },
    endGame: function()
    {
        SNAKE_HANDLE.status = ENUM_STATUS_SNAKE.idle;
        window.clearInterval(SNAKE_HANDLE.Timer);
        SNAKE_HANDLE.highScore.set(SNAKE_HANDLE.curSnake.body.length);
        $("#snake_high_scores").text(SNAKE_HANDLE.highScore.get());

        alert("Game Over!");
    },
    getFocus: function()
    {
        SNAKE_HANDLE.active = 1;
    },
    killFocus: function()
    {
        SNAKE_HANDLE.active = 0;
        if(SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.gaming){
            JR_API_SNAKE.pauseGame();
        }
    }
};

var SNAKE_HANDLE =
{
    Timer: 0,
    status: ENUM_STATUS_SNAKE.idle,
    curSnake: null,
    active: 0,  //游戏界面是否正在显示

    config:
    {
        worldX: 2,  //the world coordinate : x
        worldY: 2,  //the world coordinate : y
        row: 20,
        col: 20,
        backgroundW: 300,
        backgroundH: 300,
        bodyW: 15,
        bodyH: 15,

        initSnakeLength: 6,
        bgColor: "rgb(0, 128, 128)",
        bodyColor: "rgb(0, 255, 255)",
        foodColor: "rgb(255, 0, 0)",

        initSpeed: 200,
        curSpeed: 200
    },

    drawBG: function()
    {
        try{
            var context = document.getElementById("canvas_snake").getContext("2d");
            context.clearRect(SNAKE_HANDLE.config.worldX, SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.backgroundW, SNAKE_HANDLE.config.backgroundH);
            context.strokeStyle = SNAKE_HANDLE.config.bgColor;
            context.strokeRect(SNAKE_HANDLE.config.worldX, SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.backgroundW, SNAKE_HANDLE.config.backgroundH);
        }catch(e){
            console.log("drawBG error. e:" + e);
        }
    },
    drawLine: function(color, x1, y1, x2, y2, value)
    {
        var context = document.getElementById("canvas_snake").getContext("2d");
        context.strokeStyle = color;
        context.lineWidth = value;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
    },
    updateScore: function()
    {
        var score = 0;
        try{
            score = SNAKE_HANDLE.curSnake.body.length;
        }catch(e){
        }
        $("#snake_score").text(score);
    },
    updateSpeed: function()
    {
        if(SNAKE_HANDLE.curSnake.body.length > SNAKE_HANDLE.config.initSnakeLength
            && SNAKE_HANDLE.curSnake.body.length % 10 == 0
            ){
            if(SNAKE_HANDLE.config.curSpeed > 100){
                SNAKE_HANDLE.config.curSpeed -= 20;
            }else if(SNAKE_HANDLE.config.curSpeed <= 100 && SNAKE_HANDLE.config.curSpeed > 50){
                SNAKE_HANDLE.config.curSpeed -= 10;
            }else if(SNAKE_HANDLE.config.curSpeed <= 50 && SNAKE_HANDLE.config.curSpeed > 30){
                SNAKE_HANDLE.config.curSpeed -= 5;
            }
            console.log("speed up. now speed:" + SNAKE_HANDLE.config.curSpeed);
        }

        if(SNAKE_HANDLE.config.curSpeed == SNAKE_HANDLE.config.initSpeed){
            return ;
        }
        try{
            window.clearInterval(SNAKE_HANDLE.Timer);
            SNAKE_HANDLE.Timer = window.setInterval(SNAKE_HANDLE.onTimer, SNAKE_HANDLE.config.curSpeed);
            $("#snake_speed").text(SNAKE_HANDLE.config.curSpeed);
        }catch(e){
        }
    },
    onTimer: function()
    {
        switch(SNAKE_HANDLE.status){
            case ENUM_STATUS_SNAKE.idle:
                break;
            case ENUM_STATUS_SNAKE.gaming:
                var ret = SNAKE_HANDLE.curSnake.upDate();
                if(1 == ret){
                    JR_API_SNAKE.endGame();
                }else {
                    SNAKE_HANDLE.drawBG();
                    SNAKE_HANDLE.curSnake.show();
                    SNAKE_HANDLE.updateScore();
                    if(2 == ret){
                        SNAKE_HANDLE.updateSpeed();
                    }
                }
                break;
            case ENUM_STATUS_SNAKE.pause:
                break;
            default:
                break;
        }
    },
    anyKey: function()
    {
        //不在激活状态，不对按键响应
        if(!SNAKE_HANDLE.active){
            return ;
        }

        var keyCode = 0;
        if(null == event){
            keyCode = window.event.keyCode;
            //window.event.preventDefault();
        }
        else {
            keyCode = event.keyCode;
            //event.preventDefault();
        }
        try{
            switch(keyCode)
            {
                case 37:	//left arrow
                case 65:	//A
                    if(SNAKE_HANDLE.curSnake.curDirection != ENUM_DIRECTION_SNAKE.right)
                        SNAKE_HANDLE.curSnake.nextDirection = ENUM_DIRECTION_SNAKE.left;
                    break;
                case 38:	//up arrow
                case 87:	//W
                    if(SNAKE_HANDLE.curSnake.curDirection != ENUM_DIRECTION_SNAKE.down)
                        SNAKE_HANDLE.curSnake.nextDirection = ENUM_DIRECTION_SNAKE.up;
                    break;
                case 39:	//right arrow
                case 68:	//D
                    if(SNAKE_HANDLE.curSnake.curDirection != ENUM_DIRECTION_SNAKE.left)
                        SNAKE_HANDLE.curSnake.nextDirection = ENUM_DIRECTION_SNAKE.right;
                    break;
                case 40:	//down arrow
                case 83:	//S
                    if(SNAKE_HANDLE.curSnake.curDirection != ENUM_DIRECTION_SNAKE.up)
                        SNAKE_HANDLE.curSnake.nextDirection = ENUM_DIRECTION_SNAKE.down;
                    break;
                case 13:    //Enter
                case 32:    //Space
                    if(SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.idle){
                        JR_API_SNAKE.startGame();
                    }else if(SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.gaming || SNAKE_HANDLE.status == ENUM_STATUS_SNAKE.pause){
                        JR_API_SNAKE.pauseGame();
                    }
                    break;
                default:
                    console.log("You just pressed keycode : " + keyCode);
                    break;
            }
        }catch(e){
            console.log("anyKey warnning: " + e);
        }
    },
    highScore:
    {
        key: "snake_high_score",
        get: function()
        {
            var score = localStorage[SNAKE_HANDLE.highScore.key];
            if(!score){
                score = 0;
            }
            return score;
        },
        set: function(s)
        {
            try{
                var score = localStorage[SNAKE_HANDLE.highScore.key];
                if(!score){
                    score = 0;
                }
                if(score < s){
                    localStorage[SNAKE_HANDLE.highScore.key] = s;
                }
            }catch(e){
                console.log("highScore.set error. e:" + e);
            }
        }
    }
};

/*
 * create a class of snake's body
 */
function createBody(slotNum){
    var BODY = new Object;
    BODY.x = getX(slotNum);
    BODY.y = getY(slotNum);
    BODY.color = SNAKE_HANDLE.config.bodyColor;

    BODY.isEqual = function(B){
        if(this.x == B.x && this.y == B.y)
            return 1;
        return 0;
    };
    BODY.copyFrom = function(B){
        this.x = B.x;
        this.y = B.y;
        this.color = B.color;
    };
    BODY.rand = function(){
        var num = Math.floor(Math.random() * SNAKE_HANDLE.config.row * SNAKE_HANDLE.config.col);
        this.x = getX(num);
        this.y = getY(num);
    };
    BODY.show = function(){
        var context = document.getElementById("canvas_snake").getContext("2d");
        //context.clearRect(this.x+SNAKE_HANDLE.config.worldX, this.y+SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.bodyW, SNAKE_HANDLE.config.bodyH);
        context.fillStyle = this.color;
        context.fillRect(this.x+SNAKE_HANDLE.config.worldX, this.y+SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.bodyW, SNAKE_HANDLE.config.bodyH);
        context.lineWidth = 0.2;
        context.strokeStyle = SNAKE_HANDLE.config.bgColor;
        context.strokeRect(this.x+SNAKE_HANDLE.config.worldX, this.y+SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.bodyW, SNAKE_HANDLE.config.bodyH);
    };
    BODY.wipe = function(){
        var context = document.getElementById("canvas_snake").getContext("2d");
        //context.clearRect(this.x+SNAKE_HANDLE.config.worldX, this.y+SNAKE_HANDLE.config.worldY, SNAKE_HANDLE.config.bodyW, SNAKE_HANDLE.config.bodyH);
    };
    BODY.canMoveLeft = function(){
        if((this.x - SNAKE_HANDLE.config.bodyW) >= 0)
            return true;
        return false;
    };
    BODY.canMoveRight = function(){
        if((this.x + SNAKE_HANDLE.config.bodyW) < SNAKE_HANDLE.config.backgroundW)
            return true;
        return false;
    };
    BODY.canMoveUp = function(){
        if((this.y - SNAKE_HANDLE.config.bodyH) >= 0)
            return true;
        return false;
    };
    BODY.canMoveDown = function(){
        if((this.y + SNAKE_HANDLE.config.bodyH) < SNAKE_HANDLE.config.backgroundH)
            return true;
        return false;
    };
    BODY.moveLeft = function(){
        if (this.canMoveLeft()) {
            this.x = this.x - SNAKE_HANDLE.config.bodyW;
            return true;
        }
        return false;
    };
    BODY.moveRight = function(){
        if (this.canMoveRight()) {
            this.x = this.x + SNAKE_HANDLE.config.bodyW;
            return true;
        }
        return false;
    };
    BODY.moveUp = function(){
        if(this.canMoveUp()) {
            this.y = this.y - SNAKE_HANDLE.config.bodyH;
            return true;
        }
        return false;
    };
    BODY.moveDown = function(){
        if(this.canMoveDown()){
            this.y = this.y + SNAKE_HANDLE.config.bodyH;
            return true;
        }
        return false;
    };

    return BODY;
}

/*
 * create a class of snake
 */
function createSnake(){
    var SNAKE = new Object;
    SNAKE.curDirection = ENUM_DIRECTION_SNAKE.right;
    SNAKE.nextDirection = ENUM_DIRECTION_SNAKE.right;
    SNAKE.food = createBody(0);
    SNAKE.food.color = SNAKE_HANDLE.config.foodColor;
    SNAKE.wipeBody = createBody(0);
    SNAKE.isWipeBody = 0;

    SNAKE.hashArray = new Array();	//标志对应的空格是否被占用 0:没被占用, 1:已被占用
    for(i=0; i<SNAKE_HANDLE.config.col * SNAKE_HANDLE.config.row; i++){
        if(i < SNAKE_HANDLE.config.initSnakeLength){
            SNAKE.hashArray[i] = 1;
        }
        else{
            SNAKE.hashArray[i] = 0;
        }
    }

    SNAKE.body = new Array(SNAKE_HANDLE.config.initSnakeLength);	//snake 's body
    for (i = 0; i < SNAKE.body.length; i++) {
        SNAKE.body[i] = createBody(i);
    }

    SNAKE.randFood = function(){
        var counter = 10;
        while(counter>0){
            counter --;
            this.food.rand();
            if (0 == this.hashArray[index2slot(this.food.x, this.food.y)]) {
                return;
            }
        }
        for(i=(SNAKE_HANDLE.config.col * SNAKE_HANDLE.config.row / 2); i< SNAKE_HANDLE.config.col * SNAKE_HANDLE.config.row; i++){
            if (this.hashArray[i] == 0) {
                this.food.x = getX(i);
                this.food.y = getY(i);
                return;
            }
        }
        for(i=(SNAKE_HANDLE.config.col * SNAKE_HANDLE.config.row / 2 - 1); i>=0; i--){
            if (this.hashArray[i] == 0) {
                this.food.x = getX(i);
                this.food.y = getY(i);
                return;
            }
        }
    };

    /*
     * 贪吃蛇核心函数
     * 0: ok
     * 1: game over
     * 2: eat foot
     */
    SNAKE.upDate = function(){
        var flag = 0;
        switch (this.nextDirection) {
            case 0:
                flag = this.goLeft();
                break;
            case 1:
                flag = this.goRight();
                break;
            case 2:
                flag = this.goUp();
                break;
            case 3:
                flag = this.goDown();
                break;
        }
        this.curDirection = this.nextDirection;
        if (1 != flag) {
            flag = this.updateFlag();
        }
        return flag;
    };

    SNAKE.updateFlag = function(){
        var flag = 0;
        if (1 == this.hashArray[index2slot(SNAKE.body[SNAKE.body.length - 1].x, SNAKE.body[SNAKE.body.length - 1].y)]) {
            if(SNAKE.body[SNAKE.body.length - 1].isEqual(this.food)){	//eat a food
                flag = 2;
                var tmpBody = createBody(0);
                tmpBody.x = this.x;
                tmpBody.y = this.y;
                SNAKE.body.unshift(tmpBody);
                this.randFood();
            }
            else{
                return 1; //game over
            }
        }
        if(1 == this.isWipeBody){
            this.hashArray[index2slot(this.wipeBody.x, this.wipeBody.y)] = 0;
        }
        for(i=0; i<SNAKE.body.length; i++){
            this.hashArray[index2slot(SNAKE.body[i].x, SNAKE.body[i].y)] = 1;
        }
        this.hashArray[index2slot(this.food.x, this.food.y)] = 1;
        return flag;
    };

    SNAKE.show = function(){
        if(1 == this.isWipeBody){
            this.wipeBody.wipe();
            this.isWipeBody = 0;
        }
        for(i=0; i<SNAKE.body.length; i++){
            SNAKE.body[i].show();
        }
        this.food.show();
    };

    SNAKE.goLeft = function(){
        if(this.curDirection == ENUM_DIRECTION_SNAKE.right){
            return -1;	//no move
        }
        if(!SNAKE.body[SNAKE.body.length-1].canMoveLeft()){
            return 1;	//game over
        }
        this.wipeBody.copyFrom(SNAKE.body[0]);
        this.isWipeBody = 1;
        for(i=0; i<(SNAKE.body.length-1); i++){
            SNAKE.body[i].copyFrom(SNAKE.body[i+1]);
        }
        SNAKE.body[SNAKE.body.length-1].moveLeft();
        this.curDirection = ENUM_DIRECTION_SNAKE.left;
        return 0;	//move ok
    };
    SNAKE.goRight = function(){
        if(this.curDirection == ENUM_DIRECTION_SNAKE.left){
            return -1;	//no move
        }
        if(!SNAKE.body[SNAKE.body.length-1].canMoveRight()){
            return 1;	//game over
        }
        this.wipeBody.copyFrom(SNAKE.body[0]);
        this.isWipeBody = 1;
        for(i=0; i<(SNAKE.body.length-1); i++){
            SNAKE.body[i].copyFrom(SNAKE.body[i+1]);
        }
        SNAKE.body[SNAKE.body.length-1].moveRight();
        this.curDirection = ENUM_DIRECTION_SNAKE.right;
        return 0;	//move ok
    };
    SNAKE.goUp = function(){
        if(this.curDirection == ENUM_DIRECTION_SNAKE.down){
            return -1;	//no move
        }
        if(!SNAKE.body[SNAKE.body.length-1].canMoveUp()){
            return 1;	//game over
        }
        this.wipeBody.copyFrom(SNAKE.body[0]);
        this.isWipeBody = 1;
        for(i=0; i<(SNAKE.body.length-1); i++){
            SNAKE.body[i].copyFrom(SNAKE.body[i+1]);
        }
        SNAKE.body[SNAKE.body.length-1].moveUp();
        this.curDirection = ENUM_DIRECTION_SNAKE.up;
        return 0;	//move ok
    };
    SNAKE.goDown = function(){
        if(this.curDirection == ENUM_DIRECTION_SNAKE.up){
            return -1;	//no move
        }
        if(!SNAKE.body[SNAKE.body.length-1].canMoveDown()){
            return 1;	//game over
        }
        this.wipeBody.copyFrom(SNAKE.body[0]);
        this.wipeBody.y = SNAKE.body[0].y;
        this.isWipeBody = 1;
        for(i=0; i<(SNAKE.body.length-1); i++){
            SNAKE.body[i].copyFrom(SNAKE.body[i+1]);
        }
        SNAKE.body[SNAKE.body.length-1].moveDown();
        this.curDirection = ENUM_DIRECTION_SNAKE.down;
        return 0;	//move ok
    };
    SNAKE.getScore = function(){
        return SNAKE.body.length;
    };

    return SNAKE;
}

//index x, y to slot[20*20] num
function index2slot(x, y){
    return (Math.floor((y * SNAKE_HANDLE.config.col + x) / SNAKE_HANDLE.config.bodyW));
}
//get index x from slot[20*20] num
function getX(num){
    return ((num % SNAKE_HANDLE.config.col) * SNAKE_HANDLE.config.bodyW);
}
//get index y from slot[20*20] num
function getY(num){
    return (Math.floor(num / SNAKE_HANDLE.config.col) * SNAKE_HANDLE.config.bodyH);
}

window.onload = function(){
    JR_API_SNAKE.init();
    JR_API_SNAKE.getFocus();

    $("#start_snake").click(function(){
        JR_API_SNAKE.startGame();
    });

    $("#pause_snake").click(function(){
        JR_API_SNAKE.pauseGame();
    });
};
