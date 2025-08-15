import * as THREE from 'three';

export class Utilities {

    setUp(e) {
        this.e=e;
    }
  
    vectorToScreenPos2(ob, camera){

      var width = window.innerWidth;
      var height = window.innerHeight;
      var widthHalf = width / 2, heightHalf = height / 2;
    
      var vector = ob.geometry.vertices[0].clone();
      vector.applyMatrix4( ob.matrixWorld );
    
      var pos = vector.clone();
      // var pos = ob.position.clone();
    
      pos.project(camera);
      pos.x = ( pos.x * widthHalf ) + widthHalf;
      pos.y = - ( pos.y * heightHalf ) + heightHalf;
    
      var result = {x:pos.x, y:pos.y};
      
      return result;
    
    }
    
    vectorToScreenPos(ob, camera){

      const screenPosition = new THREE.Vector3();
      ob.getWorldPosition(screenPosition);
      screenPosition.project(camera);
  
      if ( screenPosition.x >= -1 && screenPosition.x <= 1 && screenPosition.y >= -1 && screenPosition.y <= 1 &&screenPosition.z >= -1 && screenPosition.z <= 1 ) {

        const px = (screenPosition.x + 1) / 2 * window.innerWidth;
        const py = (-screenPosition.y + 1) / 2 * window.innerHeight;
        
        var result = {x:px, y:py};

      }else{

        var result = {x:10000, y:10000};

      }
      
      return result;
    
    }
    
    vectorToScreenPosLight(ob, camera){

      const screenPosition = new THREE.Vector3();
      ob.getWorldPosition(screenPosition);
      screenPosition.project(camera);
  
      if ( screenPosition.x >= -1 && screenPosition.x <= 1 && screenPosition.y >= -1 && screenPosition.y <= 1 &&screenPosition.z >= -1 && screenPosition.z <= 1 ) {

        const px = (screenPosition.x + 1) / 2 * window.innerWidth;
        const py = (-screenPosition.y + 1) / 2 * window.innerHeight;
        
        var result = {x:px, y:py, d:true};

      }else{

        const px = (screenPosition.x + 1) / 2 * window.innerWidth;
        const py = (-screenPosition.y + 1) / 2 * window.innerHeight;
        
        var result = {x:px, y:py, d:false};

      }
      
      return result;
    
    }

    //---------------------------------------------------------------------------

