class BaseEntity{
    constructor(initialPosition, width, height){
        this.needsRedraw = true;
        this.position = initialPosition;
        this.width = width;
        this.height = height;
        this.id = this.createUuidv4();
        this.isDestroyed = false;

        this.update = this.update.bind(this);
        this.draw = this.draw.bind(this);
        this.createUuidv4 = this.createUuidv4.bind(this);
    }

    update(gameEntities){
        this.needsRedraw = false;
    }

    draw(canvas){
        canvas.fillRect(x, y, width, height);
    }

    createUuidv4(){
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
} 

//this a small inheritance jump we need to do 
class AnimatedTexturedKinematicEntity extends BaseEntity{
    constructor(initialPosition, width, height, isKinematic, type, states, textures, initialMovementState){
       super(initialPosition, width, height); 
       this.isKinematic = isKinematic;
       this.type = type;
       this.currentState = DEFAULTSTATE;
       this.movementState = initialMovementState;
       this.states = states;
       this.textures = textures;
       this.isFirstDraw = true;
       this.isOnFloor = false;
       this.loopCounter = 0;

       this.updatePosition = this.updatePosition.bind(this);
       this.renderTexture = this.renderTexture.bind(this);
       this.detectCollision = this.detectCollision.bind(this);
       this.onCollisonBehavior = this.onCollisonBehavior.bind(this);
       this.behavior = this.behavior.bind(this);
       this.gravityEffect = this.gravityEffect.bind(this);
    }

    update(gameEntities){
        if(!this.isKinematic && !this.isFirstDraw){
            this.needsRedraw = false;
        }
        
        if(this.isKinematic){
            this.updatePosition();
            var collisionResult = this.detectCollision(gameEntities);

            if(collisionResult.hasCollisions){
                for(var i = 0; i < collisionResult.collisions.length; i++){
                    this.onCollisonBehavior(collisionResult.collisions[i].collisionObject);
                }
            }else{
               this.isOnFloor = false;
            }
            this.behavior();
        }

        if(this.loopCounter > 10000){
            this.loopCounter = 0;
        }

        this.loopCounter += 1;
    }

    updatePosition(){
        this.gravityEffect();
    }

    draw(canvas){
        this.renderTexture(canvas);
    }

    //position array is x y  //needs to return multiple collisions
    detectCollision(gameEntities){
        var collisions = new CollisionWrapper();

        for(var i = 0; i < gameEntities.length; i++){
            if (gameEntities[i].position[0] < this.position[0] + this.width &&
                gameEntities[i].position[0] + gameEntities[i].width > this.position[0] &&
                gameEntities[i].position[0] < this.position[1] + this.height &&
                gameEntities[i].height + gameEntities[i].position[1] > this.position[1]) {
                
                collisions.addCollision(new CollisionInfo(gameEntities[i]));
             }
        }

        return collisions;
    }

    onCollisonBehavior(collisionObject){
        switch(collisionObject.type){
            case entityTypes.FLOOR:
                if(this.position[1] + this.height == collisionObject.position[1]){
                    this.isOnFloor = true;
                    this.movementState.currentSpeedY = 0;
                }
            break;
            default: 
                this.needsRedraw = false;
            break;
        }
    }

    behavior(){
        if(this.isFirstDraw){
            this.needsRedraw = true;
        }else{
            this.needsRedraw = false;
        }
        this.movementState.updateMovementState();
    }
    
    renderTexture(canvas){
        var texture =  this.textures[this.currentState];
        var image = new Image();
        image.src = texture;
        canvas.drawImage(image, this.position[0] , this.position[1], this.width, this.height);
    }

    gravityEffect(){
        if(!this.isOnFloor){
            this.position = [this.position[0], this.position[1] + WORLDGRAVITY[1]];
        }
    }
}

class KillableEntity extends AnimatedTexturedKinematicEntity{
    constructor(initialPosition, width, height, isKinematic, type, states, textures, initialMovementState){
        super(initialPosition, width, height, isKinematic, type, states, textures, initialMovementState);
        this.alive = true;
    }
}

class Goomba extends KillableEntity{
    constructor(initialPosition, width, height, initialMovementState){
        let type = entityTypes.ENEMY;
        let isKinematic = true;
        let states = {MOVEMENTRIGHT:"MOVEMENTRIGHT", MOVEMENTLEFT:"MOVEMENTLEFT"};
        let textures = {
            MOVEMENTRIGHT: "../SUPERMARIO/sprites/gumba-live.png",
            MOVEMENTLEFT: "../SUPERMARIO/sprites/gumba-live-1.png",
            DEAD: "../SUPERMARIO/sprites/gumba-dead.png"
        }
        super(initialPosition, width, height, isKinematic, type, states, textures, initialMovementState);
        this.currentState = states.MOVEMENTRIGHT;
    }

