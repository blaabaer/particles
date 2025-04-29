/**
 * Boid Simulation Configuration
 * @typedef {Object} SimulationConfig
 * @property {number} maxSpeed - Maximum speed a boid can travel
 * @property {number} DISTANCE_UNIT - Distance unit for force calculations
 * @property {number} beta - Force function parameter
 * @property {number} FORCE_SCALE - Base force scaling factor
 * @property {number} FORCE_SCALE_MULTIPLIER - Force scale adjustment multiplier
 * @property {number} BOID_MASS - Mass of each boid
 * @property {number} BOID_SIZE - Visual size of boids
 * @property {number} BOID_INTERVAL - Time between boid additions
 * @property {number} BOID_TYPE_COUNT - Number of boid types
 * @property {number} INITIAL_BOID_COUNT - Starting number of boids
 */

/**
 * Grid System Configuration
 * @typedef {Object} GridConfig
 * @property {number} gridCols - Number of grid columns
 * @property {number} gridRows - Number of grid rows
 * @property {Array<Array<Array<Boid>>>} BOID_POSITION_RANGES - Grid cells containing boids
 */

/**
 * Boid Type Configuration
 * @typedef {Object} BoidTypeConfig
 * @property {Array<Array<number>>} BOID_COLORS - Available boid colors
 * @property {number} currentTypeCount - Current number of boid types
 * @property {Array<Array<number>>} typeColors - Colors for each boid type
 * @property {Array<Array<number>>} availableColors - Remaining available colors
 * @property {Array<Array<number>>} BOID_FORCE_MATRIX - Force matrix between boid types
 */

/**
 * Simulation State
 * @typedef {Object} SimulationState
 * @property {Array<Boid>} boids - All boids in the simulation
 * @property {number} frictionHalfLife - Friction decay parameter
 * @property {boolean} isMouseDown - Mouse state for boid creation
 * @property {number} lastBoidTime - Last time a boid was created
 */

// ===== CONSTANTS =====
const MAX_BOID_TYPES = 10;
const MIN_BOID_TYPES = 2;

// ===== THEME CONFIGURATION =====
const themes = {
    terrazzo: {
        colors: [
            [205, 81, 50],    // Burnt orange/terracotta
            [158, 152, 38],   // Olive green
            [225, 195, 59],   // Golden yellow
            [222, 220, 192],  // Light beige/cream
            [59, 44, 25],     // Dark brown
            [215, 206, 132],  // Pale olive/khaki
            [248, 214, 201],  // Soft peach
            [223, 150, 88],   // Light terra cotta
            [116, 115, 107],  // Medium gray
        ],
        backgroundColor: [244, 248, 236]
    },
    neon: {
        colors: [
            [255, 0, 255],   // Hot pink
            [0, 255, 255],   // Cyan
            [255, 255, 0],   // Yellow
            [0, 255, 0],     // Lime green
            [255, 128, 0],   // Orange
            [255, 0, 128],   // Pink
            [128, 0, 255],   // Purple
            [0, 255, 191],   // Turquoise
            [255, 0, 0],     // Red
        ],
        backgroundColor: [10, 15, 35] // Dark blue
    },
    oceanic: {
        colors: [
            [32, 178, 170],    // Light sea green
            [255, 182, 193],   // Light pink (jellyfish)
            [176, 224, 230],   // Powder blue
            [255, 255, 255],   // Bright white
            [240, 248, 255],   // Translucent white
            [255, 130, 171],   // Pink (jellyfish)
            [173, 216, 230],   // Light blue
            [135, 206, 250],   // Light sky blue
            [0, 191, 255],     // Deep sky blue  
        ],
        backgroundColor: [25, 25, 112] // Royal blue
    },
    blackonwhite: {
        colors: [
            [50, 50, 50],      // Dark gray
            [30, 30, 30],      // Darker gray
            [70, 70, 70],      // Medium dark gray
            [20, 20, 20],      // Very dark gray
            [40, 40, 40],      // Dark gray
            [10, 10, 10],      // Nearly black
            [60, 60, 60],      // Medium gray
            [5, 5, 5],         // Almost black
            [25, 25, 25],      // Very dark gray
        ],
        backgroundColor: [255, 255, 255] // White
    },
    whiteonblack: {
        colors: [
            [255, 255, 255],   // Pure white
            [250, 249, 246],   // Eggshell
            [252, 252, 250],   // Off-white
            [245, 245, 245],   // Whitesmoke
            [248, 246, 240],   // Antique white
            [253, 252, 245],   // Ivory
            [244, 241, 237],   // Pearl
            [246, 244, 240],   // Seashell
            [240, 234, 214],   // Light beige
        ],
        backgroundColor: [0, 0, 0] // Black
    },
};

