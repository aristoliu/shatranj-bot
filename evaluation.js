// Evaluation

const {Board} = require('./shatranj');
const {whiteBook, blackBook} = require('./openings');

class Engine extends Board {
    constructor(id = null) {
        super(id);
        this.settings = {};
        this.hashTable = {};
        this.nodesSearched = 0;
    }

    // eval boards are in centipawns, so divide modifiers by 100
    // from perspective of white (but #s are for black)
    // 8th rank = arr[0]
    // 1st rank = arr[7]
    static evalBoards = {

        pawn: [
            [0,0,0,0,0,0,0,0],
            [35,35,35,35,35,35,35,35],
            [30,30,30,30,30,30,30,30],
            [25,25,25,25,25,25,25,25],
            [20,10,20,20,20,20,10,20],
            [10,15,10,10,10,10,15,10],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        alfil: [
            [0,0,0,0,0,0,0,0],
            [0,0,0,10,10,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,30,30,0,0,30,30,0],
            [0,0,0,0,0,0,0,0],
            [20,0,0,20,15,0,0,15],
            [0,0,0,0,0,0,0,0],
            [0,-10,0,0,0,0,-10,0]
        ],
        knight: [
            [0,0,0,0,0,0,0,0],
            [0,0,10,10,10,10,0,0],
            [0,10,20,20,20,20,10,0],
            [0,25,20,20,20,20,25,0],
            [0,0,20,20,20,20,0,0],
            [0,10,15,10,10,15,10,0],
            [0,0,15,15,15,15,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        ferz: [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,10,10,10,10,0,0],
            [0,0,0,20,20,0,0,0],
            [0,0,0,20,20,0,0,0],
            [0,0,0,15,15,0,0,0],
            [0,0,10,10,10,10,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        rook: [
            [15,15,15,15,15,15,15,15],
            [20,20,20,20,20,20,20,20],
            [15,15,15,15,15,15,15,15],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        king: [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,15,15,0,0,0,0,0],
            [0,10,10,0,0,0,0,0]
        ]
    }



    // Random Engine functionality
    makeRandomMove() {
        const legalMoveList = this.legalMoves();
        return this.move(legalMoveList[Math.floor(Math.random()*legalMoveList.length)]);
    }

    playRandomGame() {
        let str = '';
        let i = 0;
        while (!this.gameFinished()) {
            if (i % 10 == 0) this.displayBoard();
            if (i > 800) {
                console.log('forced end');
                break;
            }
            let played = this.makeRandomMove();
            str += `${played.start}${played.end} `;
            console.log(`${played.start}-${played.end} `);
            i ++;
        }
        if (this.info.fiftyMoves >= 100) console.log(`Fifty moves rule`);
        console.log(str);
        console.log(`${i} ply moves played`);
        return;
    }

    // Evaluation Function:
    // linear combination of eval boards
    // or have some more elements
    // hashes the position
    evaluate(fast = false) {
        let player = this.info.sideToMove;
        let hash = this.hash();

        // this.info.hashArray.push(hash);

        if (this.threefold()) return 0;
        if (!fast) {
            if (this.mutualSinglePiece()) return 0;
            
            if (player == 'white') {
                if (this.legalMoves('white').length == 0) return -100;
                if (this.singlePiece('black')) return 100;
            } else {
                if (this.legalMoves('black').length == 0) return 100;
                if (this.singlePiece('white')) return -100;
            }
            
            if (this.info.fiftyMoves > 100) return 0;
        }
        
        if (this.hashTable[hash] !== undefined) return this.hashTable[hash];
        if (this.info.captured > 0.6 * 69.2) return this.endgameEval();

        const pieces = ['pawn', 'alfil','knight','rook','king','ferz'];
        let evaluation = 0;
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                if(!this.occupied[i][j]) continue;
                for (let k = 0; k < 6; k ++) {
                    let piece = pieces[k];
                    if (!this.Boards[piece][i][j]) continue;
                    if(this.Boards.white[i][j]) {
                        evaluation += Board.pieceValues[piece] + Engine.evalBoards[piece][7-i][j]/100;
                    } else if (this.Boards.black[i][j]) {
                        evaluation -= (Board.pieceValues[piece] + Engine.evalBoards[piece][i][j]/100);
                    }
                }
            }
        }

        this.hashTable[hash] = Math.round(evaluation * 100)/100;
        // if(isNaN(Math.round(evaluation * 100)/100)) throw new Error('not a number');
        return Math.round(evaluation * 100)/100;
    }

    // Endgame Evaluation Function
    // called instead of the middlegame evaluation function
    // when < 27.7 pts of material (n. inc. kings) remaining
    endgameEval() {
        let evaluation = 0;
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                if (!this.occupied[i][j]) continue;

                // King distance from center
                if (this.Boards.king[i][j]) {
                    if (this.Boards.white[i][j]) {
                        // [0 - 1.5]; closer = better
                        evaluation += 1.5 * Math.sqrt(7/6 - 1/6 * Board.distance([i,j],[3.5,3.5]));
                    } else {
                        evaluation -= 1.5 * Math.sqrt(7/6 - 1/6 * Board.distance([i,j],[3.5,3.5]));
                    }
                    continue;
                }

                const pieces = ['pawn', 'alfil','knight','rook','ferz'];
                for (let k = 0; k < 5; k ++) {
                    let piece = pieces[k];
                    if (!this.Boards[piece][i][j]) continue;
                    if (this.Boards.white[i][j]) {
                        if (k = 0) {
                            evaluation += 1 + Engine.evalBoards[piece][7-i][j]/100;
                            break;
                        }
                        evaluation += Board.pieceValues[piece];
                        break;
                    }

                    if (k = 0) {
                        evaluation -= (1 + Engine.evalBoards[piece][i][j]/100);
                    }
                    evaluation -= Board.pieceValues[piece];
                    break;
                }
            }
        }
        
        return Math.round(evaluation*100)/100;
    }

