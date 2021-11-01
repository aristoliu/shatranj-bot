// Board Class:
// Provides functionality for moving pieces
// No evaluation functionality

class Board {
    constructor(id = null) {
        this.id = id;
        this.zobristTable = [[[]]];
        this.initZobrist();

        // bitboards
        this.Boards = {
            white : Board.createEmptyBoard(),
            black : Board.createEmptyBoard(),
            king: Board.createEmptyBoard(),
            ferz: Board.createEmptyBoard(),
            rook: Board.createEmptyBoard(),
            knight: Board.createEmptyBoard(),
            alfil: Board.createEmptyBoard(),
            pawn: Board.createEmptyBoard()
        },

        // additional bitboard:
        // this.occupied;
        // for all occupied squares (white union black)

        // general information
        this.info = {
            sideToMove : 'white',
            fiftyMoves : 0,
            moves: [],
            hashArray: [],
            captured: 0
        }
    }

    static pieceValues = {
        pawn: 1,
        alfil: 1.3,
        ferz: 2,
        knight: 4,
        rook: 6,
        king: 80
    }

    // Zobrist Hashing
    randomString() {
        let arr = new Array(32);
        for (let i = 0; i < 32; i ++) {
            arr[i] = Math.floor(Math.random() * 2);
        }
        return '0b'+arr.join('');
    }
    
    initZobrist() {
        const table = new Array(8);
        for(let i = 0; i < 8; i ++) {
            table[i] = new Array(8);
            for(let j = 0; j < 8; j ++) {
                table[i][j] = new Array(12);
                for(let k = 0; k < 12; k ++) {
                    table[i][j][k] = this.randomString();
                }
            }
        }

        this.zobristTable = table;
        return table;
    }