    onCollisonBehavior(collisionInfo){
        //super.onCollisonBehavior(collisionInfo);  
        switch(collisionInfo.type){
            case entityTypes.FLOOR:
                if(this.position[1] + this.height == collisionInfo.position[1]){
                    this.isOnFloor = true;
                    this.movementState.currentSpeedY = 0;
                }
                else{
                    if(this.position[0] < collisionInfo.position[0]){
                        this.movementState.currentSpeedX = -2;
                    }

                    if(this.position[0] > collisionInfo.position[0]){
                        this.movementState.currentSpeedX = 2;
                    }
                } 
            break;
            case entityTypes.PLAYER:
                if(this.position[1] + this.height == collisionInfo.position[1]){
                    this.alive = false;
                }
            default: 
                this.needsRedraw = false;
            break;
        }
    }

    behavior(){
        super.behavior();
        this.position[0] = this.position[0] + this.movementState.currentSpeedX;
        
        if(this.alive && (this.loopCounter % 20) == 0){
            if(this.currentState == this.states.MOVEMENTLEFT){
                this.currentState = this.states.MOVEMENTRIGHT;
            }else{
                if(this.currentState == this.states.MOVEMENTRIGHT){
                    this.currentState = this.states.MOVEMENTLEFT;
                }
            }
        }

        if(!this.alive){
            this.currentState = this.currentState.DEAD;
            
            

        }  
        this.needsRedraw = true;
    }
}

class Player extends KillableEntity{
    constructor(initialPosition, width, height, isKinematic, initialMovementState){
        let type = entityTypes.Player;
        let isKinematic = true;
        let states = {MOVEMENTRIGHT:"MOVEMENTRIGHT", MOVEMENTLEFT:"MOVEMENTLEFT", JUMP: "JUMP", STAND: "STAND"};
        let textures = {
            MOVEMENTRIGHT: "../SUPERMARIO/sprites/gumba-live.png",
            MOVEMENTLEFT: "../SUPERMARIO/sprites/gumba-live-1.png",
            JUMPRIGHT: "../SUPERMARIO/sprites/mario-jump.png",
            DEAD: "../SUPERMARIO/sprites/mario-dead.png"
        }
        super(initialPosition, width, height, isKinematic, type, states, textures, initialMovementState);
        this.currentState = states.MOVEMENTRIGHT;
    }

    
}

class CollisionWrapper{
    constructor(){
        this.collisions = [];
        this.hasCollisions = false;
        this.addCollision = this.addCollision.bind(this);
    }

    addCollision(collision){
        this.hasCollisions = true;
        this.collisions.push(collision);
    }
}

class CollisionInfo {
    constructor(collisionObject){
        this.collisionObject = collisionObject;
        this.type = collisionObject.type;
    }
}

/*acceleration is connected to the game framerate, this was common on older games if we don't want this to happen
  we should decouple the update loop from the draw
*/
class MovementState{
    constructor(accelerationX, accelerationY, maxSpeedX, maxSpeedY){
        let self = this;
        this.accelerationX = accelerationX;
        this.accelerationY = accelerationY;
        this.maxSpeedX = maxSpeedX;
        this.maxSpeedY = maxSpeedY;
        this.currentSpeedX = 0;
        this.currentSpeedY = 0
        this.updateMovementState = this.updateMovementState.bind(this);
    }

    updateMovementState(){
        if((this.currentSpeedX + this.accelerationX) < this.maxSpeedX){
             this.currentSpeedX += this.accelerationX;
        }
        else{
            this.currentSpeedX = this.maxSpeedX;
        }

        if((this.currentSpeedY + this.accelerationY) < this.maYSpeedY){
             this.currentSpeedY += this.accelerationY;
        }
        else{
            this.currentSpeedY = this.maYSpeedY;
        }
    }
}

/* this can be used to delay an action a number of loops, for example if we are running at 60fps, we can schedule something to happen after one second if we add 60 ticks.
The use of this is for example showing the dead sprite of an enemy
*/
class ScheduleTask{

}