    // Alpha-beta pruning
    alphabeta(depth, alpha, beta, player = this.info.sideToMove, principal = null, trueDepth = 0) {
        this.nodesSearched++;
        if (depth == 0) return [this.evaluate(true)];
        if (this.gameFinished()) return [this.evaluate()];

        let value, best, element;
        // Move ordering (needs improvement)
        // Current: captures first
        const moves = this.legalMoves().sort((a,b) => {
            if (a === principal) return -1;
            if (b === principal) return 1;
            let aEnd = Board.getCoordinates(a.substr(2,2));
            let bEnd = Board.getCoordinates(b.substr(2,2));
            let color = Board.switchColor(player);
            return this.Boards[color][bEnd[0]][bEnd[1]] - 
            this.Boards[color][aEnd[0]][aEnd[1]];
        });
        let len = moves.length;

        if (player === 'white') {
            value = -Infinity;

            for (let i = 0; i < len; i ++) {
                element = moves[i]; // choose a move (4 char string)
                
                let temp = value; // here to detect if value changed. if it did, best element changes
                // this.move(element);
                let moveObj = this.move(element,undefined,true); // make move, save object
                let captureFlag = false; // if last move is a capture, keep going
                if (moveObj.captured !== 0 && depth == 1 && trueDepth < 100) {
                    depth ++;
                    captureFlag = true;                    
                };
                trueDepth ++;

                // console.log(element);
                value = Math.max(value, this.alphabeta(depth - 1, alpha, beta, 'black', null, trueDepth)[0]);
                // if (isNaN(value)) throw new Error('not a number');
                if (captureFlag) {
                    depth --;
                    captureFlag = false;
                }

                alpha = Math.max(alpha, value);
                if (temp < value) best = element;
                this.undo();
                this.info.hashArray.pop();
                if (value >= beta) break;
            }
            return [value, best];
        } else {
            value = Infinity;

            for (let i = 0; i < len; i ++) {
                element = moves[i];
               
                let temp = value; // here to detect if value changed. if it did, best element changes
                // this.move(element);
                let moveObj = this.move(element, undefined, true); // make move, save object
                let captureFlag = false; // if last move is a capture, keep going
                if (moveObj.captured !== 0 && depth == 1 && trueDepth < 100) {
                    depth ++;
                    captureFlag = true;                    
                };
                
                trueDepth ++;
                // if (depth >= 2) console.log(`checking depth ${depth - 1}`);
                value = Math.min(value, this.alphabeta(depth - 1, alpha, beta, 'white', null, trueDepth)[0]);

                if (captureFlag) {
                    depth --;
                    captureFlag = false;
                };

                beta = Math.min(beta, value);
                if (temp > value) best = element;
                this.undo();
                this.info.hashArray.pop();
                if (value <= alpha) break;
                
            }
            
            return [value,best];
        }
    }

