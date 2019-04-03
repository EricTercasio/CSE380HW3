var TopDownGame = TopDownGame || {};

var endPositionX;
var endPositionY;
var timerBool = false;
var pathList = new Array();

//title screen
TopDownGame.Game = function(){};
var wait = true;
var player;
var velocity = 200;




TopDownGame.Game.prototype = {
  create: function() {
    this.map = this.game.add.tilemap('firstMap');

    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    //this.map.addTilesetImage('tiles', 'gameTiles');
    this.map.addTilesetImage('test_tiles', 'gameTiles');

    //create layer
    this.backgroundlayer = this.map.createLayer('backgroundLayer');
    this.blockedLayer = this.map.createLayer('blockedLayer');

    //collision on blockedLayer
    this.map.setCollisionBetween(1, 2000, true, 'blockedLayer');

    //resizes the game world to match the layer dimensions
    this.backgroundlayer.resizeWorld();

    this.createItems();
    this.createDoors();    

    //create player
    var result = this.findObjectsByType('playerStart', this.map, 'objectsLayer')
    player = this.game.add.sprite(result[0].x, result[0].y, 'player');
    player.animations.add('walking', [0, 1, 2, 3], 5, true);
    player.animations.add('idle', [0], 5, true);
    player.animations.play('idle');
    this.game.physics.arcade.enable(player); 
    player.scale.setTo(.28,.28);

    //the camera will follow the player in the world
    this.game.camera.follow(player);

    //move player with cursor keys
    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.velocityDownKey = this.game.input.keyboard.addKey(Phaser.Keyboard.N);
    this.velocityUpKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
    this.pathKey = this.game.input.keyboard.addKey(Phaser.Keyboard.L);

    //timers
    timer = this.game.time.create(false);
    timerTwo = this.game.time.create(false);


  },
  createItems: function() {
    //create items
    this.items = this.game.add.group();
    this.items.enableBody = true;
    var item;    
    result = this.findObjectsByType('item', this.map, 'objectsLayer');
    result.forEach(function(element){
      this.createFromTiledObject(element, this.items);
    }, this);
  },
  createDoors: function() {
    //create doors
    this.doors = this.game.add.group();
    this.doors.enableBody = true;
    result = this.findObjectsByType('door', this.map, 'objectsLayer');

    result.forEach(function(element){
      this.createFromTiledObject(element, this.doors);
    }, this);
  },

  //find objects in a Tiled layer that containt a property called "type" equal to a certain value
  findObjectsByType: function(type, map, layer) {
    var result = new Array();
    map.objects[layer].forEach(function(element){
      if(element.properties.type === type) {
        //Phaser uses top left, Tiled bottom left so we have to adjust
        //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
        //so they might not be placed in the exact position as in Tiled
        element.y -= map.tileHeight;
        result.push(element);
      }      
    });
    return result;
  },
  //create a sprite from an object
  createFromTiledObject: function(element, group) {
    var sprite = group.create(element.x, element.y, element.properties.sprite);

      //copy all properties to the sprite
      Object.keys(element.properties).forEach(function(key){
        sprite[key] = element.properties[key];
      });
  },
  update: function() {
    //collision
    this.game.physics.arcade.collide(player, this.blockedLayer);
    this.game.physics.arcade.overlap(player, this.items, this.collect, null, this);
    this.game.physics.arcade.overlap(player, this.doors, this.enterDoor, null, this);

    //player movement
    if(pathList.length != 0){
      if(wait == false){
      var tileToMoveTo = pathList[0];
      changePlayerRotation(tileToMoveTo,this.map);
      pathList.splice(0,1);
      var tileWidth = this.map.tileWidth;
      var tileHeight = this.map.tileHeight;
      var time = velocity;
      this.game.physics.arcade.moveToXY(player,tileToMoveTo.x * tileWidth, tileToMoveTo.y
         * tileHeight, 0 , time);
      timer.loop(time, stopPlayer, this);
      timer.start();
      wait = true;
    }
  }
    if(this.game.input.activePointer.justPressed()) {

      //move on the direction of the input
      endPositionX = this.game.input.mousePointer.x  + this.game.camera.x / this.game.camera.scale.x;
      endPositionY = this.game.input.mousePointer.y + this.game.camera.y / this.game.camera.scale.y;
      var spritePositionX = player.x;
      var spritePositionY = player.y;
      //Grid is 64x64 pixels
      //Calculate time it takes with players velocity to move 1 unit
      if(checkIfXYBlocked(endPositionX,endPositionY,this.map,this.blockedLayer) == false){
      player.animations.play("walking");
      var timeToFinish = calculatePath(spritePositionX,spritePositionY,this.map, this.blockedLayer);
      shortenPath();
    }
      //this.game.physics.arcade.moveToPointer(this.player, this.playerSpeed);
    }

    if(this.velocityDownKey.isDown){
      velocity += 16;
    }
    if(this.velocityUpKey.isDown){
      velocity -= 16;
    }
    if(this.pathKey.isDown){
      displayPath(this.map);
    }

    /*
    this.player.body.velocity.x = 0;

    if(this.cursors.up.isDown) {
      if(this.player.body.velocity.y == 0)
      this.player.body.velocity.y -= 50;
    }
    else if(this.cursors.down.isDown) {
      if(this.player.body.velocity.y == 0)
      this.player.body.velocity.y += 50;
    }
    else {
      this.player.body.velocity.y = 0;
    }
    if(this.cursors.left.isDown) {
      this.player.body.velocity.x -= 50;
    }
    else if(this.cursors.right.isDown) {
      this.player.body.velocity.x += 50;
    }
    */
  },
  collect: function(player, collectable) {
    console.log('yummy!');

    //remove sprite
    collectable.destroy();
  },
  enterDoor: function(player, door) {
    console.log('entering door that will take you to '+door.targetTilemap+' on x:'+door.targetX+' and y:'+door.targetY);
  },

};

