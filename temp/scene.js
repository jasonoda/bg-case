import gsap from "gsap";
import CryptoJS from 'crypto-js';

export class Scene {
    setUp(e) {
        this.e = e;
    }

    // Helper function to set isAnimating to true and change grid border to yellow
    setAnimatingTrue() {
        this.isAnimating = true;
        this.updateGridBorderColor(true);
    }

    // Helper function to set isAnimating to false and change grid border to grey
    setAnimatingFalse() {
        this.isAnimating = false;
        this.updateGridBorderColor(false);
    }

    // Helper function to update grid border color based on animation state
    updateGridBorderColor(isAnimating) {
        const gridElement = document.getElementById('jewelGrid');
        if (gridElement) {
            if (isAnimating) {
                // Grey border when animating (busy)
                gridElement.style.border = '3px solid #808080';
                gridElement.style.transition = 'border-color 0.2s ease';
            } else {
                // Yellow border when not animating (ready for input)
                gridElement.style.border = '3px solid #FFD700';
            }
        }
    }

    // Create subtle glow effects that fly away when matches are made
    createMatchGlowEffects() {
        const gridElement = document.getElementById('jewelGrid');
        if (!gridElement) return;
        
        // Get all jewels that are part of the current match
        const matchedJewels = document.querySelectorAll('.jewel[data-cleared="true"], .jewel[data-void="true"]');
        
        console.log('createMatchGlowEffects called');
        console.log('Found matched jewels:', matchedJewels.length);
        console.log('Matched jewels:', matchedJewels);
        
        if (matchedJewels.length === 0) {
            console.log('No matched jewels found, returning early');
            return;
        }
        
        // Create 4-5 small radial gradient glows
        const glowCount = Math.floor(Math.random() * 2) + 4; // 4 or 5 glows
        
        for (let i = 0; i < glowCount; i++) {
            // Pick a random matched jewel position
            const randomJewel = matchedJewels[Math.floor(Math.random() * matchedJewels.length)];
            const jewelRect = randomJewel.getBoundingClientRect();
            const startX = jewelRect.left + jewelRect.width / 2;
            const startY = jewelRect.top + jewelRect.height / 2;
            
            // Random angle for flight direction
            const angle = Math.random() * Math.PI * 2;
            const flightDistance = 30 + Math.random() * 20; // Reduced distance (was 100)
            
            // Create glow element
            const glow = document.createElement('div');
            glow.style.position = 'fixed';
            glow.style.left = startX + 'px';
            glow.style.top = startY + 'px';
            glow.style.width = '8px';
            glow.style.height = '8px';
            glow.style.borderRadius = '50%';
            glow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,0,0.6) 50%, transparent 100%)';
            glow.style.pointerEvents = 'none';
            glow.style.zIndex = '9998';
            glow.style.transform = 'translate(-50%, -50%)';
            
            document.body.appendChild(glow);
            
            // Animate the glow flying away
            const endX = startX + (Math.cos(angle) * flightDistance);
            const endY = startY + (Math.sin(angle) * flightDistance);
            
            // Use CSS transitions for mobile compatibility
            glow.style.transition = 'all 1.5s ease-out';
            
            // Trigger animation on next frame for mobile compatibility
            requestAnimationFrame(() => {
                glow.style.left = endX + 'px';
                glow.style.top = endY + 'px';
                glow.style.opacity = '0';
                glow.style.transform = 'translate(-50%, -50%) scale(0.5)';
            });
            