  generateRandomColor() {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);
      return `#${randomColor.padStart(6, '0')}`;
  }
  
  // Function to convert a hex color to RGB format
  hexToRgb(hex) {
      let r = 0, g = 0, b = 0;
      // 3 digits
      if (hex.length === 4) {
          r = parseInt(hex[1] + hex[1], 16);
          g = parseInt(hex[2] + hex[2], 16);
          b = parseInt(hex[3] + hex[3], 16);
      }
      // 6 digits
      else if (hex.length === 7) {
          r = parseInt(hex[1] + hex[2], 16);
          g = parseInt(hex[3] + hex[4], 16);
          b = parseInt(hex[5] + hex[6], 16);
      }
      return { r, g, b };
  }
  
  // Function to calculate the Euclidean distance between two colors
  colorDistance(color1, color2) {
      const rgb1 = this.hexToRgb(color1);
      const rgb2 = this.hexToRgb(color2);
      return Math.sqrt(
          Math.pow(rgb2.r - rgb1.r, 2) + 
          Math.pow(rgb2.g - rgb1.g, 2) + 
          Math.pow(rgb2.b - rgb1.b, 2)
      );
  }
  
  // Function to generate a set of random colors that are not too close to each other
  generateDistinctColors(numColors, minDistance = 50) {
      const colors = [];
      
      while (colors.length < numColors) {
          const newColor = this.generateRandomColor();
  
          // Check if the new color is sufficiently different from the already chosen colors
          let isDistinct = true;
          for (let i = 0; i < colors.length; i++) {
              if (this.colorDistance(newColor, colors[i]) < minDistance) {
                  isDistinct = false;
                  break;
              }
          }
  
          // If the color is distinct, add it to the list
          if (isDistinct) {
              colors.push(newColor);
          }
      }
  
      return colors;
    }

    //---------------------------------------------------------------------------

    generateRandomHexColor() {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);
      return `#${randomColor.padStart(6, '0')}`;
    }
    
    lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }
  
    ca(ang) {
      var pi = Math.PI;
      return ang * (pi/180);
    }
  
    ca2(ang){
      var pi = Math.PI;
      return ang * (180/pi);
    }
  
    ran(num) {
      var num1 = Math.random() * num;
      var num2 = Math.floor(num1);
      
      return num2;
    }

    nran(num) {
      var num1 = Math.random() * (num*2);
      var num2 = Math.floor(num1-num);
      return num2;
    }

    getDistance(xA, yA, xB, yB) { 
      var xDiff = xA - xB; 
      var yDiff = yA - yB; 
      return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    }
  
    hslToHex(h, s, l) {
      l /= 100;
      const a = s * Math.min(l, 1 - l) / 100;
      const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
      };
      return `${f(0)}${f(8)}${f(4)}`;
    }
  
    HSLToRGB = (h, s, l) => {
      s /= 100;
      l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return [255 * f(0), 255 * f(8), 255 * f(4)];
    };

    ranArray(ar){
  
      var r = this.ran(ar.length);
      // console.log(" ran "+r)
  
      var removeMe = ar[r];
      // for(var i=0; i<ar.length; i++){
        // if(removeMe===ar[i]){
          ar.splice(r, 1);
        // }
      // }
  
      return removeMe;
  
    }
  
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
  
    //---------------------------------------------------------------------------------------------
  
    //-----color tester-----------------------------------------------------------------------------------------
  
    testColors(){
  
      if(this.e.useColorChanger1===true){
  
        //-----change this--------------------
  
        this.changeOb1 = this.e.whiteMachine.material.color
  
        //-----change this--------------------
        
        if(this.e.setUpColorChanger1===false){
          
            this.hexColor = this.changeOb1.getHSL();
  
            document.getElementById("hueSlider1").value = this.hexColor.h*100;
            document.getElementById("satSlider1").value = this.hexColor.s*100;
            document.getElementById("briSlider1").value = this.hexColor.l*100;
  
            this.e.setUpColorChanger1=true;
        }
  
        var h = document.getElementById("hueSlider1").value;
        var s = document.getElementById("satSlider1").value;
        var l = document.getElementById("briSlider1").value;
        
        this.testColor1 = this.hslToHex(h, s, l);
        this.changeOb1.setHex(this.testColor1);
  
        document.getElementById("val1").value = this.testColor1;
  
      }
  
      if(this.e.useColorChanger2===true){
  
        //-----change this--------------------
  
        this.changeOb2 = this.e.testMe4.material.color
  
        //-----change this--------------------
        
        if(this.e.setUpColorChanger2===false){
          
            this.hexColor = this.changeOb2.getHSL();
  
            document.getElementById("hueSlider2").value = this.hexColor.h*100;
            document.getElementById("satSlider2").value = this.hexColor.s*100;
            document.getElementById("briSlider2").value = this.hexColor.l*100;
  
            this.e.setUpColorChanger2=true;
        }
  
        var h = document.getElementById("hueSlider2").value;
        var s = document.getElementById("satSlider2").value;
        var l = document.getElementById("briSlider2").value;
        
        this.testColor2 = this.hslToHex(h, s, l);
        this.changeOb2.setHex(this.testColor2);
  
        document.getElementById("val2").value = this.testColor2;
  
      }
  
      if(this.e.useColorChanger3===true){
  
        //-----change this--------------------
  
        this.changeOb3 = this.e.testMe5.material.color
  
        //-----change this--------------------
        
        if(this.e.setUpColorChanger3===false){
          
            this.hexColor = this.changeOb3.getHSL();
  
            document.getElementById("hueSlider3").value = this.hexColor.h*100;
            document.getElementById("satSlider3").value = this.hexColor.s*100;
            document.getElementById("briSlider3").value = this.hexColor.l*100;
  
            this.e.setUpColorChanger3=true;
        }
  
        var h = document.getElementById("hueSlider3").value;
        var s = document.getElementById("satSlider3").value;
        var l = document.getElementById("briSlider3").value;
        
        this.testColor3 = this.hslToHex(h, s, l);
        this.changeOb3.setHex(this.testColor3);
  
        document.getElementById("val3").value = this.testColor3;
      
      }
  
      if(this.e.useColorChanger4===true){
  
        var n = document.getElementById("slider4").value;
  
        //-----change this--------------------
  
        // this.e.water.material.metalness = n/100;
        this.e.windowGlass.material.opacity = this.e.u.ca(360*(n/100));
  
        //-----change this--------------------
  
        document.getElementById("val4").value = n/100;
  
      }
  
    }
  
    inc(el, type, amount){
      if(type==="opacity"){
          // console.log("op")
          var theOpacity = parseFloat(el.style.opacity);
          if(theOpacity==="" || isNaN(theOpacity)){
              theOpacity=0;
          }
          theOpacity+=amount;
          if(theOpacity>1){
              theOpacity=1;
          }
          if(theOpacity<0){
              theOpacity=0;
          }
          el.style.opacity = theOpacity+"";
          // console.log(theOpacity)
      }else if(type==="top"){
          
          var theTop = parseFloat(el.style.top);
  
          console.log(el.style.top)
  
          if(theTop==="" || isNaN(theTop)){
              theTop=0;
          }
          theTop+=amount;
          
          el.style.top = theTop+"";
          
      }
    }
  
  }