function stopPlayer(){
  if(pathList.length == 0){
  player.body.velocity.x = 0;
  player.body.velocity.y = 0;
  player.animations.play("idle");
  }else{
    wait = false;
  }
  timer.stop();
}
/*
  This method will implement a* pathfinding to compute the path needed to get the end 
  end destination, and the time it will take using the current velocity for the timer.
  We will then use the moveTo function with the specified velocity, changing directions
  every so often
*/
function calculatePath(spritePositionX,spritePositionY,map,blockedLayer){
  pathList = new Array();
  console.log(blockedLayer);
  var tileWidth = map.tileWidth;
  var tileHeight = map.tileHeight;
  //Define 2d array that holds every tile in the map.
  var mapWidth = map.width;
  var mapHeight = map.height;
  var arr = new Array(mapWidth);
  for(var i = 0; i < arr.length; i++){
    arr[i] = new Array(mapHeight);
  }
  console.log("new array created...");
  var openList = new Array();
  var closedList = new Array();
  //Now we get the tile that the player is on
  var playerTileX = Math.floor(spritePositionX / tileWidth);
  var playerTileY = Math.floor(spritePositionY / tileHeight);
  var endTileX = Math.floor(endPositionX / tileWidth);
  var endTileY = Math.floor(endPositionY / tileHeight);

  var playerTile = {
    x : playerTileX,
    y : playerTileY,
    G : 0,
    H : null,
    parent : null
  };
  var endTile = {
    x : endTileX,
    y : endTileY,
    G : 0,
    H : 0,
    parent : null
  };

  closedList.push(playerTile);

  //Now we start the loop...
  var currentTile = playerTile;
  while(currentTile != endTile){

    if(currentTile.x == endTile.x){
      if(currentTile.y == endTile.y){
        pathList = closedList;
        wait = false;
        return;
      }
    }
    var adjacentTiles = new Array(); //Array used for viable adjacent tiles
    //When the open list is empty...
    //Find all adjacent boxes to the currentBox
    var playerRightX = currentTile.x + 1;
    var playerLeftX = currentTile.x - 1;
    var playerTopX = currentTile.x;
    var playerBottomX = currentTile.x;
    var playerRightY = currentTile.y;
    var playerLeftY = currentTile.y;
    var playerTopY = currentTile.y + 1;
    var playerBottomY = currentTile.y - 1;

    var playerRightTile = {};
    playerRightTile.x = playerRightX;
    playerRightTile.y = playerRightY;
    playerRightTile.parent = currentTile;

    var playerLeftTile = {};
    playerLeftTile.x = playerLeftX;
    playerLeftTile.y = playerLeftY;
    playerLeftTile.parent = currentTile;

    var playerBottomTile = {};
    playerBottomTile.x = playerBottomX;
    playerBottomTile.y = playerBottomY;
    playerBottomTile.parent = currentTile;

    var playerTopTile = {};
    playerTopTile.x = playerTopX;
    playerTopTile.y = playerTopY;
    playerTopTile.parent = currentTile;

    checkIfBlocked(adjacentTiles,closedList,playerRightTile,map);
    checkIfBlocked(adjacentTiles,closedList,playerLeftTile,map);
    checkIfBlocked(adjacentTiles,closedList,playerTopTile,map);
    checkIfBlocked(adjacentTiles,closedList,playerBottomTile,map);
    var found = false;
    var foundPosition;
    var currentPosition;
    for(var i = 0; i < adjacentTiles.length; i++){
      var adjacentTile = adjacentTiles[i];
      for(var k = 0; k < openList.length; k++){
        if(adjacentTile.x == openList[k].x){
          if(adjacentTile.y == openList[k].y){
          found = true;
          foundPosition = k;
          currentPosition = i;
          break;
        }
        }
      }
      if(found == false){
        calculateG(adjacentTile);
        calculateH(adjacentTile, endTile);
        openList.push(adjacentTile);
      }else{
        //Check if the F score is lower using the current calculated path.
        var oldG = openList[foundPosition].G;
        var oldH = openList[foundPosition].H;
        calculateG(adjacentTiles[currentPosition]);
        calculateH(adjacentTiles[currentPosition], endTile);
        var currentG = adjacentTiles[currentPosition].G;
        var currentH = adjacentTiles[currentPosition].H;
        var oldF = oldG + oldH;
        var newF = currentG + currentH;
        if(newF < oldF){ //If the new path is shorter...
          //If it is, update its score and parent
          openList[foundPosition].G = adjacentTile.G + 1;
          openList[foundPosition].parent = adjacentTile.parent;
        }
      }
      found = false;
    }


    //Get the F from the openList that is the smallest
    //If 2 are equal, select the node that is last added to the list
    var smallestTile = null;
    for(var i = 0; i < openList.length; i++){
      var currentNodeInList = openList[i];
      var F = currentNodeInList.H + currentNodeInList.G;
      if(smallestTile == null){
        smallestTile = currentNodeInList;
      }else{
        var smallestF = smallestTile.H + smallestTile.G;
        if(F <= smallestF){
          smallestTile = currentNodeInList;
        }
      }
    }
    //Remove the smallest tile from the open list and add to the closed list
    var spliced = false
    for(var i = 0; i < openList.length; i++){
      var current = openList[i];
      if(current == smallestTile){
        openList.splice(i,1);
        spliced = true;
      }

    }
    closedList.push(smallestTile);
    currentTile = smallestTile;

  }


  //Now we need to calculate G and H
  //G == Movement cost from starting tile playerTile to this tile
  //H == Estimated movement cost from current tile to end tile
  //Movement cost == # of squares

}

