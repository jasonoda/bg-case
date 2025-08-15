export class Input {
    
    setUp(e) {
  
        this.e=e;
  
        this.keyRight = false;
        this.keyLeft = false;
        this.keyUp = false;
        this.keyDown = false;
  
        document.addEventListener("keydown", event => {
  
          //---arrow keyes---------------------------------------
  
          if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
  
              this.keyRight = true;
  
          } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
  
              this.keyLeft = true;
  
          } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
  
              this.keyUp = true;
  
          } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
  
              this.keyDown = true;

              console.log(this.e.scene.matchLock1)
              console.log(this.e.scene.matchLock2)
  
          }
  
        });
  
        document.addEventListener("keyup", event => {
  
          //---arrow keyes---------------------------------------
  
          if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
  
              this.keyRight = false;
  
          } else if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
  
              this.keyLeft = false;
  
          } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
  
              this.keyUp = false;
  
          } else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
  
              this.keyDown = false;
  
          }
  
      });
  
    }
  
  }