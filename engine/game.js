class Game {
    constructor(canvas, backgroundColor){
        this.canvas = canvas;
        this.gameEntities = [];
        this.canvas.width = WORLDSIZE[0];
        this.canvas.height = WORLDSIZE[1];
        this.backgroundColor = backgroundColor;
        this.isPlayingAudio = false;
        
        this.gameLoop = this.gameLoop.bind(this)
        this.update = this.update.bind(this);
        this.addGameEntity = this.addGameEntity.bind(this);
        this.drawBackground = this.drawBackground.bind(this);
        this.playLevelSong = this.playLevelSong.bind(this);

        window.requestAnimationFrame(this.gameLoop);
    }

    gameLoop(){
        this.update();
        window.requestAnimationFrame(this.gameLoop);
    }

    update(){
        this.drawBackground();
        for(var i = 0; i < this.gameEntities.length; i++){
            this.gameEntities[i].update(this.gameEntities.filter((g) => { return g.id != this.gameEntities[i].id;}));
            if(this.gameEntities[i].needsRedraw){
                this.gameEntities[i].draw(this.canvas);
            }
        }
    }
    
    addGameEntity(entity){
        this.gameEntities.push(entity);
    }

    drawBackground(){
        this.canvas.fillStyle = this.backgroundColor;
        this.canvas.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    playLevelSong(song){
        if(!this.isPlayingAudio){
            this.isPlayingAudio = true;
            var audio = new Audio(song);
            audio.loop = true;
            audio.play();
        }
    }
}