// ===== SHARED STATE =====
const state = {
    // Simulation Configuration
    config: {
        maxSpeed: 10,
        DISTANCE_UNIT: 150,
        beta: 0.3,
        FORCE_SCALE: 0.00005,
        FORCE_SCALE_MULTIPLIER: 0.00001,
        BOID_MASS: 1,
        BOID_SIZE: 5,
        BOID_INTERVAL: 50,
        BOID_TYPE_COUNT: 5,
        INITIAL_BOID_COUNT: 1200,
    },

    // Grid System
    grid: {
        cols: 0,
        rows: 0,
        cells: [],
    },

    // Boid Type Configuration
    types: {
        colors: [],
        currentCount: 5,
        activeColors: [],
        availableColors: [],
        forceMatrix: [],
        colorIndices: [], // Store color indices instead of actual colors
    },

    // Simulation State
    simulation: {
        boids: [],
        frictionHalfLife: 200,
        isMouseDown: false,
        lastBoidTime: 0,
        currentTheme: 'terrazzo',
    },

    // ===== Initialization =====
    init() {
        this.initForceMatrix();
        this.initColors();
    },

    initForceMatrix() {
        this.types.forceMatrix = Array(this.types.currentCount).fill().map(() => 
            Array(this.types.currentCount).fill().map(() => this.getRandomInt(-10, 10))
        );
    },

    initColors() {
        // Reset available colors to all theme colors
        this.types.availableColors = [...themes[this.simulation.currentTheme].colors];
        this.types.activeColors = [];
        this.types.colorIndices = [];
        
        // Create a pool of available indices
        const availableIndices = Array.from({length: this.types.availableColors.length}, (_, i) => i);
        
        // Select N unique random indices
        for (let i = 0; i < this.types.currentCount; i++) {
            if (availableIndices.length > 0) {
                // Randomly select an index from the available pool
                const randomIndex = Math.floor(Math.random() * availableIndices.length);
                const selectedIndex = availableIndices[randomIndex];
                
                // Add the selected color and its index
                this.types.colorIndices.push(selectedIndex);
                this.types.activeColors.push(this.types.availableColors[selectedIndex]);
                
                // Remove the used index from the pool
                availableIndices.splice(randomIndex, 1);
            } else {
                // If we run out of unique indices, start repeating from the beginning
                const index = i % this.types.availableColors.length;
                this.types.colorIndices.push(index);
                this.types.activeColors.push(this.types.availableColors[index]);
            }
        }
    },

    initGrid() {
        // Clear old grid references
        this.grid.cells = [];
        
        this.grid.cols = Math.ceil(width / this.config.DISTANCE_UNIT);
        this.grid.rows = Math.ceil(height / this.config.DISTANCE_UNIT);
        this.grid.cells = Array(this.grid.rows).fill().map(() => 
            Array(this.grid.cols).fill().map(() => [])
        );
    },

    // ===== Grid Management =====
    updateBoidInGrid(boid) {
        this.removeBoidFromGrid(boid);
        this.addBoidToGrid(boid);
    },

    removeBoidFromGrid(boid) {
        if (boid.gridX !== undefined && boid.gridY !== undefined) {
            const cell = this.grid.cells[boid.gridY][boid.gridX];
            const index = cell.indexOf(boid);
            if (index !== -1) {
                cell.splice(index, 1);
            }
        }
    },

    addBoidToGrid(boid) {
        boid.gridX = Math.floor(boid.pos.x / this.config.DISTANCE_UNIT);
        boid.gridY = Math.floor(boid.pos.y / this.config.DISTANCE_UNIT);

        // Handle wrapping around the edges
        if (boid.gridX < 0) boid.gridX = this.grid.cols - 1;
        if (boid.gridX >= this.grid.cols) boid.gridX = 0;
        if (boid.gridY < 0) boid.gridY = this.grid.rows - 1;
        if (boid.gridY >= this.grid.rows) boid.gridY = 0;

        this.grid.cells[boid.gridY][boid.gridX].push(boid);
    },

    getNeighboringBoids(boid) {
        const neighbors = [];
        const offsets = [
            [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
            [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
            [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
            [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
            [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2]
        ];

        // Ensure boid has valid grid coordinates
        if (boid.gridX === undefined || boid.gridY === undefined) {
            this.updateBoidInGrid(boid);
        }

        // Check if boid is near the edges
        const isNearLeftEdge = boid.gridX < 2;
        const isNearRightEdge = boid.gridX >= this.grid.cols - 2;
        const isNearTopEdge = boid.gridY < 2;
        const isNearBottomEdge = boid.gridY >= this.grid.rows - 2;

        // Only use extended range if near any edge
        const useExtendedRange = isNearLeftEdge || isNearRightEdge || isNearTopEdge || isNearBottomEdge;

        for (const [dx, dy] of offsets) {
            // Skip extended range checks if not near edges
            if (!useExtendedRange && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
                continue;
            }

            let checkX = boid.gridX + dx;
            let checkY = boid.gridY + dy;

            // Handle wrapping around the edges
            while (checkX < 0) checkX += this.grid.cols;
            while (checkX >= this.grid.cols) checkX -= this.grid.cols;
            while (checkY < 0) checkY += this.grid.rows;
            while (checkY >= this.grid.rows) checkY -= this.grid.rows;

            // Ensure grid cell exists
            if (this.grid.cells[checkY] && this.grid.cells[checkY][checkX]) {
                const cellBoids = this.grid.cells[checkY][checkX];
                // Filter out the current boid and add valid boids to neighbors
                for (const cellBoid of cellBoids) {
                    if (cellBoid !== boid) {
                        neighbors.push(cellBoid);
                    }
                }
            }
        }

        return neighbors;
    },

    // ===== Utility Functions =====
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    friction() {
        return Math.pow(0.5, (deltaTime / this.simulation.frictionHalfLife));
    },

    forceFunction(r, a) {
        if (r < this.config.beta) {
            return r / this.config.beta - 1;
        } else if (this.config.beta < r && r < 1) {
            return a * (1 - Math.abs(2 * r - 1 - this.config.beta) / (1 - this.config.beta));
        } else {
            return 0;
        }
    },

    // Update force scale based on slider value
    updateForceScale(value) {
        this.config.FORCE_SCALE = value * this.config.FORCE_SCALE_MULTIPLIER;
    },

    setTheme(themeName) {
        if (themes[themeName]) {
            this.simulation.currentTheme = themeName;
            this.initColors();
            updateForceMatrixTable();
            
            // Update existing boids' colors
            for (const boid of this.simulation.boids) {
                const colorIndex = this.types.colorIndices[boid.type];
                boid.color = themes[themeName].colors[colorIndex];
            }
        }
    },
};

// ===== UI Elements =====
let frictionSlider;
let frictionValueDisplay;
let forceScaleSlider;
let forceScaleValueDisplay;
let controlPanel;
let addTypeBtn;
let removeTypeBtn;
let collapseBtn;
let saveMatrixBtn;
let loadMatrixBtn;
let matrixNameInput;
let matrixSelect;
let themeRadios;

// ===== UI Functions =====
function isInControlPanel(x, y) {
    const rect = controlPanel.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function toggleControlPanel() {
    controlPanel.classList.toggle('visible');
    collapseBtn.textContent = controlPanel.classList.contains('visible') ? 'Hide' : 'Show';
}

function updateTypeControls() {
    addTypeBtn.disabled = state.types.currentCount >= MAX_BOID_TYPES;
    removeTypeBtn.disabled = state.types.currentCount <= MIN_BOID_TYPES;
}

function updateExistingBoids() {
    for (const boid of state.simulation.boids) {
        if (boid.type >= state.types.currentCount) {
            boid.type = state.getRandomInt(0, state.types.currentCount - 1);
            boid.color = state.types.activeColors[boid.type];
        }
    }
}

function addBoidType() {
    if (state.types.currentCount >= MAX_BOID_TYPES) return;
    
    state.types.currentCount++;
    
    // Add new row and column to force matrix
    state.types.forceMatrix = state.types.forceMatrix.map(row => [...row, state.getRandomInt(-10, 10)]);
    state.types.forceMatrix.push(Array(state.types.currentCount).fill().map(() => state.getRandomInt(-10, 10)));
    
    // Add new color
    const randomIndex = state.getRandomInt(0, state.types.availableColors.length - 1);
    state.types.activeColors.push(state.types.availableColors[randomIndex]);
    state.types.availableColors.splice(randomIndex, 1);
    
    // Update UI
    updateForceMatrixTable();
    updateTypeControls();
    updateExistingBoids();
}

function removeBoidType() {
    if (state.types.currentCount <= MIN_BOID_TYPES) return;
    
    // Remove last color and add it back to available colors
    const removedColor = state.types.activeColors.pop();
    state.types.availableColors.push(removedColor);
    
    // Remove last row and column from force matrix
    state.types.forceMatrix.pop();
    state.types.forceMatrix = state.types.forceMatrix.map(row => row.slice(0, -1));
    
    state.types.currentCount--;
    
    // Update UI
    updateForceMatrixTable();
    updateTypeControls();
    updateExistingBoids();
}

function updateForceMatrixTable() {
    const forceMatrixTable = document.querySelector('.force-matrix table');
    forceMatrixTable.innerHTML = '';

    // Create header row
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (let i = 0; i < state.types.currentCount; i++) {
        const th = document.createElement('th');
        const dot = document.createElement('div');
        dot.className = `type-dot type-dot-${i}`;
        const colorIndex = state.types.colorIndices[i];
        const color = themes[state.simulation.currentTheme].colors[colorIndex];
        dot.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        th.appendChild(dot);
        headerRow.appendChild(th);
    }
    forceMatrixTable.appendChild(headerRow);

    // Create data rows
    for (let i = 0; i < state.types.currentCount; i++) {
        const row = document.createElement('tr');
        
        // Add row header
        const rowHeader = document.createElement('th');
        const dot = document.createElement('div');
        dot.className = `type-dot type-dot-${i}`;
        const colorIndex = state.types.colorIndices[i];
        const color = themes[state.simulation.currentTheme].colors[colorIndex];
        dot.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        rowHeader.appendChild(dot);
        row.appendChild(rowHeader);

        // Add input cells
        for (let j = 0; j < state.types.currentCount; j++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `force-${i}-${j}`;
            input.step = '0.5';
            input.value = state.types.forceMatrix[i][j];
            input.addEventListener('input', function() {
                state.types.forceMatrix[i][j] = parseFloat(this.value);
            });
            cell.appendChild(input);
            row.appendChild(cell);
        }
        forceMatrixTable.appendChild(row);
    }
}

// ===== Boid Management =====
function createBoid(x, y) {
    const type = state.getRandomInt(0, state.types.currentCount - 1);
    return {
        pos: createVector(x, y),
        vel: createVector(0, 0),
        acc: createVector(0, 0),
        mass: state.config.BOID_MASS,
        size: state.config.BOID_SIZE,
        color: state.types.activeColors[type],
        type: type,
        gridX: undefined,
        gridY: undefined,
        opacity: 0,  // Start fully transparent
        fadeInDuration: 30,  // Frames to fully fade in
        fadeOutDuration: 6, // Frames to fully fade out
        isFadingOut: false,  // Track if boid is being removed
        fadeOutProgress: 0,  // Track fade out progress
        applyForce(force) {
            const f = p5.Vector.div(force, this.mass);
            this.acc.add(f);
        }
    };
}

function addBoid(x, y) {
    const boid = createBoid(x, y);
    state.simulation.boids.push(boid);
    state.updateBoidInGrid(boid);
}

// ===== P5.js Functions =====
/**
 * Initializes the simulation
 */
function setup() {
    createCanvas(windowWidth, windowHeight);
    state.init();
    state.initGrid();
    
    // Create initial boids
    for (let i = 0; i < state.config.INITIAL_BOID_COUNT; i++) {
        addBoid(random(width), random(height));
    }
}

/**
 * Handles mouse press events
 */
function mousePressed() {
    if (!isInControlPanel(mouseX, mouseY)) {
        state.simulation.isMouseDown = true;
        state.simulation.lastBoidTime = millis();
        addBoid(mouseX, mouseY);
    }
}

/**
 * Handles mouse release events
 */
function mouseReleased() {
    state.simulation.isMouseDown = false;
}

// Vector pool for reuse
const vectorPool = {
    pool: [],
    maxSize: 1000, // Maximum number of vectors to keep in the pool
    get() {
        if (this.pool.length > 0) {
            const vec = this.pool.pop();
            vec.set(0, 0); // Reset the vector
            return vec;
        }
        return createVector();
    },
    release(vec) {
        if (!vec) return; // Safety check
        if (this.pool.length < this.maxSize) {
            vec.set(0, 0); // Reset the vector
            this.pool.push(vec);
        }
    }
};

/**
 * Calculates the shortest distance between two points considering screen wrapping
 * @param {p5.Vector} pos1 - First position
 * @param {p5.Vector} pos2 - Second position
 * @returns {Object} Object containing distance and direction vector
 */
function calculateWrappedDistance(pos1, pos2) {
    let dx = pos2.x - pos1.x;
    let dy = pos2.y - pos1.y;
    
    // Check for shorter distance across screen edges
    if (Math.abs(dx) > width/2) {
        dx = dx > 0 ? dx - width : dx + width;
    }
    if (Math.abs(dy) > height/2) {
        dy = dy > 0 ? dy - height : dy + height;
    }
    
    const force = vectorPool.get();
    force.set(dx, dy);
    const distance = force.mag();
    
    return { distance, force };
}

/**
 * Updates a single boid's physics and checks for overcrowding
 * @param {Object} boid - The boid to update
 * @param {Array} neighbors - Array of neighboring boids
 * @returns {boolean} True if boid should be removed due to overcrowding
 */
function updateBoid(boid, neighbors) {
    // Reset acceleration
    boid.acc.mult(0);
    
    const overcrowdingDistance = 0.10 * state.config.DISTANCE_UNIT;
    const overcrowdingThreshold = 30;
    let nearbyBoids = 0;
    
    // Process all neighbors in a single pass
    for (const otherBoid of neighbors) {
        if (boid === otherBoid) continue;
        
        const { distance, force } = calculateWrappedDistance(boid.pos, otherBoid.pos);
        
        // Check for overcrowding
        if (distance < overcrowdingDistance) {
            nearbyBoids++;
        }
        
        // Apply forces if within interaction range
        if (distance < state.config.DISTANCE_UNIT) {
            const forceStrength = state.forceFunction(
                distance / state.config.DISTANCE_UNIT, 
                state.types.forceMatrix[boid.type][otherBoid.type] / 10
            ) * state.config.FORCE_SCALE;
            
            force.normalize();
            force.mult(forceStrength * state.config.DISTANCE_UNIT);
            boid.applyForce(force);
        }
        
        // Release the force vector back to the pool
        vectorPool.release(force);
    }
    
    // Update physics
    boid.vel.mult(state.friction());
    boid.vel.add(boid.acc);
    boid.vel.limit(state.config.maxSpeed);
    boid.pos.add(boid.vel);
    
    // Wrap around screen
    if (boid.pos.x > width) boid.pos.x = 0;
    if (boid.pos.x < 0) boid.pos.x = width;
    if (boid.pos.y > height) boid.pos.y = 0;
    if (boid.pos.y < 0) boid.pos.y = height;
    
    // Update boid position in grid
    state.updateBoidInGrid(boid);
    
    return nearbyBoids >= overcrowdingThreshold;
}

/**
 * Draws a boid and its wrapped versions if near screen edges
 * @param {Object} boid - The boid to draw
 */
function drawBoid(boid) {
    // Update opacity for fade-in or fade-out
    if (boid.isFadingOut) {
        boid.fadeOutProgress += 1 / boid.fadeOutDuration;
        boid.opacity = max(0, 1 - boid.fadeOutProgress);
    } else if (boid.opacity < 1) {
        boid.opacity = min(1, boid.opacity + 1 / boid.fadeInDuration);
    }
    
    // Don't draw if fully faded out
    if (boid.opacity <= 0) return;
    
    // Set fill color with opacity
    fill(boid.color[0], boid.color[1], boid.color[2], boid.opacity * 255);
    noStroke();
    
    // Draw main boid
    ellipse(boid.pos.x, boid.pos.y, boid.size, boid.size);
    
    // Draw wrapped versions if near edges
    const halfSize = boid.size / 2;
    const isNearLeft = boid.pos.x < halfSize;
    const isNearRight = boid.pos.x > width - halfSize;
    const isNearTop = boid.pos.y < halfSize;
    const isNearBottom = boid.pos.y > height - halfSize;
    
    if (isNearLeft) {
        ellipse(boid.pos.x + width, boid.pos.y, boid.size, boid.size);
    } else if (isNearRight) {
        ellipse(boid.pos.x - width, boid.pos.y, boid.size, boid.size);
    }
    
    if (isNearTop) {
        ellipse(boid.pos.x, boid.pos.y + height, boid.size, boid.size);
    } else if (isNearBottom) {
        ellipse(boid.pos.x, boid.pos.y - height, boid.size, boid.size);
    }
    
    // Draw corner wraps
    if (isNearLeft && isNearTop) {
        ellipse(boid.pos.x + width, boid.pos.y + height, boid.size, boid.size);
    } else if (isNearRight && isNearTop) {
        ellipse(boid.pos.x - width, boid.pos.y + height, boid.size, boid.size);
    } else if (isNearLeft && isNearBottom) {
        ellipse(boid.pos.x + width, boid.pos.y - height, boid.size, boid.size);
    } else if (isNearRight && isNearBottom) {
        ellipse(boid.pos.x - width, boid.pos.y - height, boid.size, boid.size);
    }
}

/**
 * Main simulation loop
 */
function draw() {
    // Use the background color from the current theme
    const bgColor = themes[state.simulation.currentTheme].backgroundColor;
    background(bgColor[0], bgColor[1], bgColor[2]);
    
    // Add new boids while mouse is held down
    if (state.simulation.isMouseDown && millis() - state.simulation.lastBoidTime >= state.config.BOID_INTERVAL) {
        addBoid(mouseX, mouseY);
        state.simulation.lastBoidTime = millis();
    }
    
    // Update and draw each boid
    for (let i = state.simulation.boids.length - 1; i >= 0; i--) {
        const boid = state.simulation.boids[i];
        
        // Skip updating if boid is fading out
        if (!boid.isFadingOut) {
            const neighbors = state.getNeighboringBoids(boid);
            
            // Update boid and check for overcrowding
            if (updateBoid(boid, neighbors)) {
                // Start fade out instead of immediate removal
                boid.isFadingOut = true;
                boid.fadeOutProgress = 0;
            }
        }
        
        // Draw the boid
        drawBoid(boid);
        
        // Remove boid if fade out is complete
        if (boid.isFadingOut && boid.opacity <= 0) {
            state.removeBoidFromGrid(boid);
            state.simulation.boids.splice(i, 1);
            // Add new boid at random location
            addBoid(random(width), random(height));
        }
    }
}

/**
 * Handles window resize events
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    state.initGrid();
}

// ===== LocalStorage Management =====
function cleanupOldMatrices() {
    try {
        const matrices = JSON.parse(localStorage.getItem('boidForceMatrices') || '{}');
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        // Remove matrices older than one week
        Object.keys(matrices).forEach(name => {
            const timestamp = new Date(matrices[name].timestamp).getTime();
            if (timestamp < oneWeekAgo) {
                delete matrices[name];
            }
        });
        
        localStorage.setItem('boidForceMatrices', JSON.stringify(matrices));
    } catch (error) {
        console.error('Error cleaning up old matrices:', error);
    }
}

// ===== UI Initialization =====
window.onload = function() {
    // Clean up old matrices on load
    cleanupOldMatrices();
    
    // Get control panel element
    controlPanel = document.getElementById('controlPanel');
    
    // Initialize collapse button
    collapseBtn = document.getElementById('collapseBtn');
    collapseBtn.textContent = 'Show'; // Start with panel hidden
    collapseBtn.addEventListener('click', toggleControlPanel);

    // Initialize theme radios
    themeRadios = document.getElementById('themeRadios');
    updateThemeOptions();

    // Initialize friction slider
    frictionSlider = document.getElementById('frictionSlider');
    frictionValueDisplay = document.getElementById('frictionValue');
    
    frictionSlider.addEventListener('input', function() {
        state.simulation.frictionHalfLife = parseInt(this.value);
        frictionValueDisplay.textContent = state.simulation.frictionHalfLife;
    });

    // Initialize force scale slider
    forceScaleSlider = document.getElementById('forceScaleSlider');
    forceScaleValueDisplay = document.getElementById('forceScaleValue');
    
    forceScaleSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        state.updateForceScale(value);
        forceScaleValueDisplay.textContent = value.toFixed(1);
    });

    // Initialize type control buttons
    addTypeBtn = document.getElementById('addTypeBtn');
    removeTypeBtn = document.getElementById('removeTypeBtn');
    
    addTypeBtn.addEventListener('click', addBoidType);
    removeTypeBtn.addEventListener('click', removeBoidType);
    
    // Initialize force matrix controls
    saveMatrixBtn = document.getElementById('saveMatrixBtn');
    loadMatrixBtn = document.getElementById('loadMatrixBtn');
    matrixNameInput = document.getElementById('matrixName');
    matrixSelect = document.getElementById('matrixSelect');
    
    saveMatrixBtn.addEventListener('click', saveForceMatrix);
    loadMatrixBtn.addEventListener('click', loadForceMatrix);
    
    // Initial UI setup
    updateForceMatrixTable();
    updateTypeControls();
    updateMatrixSelect();
};

// ===== Toast Notification System =====
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        toast.classList.add('slideOut');
        setTimeout(() => toast.remove(), 300);
    };
    
    toast.appendChild(messageSpan);
    toast.appendChild(closeButton);
    container.appendChild(toast);
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('slideOut');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
}

function saveForceMatrix() {
    const name = matrixNameInput.value.trim();
    if (!name) {
        showToast('Please enter a name for the force matrix', 'error');
        return;
    }

    const matrixData = {
        name: name,
        matrix: state.types.forceMatrix,
        typeCount: state.types.currentCount,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Get existing matrices
        const existingMatrices = JSON.parse(localStorage.getItem('boidForceMatrices') || '{}');
        
        // Add or update the matrix
        existingMatrices[name] = matrixData;
        
        // Save back to localStorage
        localStorage.setItem('boidForceMatrices', JSON.stringify(existingMatrices));
        
        // Update the dropdown
        updateMatrixSelect();
        
        // Clear the input
        matrixNameInput.value = '';
        
        showToast('Force matrix saved successfully!', 'success');
    } catch (error) {
        showToast('Failed to save force matrix: ' + error.message, 'error');
    }
}

function loadForceMatrix() {
    const selectedName = matrixSelect.value;
    if (!selectedName) {
        showToast('Please select a force matrix to load', 'error');
        return;
    }
    
    try {
        const existingMatrices = JSON.parse(localStorage.getItem('boidForceMatrices') || '{}');
        const matrixData = existingMatrices[selectedName];
        
        if (!matrixData) {
            throw new Error('Selected matrix not found');
        }
        
        // Validate the saved data
        if (!matrixData.matrix || !Array.isArray(matrixData.matrix) || 
            !matrixData.typeCount || typeof matrixData.typeCount !== 'number') {
            throw new Error('Invalid force matrix data');
        }

        const savedMatrix = matrixData.matrix;
        const savedTypeCount = matrixData.typeCount;
        const currentTypeCount = state.types.currentCount;

        // Create a new matrix with the current number of types
        const newMatrix = Array(currentTypeCount).fill().map(() => Array(currentTypeCount).fill(0));

        // Copy values from the saved matrix, handling different sizes
        for (let i = 0; i < currentTypeCount; i++) {
            for (let j = 0; j < currentTypeCount; j++) {
                if (i < savedTypeCount && j < savedTypeCount) {
                    // Copy existing values
                    newMatrix[i][j] = savedMatrix[i][j];
                } else {
                    // Generate random values for new types
                    newMatrix[i][j] = state.getRandomInt(-10, 10);
                }
            }
        }
        
        // Update the force matrix
        state.types.forceMatrix = newMatrix;
        
        // Update UI
        updateForceMatrixTable();
        updateTypeControls();
        
        showToast(`Force matrix loaded successfully! ${savedTypeCount} types were loaded and ${currentTypeCount - savedTypeCount} new types were added.`, 'success');
    } catch (error) {
        showToast('Failed to load force matrix: ' + error.message, 'error');
    }
}

function updateMatrixSelect() {
    try {
        const existingMatrices = JSON.parse(localStorage.getItem('boidForceMatrices') || '{}');
        
        // Clear existing options
        matrixSelect.innerHTML = '<option value="">Select a matrix...</option>';
        
        // Add options for each saved matrix
        Object.keys(existingMatrices).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${name} (${new Date(existingMatrices[name].timestamp).toLocaleString()})`;
            matrixSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error updating matrix select:', error);
    }
}

function updateThemeOptions() {
    const themeRadios = document.getElementById('themeRadios');
    themeRadios.innerHTML = ''; // Clear existing options
    
    // Add radio buttons for each theme
    Object.keys(themes).forEach(themeName => {
        const theme = themes[themeName];
        const radio = document.createElement('div');
        radio.className = `theme-radio ${themeName === state.simulation.currentTheme ? 'selected' : ''}`;
        radio.dataset.theme = themeName;
        
        // Set CSS variables for the gradient
        radio.style.setProperty('--color1', `rgb(${theme.colors[0].join(',')})`);
        radio.style.setProperty('--color2', `rgb(${theme.colors[1].join(',')})`);
        radio.style.setProperty('--color3', `rgb(${theme.colors[2].join(',')})`);
        radio.style.setProperty('--bgColor', `rgb(${theme.backgroundColor.join(',')})`);
        
        radio.addEventListener('click', function() {
            // Remove selected class from all radios
            document.querySelectorAll('.theme-radio').forEach(r => r.classList.remove('selected'));
            // Add selected class to clicked radio
            this.classList.add('selected');
            // Set the theme
            state.setTheme(this.dataset.theme);
        });
        
        themeRadios.appendChild(radio);
    });
}