            // Remove the glow element after animation
            setTimeout(() => {
                if (glow.parentNode) {
                    glow.parentNode.removeChild(glow);
                }
            }, 1500);
        }
    }

    buildScene() {
        this.action = "set up";

        // Game configuration
        this.GRID_SIZE = 8;
        this.JEWEL_TYPES = 5; // Configurable number of jewel types (excluding bonus boxes)
        this.grid = [];
        this.setAnimatingFalse();
        this.score = 0;
        this.scoreMultiplier = 1;
        this.savedMultiplier = 1;
        this.maxMultiplier = 5;
        this.timeLeft = 120;
        this.gameStarted = false;
        this.gameOver = false;

        this.gridOverlayVisible = false; // Track grid overlay visibility

        // FPS tracking variables
        this.frameCount = 0;
        this.lastFrameTime = new Date().getTime();
        this.fps = 0;
        
        // Animation easing
        this.jewelEasing = "sine.in";

        // Multiplier timer variables
        this.lastMatchTime = 0;
        this.multiplierResetTimer = 3.0; // 3 seconds countdown by default
        
        // Score tracking variables
        this.match3Count = 0;
        this.match4Count = 0;
        this.match5Count = 0;
        this.explosionCount = 0;
        this.bonusBoxCount = 0;
        this.smallClearCount = 0;
        this.bigClearCount = 0;
        this.multiplierValues = []; // Track all multiplier values for averaging
        
        // Jewel colors and letters - add more colors as needed
        this.jewelColors = ['#FF6B6B', '#4ECDC4', '#0066FF', '#FFA726', '#9B59B6', '#FFFFFF', '#808080']; // Red, Green, Primary Blue, Orange, Purple, White (bonus), L-bonus
        this.jewelLetters = ['r', 'g', 'b', 'o', 'p', 'w', 'l']; // r=red, g=green, b=blue, o=orange, p=purple, w=white (bonus), l=L-bonus
        
        // Initialize game
        this.initializeGrid();
        this.createGameHTML();
        this.bindEvents();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = Math.floor(Math.random() * this.JEWEL_TYPES);
            }
        }
        
        // Remove initial matches
        this.removeInitialMatches();
    }

    removeInitialMatches() {
        let hasMatches = true;
        let iterations = 0;
        
        while (hasMatches && iterations < 100) {
            hasMatches = false;
            iterations++;
            
            for (let row = 0; row < this.GRID_SIZE; row++) {
                for (let col = 0; col < this.GRID_SIZE; col++) {
                    // Skip the bonus box positions
                    if ((row === 3 && col === 3) || (row === 3 && col === 4)) continue;
                    

                    
                    if (this.wouldCreateMatch(row, col, this.grid[row][col])) {
                        this.grid[row][col] = Math.floor(Math.random() * this.JEWEL_TYPES);
                        hasMatches = true;
                    }
                }
            }
        }
    }

    wouldCreateMatch(row, col, jewelType) {
        // Check horizontal match
        let horizontalCount = 1;
        for (let c = col - 1; c >= 0 && this.grid[row][c] === jewelType; c--) horizontalCount++;
        for (let c = col + 1; c < this.GRID_SIZE && this.grid[row][c] === jewelType; c++) horizontalCount++;
        if (horizontalCount >= 3) return true;
        
        // Check vertical match
        let verticalCount = 1;
        for (let r = row - 1; r >= 0 && this.grid[r][col] === jewelType; r--) verticalCount++;
        for (let r = row + 1; r < this.GRID_SIZE && this.grid[r][col] === jewelType; r++) verticalCount++;
        return verticalCount >= 3;
    }

    createGameHTML() {
        const existingContainer = document.getElementById('jewelGameContainer');
        if (existingContainer) existingContainer.remove();
        
        const gameContainer = document.createElement('div');
        gameContainer.id = 'jewelGameContainer';
        gameContainer.innerHTML = `
            <div class="jewel-circle">
                <span class="x">x</span><span class="multiplier">1</span>
            </div>
            <div class="jewel-meter">
                <div class="jewel-meter-fill"></div>
            </div>
            <div id="jewelGrid" class="jewel-grid">
                <div class="checkerboard-grid"></div>
            </div>
            <div class="jewel-buttons">
                <div id="playButton">PLAY</div>
                <div id="instructionsButton">INSTRUCTIONS</div>
            </div>
        `;
        document.body.appendChild(gameContainer);
        
        // Create mask to hide falling bricks from top
        const gridElement = document.getElementById('jewelGrid');
        if (gridElement) {
            // Apply overflow hidden to the grid element to hide falling blocks
            gridElement.style.overflow = 'hidden';
            
            // Create a container with overflow hidden to mask the entire game area
            const gameContainer = document.getElementById('jewelGameContainer');
            if (gameContainer) {
                gameContainer.style.overflow = 'hidden';
                gameContainer.style.position = 'relative';
            }
        }
        
        // Debug info
        console.log('Mask created with:', {
            id: gridElement.id,
            position: gridElement.style.top,
            left: gridElement.style.left,
            width: gridElement.style.width,
            height: gridElement.style.height,
            zIndex: gridElement.style.zIndex
        });
        
        this.renderGrid();
        
        // Position the UI elements relative to the grid
        this.positionUI();
        
        // Add button event listeners
        const playButton = document.querySelector('.jewel-buttons #playButton');
        const instructionsButton = document.querySelector('.jewel-buttons #instructionsButton');
        
        // console.log('Found play button:', playButton);
        // console.log('Found instructions button:', instructionsButton);
        
        if (playButton) {
            console.log('Adding click listener to play button');
            playButton.addEventListener('click', (e) => {
                // console.log('Play button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.startGame();
                const buttonContainer = document.querySelector('.jewel-buttons');
                if (buttonContainer) {
                    buttonContainer.style.display = 'none';
                    // console.log('Buttons hidden');
                }
            });
            
            // Also try mousedown and touchstart as backup
            playButton.addEventListener('mousedown', (e) => {
                // console.log('Play button mousedown!', e);
            });
            
            playButton.addEventListener('touchstart', (e) => {
                // console.log('Play button touchstart!', e);
            });
        }else{
            // console.log('No play button found');
        }
        
        if (instructionsButton) {
            instructionsButton.addEventListener('click', () => {
                console.log('Instructions button clicked!');
                this.e.s.p("click1");
                const instructionsOverlay = document.getElementById('instructionsOverlay');
                if (instructionsOverlay) instructionsOverlay.style.display = 'flex';
            });
        }
        
        // Add close instructions button listener
        const closeInstructionsButton = document.getElementById('closeInstructionsButton');
        if (closeInstructionsButton) {
            closeInstructionsButton.addEventListener('click', () => {
                console.log('Close instructions button clicked!');
                this.e.s.p("click1");
                const instructionsOverlay = document.getElementById('instructionsOverlay');
                if (instructionsOverlay) instructionsOverlay.style.display = 'none';
            });
        }
    }

    positionUI() {
        const gridElement = document.getElementById('jewelGrid');
        const meterElement = document.querySelector('.jewel-meter');
        const buttonsElement = document.querySelector('.jewel-buttons');
        const circleElement = document.querySelector('.jewel-circle');
        
        if (gridElement && meterElement && buttonsElement && circleElement) {
            const gridRect = gridElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportCenter = viewportHeight / 2;
            const gridHeight = gridRect.height;
            const halfGridHeight = gridHeight / 2;
            
            // Position circle: viewport center - half grid height - 37px (above meter, nudged up 2px)
            const circleTop = viewportCenter - halfGridHeight - 37;
            circleElement.style.top = circleTop + 'px';
            
            // Position meter: viewport center - half grid height - 30px
            const meterTop = viewportCenter - halfGridHeight - 30;
            meterElement.style.top = meterTop + 'px';
            
            // Set meter width to match grid width exactly (minus 4px for padding)
            meterElement.style.width = (gridRect.width - 4) + 'px';
            
            // Position buttons: viewport center + half grid height + 30px
            const buttonsTop = viewportCenter + halfGridHeight + 20;
            buttonsElement.style.top = buttonsTop + 'px';
            
            // Set buttons width to match grid width
            buttonsElement.style.width = gridRect.width + 'px';
        }
    }

    renderGrid() {

        console.log("renderGrid");

        const gridElement = document.getElementById('jewelGrid');
        if (!gridElement) return;
        
        // Store existing debug numbers before clearing
        const existingDebugNumbers = new Map();
        const existingJewels = gridElement.querySelectorAll('.jewel');
        existingJewels.forEach(jewel => {
            const row = jewel.dataset.row;
            const col = jewel.dataset.col;
            const debugNumber = jewel.querySelector('.debug-number[data-debug-type="block-count"]');
            if (debugNumber && row && col) {
                existingDebugNumbers.set(`${row},${col}`, debugNumber.textContent);
            }
        });
        
        // Calculate jewel size first
        const gridWidth = gridElement.offsetWidth - 20;
        const gridHeight = gridElement.offsetHeight - 20;
        this.jewelSize = Math.floor(Math.min(gridWidth / this.GRID_SIZE, gridHeight / this.GRID_SIZE) - 2);
        this.jewelGap = 2;
        this.gridPadding = 10;
        
        // Clear the grid but preserve the checkerboard container
        const checkerboardGrid = gridElement.querySelector('.checkerboard-grid');
        gridElement.innerHTML = '';
        
        // Recreate the checkerboard grid
        const newCheckerboardGrid = document.createElement('div');
        newCheckerboardGrid.className = 'checkerboard-grid';
        gridElement.appendChild(newCheckerboardGrid);
        
        // Create checkerboard background
        console.log('Checkerboard grid element:', newCheckerboardGrid);
        if (newCheckerboardGrid) {
            let cellCount = 0;
            for (let row = 0; row < this.GRID_SIZE; row++) {
                for (let col = 0; col < this.GRID_SIZE; col++) {
                    const checkerboardCell = document.createElement('div');
                    checkerboardCell.className = 'checkerboard-cell';
                    checkerboardCell.style.left = `${this.gridPadding + col * (this.jewelSize + this.jewelGap)}px`;
                    checkerboardCell.style.top = `${this.gridPadding + row * (this.jewelSize + this.jewelGap)}px`;
                    checkerboardCell.style.width = `${this.jewelSize}px`;
                    checkerboardCell.style.height = `${this.jewelSize}px`;
                    
                    // Apply checkerboard pattern
                    if ((row + col) % 2 === 0) {
                        checkerboardCell.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        // console.log(`Created checkerboard cell at [${row},${col}] with background`);
                    } else {
                        // console.log(`Created checkerboard cell at [${row},${col}] without background`);
                    }
                    
                    newCheckerboardGrid.appendChild(checkerboardCell);
                    cellCount++;
                }
            }
            console.log(`Created ${cellCount} checkerboard cells`);
        } else {
            console.error('Checkerboard grid not found!');
        }
        
        // Create jewels
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const jewelElement = document.createElement('div');
                jewelElement.className = 'jewel';
                jewelElement.dataset.row = row;
                jewelElement.dataset.col = col;
                jewelElement.dataset.color = this.jewelLetters[this.grid[row][col]];
                jewelElement.style.width = `${this.jewelSize}px`;
                jewelElement.style.height = `${this.jewelSize}px`;
                jewelElement.style.left = `${this.gridPadding + col * (this.jewelSize + this.jewelGap)}px`;
                jewelElement.style.top = `${this.gridPadding + row * (this.jewelSize + this.jewelGap)}px`;
                
                // Create and add the jewel image
                const jewelImage = document.createElement('img');
                jewelImage.src = `src/images/jewel_${this.jewelLetters[this.grid[row][col]]}.png`;
                jewelImage.style.width = '100%';
                jewelImage.style.height = '100%';
                jewelImage.style.objectFit = 'contain';
                jewelImage.style.pointerEvents = 'none';
                jewelImage.style.display = 'block';
                jewelElement.appendChild(jewelImage);
                
                                        // Style bonus boxes (white and L-bonus jewels)
                if (this.grid[row][col] === 5 || this.grid[row][col] === 6) {
                    jewelElement.dataset.bonusBox = 'true';
                    
                    // Add glowing tween to bonus box images
                    const jewelImage = jewelElement.querySelector('img');
                    if (jewelImage) {
                        gsap.to(jewelImage, {
                            filter: "brightness(2.5)",
                            duration: 1.5,
                            ease: "power2.inOut",
                            yoyo: true,
                            repeat: -1
                        });
                    }
                }
                
                // Add debug text box at lower left corner
                const debugText = document.createElement('div');
                debugText.className = 'debug-number';
                debugText.dataset.debugType = 'block-count';
                debugText.style.position = 'absolute';
                debugText.style.bottom = '2px';
                debugText.style.left = '2px';
                debugText.style.fontSize = '10px';
                debugText.style.color = 'blue';
                debugText.style.fontFamily = 'Arial, sans-serif';
                debugText.style.fontWeight = 'bold';
                debugText.style.pointerEvents = 'none';
                debugText.style.zIndex = '1000';
                
                // Restore existing debug number if available, otherwise use '0'
                const key = `${row},${col}`;
                debugText.textContent = existingDebugNumbers.has(key) ? existingDebugNumbers.get(key) : '0';
                
                // jewelElement.appendChild(debugText);
                gridElement.appendChild(jewelElement);
            }
        }

        //count initial positions here
        // Record Y positions of each row in the first column
        this.initialRowPositions = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            const jewelInFirstColumn = document.querySelector(`[data-row="${row}"][data-col="0"]`);
            if (jewelInFirstColumn) {
                const yPosition = parseInt(jewelInFirstColumn.style.top) || 0;
                this.initialRowPositions[row] = yPosition;
                // console.log(`Initial position for row ${row}: Y = ${yPosition}px`);
            }
        }
        
        // Reverse the array so first element becomes last
        this.initialRowPositions.reverse();
        console.log('Reversed initialRowPositions:', this.initialRowPositions);
        
        // Calculate initial debug numbers for all blocks
        this.countBlockBelow();
    }

    bindEvents() {
        const gridElement = document.getElementById('jewelGrid');
        if (!gridElement) return;
        
        this.isGesturing = false;
        this.gestureStartJewel = null;
        this.startX = 0;
        this.startY = 0;
        this.hasTriggeredSwap = false;
        
        gridElement.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        gridElement.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e), { passive: false });
        gridElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Add key listeners for debugging
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                this.logAllBlocks();
            } else if (e.key === 'h' || e.key === 'H') {
                this.toggleGridOverlay();
            } else if (e.key === 'j' || e.key === 'J') {
                this.toggleMask();
            }
        });
    }

    showStartMenu() {
        const startMenu = document.getElementById('startMenu');
        const playButton = document.getElementById('playButton');
        const instructionsButton = document.getElementById('instructionsButton');
        const instructionsOverlay = document.getElementById('instructionsOverlay');
        const closeInstructionsButton = document.getElementById('closeInstructionsButton');
        
        console.log('showStartMenu - Elements found:', {
            startMenu: !!startMenu,
            playButton: !!playButton,
            instructionsButton: !!instructionsButton,
            instructionsOverlay: !!instructionsOverlay,
            closeInstructionsButton: !!closeInstructionsButton
        });
        
        if (startMenu && playButton) {
            startMenu.style.display = 'flex';
            playButton.onclick = () => this.startGame();
            
            if (instructionsButton && instructionsOverlay && closeInstructionsButton) {
                // Event handlers are already set up in the constructor
                // Just add the overlay click handler here
                instructionsOverlay.onclick = (e) => {
                    if (e.target === instructionsOverlay) {
                        console.log('Instructions overlay clicked, playing click sound');
                        this.e.s.p("click1");
                        instructionsOverlay.style.display = 'none';
                    }
                };
            }
        }
    }

    startGame() {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) startMenu.style.display = 'none';
        
        // Play start sound
        this.e.s.p("jewel_start");
        
        this.gameStarted = true;
        this.startTimer();
        this.updateScoreDisplay();
        this.updateMultiplierDisplay();
        this.updateMeterDisplay();
        this.lastMatchTime = Date.now();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            if (this.timeLeft <= 0) this.endGame();
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const timerDiv = document.getElementById('timerDiv');
        if (timerDiv) timerDiv.textContent = timeString;
    }

    updateScoreDisplay() {
        const scoreDiv = document.getElementById('scoreDiv');
        if (scoreDiv) scoreDiv.textContent = `SCORE: ${this.score}`;
    }

    updateMultiplierDisplay() {
        const multiplierSpan = document.querySelector('.jewel-circle .multiplier');
        if (multiplierSpan) {
            multiplierSpan.textContent = this.scoreMultiplier;
        }
    }

    updateMeterDisplay() {
        const meterFill = document.querySelector('.jewel-meter-fill');
        if (meterFill) {
            // Kill any existing GSAP tweens on the meter
            gsap.killTweensOf(meterFill);
            
            // Calculate width percentage (1 = 0%, 10 = 100%)
            const widthPercentage = ((this.scoreMultiplier - 1) / (this.maxMultiplier - 1)) * 100;
            
            // Animate the meter width with GSAP
            gsap.to(meterFill, {
                width: widthPercentage + '%',
                duration: 0.25,
                ease: "power2.out"
            });
        }
    }

    increaseMultiplier() {
        if (this.scoreMultiplier < this.maxMultiplier) {
            this.scoreMultiplier += 0.5;
            this.updateMultiplierDisplay();
            this.updateMeterDisplay();
            
            // Start the reset timer for this multiplier
            this.startMultiplierResetTimer();
        }
    }

    resetMultiplier() {
        // Only play loseStreak sound if the streak was 2 or better AND game hasn't ended
        if (this.scoreMultiplier >= 2 && !this.gameOver) {
            this.e.s.p("loseStreak");
        }
        
        this.scoreMultiplier = 1;
        this.updateMultiplierDisplay();
        this.updateMeterDisplay();
        // Stop the reset timer since we're manually resetting
        this.stopMultiplierResetTimer();
    }

    startMultiplierResetTimer() {
        // Calculate timer: start at 3 seconds, subtract (multiplier * 0.2) seconds
        const baseTime = 2.1;
        const timeReduction = this.scoreMultiplier * 0.4;
        this.multiplierResetTimer = baseTime - timeReduction; // Minimum 0.5 seconds
        if(this.multiplierResetTimer < 1) {
            this.multiplierResetTimer = 1;
        }
    }

    stopMultiplierResetTimer() {
        // Set timer to 0 to disable countdown
        this.multiplierResetTimer = 0;
    }

    handleDragStart(e) {
        if (this.isAnimating || this.gameOver || !this.gameStarted) return;
        
        e.preventDefault();
        const jewelElement = e.target.closest('.jewel');
        if (!jewelElement) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        this.isGesturing = true;
        this.gestureStartJewel = {
            row: parseInt(jewelElement.dataset.row),
            col: parseInt(jewelElement.dataset.col),
            element: jewelElement
        };
        
        this.startX = clientX;
        this.startY = clientY;
        this.hasTriggeredSwap = false;
        
        this.highlightJewel(this.gestureStartJewel.row, this.gestureStartJewel.col, true);
    }

    handleDragMove(e) {
        if (!this.isGesturing || !this.gestureStartJewel || this.hasTriggeredSwap || this.isAnimating) return;
        
        e.preventDefault();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        const threshold = 12;
        
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            let targetRow = this.gestureStartJewel.row;
            let targetCol = this.gestureStartJewel.col;
            let hasValidTarget = false;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > threshold && targetCol < this.GRID_SIZE - 1) {
                    targetCol++;
                    hasValidTarget = true;
                } else if (deltaX < -threshold && targetCol > 0) {
                    targetCol--;
                    hasValidTarget = true;
                }
            } else {
                if (deltaY > threshold && targetRow < this.GRID_SIZE - 1) {
                    targetRow++;
                    hasValidTarget = true;
                } else if (deltaY < -threshold && targetRow > 0) {
                    targetRow--;
                    hasValidTarget = true;
                }
            }
            
            if (hasValidTarget) {
                this.hasTriggeredSwap = true;
                this.setAnimatingTrue();
                // this.clearAllHighlights();
                this.attemptSwap(this.gestureStartJewel.row, this.gestureStartJewel.col, targetRow, targetCol);
            }
        }
    }

    handleDragEnd(e) {
        if (!this.isGesturing || this.isAnimating) return;
        e.preventDefault();
        // this.clearAllHighlights();
        this.isGesturing = false;
        this.gestureStartJewel = null;
        this.hasTriggeredSwap = false;
    }

    clearAllHighlights() {
        // const jewels = document.querySelectorAll('.jewel');
        // jewels.forEach(jewel => {
        //     jewel.style.transform = 'scale(1)';
        //     jewel.classList.remove('drag-target');
        // });
    }

    highlightJewel(row, col, highlight) {
        const jewelElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (jewelElement) {
            if (highlight) {
                jewelElement.style.zIndex = '100';
            } else {
                jewelElement.style.zIndex = '';
            }
        }
    }

    attemptSwap(row1, col1, row2, col2) {
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            this.setAnimatingFalse();
            this.showInvalidMoveFeedback(row1, col1, row2, col2);
            
            return;
        }
        
        // Check if one of the swapped jewels is a bonus box
        const isBonusBox1 = jewel1.dataset.color === 'w' || jewel1.dataset.color === 'l';
        const isBonusBox2 = jewel2.dataset.color === 'w' || jewel2.dataset.color === 'l';
        
        if (isBonusBox1 || isBonusBox2) {
            // Save current multiplier for bonus box usage
            this.savedMultiplier = this.scoreMultiplier;
            // Reset the multiplier timer when using a bonus box
            this.startMultiplierResetTimer();
            
            // Check for bonus box to bonus box interactions
            if (isBonusBox1 && isBonusBox2) {
                const bonusBox1Type = jewel1.dataset.color;
                const bonusBox2Type = jewel2.dataset.color;
                
                // Grey to Grey (L-bonus to L-bonus)
                if (bonusBox1Type === 'l' && bonusBox2Type === 'l') {
                    console.log("L-bonus to L-bonus interaction detected!");
                    this.explosionCount++; // Track explosion usage
                    
                    // Play explosion sound
                    this.e.s.p("jewel_explosion");
                    
                    // Create larger diamond explosion
                    const jewelsToClear = [];
                    const bonusBoxRow = row1;
                    const bonusBoxCol = col1;
                    
                    // Create larger diamond pattern (4 blocks in each direction instead of 3)
                    for (let r = Math.max(0, bonusBoxRow - 4); r <= Math.min(this.GRID_SIZE - 1, bonusBoxRow + 4); r++) {
                        for (let c = Math.max(0, bonusBoxCol - 4); c <= Math.min(this.GRID_SIZE - 1, bonusBoxCol + 4); c++) {
                            // Calculate Manhattan distance (diamond shape)
                            const distance = Math.abs(r - bonusBoxRow) + Math.abs(c - bonusBoxCol);
                            if (distance <= 4) {
                                // Check if this position has a special block (bonus box)
                                const jewelElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                                if (jewelElement) {
                                    const jewelColor = jewelElement.dataset.color;
                                    // Only clear regular jewels (0-4), not bonus boxes (5-6)
                                    if (jewelColor !== 'w' && jewelColor !== 'l') {
                                        jewelsToClear.push({ row: r, col: c });
                                    }
                                }
                            }
                        }
                    }
                    
                    if (jewelsToClear.length > 0) {
                        // Calculate score for L-bonus to L-bonus interaction (1000 points)
                        const finalScore = 1000 * this.savedMultiplier;
                        this.score += finalScore;
                        console.log(`SCORE: +${finalScore} (L-bonus to L-bonus: 1000 × ${this.savedMultiplier}x saved multiplier)`);
                        this.updateScoreDisplay();
                        
                        // Show score popup at center of explosion
                        const centerX = (this.gridPadding + bonusBoxCol * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        const centerY = (this.gridPadding + bonusBoxRow * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        this.showScorePopup(finalScore, [{ x: centerX, y: centerY }]);
                        
                        // Create explosion effects before clearing
                        this.createExplosionEffect(row2, col2, jewelsToClear);
                        
                        // Animate the swap and clear
                        this.animateSwap(row1, col1, row2, col2, () => {
                            // Clear all jewels in the larger diamond pattern
                            this.clearAllJewelsOfColor(jewelsToClear, () => {
                                this.handleBlockFallingAfterMatch([], []);
                            });
                        });
                        
                        // Increase multiplier AFTER scoring is done
                        this.increaseMultiplier();
                        return;
                    }
                }
                
                // Grey to White (L-bonus to White bonus)
                if ((bonusBox1Type === 'l' && bonusBox2Type === 'w') || (bonusBox1Type === 'w' && bonusBox2Type === 'l')) {
                    console.log("L-bonus to White bonus interaction detected!");
                    this.smallClearCount++; // Track small board clear
                    
                    // Play board clear sound
                    this.e.s.p("jewel_clear");
                    
                    // Clear entire board
                    const allJewels = document.querySelectorAll('.jewel');
                    const jewelsToClear = [];
                    
                    allJewels.forEach(jewel => {
                        const row = parseInt(jewel.dataset.row);
                        const col = parseInt(jewel.dataset.col);
                        if (row >= 0 && col >= 0) {
                            jewelsToClear.push({ row, col });
                        }
                    });
                    
                    if (jewelsToClear.length > 0) {
                        // Calculate score for L-bonus to White interaction (1500 points)
                        const finalScore = 1500 * this.savedMultiplier;
                        this.score += finalScore;
                        console.log(`SCORE: +${finalScore} (L-bonus to White: 1500 × ${this.savedMultiplier}x saved multiplier)`);
                        this.updateScoreDisplay();
                        
                        // Show score popup at center of board
                        const centerX = (this.gridPadding + 3.5 * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        const centerY = (this.gridPadding + 3.5 * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        this.showScorePopup(finalScore, [{ x: centerX, y: centerY }]);
                        
                        // Create epic board-clearing explosion effect
                        this.createEpicBoardExplosion();
                        
                        // Animate the swap and clear entire board
                        this.animateSwap(row1, col1, row2, col2, () => {
                            // Pause the game for 1 second during the epic explosion
                            this.setAnimatingTrue();
                            setTimeout(() => {
                                this.clearAllJewelsOfColor(jewelsToClear, () => {
                                    this.handleBlockFallingAfterMatch([], []);
                                });
                                this.setAnimatingFalse();
                            }, 1000);
                        });
                        
                        // Increase multiplier AFTER scoring is done
                        this.increaseMultiplier();
                        return;
                    }
                }
                
                // White to White (White bonus to White bonus)
                if (bonusBox1Type === 'w' && bonusBox2Type === 'w') {
                    console.log("White bonus to White bonus interaction detected!");
                    this.bigClearCount++; // Track big board clear
                    
                    // Play board clear sound
                    this.e.s.p("jewel_clear");
                    
                    // Clear entire board
                    const allJewels = document.querySelectorAll('.jewel');
                    const jewelsToClear = [];
                    
                    allJewels.forEach(jewel => {
                        const row = parseInt(jewel.dataset.row);
                        const col = parseInt(jewel.dataset.col);
                        if (row >= 0 && col >= 0) {
                            jewelsToClear.push({ row, col });
                        }
                    });
                    
                    if (jewelsToClear.length > 0) {
                        // Calculate score for White to White interaction (2000 points)
                        const finalScore = 2000 * this.savedMultiplier;
                        this.score += finalScore;
                        console.log(`SCORE: +${finalScore} (White to White: 2000 × ${this.savedMultiplier}x saved multiplier)`);
                        this.updateScoreDisplay();
                        
                        // Show score popup at center of board
                        const centerX = (this.gridPadding + 3.5 * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        const centerY = (this.gridPadding + 3.5 * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
                        this.showScorePopup(finalScore, [{ x: centerX, y: centerY }]);
                        
                        // Create epic board-clearing explosion effect
                        this.createEpicBoardExplosion();
                        
                        // Animate the swap and clear entire board
                        this.animateSwap(row1, col1, row2, col2, () => {
                            // Pause the game for 1 second during the epic explosion
                            this.setAnimatingTrue();
                            setTimeout(() => {
                                this.clearAllJewelsOfColor(jewelsToClear, () => {
                                    this.handleBlockFallingAfterMatch([], []);
                                });
                                this.setAnimatingFalse();
                            }, 1000);
                        });
                        
                        // Increase multiplier AFTER scoring is done
                        this.increaseMultiplier();
                        return;
                    }
                }
            }
            
            // Determine which bonus box and its type
            const bonusBoxJewel = isBonusBox1 ? jewel1 : jewel2;
            const bonusBoxType = bonusBoxJewel.dataset.color;
            const bonusBoxRow = isBonusBox1 ? row1 : row2;
            const bonusBoxCol = isBonusBox1 ? col1 : col2;
            
            if (bonusBoxType === 'l') {
                // L-bonus box: Create diamond-shaped destruction
                console.log("L-bonus box swap detected! Creating diamond destruction");
                this.explosionCount++; // Track explosion usage
                
                // Play explosion sound
                this.e.s.p("jewel_explosion");
                
                const jewelsToClear = [];
                
                // Create diamond pattern: 3 blocks in each direction + diagonals
                for (let r = Math.max(0, bonusBoxRow - 3); r <= Math.min(this.GRID_SIZE - 1, bonusBoxRow + 3); r++) {
                    for (let c = Math.max(0, bonusBoxCol - 3); c <= Math.min(this.GRID_SIZE - 1, bonusBoxCol + 3); c++) {
                        // Calculate Manhattan distance (diamond shape)
                        const distance = Math.abs(r - bonusBoxRow) + Math.abs(c - bonusBoxCol);
                        if (distance <= 3) {
                            // Check if this position has a special block (bonus box)
                            const jewelElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                            if (jewelElement) {
                                const jewelColor = jewelElement.dataset.color;
                                // Only clear regular jewels (0-4), not bonus boxes (5-6)
                                if (jewelColor !== 'w' && jewelColor !== 'l') {
                                    jewelsToClear.push({ row: r, col: c });
                                }
                            }
                        }
                    }
                }
                
                if (jewelsToClear.length > 0) {
                    // Animate the swap
                    this.animateSwap(row1, col1, row2, col2, () => {
                        // Convert the diamond positions to match format
                        const diamondMatches = jewelsToClear.map(pos => ({ row: pos.row, col: pos.col }));
                        
                        // Calculate score for L-bonus destruction (300 points)
                        const finalScore = 300 * this.savedMultiplier;
                        this.score += finalScore;
                        console.log(`SCORE: +${finalScore} (L-bonus destruction: 300 × ${this.savedMultiplier}x saved multiplier)`);
                        this.updateScoreDisplay();
                        
                        // Calculate center position for single score popup
                        let centerX = 0;
                        let centerY = 0;
                        let validPositions = 0;
                        
                        jewelsToClear.forEach(pos => {
                            const jewelElement = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                            if (jewelElement) {
                                const rect = jewelElement.getBoundingClientRect();
                                centerX += rect.left + rect.width / 2;
                                centerY += rect.top + rect.height / 2;
                                validPositions++;
                            }
                        });
                        
                        if (validPositions > 0) {
                            centerX /= validPositions;
                            centerY /= validPositions;
                            
                            // Show single score popup at center of diamond destruction
                            this.showScorePopup(finalScore, [{ x: centerX, y: centerY }]);
                        }
                        
                        // Create explosion effects before clearing
                        this.createExplosionEffect(row2, col2, jewelsToClear);
                        
                        // Use the same animation and block falling procedure as regular matches
                        this.animateClearMatches(diamondMatches, [], () => {
                            this.handleBlockFallingAfterMatch(diamondMatches, []);
                        });
                        
                        // Increase multiplier AFTER L-bonus scoring is done
                        this.increaseMultiplier();
                    });
                    return;
                }
            } else {
                // White bonus box: Clear all jewels of the target color
                const colorToClear = isBonusBox1 ? jewel2.dataset.color : jewel1.dataset.color;
                this.bonusBoxCount++; // Track white bonus box usage
                
                // Play white jewel sound
                this.e.s.p("jewel_white");
                
                console.log(`White bonus box detected! Color to clear: ${colorToClear}`);
                console.log(`jewel1.dataset.color: ${jewel1.dataset.color}, jewel2.dataset.color: ${jewel2.dataset.color}`);
                console.log(`isBonusBox1: ${isBonusBox1}`);
                
                if (colorToClear) {
                    console.log(`White bonus box swap detected! Clearing all ${colorToClear} jewels`);
                    
                    // Find all jewels of the target color
                    const jewelsToClear = [];
                    const allJewels = document.querySelectorAll('.jewel');
                    
                    console.log(`Total jewels found: ${allJewels.length}`);
                    
                    allJewels.forEach(jewel => {
                        if (jewel.dataset.color === colorToClear) {
                            const row = parseInt(jewel.dataset.row);
                            const col = parseInt(jewel.dataset.col);
                            if (row >= 0 && col >= 0) {
                                jewelsToClear.push({ row, col });
                            }
                        }
                    });
                    
                    console.log(`Jewels of color ${colorToClear} found: ${jewelsToClear.length}`);
                    
                    // Also add the position where the swapped jewel will end up
                    jewelsToClear.push({ row: bonusBoxRow, col: bonusBoxCol });
                    
                    console.log(`Total jewels to clear (including bonus box): ${jewelsToClear.length}`);
                    
                    if (jewelsToClear.length > 0) {
                        // Calculate score for white bonus box usage (flat 500 points)
                        const jewelsCleared = jewelsToClear.length - 1; // Subtract 1 for the bonus box itself
                        const finalWhiteBonusScore = 500 * this.savedMultiplier;
                        this.score += finalWhiteBonusScore;
                        console.log(`SCORE: +${finalWhiteBonusScore} (white bonus usage: 500 × ${this.savedMultiplier}x saved multiplier)`);
                        console.log(`Total score now: ${this.score}`);
                        this.updateScoreDisplay();
                        
                        // Show single score popup for white bonus usage
                        if (jewelsCleared > 0) {
                            // Calculate center of all cleared jewels for single popup
                            let centerX = 0;
                            let centerY = 0;
                            let validPositions = 0;
                            
                            jewelsToClear.slice(0, -1).forEach(pos => {
                                const jewelElement = document.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
                                if (jewelElement) {
                                    const rect = jewelElement.getBoundingClientRect();
                                    centerX += rect.left + rect.width / 2;
                                    centerY += rect.top + rect.height / 2;
                                    validPositions++;
                                }
                            });
                            
                            if (validPositions > 0) {
                                centerX /= validPositions;
                                centerY /= validPositions;
                                
                                // Show single score popup at center of cleared area
                                this.showScorePopup(finalWhiteBonusScore, [{ x: centerX, y: centerY }]);
                            }
                        }
                        
                        // Create white bonus box explosion effect before clearing
                        this.createWhiteBonusExplosion(row2, col2, colorToClear);
                        
                        // Animate the swap
                        this.animateSwap(row1, col1, row2, col2, () => {
                            // Pause the game for 0.5 seconds during the white bonus explosion
                            this.setAnimatingTrue();
                            setTimeout(() => {
                                // Clear all jewels of the target color
                                this.clearAllJewelsOfColor(jewelsToClear, () => {
                                    // After clearing, handle like a normal match - create new blocks and fall
                                    this.handleBlockFallingAfterMatch([], []);
                                });
                                this.setAnimatingFalse();
                            }, 500);
                        });
                        
                        // Increase multiplier AFTER bonus box scoring is done
                        this.increaseMultiplier();
                        return;
                    }
                }
            }
        }
        
        // Normal swap logic
        const color1 = jewel1.dataset.color;
        const color2 = jewel2.dataset.color;
        
        jewel1.dataset.color = color2;
        jewel2.dataset.color = color1;
        
        const { matches, bonusBoxes, matchesByColor } = this.findMatches(true);
        
        jewel1.dataset.color = color1;
        jewel2.dataset.color = color2;
        
        if (matches.length > 0) {
            // Save current multiplier for regular match
            this.savedMultiplier = this.scoreMultiplier;
            
            this.animateSwap(row1, col1, row2, col2, () => {
                this.processMatches(bonusBoxes, false); // false = not cascade
            });
        } else {
            this.showInvalidMoveFeedback(row1, col1, row2, col2);
        }
    }
    
    clearAllJewelsOfColor(jewelsToClear, callback) {
        const elements = [];
        
        // Also clear any bonus boxes that were involved in the swap
        const allJewels = document.querySelectorAll('.jewel');
        allJewels.forEach(jewel => {
            if ((jewel.dataset.color === 'w' || jewel.dataset.color === 'l') && jewel.dataset.bonusBox === 'true') {
                const row = parseInt(jewel.dataset.row);
                const col = parseInt(jewel.dataset.col);
                if (row >= 0 && col >= 0) {
                    //console.log(`Clearing ${jewel.dataset.color === 'w' ? 'white' : 'L-bonus'} bonus box at [${row},${col}]`);
                    elements.push(jewel);
                    
                    // Mark as cleared and void
                    jewel.dataset.cleared = 'true';
                    jewel.dataset.void = 'true';
                    
                    // Update the grid
                    if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                        this.grid[row][col] = -1;
                    }
                }
            }
        });
        
        jewelsToClear.forEach(jewelPos => {
            const element = document.querySelector(`[data-row="${jewelPos.row}"][data-col="${jewelPos.col}"]`);
            if (element) {
                //console.log(`Clearing jewel at [${jewelPos.row},${jewelPos.col}]`);
                elements.push(element);
                
                // Mark as cleared and void
                element.dataset.cleared = 'true';
                element.dataset.void = 'true';
                
                // Update the grid
                if (jewelPos.row >= 0 && jewelPos.row < this.GRID_SIZE && jewelPos.col >= 0 && jewelPos.col < this.GRID_SIZE) {
                    this.grid[jewelPos.row][jewelPos.col] = -1;
                }
            }
        });
        
        if (elements.length > 0) {
            // Create animation for clearing the jewels
            const tl = gsap.timeline({
                onComplete: () => {
                    //console.log("Bonus box clear animation complete");
                    
                    // After clearing, trigger block falling and new block creation
                    // this.handleBlockFallingAfterBonusBoxClear();
                    this.handleBlockFallingAfterMatch([], []);
                }
            });
            
            tl.to(elements, {
                rotation: 360,
                scale: 0,
                duration: 0.25,
                ease: this.jewelEasing,
                transformOrigin: "center center"
            }, 0);
        } else {
            callback();
        }
    }
    
    handleBlockFallingAfterBonusBoxClear() {


        this.countBlockBelow();
        
        // Count all cleared blocks per column
        const clearedPerColumn = new Array(this.GRID_SIZE).fill(0);
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let row = 0; row < this.GRID_SIZE; row++) {
                const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (blockElement && (blockElement.dataset.cleared === 'true' || blockElement.dataset.void === 'true')) {
                    clearedPerColumn[col]++;
                }
            }
        }
        
        // Create a snapshot of the current grid state to ensure consistent calculations
        const gridSnapshot = this.createGridSnapshot();
        
        const blocksToFall = [];
        
        for (let col = 0; col < this.GRID_SIZE; col++) {
            if (clearedPerColumn[col] > 0) {
                for (let row = 0; row < this.GRID_SIZE; row++) {
                    const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (blockElement && !blockElement.dataset.isNew && blockElement.dataset.cleared !== 'true' && blockElement.dataset.void !== 'true') {
                        // Allow both regular blocks AND existing bonus boxes to fall
                        const spacesToFall = this.calculateSpacesToFallFromSnapshot(row, col, gridSnapshot);
                        if (spacesToFall > 0) {
                            blocksToFall.push({
                                element: blockElement,
                                currentRow: row,
                                targetRow: row + spacesToFall,
                                col: col,
                                spacesToFall: spacesToFall
                            });
                        }
                    }
                }
            }
        }
        
        console.log("handleBlockFallingAfterBonusBoxClear");
        const newBlocks = [];
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let i = 0; i < clearedPerColumn[col]; i++) {
                const newJewelType = Math.floor(Math.random() * this.JEWEL_TYPES);
                const newBlock = this.createNewBlock(col, newJewelType, i);
                newBlocks.push(newBlock);
            }
        }
        
        const allBlocksToMove = [...blocksToFall, ...newBlocks];
        

        
        // Start block falling animation immediately
        this.setAnimatingTrue();
        this.animateAllBlocksToFinalPositions(allBlocksToMove);
    }
    
    calculateSpacesToFall(row, col, clearedInColumn) {
        let spacesToFall = 0;
        for (let checkRow = row + 1; checkRow < this.GRID_SIZE; checkRow++) {
            const blockAtCheckRow = document.querySelector(`[data-row="${checkRow}"][data-col="${col}"]`);
            // A space is empty if: no block exists, block is cleared, block is void, OR block is a bonus box that was cleared
            if (!blockAtCheckRow || blockAtCheckRow.dataset.cleared === 'true' || blockAtCheckRow.dataset.void === 'true') {
                spacesToFall++;
            }
            // Note: Bonus boxes (both white 'w' and L-bonus 'l') that are NOT cleared are treated as filled spaces
            // and will prevent blocks from falling through them
        }
        return spacesToFall;
    }

    findMatches(allowBonusBoxes = false) {
        const matches = [];
        const bonusBoxes = [];
        const visited = new Set();
        

        
        // Find all horizontal and vertical matches first (but don't process them yet)
        const horizontalMatches = [];
        const verticalMatches = [];
        
        // Horizontal matches (check for 3, 4, and 5 jewel matches)
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE - 2; col++) {
                const jewel1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const jewel2 = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);
                const jewel3 = document.querySelector(`[data-row="${row}"][data-col="${col + 2}"]`);
                
                if (jewel1 && jewel2 && jewel3) {
                    const color1 = jewel1.dataset.color;
                    const color2 = jewel2.dataset.color;
                    const color3 = jewel3.dataset.color;
                    
                    if (color1 && color2 && color3) {
                        // Skip if any of the colors are bonus boxes (they should never participate in matches)
                        if (color1 === 'w' || color2 === 'w' || color3 === 'w' || color1 === 'l' || color2 === 'l' || color3 === 'l') {
                            continue;
                        }
                        
                        // Check if colors match (only for non-bonus box jewels)
                        if (color1 === color2 && color2 === color3) {
                            // Check for longer matches (4 and 5 jewels)
                            let matchLength = 3;
                            let endCol = col + 2;
                            
                            // Check for 4th jewel
                            const jewel4 = document.querySelector(`[data-row="${row}"][data-col="${col + 3}"]`);
                            if (jewel4 && color1 === jewel4.dataset.color && jewel4.dataset.color !== 'w' && jewel4.dataset.color !== 'l') {
                                matchLength = 4;
                                endCol = col + 3;
                                
                                // Check for 5th jewel
                                const jewel5 = document.querySelector(`[data-row="${row}"][data-col="${col + 4}"]`);
                                if (jewel5 && color1 === jewel5.dataset.color && jewel5.dataset.color !== 'w' && jewel5.dataset.color !== 'l') {
                                    matchLength = 5;
                                    endCol = col + 4;
                                }
                            }
                            

                            
                            // Store horizontal match for L-shape detection (don't process yet)
                            horizontalMatches.push({
                                row: row,
                                startCol: col,
                                endCol: endCol,
                                color: color1,
                                length: matchLength
                            });
                        }
                    }
                }
            }
        }
        
        // Vertical matches (check for 3, 4, and 5 jewel matches)
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let row = 0; row < this.GRID_SIZE - 2; row++) {
                const jewel1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const jewel2 = document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);
                const jewel3 = document.querySelector(`[data-row="${row + 2}"][data-col="${col}"]`);
                
                if (jewel1 && jewel2 && jewel3) {
                    const color1 = jewel1.dataset.color;
                    const color2 = jewel2.dataset.color;
                    const color3 = jewel3.dataset.color;
                    
                    if (color1 && color2 && color3) {
                        // Skip if any of the colors are bonus boxes
                        if (color1 === 'w' || color2 === 'w' || color3 === 'w' || color1 === 'l' || color2 === 'l' || color3 === 'l') {
                            continue;
                        }
                        
                        // Check if colors match
                        if (color1 === color2 && color2 === color3) {
                            // Check for longer matches (4 and 5 jewels)
                            let matchLength = 3;
                            let endRow = row + 2;
                            
                            // Check for 4th jewel
                            const jewel4 = document.querySelector(`[data-row="${row + 3}"][data-col="${col}"]`);
                            if (jewel4 && color1 === jewel4.dataset.color && jewel4.dataset.color !== 'w' && jewel4.dataset.color !== 'l') {
                                matchLength = 4;
                                endRow = row + 3;
                                
                                // Check for 5th jewel
                                const jewel5 = document.querySelector(`[data-row="${row + 4}"][data-col="${col}"]`);
                                if (jewel5 && color1 === jewel5.dataset.color && jewel5.dataset.color !== 'w' && jewel5.dataset.color !== 'l') {
                                    matchLength = 5;
                                    endRow = row + 4;
                                }
                            }
                            

                            
                            // Store vertical match for L-shape detection (don't process yet)
                            verticalMatches.push({
                                col: col,
                                startRow: row,
                                endRow: endRow,
                                color: color1,
                                length: matchLength
                            });
                        }
                    }
                }
            }
        }
        
        // Check for L-shaped matches BEFORE processing regular matches
        if (allowBonusBoxes) {
            horizontalMatches.forEach((horizontalMatch, hIndex) => {
                verticalMatches.forEach((verticalMatch, vIndex) => {
                    // Check for L-shape: vertical line intersects with horizontal line at one end
                    let isLShape = false;
                    let intersectionRow, intersectionCol;
                    
                    // Check if horizontal line extends from the top of vertical line
                    if (horizontalMatch.row === verticalMatch.startRow && 
                        horizontalMatch.startCol <= verticalMatch.col && 
                        horizontalMatch.endCol >= verticalMatch.col) {
                        intersectionRow = verticalMatch.startRow;
                        intersectionCol = verticalMatch.col;
                        isLShape = true;
                    }
                    // Check if horizontal line extends from the bottom of vertical line
                    else if (horizontalMatch.row === verticalMatch.endRow && 
                             horizontalMatch.startCol <= verticalMatch.col && 
                             horizontalMatch.endCol >= verticalMatch.col) {
                        intersectionRow = verticalMatch.endRow;
                        intersectionCol = verticalMatch.col;
                        isLShape = true;
                    }
                    // Check if vertical line extends from the left of horizontal line
                    else if (verticalMatch.col === horizontalMatch.startCol && 
                             verticalMatch.startRow <= horizontalMatch.row && 
                             verticalMatch.endRow >= horizontalMatch.row) {
                        intersectionRow = horizontalMatch.row;
                        intersectionCol = horizontalMatch.startCol;
                        isLShape = true;
                    }
                    // Check if vertical line extends from the right of horizontal line
                    else if (verticalMatch.col === horizontalMatch.endCol && 
                             verticalMatch.startRow <= horizontalMatch.row && 
                             verticalMatch.endRow >= horizontalMatch.row) {
                        intersectionRow = horizontalMatch.row;
                        intersectionCol = horizontalMatch.endCol;
                        isLShape = true;
                    }
                    
                    if (isLShape) {
                        console.log("L shape detected");
                        const intersectionKey = `${intersectionRow}-${intersectionCol}`;
                        
                        // Check if this intersection point isn't already a bonus box
                        const intersectionJewel = document.querySelector(`[data-row="${intersectionRow}"][data-col="${intersectionCol}"]`);
                        if (intersectionJewel && intersectionJewel.dataset.bonusBox !== 'true') {
                            // Check if there are any 5-in-a-row matches that would conflict
                            let hasConflict = false;
                            horizontalMatches.forEach(match => {
                                if (match.length === 5) {
                                    const centerCol = match.startCol + 2;
                                    if (match.row === intersectionRow && centerCol === intersectionCol) {
                                        hasConflict = true;
                                    }
                                }
                            });
                            verticalMatches.forEach(match => {
                                if (match.length === 5) {
                                    const centerRow = match.startRow + 2;
                                    if (match.col === intersectionCol && centerRow === intersectionRow) {
                                        hasConflict = true;
                                    }
                                }
                            });
                            
                            if (!hasConflict) {
                                console.log("Creating L-bonus box at intersection");
                                
                                // Add to bonusBoxes array
                                bonusBoxes.push({ row: intersectionRow, col: intersectionCol, type: 'L-bonus' });
                                
                                // Play jewel make sound for L-bonus creation
                                this.e.s.p("jewel_make");
                                
                                // Mark as visited to prevent duplicate processing
                                visited.add(intersectionKey);
                            } else {
                                console.log("L-shape conflicts with 5-in-a-row, skipping L-bonus creation");
                            }
                        }
                    }
                });
            });
        }
        
        // Process regular matches FIRST (including 5-in-a-row)
        horizontalMatches.forEach(horizontalMatch => {
            if (horizontalMatch.length === 5 && allowBonusBoxes) {
                // Handle 5-jewel match with white bonus box
                const centerCol = horizontalMatch.startCol + 2;
                const centerJewel = document.querySelector(`[data-row="${horizontalMatch.row}"][data-col="${centerCol}"]`);
                
                if (centerJewel && !visited.has(`${horizontalMatch.row}-${centerCol}`)) {
                    bonusBoxes.push({ row: horizontalMatch.row, col: centerCol, type: 'white' });
                    
                    // Play jewel make sound for white bonus creation
                    this.e.s.p("jewel_make");
                    
                    visited.add(`${horizontalMatch.row}-${centerCol}`);
                }
                
                // Add all 5 jewels to matches EXCEPT the center (bonus box)
                for (let c = horizontalMatch.startCol; c <= horizontalMatch.endCol; c++) {
                    const key = `${horizontalMatch.row}-${c}`;
                    if (!visited.has(key) && c !== centerCol) {
                        matches.push({ row: horizontalMatch.row, col: c });
                        visited.add(key);
                    }
                }
            } else {
                // Regular 3, 4, or 5 jewel match (no bonus box)
                for (let c = horizontalMatch.startCol; c <= horizontalMatch.endCol; c++) {
                    const key = `${horizontalMatch.row}-${c}`;
                    if (!visited.has(key)) {
                        matches.push({ row: horizontalMatch.row, col: c });
                        visited.add(key);
                    }
                }
            }
        });
        
        verticalMatches.forEach(verticalMatch => {
            if (verticalMatch.length === 5 && allowBonusBoxes) {
                // Handle 5-jewel match with white bonus box
                const centerRow = verticalMatch.startRow + 2;
                const centerJewel = document.querySelector(`[data-row="${centerRow}"][data-col="${verticalMatch.col}"]`);
                
                if (centerJewel && !visited.has(`${centerRow}-${verticalMatch.col}`)) {
                    bonusBoxes.push({ row: centerRow, col: verticalMatch.col, type: 'white' });
                    
                    // Play jewel make sound for white bonus creation
                    this.e.s.p("jewel_make");
                    
                    visited.add(`${centerRow}-${verticalMatch.col}`);
                }
                
                // Add all 5 jewels to matches EXCEPT the center (bonus box)
                for (let r = verticalMatch.startRow; r <= verticalMatch.endRow; r++) {
                    const key = `${r}-${verticalMatch.col}`;
                    if (!visited.has(key) && r !== centerRow) {
                        matches.push({ row: r, col: verticalMatch.col });
                        visited.add(key);
                    }
                }
            } else {
                // Regular 3, 4, or 5 jewel match (no bonus box)
                for (let r = verticalMatch.startRow; r <= verticalMatch.endRow; r++) {
                    const key = `${r}-${verticalMatch.col}`;
                    if (!visited.has(key)) {
                        matches.push({ row: r, col: verticalMatch.col });
                        visited.add(key);
                    }
                }
            }
        });
        
        // Group matches by color for proper scoring
        const matchesByColor = {};
        
        matches.forEach(match => {
            const jewel = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            if (jewel) {
                const color = jewel.dataset.color;
                if (!matchesByColor[color]) {
                    matchesByColor[color] = [];
                }
                matchesByColor[color].push(match);
            }
        });
        

        
        return { matches, bonusBoxes, matchesByColor };
    }

    animateSwap(row1, col1, row2, col2, callback) {
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            callback();
            return;
        }
        
        const deltaRow = row2 - row1;
        const deltaCol = col2 - col1;
        const translateX = deltaCol * (this.jewelSize + this.jewelGap);
        const translateY = deltaRow * (this.jewelSize + this.jewelGap);
        
        jewel1.style.zIndex = '1000';
        jewel2.style.zIndex = '999';
        
        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set([jewel1, jewel2], { clearProps: "transform" });
                
                // Only swap positions, not colors
                jewel1.dataset.row = row2;
                jewel1.dataset.col = col2;
                jewel2.dataset.row = row1;
                jewel2.dataset.col = col1;
                
                // Update the actual pixel positions to match the new data attributes
                jewel1.style.left = `${this.gridPadding + col2 * (this.jewelSize + this.jewelGap)}px`;
                jewel1.style.top = `${this.gridPadding + row2 * (this.jewelSize + this.jewelGap)}px`;
                jewel2.style.left = `${this.gridPadding + col1 * (this.jewelSize + this.jewelGap)}px`;
                jewel2.style.top = `${this.gridPadding + row1 * (this.jewelSize + this.jewelGap)}px`;
                
                // Make sure the jewel images are properly set
                const jewel1Image = jewel1.querySelector('img');
                const jewel2Image = jewel2.querySelector('img');
                if (jewel1Image) {
                    jewel1Image.src = `src/images/jewel_${jewel1.dataset.color}.png`;
                }
                if (jewel2Image) {
                    jewel2Image.src = `src/images/jewel_${jewel2.dataset.color}.png`;
                }
                
                // Small delay to ensure DOM updates complete before callback
                setTimeout(() => {
                    callback();
                }, 10);
            }
        });
        
        tl.to(jewel1, {
            x: translateX,
            y: translateY,
            duration: 0.15,
            ease: this.jewelEasing
        }, 0)
        .to(jewel2, {
            x: -translateX,
            y: -translateY,
            duration: 0.15,
            ease: this.jewelEasing
        }, 0);
    }

    showInvalidMoveFeedback(row1, col1, row2, col2) {
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            // Don't set isAnimating = false here - let the caller handle it
            return;
        }
        
        const isHorizontal = Math.abs(col2 - col1) > Math.abs(row2 - row1);
        
        const tl = gsap.timeline({
            onComplete: () => {
                // Set isAnimating = false after invalid move feedback completes
                this.setAnimatingFalse();
            }
        });
        
        if (isHorizontal) {
            tl.to([jewel1, jewel2], { x: 5, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { x: -5, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { x: 3, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { x: 0, duration: 0.05, ease: this.jewelEasing });
        } else {
            tl.to([jewel1, jewel2], { y: 5, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { y: -5, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { y: 3, duration: 0.05, ease: this.jewelEasing })
              .to([jewel1, jewel2], { y: 0, duration: 0.05, ease: this.jewelEasing });
        }
    }

    processMatches(bonusBoxesFromPrevious = [], isCascade = false) {

        
        // CRITICAL: Sync the grid before finding matches
        this.syncInternalGridFromDOM();
        
        const { matches, bonusBoxes, matchesByColor } = this.findMatches(true); // No bonus boxes in cascade matches
        
        if (matches.length === 0) {
            // Reset multiplier when no matches are found
            this.resetMultiplier();
            // Don't set isAnimating = false here - let the caller handle it
            return;
        }
        
        // Set animating to true when processing matches
        this.setAnimatingTrue();
        
        // Process matches by color for proper scoring
        let totalScore = 0;
        
        // Apply multiplier (use saved multiplier for cascade consistency)
        const multiplierToUse = isCascade ? this.savedMultiplier : this.scoreMultiplier;
        
        // Play match sound based on multiplier
        if (!isCascade) {
            const matchSoundIndex = Math.min(Math.floor(multiplierToUse * 2), 10);
            const matchSoundName = `match${matchSoundIndex}`;
            this.e.s.p(matchSoundName);
            
            // Create subtle glow effects for matches (moved to findMatches where jewels are marked as cleared)
        } else {
            // Play cascade sound for cascade matches
            this.e.s.p("jewel_cascade");
        }
        
        // Score each color group separately
        Object.keys(matchesByColor).forEach(color => {
            const colorMatches = matchesByColor[color];
            const matchLength = colorMatches.length;
            
            // Calculate base score based on match length
            let baseScore = 0;
            if (matchLength === 3) {
                baseScore = 100;
                this.match3Count++;
            } else if (matchLength === 4) {
                baseScore = 150;
                this.match4Count++;
            } else if (matchLength === 5) {
                baseScore = 200;
                this.match5Count++;
            }
            
            // Apply multiplier
            const finalScore = baseScore * multiplierToUse;
            totalScore += finalScore;
            
            // Track multiplier value for averaging
            this.multiplierValues.push(multiplierToUse);
            
            console.log(`SCORE: +${finalScore} (${color} jewels: ${matchLength} match: ${baseScore} × ${multiplierToUse}x ${isCascade ? 'saved' : 'current'} multiplier)`);
            
            // Calculate center position of this match group for single score popup
            let centerX = 0;
            let centerY = 0;
            let validPositions = 0;
            
            colorMatches.forEach(match => {
                const jewelElement = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
                if (jewelElement) {
                    const rect = jewelElement.getBoundingClientRect();
                    centerX += rect.left + rect.width / 2;
                    centerY += rect.top + rect.height / 2;
                    validPositions++;
                }
            });
            
            if (validPositions > 0) {
                centerX /= validPositions;
                centerY /= validPositions;
                
                // Show single score popup at center of match group
                this.showScorePopup(finalScore, [{ x: centerX, y: centerY }]);
            }
        });
        
        // Add total score to player's score
        this.score += totalScore;
        this.updateScoreDisplay();
        
        // Only increase multiplier for non-cascade matches (AFTER scoring is done)
        if (!isCascade) {
            this.increaseMultiplier();
            this.lastMatchTime = Date.now();
        }
        
        // Score bonus boxes created in this match
        bonusBoxes.forEach(bonusBox => {
            let bonusScore = 0;
            if (bonusBox.type === 'white') {
                bonusScore = 400;
            } else if (bonusBox.type === 'L-bonus') {
                bonusScore = 250;
            }
            
            if (bonusScore > 0) {
                const finalBonusScore = bonusScore * multiplierToUse;
                this.score += finalBonusScore;
                console.log(`SCORE: +${finalBonusScore} (${bonusBox.type} bonus box created: ${bonusScore} × ${multiplierToUse}x ${isCascade ? 'saved' : 'current'} multiplier)`);
                this.updateScoreDisplay();
                
                // Show score popup for bonus box creation
                const bonusElement = document.querySelector(`[data-row="${bonusBox.row}"][data-col="${bonusBox.col}"]`);
                if (bonusElement) {
                    const rect = bonusElement.getBoundingClientRect();
                    const position = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    };
                    this.showScorePopup(finalBonusScore, [position]);
                }
            }
        });
        
        // Combine bonus boxes from current matches and previous ones
        const allBonusBoxes = [...bonusBoxesFromPrevious, ...bonusBoxes];
        
        this.animateClearMatches(matches, allBonusBoxes, () => {
            this.handleBlockFallingAfterMatch(matches, allBonusBoxes);
        });
    }

    animateClearMatches(matches, bonusBoxes, callback) {
        const elements = [];
        const bonusBoxElements = [];
        
        // First, handle bonus boxes - convert them to white or L-bonus jewels
        bonusBoxes.forEach(bonusBox => {

            // console.log("bonusBox1");

            const element = document.querySelector(`[data-row="${bonusBox.row}"][data-col="${bonusBox.col}"]`);
            if (element) {
                // console.log("bonusBox2");
                //console.log(`Converting to ${bonusBox.type} bonus box: [${bonusBox.row},${bonusBox.col}]`);
                bonusBoxElements.push(element);
                
                // Convert to appropriate image and flag as new bonus box
                if (bonusBox.type === 'white') {
                    // Remove any existing background color
                    element.style.backgroundColor = '';
                    element.dataset.color = 'w';
                    
                    // Update the jewel image
                    const existingImage = element.querySelector('img');
                    if (existingImage) {
                        existingImage.src = 'src/images/jewel_w.png';
                        // Add glowing tween to new bonus box
                        gsap.to(existingImage, {
                            filter: "brightness(2.5)",
                            duration: 1.5,
                            ease: "power2.inOut",
                            yoyo: true,
                            repeat: -1
                        });
                    }
                } else if (bonusBox.type === 'L-bonus') {
                    // console.log("bonusBox3");
                    // Remove any existing background color
                    element.style.backgroundColor = '';
                    element.dataset.color = 'l';
                    
                    // Update the jewel image
                    const existingImage = element.querySelector('img');
                    if (existingImage) {
                        existingImage.src = 'src/images/jewel_l.png';
                        // Add glowing tween to new bonus box
                        gsap.to(existingImage, {
                            filter: "brightness(2.5)",
                            duration: 1.5,
                            ease: "power2.inOut",
                            yoyo: true,
                            repeat: -1
                        });
                    }
                }
                
                element.dataset.bonusBox = 'true';
                element.dataset.newBonusBox = 'true'; // Flag to prevent clearing
                
                // Don't add to elements to be cleared
            } else {
                //console.error(`ERROR: Could not find element for bonus box at [${bonusBox.row},${bonusBox.col}]`);
            }
        });
        
        // Handle regular matches
        matches.forEach(match => {
            const element = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
                        if (element) {
                const color = element.dataset.color;
                const row = element.dataset.row;
                const col = element.dataset.col;
                
                // Skip if this is a new bonus box
                if (element.dataset.newBonusBox === 'true') {
                    //console.log(`Skipping new bonus box at [${row},${col}] - preventing clearing`);
                    return;
                }
                
                // Check if this element is a bonus box
                if (element.dataset.bonusBox === 'true') {
                    //console.error(`ERROR: Bonus box at [${row},${col}] is being cleared! This should not happen.`);
                }
                
                //console.log(`CLEARING BLOCK: [${row},${col}] = ${color} - Reason: Part of match #${matches.indexOf(match) + 1} of ${matches.length} total matches`);
                elements.push(element);
            } else {
                //console.error(`ERROR: Could not find element to clear at [${match.row},${match.col}]`);
            }
        });
        
        // Mark elements as cleared and void immediately
        elements.forEach(element => {
            element.dataset.cleared = 'true';
            element.dataset.void = 'true'; // Mark as void so it's not counted in sync
        });
        
        // Create subtle glow effects for matches (call here when jewels are marked as cleared)
        this.createMatchGlowEffects();
        
        // Update the grid (only for cleared elements, not bonus boxes)
        elements.forEach(element => {
            const row = parseInt(element.dataset.row);
            const col = parseInt(element.dataset.col);
            if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                this.grid[row][col] = -1;
            }
        });
        
        // Update grid for bonus boxes
        bonusBoxElements.forEach(element => {
            const row = parseInt(element.dataset.row);
            const col = parseInt(element.dataset.col);
            if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                if (element.dataset.color === 'w') {
                    this.grid[row][col] = 5; // White jewel index
                } else if (element.dataset.color === 'l') {
                    this.grid[row][col] = 6; // L-bonus jewel index
                }
            }
        });
        
        // Create a timeline for the spin and shrink animation (only for cleared elements)
        const tl = gsap.timeline({
            onComplete: () => {
                //console.log("Match spin and shrink animation complete, proceeding to regular block falling...");
                this.handleBlockFallingAfterMatch(matches, bonusBoxes);
            }
        });
        
        // Spin and shrink animation - 0.25 seconds total (only for cleared elements)
        if (elements.length > 0) {
        tl.to(elements, {
            rotation: 360,
            scale: 0,
            duration: 0.25,
            ease: this.jewelEasing,
            transformOrigin: "center center"
        }, 0); // Start immediately
        }
        
        //console.log(`Started spin and shrink animation for ${elements.length} matched blocks`);
        //console.log(`Created ${bonusBoxElements.length} bonus boxes`);
    }
    
    handleBonusBoxFalling(bonusBoxElements, callback) {
        if (bonusBoxElements.length === 0) {
            //console.log("No bonus boxes to fall, proceeding to regular block falling...");
            callback();
            return;
        }
        
        //console.log("=== BONUS BOX FALLING PHASE ===");
        
        const animations = [];
        const gridUpdates = [];
        
        bonusBoxElements.forEach((bonusBoxElement, index) => {
            // Safety check - ensure the element still exists
            if (!bonusBoxElement || !bonusBoxElement.parentNode) {
                //console.warn(`Bonus box element ${index} no longer exists, skipping...`);
                return;
            }
            
            const currentRow = parseInt(bonusBoxElement.dataset.row);
            const currentCol = parseInt(bonusBoxElement.dataset.col);
            
            //console.log(`Processing bonus box ${index + 1}/${bonusBoxElements.length} at [${currentRow},${currentCol}]`);
            
            // Calculate how many empty spaces are below this bonus box
            let spacesToFall = 0;
            for (let checkRow = currentRow + 1; checkRow < this.GRID_SIZE; checkRow++) {
                const blockAtCheckRow = document.querySelector(`[data-row="${checkRow}"][data-col="${currentCol}"]`);
                if (!blockAtCheckRow || blockAtCheckRow.dataset.cleared === 'true' || blockAtCheckRow.dataset.void === 'true') {
                    spacesToFall++;
                } else {
                    //console.log(`Bonus box at [${currentRow},${currentCol}] found obstacle at [${checkRow},${currentCol}]: color=${blockAtCheckRow.dataset.color}, cleared=${blockAtCheckRow.dataset.cleared}, void=${blockAtCheckRow.dataset.void}, bonusBox=${blockAtCheckRow.dataset.bonusBox}`);
                }
            }
            
            //console.log(`Bonus box at [${currentRow},${currentCol}] calculated ${spacesToFall} spaces to fall`);
            
            if (spacesToFall > 0) {
                //console.log(`Bonus box at [${currentRow},${currentCol}] needs to fall ${spacesToFall} spaces`);
                
                // Calculate the target position
                const targetRow = currentRow + spacesToFall;
                const currentTop = parseInt(bonusBoxElement.style.top) || 0;
                const moveDistance = spacesToFall * (this.jewelSize + this.jewelGap);
                const targetTop = currentTop + moveDistance;
                
                //console.log(`Bonus box at [${currentRow},${currentCol}] moving from top=${currentTop} to top=${targetTop} (distance=${moveDistance})`);
                
                // Store the grid update for later
                gridUpdates.push({
                    element: bonusBoxElement,
                    oldRow: currentRow,
                    newRow: targetRow,
                    col: currentCol
                });
                
                // Animate the bonus box falling
                const animation = gsap.to(bonusBoxElement, {
                    top: targetTop,
                    duration: 0.3,
                    ease: this.jewelEasing
                });
                
                animations.push(animation);
            } else {
                //console.log(`Bonus box at [${currentRow},${currentCol}] doesn't need to fall`);
            }
        });
        
        // Wait for all bonus box animations to complete
        if (animations.length > 0) {
            Promise.all(animations.map(anim => new Promise(resolve => {
                anim.eventCallback("onComplete", resolve);
            }))).then(() => {
                // Update the data attributes and grid after animations complete
                gridUpdates.forEach(update => {
                    update.element.dataset.row = update.newRow;
                    
                    // Update the grid - preserve the original bonus box type
                    if (update.newRow >= 0 && update.newRow < this.GRID_SIZE && update.col >= 0 && update.col < this.GRID_SIZE) {
                        // Determine the correct grid value based on the bonus box color
                        let gridValue;
                        if (update.element.dataset.color === 'l') {
                            gridValue = 6; // L-bonus jewel index
                        } else {
                            gridValue = 5; // White jewel index
                        }
                        this.grid[update.newRow][update.col] = gridValue;
                        
                        // Clear the old position in the grid
                        if (update.oldRow >= 0 && update.oldRow < this.GRID_SIZE) {
                            this.grid[update.oldRow][update.col] = -1;
                        }
                    }
                });
                
                //console.log("Bonus box falling complete, proceeding to regular block falling...");
                callback();
            });
        } else {
            //console.log("No bonus boxes needed to fall, proceeding to regular block falling...");
            callback();
        }
    }
    
    handleBlockFallingAfterMatch(matches, bonusBoxes) {
        

        
        const clearedPerColumn = new Array(this.GRID_SIZE).fill(0);
        
        // Count cleared blocks per column from matches
        matches.forEach(match => {
            clearedPerColumn[match.col]++;
        });
        
        // Bonus boxes replace cleared blocks, so we don't subtract from clearedPerColumn
        // This ensures new blocks are still created to fill the spaces
        // (Bonus boxes will be positioned at the top during the falling animation)
        
        // Also count jewels that were cleared by clearAllJewelsOfColor (white bonus box)
        if (matches.length === 0 && bonusBoxes.length === 0) {
            // This might be a white bonus box clear, count all cleared jewels
            for (let col = 0; col < this.GRID_SIZE; col++) {
                for (let row = 0; row < this.GRID_SIZE; row++) {
                    const jewel = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (jewel && jewel.dataset.cleared === 'true') {
                        clearedPerColumn[col]++;
                    }
                }
            }
        }
        
        // Create a snapshot of the current grid state to ensure consistent calculations
        const gridSnapshot = this.createGridSnapshot();
        
        const blocksToFall = [];
        
        for (let col = 0; col < this.GRID_SIZE; col++) {
            if (clearedPerColumn[col] > 0) {
                for (let row = 0; row < this.GRID_SIZE; row++) {
                    const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (blockElement && !blockElement.dataset.isNew && blockElement.dataset.cleared !== 'true' && blockElement.dataset.void !== 'true') {
                        // Allow both regular blocks AND existing bonus boxes to fall
                        const spacesToFall = this.calculateSpacesToFallFromSnapshot(row, col, gridSnapshot);
                        if (spacesToFall > 0) {
                            blocksToFall.push({
                                element: blockElement,
                                currentRow: row,
                                targetRow: row + spacesToFall,
                                col: col,
                                spacesToFall: spacesToFall
                            });
                        }
                    }
                }
            }
        }
        

        const newBlocks = [];
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let i = 0; i < clearedPerColumn[col]; i++) {
                const newJewelType = Math.floor(Math.random() * this.JEWEL_TYPES);
                const newBlock = this.createNewBlock(col, newJewelType, i);
                newBlocks.push(newBlock);
            }
        }
        
        const allBlocksToMove = [...blocksToFall, ...newBlocks];
        

        
        this.countBlockBelow();


        // Start block falling animation immediately
        this.setAnimatingTrue();
        this.animateAllBlocksToFinalPositions(allBlocksToMove);
    }
    
    createGridSnapshot() {
        // Create a snapshot of the current grid state to ensure consistent calculations
        const snapshot = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            snapshot[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (blockElement && blockElement.dataset.cleared !== 'true' && blockElement.dataset.void !== 'true') {
                    snapshot[row][col] = true; // Block exists and is solid
                } else {
                    snapshot[row][col] = false; // No block or block is cleared/void
                }
            }
        }
        return snapshot;
    }
    
    calculateSpacesToFallFromSnapshot(row, col, gridSnapshot) {
        // Calculate spaces to fall using a consistent grid snapshot
        let spacesToFall = 0;
        for (let checkRow = row + 1; checkRow < this.GRID_SIZE; checkRow++) {
            if (!gridSnapshot[checkRow] || !gridSnapshot[checkRow][col]) {
                // Space is empty (no block or block is cleared/void)
                spacesToFall++;
            }
            // If gridSnapshot[checkRow][col] is true, there's a solid block - stop falling
        }
        return spacesToFall;
    }
    
    calculateSpacesToFall(row, col, clearedInColumn) {
        let spacesToFall = 0;
        for (let checkRow = row + 1; checkRow < this.GRID_SIZE; checkRow++) {
            const blockAtCheckRow = document.querySelector(`[data-row="${checkRow}"][data-col="${col}"]`);
            // A space is empty if: no block exists, block is cleared, block is void, OR block is a bonus box that was cleared
            if (!blockAtCheckRow || blockAtCheckRow.dataset.cleared === 'true' || blockAtCheckRow.dataset.void === 'true') {
                spacesToFall++;
            }
            // Note: Bonus boxes (both white 'w' and L-bonus 'l') that are NOT cleared are treated as filled spaces
            // and will prevent blocks from falling through them
        }
        return spacesToFall;
    }
    
    createNewBlock(col, jewelType, stackIndex) {

        // console.log("createNewBlock");

        const gridElement = document.getElementById('jewelGrid');
        
        const jewelElement = document.createElement('div');
        jewelElement.className = 'jewel new-jewel';
        jewelElement.dataset.col = col;
        jewelElement.dataset.row = -1; // Temporary row for new blocks
        jewelElement.dataset.color = this.jewelLetters[jewelType];
        jewelElement.dataset.isNew = 'true';
        jewelElement.dataset.stackIndex = stackIndex;
        jewelElement.style.position = 'absolute';
        jewelElement.style.zIndex = '200';
        jewelElement.style.opacity = '1';
        
        // Create and add the jewel image
        const jewelImage = document.createElement('img');
        jewelImage.src = `src/images/jewel_${this.jewelLetters[jewelType]}.png`;
        jewelImage.style.width = '100%';
        jewelImage.style.height = '100%';
        jewelImage.style.objectFit = 'contain';
        jewelImage.style.pointerEvents = 'none';
        jewelImage.style.display = 'block';
        jewelElement.appendChild(jewelImage);
        
        // Add glowing tween if this is a bonus box
        if (jewelType === 5 || jewelType === 6) {
            jewelElement.dataset.bonusBox = 'true';
            gsap.to(jewelImage, {
                filter: "brightness(2.5)",
                duration: 1.5,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
        }
        
        // Calculate the left position based on column
        const leftPosition = this.gridPadding + col * (this.jewelSize + this.jewelGap);
        
        // Calculate the top position - start from above the grid (negative Y) and stack up
        // First block starts at 0 minus one block height, second at 0 minus two block heights, etc.
        const blockHeight = this.jewelSize + this.jewelGap;
        const topPosition = this.gridPadding - (blockHeight * (stackIndex + 1));
        
        jewelElement.style.left = `${leftPosition}px`;
        jewelElement.style.top = `${topPosition}px`;
        jewelElement.style.width = `${this.jewelSize}px`;
        jewelElement.style.height = `${this.jewelSize}px`;
        
        gridElement.appendChild(jewelElement);
        
        // Add debug text box at lower left corner
        const debugText = document.createElement('div');
        debugText.className = 'debug-number';
        debugText.dataset.debugType = 'block-count';
        debugText.style.position = 'absolute';
        debugText.style.bottom = '2px';
        debugText.style.left = '2px';
        debugText.style.fontSize = '10px';
        debugText.style.color = 'yellow';
        debugText.style.fontFamily = 'Arial, sans-serif';
        debugText.style.fontWeight = 'bold';
        debugText.style.pointerEvents = 'none';
        debugText.style.zIndex = '1000';
        debugText.textContent = 'X';
        // jewelElement.appendChild(debugText);
        
        // Calculate where this new block should end up
        // Find the first empty space from the bottom up
        let targetRow = this.GRID_SIZE - 1;
        for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
            const blockAtRow = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (!blockAtRow || blockAtRow.dataset.cleared === 'true' || blockAtRow.dataset.void === 'true') {
                // Found an empty space, this is where the new block should go
                targetRow = row;
                break;
            }
        }
        
        return {
            element: jewelElement,
            col: col,
            targetRow: targetRow,
            isNew: true,
            stackIndex: stackIndex
        };
    }
    
    // ensureDebugNumbersExist() {
    //     // Make sure all jewels have debug numbers
    //     const allJewels = document.querySelectorAll('.jewel');
    //     allJewels.forEach(jewel => {
    //         if (!jewel.querySelector('.debug-number[data-debug-type="block-count"]')) {
    //             // Create debug number if it doesn't exist
    //             const debugText = document.createElement('div');
    //             debugText.className = 'debug-number';
    //             debugText.dataset.debugType = 'block-count';
    //             debugText.style.position = 'absolute';
    //             debugText.style.bottom = '2px';
    //             debugText.style.left = '2px';
    //             debugText.style.fontSize = '10px';
    //             debugText.style.color = 'green';
    //             debugText.style.fontFamily = 'Arial, sans-serif';
    //             debugText.style.fontWeight = 'bold';
    //             debugText.style.pointerEvents = 'none';
    //             debugText.style.zIndex = '1000';
    //             debugText.textContent = '0';
    //             jewel.appendChild(debugText);
    //             console.log(`ensureDebugNumbersExist: Created missing debug number for jewel at [${jewel.dataset.row},${jewel.dataset.col}]`);
    //         }
    //     });
    // }
    
    countBlockBelow() {
        // This method should be called AFTER all blocks have been positioned
        // It works with the actual DOM positions of all blocks
        
        // First, ensure all jewels have debug numbers
        // this.ensureDebugNumbersExist();
        
        const allJewels = document.querySelectorAll('.jewel');
        // console.log(`countBlockBelow: Found ${allJewels.length} jewels to process`);
        
        for (let i = 0; i < allJewels.length; i++) {
            const jewel = allJewels[i];
            
            // Skip eliminated or cleared blocks
            if (jewel.dataset.cleared === 'true' || jewel.dataset.void === 'true') {
                // console.log(`countBlockBelow: Skipping cleared/void jewel ${i}`);
                continue;
            }
            
            const currentRow = parseInt(jewel.dataset.row);
            const currentCol = parseInt(jewel.dataset.col);
            
            // Skip blocks that don't have valid row/col data
            if (isNaN(currentRow) || isNaN(currentCol)) {
                console.log(`countBlockBelow: Skipping jewel ${i} with invalid row/col: ${currentRow}, ${currentCol}`);
                continue;
            }
            
            let blocksBelowCount = 0;
            
            // Count blocks in the same column that are below this block based on Y position
            const currentTop = parseInt(jewel.style.top) || 0;
            
            // Find all blocks in the same column
            const allBlocksInColumn = document.querySelectorAll(`[data-col="${currentCol}"]`);
            allBlocksInColumn.forEach(block => {
                // Skip eliminated or cleared blocks
                if (block.dataset.cleared === 'true' || block.dataset.void === 'true') {
                    return;
                }
                
                // Get the Y position of this block
                const blockTop = parseInt(block.style.top) || 0;
                
                // If this block is below the current block (higher Y value = lower on screen)
                if (blockTop > currentTop) {
                    blocksBelowCount++;
                }
            });
            
            // Find the debug text box and update its content
            // const debugText = jewel.querySelector('.debug-number[data-debug-type="block-count"]');
            // if (debugText) {
            //     debugText.textContent = blocksBelowCount.toString();
            //     console.log(`countBlockBelow: Updated jewel [${currentRow},${currentCol}] debug number to ${blocksBelowCount}`);
                jewel.dataset.toRow = blocksBelowCount;
            // } else {
            //     // Fallback: look for any div that might be the debug text
            //     const allDivs = jewel.querySelectorAll('div');
            //     for (let j = 0; j < allDivs.length; j++) {
            //         const div = allDivs[j];
            //         const style = div.style;
            //         if (style.position === 'absolute' && style.bottom === '2px' && style.left === '2px') {
            //             div.textContent = blocksBelowCount.toString();

            //             break;
            //         }
            //     }
            // }

           
        }
    }
    
    animateAllBlocksToFinalPositions(allBlocks) {
        const animations = [];
        
        // Group all blocks by their column for processing
        const blocksByColumn = {};
        allBlocks.forEach(block => {
            if (!blocksByColumn[block.col]) {
                blocksByColumn[block.col] = [];
            }
            blocksByColumn[block.col].push(block);
        });
        
        // Process each column separately
        Object.keys(blocksByColumn).forEach(col => {
            const blocksInColumn = blocksByColumn[col];
            
            // Animate each block in this column
            blocksInColumn.forEach((block, index) => {
                // 1. Get the current position of the jewel
                const currentTop = parseInt(block.element.style.top) || 0;

                // 2. Use the toRow value to get target position from initialRowPositions
                const toRow = parseInt(block.element.dataset.toRow) || 0;
                const targetTop = this.initialRowPositions[toRow] || currentTop;
                
                // Kill any existing animations on this block
                gsap.killTweensOf(block.element);
            
                // Animate the block to its target position
            const animation = gsap.to(block.element, {
                top: targetTop,
                duration: 0.1, // 8x faster (0.8 / 8 = 0.1)
                ease: this.jewelEasing
            });
                
                animations.push(animation);
            });
        });
        
        // Wait for all animations to complete
        Promise.all(animations.map(anim => new Promise(resolve => {
            anim.eventCallback("onComplete", resolve);
        }))).then(() => {
            // 1. Clear out any arrays that might have stuff from the previous round
            allBlocks.length = 0;
            
            // 2. Make sure all data structures and grid info is updated
            const allJewels = document.querySelectorAll('.jewel');
            allJewels.forEach(jewel => {
                // Remove void/cleared jewels from DOM completely
                if (jewel.dataset.void === 'true' || jewel.dataset.cleared === 'true') {

                    jewel.remove();
                    return;
                }
                
                // Remove any temporary attributes from previous rounds
                delete jewel.dataset.cleared;
                delete jewel.dataset.isNew;  // CRITICAL: Remove new block flag after animation
                delete jewel.dataset.stackIndex;
                
                // Clear any innerHTML content (like "NEW" text) that might be left over
                if (jewel.innerHTML && jewel.innerHTML.trim()) {
                    // jewel.innerHTML = '';
                }
                
                // Update ALL blocks to get their proper coordinates from their current Y position
                const currentTop = parseInt(jewel.style.top) || 0;
                const currentLeft = parseInt(jewel.style.left) || 0;
                const calculatedRow = Math.round((currentTop - this.gridPadding) / (this.jewelSize + this.jewelGap));
                const calculatedCol = Math.round((currentLeft - this.gridPadding) / (this.jewelSize + this.jewelGap));
                
                // Update the data attributes to match their actual visual position
                jewel.dataset.row = calculatedRow;
                jewel.dataset.col = calculatedCol;
                
                // Debug numbers removed - will be shown with G key
            });
            
            // CRITICAL: Update the internal grid to match the current DOM state
            this.syncInternalGridFromDOM();
            
            // Create visual overlay to show what's in this.grid vs DOM
            // this.createGridOverlay(); // Debug grid disabled
            
            // COMPLETE CLEANUP AND VERIFICATION
            // Count all jewels to verify we have exactly 64
            const finalJewels = document.querySelectorAll('.jewel');
            
            if (finalJewels.length !== 64) {
                // Grid validation failed - this should not happen in normal operation
            }
            
            // Verify each jewel has proper data attributes
            finalJewels.forEach((jewel, index) => {
                const row = parseInt(jewel.dataset.row);
                const col = parseInt(jewel.dataset.col);
                const color = jewel.dataset.color;
                
                if (row < 0 || row >= 8 || col < 0 || col >= 8) {
                    // Invalid position - this should not happen
                }
                if (!color) {
                    // Missing color - this should not happen
                }
            });
            
            // CRITICAL: Check for cascade matches after blocks have fallen
            this.checkForCascadeMatches();
            
            // Reset animation flag to allow new moves
            
        });
    }
    
    updateGridFromBlockPositions(allBlocks) {
        const allJewels = document.querySelectorAll('.jewel');
        const positionMap = new Map();
        
        allJewels.forEach(jewelElement => {
            const style = window.getComputedStyle(jewelElement);
            const isVisible = style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden';
            
            if (!isVisible) {
                jewelElement.remove();
                return;
            }
        });
        
        const visibleJewels = document.querySelectorAll('.jewel');
        
        visibleJewels.forEach(jewelElement => {
            const currentTop = parseInt(jewelElement.style.top) || 0;
            const currentLeft = parseInt(jewelElement.style.left) || 0;
            
            const calculatedRow = Math.round((currentTop - this.gridPadding) / (this.jewelSize + this.jewelGap));
            const calculatedCol = Math.round((currentLeft - this.gridPadding) / (this.jewelSize + this.jewelGap));
            
            if (calculatedRow >= 0 && calculatedRow < this.GRID_SIZE && 
                calculatedCol >= 0 && calculatedCol < this.GRID_SIZE) {
                
                const positionKey = `${calculatedRow},${calculatedCol}`;
                if (positionMap.has(positionKey)) {
                    jewelElement.remove();
                    return;
                }
                
                positionMap.set(positionKey, jewelElement);
                
                const oldRow = jewelElement.dataset.row;
                const oldCol = jewelElement.dataset.col;
                
                jewelElement.dataset.row = calculatedRow;
                jewelElement.dataset.col = calculatedCol;
                
                delete jewelElement.dataset.isNew;
                delete jewelElement.dataset.stackIndex;
                
                // Debug numbers removed - will be shown with G key
            }
        });
        
        const finalJewels = document.querySelectorAll('.jewel');
        finalJewels.forEach(jewelElement => {
            const row = parseInt(jewelElement.dataset.row);
            const col = parseInt(jewelElement.dataset.col);
            
            if (row < 0 || row >= this.GRID_SIZE || col < 0 || col >= this.GRID_SIZE) {
                jewelElement.remove();
            }
        });
        
        this.syncInternalGridFromDOM();
        
        // Update debug numbers after blocks have moved to their final positions
        this.countBlockBelow();
    }
    
    syncInternalGridFromDOM() {
        // Clear the grid completely
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = -1;
            }
        }
        
        // Cycle through ALL blocks in the DOM (excluding void/eliminated ones)
        const allJewels = document.querySelectorAll('.jewel');
        
        let validJewels = 0;
        allJewels.forEach((jewelElement, index) => {
            // Skip void/eliminated jewels
            if (jewelElement.dataset.void === 'true' || jewelElement.dataset.cleared === 'true') {
                return;
            }
            
            const row = parseInt(jewelElement.dataset.row);
            const col = parseInt(jewelElement.dataset.col);
            const colorLetter = jewelElement.dataset.color;
            
    
            validJewels++;
            
            if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                const jewelTypeIndex = this.jewelLetters.indexOf(colorLetter);
                
                if (jewelTypeIndex !== -1) {
                    this.grid[row][col] = jewelTypeIndex;
                    // //console.log(`Set grid[${row}][${col}] = ${jewelTypeIndex} (${colorLetter})`);
                } else {
                    // //console.error(`Invalid color letter: ${colorLetter}`);
                }
            } else {
                // //console.error(`Invalid position: [${row},${col}]`);
            }
        });
        

        

    }

    checkForCascadeMatches() {
        const bonusBoxesBeforeMatches = document.querySelectorAll('.jewel[data-bonus-box="true"]');
        
        const { matches, bonusBoxes } = this.findMatches(false); // No bonus boxes in cascade matches
        
        if (matches.length > 0) {
            this.processMatches(bonusBoxes, true); // true = isCascade
        } else {
            // Run repair function at the end of turn
            this.repairGrid();
            // Since repairGrid is commented out, set isAnimating = false here
            this.setAnimatingFalse();
        }
    }
    
    repairGrid() {
        // Grid repair is no longer needed - just finish immediately
        this.finishRepair();
    }
    

    
    finishRepair() {
        // Clear the newBonusBox flag from all bonus boxes
        const allBonusBoxes = document.querySelectorAll('.jewel[data-bonus-box="true"]');
        allBonusBoxes.forEach(bonusBox => {
            delete bonusBox.dataset.newBonusBox;
        });
        
        this.setAnimatingFalse();
    }

    showScorePopup(points, jewelPositions = []) {
        // Create individual popups for each jewel position
        jewelPositions.forEach(position => {
            const popup = document.createElement('div');
            popup.className = 'score-popup';
            popup.textContent = `+${points}`;
            
            // Determine color class based on points
            if (points >= 100 && points < 200) {
                popup.classList.add('score-green');
            } else if (points >= 200 && points < 500) {
                popup.classList.add('score-blue');
            } else if (points >= 500 && points < 1000) {
                popup.classList.add('score-orange');
            } else if (points >= 1000) {
                popup.classList.add('score-red');
            }
            
            // Position at the jewel location with perfect centering
            popup.style.left = position.x + 'px';
            popup.style.top = position.y + 'px';
            popup.style.transform = 'translate(-50%, -50%)';
            
            document.body.appendChild(popup);
            
            // Animate: fade out in 2 seconds, move up 10px
            gsap.to(popup, {
                opacity: 0,
                y: -10,
                duration: 2,
                ease: "power2.out",
                onComplete: () => {
                    popup.remove();
                }
            });
        });
    }
    
    createExplosionEffect(centerRow, centerCol, jewelsToClear) {
        // Get the actual jewel element to get its exact position
        const jewelElement = document.querySelector(`[data-row="${centerRow}"][data-col="${centerCol}"]`);
        let centerX, centerY;
        
        if (jewelElement) {
            const rect = jewelElement.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        } else {
            // Fallback to calculated position if jewel element not found
            centerX = (this.gridPadding + centerCol * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
            centerY = (this.gridPadding + centerRow * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
        }
        
        // Create explosion container
        const explosionContainer = document.createElement('div');
        explosionContainer.className = 'explosion-container';
        explosionContainer.style.position = 'fixed';
        explosionContainer.style.left = `${centerX}px`;
        explosionContainer.style.top = `${centerY}px`;
        explosionContainer.style.transform = 'translate(-50%, -50%)';
        explosionContainer.style.zIndex = '9999';
        explosionContainer.style.pointerEvents = 'none';
        
        document.body.appendChild(explosionContainer);
        
        // Create multiple explosion rings
        for (let ring = 0; ring < 3; ring++) {
            const ringElement = document.createElement('div');
            ringElement.className = 'explosion-ring';
            ringElement.style.position = 'absolute';
            ringElement.style.width = '0px';
            ringElement.style.height = '0px';
            ringElement.style.border = `2px solid #FFD700`;
            ringElement.style.borderRadius = '50%';
            ringElement.style.left = '50%';
            ringElement.style.top = '50%';
            ringElement.style.transform = 'translate(-50%, -50%)';
            ringElement.style.opacity = '0.8';
            
            explosionContainer.appendChild(ringElement);
            
            // Animate each ring expanding
            gsap.to(ringElement, {
                width: `${(ring + 1) * 80}px`,
                height: `${(ring + 1) * 80}px`,
                opacity: 0,
                duration: 0.6,
                delay: ring * 0.1,
                ease: "power2.out"
            });
        }
        
        // Create particle burst
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.backgroundColor = '#FFD700';
            particle.style.borderRadius = '50%';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            
            explosionContainer.appendChild(particle);
            
            // Random direction and distance for each particle
            const angle = (i / 20) * Math.PI * 2;
            const distance = 60 + Math.random() * 40;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            // Animate particle flying out
            gsap.to(particle, {
                x: endX,
                y: endY,
                opacity: 0,
                scale: 0,
                duration: 0.8,
                delay: Math.random() * 0.2,
                ease: "power2.out"
            });
        }
        
        // Create shockwave effect
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        shockwave.style.position = 'absolute';
        shockwave.style.width = '0px';
        shockwave.style.height = '0px';
        shockwave.style.border = `3px solid rgba(255, 215, 0, 0.6)`;
        shockwave.style.borderRadius = '50%';
        shockwave.style.left = '50%';
        shockwave.style.top = '50%';
        shockwave.style.transform = 'translate(-50%, -50%)';
        
        explosionContainer.appendChild(shockwave);
        
        // Animate shockwave
        gsap.to(shockwave, {
            width: '200px',
            height: '200px',
            opacity: 0,
            duration: 0.5,
            ease: "power2.out"
        });
        
        // Create flash effect
        const flash = document.createElement('div');
        flash.className = 'explosion-flash';
        flash.style.position = 'absolute';
        flash.style.width = '100px';
        flash.style.height = '100px';
        flash.style.backgroundColor = '#FFD700';
        flash.style.borderRadius = '50%';
        flash.style.left = '50%';
        flash.style.top = '50%';
        flash.style.transform = 'translate(-50%, -50%)';
        flash.style.filter = 'blur(10px)';
        
        explosionContainer.appendChild(flash);
        
        // Animate flash
        gsap.to(flash, {
            scale: 2,
            opacity: 0,
            duration: 0.4,
            ease: "power2.out"
        });
        
        // Remove explosion container after animation
        gsap.delayedCall(1.0, () => {
            explosionContainer.remove();
        });
    }
    
    createWhiteBonusExplosion(centerRow, centerCol, jewelColor) {
        console.log(`createWhiteBonusExplosion called with: centerRow=${centerRow}, centerCol=${centerCol}, jewelColor=${jewelColor}`);
        console.log(`jewelColor type: ${typeof jewelColor}, value: "${jewelColor}"`);
        
        // Get the actual jewel element to get its exact position
        const jewelElement = document.querySelector(`[data-row="${centerRow}"][data-col="${centerCol}"]`);
        let centerX, centerY;
        
        if (jewelElement) {
            const rect = jewelElement.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        } else {
            // Fallback to calculated position if jewel element not found
            centerX = (this.gridPadding + centerCol * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
            centerY = (this.gridPadding + centerRow * (this.jewelSize + this.jewelGap)) + (this.jewelSize / 2);
        }
        
        // Color mapping for different jewel types (using actual jewel letters) - More saturated colors
        const colorMap = {
            'r': '#FF0000', // Bright Red
            'g': '#00FF00', // Bright Green
            'b': '#0080FF', // Bright Blue
            'o': '#FF8000', // Bright Orange
            'p': '#FF00FF'  // Bright Magenta
        };
        
        const explosionColor = colorMap[jewelColor] || '#FFFFFF';
        console.log(`White bonus explosion color: ${explosionColor} for jewel color: ${jewelColor}`);
        console.log(`Color map lookup: jewelColor=${jewelColor}, mapped to ${explosionColor}`);
        console.log(`Available colorMap keys: ${Object.keys(colorMap)}`);
        
        // Create explosion container
        const explosionContainer = document.createElement('div');
        explosionContainer.className = 'white-bonus-explosion';
        explosionContainer.style.position = 'fixed';
        explosionContainer.style.left = `${centerX}px`;
        explosionContainer.style.top = `${centerY}px`;
        explosionContainer.style.transform = 'translate(-50%, -50%)';
        explosionContainer.style.zIndex = '9999';
        explosionContainer.style.pointerEvents = 'none';
        
        document.body.appendChild(explosionContainer);
        
        // Hexagon layers removed for cleaner effect
        
        // Create floating orbs (different from grey box particles) - BIGGER AND MORE
        for (let i = 0; i < 25; i++) {
            const orb = document.createElement('div');
            orb.className = 'floating-orb';
            orb.style.position = 'absolute';
            orb.style.width = '16px';
            orb.style.height = '16px';
            orb.style.backgroundColor = explosionColor;
            orb.style.borderRadius = '50%';
            orb.style.left = '50%';
            orb.style.top = '50%';
            orb.style.transform = 'translate(-50%, -50%)';
            orb.style.boxShadow = `0 0 20px ${explosionColor}`;
            
            explosionContainer.appendChild(orb);
            
            // Random direction and MASSIVE distance for each orb
            const angle = (i / 25) * Math.PI * 2;
            const distance = 120 + Math.random() * 100;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            // Animate orb floating out (bigger and more dramatic)
            gsap.to(orb, {
                x: endX,
                y: endY,
                opacity: 0,
                scale: 0,
                duration: 1.2,
                delay: Math.random() * 0.3,
                ease: "power2.out"
            });
        }
        
        // Create energy waves (different from grey box shockwave) - BIGGER AND MORE
        for (let wave = 0; wave < 4; wave++) {
            const energyWave = document.createElement('div');
            energyWave.className = 'energy-wave';
            energyWave.style.position = 'absolute';
            energyWave.style.width = '0px';
            energyWave.style.height = '0px';
            energyWave.style.border = `6px solid ${explosionColor}`;
            energyWave.style.borderRadius = '50%';
            energyWave.style.left = '50%';
            energyWave.style.top = '50%';
            energyWave.style.transform = 'translate(-50%, -50%)';
            energyWave.style.filter = 'blur(3px)';
            
            explosionContainer.appendChild(energyWave);
            
            // Animate energy waves (MUCH bigger and more dramatic)
            gsap.to(energyWave, {
                width: `${400 + wave * 80}px`,
                height: `${400 + wave * 80}px`,
                opacity: 0,
                duration: 1.5,
                delay: wave * 0.2,
                ease: "power2.out"
            });
        }
        
        // Create central burst (different from grey box flash) - BIGGER AND MORE
        const centralBurst = document.createElement('div');
        centralBurst.className = 'central-burst';
        centralBurst.style.position = 'absolute';
        centralBurst.style.width = '250px';
        centralBurst.style.height = '250px';
        centralBurst.style.background = `radial-gradient(circle, ${explosionColor} 0%, transparent 60%)`;
        centralBurst.style.borderRadius = '50%';
        centralBurst.style.left = '50%';
        centralBurst.style.top = '50%';
        centralBurst.style.transform = 'translate(-50%, -50%)';
        
        explosionContainer.appendChild(centralBurst);
        
        // Animate central burst (MUCH bigger and more dramatic)
        gsap.to(centralBurst, {
            scale: 4,
            opacity: 0,
            duration: 1.4,
            ease: "power3.out"
        });
        
        // Remove explosion container after animation (longer due to bigger effects)
        gsap.delayedCall(2.0, () => {
            explosionContainer.remove();
        });
    }
    
    createEpicBoardExplosion() {
        console.log("Creating EPIC board-clearing explosion!");
        
        // Get the center of the game board
        const gameContainer = document.getElementById('jewelGameContainer');
        if (!gameContainer) return;
        
        const rect = gameContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create epic explosion container
        const epicContainer = document.createElement('div');
        epicContainer.className = 'epic-board-explosion';
        epicContainer.style.position = 'fixed';
        epicContainer.style.left = `${centerX}px`;
        epicContainer.style.top = `${centerY}px`;
        epicContainer.style.transform = 'translate(-50%, -50%)';
        epicContainer.style.zIndex = '10000';
        epicContainer.style.pointerEvents = 'none';
        
        document.body.appendChild(epicContainer);
        
        // Create simplified expanding rings (performance optimized)
        for (let ring = 0; ring < 3; ring++) {
            const massiveRing = document.createElement('div');
            massiveRing.className = 'epic-ring';
            massiveRing.style.position = 'absolute';
            massiveRing.style.width = '0px';
            massiveRing.style.height = '0px';
            massiveRing.style.border = `4px solid #FFD700`;
            massiveRing.style.borderRadius = '50%';
            massiveRing.style.left = '50%';
            massiveRing.style.top = '50%';
            massiveRing.style.transform = 'translate(-50%, -50%)';
            massiveRing.style.opacity = '1';
            
            epicContainer.appendChild(massiveRing);
            
            // Animate simplified rings expanding
            gsap.to(massiveRing, {
                width: `${(ring + 1) * 150}px`,
                height: `${(ring + 1) * 150}px`,
                opacity: 0,
                duration: 1.5,
                delay: ring * 0.2,
                ease: "power2.out"
            });
        }
        
        // Create simplified particle storm (performance optimized)
        for (let i = 0; i < 20; i++) {
            const massiveParticle = document.createElement('div');
            massiveParticle.className = 'epic-particle';
            massiveParticle.style.position = 'absolute';
            massiveParticle.style.width = '8px';
            massiveParticle.style.height = '8px';
            massiveParticle.style.backgroundColor = '#FFD700';
            massiveParticle.style.borderRadius = '50%';
            massiveParticle.style.left = '50%';
            massiveParticle.style.top = '50%';
            massiveParticle.style.transform = 'translate(-50%, -50%)';
            
            epicContainer.appendChild(massiveParticle);
            
            // Simplified direction and distance for each particle
            const angle = (i / 20) * Math.PI * 2;
            const distance = 100 + Math.random() * 80;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            // Animate simplified particles flying out
            gsap.to(massiveParticle, {
                x: endX,
                y: endY,
                opacity: 0,
                scale: 0,
                duration: 1.8,
                delay: Math.random() * 0.3,
                ease: "power2.out"
            });
        }
        
        // Create simplified shockwave (performance optimized)
        const massiveShockwave = document.createElement('div');
        massiveShockwave.className = 'epic-shockwave';
        massiveShockwave.style.position = 'absolute';
        massiveShockwave.style.width = '0px';
        massiveShockwave.style.height = '0px';
        massiveShockwave.style.border = `6px solid rgba(255, 215, 0, 0.8)`;
        massiveShockwave.style.borderRadius = '50%';
        massiveShockwave.style.left = '50%';
        massiveShockwave.style.top = '50%';
        massiveShockwave.style.transform = 'translate(-50%, -50%)';
        
        epicContainer.appendChild(massiveShockwave);
        
        // Animate simplified shockwave
        gsap.to(massiveShockwave, {
            width: '600px',
            height: '600px',
            opacity: 0,
            duration: 1.8,
            ease: "power2.out"
        });
        
        // Create simplified central burst (performance optimized)
        const massiveBurst = document.createElement('div');
        massiveBurst.className = 'epic-burst';
        massiveBurst.style.position = 'absolute';
        massiveBurst.style.width = '200px';
        massiveBurst.style.height = '200px';
        massiveBurst.style.backgroundColor = '#FFD700';
        massiveBurst.style.borderRadius = '50%';
        massiveBurst.style.left = '50%';
        massiveBurst.style.top = '50%';
        massiveBurst.style.transform = 'translate(-50%, -50%)';
        
        epicContainer.appendChild(massiveBurst);
        
        // Animate simplified burst
        gsap.to(massiveBurst, {
            scale: 3,
            opacity: 0,
            duration: 1.5,
            ease: "power2.out"
        });
        
        // Create simplified screen flash effect (performance optimized)
        const screenFlash = document.createElement('div');
        screenFlash.className = 'epic-screen-flash';
        screenFlash.style.position = 'fixed';
        screenFlash.style.top = '0';
        screenFlash.style.left = '0';
        screenFlash.style.width = '100vw';
        screenFlash.style.height = '100vh';
        screenFlash.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
        screenFlash.style.pointerEvents = 'none';
        screenFlash.style.zIndex = '9999';
        
        document.body.appendChild(screenFlash);
        
        // Animate simplified screen flash
        gsap.to(screenFlash, {
            opacity: 0,
            duration: 1.0,
            ease: "power2.out"
        });
        
        // Remove epic container after animation
        gsap.delayedCall(2.2, () => {
            epicContainer.remove();
            screenFlash.remove();
        });
    }

    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Play result sound
        this.e.s.p("jewel_result");
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const finalDiv = document.getElementById('finalDiv');
        
        if (finalDiv) {
            // Calculate final score breakdown
            const match3Total = this.match3Count * 100;
            const match4Total = this.match4Count * 150;
            const match5Total = this.match5Count * 200;
            const explosionTotal = this.explosionCount * 250;
            const bonusBoxTotal = this.bonusBoxCount * 500;
            const smallClearTotal = this.smallClearCount * 1500;
            const bigClearTotal = this.bigClearCount * 2000;
            
            // Calculate bonus points (total score minus base match scores)
            const baseMatchScore = match3Total + match4Total + match5Total;
            const bonusPoints = this.score - baseMatchScore;
            
            // Calculate average multiplier
            const avgMultiplier = this.multiplierValues.length > 0 
                ? (this.multiplierValues.reduce((sum, val) => sum + val, 0) / this.multiplierValues.length).toFixed(1)
                : '1.0';
            
            // Populate the final score screen with existing HTML elements
            document.getElementById('finalScoreValue').textContent = this.score;
            document.getElementById('match3Count').textContent = this.match3Count;
            document.getElementById('match4Count').textContent = this.match4Count;
            document.getElementById('match5Count').textContent = this.match5Count;
            document.getElementById('explosionCount').textContent = this.explosionCount;
            document.getElementById('bonusBoxCount').textContent = this.bonusBoxCount;
            document.getElementById('smallClearCount').textContent = this.smallClearCount;
            document.getElementById('bigClearCount').textContent = this.bigClearCount;
            document.getElementById('bonusPointsTotal').textContent = bonusPoints;
            document.getElementById('avgMultiplier').textContent = avgMultiplier;
            
            finalDiv.style.display = 'flex';
        }
    }

    restartGame() {
        const finalDiv = document.getElementById('finalDiv');
        if (finalDiv) {
            finalDiv.style.display = 'none';
        }
        
        this.score = 0;
        this.scoreMultiplier = 1;
        this.savedMultiplier = 1;
        this.timeLeft = 120;
        this.gameOver = false;
        this.gameStarted = false;
        this.selectedJewel = null;
        this.setAnimatingFalse();
        this.lastMatchTime = 0;
        this.multiplierResetTimer = 3.0;
        
        // Reset tracking variables
        this.match3Count = 0;
        this.match4Count = 0;
        this.match5Count = 0;
        this.explosionCount = 0;
        this.bonusBoxCount = 0;
        this.smallClearCount = 0;
        this.bigClearCount = 0;
        this.multiplierValues = [];
        
        this.initializeGrid();
        this.renderGrid();
        this.showStartMenu();
    }

    createGridOverlay() {
        // Remove any existing overlay
        const existingOverlay = document.getElementById('gridOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.id = 'gridOverlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1000';
        
        // Create grid overlay
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.left = `${this.gridPadding + col * (this.jewelSize / 2 + this.jewelGap)}px`;
                cell.style.top = `${this.gridPadding + row * (this.jewelSize / 2 + this.jewelGap)}px`;
                cell.style.width = `${this.jewelSize / 2}px`;
                cell.style.height = `${this.jewelSize / 2}px`;
                cell.style.border = '2px solid red';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.fontSize = '12px';
                cell.style.fontWeight = 'bold';
                cell.style.color = 'white';
                cell.style.fontFamily = 'Arial, sans-serif';
                
                // Show what's in this.grid at this position
                const gridValue = this.grid[row][col];
                const colorLetter = gridValue >= 0 ? this.jewelLetters[gridValue] : 'X';
                cell.textContent = `${row},${col}:${colorLetter}`;
                
                // Color the cell based on the jewel color (for debug overlay only)
                if (gridValue >= 0) {
                    cell.style.backgroundColor = this.jewelColors[gridValue];
                } else {
                    cell.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // Red for empty
                }
                
                overlay.appendChild(cell);
            }
        }
        
        document.body.appendChild(overlay);
        
        // Keep overlay visible (no timeout)
    }

    logAllBlocks() {
        const allJewels = document.querySelectorAll('.jewel');
        // Function kept for potential future debugging
    }



    toggleGridOverlay() {
        const existingOverlay = document.getElementById('gridOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        } else {
            this.createGridOverlay();
        }
    }
    
    toggleMask() {
        // Mask functionality disabled for now
    }

    updateFrameCounter() {
        const currentTime = new Date().getTime();
        this.frameCount++;
        
        // Update FPS every second
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            // Update the FPS display
            const frameCounterElement = document.getElementById('frameCounter');
            if (frameCounterElement) {
                frameCounterElement.textContent = `FPS: ${this.fps}`;
                // console.log(`FPS Updated: ${this.fps}`);
            } else {
                // console.log('Frame counter element not found!');
            }
        }
    }

    update(e){
        if(this.action==="set up"){
            // Game is set up and running
        }
        
        // Update FPS counter (always run, regardless of game state)
        this.updateFrameCounter();
        
        // Update multiplier reset timer only when not animating
        if (!this.isAnimating && this.multiplierResetTimer > 0) {
            this.multiplierResetTimer -= this.e.dt;
            
            // If timer reaches 0, reset the multiplier
            if (this.multiplierResetTimer <= 0) {
                this.resetMultiplier();
            }
        }
    }
}
