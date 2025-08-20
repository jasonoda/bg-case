import gsap from "gsap";

export class EndScore {
	constructor() {
		this.starThresholds = null;
		this.loadStarThresholds();
	}

	setUp(e) {
		this.e = e;
	}

	async loadStarThresholds() {
		try {
			// Import the JSON file directly as a module
			const starScoresModule = await import('./starScores.json');
			this.starThresholds = starScoresModule.default;
			console.log('Star thresholds loaded successfully via import:', this.starThresholds);
		} catch (error) {
			console.error('Failed to load star thresholds via import:', error);
			// Fallback to default values
			this.starThresholds = [0, 25000, 40000, 65000, 100000];
		}
	}

	createFinalScoreOverlay(scoreValue, statsArray = []) {
		// Ensure star thresholds are loaded
		if (!this.starThresholds) {
			console.log('Star thresholds not loaded yet, using fallback values');
			this.starThresholds = [0, 25000, 40000, 65000, 100000];
		}
		
		console.log('Creating final score overlay with score:', scoreValue, 'and thresholds:', this.starThresholds);
		
		// Create black overlay
		const overlay = document.createElement('div');
		overlay.className = 'finalScoreOverlay';
		
		// Create main content container
		const contentContainer = document.createElement('div');
		contentContainer.className = 'finalScoreContentContainer';
		
		// Create score text
		const scoreText = document.createElement('div');
		scoreText.className = 'finalScoreText';
		scoreText.textContent = `${scoreValue.toLocaleString()}`;
		
		// Create stats container
		const statsContainer = document.createElement('div');
		statsContainer.className = 'finalScoreStatsContainer';
		
		// Create star rating container
		const starDiv = document.createElement('div');
		starDiv.className = 'finalScoreStarDiv';
		
		// Create 5 stars
		for (let i = 0; i < 5; i++) {
			const star = document.createElement('div');
			star.className = 'finalScoreStar';
			star.innerHTML = '★';
			
			// Start all stars grey
			star.style.color = '#808080';
			
			// Use actual score thresholds to determine target color
			const threshold = this.starThresholds ? this.starThresholds[i] : 0;
			const targetColor = (this.starThresholds && scoreValue >= threshold) ? '#FFD700' : '#808080';
			
			// Debug logging
			console.log(`Star ${i + 1}: Score ${scoreValue} >= Threshold ${threshold} = ${scoreValue >= threshold} -> ${targetColor}`);
			
			star.dataset.targetColor = targetColor;
			
			starDiv.appendChild(star);
		}
		
		// Add star container to stats container with spacing
		statsContainer.appendChild(starDiv);
			
		// Create GAME STATS header
		const statsHeader = document.createElement('div');
		statsHeader.className = 'finalScoreStatsHeader';
		statsHeader.textContent = 'GAME STATS';
		statsContainer.appendChild(statsHeader);
		
		// Create gradient line separator
		const separatorLine = document.createElement('div');
		separatorLine.className = 'finalScoreStatsSeparator';
		statsContainer.appendChild(separatorLine);
		
		// Create stats items dynamically from the array
		statsArray.forEach(statInfo => {
			const [label, count] = statInfo;
			const statItem = document.createElement('div');
			statItem.className = 'finalScoreStatItem';
			statItem.textContent = `${label}: ${count}`;
			statsContainer.appendChild(statItem);
		});
		
		// Add score text and stats container to content container
		contentContainer.appendChild(scoreText);
		contentContainer.appendChild(statsContainer);
		
		// Set initial position to center just the score text
		const viewportHeight = window.innerHeight;
		const scoreTextHeight = scoreText.offsetHeight;
		// console.log("scoreTextHeight: " + scoreTextHeight);
		const initialTop = (viewportHeight / 2) - 45;
		
		contentContainer.style.top = initialTop + "px";
		
		overlay.appendChild(contentContainer);
		document.body.appendChild(overlay);
		
		// Animate overlay and score text with GSAP
		gsap.to(overlay, {
			duration: 0.8,
			opacity: 1,
			ease: "sine.out"
		});
		
		gsap.to(scoreText, {
			duration: .9,
			opacity: 1,
			scale: 1,
			ease: "back.out(4)"
		});

		this.createSparks(scoreText, 45, 10, 300)
		
		// Add glowing animation
		gsap.to(scoreText, {
			duration: 2,
			color: "#FFFFFF",
			textShadow: "0 0 40px rgba(255, 255, 255, 0.9)",
			ease: "power2.inOut",
			yoyo: true,
			repeat: -1
		});
		
		// After 3 seconds, animate to final position
		setTimeout(() => {
			// Measure the content container height
			const contentHeight = contentContainer.offsetHeight;
			
			// Calculate final position for equal spacing above and below
			const finalTop = (viewportHeight - contentHeight) / 2;
			
			console.log("viewportHeight: " + viewportHeight);
			console.log("scoreTextHeight: " + scoreTextHeight);
			console.log("contentHeight: " + contentHeight);
			console.log("initialTop: " + initialTop);
			console.log("finalTop: " + finalTop);
			
			// Animate content container up to create equal spacing above and below
			gsap.to(contentContainer, {
				duration: 1,
				top: finalTop,
				ease: "sine.out"
			});
			
			// Fade in stats container
			gsap.to(statsContainer, {
				duration: 1,
				opacity: 1,
				delay: 1,
				ease: "sine.out",
				onComplete: () => {
					// Start star lighting animation after stats fade in
					this.animateStars(starDiv);
				}
			});
		}, 3000);
		
		// Fade effect when game ends
		const fader = document.getElementById("fader");
		if (fader) {
			gsap.to(fader, { opacity: 0.5, duration: 0.1, ease: "linear" });
			gsap.to(fader, { opacity: 0, duration: 1, ease: "linear", delay: 0.1 });
		}
	}