function calculateG(currentNode){
  //Add 1 to the parent nodes G
  var parentG = currentNode.parent.G;
  var newG = parentG + 1;
  currentNode.G = newG;

}

function calculateH(currentNode, endingNode){
  //This is a little more complicated
  var newX;
  var newY;
  //When currentNode.x is less than endingNode.x
  //We subtract currentNode.x from endingNode.x
  if(currentNode.x < endingNode.x){
    newX = endingNode.x - currentNode.x;
  }else if (currentNode.x > endingNode.x){
    newX = currentNode.x - endingNode.x;
  }else{
    //We dont need to move any blocks on the x axis
    newX = 0;
  }

  //Now move onto the y axis
  if(currentNode.y < endingNode.y){
    newY = endingNode.y - currentNode.y;
  }else if (currentNode.y > endingNode.y){
    newY = currentNode.y - endingNode.y;
  }else{
    //We dont need to move any blocks on the x axis
    newY = 0;
  }

  currentNode.H = newX + newY;

}

function checkIfBlocked(array, closedList, tile, map){
  var tileX = tile.x;
  var tileY = tile.y;
  //First check if already in closed list
  for(var i = 0; i < closedList.length; i++){
    var temp = closedList[i];
    if(tile.x == temp.x){
      if(tile.y == temp.y){
        return;
      }
    }
  }
  var tileToCheck = map.getTile(tileX,tileY);
  if(tileToCheck != null){
    for(var i = 0; i < closedList.length; i++){
      if(closedList[i] == tile){
        return;
      }
    }
    array.push(tile);
    return;
  }else{
    return;
  }

}
function checkIfXYBlocked(x,y,map,blockedLayer){
  var tileWidth = map.tileWidth;
  var tileHeight = map.tileHeight;
  var tileX = Math.floor(x / tileWidth);
  var tileY = Math.floor(y / tileHeight);
  var tileTest = map.getTile(tileX,tileY);
  if(tileTest == null){
    console.log("blocked..");
    console.log(tileX);
    console.log(tileY);
    return true;
  }else{
    return false;
  }

}

function changePlayerRotation(endTile, map){
  var tileWidth = map.tileWidth;
  var tileHeight = map.tileHeight;
  var playerTileX = Math.floor(player.x / tileWidth);
  var playerTileY = Math.floor(player.y / tileHeight);
  var endTileX = endTile.x;
  var endTileY = endTile.y;
  var Ychange = playerTileY - endTileY;
  var Xchange = playerTileX - endTileX;

}
function displayPath(map){

}

function shortenPath(){
  //Construct best path from current path
  //Start at end position of pathList
  for(var i = pathList.length - 1; i > 0; i--){
    var currentTile = pathList[i];
    var parentTile = currentTile.parent;
    var parentX = parentTile.x;
    var parentY = parentTile.y;
    var prevNodePosition = i - 1;
    while(true){
      var previousNode = pathList[prevNodePosition];
      var previousX = previousNode.x;
      var previousY = previousNode.y;
      if(previousX == parentX){
        if(previousY == parentY){
          //Parent in correct order
          break;
        }
      }
      //Otherwise we get rid of that node
      pathList.splice(prevNodePosition,1);
      prevNodePosition--;
    }
    i = prevNodePosition + 1; //Because the loop will subtract 1.
  }
}

