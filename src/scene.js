import gsap from "gsap";
import CryptoJS from 'crypto-js';

export class Scene {
    setUp(e) {
        this.e = e;
    
        this.action="set up";
        this.count=0;
        this.cases = [];
        this.caseValues = [];
        this.originalCaseValues = []; // Track original values for reference
        this.selectedCase = null;
        this.clues = [];
        this.cluesFound = [];
        this.availableClues = [
            "quadrant",
            "oddEven",
            "columns",
            "row",
            "medium",
            "halfTopBottomLow",
            "halfSideLow",
            "pick3",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "lowClue",
            "doubleClue"
        ];
        this.debugClue=""
        
        // Free clue tracking
        this.freeClueUsed = false;
        
        // Button usage tracking
        this.buttonUsageStates = {
            freeClue: false,      // FREE CLUE button (action button 0)
            pick3: false,         // PICK 3 button (action button 1) 
            double: false,        // DOUBLE button (action button 2)
            clueButton: false     // Clue button
        };
        
        // Timer functionality
        this.gameTime = 120; // 2 minutes in seconds
        this.timeBonus = 0; // Time bonus in dollars
        this.gameStarted = false;
        this.firstActionButtonUsed = false;
        this.gameEnded = false;
        this.usedNextToNumbers = new Set(); // Track which numbers have been used as "next to" numbers
        
        // Initialize timer display
        const timerDiv = document.getElementById('timerDiv');
        if (timerDiv) {
            timerDiv.textContent = this.formatTime(this.gameTime);
        }

        if(this.debugClue!==""){
            this.availableClues = [this.debugClue];
        }
        
        // Log initial available clues for debugging
        //console.log(`Scene setup: Initial available clues: ${this.availableClues.join(', ')}`);

        // Start background image opacity yoyo animation
        this.startBackgroundAnimation();
        
        // Start case brightness flash animation
        // this.startCaseFlashAnimation();
        
        // Initialize FPS counter
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 0;
    }

    buildScene(){  
        // HTML structure is now in game.html
        // CSS styles are in main.css
    }

    update(e){

        //cursor, this the project loop, follow this structure
        
        // Update FPS counter
        this.updateFrameCounter();
        
        // Debug: Check clue button event listener every second (60 frames)
        // 
        
        // Update timer if game has started
        if (this.gameStarted && this.action === "choose") {
            this.gameTime -= this.e.dt;
            if (this.gameTime <= 0) {
                this.gameTime = 0;
                // Force the player to accept the deal when time runs out
                this.forceDealAcceptance();
            }
            // Calculate time bonus (100 dollars per second)
            this.timeBonus = Math.floor(this.gameTime) * 100;
            
            // Update deal value to reflect new time bonus
            this.updateDealValue();
        }

        if(this.action==="set up"){
            
            // Get all 24 case buttons
            const caseButtons = document.querySelectorAll('.cell-button');
            
            // Create array of case values from bottom panel
            this.caseValues = [];
            const scoreCells = document.querySelectorAll('.score-cell:not(.header)');
            scoreCells.forEach(cell => {
                const value = parseInt(cell.textContent);
                if (!isNaN(value)) {
                    this.caseValues.push(value);
                }
            });
            
            // Add 3 "CLUE" values to make 24 total
            this.caseValues.push("CLUE");
            this.caseValues.push("CLUE");
            this.caseValues.push("CLUE");
            
            // Shuffle case values
            this.shuffleArray(this.caseValues);
            
            // Create case objects
            this.cases = [];
            caseButtons.forEach((button, index) => {
                const caseObj = {
                    caseNumber: index + 1,
                    domRef: button,
                    action: "ready",
                    value: this.caseValues[index],
                    originalValue: this.caseValues[index] // Store original value
                };
                this.cases.push(caseObj);
                
                // Add click listener
                button.addEventListener('click', () => this.handleCaseClick(caseObj));
                
                // Add click listener to case value indicator
                const indicator = button.querySelector('.case-value-indicator');
                if (indicator) {
                    indicator.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent case button click
                        this.showCaseValue(caseObj, indicator);
                    });
                }
            });
            
            // Assign each case to a bottom panel DOM element
            this.assignCasesToBottomPanel();
            
            // Set up initial case positions for animation
            this.setupCaseAnimation();
            
            // Log which cases have clues
            //console.log("=== CLUE CASE ASSIGNMENTS ===");
            this.cases.forEach(caseObj => {
                if (caseObj.value === "CLUE") {
                    //console.log(`Case ${caseObj.caseNumber} contains a CLUE`);
                }
            });
            //console.log("=== END CLUE CASE ASSIGNMENTS ===");
            
            // Add click listener to reveal window close button
            document.getElementById('caseRevealClose').addEventListener('click', () => {
                // this.hideRevealWindow();
                this.action = "choose";
            });
            
            // Add click listener to clue button
            const clueButton = document.getElementById('clueButton');
            if (clueButton) {
                clueButton.addEventListener('click', () => {
                    // Allow clicking if game is started OR if game has ended (for clue review)
                    if (!this.gameStarted && !this.gameEnded) return;
                    
                    if (this.gameEnded) {
                        // Game has ended - just show clues for review
                        this.showClueWindow(false);
                    } else {
                        // Game is active - mark as used and show clues
                        this.markButtonAsUsed('clueButton');
                        this.showClueWindow(false); // Don't show NEW labels when clicking clue button directly
                    }
                });
            } else {
                //console.error('Clue button element not found during setup!');
            }
            
            // Add click listener to clue window close button
            document.getElementById('clueClose').addEventListener('click', () => {
                this.hideClueWindow();  
                this.e.s.p("click1");
            });
            
            // Add click listener to first action button for free clue
            const actionButtons = document.querySelectorAll('.action-button');
            if (actionButtons[0]) {
                actionButtons[0].addEventListener('click', () => {
                    if (!this.gameStarted) return; // Don't work until game starts
                    // Check if player has opened less than 8 cases
                    const openedCases = this.cases.filter(caseObj => caseObj.action === "opened").length;
                    if (openedCases < 7) {
                        // Show popup message
                        this.showMessagePopup("Use only after you've opened 7 cases");
                        return;
                    }
                    this.firstActionButtonUsed = true;
                    
                    // Play bingnice sound for action button 1 (only if >7 cases opened)
                    this.e.s.p("bingnice");
                    
                    this.giveFreeClue();
                });
            }
            
            // Add click listener to second action button for pick 3
            if (actionButtons[1]) {
                actionButtons[1].addEventListener('click', () => {
                    if (!this.gameStarted) return; // Don't work until game starts
                    
                    // Play bingnice sound for action button 2
                    this.e.s.p("bingnice");
                    
                    this.startPickThree();
                });
            }
            
            // Add click listener to third action button for double
            if (actionButtons[2]) {
                actionButtons[2].addEventListener('click', () => {
                    if (!this.gameStarted) return; // Don't work until game starts
                    
                    // Play bingnice sound for action button 3
                    this.e.s.p("bingnice");
                    
                    this.showDoubleWindow();
                });
            }
            
            // Add click listener to deal button
            const dealButton = document.getElementById('caseValueDiv');
            if (dealButton) {
                dealButton.addEventListener('click', () => {
                    if (!this.gameStarted) return; // Don't work until game starts
                    this.handleDealClick();
                });
            }
            
            // Calculate initial deal value
            this.updateDealValue();
            
            // Add debug key listener for 'G' key to reveal case values
            document.addEventListener('keydown', (e) => {
                if (e.key.toLowerCase() === 'g') {
                    this.toggleCaseValueDebug();
                }
            });
            
            // Add click listener to start game button
            const startGameButton = document.getElementById('startGameButton');
            if (startGameButton) {
                startGameButton.addEventListener('click', () => {
  
                    // Play press start sound
                    this.e.s.p("brightClick");
                    this.e.s.p("stinger");

                    document.getElementById('fader').style.opacity = .75;
                    gsap.to(document.getElementById('fader'), {
                        opacity: 0,
                        duration: 1.5,
                        ease: "linear"
                    });

                    // Fade out the start game overlay quickly
                    const overlay = document.getElementById('startGameOverlay');
                    if (overlay) {
                        gsap.to(overlay, {
                            opacity: 0,
                            duration: 0.3,
                            ease: "power2.out",
                            onComplete: () => {
                                overlay.style.display = 'none';
                                
                                // Fade in the game container over 1 second
                                const gameContainer = document.getElementById('gameContainer');
                                if (gameContainer) {
                                    gsap.to(gameContainer, {
                                        opacity: 1,
                                        duration: 0.01,
                                        ease: "power2.out",
                                        onComplete: () => {
                                            // Start case animation immediately after fade-in
                                           
                                        }
                                    });
                                }

                                this.animateCasesIn();
                                setTimeout(() => {
                                    
                                    this.startGame();
                                }, 1);
                                
                                // Also fade in the clue button at the same time
                                const clueButton = document.getElementById('clueButton');
                                if (clueButton) {
                                    gsap.to(clueButton, {
                                        opacity: 1,
                                        duration: 0.4,
                                        ease: "power2.out"
                                    });
                                }
                            }
                        });
                    }
                });
            }
            
            // Add click listener to instructions button
            const instructionsButton = document.getElementById('instructionsButton');
            if (instructionsButton) {
                instructionsButton.addEventListener('click', () => {
                    this.e.s.p("click1")
                    this.showInstructionsWindow();
                });
            }
            
            // Disable all interactive buttons until game starts
            this.disableAllButtonsForStart();
            
