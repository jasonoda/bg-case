
import gsap from "gsap";
import CryptoJS from 'crypto-js';

export class Scene {
    // Universal animation settings
    DROP_ANIMATION_DURATION = 1;
    DROP_ANIMATION_DISTANCE_MULTIPLIER = 0.0125;
    DROP_ANIMATION_EASE = "sine.out";
    NEW_BLOCK_ANIMATION_DURATION = 1;
    NEW_BLOCK_ANIMATION_EASE = "sine.out";

    setUp(e) {
        this.e = e;
    }

    buildScene() {
        this.action = "set up";

        // Game configuration
        this.GRID_SIZE = 9;
        this.JEWEL_TYPES = 4;
        this.grid = [];
        this.selectedJewel = null;
        this.isAnimating = false;
        this.score = 0;
        this.timeLeft = 120; // 2 minutes
        this.gameStarted = false;
        this.gameOver = false;
        
        // Frame counter variables
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 0;
        
        // Jewel colors/types
        this.jewelColors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Turquoise  
            '#45B7D1', // Blue
            '#FFA726'  // Orange
        ];
        
        this.jewelNames = ['red', 'turquoise', 'blue', 'orange'];
        
        // Initialize grid
        this.initializeGrid();
        this.createGameHTML();
        this.bindEvents();
        
        // Store the initial positions of jewels in the first column and first row
        this.initialJewelPositions = [];
        this.initialJewelLeftPositions = [];
        
        // Record row heights (top positions)
        for (let row = 0; row < this.GRID_SIZE; row++) {
            const jewelElement = document.querySelector(`[data-row="${row}"][data-col="0"]`);
            if (jewelElement) {
                const topPosition = parseInt(jewelElement.style.top);
                this.initialJewelPositions.push(topPosition);
            }
        }
        
        // Record column left positions
        for (let col = 0; col < this.GRID_SIZE; col++) {
            const jewelElement = document.querySelector(`[data-row="0"][data-col="${col}"]`);
            if (jewelElement) {
                const leftPosition = parseInt(jewelElement.style.left);
                this.initialJewelLeftPositions.push(leftPosition);
            }
        }
        