    // Iterative Deepening
    // target time is in seconds
    // Returns: [value,move], move acts as the principal for next iteration
    iterativeDeepening(targetDepth = 10, trueDepthLimit = 100, targetTime = 15) {
        let principal = null;
        let now = new Date().getTime();

        let arr = [,];
        for (let i = 1; i <= targetDepth; i ++) {
            
            let later = new Date().getTime();
            let timeRatio = (this.info.captured > .6 * 69.2) ? .6 : .3;
            if (later - now > timeRatio*targetTime*1000) {
                // if not enough time left, don't go to next ply move
                // console.log('depth ' + i);
                console.log(later - now);
                break;
            }  
            arr = this.alphabeta(i, -Infinity, Infinity, this.info.sideToMove, principal, 100-trueDepthLimit);
            // console.log(arr);
            principal = arr[1]; 
            console.log('nodes searched: ' + this.nodesSearched);
            let latest = new Date().getTime();
            console.log('nodes/s: ' + 1000 * this.nodesSearched / (latest - later));
            this.nodesSearched = 0;
            console.log('depth ' + i)
        }
        
        return arr;
    }

    // More user-friendly functions
    evaluation(targetDepth) {
        return this.iterativeDeepening(targetDepth)[0];
    }

    bestMove(targetDepth) {
        return this.iterativeDeepening(targetDepth)[1];
    }

    // Self game: plays a game against itself at a specified search depth
    selfgame(depth, trueDepthLimit = 100, targetTime = 15) {
        let str = '';
        let i = 0;
        const whiteOpening = whiteBook[Math.floor(Math.random() * whiteBook.length)];
        const blackOpening = blackBook[Math.floor(Math.random() * blackBook.length)];
        while (!this.gameFinished() || this.threefold()) {
            if (i % 10 == 0) this.displayBoard();
            if (i > 800) {
                console.log('forced end');
                break;
            }

            let played, arr;

            if (i % 2 == 0 && i / 2 < whiteOpening.length && this.legalMoves().includes(whiteOpening[i/2])) {
                // white's move, book move is legal
                let cur = this.evaluate();
                played = this.move(whiteOpening[i/2]);
                let newEval = this.alphabeta(1, -Infinity, Infinity, 'white', undefined, 100);
                if (cur - newEval > 1) { 
                    this.undo();
                    arr = this.iterativeDeepening(depth, trueDepthLimit, targetTime);
                    played = this.move(arr[1], undefined, true);
                }
            } else if (i % 2 == 1 && Math.floor(i/2) < blackOpening.length && this.legalMoves().includes(blackOpening[Math.floor(i/2)])){
                // black's move, book move is legal
                let cur = this.evaluate();
                played = this.move(blackOpening[Math.floor(i/2)]);
                let newEval = this.alphabeta(1, -Infinity, Infinity, 'black', undefined, 100);
                if (cur - newEval < -1) { 
                    this.undo();
                    arr = this.iterativeDeepening(depth, trueDepthLimit, targetTime);
                    played = this.move(arr[1], undefined, true);
                }
            } else {
                arr = this.iterativeDeepening(depth, trueDepthLimit, targetTime);
                played = this.move(arr[1], undefined, true);
            }
            
            str += `${played.start}${played.end} `;
            console.log(`${played.start}-${played.end}: ${arr ? arr[0] : 'book'}`);
            i ++;
        }
        if (this.info.fiftyMoves >= 100) console.log(`Fifty moves rule`);
        console.log(str);
        console.log(`${i} ply moves played`);
        return;
    }
}

module.exports = {Engine};
