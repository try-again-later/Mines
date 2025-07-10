import Game from './Game';

const game = new Game();

const newGameButton = document.getElementById('new-game-button') as HTMLButtonElement;
newGameButton.addEventListener('click', () => {
    game.reset();
});
