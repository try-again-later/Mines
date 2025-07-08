import Game from './Game';

const game = new Game();
const buttonElement = document.getElementById('new-game-button');
buttonElement.addEventListener('click', () => {
    game.reset();
});