	animateStars(starDiv) {
		const stars = starDiv.querySelectorAll('.finalScoreStar');
		let currentStar = 0;
		
		// Count how many stars should light up based on score thresholds
		const starsToLight = Array.from(stars).filter(star => 
			star.dataset.targetColor === '#FFD700'
		).length;
		
		const lightNextStar = () => {
			if (currentStar < starsToLight && currentStar < stars.length) {
				const star = stars[currentStar];
				const targetColor = star.dataset.targetColor;
				
				// Light up the star
				gsap.to(star, {
					duration: 0.3,
					color: targetColor,
					scale: 1.8,
					ease: "back.out(1.7)",
					onComplete: () => {
						// Scale back to normal
						gsap.to(star, {
							duration: 0.3,
							scale: 1,
							ease: "power2.out"
						});
					}
				});
				
				// Create sparks flying off the star
				this.createSparks(star,16,4, 100);
				
				// Play sound effect
				if (this.e && this.e.s) {
					this.e.s.p('brightClick');
				}
				
				currentStar++;
				
				// Light next star after a delay
				setTimeout(lightNextStar, 300);
			}
		};
		
		// Start the animation
		lightNextStar();
	}
	
	createSparks(star, num, starScale, starDistance) {
		const starRect = star.getBoundingClientRect();
		const starCenterX = starRect.left + starRect.width / 2;
		const starCenterY = starRect.top + starRect.height / 2;
		
		// Create multiple sparks
		for (let i = 0; i < num; i++) {
			const spark = document.createElement('div');
			spark.className = 'spark';
			
			// Random angle for spark direction
			const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
			// const distance = 60 + Math.random() * 40; // Random distance
			const distance = 1 + Math.random() * starDistance; // Random distance
			
			// Random size between 3px and 8px
			const sparkSize = 3 + Math.random() * starScale * 2;
			
			// Calculate final position
			const endX = starCenterX + Math.cos(angle) * distance;
			const endY = starCenterY + Math.sin(angle) * distance;
			
			// Set spark styles - radial gradient with star color
			spark.style.cssText = `
				position: fixed;
				left: ${starCenterX}px;
				top: ${starCenterY}px;
				width: ${sparkSize}px;
				height: ${sparkSize}px;
				background: radial-gradient(circle at center, #FFD700 0%, #FFD700 40%, rgba(255, 215, 0, 0.3) 70%, rgba(255, 215, 0, 0) 100%);
				border-radius: 50%;
				pointer-events: none;
				z-index: 17000;
				opacity: 1;
				transform: scale(1);
			`;
			
			document.body.appendChild(spark);
			
			// Animate spark
			gsap.to(spark, {
				duration: 0.8,
				x: endX - starCenterX,
				y: endY - starCenterY,
				scale: .1,
				opacity: 0,
				rotation: Math.random() * 720 - 360, // Random rotation during flight
				ease: "sine.out",
				onComplete: () => {
					document.body.removeChild(spark);
				}
			});
		}
	}
}