    hash(){
        const color = {
            white: 0,
            black: 6
        };
        const piece = {
            pawn: 0,
            alfil: 1,
            ferz: 2,
            knight: 3,
            rook: 4,
            king: 5
        }

        let h = 0;

        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                let arr = this.squareContents([i,j]);
                if (!arr) continue;
                let k = color[arr[0]] + piece[arr[1]];
                h = h ^ this.zobristTable[i][j][k];
            }
        }

        return h;
    }

    // gives a text representation of the board
    // @param   invert   whether to flip the output (true: white's perspective)
    displayBoard(invert = true) {
        const arr = Board.createEmptyBoard(8,8,'-')
        const abbrev = {
            'king': 'K',
            'ferz': 'F',
            'rook': 'R',
            'knight': 'N',
            'alfil': 'A',
            'pawn': 'P'
        };

        // updates arr for one type of piece (string)
        let onePiece = (function(piece) {
            for(let i = 0; i < 8; i ++) {
                for (let j = 0; j < 8; j ++) {
                    let occupied = this.Boards[piece][i][j];
                    if (!occupied) continue;
                    if (this.Boards.white[i][j]) {
                        arr[i][j] = abbrev[piece];
                    } else if (this.Boards.black[i][j]) {
                        arr[i][j] = abbrev[piece].toLowerCase();
                    }
                }
            }

        }).bind(this);

        Object.keys(abbrev).forEach(e => onePiece(e));
        if (invert) {
            // invert the output
            for (let i = 0; i < 4; i ++) {
                let temp = arr[i];
                arr[i] = [...arr[7-i]];
                arr[7-i] = [...temp];
            }
        }
        arr.forEach((e,i) => arr[i] = e.join(' '));
        let str = arr.join('\n');

        console.log(str);
        return;
    }

    // Creates and returns an axb array filled with data
    // Default is the bitboard
    // @param   a       number of rows
    // @param   b       number of columns
    // @param   data    text that fills the array
    static createEmptyBoard(a = 8, b = 8, data = 0) {
        const arr = new Array(a);
        for (let i = 0; i < 8; i ++) {
            arr[i] = Array(b).fill(data);
        }
        
        return arr;
    }

    // Bitboard that represents all occupied squares
    get occupied() {
        const arr = Board.createEmptyBoard();
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                arr[i][j] = this.Boards.white[i][j] + this.Boards.black[i][j];
            }
        }

        return arr;
    }

    // Sets side to move
    set sideToMove(side) {
        if (side !== 'white' && side !== 'black') return;
        this.info.sideToMove = side;
    }

    // Updates bitboards with starting position
    startingPosition() {
        this.Boards.white[0].fill(1);
        this.Boards.white[1].fill(1);
        this.Boards.black[6].fill(1);
        this.Boards.black[7].fill(1);
        this.Boards.pawn[1].fill(1);
        this.Boards.pawn[6].fill(1);

        for (let i = 0; i < 8 ; i += 7) {
            this.Boards.king[i][3] = 1;
            this.Boards.ferz[i][4] = 1;
            this.Boards.alfil[i][2] = 1;
            this.Boards.alfil[i][5] = 1;
            this.Boards.knight[i][1] = 1;
            this.Boards.knight[i][6] = 1;
            this.Boards.rook[i][0] = 1;
            this.Boards.rook[i][7] = 1;
        }

        return;
    }

    // Clears all bitboards
    clearBoard() {
        for (let board in this.Boards) {
            this.Boards[board].forEach(e => e.fill(0));
        }
        return;
    }

    // Adds a piece on an unoccupied square
    // @param   color   'white' or 'black'
    // @param   piece   string
    // @param   square  string
    addPiece(color, piece, square) {
        if(this.squareContents(square)) {
            console.log(`Can't override on square ${square}`);
            return;
        }

        const squareC = Board.getCoordinates(square);
        this.Boards[color][squareC[0]][squareC[1]] = 1;
        this.Boards[piece][squareC[0]][squareC[1]] = 1;
        return;
    }

    // Deletes a piece on a square
    // @param   square  string
    deletePiece(square) {
        const squareC = Board.getCoordinates(square);
        for (let board in this.Boards) {
            this.Boards[board][squareC[0]][squareC[1]] = 0;
        }

        return;
    }

    // Changes algebraic notation to array of coordinates
    // @param   square  string (algebraic - a1)
    static getCoordinates(square) {
        const arr = [Number(square[1]) - 1, square.charCodeAt(0) - 97];
        return arr;
    }
    
    // Changes array of coordinates to algebraic notation
    // @param   arr     array with two elements from 0-7
    static getAlgebraic(arr) {
        return `${String.fromCharCode(arr[1]+97)}${arr[0]+1}`;
    }

    // Returns the opposite of the provided color
    // @param   str     'white' or 'black'
    static switchColor(str) {
        if (str === 'white') return 'black';
        return 'white';
    }

    // Returns the Manhattan Distance between two squares
    // @param   sq1     coordinate array or algebraic notation
    // @param   sq2     coordinate array or algebraic notation
    static distance(sq1, sq2) {
        const sq1C = Array.isArray(sq1) ? sq1 : Board.getCoordinates(sq1);
        const sq2C = Array.isArray(sq2) ? sq2 : Board.getCoordinates(sq2);
        return Math.abs(sq1C[0] - sq2C[0]) + Math.abs(sq2C[0] - sq1C[0]);
    }

    // Gets contents of a square
    // @param   square  coordinate array or algebraic notation
    // Returns an array [color,piece] or 0 if empty
    squareContents(square) {
        if (typeof square == 'string') {
            square = Board.getCoordinates(square);
        }

        let rank = square[0];
        let file = square[1];
        if (!this.occupied[rank][file]) return 0;
        const arr = new Array(2);
        if (this.Boards.white[rank][file]) arr[0] = 'white';
        else arr[0] = 'black';

        if (this.Boards.pawn[rank][file]) arr[1] = 'pawn';
        else if (this.Boards.alfil[rank][file]) arr[1] = 'alfil';
        else if (this.Boards.knight[rank][file]) arr[1] = 'knight';
        else if (this.Boards.rook[rank][file]) arr[1] = 'rook';
        else if (this.Boards.king[rank][file]) arr[1] = 'king';
        else arr[1] = 'ferz'

        return arr;
    }

    // MOVE:
    // Changes bitboards, moves array, player to move
    // Returns a move object
    // @param   start       string, algebraic notation of starting square
    //                      alternate: start and end algebraic concatenated
    // @param   end         string, algebraic notation of ending square
    // @param   hashMove    whether to add the position to hash array for threefold detection
    move(start, end = null, hashMove = false) {
        if (!end) {
            end = start.substr(2,2);
            start = start.substr(0,2);
        }

        if (!start) return;

        // change strings to arrays
        const startC = Board.getCoordinates(start);
        const endC = Board.getCoordinates(end)
        const arr = this.squareContents(startC);

        // errors
        if (arr === 0) throw new Error("Empty starting square: " + start);
        if (arr[0] !== this.info.sideToMove) {
            throw new Error(`Wrong player moving: ${arr[0]}: ${start} to ${end}`);
        }

        const capture = this.squareContents(endC); // can be 0 if no capture

        // adjust bitboards
        if (capture !== 0) {
            this.Boards[capture[0]][endC[0]][endC[1]] = 0;
            this.Boards[capture[1]][endC[0]][endC[1]] = 0;
            this.info.captured += Board.pieceValues[capture[1]];
        }

        this.Boards[arr[0]][startC[0]][startC[1]] = 0;
        this.Boards[arr[0]][endC[0]][endC[1]] = 1;
        this.Boards[arr[1]][startC[0]][startC[1]] = 0;
        this.Boards[arr[1]][endC[0]][endC[1]] = 1;


        let promotion = false;
        // Promotion
        if (arr[1] == 'pawn' && (endC[0] == 0 || endC[0] == 7)) {
            promotion = true;
            this.Boards.pawn[endC[0]][endC[1]] = 0;
            this.Boards.ferz[endC[0]][endC[1]] = 1;
        }

        let obj = {
            start: start,
            end: end,
            color: arr[0],
            piece: arr[1],
            captured: (capture[1] || 0),
            promotion: (promotion || 0)
        }

        // Fifty Move Rule adjustments
        if (obj.piece == 'pawn' || obj.captured) {
            obj.fiftyMoves = this.info.fiftyMoves;
            this.info.fiftyMoves = 0;
        } else {
            this.info.fiftyMoves += 1;
        }

        this.info.moves.push(obj);
        if (hashMove) this.info.hashArray.push(this.hash());
        this.info.sideToMove = Board.switchColor(this.info.sideToMove);
        return obj;
    }

    // UNDO:
    // Changes bitboards, moves array, and player to move
    // Returns array of move objects for removed moves
    // @param   num     number of moves to undo
    undo(num = 1) {
        let length = Math.min(this.info.moves.length, num); // max remove whole game
        const arr = [];

        for (let i = 0; i < length; i ++) {
            let obj = this.info.moves.pop();
            let startC = Board.getCoordinates(obj.start);
            let endC = Board.getCoordinates(obj.end);

            // bitboards for moving player
            this.Boards[obj.color][endC[0]][endC[1]] = 0;
            this.Boards[obj.color][startC[0]][startC[1]] = 1;
            this.Boards[obj.piece][endC[0]][endC[1]] = 0;
            this.Boards[obj.piece][startC[0]][startC[1]] = 1;

            // other bitboards to adjust
            if (obj.promotion) this.Boards.ferz[endC[0]][endC[1]] = 0;
            if (obj.captured) {
                this.Boards[obj.captured][endC[0]][endC[1]] = 1;
                this.Boards[Board.switchColor(obj.color)][endC[0]][endC[1]] = 1;
                this.info.captured -= Board.pieceValues[obj.captured];
            }

            // Fifty Moves Rule
            if (obj.fiftyMoves) {
                this.info.fiftyMoves = obj.fiftyMoves;
            } else {
                this.info.fiftyMoves -= 1;
            }

            this.sideToMove = Board.switchColor(this.info.sideToMove);
            arr.push(obj);
        }

        
        return arr;
    }

    // PIECE MOVEMENTS ("pseudolegal moves")
    // Each piece has its own movement function
    // Each movement function allows for several options
    // (1) side to move
    // (2) specific piece (indicated by origin square) or all pieces (false)
    // Returns array of strings in the form "e2e3" -- start-end (this allows for entry into move function)

    // @param   player  'white' or 'black'
    // @param   start   string: starting square of a piece to generate pseudolegal moves, or false
    pawnMoves(player = this.info.sideToMove, start = false) {
        const arr = [];
        if (start) {
            // Single Square move generation
            const startC = Board.getCoordinates(start);
            if (!(this.Boards[player][startC[0]][startC[1]]&this.Boards.pawn[startC[0]][startC[1]])) {
                // not a player pawn on "start"
                return arr;
            }
            const direction = (player == 'white') ? 1 : -1;
            // Pawn move forward
            if (!this.occupied[startC[0]+direction][startC[1]]) {
                arr.push(`${start}${Board.getAlgebraic([startC[0]+direction,startC[1]])}`);
            }
            // Pawn captures
            if (this.Boards[Board.switchColor(player)][startC[0]+direction][startC[1] + 1]) {
                arr.push(`${start}${Board.getAlgebraic([startC[0]+direction,startC[1] + 1])}`);
            }
            if (this.Boards[Board.switchColor(player)][startC[0]+direction][startC[1] - 1]) {
                arr.push(`${start}${Board.getAlgebraic([startC[0]+direction,startC[1] - 1])}`);
            }
            return arr;
        }

        // Generating moves for all pawns
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                if (!(this.Boards[player][i][j] & this.Boards.pawn[i][j])) continue;
                const direction = (player == 'white') ? 1 : -1;
                const start = Board.getAlgebraic([i,j]);
                // Pawn move forward
                if (!this.occupied[i+direction][j]) {
                    arr.push(`${start}${Board.getAlgebraic([i+direction,j])}`);
                }
                // Pawn captures
                if (this.Boards[Board.switchColor(player)][i+direction][j + 1]) {
                    arr.push(`${start}${Board.getAlgebraic([i+direction,j + 1])}`);
                }
                if (this.Boards[Board.switchColor(player)][i+direction][j - 1]) {
                    arr.push(`${start}${Board.getAlgebraic([i+direction,j - 1])}`);
                }
            }
        }
        return arr;
    }

    // Piece Move: Alfil, Knight, Ferz, King
    // pieceType specifies only one type of piece
    // @param   player      'white' or 'black'
    // @param   start       string: starting square of a piece to generate pseudolegal moves, or false
    // @param   pieceType   specific type of piece ('alfil', 'knight',...) or false
    pieceMove(player = this.info.sideToMove, start = false, pieceType = false){
        const arr = [];
        
        // movements array in a 5x5 box
        // alfil = 1, knight = 3, ferz = 2, king = 2 and 4
        const movements = [
            [1,3,0,3,1],
            [3,2,4,2,3],
            [0,4,0,4,0],
            [3,2,4,2,3],
            [1,3,0,3,1]
        ];

        const obj = {
            'alfil' : 1,
            'knight' : 3,
            'ferz' : 2,
            'king': 4
        };

        if (start) {
            // specified starting square
            const startC = Board.getCoordinates(start);
            if (!this.Boards[player][startC[0]][startC[1]]) {
                return arr;
            }
            const pieces = ['alfil', 'knight', 'king', 'ferz', null];
            let piece;
            for (let i = 0; i < 5; i ++) {
                if (!pieces[i]) return arr; // none of the pieces were found (null was reached)
                if (this.Boards[pieces[i]][startC[0]][startC[1]]) {
                    piece = pieces[i];
                    break; // piece found
                }
            }

            let num = obj[piece];
            // Checking the box
            for (let i = 0; i < 5; i ++) {
                let rank = startC[0] + (2-i); // Out of bounds
                if (rank > 7 || rank < 0) continue;
                for (let j = 0; j < 5; j ++) {
                    let file = startC[1] + (j-2); // Out of bounds
                    if (file > 7 || file < 0) continue;
                    if (movements[i][j] == num || (piece == 'king' && movements[i][j] == 2)) {
                        if (this.Boards[player][rank][file]) continue; // occupied by player piece
                        let square = Board.getAlgebraic([rank,file]);
                        arr.push(`${start}${square}`);
                    }
                }
            }
            return arr;
        }

        // if piece is specified, only check for that piece
        // otherwise check for all 4
        const pieces = pieceType ? [pieceType] : ['alfil', 'knight', 'king', 'ferz'];
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                // iterate through the player board
                // if empty square, ignore it
                if (!this.Boards[player][i][j]) continue;
                let piece = null;
                let len = pieces.length;
                for (let k = 0; k < len ; k ++) {
                    // check if its one of the pieces being searched for that occupies the spot
                    if (this.Boards[pieces[k]][i][j]) {
                        piece = pieces[k];
                        break;
                    }
                }
                // different piece found (pawn, rook, eg)
                if (!piece) continue;

                // Piece movements
                let num = obj[piece];
                for (let m = 0; m < 5; m ++) {
                    let rank = i + (2-m); // out of bounds
                    if (rank > 7 || rank < 0) continue;
                    for (let n = 0; n < 5; n ++) { 
                        let file = j + (n-2); // out of bounds
                        if (file > 7 || file < 0) continue;
                        if (movements[m][n] == num || (piece == 'king' && movements[m][n] == 2)) {
                            if (this.Boards[player][rank][file]) continue;
                            let square = Board.getAlgebraic([rank,file]);
                            arr.push(`${Board.getAlgebraic([i,j])}${square}`);
                        }
                    }
                }
            }
        }
        return arr;
    }

    // Rook Move
    // @param   player  'white' or 'black'
    // @param   start   string: starting square of a piece to generate pseudolegal moves, or false
    rookMove(player = this.info.sideToMove, start = false) {
        const arr = [];

        // check a single direction
        // start0, start1 are coordinates
        // vAdj, hAdj are direction
        let checkDirection = (function(start0, start1, vAdj, hAdj) {
            let start = Board.getAlgebraic([start0, start1]);
            for (let i = 1; i < 8; i ++) {
                let rank = start0 + i * vAdj;
                let file = start1 + i * hAdj;
                if (rank > 7 || rank < 0 || file > 7 || file < 0) return; // out of bounds

                let square = Board.getAlgebraic([rank, file]);
                if (this.Boards[player][rank][file]) {
                    break;
                }
                if (this.Boards[Board.switchColor(player)][rank][file]) {
                    arr.push(`${start}${square}`);
                    break;
                }
                arr.push(`${start}${square}`);
            }
            return;
        }).bind(this);

        if (start) {
            const startC = Board.getCoordinates(start);
            if (!(this.Boards[player][startC[0]][startC[1]]&this.Boards.rook[startC[0]][startC[1]])) {
                // throw new Error(`Not a ${player} rook on ${start}.`);
                // console.log(`Not a ${player} rook on ${start}`);
                return arr;
            }

            // check four directions
            // UP
            checkDirection(startC[0], startC[1], 1, 0);

            // DOWN
            checkDirection(startC[0], startC[1], -1, 0);

            // LEFT
            checkDirection(startC[0], startC[1], 0, -1);

            // RIGHT
            checkDirection(startC[0], startC[1], 0, 1);

            return arr;
        }

        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                if(!(this.Boards[player][i][j] & this.Boards.rook[i][j])) continue;
                checkDirection(i, j, 1, 0);
                checkDirection(i, j, -1, 0);
                checkDirection(i, j, 0, 1);
                checkDirection(i, j, 0, -1);
            }
        }

        return arr;
    }

    // ALL MOVES: 
    // combination of three indiv functions 
    // this is the pseudolegal list
    allMoves(player = this.info.sideToMove, start = false) {
        const arr = [];
        if(start) {
            arr.push(...this.pawnMoves(player, start));
            arr.push(...this.pieceMove(player, start));
            arr.push(...this.rookMove(player, start));
            return arr;
        }

        arr.push(...this.pawnMoves(player));
        arr.push(...this.pieceMove(player));
        arr.push(...this.rookMove(player));
        return arr;
    }

    // King attacked
    kingAttacked(player = this.info.sideToMove) {
        // c = coordinate
        
        const c = [];
        // find king square
        for (let i = 0; i < 8; i ++) {            
            for (let j = 0; j < 8; j ++) {
                if (!this.Boards.king[i][j]) continue;
                if (!this.Boards[player][i][j]) continue;
                c.push(i);
                c.push(j);
                break;
            }
            if (c.length === 2) break;
        }
        // no king:
        if (c.length === 0) return;

        // movements:
        // alfil = 1, knight = 3, ferz = 2, king = 4 (also by rook) or 2
        // pawn = 6, also by ferz and king
        // check rook later
        const movement = [
            [1,3,0,3,1],
            [3,2,4,2,3],
            [0,4,0,4,0],
            [3,2,4,2,3],
            [1,3,0,3,1]
        ];

        const obj = {
            alfil: 1,
            knight: 3,
            ferz: 2,
            king: 4,
            pawn: 6
        };

        if (player == 'white') {
            movement[1][1] = 6;
            movement[1][3] = 6;
        } else {
            movement[3][1] = 6;
            movement[3][3] = 6;
        }

        let opp = Board.switchColor(player);

        // piece attacks
        for (let i = 0; i < 5; i ++) {
            for (let j = 0; j < 5; j ++) {
                let num = movement[i][j];

                let rank = c[0] + (2-i);
                let file = c[1] + (j-2);

                if (rank > 7 || file > 7 || rank < 0 || file < 0) continue;
                let occ = this.Boards[opp][rank][file];

                if (!occ) continue;
                switch(num) {
                    case 0:
                        continue;
                    case 1:
                        if (this.Boards.alfil[rank][file]) return true;
                        break;
                    case 2:
                        if (this.Boards.ferz[rank][file] | this.Boards.king[rank][file]) return true;
                        break;
                    case 3: 
                        if (this.Boards.knight[rank][file]) return true;
                        break;
                    case 4:
                        if (this.Boards.king[rank][file] | this.Boards.rook[rank][file]) return true;
                        break;
                    case 6:
                        if (this.Boards.king[rank][file] | this.Boards.ferz[rank][file]
                            | this.Boards.pawn[rank][file]) return true;
                        break;
                    default:
                        continue;
                }
            }
        }

        // rook attacks
        let checkDirection = (function(vAdj, hAdj) {
            for (let i = 1; i < 8; i ++) {
                let rank = c[0] + i * vAdj;
                let file = c[1] + i * hAdj;
                if (rank > 7 || rank < 0 || file > 7 || file < 0) return false; // out of bounds

                if (this.Boards[player][rank][file]) {
                    return false;
                }
                if (this.Boards[Board.switchColor(player)][rank][file]) {
                    if (this.Boards.rook[rank][file]) {
                        return true;
                    }
                    return false;
                }
            }
            return false;
        }).bind(this);

        return checkDirection(1,0) || checkDirection(0,1) || checkDirection(-1,0) || checkDirection(0,-1);
    }

    // LEGAL MOVES
    legalMoves(player = this.info.sideToMove, start = false) {
        const arr = this.allMoves(player, start);
        const legal = [];
        arr.forEach(e => {
            this.move(e);
            if (!this.kingAttacked(player)) legal.push(e);
            this.undo();
        })

        return legal;
    }

    isCheckmated(player = this.info.sideToMove) {
        return (this.legalMoves(player).length === 0 && this.kingAttacked(player));
    }

    isStalemated(player = this.info.sideToMove) {
        return (this.legalMoves(player).length === 0);
    }

    singlePiece(player = this.info.sideToMove) {
        let count = 0;
        for (let i = 0; i < 8; i ++) {
            for (let j = 0; j < 8; j ++) {
                if (this.Boards[player][i][j]) count ++;
            }
        }

        return (count == 1);
    }

    mutualSinglePiece() {
        return this.singlePiece('white') && this.singlePiece('black');
    }

    // checks for threefold repetition on the last move
    threefold() {
        let len = this.info.hashArray.length;
        return (this.info.hashArray.filter(e => e == this.info.hashArray[len - 1]).length >= 3);
    }

    // checks whether the game has finished
    gameFinished() {
        return (this.threefold() || this.isCheckmated() || this.isStalemated() 
        || this.mutualSinglePiece() || this.singlePiece(Board.switchColor(this.info.sideToMove))
        || this.info.fiftyMoves >= 100);
    }

};

module.exports = {Board};
