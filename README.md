# Shatranj Bot

Shatranj is the predecessor to chess and was played in the Sassanian Empire some 1200 years ago. While chess engines have been throughly developed in the past decades, shatranj remains largely unexplored. This project is a rudimentary shatranj bot in node.js that plays at the equivalent of a club level in chess. Created from 09/21-10/21.

I have also separately created a chess bot: https://lichess.org/@/Pulsar64

I would like to thank the shatranj (chaturanga) community on chess.com for helping estimate the strength of the bot.

-------------

<h2>Structure</h2>

The ``shatranj.js`` file contains the **Board** class which provides shatranj functionality. 

The ``evaluation.js`` file contains the **Engine** class which makes the bot work. ``Engine`` is a subclass of ``Board``.

The ``openings_book.js`` file contains an opening book that the bot will follow in an engine game.

<h2>Usage</h2>

* Playing a random game:
```
let engine = new Engine(); 
engine.playRandomGame();
```
* Engine game:
```
let engine = new Engine();
engine.selfgame(4); // search to a depth of 4 ply moves. 
// NB: the bot may run slowly at too high of a search depth. Below 6 is recommended.
```
* Best move:
```
let engine = new Engine();
console.log(engine.bestMove(4));
```
* Evaluation:
```
console.log(engine.evaluation(4));
```
* Making a move:
```
engine.move('e2e3');
```
* Displaying the board in the console:
```
engine.displayBoard();
```
