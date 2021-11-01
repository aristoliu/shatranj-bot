const whiteBook = [
    // Four Pawns (28%)
    ['e2e3','d2d3','c2c3','f2f3'],
    ['e2e3','d2d3','f2f3','c2c3'],
    ['d2d3','e2e3','c2c3','f2f3'],
    ['d2d3','e2e3','f2f3','c2c3'],
    // Colle Structure (21%)
    ['d2d3','e2e3','c2c3','d3d4'],
    ['d2d3','e2e3','d3d4','c2c3'],
    ['d2d3','c2c3','e2e3','d3d4'],
    // Ferz Structure (28%)
    ['e2e3','d2d3','f2f3','e3e4','e1f2','f2e3'],
    ['e2e3','d2d3','e3e4','f2f3','e1f2','f2e3'],
    ['d2d3','e2e3','e3e4','f2f3'],
    ['d2d3','e2e3','f2f3','e3e4'],
    // Defensive Knight (14%)
    ['c2c3','b2b3','b1a3','a3c2'],
    ['f2f3','g2g3','g1h3','h3f2'],
    // Armpit Attack (7%)
    ['h2h3','h3h4','h1h3','h3b3','a2a3','a3a4'],
];

const blackBook = [
    // Four Pawns (40%)
    ['e7e6','d7d6','c7c6','f7f6'],
    ['e7e6','d7d6','f7f6','c7c6'],
    ['d7d6','e7e6','c7c6','f7f6'],
    ['d7d6','e7e6','f7f6','c7c6'],
    ['d7d6','e7e6','c7c6','f7f6'],
    ['d7d6','e7e6','f7f6','c7c6'],
    // Colle Structure (20%)
    ['d7d6','e7e6','c7c6','d6d5'],
    ['d7d6','e7e6','d6d5','c7c6'],
    ['d7d6','c7c6','e7e6','d6d5'],
    // Ferz Structure (27%)
    ['e7e6','d7d6','f7f6','e6e5','e1f7','f7e6'],
    ['e7e6','d7d6','e6e5','f7f6','e1f7','f7e6'],
    ['d7d6','e7e6','e6e5','f7f6'],
    ['d7d6','e7e6','f7f6','e6e5'],
    // Defensive Knight (13%)
    ['c7c6','b7b6','b1a6','a6c7'],
    ['f7f6','g7g6','g1h6','h6f7'],
];

module.exports = {blackBook, whiteBook};