        // Hide start menu and show game
        this.showStartMenu();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = this.getRandomJewelType();
            }
        }
        
        // Remove initial matches
        this.removeInitialMatches();
    }

    getRandomJewelType() {
        return Math.floor(Math.random() * this.JEWEL_TYPES);
    }

    removeInitialMatches() {
        let hasMatches = true;
        let iterations = 0;
        const maxIterations = 100;
        
        while (hasMatches && iterations < maxIterations) {
            hasMatches = false;
            iterations++;
            
            for (let row = 0; row < this.GRID_SIZE; row++) {
                for (let col = 0; col < this.GRID_SIZE; col++) {
                    if (this.wouldCreateMatch(row, col, this.grid[row][col])) {
                        this.grid[row][col] = this.getRandomJewelType();
                        hasMatches = true;
                    }
                }
            }
        }
    }

    wouldCreateMatch(row, col, jewelType) {
        // Check horizontal match
        let horizontalCount = 1;
        
        // Check left
        for (let c = col - 1; c >= 0 && this.grid[row][c] === jewelType; c--) {
            horizontalCount++;
        }
        
        // Check right
        for (let c = col + 1; c < this.GRID_SIZE && this.grid[row][c] === jewelType; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= 3) return true;
        
        // Check vertical match
        let verticalCount = 1;
        
        // Check up
        for (let r = row - 1; r >= 0 && this.grid[r][col] === jewelType; r--) {
            verticalCount++;
        }
        
        // Check down
        for (let r = row + 1; r < this.GRID_SIZE && this.grid[r][col] === jewelType; r++) {
            verticalCount++;
        }
        
        return verticalCount >= 3;
    }

    createGameHTML() {
        //console.log('createGameHTML called');
        // Remove existing game content
        const existingContainer = document.getElementById('jewelGameContainer');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Create main game container
        const gameContainer = document.createElement('div');
        gameContainer.id = 'jewelGameContainer';
        gameContainer.innerHTML = `
            <div id="jewelGrid" class="jewel-grid"></div>
        `;
        
        document.body.appendChild(gameContainer);
        
        this.renderGrid();
    }

    renderGrid() {
        const gridElement = document.getElementById('jewelGrid');
        if (!gridElement) return;
        
        gridElement.innerHTML = '';
        
        // Calculate jewel size and gap - store these for consistent positioning
        const gridWidth = gridElement.offsetWidth - 20; // Account for padding
        const gridHeight = gridElement.offsetHeight - 20;
        const jewelSize = Math.floor(Math.min(gridWidth / this.GRID_SIZE, gridHeight / this.GRID_SIZE) - 2); // 2px gap, ensure integer
        const gap = 2;
        
        // Store these values for consistent positioning calculations
        this.jewelSize = jewelSize;
        this.jewelGap = gap;
        this.gridPadding = 10;
        
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const jewelElement = document.createElement('div');
                jewelElement.className = 'jewel';
                jewelElement.dataset.row = row;
                jewelElement.dataset.col = col;
                jewelElement.dataset.color = this.jewelNames[this.grid[row][col]][0]; // Store first letter of color
                jewelElement.style.backgroundColor = this.jewelColors[this.grid[row][col]];
                jewelElement.style.width = `${jewelSize}px`;
                jewelElement.style.height = `${jewelSize}px`;
                jewelElement.style.left = `${this.gridPadding + col * (jewelSize + gap)}px`;
                jewelElement.style.top = `${this.gridPadding + row * (jewelSize + gap)}px`;
                
                // Add debug numbers to show row and column
                jewelElement.innerHTML = `<div style="position: absolute; top: 2px; left: 2px; font-size: 12px; color: black; font-family: Arial, sans-serif; font-weight: bold;">${row},${col}</div>`;
            
                gridElement.appendChild(jewelElement);
            }
        }
    }

    bindEvents() {
        const gridElement = document.getElementById('jewelGrid');
        if (!gridElement) return;
        
        // Gesture variables
        this.isGesturing = false;
        this.gestureStartJewel = null;
        this.startX = 0;
        this.startY = 0;
        this.hasTriggeredSwap = false;
        
        // Throttle variables for performance
        this.lastTouchTime = 0;
        this.touchThrottleDelay = 16; // ~60fps
        
        // Mouse events for desktop
        gridElement.addEventListener('mousedown', (e) => this.handleDragStart(e));
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        
        // Optimized touch events for mobile
        gridElement.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleDragEnd(e), { passive: true });
        
        // Prevent context menu on right click
        gridElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    showStartMenu() {
        const startMenu = document.getElementById('startMenu');
        const playButton = document.getElementById('playButton');
        const instructionsButton = document.getElementById('instructionsButton');
        const instructionsOverlay = document.getElementById('instructionsOverlay');
        const closeInstructionsButton = document.getElementById('closeInstructionsButton');
        
        if (startMenu && playButton) {
            startMenu.style.display = 'flex';
            
            playButton.onclick = () => {
                this.startGame();
            };
            
            if (instructionsButton && instructionsOverlay && closeInstructionsButton) {
                instructionsButton.onclick = () => {
                    instructionsOverlay.style.display = 'flex';
                };
                
                closeInstructionsButton.onclick = () => {
                    instructionsOverlay.style.display = 'none';
                };
                
                // Close instructions when clicking overlay
                instructionsOverlay.onclick = (e) => {
                    if (e.target === instructionsOverlay) {
                        instructionsOverlay.style.display = 'none';
                    }
                };
            }
        }
    }

    startGame() {
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.style.display = 'none';
        }
        
        this.gameStarted = true;
        this.startTimer();
        this.updateScoreDisplay();
    }

    startTimer() {
        //console.log('startTimer called');
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        //console.log('updateTimerDisplay called');
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const upperRightDiv = document.getElementById('upperRightDiv');
        if (upperRightDiv) {
            upperRightDiv.textContent = timeString;
        }
    }

    updateScoreDisplay() {
        //console.log('updateScoreDisplay called');
        const upperLeftDiv = document.getElementById('upperLeftDiv');
        if (upperLeftDiv) {
            upperLeftDiv.textContent = `SCORE: ${this.score}`;
        }
    }

    handleDragStart(e) {
        //console.log('handleDragStart called');
        if (this.isAnimating || this.gameOver || !this.gameStarted) return;
        
        // Throttle touch events for performance
        const now = performance.now();
        if (e.touches && (now - this.lastTouchTime) < this.touchThrottleDelay) {
            return;
        }
        this.lastTouchTime = now;
        
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
        
        // Highlight the starting jewel
        this.highlightJewel(this.gestureStartJewel.row, this.gestureStartJewel.col, true);
    }

    handleDragMove(e) {
        //console.log('handleDragMove called');
        if (!this.isGesturing || !this.gestureStartJewel || this.hasTriggeredSwap) return;
        
        // Throttle touch move events for performance
        const now = performance.now();
        if (e.touches && (now - this.lastTouchTime) < this.touchThrottleDelay) {
            return;
        }
        this.lastTouchTime = now;
        
        e.preventDefault();
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Calculate gesture distance
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        const threshold = 12; // Minimum distance to trigger swap (ultra responsive)
        
        // Check if gesture is strong enough to trigger a swap
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            // Determine target direction based on gesture
            let targetRow = this.gestureStartJewel.row;
            let targetCol = this.gestureStartJewel.col;
            let hasValidTarget = false;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal gesture
                if (deltaX > threshold && targetCol < this.GRID_SIZE - 1) {
                    targetCol++; // Right
                    hasValidTarget = true;
                } else if (deltaX < -threshold && targetCol > 0) {
                    targetCol--; // Left
                    hasValidTarget = true;
                }
            } else {
                // Vertical gesture
                if (deltaY > threshold && targetRow < this.GRID_SIZE - 1) {
                    targetRow++; // Down
                    hasValidTarget = true;
                } else if (deltaY < -threshold && targetRow > 0) {
                    targetRow--; // Up
                    hasValidTarget = true;
                }
            }
            
            // If we have a valid target, trigger the swap
            if (hasValidTarget) {
                this.hasTriggeredSwap = true;
                this.isAnimating = true; // Prevent other interactions during animation
                this.clearAllHighlights();
                
                // Perform the swap animation and logic
                this.attemptSwap(
                    this.gestureStartJewel.row, this.gestureStartJewel.col,
                    targetRow, targetCol
                );
            }
        }
    }

    handleDragEnd(e) {
        //console.log('handleDragEnd called');
        if (!this.isGesturing) return;
        
        e.preventDefault();
        
        // Clear highlights
        this.clearAllHighlights();
        
        // Reset gesture state
        this.isGesturing = false;
        this.gestureStartJewel = null;
        this.hasTriggeredSwap = false;
    }

    clearAllHighlights() {
        //console.log('clearAllHighlights called');
        const jewels = document.querySelectorAll('.jewel');
        jewels.forEach(jewel => {
            // jewel.style.border = '2px solid rgba(255,255,255,0.3)';
            jewel.style.transform = 'scale(1)';
            jewel.classList.remove('drag-target');
        });
    }

    highlightJewel(row, col, highlight) {
        //console.log('highlightJewel called');
        const jewelElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (jewelElement) {
            if (highlight) {
                // jewelElement.style.border = '3px solid #FFD700';
                jewelElement.style.transform = 'scale(1.05)';
                // jewelElement.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
                jewelElement.style.zIndex = '100';
            } else {
                // jewelElement.style.border = '2px solid rgba(255,255,255,0.3)';
                jewelElement.style.transform = 'scale(1)';
                // jewelElement.style.boxShadow = '';
                jewelElement.style.zIndex = '';
            }
        }
    }

    areAdjacent(row1, col1, row2, col2) {
        //console.log('areAdjacent called');
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    attemptSwap(row1, col1, row2, col2) {
        // Get the jewels from DOM
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            this.showInvalidMoveFeedback(row1, col1, row2, col2);
            return;
        }
        
        const color1 = jewel1.dataset.color;
        const color2 = jewel2.dataset.color;
        const originalRow1 = jewel1.dataset.row;
        const originalCol1 = jewel1.dataset.col;
        const originalRow2 = jewel2.dataset.row;
        const originalCol2 = jewel2.dataset.col;
        
        // Temporarily swap the color AND position data attributes to test for matches
        jewel1.dataset.color = color2;
        jewel1.dataset.row = originalRow2;
        jewel1.dataset.col = originalCol2;
        jewel2.dataset.color = color1;
        jewel2.dataset.row = originalRow1;
        jewel2.dataset.col = originalCol1;
        
        // Check if this creates any matches
        const matches = this.findMatches();
        
        // Restore original colors and positions
        jewel1.dataset.color = color1;
        jewel1.dataset.row = originalRow1;
        jewel1.dataset.col = originalCol1;
        jewel2.dataset.color = color2;
        jewel2.dataset.row = originalRow2;
        jewel2.dataset.col = originalCol2;
        
        if (matches.length > 0) {
            // Valid move - now actually swap the jewels
            this.isAnimating = true;
            this.animateSwap(row1, col1, row2, col2, () => {
                this.processMatches();
            });
        } else {
            // Invalid move
            this.showInvalidMoveFeedback(row1, col1, row2, col2);
        }
    }

    findMatches() {
        const matches = [];
        const visited = new Set();
        
        // Find horizontal matches using color data attributes
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE - 2; col++) {
                const jewel1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const jewel2 = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);
                const jewel3 = document.querySelector(`[data-row="${row}"][data-col="${col + 2}"]`);
                
                if (jewel1 && jewel2 && jewel3) {
                    const color1 = jewel1.dataset.color;
                    const color2 = jewel2.dataset.color;
                    const color3 = jewel3.dataset.color;
                    
                    if (color1 && color2 && color3 && color1 === color2 && color2 === color3) {
                        // Add all 3 jewels to matches
                        for (let c = col; c <= col + 2; c++) {
                            const key = `${row}-${c}`;
                            if (!visited.has(key)) {
                                matches.push({ row, col: c });
                                visited.add(key);
                            }
                        }
                    }
                }
            }
        }
        
        // Find vertical matches using color data attributes
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let row = 0; row < this.GRID_SIZE - 2; row++) {
                const jewel1 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                const jewel2 = document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);
                const jewel3 = document.querySelector(`[data-row="${row + 2}"][data-col="${col}"]`);
                
                if (jewel1 && jewel2 && jewel3) {
                    const color1 = jewel1.dataset.color;
                    const color2 = jewel2.dataset.color;
                    const color3 = jewel3.dataset.color;
                    
                    if (color1 && color2 && color3 && color1 === color2 && color2 === color3) {
                        // Add all 3 jewels to matches
                        for (let r = row; r <= row + 2; r++) {
                            const key = `${r}-${col}`;
                            if (!visited.has(key)) {
                                matches.push({ row: r, col });
                                visited.add(key);
                            }
                        }
                    }
                }
            }
        }
        
        return matches;
    }
    
    listAllJewelData() {
        console.log("\n=== ALL JEWEL DATA ===");
        const allJewels = document.querySelectorAll('.jewel');
        
        allJewels.forEach((jewel, index) => {
            const row = jewel.dataset.row;
            const col = jewel.dataset.col;
            const isNew = jewel.dataset.isNew;
            const stackIndex = jewel.dataset.stackIndex;
            const cleared = jewel.dataset.cleared;
            const style = window.getComputedStyle(jewel);
            const backgroundColor = style.backgroundColor;
            const opacity = style.opacity;
            const display = style.display;
            const visibility = style.visibility;
            const top = jewel.style.top;
            const left = jewel.style.left;
            const zIndex = jewel.style.zIndex;
            
            // Determine jewel type from background color
            let jewelType = -1;
            for (let i = 0; i < this.jewelColors.length; i++) {
                const expectedColor = this.jewelColors[i];
                const hexToRgb = (hex) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
                };
                const expectedRgb = hexToRgb(expectedColor);
                if (backgroundColor === expectedColor || backgroundColor === expectedRgb) {
                    jewelType = i;
                    break;
                }
            }
            
            console.log(`Jewel ${index + 1}:`);
            console.log(`  Position: [${row},${col}]`);
            console.log(`  Type: ${jewelType} (${this.jewelNames[jewelType]})`);
            console.log(`  Color: ${backgroundColor}`);
            console.log(`  Color Data: ${jewel.dataset.color}`);
            console.log(`  Style: opacity=${opacity}, display=${display}, visibility=${visibility}`);
            console.log(`  Position: top=${top}, left=${left}, zIndex=${zIndex}`);
            console.log(`  Data: isNew=${isNew}, stackIndex=${stackIndex}, cleared=${cleared}`);
            console.log(`  Internal Grid Value: ${this.grid[row] ? this.grid[row][col] : 'undefined'}`);
            console.log(`  Visible: ${opacity !== '0' && display !== 'none' && visibility !== 'hidden'}`);
            console.log('');
        });
        
        console.log(`Total jewels in DOM: ${allJewels.length}`);
        console.log("=== END JEWEL DATA ===\n");
    }

    animateSwap(row1, col1, row2, col2, callback) {
        //console.log('animateSwap called');
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            callback();
            return;
        }
        
        // Calculate the positions needed for swapping
        const deltaRow = row2 - row1;
        const deltaCol = col2 - col1;
        
        // Get jewel dimensions for accurate positioning
        const jewelSize = parseInt(jewel1.style.width) || 60;
        const gap = 2;
        
        const translateX = deltaCol * (jewelSize + gap);
        const translateY = deltaRow * (jewelSize + gap);
        
        // Store original positions
        const jewel1Left = parseInt(jewel1.style.left);
        const jewel1Top = parseInt(jewel1.style.top);
        const jewel2Left = parseInt(jewel2.style.left);
        const jewel2Top = parseInt(jewel2.style.top);
        
        // Set styles for smooth animation
        jewel1.style.zIndex = '1000';
        jewel2.style.zIndex = '999';
        
        // Store original colors for swapping
        const color1 = jewel1.dataset.color;
        const color2 = jewel2.dataset.color;
        
        // Create timeline with no re-render during animation
        const tl = gsap.timeline({
            onComplete: () => {
                // Reset all animation styles cleanly
                gsap.set([jewel1, jewel2], {
                    clearProps: "all"
                });
                
                // Swap the color data attributes to match the visual swap
                jewel1.dataset.color = color2;
                jewel2.dataset.color = color1;
                
                // Also swap the position data attributes to match the visual swap
                jewel1.dataset.row = row2;
                jewel1.dataset.col = col2;
                jewel2.dataset.row = row1;
                jewel2.dataset.col = col1;
                
                // Clear animation state
                this.isAnimating = false;
                
                // Call callback after everything is settled
                callback();
            }
        });
        
        // Animate both jewels swapping positions with snappy easing
        tl.to(jewel1, {
            x: translateX,
            y: translateY,
            duration: 0.3,
            ease: "back.inOut(1.2)"
        }, 0)
        .to(jewel2, {
            x: -translateX,
            y: -translateY,
            duration: 0.3,
            ease: "back.inOut(1.2)"
        }, 0);
    }

    showInvalidMoveFeedback(row1, col1, row2, col2) {
        //console.log('showInvalidMoveFeedback called');
        const jewel1 = document.querySelector(`[data-row="${row1}"][data-col="${col1}"]`);
        const jewel2 = document.querySelector(`[data-row="${row2}"][data-col="${col2}"]`);
        
        if (!jewel1 || !jewel2) {
            this.isAnimating = false;
            return;
        }
        
        // Determine if this was a horizontal or vertical swipe
        const isHorizontal = Math.abs(col2 - col1) > Math.abs(row2 - row1);
        
        // Simple shake animation to indicate invalid move
        const tl = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
            }
        });
        
        if (isHorizontal) {
            // Horizontal shake
            tl.to([jewel1, jewel2], {
                x: 5,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                x: -5,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                x: 3,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                x: 0,
                duration: 0.05,
                ease: "power2.out"
            });
        } else {
            // Vertical shake
            tl.to([jewel1, jewel2], {
                y: 5,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                y: -5,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                y: 3,
                duration: 0.05,
                ease: "power2.out"
            })
            .to([jewel1, jewel2], {
                y: 0,
                duration: 0.05,
                ease: "power2.out"
            });
        }
    }

    processMatches() {
        //console.log("processMatches");
        const matches = this.findMatches();
        
        console.log("=== MATCH DETECTION RESULTS ===");
        console.log(`Found ${matches.length} matches:`, matches);
        
        // Debug: Check if swapped jewels are being incorrectly included
        const swappedJewels = document.querySelectorAll('.jewel[data-row][data-col]');
        console.log("=== SWAPPED JEWELS DEBUG ===");
        swappedJewels.forEach(jewel => {
            const row = jewel.dataset.row;
            const col = jewel.dataset.col;
            const color = jewel.dataset.color;
            const style = window.getComputedStyle(jewel);
            console.log(`Jewel at [${row},${col}]: color=${color}, opacity=${style.opacity}, top=${jewel.style.top}, left=${jewel.style.left}`);
        });
        
        // List all current jewel data to debug
        this.listAllJewelData();
        
        if (matches.length === 0) {
            this.isAnimating = false;
            return;
        }
        
        // Calculate score based on number of matches
        let baseScore;
        if (matches.length >= 5) {
            baseScore = matches.length * 15; // 5+ matches get bonus multiplier
        } else if (matches.length === 4) {
            baseScore = matches.length * 12; // 4 matches get slight bonus
        } else {
            baseScore = matches.length * 10; // 3 matches standard score
        }
        
        this.score += baseScore;
        this.updateScoreDisplay();
        
        // Show score popup
        this.showScorePopup(baseScore);
        
        // Animate clearing matches
        this.animateClearMatches(matches, () => {
            // Step 1: Clear matched blocks and calculate what needs to fall
            this.handleBlockFallingAfterMatch(matches);
        });
    }

    animateClearMatches(matches, callback) {
        const elements = [];
        
        // Find and validate each element to be cleared
        matches.forEach(match => {
            const element = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            if (element) {
                const color = element.dataset.color;
                console.log(`CLEARING BLOCK: [${match.row},${match.col}] - Color: ${color} - Reason: Part of ${matches.length} match(es)`);
                elements.push(element);
            }
        });
        
        // Mark elements as cleared but keep them in DOM
        elements.forEach(element => {
            element.style.opacity = '0';
            element.dataset.cleared = 'true'; // Mark as cleared
        });
        
        // Clear the matched jewels from grid
        matches.forEach(match => {
            this.grid[match.row][match.col] = -1; // Mark as empty
        });
        
        callback();
    }


    
    calculateDroppedGrid() {
        //console.log('calculateDroppedGrid called');
        const newGrid = JSON.parse(JSON.stringify(this.grid));
        
        for (let col = 0; col < this.GRID_SIZE; col++) {
            let writePos = this.GRID_SIZE - 1;
            
            // Compact column from bottom up
            for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
                if (newGrid[row][col] !== -1) {
                    if (row !== writePos) {
                        newGrid[writePos][col] = newGrid[row][col];
                        newGrid[row][col] = -1;
                    }
                    writePos--;
                }
            }
        }
        
        return newGrid;
    }








    

    
    handleBlockFallingAfterMatch(matches) {
        //console.log('handleBlockFallingAfterMatch called');
        
        // Step 1: Count how many blocks were cleared in each column
        const clearedPerColumn = new Array(this.GRID_SIZE).fill(0);
        matches.forEach(match => {
            clearedPerColumn[match.col]++;
        });
        
        //console.log('Cleared per column:', clearedPerColumn);
        
        // Step 2: Find all existing blocks that need to fall down
        const blocksToFall = [];
        
        for (let col = 0; col < this.GRID_SIZE; col++) {
            if (clearedPerColumn[col] > 0) {
                // Find all existing blocks in this column that need to fall
                for (let row = 0; row < this.GRID_SIZE; row++) {
                    const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (blockElement && !blockElement.dataset.isNew && blockElement.dataset.cleared !== 'true') {
                        // This block needs to fall down by the number of cleared spaces below it
                        const spacesToFall = this.calculateSpacesToFall(row, col, clearedPerColumn[col]);
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
        
        //console.log('Blocks to fall:', blocksToFall);
        
        // Step 3: Create new blocks and add them to the array
        const newBlocks = [];
        for (let col = 0; col < this.GRID_SIZE; col++) {
            for (let i = 0; i < clearedPerColumn[col]; i++) {
                const newJewelType = this.getRandomJewelType();
                const newBlock = this.createNewBlock(col, newJewelType, i);
                newBlocks.push(newBlock);
            }
        }
        
        //console.log('New blocks created:', newBlocks);
        //console.log('blocksToFall:', blocksToFall);
        
        // Step 4: Combine all blocks that need to move
        const allBlocksToMove = [...blocksToFall, ...newBlocks];
        
        console.log("=== PAUSED BEFORE ANIMATION ===");
        console.log("Matched jewels cleared, new jewels created. Press any key to continue...");
        
        // Step 5: Pause until user presses a key, then animate all blocks to their final positions
        const handleKeyPress = () => {
            document.removeEventListener('keydown', handleKeyPress);
            console.log("=== RESUMING ANIMATION ===");
            this.animateAllBlocksToFinalPositions(allBlocksToMove);
        };
        document.addEventListener('keydown', handleKeyPress);
    }
    
    calculateSpacesToFall(row, col, clearedInColumn) {
        // Count how many spaces below this row were cleared
        let spacesToFall = 0;
        for (let checkRow = row + 1; checkRow < this.GRID_SIZE; checkRow++) {
            const blockAtCheckRow = document.querySelector(`[data-row="${checkRow}"][data-col="${col}"]`);
            if (!blockAtCheckRow || blockAtCheckRow.dataset.cleared === 'true') {
                // This space was cleared, so we need to fall one more space
                spacesToFall++;
            }
        }
        return spacesToFall;
    }
    
    createNewBlock(col, jewelType, stackIndex) {
        // Use stored values for consistent positioning
        const jewelSize = this.jewelSize || 60;
        const gap = this.jewelGap || 2;
        const padding = this.gridPadding || 10;
        
        // Create the new block element
        const gridElement = document.getElementById('jewelGrid');
        
        const jewelElement = document.createElement('div');
        jewelElement.className = 'jewel new-jewel';
        jewelElement.dataset.col = col;
        jewelElement.dataset.color = this.jewelNames[jewelType][0]; // Store first letter of color
        jewelElement.dataset.isNew = 'true';
        jewelElement.dataset.stackIndex = stackIndex;
        jewelElement.style.backgroundColor = this.jewelColors[jewelType];
        jewelElement.style.position = 'absolute';
        jewelElement.style.zIndex = '200';
        jewelElement.style.opacity = '0.8';
        
        // Position it above the grid
        const topJewelInColumn = document.querySelector(`[data-col="${col}"]`);
        let leftPosition, topPosition;
        
        if (topJewelInColumn) {
            leftPosition = parseInt(topJewelInColumn.style.left);
            topPosition = parseInt(topJewelInColumn.style.top) - (jewelSize + gap) * (stackIndex + 1);
        } else {
            leftPosition = padding + col * (jewelSize + gap);
            topPosition = padding - (jewelSize + gap) * (stackIndex + 1);
        }
        
        jewelElement.style.left = `${leftPosition}px`;
        jewelElement.style.top = `${topPosition}px`;
        jewelElement.style.width = `${jewelSize}px`;
        jewelElement.style.height = `${jewelSize}px`;
        
        gridElement.appendChild(jewelElement);
        
        // Calculate where this new block should end up
        // Find the first empty space from the bottom up
        let targetRow = this.GRID_SIZE - 1;
        for (let row = this.GRID_SIZE - 1; row >= 0; row--) {
            const blockAtRow = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (!blockAtRow || blockAtRow.dataset.cleared === 'true') {
                // Found an empty space, this is where the new block should go
                targetRow = row;
                break;
            }
        }
        
        return {
            element: jewelElement,
            col: col,
            targetRow: targetRow, // New blocks fill empty spaces from bottom up
            isNew: true,
            stackIndex: stackIndex
        };
    }
    
    animateAllBlocksToFinalPositions(allBlocks) {
        
        const animations = [];
        
        // Group blocks by column
        const blocksByColumn = {};
        allBlocks.forEach(block => {
            if (!blocksByColumn[block.col]) {
                blocksByColumn[block.col] = [];
            }
            blocksByColumn[block.col].push(block);
        });
        
        // Process each column
        Object.keys(blocksByColumn).forEach(col => {
            const blocksInColumn = blocksByColumn[col];
            
            // Use stored values for consistent positioning
            const jewelHeight = this.jewelSize || 60;
            const gap = this.jewelGap || 2;
            
            // Animate each block in this column
            blocksInColumn.forEach((block, index) => {
                // Count blank spaces BELOW this specific block
                let blankSpacesBelow = 0;
                const blockRow = block.currentRow || 0;
                
                for (let row = blockRow + 1; row < this.GRID_SIZE; row++) {
                    const blockAtRow = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    const isCleared = !blockAtRow || blockAtRow.dataset.cleared === 'true';
                    if (isCleared) {
                        blankSpacesBelow++;
                    }
                }
                
                // Calculate the target position using absolute positioning
                const currentTop = parseInt(block.element.style.top) || 0;
                const moveDistance = blankSpacesBelow * (this.jewelSize + this.jewelGap);
                let targetTop = currentTop + moveDistance;
                
                // Find the closest initialJewelPosition to the targetTop and assign it
                let closestPosition = this.initialJewelPositions[0];
                let minDistance = Math.abs(targetTop - closestPosition);
                
                for (let i = 1; i < this.initialJewelPositions.length; i++) {
                    const distance = Math.abs(targetTop - this.initialJewelPositions[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPosition = this.initialJewelPositions[i];
                    }
                }
                
                // Set targetTop to the closest initial position (absolute positioning)
                targetTop = closestPosition;
                

                
                // Kill any existing animations on this block
                gsap.killTweensOf(block.element);
            
            const animation = gsap.to(block.element, {
                top: targetTop,
                duration: this.DROP_ANIMATION_DURATION,
                ease: this.DROP_ANIMATION_EASE,
                delay: block.isNew ? index * 0.02 : 0
            });
                
                animations.push(animation);
            });
        });
        
        // Wait for all animations to complete, then pause
        Promise.all(animations.map(anim => new Promise(resolve => {
            anim.eventCallback("onComplete", resolve);
        }))).then(() => {
            this.updateGridFromBlockPositions(allBlocks);
            
            // CRITICAL: Clear the allBlocks array after animations complete
            allBlocks.length = 0;
            
            // Remove all cleared dataset attributes from previous rounds
            const allJewels = document.querySelectorAll('.jewel');
            allJewels.forEach(jewel => {
                delete jewel.dataset.cleared;
            });
            
                    // Reset initial position arrays to ensure they're current
        this.resetInitialPositions();
        });
    }
    
    resetInitialPositions() {
        // Clear and recalculate initial positions
        this.initialJewelPositions = [];
        this.initialJewelLeftPositions = [];
        
        // Record row heights (top positions)
        for (let row = 0; row < this.GRID_SIZE; row++) {
            const jewelElement = document.querySelector(`[data-row="${row}"][data-col="0"]`);
            if (jewelElement) {
                const topPosition = parseInt(jewelElement.style.top);
                this.initialJewelPositions.push(topPosition);
            }
        }
        
        // Record column left positions
        for (let col = 0; col < this.GRID_SIZE; col++) {
            const jewelElement = document.querySelector(`[data-row="0"][data-col="${col}"]`);
            if (jewelElement) {
                const leftPosition = parseInt(jewelElement.style.left);
                this.initialJewelLeftPositions.push(leftPosition);
            }
        }
        
        // Reset initial positions
    }
    
    updateGridFromBlockPositions(allBlocks) {
        
        // First, clear out any old jewels that might have wrong data attributes
        const allJewels = document.querySelectorAll('.jewel');
        
        // Create a map of actual positions to avoid duplicates
        const positionMap = new Map();
        
        // First pass: identify and remove invisible or problematic jewels
        allJewels.forEach(jewelElement => {
            const style = window.getComputedStyle(jewelElement);
            const isVisible = style.opacity !== '0' && style.display !== 'none' && style.visibility !== 'hidden';
            
            if (!isVisible) {
                jewelElement.remove();
                return;
            }
        });
        
        // Get updated list after removing invisible jewels
        const visibleJewels = document.querySelectorAll('.jewel');
        
        visibleJewels.forEach(jewelElement => {
            const currentTop = parseInt(jewelElement.style.top) || 0;
            const currentLeft = parseInt(jewelElement.style.left) || 0;
            
            // Find the closest initial row position
            let closestRow = 0;
            let minRowDistance = Math.abs(currentTop - this.initialJewelPositions[0]);
            
            for (let i = 1; i < this.initialJewelPositions.length; i++) {
                const distance = Math.abs(currentTop - this.initialJewelPositions[i]);
                if (distance < minRowDistance) {
                    minRowDistance = distance;
                    closestRow = i;
                }
            }
            
            // Find the closest initial column position
            let closestCol = 0;
            let minColDistance = Math.abs(currentLeft - this.initialJewelLeftPositions[0]);
            
            for (let i = 1; i < this.initialJewelLeftPositions.length; i++) {
                const distance = Math.abs(currentLeft - this.initialJewelLeftPositions[i]);
                if (distance < minColDistance) {
                    minColDistance = distance;
                    closestCol = i;
                }
            }
            
                                        // Check if this position is already occupied by another jewel
            const positionKey = `${closestRow},${closestCol}`;
            if (positionMap.has(positionKey)) {
                // This position is already occupied, remove this duplicate jewel
                jewelElement.remove();
                return;
            }
            
            // Mark this position as occupied
            positionMap.set(positionKey, jewelElement);
            
            // Update the data attributes to reflect the detected position
            if (closestRow >= 0 && closestRow < this.GRID_SIZE && closestCol >= 0 && closestCol < this.GRID_SIZE) {
                const oldRow = jewelElement.dataset.row;
                const oldCol = jewelElement.dataset.col;
                
                jewelElement.dataset.row = closestRow;
                jewelElement.dataset.col = closestCol;
                
                // Remove temporary attributes
                delete jewelElement.dataset.isNew;
                delete jewelElement.dataset.stackIndex;
                
                // Update debug numbers to show current position
                jewelElement.innerHTML = `<div style="position: absolute; top: 2px; left: 2px; font-size: 12px; color: black; font-family: Arial, sans-serif; font-weight: bold;">${closestRow},${closestCol}</div>`;
                
                // Log if position changed
                if (oldRow != closestRow || oldCol != closestCol) {
                    // Position changed
                }
            }
        });
        
        // Final cleanup: remove any jewels that are outside the grid bounds
        const finalJewels = document.querySelectorAll('.jewel');
        finalJewels.forEach(jewelElement => {
            const row = parseInt(jewelElement.dataset.row);
            const col = parseInt(jewelElement.dataset.col);
            
            if (row < 0 || row >= this.GRID_SIZE || col < 0 || col >= this.GRID_SIZE) {
                jewelElement.remove();
            }
        });
        
        // CRITICAL: Update the internal grid data structure to match the DOM
        this.syncInternalGridFromDOM();
    }
    
    syncInternalGridFromDOM() {
        // Clear the internal grid
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = -1; // Initialize as empty
            }
        }
        
        // Populate the grid based on current DOM state
        const allJewels = document.querySelectorAll('.jewel');
        
        allJewels.forEach(jewelElement => {
            const row = parseInt(jewelElement.dataset.row);
            const col = parseInt(jewelElement.dataset.col);
            
            if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                // Determine jewel type from background color
                const computedStyle = window.getComputedStyle(jewelElement);
                const backgroundColor = computedStyle.backgroundColor;
                let jewelType = -1; // Default to -1 (empty)
                
                // Map background color to jewel type - handle both hex and rgb formats
                for (let i = 0; i < this.jewelColors.length; i++) {
                    const expectedColor = this.jewelColors[i];
                    
                    // Convert hex to rgb for comparison
                    const hexToRgb = (hex) => {
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
                    };
                    
                    const expectedRgb = hexToRgb(expectedColor);
                    
                    if (backgroundColor === expectedColor || backgroundColor === expectedRgb) {
                        jewelType = i;
                        break;
                    }
                }
                
                if (jewelType !== -1) {
                    this.grid[row][col] = jewelType;
                    // Update the color data attribute to match the jewel type
                    jewelElement.dataset.color = this.jewelNames[jewelType][0];
                }
            }
        });
    }
    
    updateInternalGridFromDOM() {
        // Clear the internal grid
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = -1; // Initialize as empty
            }
        }
        
        // Populate the grid based on current DOM state
        const allJewels = document.querySelectorAll('.jewel');
        allJewels.forEach(jewelElement => {
            const row = parseInt(jewelElement.dataset.row);
            const col = parseInt(jewelElement.dataset.col);
            
            if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
                // Determine jewel type from background color
                const computedStyle = window.getComputedStyle(jewelElement);
                const backgroundColor = computedStyle.backgroundColor;
                let jewelType = -1; // Default to -1 (empty)
                
                console.log(`Jewel at [${row},${col}]: backgroundColor = "${backgroundColor}"`);
                
                // Map background color to jewel type - handle both hex and rgb formats
                for (let i = 0; i < this.jewelColors.length; i++) {
                    const expectedColor = this.jewelColors[i];
                    
                    // Convert hex to rgb for comparison
                    const hexToRgb = (hex) => {
                        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                        return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : null;
                    };
                    
                    const expectedRgb = hexToRgb(expectedColor);
                    
                    if (backgroundColor === expectedColor || backgroundColor === expectedRgb) {
                        jewelType = i;
                        console.log(`  Matched to jewel type ${i} (${this.jewelNames[i]})`);
                        break;
                    }
                }
                
                if (jewelType === -1) {
                    console.log(`  WARNING: Could not match color "${backgroundColor}" to any jewel type!`);
                }
                
                this.grid[row][col] = jewelType;
                console.log(`Updated internal grid [${row},${col}] = ${jewelType}`);
            }
        });
        
        console.log('Internal grid updated from DOM');
        console.log('Final grid state:', this.grid);
    }
    
    showScorePopup(points) {
        //console.log('showScorePopup called');
        const popup = document.getElementById('scorePopup');
        if (popup) {
            popup.textContent = `+${points}`;
            popup.style.opacity = '1';
            popup.style.transform = 'translate(-50%, -50%) scale(1.2)';
            
            gsap.to(popup, {
                opacity: 0,
                y: "-=50",
                scale: 1,
                duration: 1,
                ease: "power2.out"
            });
        }
    }

    endGame() {
        //console.log('endGame called');
        this.gameOver = true;
        this.gameStarted = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Show final score
        const finalDiv = document.getElementById('finalDiv');
        const scoreDiv2 = document.getElementById('scoreDiv2');
        
        if (finalDiv && scoreDiv2) {
            scoreDiv2.textContent = this.score;
            finalDiv.style.display = 'flex';
            
            // Add restart functionality
            setTimeout(() => {
                finalDiv.onclick = () => {
                    this.restartGame();
                };
            }, 2000);
        }
    }

    restartGame() {
        //console.log('restartGame called');
        const finalDiv = document.getElementById('finalDiv');
        if (finalDiv) {
            finalDiv.style.display = 'none';
        }
        
        // Reset game state
        this.score = 0;
        this.timeLeft = 120;
        this.gameOver = false;
        this.gameStarted = false;
        this.selectedJewel = null;
        this.isAnimating = false;
        
        // Reinitialize
        this.initializeGrid();
        this.renderGrid();
        this.showStartMenu();
    }

    update(){
        // //console.log('update called');
        if(this.action==="set up"){
            // Game is set up and running
        }
        
        // Update frame counter (always run, regardless of game state)
        this.updateFrameCounter();
    }
    
    updateFrameCounter() {
        // //console.log('updateFrameCounter called');
        const currentTime = performance.now();
        this.frameCount++;
        
        // Update FPS every second
        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            // Update the display
            const frameCounterElement = document.getElementById('frameCounter');
            if (frameCounterElement) {
                frameCounterElement.textContent = `FPS: ${this.fps}`;
                // //console.log(`Frame Counter Updated: FPS: ${this.fps}`);
            } else {
                // //console.log('Frame counter element not found!');
            }
        }
    }
}