            this.action="wait for start";

        }else if(this.action==="wait for start"){
            
            // Waiting for player to start the game
            // Play button is now in HTML

        }else if(this.action==="choose"){
            
            // Waiting for player to choose a case
            // This is handled by event listeners
            
        }else if(this.action==="showing"){
            // Case value is being shown
            // This is handled by the reveal window
            
        }
        
    }


    
    handleCaseClick(caseObj) {
        //console.log("handleCaseClick", caseObj);
        
        // If in pick 3 mode, don't handle normal case opening
        if (this.pickThreeMode) {
            return;
        }
        
        // Only allow case clicking when action is "choose"
        if (this.action !== "choose") {
            return;
        }
        
        if (caseObj.action === "ready") {
            this.selectedCase = caseObj;
            
            if (caseObj.value === "CLUE") {
                ////console.log("Clue case found:", caseObj.caseNumber);
                this.handleClueCase(caseObj);
                this.e.s.p("clue");
            } else {
                // Stop the flash animation for this case
                this.stopCaseFlashAnimation(caseObj.domRef);
                
                this.showRevealWindow(caseObj.value);
                caseObj.action = "opened";
                // caseObj.domRef.style.opacity = "0.3";
                caseObj.domRef.style.pointerEvents = "none";
                
                // Add CSS class to make the case appear darker
                caseObj.domRef.classList.add('opened');
                const indicator = caseObj.domRef.querySelector('.case-value-indicator');
                if (indicator) {
                    this.showCaseValue(caseObj, indicator);
                }
                
                // Update button text to show case number and value
                // caseObj.domRef.innerHTML = `${caseObj.caseNumber}<br>${caseObj.value}`;
                
                // Grey out corresponding value in bottom panel
                this.greyOutValue(caseObj.value, caseObj);
                
                // Update deal value after case is opened
                this.updateDealValue();
                
                // Check if we should enable the first action button (after 7 cases)
                this.checkAndEnableFirstActionButton();
                
                // Check if game should end (only one case with number value remaining)
                this.checkGameEndCondition();
                
                this.action = "showing";
            }
        }
    }
    
    showDoubleWindow() {
        // Create the double window
        const doubleWindow = document.createElement('div');
        doubleWindow.id = 'doubleWindow';
        doubleWindow.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(to bottom, #333333, #000000);
            color: white;
            padding: 30px;
            border-radius: 15px;
            font-family: 'Montserrat', sans-serif;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            // min-width: 400px;
            border: 1px solid #FFD700;
        `;
        
        // Create title
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: white;
            color: #FFD700;
        `;
        title.textContent = 'DOUBLE';
        
        // Create description
        const description = document.createElement('div');
        description.style.cssText = `
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.5;
        `;
        description.innerHTML = `
            Make ALL low and medium<br>cases worth $1.<br><br>
            Double the value of your<br>highest value unopened case.<br><br>
        `;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 20px;
            justify-content: center;
        `;
        
        // Create ACCEPT button
        const acceptButton = document.createElement('button');
        acceptButton.textContent = 'ACCEPT';
        acceptButton.style.cssText = `
            background: linear-gradient(to bottom, #4CAF50, #2E7D32);
            color: white;
            border: 1px solid #2E7D32;
            padding: 15px 30px;
            border-radius: 8px;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        acceptButton.onmouseover = () => {
            acceptButton.style.background = 'linear-gradient(to bottom, #45a049, #1B5E20)';
            acceptButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
        };
        acceptButton.onmouseout = () => {
            acceptButton.style.background = 'linear-gradient(to bottom, #4CAF50, #2E7D32)';
            acceptButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        };
        acceptButton.onclick = () => this.acceptDouble();
        
        // Create CANCEL button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'CANCEL';
        cancelButton.style.cssText = `
            background: linear-gradient(to bottom, #f44336, #C62828);
            color: white;
            border: 1px solid #C62828;
            padding: 15px 30px;
            border-radius: 8px;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        `;
        cancelButton.onmouseover = () => {
            cancelButton.style.background = 'linear-gradient(to bottom, #da190b, #B71C1C)';
            cancelButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
        };
        cancelButton.onmouseout = () => {
            cancelButton.style.background = 'linear-gradient(to bottom, #f44336, #C62828)';
            cancelButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
        };
        cancelButton.onclick = () => this.cancelDouble();
        
        // Assemble the window
        buttonContainer.appendChild(acceptButton);
        buttonContainer.appendChild(cancelButton);
        doubleWindow.appendChild(title);
        doubleWindow.appendChild(description);
        doubleWindow.appendChild(buttonContainer);
        
        // Disable other action buttons while double window is open
        this.disableActionButtons([0, 1]); // Disable FREE CLUE and PICK 3 buttons
        
        // Add to page
        document.body.appendChild(doubleWindow);
    }
    
    acceptDouble() {
        // Step 1: Find the highest unopened case value
        let highestUnopenedValue = 0;
        let highestUnopenedCase = null;
        
        this.cases.forEach(caseObj => {
            if (caseObj.value !== "CLUE" && caseObj.action !== "opened") {
                if (caseObj.value > highestUnopenedValue) {
                    highestUnopenedValue = caseObj.value;
                    highestUnopenedCase = caseObj;
                }
            }
        });
        
        //console.log(`Highest unopened case: ${highestUnopenedCase ? highestUnopenedCase.caseNumber : 'none'} with value: ${highestUnopenedValue}`);
        
        // Step 2: Apply the new rules
        this.cases.forEach(caseObj => {
            if (caseObj.value !== "CLUE") {
                if (caseObj.value >= 50000) {
                    // High value cases (>= 50000)
                    if (caseObj === highestUnopenedCase) {
                        // Only the highest unopened case gets doubled
                        caseObj.value = caseObj.value * 2;
                        //console.log(`Case ${caseObj.caseNumber} (highest unopened) value doubled from ${caseObj.originalValue} to ${caseObj.value}`);
                    } else {
                        // All other high value cases stay the same
                        //console.log(`Case ${caseObj.caseNumber} (other high value) stays at ${caseObj.value}`);
                    }
                } else {
                    // Low and medium value cases (< 50000) get set to 1
                    caseObj.value = 1;
                    //console.log(`Case ${caseObj.caseNumber} value set to 1 (was ${caseObj.originalValue})`);
                }
            }
        });
        
        // Step 3: Update bottom panel using their DOM references
        this.cases.forEach(caseObj => {
            if (caseObj.value !== "CLUE" && caseObj.bottomPanelCell) {
                caseObj.bottomPanelCell.textContent = caseObj.value.toString();
                // Don't change opacity - keep opened cases greyed out
                if (caseObj.action === "opened") {
                    caseObj.bottomPanelCell.style.opacity = "0.3";
                    caseObj.bottomPanelCell.style.color = "#999";
                } else {
                    caseObj.bottomPanelCell.style.opacity = "1";
                    caseObj.bottomPanelCell.style.color = "black";
                }
            }
        });
        
        // Update deal value
        this.updateDealValue();
        
        // Close the window
        this.closeDoubleWindow();
        
        // Re-enable action buttons (respecting usage states)
        this.enableActionButtonsRespectingUsage([0, 1]);
        
        // Mark DOUBLE button as used
        this.markButtonAsUsed('double');
        
        // Disable the third action button (DOUBLE)
        const actionButtons = document.querySelectorAll('.action-button');
        if (actionButtons[2]) {
            actionButtons[2].disabled = true;
            // No opacity changes - CSS handles the styling
            actionButtons[2].style.cursor = "not-allowed";
        }
    }
    
    cancelDouble() {
        // Re-enable action buttons (respecting usage states)
        this.enableActionButtonsRespectingUsage([0, 1]);
        // Simply close the window
        this.closeDoubleWindow();
    }
    
    closeDoubleWindow() {
        const doubleWindow = document.getElementById('doubleWindow');
        if (doubleWindow && doubleWindow.parentNode) {
            doubleWindow.parentNode.removeChild(doubleWindow);
        }
    }
    
    assignCasesToBottomPanel() {
        // Get all score cells (excluding headers)
        const scoreCells = document.querySelectorAll('.score-cell:not(.header)');
        
        // Sort cases by value (LOWEST to highest)
        const sortedCases = [...this.cases].sort((a, b) => {
            if (a.value === "CLUE") return 1; // CLUE cases go to the end
            if (b.value === "CLUE") return -1;
            return a.value - b.value;
        });
        
        // Assign each case to a score cell
        sortedCases.forEach((caseObj, index) => {
            if (scoreCells[index]) {
                // Set the cell text to show the case value
                scoreCells[index].textContent = caseObj.value.toString();
                
                // Store the case number as a data attribute
                scoreCells[index].setAttribute('data-case-number', caseObj.caseNumber);
                
                // Store reference to the cell in the case object
                caseObj.bottomPanelCell = scoreCells[index];
                
                // //console.log(`Case ${caseObj.caseNumber} (value: ${caseObj.value}) assigned to score cell ${index + 1}`);
            }
        });
        
        // Fill remaining cells with placeholder if needed
        for (let i = sortedCases.length; i < scoreCells.length; i++) {
            if (scoreCells[i]) {
                scoreCells[i].textContent = "0";
                scoreCells[i].removeAttribute('data-case-number');
            }
        }
    }
    
    updateBottomPanelValues() {
        // Get all unopened cases (excluding CLUE cases) and sort by case number to maintain order
        const unopenedCases = this.cases.filter(caseObj => caseObj.action === "ready" && caseObj.value !== "CLUE");
        unopenedCases.sort((a, b) => a.caseNumber - b.caseNumber);
        
        // Update the bottom panel to show current case values
        const scoreCells = document.querySelectorAll('.score-cell:not(.header)');
        
        // Clear all cells first
        scoreCells.forEach(cell => {
            cell.style.opacity = "1";
            cell.style.color = "black";
        });
        
        // Update each cell with the corresponding case value
        unopenedCases.forEach((caseObj, index) => {
            if (scoreCells[index]) {
                scoreCells[index].textContent = caseObj.value.toString();
                // Store the case number as a data attribute for reference
                scoreCells[index].setAttribute('data-case-number', caseObj.caseNumber);
            }
        });
        
        // Fill remaining cells with placeholder values if needed
        for (let i = unopenedCases.length; i < scoreCells.length; i++) {
            if (scoreCells[i]) {
                scoreCells[i].textContent = "0";
                scoreCells[i].removeAttribute('data-case-number');
            }
        }
        
        //console.log("Bottom panel updated with current case values");
    }
    
    handleClueCase(caseObj) {
        // Select a random clue from available clues
        if (this.availableClues.length > 0) {
            // Get the clue text
            const clueText = this.getClue(true);
            
            // Stop the flash animation for this case
            this.stopCaseFlashAnimation(caseObj.domRef);
            
            // Mark the case as opened and make it unselectable
            caseObj.action = "opened";
            caseObj.domRef.style.pointerEvents = "none";
            
            // Add CSS class to make the case appear darker
            caseObj.domRef.classList.add('opened');
            
            // Show case value in indicator without changing innerHTML
            const indicator = caseObj.domRef.querySelector('.case-value-indicator');
            if (indicator) {
                this.showCaseValue(caseObj, indicator);
            }
            
            // Show clue window directly
            this.showClueWindow(true);
            
            // Check if we should enable the first action button (after 7 cases)
            this.checkAndEnableFirstActionButton();
        } else {
            // No more clues available, but still show the case as opened
            caseObj.action = "opened";
            caseObj.domRef.style.pointerEvents = "none";
            
            // Stop the flash animation for this case
            this.stopCaseFlashAnimation(caseObj.domRef);
            
            // Add CSS class to make the case appear darker
            caseObj.domRef.classList.add('opened');
            
            // Show case value in indicator without changing innerHTML
            const indicator = caseObj.domRef.querySelector('.case-value-indicator');
            if (indicator) {
                this.showCaseValue(caseObj, indicator);
            }
            
            // Show "no more clues" message in clue window
            this.showClueWindow(true);
            
            // Check if we should enable the first action button (after 7 cases)
            this.checkAndEnableFirstActionButton();
        }
    }
    
    showRevealWindow(value) {

        //console.log("showRevealWindow "+value);

        this.e.suitcase.assignPriceTexture(value);

        // assign the right image to the valuesign mesh

        // Play case button press sound
        this.e.s.p("openClick");

        this.e.suitcase.show("show");

        this.e.s.p("openClick");
            
        if (value <= 500) {
            this.e.s.p("open_good");
        } else if (value <= 25000) {
            this.e.s.p("open_good");
        } else if (value <= 750000) {
            this.e.s.p("open_bad");
        } else if (value === 1000000) {
            this.e.s.p("open_million");
        }
        
    }
    
    hideRevealWindow() {
        const revealWindow = document.getElementById('caseRevealWindow');
        
        // Use GSAP for smooth fade out
        gsap.to(revealWindow, {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            duration: 0.1,
            ease: "power2.in",
            onComplete: () => {
                revealWindow.style.display = 'none';
                
                // Reset action back to "choose" so player can click another case
                this.action = "choose";
                //console.log("Reveal window hidden, action reset to 'choose'");
            }
        });
        
        // If first action button has been used, ensure it's properly styled
        if (this.firstActionButtonUsed) {
            const actionButtons = document.querySelectorAll('.action-button');
            if (actionButtons[0]) {
                // No opacity changes - CSS handles the styling
            }
        }
    }
    
    greyOutValue(value, caseObj) {
        // Use the direct cell reference stored in the case object
        if (caseObj && caseObj.bottomPanelCell) {
            caseObj.bottomPanelCell.style.opacity = "0.3";
            caseObj.bottomPanelCell.style.color = "#999";
            ////console.log(`Greyed out cell for case ${caseObj.caseNumber} with value ${caseObj.bottomPanelCell.textContent}`);
        }
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    updateDealValue() {
        // Get remaining cases (not opened)
        const remainingCases = this.cases.filter(caseObj => caseObj.action === "ready");
        
        // Calculate average value of remaining cases
        let totalValue = 0;
        let validCaseCount = 0;
        
        remainingCases.forEach(caseObj => {
            if (caseObj.value !== "CLUE") {
                totalValue += caseObj.value;
                validCaseCount++;
            }
        });
        
        if (validCaseCount > 0) {
            const averageValue = totalValue / validCaseCount;
            
            // Apply multiplier based on number of cases opened
            const openedCases = this.cases.filter(caseObj => caseObj.action === "opened").length;
            let multiplier = 1.0;
            
            if (openedCases < 8) {
                multiplier = 0.5; // Under 8 cases open: multiply by 0.5
            } else if (openedCases >= 8 && openedCases <= 14) {
                multiplier = 0.66; // 8-14 cases open: multiply by 0.66
            } else if (openedCases >= 15 && openedCases <= 19) {
                multiplier = 0.75; // 15-19 cases open: multiply by 0.75
            } else if (openedCases === 23) {
                multiplier = 1.0; // All cases open except 1: multiply by 1.0
            }
            
            let dealValue = Math.round(averageValue * multiplier);
            
            // Add time bonus if game has started
            if (this.gameStarted) {
                dealValue += this.timeBonus;
            }
            
            // Update the deal button text
            const dealButton = document.getElementById('caseValueDiv');
            if (dealButton) {
                dealButton.textContent = `TAKE DEAL: ${dealValue.toLocaleString()}`;
            }
        } else {
            const dealButton = document.getElementById('caseValueDiv');
            if (dealButton) {
                dealButton.textContent = "TAKE DEAL: 0";
            }
        }
    }
    
    showClueWindow(showNewLabels = false) {
        const clueList = document.getElementById('clueList');
        const noCluesMessage = document.getElementById('noCluesMessage');

        this.e.s.p("click1");
                this.e.s.p("coin");
        
        // Check if elements exist before proceeding
        if (!clueList || !noCluesMessage) {
            return;
        }
        
        if (this.cluesFound.length === 0) {
            noCluesMessage.style.display = 'block';
        } else {
            noCluesMessage.style.display = 'none';
            
            // Clear existing clues and add current ones
            clueList.innerHTML = '';
            this.cluesFound.forEach((clue, index) => {
                const clueItem = document.createElement('div');
                clueItem.className = 'clue-item';
                // No inline styling - CSS handles everything
                
                // Add "NEW" label for recently found clues (only if showNewLabels is true and it's the latest)
                const isNew = showNewLabels && index === this.cluesFound.length - 1;
                if (isNew) {
                    const newLabel = document.createElement('div');
                    newLabel.className = 'new-clue-label';
                    newLabel.textContent = 'NEW';
                    clueItem.appendChild(newLabel);
                }
                
                const clueText = document.createElement('div');
                // Convert \n to <br> tags for proper line breaks in HTML
                const formattedClue = clue.replace(/\n/g, '<br>');
                clueText.innerHTML = formattedClue;
                clueItem.appendChild(clueText);
                
                clueList.appendChild(clueItem);
            });
        }
        
        const clueWindow = document.getElementById('clueWindow');
        if (clueWindow) {
            // Show the window first
            clueWindow.style.display = 'flex';
            
            // Use GSAP for smooth, reliable animation
            gsap.fromTo(clueWindow, 
                { 
                    opacity: 0,
                    backdropFilter: 'blur(0px)'
                },
                {
                    opacity: 1,
                    backdropFilter: 'blur(10px)',
                    duration: 0.15,
                    ease: "power2.out"
                }
            );
        }
    }
    
    hideClueWindow() {
        const clueWindow = document.getElementById('clueWindow');
        
        // Use GSAP for smooth fade out
        gsap.to(clueWindow, {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            duration: 0.1,
            ease: "power2.in",
            onComplete: () => {
                clueWindow.style.display = 'none';
            }
        });
        
        // If first action button has been used, ensure it's properly styled
        if (this.firstActionButtonUsed) {
            const actionButtons = document.querySelectorAll('.action-button');
            if (actionButtons[0]) {
                // No opacity changes - CSS handles the styling
            }
        }
    }
    
    showClueRevealWindow(clue) {
        // Update the case reveal window for clues
        document.getElementById('caseRevealTitle').textContent = 'CLUE FOUND!';
        document.getElementById('caseRevealValue').textContent = 'CLUE';
        document.getElementById('caseRevealClose').textContent = 'SEE CLUE';
        
        // Change the close button behavior for clues
        const closeButton = document.getElementById('caseRevealClose');
        closeButton.onclick = () => {
            this.hideRevealWindow();
            this.showClueWindow(true); // Show NEW labels when coming from case reveal
        };
        
        document.getElementById('caseRevealWindow').style.display = 'flex';
        this.action = "showing";
    }
    
    getClue(addIt) {
        // Generic function to get a random clue
        if (this.availableClues.length === 0) {
            return "No more clues available";
        }
        
        // Select a random clue from available clues
        const randomIndex = Math.floor(Math.random() * this.availableClues.length);
        const selectedClueType = this.availableClues[randomIndex];
        
        //console.log("selectedClueType", selectedClueType);
        //console.log(`getClue: Available clues before selection: ${this.availableClues.join(', ')}`);
        
        // Call the appropriate function based on the clue type
        let clueText = "";
        switch (selectedClueType) {
            case "quadrant":
                clueText = this.lowestQuadrant();
                break;
            case "oddEven":
                clueText = this.oddEven();
                break;
            case "columns":
                clueText = this.lowestColumns();
                break;
            case "row":
                clueText = this.highValueRow();
                break;
            case "medium":
                clueText = this.mediumValueCases();
                break;
            case "halfTopBottomLow":
                clueText = this.halfTopBottomLow();
                break;
            case "halfSideLow":
                clueText = this.halfSideLow();
                break;
            case "pick3":
                clueText = this.pick3LowHigh();
                break;
            case "nextTo":
                clueText = this.nextToHigh();
                break;
            case "lowClue":
                clueText = this.lowClue();
                break;
            case "doubleClue":
                //console.log("doubleClue");
            // Remove doubleClue from available clues BEFORE calling the function
            // to prevent it from being selected again during the double clue process
            this.availableClues.splice(randomIndex, 1);
            //console.log(`Removed doubleClue from available clues. Remaining: ${this.availableClues.length}`);
                clueText = this.doubleClue();
                break;
            default:
                clueText = "Unknown clue type";
        }
        
        // Remove the specific clue instance that was selected (not all instances of that type)
        // Note: doubleClue is handled separately in its case statement
        if (selectedClueType !== "doubleClue") {
            // Remove only the specific instance at the selected index
        this.availableClues.splice(randomIndex, 1);
            //console.log(`Removed clue instance "${selectedClueType}" at index ${randomIndex}. Remaining: ${this.availableClues.length}`);
            
        if(addIt===true){
            this.cluesFound.push(clueText);
            
            // Play clue sound when clue is actually received
            
            }
        }
        
        return clueText;
    }
    
    
    giveFreeClue() {
        // Check if free clue has already been used
        if (this.freeClueUsed) {
            //console.log("Free clue already used, ignoring request");
            return;
        }
        
        // Mark free clue as used
        this.freeClueUsed = true;
        this.markButtonAsUsed('freeClue');
        
        // Check if there are available clues
        if (this.availableClues.length > 0) {
            // Get a random clue
            const clueText = this.getClue(true);
            
            // Directly open the clue log instead of showing popup
            this.showClueWindow(true);
        } else {
            // No more clues available, but still open clue window to show "no more clues"
            this.showClueWindow(true);
        }
        
        // Disable the first action button after use
        const actionButtons = document.querySelectorAll('.action-button');
        if (actionButtons[0]) {
            actionButtons[0].disabled = true;
            // No opacity changes - CSS handles the styling
            actionButtons[0].style.cursor = "not-allowed";
            // Mark as permanently used
            this.firstActionButtonUsed = true;
            // Add a property to the button element itself for extra protection
            actionButtons[0].permanentlyUsed = true;
        }
    }
    
    showMessagePopup(message) {
        // Create popup element
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(to bottom, #333333, #000000);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            border: 1px solid #FFD700;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            text-align: center;
            min-width: 225px;
        `;
        popup.textContent = message;
        
        // Add to page
        document.body.appendChild(popup);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 3000);
    }
    
    formatNumberWithCommas(value) {
        // Format numbers with commas (e.g., 1000000 -> 1,000,000)
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        return value; // Return as-is if not a number (e.g., "CLUE")
    }

    showCaseValue(caseObj, indicator) {
        // Show the case value in the indicator
        indicator.textContent = this.formatNumberWithCommas(caseObj.value);
        indicator.style.display = 'flex';
        
        // Dynamically set indicator width based on case image width
        this.adjustIndicatorWidth(indicator, caseObj.domRef);
        
        // Ensure text fits by adjusting font size if needed
        this.adjustIndicatorFontSize(indicator);
        
        // Prevent further clicks
        indicator.style.pointerEvents = 'none';
    }
    
    adjustIndicatorFontSize(indicator) {
        // Get the indicator dimensions
        const rect = indicator.getBoundingClientRect();
        const maxWidth = rect.width;
        const maxHeight = rect.height;
        
        // Start with the CSS font size
        let fontSize = parseInt(window.getComputedStyle(indicator).fontSize);
        
        // Create a temporary span to measure text dimensions
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-family: 'Montserrat', sans-serif;
            font-weight: bold;
        `;
        tempSpan.textContent = indicator.textContent;
        document.body.appendChild(tempSpan);
        
        // Reduce font size until text fits
        while (fontSize > 6 && (tempSpan.offsetWidth > maxWidth || tempSpan.offsetHeight > maxHeight)) {
            fontSize--;
            tempSpan.style.fontSize = fontSize + 'px';
        }
        
        // Clean up
        document.body.removeChild(tempSpan);
        
        // Apply the adjusted font size
        indicator.style.fontSize = fontSize + 'px';
    }
    
    adjustIndicatorWidth(indicator, caseButton) {
        // Get the actual visual width of the case image as it appears on screen
        const caseImage = caseButton.querySelector('img');
        if (!caseImage) return;
        
        const imageRect = caseImage.getBoundingClientRect();
        const imageWidth = imageRect.width;
        
        // Set indicator width to exactly match the image width
        indicator.style.width = (imageWidth*.8) + 'px';
        
        // Keep it centered
        indicator.style.left = '50%';
        indicator.style.transform = 'translate(-50%, 0px)';
    }
    
    giveInitialFreeClue() {
        // Give a free clue at game start without any restrictions
        if (this.availableClues.length > 0) {
            // Get a random clue
            const clueText = this.getClue(true);
            
            // Show the clue menu instead of just a popup with a 2 second delay
            setTimeout(() => {
                this.showClueWindow(true);
            }, 2000);
            
            // Play clue sound
            this.e.s.p("clue");
        } else {
            // No clues available for initial free clue
            this.showFreeCluePopup("No more clues");
        }
    }
    
        lowestQuadrant() {
        // Divide the cases into quadrants: upper left, upper right, lower left, lower right
        // Count how many low cases are in each quadrant, then say which is the LOWEST quadrant

        // Define quadrants (2x2 grid layout)
        const upperLeft = [1, 2, 5, 6, 9, 10]; // Top left 2x3
        const upperRight = [3, 4, 7, 8, 11, 12]; // Top right 2x3
        const lowerLeft = [13, 14, 17, 18, 21, 22]; // Bottom left 2x3
        const lowerRight = [15, 16, 19, 20, 23, 24]; // Bottom right 2x3

        // Count low numbers (1-7) in each quadrant
        let upperLeftLowCount = 0;
        let upperRightLowCount = 0;
        let lowerLeftLowCount = 0;
        let lowerRightLowCount = 0;

        this.cases.forEach(caseObj => {
            if (caseObj.value >= 1 && caseObj.value <= 500) {
                if (upperLeft.includes(caseObj.caseNumber)) {
                    upperLeftLowCount++;
                } else if (upperRight.includes(caseObj.caseNumber)) {
                    upperRightLowCount++;
                } else if (lowerLeft.includes(caseObj.caseNumber)) {
                    lowerLeftLowCount++;
                } else if (lowerRight.includes(caseObj.caseNumber)) {
                    lowerRightLowCount++;
                }
            }
        });

        //console.log(`Upper Left Quadrant: ${upperLeftLowCount} low cases`);
        //console.log(`Upper Right Quadrant: ${upperRightLowCount} low cases`);
        //console.log(`Lower Left Quadrant: ${lowerLeftLowCount} low cases`);
        //console.log(`Lower Right Quadrant: ${lowerRightLowCount} low cases`);

        // Find the quadrant with the most low cases
        const quadrantCounts = [
            { name: "upper left", count: upperLeftLowCount },
            { name: "upper right", count: upperRightLowCount },
            { name: "lower left", count: lowerLeftLowCount },
            { name: "lower right", count: lowerRightLowCount }
        ];

        // Sort by count (highest first)
        quadrantCounts.sort((a, b) => b.count - a.count);

        // Check for different scenarios
        if (quadrantCounts[0].count > quadrantCounts[1].count) {
            // Clear winner
            return `The ${quadrantCounts[0].name} quadrant has the most <span style="color: green; font-weight: bold;">LOW </span>number cases`;
        } else if (quadrantCounts[0].count === quadrantCounts[1].count && quadrantCounts[1].count > quadrantCounts[2].count) {
            // 2-way tie for highest
            return `The ${quadrantCounts[0].name} and ${quadrantCounts[1].name} quadrants has 3 <span style="color: green; font-weight: bold;">LOW </span>cases`;
        } else if (quadrantCounts[0].count === quadrantCounts[1].count && quadrantCounts[1].count === quadrantCounts[2].count) {
            // 3-way tie for highest, find the one with fewest
            const lowestQuadrant = quadrantCounts[3];
            return `The ${lowestQuadrant.name} quadrant has the fewest number of <span style="color: green; font-weight: bold;">LOW </span>numbers`;
        } else {
            // All quadrants have the same count
            return "All quadrants have the same number of <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        }
    }
    
    oddEven() {
        // Count low numbers (1-7) in odd and even numbered cases
        let oddLowCount = 0;
        let evenLowCount = 0;

        this.cases.forEach(caseObj => {
            if (caseObj.value >= 1 && caseObj.value <= 500) {
                if (caseObj.caseNumber % 2 === 1) {
                    // Odd case number
                    oddLowCount++;
                } else {
                    // Even case number
                    evenLowCount++;
                }
            }
        });

        //console.log(`Odd numbered cases: ${oddLowCount} low cases`);
        //console.log(`Even numbered cases: ${evenLowCount} low cases`);

        // Determine which has more low numbers
        if (oddLowCount > evenLowCount) {
            return "There are more <span style=\"color: green; font-weight: bold;\">LOW </span>numbers in ODD numbered cases.";
        } else {
            return "There are more <span style=\"color: green; font-weight: bold;\">LOW </span>numbers in EVEN numbered cases";
        }
    }
    
    lowestColumns() {
        // Divide the cases into columns: column 1, column 2, column 3, column 4
        // Count how many low cases are in each column, then say which is the LOWEST column

        // Define columns (4x6 grid layout)
        const column1 = [1, 5, 9, 13, 17, 21]; // First column
        const column2 = [2, 6, 10, 14, 18, 22]; // Second column
        const column3 = [3, 7, 11, 15, 19, 23]; // Third column
        const column4 = [4, 8, 12, 16, 20, 24]; // Fourth column

        // Count low numbers (1-7) in each column
        let column1LowCount = 0;
        let column2LowCount = 0;
        let column3LowCount = 0;
        let column4LowCount = 0;

        this.cases.forEach(caseObj => {
            if (caseObj.value >= 1 && caseObj.value <= 500) {
                if (column1.includes(caseObj.caseNumber)) {
                    column1LowCount++;
                } else if (column2.includes(caseObj.caseNumber)) {
                    column2LowCount++;
                } else if (column3.includes(caseObj.caseNumber)) {
                    column3LowCount++;
                } else if (column4.includes(caseObj.caseNumber)) {
                    column4LowCount++;
                }
            }
        });

        //console.log(`Column 1: ${column1LowCount} low cases`);
        //console.log(`Column 2: ${column2LowCount} low cases`);
        //console.log(`Column 3: ${column3LowCount} low cases`);
        //console.log(`Column 4: ${column4LowCount} low cases`);

        // Find the column with the most low cases
        const columnCounts = [
            { name: "column 1", count: column1LowCount },
            { name: "column 2", count: column2LowCount },
            { name: "column 3", count: column3LowCount },
            { name: "column 4", count: column4LowCount }
        ];

        // Sort by count (highest first)
        columnCounts.sort((a, b) => b.count - a.count);

        // Check for different scenarios
        if (columnCounts[0].count > columnCounts[1].count) {
            // Clear winner
            return `The ${columnCounts[0].name} has the MOST <span style="color: green; font-weight: bold;">LOW </span>number cases`;
        } else if (columnCounts[0].count === columnCounts[1].count && columnCounts[1].count > columnCounts[2].count) {
            // 2-way tie for highest
            return `The ${columnCounts[0].name} and ${columnCounts[1].name} has 3 <span style="color: green; font-weight: bold;">LOW </span>cases`;
        } else if (columnCounts[0].count === columnCounts[1].count && columnCounts[1].count === columnCounts[2].count) {
            // 3-way tie for highest, find the one with fewest
            const lowestColumn = columnCounts[3];
            return `The ${lowestColumn.name} has the FEWEST number of <span style="color: green; font-weight: bold;">LOW </span>numbers`;
        } else {
            // All columns have the same count
            return "All columns have the same number of <span style=\"color: green; font-weight: bold;\">LOW </span>cases";
        }
    }
    
    highValueRow() {
        // Find rows that have at least one high value case and tell the player the count in a random one
        
        // Define rows (4x6 grid layout)
        const row1 = [1, 2, 3, 4]; // First row
        const row2 = [5, 6, 7, 8]; // Second row
        const row3 = [9, 10, 11, 12]; // Third row
        const row4 = [13, 14, 15, 16]; // Fourth row
        const row5 = [17, 18, 19, 20]; // Fifth row
        const row6 = [21, 22, 23, 24]; // Sixth row

        // Find rows that have at least one high value case
        const rowsWithHighValues = [];
        
        // Check each row for high value cases
        [row1, row2, row3, row4, row5, row6].forEach((rowCases, rowIndex) => {
            let highValueCount = 0;
            
            // Count high value cases in this row
            this.cases.forEach(caseObj => {
                if (caseObj.value >= 50000 && caseObj.value !== "CLUE" && rowCases.includes(caseObj.caseNumber)) {
                    highValueCount++;
                }
            });
            
            // If this row has at least one high value case, add it to our array
            if (highValueCount > 0) {
                rowsWithHighValues.push({
                    rowNumber: rowIndex + 1,
                    highValueCount: highValueCount
                });
            }
        });

        // If no rows have high value cases
        if (rowsWithHighValues.length === 0) {
            return "No rows found with <span style=\"color: red; font-weight: bold;\">HIGH </span>value cases.";
        }

        // Pick a random row from those that have high value cases
        const randomRow = rowsWithHighValues[Math.floor(Math.random() * rowsWithHighValues.length)];
        
        //console.log(`Row ${randomRow.rowNumber} has ${randomRow.highValueCount} high value cases`);

        return `Row ${randomRow.rowNumber} has ${randomRow.highValueCount} <span style="color: red; font-weight: bold;">HIGH </span>value case${randomRow.highValueCount === 1 ? '' : 's'}.`;
    }
    
    mediumValueCases() {
        // Find 3 cases with values between 2000-25000 and tell the user which cases they are
        
        // Find cases with medium values (2000-25000)
        const mediumValueCases = this.cases.filter(caseObj => 
            caseObj.value >= 2000 && caseObj.value <= 25000 && caseObj.value !== "CLUE"
        );

        if (mediumValueCases.length < 3) {
            return `Only ${mediumValueCases.length} <span style="color: blue; font-weight: bold;">MEDIUM </span>value cases found (need 3)`;
        }

        // Pick 3 random medium value cases
        const shuffled = [...mediumValueCases];
        this.shuffleArray(shuffled);
        const selectedCases = shuffled.slice(0, 3);

        // Sort by case number for consistent output
        selectedCases.sort((a, b) => a.caseNumber - b.caseNumber);

        //console.log(`Medium value cases found: ${selectedCases.map(c => `${c.caseNumber}(${c.value})`).join(', ')}.`);

        return `Case ${selectedCases[0].caseNumber}, ${selectedCases[1].caseNumber}, and ${selectedCases[2].caseNumber} are <span style="color: blue; font-weight: bold;">MEDIUM </span>value.`;
    }
    
    halfTopBottomLow() {
        // Count how many cases with a value less than 500 are on the top half and the bottom half
        
        // Define halves (4x6 grid layout)
        const topHalf = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // First 3 rows
        const bottomHalf = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]; // Last 3 rows

        // Count low numbers (< 500) in each half
        let topHalfLowCount = 0;
        let bottomHalfLowCount = 0;

        this.cases.forEach(caseObj => {
            if (caseObj.value <= 500 && caseObj.value !== "CLUE") {
                if (topHalf.includes(caseObj.caseNumber)) {
                    topHalfLowCount++;
                } else if (bottomHalf.includes(caseObj.caseNumber)) {
                    bottomHalfLowCount++;
                }
            }
        });

        //console.log(`Top Half: ${topHalfLowCount} low cases (< 500)`);
        //console.log(`Bottom Half: ${bottomHalfLowCount} low cases (< 500)`);

        // Determine which half has more low cases
        if (topHalfLowCount > bottomHalfLowCount) {
            return "The TOP half has more <span style=\"color: green; font-weight: bold;\">LOW </span>cases";
        } else if (bottomHalfLowCount > topHalfLowCount) {
            return "The BOTTOM half has more <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        } else {
            return "Both halves have the same number of <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        }
    }
    
    halfSideLow() {
        // Count how many cases with a value less than 500 are on the left half and the right half
        
        // Define halves (4x6 grid layout)
        const leftHalf = [1, 2, 5, 6, 9, 10, 13, 14, 17, 18, 21, 22]; // First 2 columns
        const rightHalf = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24]; // Last 2 columns

        // Count low numbers (< 500) in each half
        let leftHalfLowCount = 0;
        let rightHalfLowCount = 0;

        this.cases.forEach(caseObj => {
            if (caseObj.value <= 500 && caseObj.value !== "CLUE") {
                if (leftHalf.includes(caseObj.caseNumber)) {
                    leftHalfLowCount++;
                } else if (rightHalf.includes(caseObj.caseNumber)) {
                    rightHalfLowCount++;
                }
            }
        });

        //console.log(`Left Half: ${leftHalfLowCount} low cases (< 500)`);
        //console.log(`Right Half: ${rightHalfLowCount} low cases (< 500)`);

        // Determine which half has more low cases
        if (leftHalfLowCount > rightHalfLowCount) {
            return "The LEFT half has more <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        } else if (rightHalfLowCount > leftHalfLowCount) {
            return "The RIGHT half has more <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        } else {
            return "Both halves have the same number of <span style=\"color: green; font-weight: bold;\">LOW </span>cases.";
        }
    }
    
    pick3LowHigh() {
        // Pick two low numbers and one high number, then order them by case number
        
        // Find cases with low values (<= 500) and high values (>= 50000)
        const lowValueCases = this.cases.filter(caseObj => 
            caseObj.value <= 500 && caseObj.value !== "CLUE"
        );
        
        const highValueCases = this.cases.filter(caseObj => 
            caseObj.value >= 50000 && caseObj.value !== "CLUE"
        );

        if (lowValueCases.length < 2) {
            return `Only ${lowValueCases.length} <span style="color: green; font-weight: bold;">LOW </span>value cases found (need 2).`;
        }
        
        if (highValueCases.length < 1) {
            return "No <span style=\"color: red; font-weight: bold;\">HIGH </span>value cases found (need 1).";
        }

        // Pick 2 random low value cases
        const shuffledLow = [...lowValueCases];
        this.shuffleArray(shuffledLow);
        const selectedLowCases = shuffledLow.slice(0, 2);

        // Pick 1 random high value case
        const shuffledHigh = [...highValueCases];
        this.shuffleArray(shuffledHigh);
        const selectedHighCase = shuffledHigh[0];

        // Combine all selected cases and sort by case number
        const allSelectedCases = [...selectedLowCases, selectedHighCase];
        allSelectedCases.sort((a, b) => a.caseNumber - b.caseNumber);

        //console.log(`Pick3 Low/High: Low cases ${selectedLowCases.map(c => `${c.caseNumber}(${c.value})`).join(', ')}, High case ${selectedHighCase.caseNumber}(${selectedHighCase.value})`);
        //console.log(`Ordered by case number: ${allSelectedCases.map(c => c.caseNumber).join(', ')}`);

        return `Case ${allSelectedCases[0].caseNumber}, ${allSelectedCases[1].caseNumber}, and ${allSelectedCases[2].caseNumber} contain two <span style="color: green; font-weight: bold;">LOW </span>numbers and one <span style="color: red; font-weight: bold;">HIGH </span>number.`;
    }
    
    nextToHigh() {
        // Find all cases with high values (>= 50000)
        const highValueCases = this.cases.filter(caseObj => 
            caseObj.value >= 50000 && caseObj.value !== "CLUE"
        );

        if (highValueCases.length === 0) {
            return "No high value cases found";
        }

        // Get all case numbers that have high values
        const highValueCaseNumbers = highValueCases.map(caseObj => caseObj.caseNumber);
        
        // Find a case number that hasn't been used as a "next to" number
        const availableCaseNumbers = [];
        for (let caseNum = 1; caseNum <= 24; caseNum++) {
            if (!this.usedNextToNumbers.has(caseNum)) {
                availableCaseNumbers.push(caseNum);
            }
        }
        
        if (availableCaseNumbers.length === 0) {
            // If all case numbers have been used, try to find any case with adjacent high values
            let foundCase = false;
            let randomCaseNum;
            let highValueCount = 0;
            
            for (let caseNum = 1; caseNum <= 24; caseNum++) {
                highValueCount = this.countAdjacentHighValues(caseNum, highValueCaseNumbers);
                if (highValueCount > 0) {
                    randomCaseNum = caseNum;
                    foundCase = true;
                    break;
                }
            }
            
            if (foundCase) {
                //console.log(`NextTo: Case ${randomCaseNum} has ${highValueCount} HIGH value cases adjacent to it (all cases used).`);
                return this.formatHighValueCount(highValueCount, randomCaseNum);
            } else {
                return "No cases found with adjacent HIGH value cases.";
            }
        }
        
        // Pick a random available case number and check if it has adjacent high values
        let attempts = 0;
        let randomCaseNum;
        let highValueCount = 0;
        
        // Try to find a case number that has at least one adjacent high value
        while (attempts < availableCaseNumbers.length && highValueCount === 0) {
            randomCaseNum = availableCaseNumbers[Math.floor(Math.random() * availableCaseNumbers.length)];
            highValueCount = this.countAdjacentHighValues(randomCaseNum, highValueCaseNumbers);
            attempts++;
            
            // If this case has no adjacent high values, remove it from available and try another
            if (highValueCount === 0) {
                availableCaseNumbers.splice(availableCaseNumbers.indexOf(randomCaseNum), 1);
            }
        }
        
        // If we found a case with adjacent high values
        if (highValueCount > 0) {
            // Mark this case number as used
            this.usedNextToNumbers.add(randomCaseNum);
            
            //console.log(`NextTo: Case ${randomCaseNum} has ${highValueCount} HIGH value cases adjacent to it.`);
            
            return this.formatHighValueCount(highValueCount, randomCaseNum);
        } else {
            // If no cases have adjacent high values, return a message
            return "No cases found with adjacent HIGH value cases.";
        }
        
        // Calculate adjacent case numbers (4x6 grid)
        const adjacentCases = [];
        const currentCase = randomHighCase.caseNumber;
        
        // Left (if not in first column)
        if (currentCase % 4 !== 1) {
            adjacentCases.push(currentCase - 1);
        }
        
        // Right (if not in last column)
        if (currentCase % 4 !== 0) {
            adjacentCases.push(currentCase + 1);
        }
        
        // Top (if not in first row)
        if (currentCase > 4) {
            adjacentCases.push(currentCase - 4);
        }
        
        // Bottom (if not in last row)
        if (currentCase <= 20) {
            adjacentCases.push(currentCase + 4);
        }

        if (adjacentCases.length === 0) {
            return `Case ${currentCase} has no adjacent cases`;
        }

        // Pick a random adjacent case that hasn't been used before
        const availableAdjacentCases = adjacentCases.filter(caseNum => !this.usedNextToNumbers.has(caseNum));
        
        if (availableAdjacentCases.length === 0) {
            // If all adjacent cases have been used, pick any adjacent case
        const randomAdjacentCase = adjacentCases[Math.floor(Math.random() * adjacentCases.length)];
            //console.log(`NextTo: High case ${currentCase} (value: ${randomHighCase.value}) has adjacent case ${randomAdjacentCase} (all adjacent cases used).`);
            return `There is a HIGH number next to the number ${randomAdjacentCase}.`;
        }
        
        // Pick from available (unused) adjacent cases
        const randomAdjacentCase = availableAdjacentCases[Math.floor(Math.random() * availableAdjacentCases.length)];
        
        // Mark this number as used
        this.usedNextToNumbers.add(randomAdjacentCase);
        
        //console.log(`NextTo: High case ${currentCase} (value: ${randomHighCase.value}) has adjacent case ${randomAdjacentCase}.`);

        return `There is a HIGH number next to the number ${randomAdjacentCase}.`;
    }
    
    lowClue() {
        // Pick a box with a low number and a box with a clue
        
        // Find cases with low values (<= 500)
        const lowValueCases = this.cases.filter(caseObj => 
            caseObj.value <= 500 && caseObj.value !== "CLUE"
        );
        
        // Find cases with clues
        const clueCases = this.cases.filter(caseObj => 
            caseObj.value === "CLUE"
        );

        if (lowValueCases.length === 0) {
            return "No <span style=\"color: green; font-weight: bold;\">LOW </span>value cases found";
        }
        
        if (clueCases.length === 0) {
            return "No clue cases found";
        }

        // Pick a random low value case
        const randomLowCase = lowValueCases[Math.floor(Math.random() * lowValueCases.length)];
        
        // Pick a random clue case
        const randomClueCase = clueCases[Math.floor(Math.random() * clueCases.length)];

        //console.log(`LowClue: Low case ${randomLowCase.caseNumber} (value: ${randomLowCase.value}), Clue case ${randomClueCase.caseNumber}`);

        return `Box ${randomLowCase.caseNumber} and ${randomClueCase.caseNumber} have a <span style="color: green; font-weight: bold;">LOW </span>number and a CLUE.`;
    }
    
    countAdjacentHighValues(caseNum, highValueCaseNumbers) {
        // Calculate adjacent case numbers (4x6 grid)
        const adjacentCases = [];
        
        // Left (if not in first column)
        if (caseNum % 4 !== 1) {
            adjacentCases.push(caseNum - 1);
        }
        
        // Right (if not in last column)
        if (caseNum % 4 !== 0) {
            adjacentCases.push(caseNum + 1);
        }
        
        // Top (if not in first row)
        if (caseNum > 4) {
            adjacentCases.push(caseNum - 4);
        }
        
        // Bottom (if not in last row)
        if (caseNum <= 20) {
            adjacentCases.push(caseNum + 4);
        }
        
        // Count how many of these adjacent cases have high values
        return adjacentCases.filter(adjacentCaseNum => 
            highValueCaseNumbers.includes(adjacentCaseNum)
        ).length;
    }
    
    formatHighValueCount(count, caseNum) {
        if (count === 1) {
            return `There is 1 <span style="color: red; font-weight: bold;">HIGH </span>value case next to the number ${caseNum}.`;
        } else {
            return `There are ${count} <span style="color: red; font-weight: bold;">HIGH </span>value cases next to the number ${caseNum}.`;
        }
    }
    
    doubleClue() {
        //console.log(`DoubleClue: Function called. Available clues at start: ${this.availableClues.join(', ')}`);
        
        // Create a string called doubleClueString
        // Start it by saying DOUBLE CLUE! then br br
        // Then pick and remove 2 more clues from the available clues
        // Add the result strings of those two clues to the double clue string
        // Make sure you put an extra br between them so they don't run together
        
        let doubleClueString = "DOUBLE CLUE!<br><br>";
        
        // Check if we have at least 2 clues available (excluding the current "doubleClue")
        const availableCluesForDouble = this.availableClues.filter(clueType => clueType !== "doubleClue");
        
        //console.log(`DoubleClue: Available clues for double clue (excluding doubleClue): ${availableCluesForDouble.join(', ')}`);
        //console.log(`DoubleClue: Total available clues: ${this.availableClues.join(', ')}`);
        
        if (availableCluesForDouble.length < 2) {
            return "DOUBLE CLUE!<br><br>Not enough clues available for double clue.";
        }
        
        // Get the first clue using the generic function without adding to array
        //console.log(`DoubleClue: Getting first clue...`);
        const firstClueText = this.getClue(false);
        
        // Get the second clue using the generic function without adding to array
        //console.log(`DoubleClue: Getting second clue...`);
        const secondClueText = this.getClue(false);
        
        // Add both clues to the cluesFound array manually
        // this.cluesFound.push(firstClueText);
        // this.cluesFound.push(secondClueText);
        
        // Build the final double clue string
        doubleClueString += firstClueText + "<br><br>" + secondClueText;
        
        //console.log(`DoubleClue: Generated two clues using getClueWithoutAdding() function`);
        //console.log(`First clue: ${firstClueText}`);
        //console.log(`Second clue: ${secondClueText}`);
        //console.log(`DoubleClue: Available clues after double clue: ${this.availableClues.length}`);

        this.cluesFound.push(doubleClueString);
        
        return doubleClueString;
    }
    
    handleDealClick() {
        // Calculate time bonus before stopping the timer
        const currentTimeBonus = this.gameStarted ? this.timeBonus : 0;
        
        // Stop the timer since deal is being taken
        this.gameStarted = false;
        
        // Calculate the current deal value including time bonus
        const remainingCases = this.cases.filter(caseObj => caseObj.action === "ready");
        
        // Calculate average value of remaining cases
        let totalValue = 0;
        let validCaseCount = 0;
        
        remainingCases.forEach(caseObj => {
            if (caseObj.value !== "CLUE") {
                totalValue += caseObj.value;
                validCaseCount++;
            }
        });
        
        if (validCaseCount > 0) {
            const averageValue = totalValue / validCaseCount;
            
            // Apply multiplier based on number of cases opened
            const openedCases = this.cases.filter(caseObj => caseObj.action === "opened").length;
            let multiplier = 1.0;
            
            if (openedCases < 8) {
                multiplier = 0.5; // Under 8 cases open: multiply by 0.5
            } else if (openedCases >= 8 && openedCases <= 14) {
                multiplier = 0.66; // 8-14 cases open: multiply by 0.66
            } else if (openedCases >= 15 && openedCases <= 19) {
                multiplier = 0.75; // 15-19 cases open: multiply by 0.75
            } else if (openedCases === 23) {
                multiplier = 1.0; // All cases open except 1: multiply by 1.0
            }
            
            let dealValue = Math.round(averageValue * multiplier);
            
            // Add the time bonus we calculated earlier
            dealValue += currentTimeBonus;
            
            // Round the final deal value
            dealValue = Math.round(dealValue);
            
            // Show all case values in indicators
            this.revealAllCaseValues();
            
            // Disable action buttons
            this.disableActionButtons([0, 1, 2]);
            
            // Disable all case buttons
            this.disableAllCaseButtons();
            
            // Show a fancy deal acceptance popup
            this.showDealAcceptancePopup(dealValue);
            
            // Play game end sound based on final amount
            if (dealValue < 100000) {
                this.e.s.p("lose");
            } else {
                this.e.s.p("wincase");
            }
            
            // Disable the deal button after use (but keep it visible)
            const dealButton = document.getElementById('caseValueDiv');
            dealButton.disabled = true;
            dealButton.style.pointerEvents = "none";
            dealButton.style.cursor = "not-allowed";
            dealButton.textContent = `$${dealValue.toLocaleString()}`;
        }
    }
    
    showDealAcceptancePopup(dealValue) {
        // Create golden explosion effect
        this.createGoldenExplosion();
        
        // Flash screen with semi-transparent gold
        this.flashScreenGold();
        
        // Create animated deal amount overlay
        this.createDealAmountOverlay(dealValue);
    }
    
    createGoldenExplosion() {
        // Create explosion container
        const explosion = document.createElement('div');
        explosion.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 15000;
        `;
        document.body.appendChild(explosion);
        
        // Create confetti pieces
        for (let i = 0; i < 100; i++) {
            this.createConfettiPiece(explosion);
        }
        
        // Create spark particles
        for (let i = 0; i < 50; i++) {
            this.createSparkParticle(explosion);
        }
        
        // Remove explosion after animation
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 3000);
    }
    
    createConfettiPiece(container) {
        const confetti = document.createElement('div');
        const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#FF4500'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        confetti.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 2px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        
        container.appendChild(confetti);
        
        // Animate confetti with GSAP
        gsap.to(confetti, {
            duration: 2 + Math.random() * 2,
            x: (Math.random() - 0.5) * 800,
            y: (Math.random() - 0.5) * 600,
            rotation: Math.random() * 720,
            opacity: 0,
            ease: "power2.out",
            delay: Math.random() * 0.5
        });
    }
    
    createSparkParticle(container) {
        const spark = document.createElement('div');
        spark.style.cssText = `
            position: absolute;
            width: 3px;
            height: 3px;
            background: #FFD700;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 0 10px #FFD700;
        `;
        
        container.appendChild(spark);
        
        // Animate spark with GSAP
        gsap.to(spark, {
            duration: 1.5 + Math.random() * 1,
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 300,
            scale: 0,
            opacity: 0,
            ease: "power3.out",
            delay: Math.random() * 0.3
        });
    }
    
    flashScreenGold() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 215, 0, 0.3);
            pointer-events: none;
            z-index: 14000;
        `;
        
        document.body.appendChild(flash);
        
        // Flash effect with GSAP
        gsap.to(flash, {
            duration: 0.3,
            opacity: 0,
            ease: "power2.out",
            onComplete: () => {
                if (flash.parentNode) {
                    flash.parentNode.removeChild(flash);
                }
            }
        });
    }
    
    createDealAmountOverlay(dealValue) {
        // Create black overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 16000;
            opacity: 0;
        `;
        
        // Create deal amount text
        const dealText = document.createElement('div');
        dealText.style.cssText = `
            font-family: 'Montserrat', sans-serif;
            font-size: 72px;
            font-weight: bold;
            color: #FFD700;
            text-align: center;
            text-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
            opacity: 0;
            transform: scale(0.5);
            margin-bottom: 40px;
        `;
        dealText.textContent = `$${dealValue.toLocaleString()}`;
        
        overlay.appendChild(dealText);
        document.body.appendChild(overlay);
        
        // Animate overlay and text with GSAP
        gsap.to(overlay, {
            duration: 0.8,
            opacity: 1,
            ease: "power2.out"
        });
        
        gsap.to(dealText, {
            duration: 1.2,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)"
        });
        
        // Add glowing animation
        gsap.to(dealText, {
            duration: 2,
            color: "#FFFFFF",
            textShadow: "0 0 40px rgba(255, 255, 255, 0.9)",
            ease: "power2.inOut",
            yoyo: true,
            repeat: -1
        });
        
        // Add examine remaining cases button after 2 seconds
        setTimeout(() => {
            this.addExamineRemainingCasesButton(overlay);
        }, 2000);
    }
    
    addExamineRemainingCasesButton(overlay) {
        // Create time bonus text field
        const timeBonusText = document.createElement('div');
        timeBonusText.style.cssText = `
            position: absolute;
            top: 33%;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: bold;
            color: #FFD700;
            text-align: center;
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        `;
        
        // Set text content based on time remaining
        if (this.gameTime <= 0) {
            timeBonusText.textContent = 'RAN OUT OF TIME';
        } else {
            timeBonusText.textContent = `TIME BONUS: $${this.timeBonus.toLocaleString()}`;
        }
        
        overlay.appendChild(timeBonusText);
        
        // Create examine button
        const examineButton = document.createElement('button');
        examineButton.style.cssText = `
            position: absolute;
            bottom: 33%;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            font-weight: bold;
            color: white;
            background: transparent;
            border: none;
            border-radius: 10px;
            padding: 15px 40px;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            white-space: nowrap;
            min-width: 280px;
        `;
        examineButton.textContent = 'EXAMINE REMAINING CASES';
        
        overlay.appendChild(examineButton);
        
        // Animate both elements in simultaneously
        gsap.to([timeBonusText, examineButton], {
            duration: 0.8,
            opacity: 1,
            // y: 0,
            ease: "sine.out"
        });
        
        // Add subtle hover effect (no down state)
        examineButton.addEventListener('mouseenter', () => {
            // examineButton.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        examineButton.addEventListener('mouseleave', () => {
            examineButton.style.background = 'transparent';
        });
        
        // Add click functionality
        examineButton.addEventListener('click', () => {
            this.fadeOutDealOverlay(overlay);
            this.e.s.p("click1");
        });
    }
    
    fadeOutDealOverlay(overlay) {
        // Immediately disable pointer events to prevent interference
        overlay.style.pointerEvents = 'none';
        
        gsap.to(overlay, {
            duration: 0.8,
            opacity: 0,
            ease: "power2.in",
            onComplete: () => {
                // Ensure the overlay is completely removed
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                    //console.log("Deal overlay completely removed from DOM");
                }
                
                // Force a small delay to ensure DOM cleanup, then enable clue button
                setTimeout(() => {
                    if (this.gameEnded) {
                        // SIMPLE APPROACH: Just enable the clue button directly
                        const clueButton = document.getElementById('clueButton');
                        if (clueButton) {
                            clueButton.disabled = false;
                            clueButton.style.cursor = "pointer";
                            clueButton.style.pointerEvents = "auto";
                            
                            // Add a simple click handler that will definitely work
                            clueButton.onclick = () => {
                                //console.log("CLUE BUTTON CLICKED AFTER GAME END!");
                                this.showClueWindow(false);
                            };
                            
                            //console.log("Clue button SIMPLY enabled with direct click handler");
                        }
                    }
                }, 100);
            }
        });
    }
    
    revealAllCaseValues() {
        this.cases.forEach(caseObj => {
            const indicator = caseObj.domRef.querySelector('.case-value-indicator');
            if (indicator) {
                // Show the case value
                indicator.textContent = this.formatNumberWithCommas(caseObj.value);
                indicator.style.display = 'flex';
                this.adjustIndicatorFontSize(indicator);
                
                // Change background to red ONLY for cases that are not opened yet
                if (caseObj.action === "ready") {
                    indicator.style.background = 'linear-gradient(to bottom, #ff4444, #cc0000)';
                }
                // Opened cases keep their original gold background
                
                // Prevent further clicks
                indicator.style.pointerEvents = 'none';
            }
        });
    }
    
    forceDealAcceptance() {
        // Force the player to accept the deal when time runs out
        if (this.action === "choose") {
            // Close clue menu if it's open
            this.hideClueWindow();
            
            this.action = "picking";
            this.handleDealClick();
        }
    }
    
    toggleCaseValueDebug() {
        // Toggle between showing case numbers and case values on buttons
        this.debugMode = !this.debugMode;
        
        // this.cases.forEach(caseObj => {
        //     if (this.debugMode) {
        //         // Show case number and value with line break
        //         if (caseObj.action === "opened") {
        //             // For opened cases, show case number and value
        //             caseObj.domRef.innerHTML = `${caseObj.caseNumber}<br>${caseObj.value}`;
        //         } else {
        //             // For unopened cases, show case number and value
        //             caseObj.domRef.innerHTML = `${caseObj.caseNumber}<br>${caseObj.value}`;
        //         }
        //     } else {
        //         // Show case number only
        //         if (caseObj.action === "opened") {
        //             // For opened cases, show case number and value (keep opened state)
        //             if (caseObj.value === "CLUE") {
        //                 caseObj.domRef.innerHTML = `${caseObj.caseNumber}<br>CLUE`;
        //             } else {
        //                 caseObj.domRef.innerHTML = `${caseObj.caseNumber}<br>${caseObj.value}`;
        //             }
        //         } else {
        //             // For unopened cases, show case number only
        //             caseObj.domRef.textContent = caseObj.caseNumber.toString();
        //         }
        //     }
        // });
        
        // //console.log(`Debug mode ${this.debugMode ? 'ON' : 'OFF'} - showing ${this.debugMode ? 'case numbers + values' : 'case numbers only'}`);
    }
    
    showFreeCluePopup(clue) {
        // Create popup element positioned just above the clue button
        const popup = document.createElement('div');
        popup.className = 'free-clue-popup';
        
        // Position just above the clue button, anchored to the right
        const clueButton = document.getElementById('clueButton');
        if (clueButton) {
            const rect = clueButton.getBoundingClientRect();
            // Position popup above the clue button, right-aligned
            popup.style.top = (rect.top - 40) + 'px'; // 40px above the clue button
        } else {
            // Fallback positioning if clue button not found
            popup.style.top = '50%';
            popup.style.transform = 'translateY(-50%)';
        }
        
        // Create text element with blinking animation
        const textElement = document.createElement('span');
        textElement.textContent = 'FREE CLUE!';
        textElement.className = 'free-clue-text';
        popup.appendChild(textElement);
        
        // Add to page
        document.body.appendChild(popup);
        
        // Slide in from right using GSAP
        gsap.to(popup, {
            duration: 0.5,
            ease: "power2.out",
            x: 0,
            onComplete: () => {
                // After 4 seconds, slide out to the right
                setTimeout(() => {
                    gsap.to(popup, {
                        duration: 0.5,
                        ease: "power2.in",
                        x: "100%",
                        onComplete: () => {
                            if (popup.parentNode) {
                                popup.parentNode.removeChild(popup);
                            }
                        }
                    });
                }, 4000);
            }
        });
    }
    
    startPickThree() {
        // Initialize pick 3 mode
        //console.log("startPickThree called - marking PICK 3 button as used");
        this.pickThreeMode = true;
        this.pickedCases = [];
        this.originalAction = this.action;
        this.action = "picking";
        
        // Mark PICK 3 button as used
        this.markButtonAsUsed('pick3');
        
        // Disable other action buttons during pick 3 mode
        this.disableActionButtons([0, 1, 2]); // Disable FREE CLUE, PICK 3, and DOUBLE buttons
        
        //console.log("After marking PICK 3 as used and disabling all buttons:");
        this.logButtonUsageStates();
        this.logActionButtonStates();
        
        // Show persistent instruction popup over bottom section
        this.showPickThreePopup("Pick three cases: the LOWEST value case will be revealed");
        
        // Add temporary click listeners to all unopened cases
        this.cases.forEach(caseObj => {
            if (caseObj.action === "ready") {
                caseObj.domRef.addEventListener('click', () => this.handlePickThreeClick(caseObj), { once: true });
            }
        });
    }
    
    handlePickThreeClick(caseObj) {
        if (!this.pickThreeMode || this.pickedCases.length >= 3) return;
        
        // Add case to picked cases
        this.pickedCases.push(caseObj);
        
        // Visual feedback - highlight the picked case
        caseObj.domRef.style.border = "3px solid #FFD700";
        caseObj.domRef.style.boxShadow = "0 0 10px #FFD700";
        
        //console.log(`Case ${caseObj.caseNumber} picked (${this.pickedCases.length}/3)`);
        
        // Check if we've picked 3 cases
        if (this.pickedCases.length === 3) {
            this.completePickThree();
        }
    }
    
    completePickThree() {
        // Count how many of the picked cases are clues
        const clueCases = this.pickedCases.filter(caseObj => caseObj.value === "CLUE");
        const nonClueCases = this.pickedCases.filter(caseObj => caseObj.value !== "CLUE");
        
        let clueText = "";
        
        if (clueCases.length === 1) {
            // 1 clue case
            const clueCase = clueCases[0];
            const nonClueCaseNumbers = nonClueCases.map(c => c.caseNumber).sort((a, b) => a - b);
            
            // Find the case with the LOWEST value among non-clue cases
            let lowestCase = nonClueCases[0];
            let lowestValue = lowestCase.value;
            
            nonClueCases.forEach(caseObj => {
                if (caseObj.value < lowestValue) {
                    lowestCase = caseObj;
                    lowestValue = caseObj.value;
                }
            });
            
            clueText = `Case ${clueCase.caseNumber} is a CLUE and case ${lowestCase.caseNumber} has the LOWEST value.`;
            
        } else if (clueCases.length === 2) {
            // 2 clue cases
            const clueCaseNumbers = clueCases.map(c => c.caseNumber).sort((a, b) => a - b);
            const nonClueCase = nonClueCases[0];
            
            clueText = `Case ${clueCaseNumbers.join(' and ')} are CLUES.`;
            
        } else if (clueCases.length === 3) {
            // 3 clue cases
            const clueCaseNumbers = clueCases.map(c => c.caseNumber).sort((a, b) => a - b);
            clueText = `All these cases are CLUES.`;
            
        } else {
            // No clue cases - use original logic
            // Find the case with the LOWEST value
            let lowestCase = this.pickedCases[0];
            let lowestValue = lowestCase.value;
            
            this.pickedCases.forEach(caseObj => {
                if (caseObj.value < lowestValue) {
                    lowestCase = caseObj;
                    lowestValue = caseObj.value;
                }
            });
            
            // Create clue text
            const caseNumbers = this.pickedCases.map(c => c.caseNumber).sort((a, b) => a - b);
            clueText = `Of cases ${caseNumbers.join(', ')}, case ${lowestCase.caseNumber} has the LOWEST value.`;
        }
        
        // Add clue to found clues
        this.cluesFound.push(clueText);
        //console.log("New pick 3 clue added:", clueText);
        
        // Remove temporary styling from picked cases
        this.pickedCases.forEach(caseObj => {
            caseObj.domRef.style.border = "";
            caseObj.domRef.style.boxShadow = "";
        });
        
        // Disable the second action button
        const actionButtons = document.querySelectorAll('.action-button');
        if (actionButtons[1]) {
            actionButtons[1].disabled = true;
            // No opacity changes - CSS handles the styling
            actionButtons[1].style.cursor = "not-allowed";
        }
        
        // Exit pick 3 mode
        this.pickThreeMode = false;
        this.pickedCases = [];
        this.action = this.originalAction;
        
        // Re-enable action buttons (respecting usage states)
        this.enableActionButtonsRespectingUsage([0, 2]);
        
        // Hide the pick 3 popup
        this.hidePickThreePopup();
        
        // Automatically open the clue window to show the new clue
        this.showClueWindow(true);
    }
    
    showPickThreePopup(message) {
        // Create persistent popup element over bottom section
        this.pickThreePopup = document.createElement('div');
        this.pickThreePopup.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(to bottom, #333333, #000000);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-family: 'Montserrat', sans-serif;
            font-size: 16px;
            font-weight: bold;
            z-index: 10000;
            border: 1px solid #FFD700;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
            text-align: center;
            min-width: 300px;
        `;
        this.pickThreePopup.textContent = message;
        
        // Add to page
        document.body.appendChild(this.pickThreePopup);
    }
    
    hidePickThreePopup() {
        if (this.pickThreePopup && this.pickThreePopup.parentNode) {
            this.pickThreePopup.parentNode.removeChild(this.pickThreePopup);
            this.pickThreePopup = null;
        }
    }
    
    disableActionButtons(buttonIndices) {
        const actionButtons = document.querySelectorAll('.action-button');
        buttonIndices.forEach(index => {
            if (actionButtons[index]) {
                actionButtons[index].disabled = true;
                // No opacity changes - CSS handles the styling
                actionButtons[index].style.cursor = "not-allowed";
            }
        });
    }
    
    enableActionButtons(buttonIndices) {
        const actionButtons = document.querySelectorAll('.action-button');
        buttonIndices.forEach(index => {
            if (actionButtons[index]) {
                actionButtons[index].disabled = false;
                // No opacity changes - CSS handles the styling
                actionButtons[index].style.cursor = "pointer";
            }
        });
    }
    
    enableActionButtonsRespectingUsage(buttonIndices) {
        // Re-enable action buttons based on their usage state
        //console.log(`enableActionButtonsRespectingUsage called with indices: [${buttonIndices}]`);
        this.logButtonUsageStates();
        this.logActionButtonStates();
        
        const actionButtons = document.querySelectorAll('.action-button');
        buttonIndices.forEach(index => {
            if (actionButtons[index]) {
                let shouldEnable = false;
                
                if (index === 0 && !this.isButtonUsed('freeClue')) {
                    shouldEnable = true;
                    //console.log("FREE CLUE button re-enabled (not used yet)");
                } else if (index === 1 && !this.isButtonUsed('pick3')) {
                    shouldEnable = true;
                    //console.log("PICK 3 button re-enabled (not used yet)");
                } else if (index === 2 && !this.isButtonUsed('double')) {
                    shouldEnable = true;
                    //console.log("DOUBLE button re-enabled (not used yet)");
                } else {
                    //console.log(`Action button ${index} stays disabled (already used)`);
                }
                
                if (shouldEnable) {
                    actionButtons[index].disabled = false;
                    actionButtons[index].style.cursor = "pointer";
                }
            }
        });
        
        //console.log("After re-enabling, button states:");
        this.logActionButtonStates();
    }
    
    disableAllCaseButtons() {
        // Disable all case buttons by removing their click functionality
        this.cases.forEach(caseObj => {
            if (caseObj.domRef) {
                // Remove all click event listeners
                caseObj.domRef.style.pointerEvents = "none";
                caseObj.domRef.style.cursor = "not-allowed";
                // caseObj.domRef.style.opacity = "0.5"; // Removed to keep case buttons fully opaque
                
                // Remove the click event listener by cloning and replacing the element
                const newCaseButton = caseObj.domRef.cloneNode(true);
                caseObj.domRef.parentNode.replaceChild(newCaseButton, caseObj.domRef);
                caseObj.domRef = newCaseButton;
            }
        });
    }
    

    
    startGame() {
        // Hide start button
        const startButton = document.getElementById('startGameButton');
        if (startButton) {
            startButton.style.display = 'none';
        }
        
        // Reset available clues to ensure fresh start (preserve multiple instances of nextTo)
        this.availableClues = [
            "quadrant",
            "oddEven",
            "columns",
            "row",
            "medium",
            "halfTopBottomLow",
            "halfSideLow",
            "pick3",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "nextTo",
            "lowClue",
            "doubleClue"
        ];
        
        // Reset free clue tracking
        this.freeClueUsed = false;
        this.firstActionButtonUsed = false;
        this.gameEnded = false;
        this.usedNextToNumbers.clear(); // Reset used "next to" numbers tracking
        
        // Reset button usage states for new game
        this.resetButtonUsageStates();
        
        // Start the game
        this.gameStarted = true;
        this.action = "choose";
        
        // Re-enable all buttons
        this.enableAllButtonsForGame();
        
        // Create timer display
        this.createTimerDisplay();
        
        // Give player a free clue now that game has started
        this.giveInitialFreeClue();
        
        // Game started - no popup needed
    }
    
    getTimeBonus() {
        return this.timeBonus;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    createTimerDisplay() {
        // Use the existing timerDiv instead of creating a new element
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        const timerDiv = document.getElementById('timerDiv');
        if (timerDiv && this.gameStarted) {
            const timeString = this.formatTime(this.gameTime);
            timerDiv.textContent = timeString;
            
            // Play ticking sound when less than 15 seconds left
            if (this.gameTime <= 15 && this.gameTime > 0) {
                const currentWholeSecond = Math.floor(this.gameTime);
                
                // Only play tick sound if we haven't played it for this second yet
                if (!this.lastTickSecond || this.lastTickSecond !== currentWholeSecond) {
                    this.e.s.p("tick");
                    this.lastTickSecond = currentWholeSecond;
                    //console.log(`🎵 Tick sound played at ${currentWholeSecond} seconds`);
                }
            }
            
            // Update every frame
            requestAnimationFrame(() => this.updateTimerDisplay());
        }
    }
    
    disableAllButtonsForStart() {
        // Disable all action buttons
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach(button => {
            button.disabled = true;
            // No opacity changes - CSS handles the styling
            button.style.cursor = "not-allowed";
        });
        
        // Disable deal button (but keep full opacity)
        const dealButton = document.getElementById('caseValueDiv');
        if (dealButton) {
            dealButton.disabled = true;
            dealButton.style.opacity = "1";
            dealButton.style.cursor = "not-allowed";
        }
        
        // Disable clue button (NEVER disable if game has ended)
        const clueButton = document.getElementById('clueButton');
        if (clueButton) {
            if (this.gameEnded) {
                //console.log("Game has ended, NEVER disabling clue button");
                clueButton.disabled = false;
                clueButton.style.cursor = "pointer";
            } else {
                //console.log("disable clue button");
                clueButton.disabled = true;
                clueButton.style.cursor = "not-allowed";
            }
        }
        
        // Disable all case buttons
        this.cases.forEach(caseObj => {
            if (caseObj.domRef) {
                caseObj.domRef.style.pointerEvents = "none";
                caseObj.domRef.style.cursor = "not-allowed";
                // caseObj.domRef.style.opacity = "0.5"; // Removed to keep case buttons fully opaque
            }
        });
    }
    
    enableAllButtonsForGame() {

        //console.log("enableAllButtonsForGame");
        this.logButtonUsageStates(); // Debug: show current button states

        // Re-enable action buttons based on their usage state
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach((button, index) => {
            if (index === 0 && !this.isButtonUsed('freeClue')) {
                // First action button (FREE CLUE) - only enable if not used
                button.disabled = false;
                button.style.cursor = "pointer";
                //console.log("FREE CLUE button enabled (not used yet)");
            } else if (index === 1 && !this.isButtonUsed('pick3')) {
                // Second action button (PICK 3) - only enable if not used
                button.disabled = false;
                button.style.cursor = "pointer";
                //console.log("PICK 3 button enabled (not used yet)");
            } else if (index === 2 && !this.isButtonUsed('double')) {
                // Third action button (DOUBLE) - only enable if not used
                button.disabled = false;
                button.style.cursor = "pointer";
                //console.log("DOUBLE button enabled (not used yet)");
            } else {
                // Button has been used, it stays disabled
                //console.log(`Action button ${index} stays disabled (already used)`);
            }
        });
        
        // Re-enable deal button (always available)
        const dealButton = document.getElementById('caseValueDiv');
        if (dealButton) {
            dealButton.disabled = false;
            dealButton.style.opacity = "1";
            dealButton.style.cursor = "pointer";
        }
        
        // Re-enable clue button based on game state
        const clueButton = document.getElementById('clueButton');
        if (clueButton) {
            if (this.gameEnded) {
                // If game has ended, always enable clue button for review
                clueButton.disabled = false;
                clueButton.style.cursor = "pointer";
                //console.log("Game ended, clue button enabled for review");
            } else if (!this.isButtonUsed('clueButton')) {
                // During game, only enable if not used yet
                clueButton.disabled = false;
                clueButton.style.cursor = "pointer";
                //console.log("re-enable clue button (not used yet)");
            } else {
                // During game, keep disabled if already used
                //console.log("clue button stays disabled (already used)");
            }
        }
        
        // Re-enable all case buttons
        this.cases.forEach(caseObj => {
            if (caseObj.domRef) {
                caseObj.domRef.style.pointerEvents = "auto";
                caseObj.domRef.style.cursor = "pointer";
                caseObj.domRef.style.opacity = "1";
            }
        });
        
        // Note: Action buttons are only re-enabled if they haven't been used yet
    }
    
    checkAndEnableFirstActionButton() {
        // Check if exactly 7 cases are opened
        const openedCases = this.cases.filter(caseObj => caseObj.action === "opened").length;
        
        //console.log(`Checking first action button: ${openedCases} cases opened`);
        
        if (openedCases === 7) {
            // Get the first action button
            const actionButtons = document.querySelectorAll('.action-button');
            const firstActionButton = actionButtons[0];
            
            if (firstActionButton && firstActionButton.disabled && !this.isButtonUsed('freeClue')) {
                // Only enable and show color tween if we're in the "choose" state (no windows open)
                if (this.action === "choose" && !this.isAnyWindowOpen()) {
                    // Enable the button (only if not used yet)
                    if (!this.isButtonUsed('freeClue')) {
                        firstActionButton.disabled = false;
                        // No opacity changes - CSS handles the styling
                        firstActionButton.style.cursor = "pointer";
                        
                        // Create color tween effect on the button
                        this.createColorTween(firstActionButton);
                    }
                } else {
                    // If any window is still open, schedule the tween for when it closes
                    // this.scheduleColorTweenForFirstActionButton(firstActionButton);
                }
            }else{
                // No opacity changes - CSS handles the styling
            }
        }
    }
    
    scheduleColorTweenForFirstActionButton(firstActionButton) {
        // Wait for all windows to close and then enable the button with color tween
        const checkForWindowsClose = () => {
            if (this.action === "choose" && !this.isAnyWindowOpen() && !this.isButtonUsed('freeClue')) {
                // All windows are closed, now enable the button and show color tween
                firstActionButton.disabled = false;
                // No opacity changes - CSS handles the styling
                firstActionButton.style.cursor = "pointer";
                
                // Wait 1 second after windows close, then show color tween
                setTimeout(() => {
                    this.createColorTween(firstActionButton);
                }, 1000);
            } else {
                // Windows still open, check again in 100ms
                // No opacity changes - CSS handles the styling
                setTimeout(checkForWindowsClose, 100);
            }
        };
        
        // Start checking for windows to close
        checkForWindowsClose();
    }
    
    isAnyWindowOpen() {
        // Check if case reveal window is open
        const caseRevealWindow = document.getElementById('caseRevealWindow');
        const clueWindow = document.getElementById('clueWindow');
        
        return (caseRevealWindow && caseRevealWindow.style.display === 'flex') ||
               (clueWindow && clueWindow.style.display === 'flex') ||
               this.action === "showing" ||
               this.action === "picking";
    }
    
    createColorTween(button) {
        // Start with white-to-white gradient background
        button.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
        
        // Create timeline for complex animation sequence
        const tl = gsap.timeline();
        
        // First: make button slightly bigger and pulse 3 times
        tl.to(button, {
            duration: 0.2,
            scale: 1.1,
            ease: "power2.out"
        })
        .to(button, {
            duration: 0.1,
            scale: 1.0,
            ease: "power2.in"
        })
        .repeat(2)
        // Finally: fade to red gradient
        .to(button, {
            duration: 1.5,
            background: 'linear-gradient(to bottom, #DC143C, #8B0000)',
            ease: "power2.out"
        });
    }
    
    checkGameEndCondition() {
        // Only check once per game
        if (this.gameEnded) {
            return;
        }
        
        // Count remaining cases with number values (not CLUE)
        const remainingNumberCases = this.cases.filter(caseObj => 
            caseObj.action === "ready" && caseObj.value !== "CLUE"
        );
        
        // If only one case with a number value remains, end the game
        if (remainingNumberCases.length === 1) {
            this.gameEnded = true;
            
            // Close any open windows before ending the game
            this.hideClueWindow();
            this.hideRevealWindow();
            
            // Recalculate deal value based on current cases before ending
            this.updateDealValue();
            
            // Enable the clue button for end game
            this.enableClueButtonForEndGame();
            
            // Force the player to accept the deal
            this.action = "picking";
            this.handleDealClick();
        }
    }
    
    setupCaseAnimation() {
        // Set initial positions for all cases (off-screen to the right)
        this.cases.forEach((caseObj, index) => {
            const button = caseObj.domRef;
            
            // Set initial position off-screen to the right
            gsap.set(button, {
                x: "100vw",
                y: gsap.utils.random(-50, 50), // Random vertical offset for variety
                rotation: gsap.utils.random(-15, 15), // Slight random rotation
                scale: 0.8,
                opacity: 0
            });
        });
    }
    
    animateCasesIn() {
        // Create a timeline for the entrance animation
        const tl = gsap.timeline();
        
        // Animate each case in with staggered timing
        this.cases.forEach((caseObj, index) => {
            const button = caseObj.domRef;
            const delay = index * 0.02; // Stagger each case by 5ms (faster)
            
            tl.to(button, {
                duration: 0.5, // Faster case animation
                x: 0,
                y: 0,
                rotation: 0,
                scale: 1,
                opacity: 1,
                ease: "back.out(1.5)",
                delay: delay
            }, delay);
        });
        
    }
    
    showInstructionsWindow() {
        const instructionsOverlay = document.getElementById('instructionsOverlay');
        if (instructionsOverlay) {
            instructionsOverlay.style.display = 'flex';
            instructionsOverlay.style.pointerEvents = 'auto';
            
            // Add click listener to close button
            const closeButton = document.getElementById('closeInstructionsButton');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    this.e.s.p("click1");
                    this.hideInstructionsWindow();
                });
            }
            
            // Add click listener to overlay background to close
            instructionsOverlay.addEventListener('click', (e) => {
                if (e.target === instructionsOverlay) {
                    this.e.s.p("click1");
                    this.hideInstructionsWindow();
                }
            });
        }
    }
    
    hideInstructionsWindow() {
        const instructionsOverlay = document.getElementById('instructionsOverlay');
        if (instructionsOverlay) {
            instructionsOverlay.style.display = 'none';
            instructionsOverlay.style.pointerEvents = 'none';
        }
    }
    
    startBackgroundAnimation() {
        // Get the background image element
        const backgroundImage = document.getElementById('backgroundImage');
        if (backgroundImage) {
            // Create a yoyo tween that fades opacity from 1 to 0.8 over 2 seconds
            gsap.to(backgroundImage, {
                opacity: 0.6,
                duration: 2,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    startCaseFlashAnimation() {
        // Get all case buttons
        const caseButtons = document.querySelectorAll('.cell-button');
        
        caseButtons.forEach((button, index) => {
            // Set initial brightness to ensure smooth start
            gsap.set(button, { filter: 'brightness(1)' });
            
            // Create a repeating timeline for each case with stagger
            const tl = gsap.timeline({ repeat: -1 });
            
            // Flash brightness from 1 to 1.5 to 1 over 0.75 seconds total
            tl.to(button, {
                filter: 'brightness(1.5)',
                duration: 0.375,
                ease: "power2.out"
            })
            // Flash brightness back to 1
            .to(button, {
                filter: 'brightness(1)',
                duration: 0.375,
                ease: "power2.in"
            })
            // Wait 2 seconds before repeating
            .to(button, {
                duration: 2,
                ease: "none"
            });
            
            // Add stagger delay based on index
            tl.delay(index * 0.05);
            
            // Store the timeline on the button element so we can kill it later
            button._flashTimeline = tl;
        });
    }
    
    stopCaseFlashAnimation(button) {
        // Stop the flash animation for a specific case button
        if (button._flashTimeline) {
            button._flashTimeline.kill();
            button._flashTimeline = null;
            // Reset brightness to normal
            gsap.set(button, { filter: 'brightness(1)' });
        }
    }
    
    updateFrameCounter() {
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
            }
        }
    }
    
    markButtonAsUsed(buttonType) {
        // Mark a specific button as used
        if (this.buttonUsageStates.hasOwnProperty(buttonType)) {
            this.buttonUsageStates[buttonType] = true;
            //console.log(`Button ${buttonType} marked as used`);
        }
    }
    
    isButtonUsed(buttonType) {
        // Check if a specific button has been used
        return this.buttonUsageStates.hasOwnProperty(buttonType) ? this.buttonUsageStates[buttonType] : false;
    }
    
    resetButtonUsageStates() {
        // Reset all button usage states (for new game)
        Object.keys(this.buttonUsageStates).forEach(key => {
            this.buttonUsageStates[key] = false;
        });
        //console.log("All button usage states reset");
    }
    
    logButtonUsageStates() {
        // Debug method to show current button usage states
        //console.log("Current button usage states:", this.buttonUsageStates);
    }
    
    logActionButtonStates() {
        // Debug method to show current enabled/disabled state of all action buttons
        const actionButtons = document.querySelectorAll('.action-button');
        actionButtons.forEach((button, index) => {
            const buttonNames = ['FREE CLUE', 'PICK 3', 'DOUBLE'];
            //console.log(`Action button ${index} (${buttonNames[index]}): disabled=${button.disabled}, cursor=${button.style.cursor}`);
        });
    }
    
    testClueButton() {
        // Test method to check clue button state
        const clueButton = document.getElementById('clueButton');
        if (clueButton) {
            //console.log("=== CLUE BUTTON TEST ===");
            //console.log("Element found:", clueButton);
            //console.log("Tag name:", clueButton.tagName);
            //console.log("ID:", clueButton.id);
            //console.log("Classes:", clueButton.className);
            //console.log("Disabled:", clueButton.disabled);
            //console.log("Style disabled:", clueButton.style.disabled);
            //console.log("Cursor:", clueButton.style.cursor);
            //console.log("Pointer events:", clueButton.style.pointerEvents);
            //console.log("Z-index:", clueButton.style.zIndex);
            //console.log("Position:", clueButton.style.position);
            //console.log("Display:", clueButton.style.display);
            //console.log("Visibility:", clueButton.style.visibility);
            //console.log("Opacity:", clueButton.style.opacity);
            //console.log("Click handlers:", clueButton.onclick);
            //console.log("Parent:", clueButton.parentElement);
            //console.log("Parent disabled:", clueButton.parentElement?.disabled);
            //console.log("Parent pointer events:", clueButton.parentElement?.style.pointerEvents);
            
            // Check for event listeners
            //console.log("Event listeners:", clueButton._listeners || "None");
            //console.log("addEventListener exists:", typeof clueButton.addEventListener);
            
            // Try to manually trigger a click
            try {
                clueButton.click();
                //console.log("Manual click() called successfully");
            } catch (e) {
                //console.error("Error calling click():", e);
            }
            
            // Try to add a simple test listener
            try {
                clueButton.addEventListener('test', () => {
                    //console.log("Test listener works");
                });
                clueButton.dispatchEvent(new Event('test'));
                //console.log("Test event dispatched successfully");
            } catch (e) {
                //console.error("Error with test event:", e);
            }
            
            //console.log("=========================");
        } else {
            //console.error("Clue button element not found!");
        }
    }
    
    enableClueButtonForEndGame() {
        
        //console.log("enableClueButtonForEndGame called");
        // Enable the clue button specifically when the game ends
        const clueButton = document.getElementById('clueButton');
        if (clueButton) {
            // Force enable the button
            clueButton.disabled = false;
            clueButton.style.cursor = "pointer";
            clueButton.style.pointerEvents = "auto";
            
            //console.log("=== CLUE BUTTON DEBUG ===");
            //console.log("Clue button element:", clueButton);
            //console.log("Disabled:", clueButton.disabled);
            //console.log("Cursor:", clueButton.style.cursor);
            //console.log("Pointer events:", clueButton.style.pointerEvents);
            //console.log("Z-index:", clueButton.style.zIndex);
            //console.log("Position:", clueButton.style.position);
            //console.log("Display:", clueButton.style.display);
            //console.log("Visibility:", clueButton.style.visibility);
            //console.log("Opacity:", clueButton.style.opacity);
            //console.log("Click handlers:", clueButton.onclick);
            //console.log("Event listeners:", clueButton._listeners || "None");
            //console.log("=========================");
            
            // Test if it's actually clickable by adding a test click
            clueButton.onclick = function(e) {
                //console.log("CLUE BUTTON CLICKED!", e);
                // alert("Clue button is working!");
            };
            
            // Also try adding a direct event listener
            try {
                clueButton.addEventListener('click', function(e) {
                    //console.log("CLUE BUTTON CLICKED VIA ADD EVENT LISTENER!", e);
                    // alert("Clue button addEventListener works!");
                });
                //console.log("Added click event listener successfully");
            } catch (e) {
                //console.error("Failed to add event listener:", e);
            }
            
            //console.log("Clue button enabled for end game with test click handler");
        } else {
            //console.error("Clue button element not found!");
        }
    }
    

}
